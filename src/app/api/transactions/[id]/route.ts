import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { recalculateAccountBalance } from '@/lib/balance';
import { serializeTransaction, validateTransactionInput } from '@/lib/transactions';
import { UpdateTransactionInput } from '@/types/finance';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PUT(req: NextRequest, props: RouteParams) {
  const params = await props.params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;
  const { id } = params;

  const existing = await prisma.transaction.findFirst({ where: { id, userId } });
  if (!existing) {
    return NextResponse.json({ success: false, message: 'Transaction not found' }, { status: 404 });
  }

  const body = (await req.json().catch(() => null)) as Partial<UpdateTransactionInput> | null;
  if (!body) {
    return NextResponse.json({ success: false, message: 'Invalid request body' }, { status: 400 });
  }

  const merged: UpdateTransactionInput = {
    id,
    amount: body.amount ?? Number(existing.amount),
    type: body.type ?? (existing.type as 'INCOME' | 'EXPENSE'),
    category: body.category ?? existing.category,
    description: body.description ?? existing.description,
    date: body.date ?? existing.date.toISOString(),
    accountId: body.accountId ?? existing.accountId,
  };

  const validationError = validateTransactionInput(merged);
  if (validationError) {
    return NextResponse.json({ success: false, message: validationError }, { status: 400 });
  }

  if (merged.accountId && merged.accountId !== existing.accountId) {
    const account = await prisma.account.findFirst({ where: { id: merged.accountId, userId } });
    if (!account) {
      return NextResponse.json({ success: false, message: 'Account not found' }, { status: 404 });
    }
  }

  const updated = await prisma.transaction.update({
    where: { id },
    data: {
      amount: Math.abs(merged.amount!),
      type: merged.type,
      category: merged.category,
      description: merged.description!.trim(),
      date: new Date(merged.date!),
      accountId: merged.accountId,
      isAIClassified: false,
    },
  });

  const affectedAccounts = new Set([existing.accountId, updated.accountId]);
  await Promise.all(Array.from(affectedAccounts).map((accId) => recalculateAccountBalance(accId)));

  return NextResponse.json({ success: true, transaction: serializeTransaction(updated) });
}

export async function DELETE(_req: NextRequest, props: RouteParams) {
  const params = await props.params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;
  const { id } = params;

  const existing = await prisma.transaction.findFirst({ where: { id, userId } });
  if (!existing) {
    return NextResponse.json({ success: false, message: 'Transaction not found' }, { status: 404 });
  }

  await prisma.transaction.delete({ where: { id } });
  await recalculateAccountBalance(existing.accountId);

  return NextResponse.json({ success: true });
}
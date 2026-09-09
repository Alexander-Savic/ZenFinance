import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id: accountId } = await params;

    if (!accountId) {
      return NextResponse.json({ message: 'ID счёта не указан' }, { status: 400 });
    }

    const account = await prisma.account.findFirst({
      where: {
        id: accountId,
        userId: session.user.id,
      },
    });

    if (!account) {
      return NextResponse.json(
        { message: 'Счёт не найден или недоступен' },
        { status: 404 }
      );
    }

    await prisma.transaction.deleteMany({
      where: { accountId },
    });

    await prisma.account.delete({
      where: { id: accountId },
    });

    return NextResponse.json({ success: true, id: accountId });
  } catch (error) {
    console.error('DELETE /api/accounts/[id] error:', error);
    return NextResponse.json(
      { message: 'Не удалось удалить счёт' },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { AccountType } from '@prisma/client';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const accounts = await prisma.account.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({ accounts });
  } catch (error) {
    console.error('GET /api/accounts error:', error);
    return NextResponse.json({ message: 'Failed to fetch accounts' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, type } = body;

    if (!name) {
      return NextResponse.json({ message: 'Name is required' }, { status: 400 });
    }

    const validTypes = Object.values(AccountType);
    const matchedType = validTypes.find(
      (t) => String(t).toLowerCase() === String(type).toLowerCase()
    );
    const finalType = matchedType || validTypes[0];

    const newAccount = await prisma.account.create({
      data: {
        name,
        type: finalType,
        userId: session.user.id,
      },
    });

    return NextResponse.json(newAccount, { status: 201 });
  } catch (error) {
    console.error('POST /api/accounts error:', error);
    return NextResponse.json({ message: 'Failed to create account' }, { status: 500 });
  }
}
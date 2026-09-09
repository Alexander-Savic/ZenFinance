import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '10', 10);
    const category = searchParams.get('category');
    const accountId = searchParams.get('accountId');

    const skip = (page - 1) * pageSize;

    const where: any = {
      userId: session.user.id,
    };

    if (category) {
      where.category = category;
    }

    if (accountId) {
      where.accountId = accountId;
    }

    const [transactions, totalCount] = await Promise.all([
      prisma.transaction.findMany({
        where,
        orderBy: { date: 'desc' },
        skip,
        take: pageSize,
        include: {
          account: {
            select: { name: true, type: true },
          },
        },
      }),
      prisma.transaction.count({ where }),
    ]);

    return NextResponse.json({
      transactions,
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
      },
    });
  } catch (error) {
    console.error('GET /api/transactions error:', error);
    return NextResponse.json({ message: 'Failed to fetch transactions' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { amount, type, category, description, accountId } = body;

    if (!amount || !category) {
      return NextResponse.json(
        { message: 'Заполните обязательные поля' },
        { status: 400 }
      );
    }

    const numAmount = parseFloat(amount);
    const isIncome = type === 'INCOME';

    // Внимание: передаём пустую строку "", если description не заполнен, так как Prisma не принимает null
    const transactionData: any = {
      amount: numAmount,
      type: isIncome ? 'INCOME' : 'EXPENSE',
      category,
      description: description || '', 
      date: new Date(),
      user: {
        connect: { id: session.user.id },
      },
    };

    if (accountId) {
      transactionData.account = {
        connect: { id: accountId },
      };
    }

    const operations: any[] = [
      prisma.transaction.create({
        data: transactionData,
      }),
    ];

    if (accountId) {
      operations.push(
        prisma.account.update({
          where: { id: accountId },
          data: {
            balance: {
              [isIncome ? 'increment' : 'decrement']: numAmount,
            },
          },
        })
      );
    }

    const [transaction] = await prisma.$transaction(operations);

    return NextResponse.json(transaction, { status: 201 });
  } catch (error) {
    console.error('POST /api/transactions error:', error);
    return NextResponse.json(
      { message: 'Не удалось создать транзакцию' },
      { status: 500 }
    );
  }
}
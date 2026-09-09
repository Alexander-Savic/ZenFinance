import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET: Получение настроек и данных текущего пользователя
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        currency: true,
        transactionsPerPage: true,
        createdAt: true, // Добавлено поле даты создания
      },
    });

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // Подсчитываем реальное количество привязанных счетов
    const linkedAccounts = await prisma.account.count({
      where: { userId: session.user.id },
    });

    return NextResponse.json({
      id: user.id,
      name: user.name || '',
      email: user.email || '',
      currency: user.currency || 'BYN',
      transactionsPerPage: user.transactionsPerPage ?? 10,
      createdAt: user.createdAt ? user.createdAt.toISOString() : new Date().toISOString(),
      linkedAccounts,
    });
  } catch (error) {
    console.error('GET /api/user/settings error:', error);
    return NextResponse.json(
      { message: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

// PUT: Обновление настроек пользователя
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, currency, transactionsPerPage } = body;

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        ...(name !== undefined && { name }),
        ...(currency !== undefined && { currency }),
        ...(transactionsPerPage !== undefined && { transactionsPerPage: Number(transactionsPerPage) }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        currency: true,
        transactionsPerPage: true,
        createdAt: true,
      },
    });

    const linkedAccounts = await prisma.account.count({
      where: { userId: session.user.id },
    });

    return NextResponse.json({
      id: updatedUser.id,
      name: updatedUser.name || '',
      email: updatedUser.email || '',
      currency: updatedUser.currency || 'BYN',
      transactionsPerPage: updatedUser.transactionsPerPage ?? 10,
      createdAt: updatedUser.createdAt ? updatedUser.createdAt.toISOString() : new Date().toISOString(),
      linkedAccounts,
    });
  } catch (error) {
    console.error('PUT /api/user/settings error:', error);
    return NextResponse.json(
      { message: 'Failed to update settings' },
      { status: 500 }
    );
  }
}
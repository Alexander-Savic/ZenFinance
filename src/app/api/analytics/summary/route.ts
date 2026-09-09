import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const months = parseInt(searchParams.get('months') || '6', 10);
    const accountId = searchParams.get('accountId');

    const whereCondition: any = {
      userId: session.user.id,
    };

    if (accountId && accountId !== 'null' && accountId !== 'undefined') {
      whereCondition.accountId = accountId;
    }

    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);
    startDate.setHours(0, 0, 0, 0);

    whereCondition.date = {
      gte: startDate,
    };

    const transactions = await prisma.transaction.findMany({
      where: whereCondition,
      orderBy: { date: 'asc' },
    });

    let totalIncome = 0;
    let totalExpense = 0;

    const categoryTotals: Record<string, number> = {};
    const monthlyMap: Record<string, { income: number; expense: number }> = {};

    for (let i = months - 1; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const monthLabel = d.toLocaleString('ru-RU', { month: 'short' });
      const formattedLabel = monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1);
      monthlyMap[formattedLabel] = { income: 0, expense: 0 };
    }

    transactions.forEach((tx) => {
      const amount = Number(tx.amount) || 0;
      const txMonth = new Date(tx.date).toLocaleString('ru-RU', { month: 'short' });
      const formattedMonth = txMonth.charAt(0).toUpperCase() + txMonth.slice(1);

      if (tx.type === 'INCOME') {
        totalIncome += amount;
        if (monthlyMap[formattedMonth]) {
          monthlyMap[formattedMonth].income += amount;
        }
      } else if (tx.type === 'EXPENSE') {
        totalExpense += amount;
        if (monthlyMap[formattedMonth]) {
          monthlyMap[formattedMonth].expense += amount;
        }

        const cat = tx.category || 'Прочее';
        categoryTotals[cat] = (categoryTotals[cat] || 0) + amount;
      }
    });

    const categoryBreakdown = Object.entries(categoryTotals).map(([name, value]) => ({
      name,
      value: Math.round(value * 100) / 100,
    }));

    const monthlyTrend = Object.entries(monthlyMap).map(([month, data]) => ({
      month,
      income: Math.round(data.income * 100) / 100,
      expense: Math.round(data.expense * 100) / 100,
    }));

    const netSavings = totalIncome - totalExpense;

    return NextResponse.json({
      totalIncome: Math.round(totalIncome * 100) / 100,
      totalExpense: Math.round(totalExpense * 100) / 100,
      netSavings: Math.round(netSavings * 100) / 100,
      categoryBreakdown,
      monthlyTrend,
    });
  } catch (error) {
    console.error('GET /api/analytics/summary error:', error);
    return NextResponse.json(
      { message: 'Не удалось получить сводную аналитику' },
      { status: 500 }
    );
  }
}
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

    // 1. Формируем фильтр запроса
    const whereCondition: any = {
      userId: session.user.id,
    };

    // Если передан accountId и это не строка "null" / "undefined"
    if (accountId && accountId !== 'null' && accountId !== 'undefined') {
      whereCondition.accountId = accountId;
    }

    // 2. Вычисляем дату начала периода (N месяцев назад)
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);
    startDate.setHours(0, 0, 0, 0);

    whereCondition.date = {
      gte: startDate,
    };

    // 3. Получаем все транзакции за указанный период
    const transactions = await prisma.transaction.findMany({
      where: whereCondition,
      orderBy: { date: 'asc' },
    });

    // 4. Считаем общие суммы доходов и расходов
    let totalIncome = 0;
    let totalExpense = 0;

    // Структуры для графиков
    const categoryTotals: Record<string, number> = {};
    const monthlyMap: Record<string, { income: number; expense: number }> = {};

    // Инициализируем последние N месяцев в тренде (чтобы на графике были даже пустые месяцы)
    for (let i = months - 1; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const monthLabel = d.toLocaleString('ru-RU', { month: 'short' });
      const formattedLabel = monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1);
      monthlyMap[formattedLabel] = { income: 0, expense: 0 };
    }

    // 5. Обрабатываем транзакции
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

        // Группировка расходов по категориям для круговой диаграммы (Donut Chart)
        const cat = tx.category || 'Прочее';
        categoryTotals[cat] = (categoryTotals[cat] || 0) + amount;
      }
    });

    // 6. Форматируем данные для круговой диаграммы расходов
    const categoryBreakdown = Object.entries(categoryTotals).map(([name, value]) => ({
      name,
      value: Math.round(value * 100) / 100,
    }));

    // 7. Форматируем данные для графика денежного потока (Area Chart)
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
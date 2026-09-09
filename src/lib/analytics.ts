import { prisma } from './prisma';
import { AnalyticsSummary } from '../types/finance';

export async function computeAnalyticsSummary(
  userId: string,
  months = 6,
  accountId?: string | null
): Promise<AnalyticsSummary> {
  const since = new Date();
  since.setMonth(since.getMonth() - months);
  since.setDate(1);
  since.setHours(0, 0, 0, 0);

  const whereCondition: any = {
    userId,
    date: { gte: since },
  };

  if (accountId) {
    whereCondition.accountId = accountId;
  }

  const transactions = await prisma.transaction.findMany({
    where: whereCondition,
    select: { amount: true, type: true, category: true, date: true, accountId: true },
  });

  const byCategory = new Map<string, number>();
  const byMonth = new Map<string, { income: number; expense: number }>();

  for (const tx of transactions) {
    const amount = Number(tx.amount);
    const monthKey = `${tx.date.getFullYear()}-${String(tx.date.getMonth() + 1).padStart(2, '0')}`;

    if (!byMonth.has(monthKey)) byMonth.set(monthKey, { income: 0, expense: 0 });
    const bucket = byMonth.get(monthKey)!;

    if (tx.type === 'EXPENSE') {
      bucket.expense += amount;
      const cat = tx.category || 'Прочее';
      byCategory.set(cat, (byCategory.get(cat) ?? 0) + amount);
    } else {
      bucket.income += amount;
    }
  }

  const categoryBreakdown = Array.from(byCategory.entries())
    .map(([category, total]) => ({
      name: category,
      category,
      value: Math.round(total * 100) / 100,
      total: Math.round(total * 100) / 100,
    }))
    .sort((a, b) => b.value - a.value);

  const monthlyTrend = Array.from(byMonth.entries())
    .map(([month, v]) => ({
      month,
      income: Math.round(v.income * 100) / 100,
      expense: Math.round(v.expense * 100) / 100,
      net: Math.round((v.income - v.expense) * 100) / 100,
    }))
    .sort((a, b) => a.month.localeCompare(b.month));

  const totalIncome = monthlyTrend.reduce((s, m) => s + m.income, 0);
  const totalExpense = monthlyTrend.reduce((s, m) => s + m.expense, 0);

  return {
    totalIncome: Math.round(totalIncome * 100) / 100,
    totalExpense: Math.round(totalExpense * 100) / 100,
    netSavings: Math.round((totalIncome - totalExpense) * 100) / 100,
    categoryBreakdown: categoryBreakdown as any,
    monthlyTrend,
  };
}
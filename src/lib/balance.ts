import { prisma } from './prisma';

export async function recalculateAccountBalance(accountId: string): Promise<void> {
  const aggregates = await prisma.transaction.groupBy({
    by: ['type'],
    where: { accountId },
    _sum: { amount: true },
  });

  const income = Number(aggregates.find((a) => a.type === 'INCOME')?._sum.amount ?? 0);
  const expense = Number(aggregates.find((a) => a.type === 'EXPENSE')?._sum.amount ?? 0);

  await prisma.account.update({
    where: { id: accountId },
    data: { balance: income - expense },
  });
}
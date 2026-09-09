import { prisma } from './prisma';
import { Account } from '@prisma/client';

export async function getOrCreateDefaultAccount(userId: string): Promise<Account> {
  const existing = await prisma.account.findFirst({
    where: { userId },
    orderBy: { createdAt: 'asc' },
  });

  if (existing) return existing;

  return prisma.account.create({
    data: {
      userId,
      name: 'Main Account',
      type: 'CASH',
      balance: 0,
      currency: 'USD',
    },
  });
}
import { Prisma } from '@prisma/client';
import { CreateTransactionInput, TransactionDto } from '../types/finance';

export function serializeTransaction(tx: {
  id: string;
  accountId: string;
  amount: Prisma.Decimal | number;
  type: string;
  category: string;
  description: string;
  date: Date;
  isAIClassified: boolean;
  createdAt: Date;
}): TransactionDto {
  return {
    id: tx.id,
    accountId: tx.accountId,
    amount: Number(tx.amount),
    type: tx.type as TransactionDto['type'],
    category: tx.category,
    description: tx.description,
    date: tx.date.toISOString(),
    isAIClassified: tx.isAIClassified,
    createdAt: tx.createdAt.toISOString(),
  };
}

export function validateTransactionInput(body: Partial<CreateTransactionInput>): string | null {
  if (typeof body.amount !== 'number' || Number.isNaN(body.amount) || body.amount <= 0) {
    return 'Amount must be a positive number';
  }
  if (body.type !== 'INCOME' && body.type !== 'EXPENSE') {
    return 'Type must be INCOME or EXPENSE';
  }
  if (!body.category || typeof body.category !== 'string') {
    return 'Category is required';
  }
  if (!body.description || typeof body.description !== 'string' || !body.description.trim()) {
    return 'Description is required';
  }
  if (!body.date || Number.isNaN(new Date(body.date).getTime())) {
    return 'A valid date is required';
  }
  return null;
}
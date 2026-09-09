export type TransactionKind = 'INCOME' | 'EXPENSE';

export interface TransactionDto {
  id: string;
  accountId: string;
  amount: number;
  type: TransactionKind;
  category: string;
  description: string;
  date: string;
  isAIClassified: boolean;
  createdAt: string;
}

export interface CreateTransactionInput {
  amount: number;
  type: TransactionKind;
  category: string;
  description: string;
  date: string;
  accountId?: string;
}

export interface UpdateTransactionInput extends Partial<CreateTransactionInput> {
  id: string;
}

export interface TransactionsListResponse {
  items: TransactionDto[];
  total: number;
  page: number;
  pageSize: number;
}

export interface AnalyticsSummary {
  totalIncome: number;
  totalExpense: number;
  netSavings: number;
  categoryBreakdown: { category: string; total: number }[];
  monthlyTrend: { month: string; income: number; expense: number; net: number }[];
}

export interface AdvisorTip {
  id: string;
  title: string;
  detail: string;
  severity: 'info' | 'warning' | 'positive';
}

export interface AdvisorResponse {
  tips: AdvisorTip[];
  generatedAt: string;
}

export const CATEGORIES = [
  'Food',
  'Transport',
  'Utilities',
  'Housing',
  'Entertainment',
  'Shopping',
  'Health',
  'Travel',
  'Subscriptions',
  'Income',
  'Transfer',
  'Fees',
  'Education',
  'Other',
] as const;

export type Category = (typeof CATEGORIES)[number];

export const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'BYN', symbol: 'Br', name: 'Belarusian Ruble' },
  { code: 'RUB', symbol: '₽', name: 'Russian Ruble' },
  { code: 'KZT', symbol: '₸', name: 'Kazakh Tenge' },
] as const;

export type CurrencyCode = (typeof CURRENCIES)[number]['code'];
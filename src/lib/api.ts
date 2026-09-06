export interface AnalyticsSummary {
  totalIncome: number;
  totalExpense: number;
  netSavings: number;
  categoryBreakdown: { category: string; total: number }[];
  monthlyTrend: { month: string; income: number; expense: number; net: number }[];
}

export interface TransactionItem {
  id: string;
  amount: string;
  type: 'INCOME' | 'EXPENSE';
  category: string;
  description: string;
  date: string;
  isAIClassified: boolean;
  accountId: string;
}

export interface TransactionsPage {
  items: TransactionItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Универсальная функция для отправки сетевых запросов к Next.js API
async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(path, options);
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json();
}

export const api = {
  // 1. Получение данных для графиков и Bento-карточек
  getSummary: (months = 6) => 
    request<AnalyticsSummary>(`/api/analytics/summary?months=${months}`),
    
  // 2. Получение списка транзакций для таблицы с фильтрами и пагинацией
  getTransactions: (params: { category?: string; accountId?: string; page?: number; pageSize?: number }) => {
    const qs = new URLSearchParams();
    if (params.category) qs.set('category', params.category);
    if (params.accountId) qs.set('accountId', params.accountId);
    qs.set('page', String(params.page ?? 1));
    qs.set('pageSize', String(params.pageSize ?? 10));
    return request<TransactionsPage>(`/api/transactions?${qs.toString()}`);
  },
  
  // 3. Отправка .csv или .xlsx файла в ИИ-разметчик на бэкенд
  importFile: async (file: File) => {
    const form = new FormData();
    form.append('file', file);
    
    const res = await fetch(`/api/transactions/import`, {
      method: 'POST',
      body: form,
    });
    if (!res.ok) throw new Error('Import failed');
    return res.json();
  },
};

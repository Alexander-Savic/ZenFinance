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

export interface ImportResponse {
  success: boolean;
  importedCount: number;
  message?: string;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(path, options);

  if (!res.ok) {
    if (res.status === 401 && typeof window !== 'undefined') {
      window.location.href = '/login';
    }

    const errorData = await res.json().catch(() => null);
    const errorMessage = errorData?.message || errorData?.error || `Request failed with status ${res.status}`;
    
    throw new Error(errorMessage);
  }

  return res.json();
}

export const api = {
  getSummary: (months = 6) => 
    request<AnalyticsSummary>(`/api/analytics/summary?months=${months}`),
    
  getTransactions: (params: { category?: string; accountId?: string; page?: number; pageSize?: number }) => {
    const qs = new URLSearchParams();
    if (params.category) qs.set('category', params.category);
    if (params.accountId) qs.set('accountId', params.accountId);
    qs.set('page', String(params.page ?? 1));
    qs.set('pageSize', String(params.pageSize ?? 10));
    return request<TransactionsPage>(`/api/transactions?${qs.toString()}`);
  },
  
  importFile: async (file: File): Promise<ImportResponse> => {
    const form = new FormData();
    form.append('file', file);
    
    return request<ImportResponse>(`/api/transactions/import`, {
      method: 'POST',
      body: form,
    });
  },
};
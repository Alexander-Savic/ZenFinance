import {
  AnalyticsSummary,
  TransactionsListResponse,
  CreateTransactionInput,
  UpdateTransactionInput,
  AdvisorResponse,
  TransactionDto,
} from '@/types/finance';

export type TransactionItem = TransactionDto;
export type TransactionsPage = TransactionsListResponse;
export type { AnalyticsSummary };

export interface UserSettingsResponse {
  id: string;
  email: string;
  name: string | null;
  currency: string;
  transactionsPerPage: number;
  createdAt: string;
  linkedAccounts: number;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const isFormData = options?.body instanceof FormData;

  const headers: HeadersInit = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(options?.headers || {}),
  };

  const res = await fetch(path, {
    credentials: 'include',
    ...options,
    headers,
  });

  if (!res.ok) {
    if (res.status === 401 && typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    const errorBody = await res.json().catch(() => null);
    throw new Error(errorBody?.message ?? `Request failed: ${res.status}`);
  }

  return res.json();
} 

export const api = {
  getSummary: (months = 6, accountId?: string | null) => {
    const qs = new URLSearchParams({ months: String(months) });
    if (accountId) {
      qs.set('accountId', accountId);
    }
    return request<AnalyticsSummary>(`/api/analytics/summary?${qs.toString()}`);
  },

  getAdvice: () => request<AdvisorResponse>('/api/ai/advisor'),

  getSettings: () => request<UserSettingsResponse>('/api/user/settings'),

  updateSettings: (data: Partial<UserSettingsResponse>) =>
    request<UserSettingsResponse>('/api/user/settings', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  getTransactions: (params: { category?: string; accountId?: string | null; page?: number; pageSize?: number }) => {
    const qs = new URLSearchParams();
    if (params.category) qs.set('category', params.category);
    if (params.accountId) qs.set('accountId', params.accountId);
    qs.set('page', String(params.page ?? 1));
    qs.set('pageSize', String(params.pageSize ?? 10));
    return request<TransactionsListResponse>(`/api/transactions?${qs.toString()}`);
  },

  createTransaction: (input: CreateTransactionInput) =>
    request<TransactionDto>('/api/transactions', {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  updateTransaction: (input: UpdateTransactionInput) =>
    request<{ success: boolean; transaction: TransactionDto }>(`/api/transactions/${input.id}`, {
      method: 'PUT',
      body: JSON.stringify(input),
    }),

  deleteTransaction: (id: string) =>
    request<{ success: boolean }>(`/api/transactions/${id}`, { 
      method: 'DELETE' 
    }),

  importFile: async (file: File, accountId?: string) => {
    const form = new FormData();
    if (accountId) form.append('accountId', accountId);
    form.append('file', file);
    return request<{ success: boolean; totalImported: number; aiClassifiedCount: number }>(
      '/api/transactions/import',
      {
        method: 'POST',
        body: form,
      }
    );
  },

  deleteAccount: (id: string) =>
    request<{ success: boolean; id: string }>(`/api/accounts/${id}`, {
      method: 'DELETE',
    }),
};
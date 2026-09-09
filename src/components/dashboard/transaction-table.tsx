'use client';

import { useEffect, useState, useCallback } from 'react';
import { Trash2 } from 'lucide-react';

interface Transaction {
  id: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  category: string;
  description?: string;
  date: string;
  account?: {
    name: string;
    type: string;
  };
}

interface TransactionTableProps {
  accountId?: string | null;
  onMutated?: () => void;
  currency?: string;
}

export function TransactionTable({ accountId, onMutated, currency = 'BYN' }: TransactionTableProps) {
  const [items, setItems] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: '10',
      });

      if (accountId) {
        params.append('accountId', accountId);
      }

      const res = await fetch(`/api/transactions?${params.toString()}`);
      if (!res.ok) {
        throw new Error(`Request failed: ${res.status}`);
      }

      const data = await res.json();
      const list = Array.isArray(data) ? data : data.transactions || [];
      setItems(list);

      if (data.pagination) {
        setTotalPages(data.pagination.totalPages || 1);
      }
    } catch (err: any) {
      console.error('Failed to load transactions:', err);
      setError('Не удалось загрузить транзакции');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [page, accountId]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  useEffect(() => {
    setPage(1);
  }, [accountId]);

  const handleDelete = async (id: string) => {
    if (!confirm('Вы уверены, что хотите удалить эту транзакцию?')) return;

    setDeletingId(id);
    try {
      const res = await fetch(`/api/transactions/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        fetchTransactions();
        if (onMutated) onMutated();
      } else {
        alert('Не удалось удалить транзакцию');
      }
    } catch (err) {
      console.error('Failed to delete transaction:', err);
      alert('Ошибка при удалении');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="w-full space-y-4">
      <div className="overflow-x-auto rounded-xl border border-white/5 bg-zinc-900/20">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-white/10 bg-zinc-900/80 text-zinc-400">
            <tr>
              <th className="px-4 py-3 font-medium">Дата</th>
              <th className="px-4 py-3 font-medium">Категория</th>
              <th className="px-4 py-3 font-medium">Счёт</th>
              <th className="px-4 py-3 font-medium">Описание</th>
              <th className="px-4 py-3 font-medium text-right">Сумма</th>
              <th className="px-4 py-3 font-medium text-center w-12">Действия</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-zinc-300">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td colSpan={6} className="px-4 py-3">
                    <div className="h-4 w-full rounded bg-white/5" />
                  </td>
                </tr>
              ))
            ) : error ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-rose-400">
                  {error}
                </td>
              </tr>
            ) : items && items.length > 0 ? (
              items.map((tx) => {
                const isIncome = tx.type === 'INCOME';
                return (
                  <tr key={tx.id} className="transition-colors hover:bg-white/[0.02]">
                    <td className="px-4 py-3 whitespace-nowrap text-zinc-400">
                      {new Date(tx.date).toLocaleDateString('ru-RU')}
                    </td>
                    <td className="px-4 py-3 font-medium text-white">{tx.category}</td>
                    <td className="px-4 py-3 text-zinc-400">
                      {tx.account?.name || '—'}
                    </td>
                    <td className="px-4 py-3 text-zinc-400 max-w-xs truncate">
                      {tx.description || '—'}
                    </td>
                    <td
                      className={`px-4 py-3 text-right font-mono font-medium whitespace-nowrap ${
                        isIncome ? 'text-emerald-400' : 'text-zinc-200'
                      }`}
                    >
                      {isIncome ? '+' : '-'}
                      {Number(tx.amount).toLocaleString('ru-RU', { minimumFractionDigits: 2 })}{' '}
                      {currency}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleDelete(tx.id)}
                        disabled={deletingId === tx.id}
                        className="rounded-lg p-1.5 text-zinc-500 transition-colors hover:bg-rose-500/10 hover:text-rose-400 disabled:opacity-30"
                        title="Удалить"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-zinc-500">
                  Транзакции не найдены
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-end gap-2 pt-2 text-xs">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1 || loading}
            className="rounded-lg border border-white/10 bg-zinc-900 px-3 py-1.5 text-zinc-300 disabled:opacity-40 hover:bg-zinc-800"
          >
            Назад
          </button>
          <span className="text-zinc-400">
            {page} из {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages || loading}
            className="rounded-lg border border-white/10 bg-zinc-900 px-3 py-1.5 text-zinc-300 disabled:opacity-40 hover:bg-zinc-800"
          >
            Вперёд
          </button>
        </div>
      )}
    </div>
  );
}
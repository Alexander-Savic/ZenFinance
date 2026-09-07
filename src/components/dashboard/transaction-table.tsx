'use client';

import { useEffect, useState } from 'react';
import { Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import { api, TransactionItem } from '@/lib/api';
import { cn, formatCurrency, categoryColor } from '@/lib/utils';

const CATEGORIES = [
  'All',
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
];

export function TransactionTable() {
  const [items, setItems] = useState<TransactionItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const pageSize = 10;

  useEffect(() => {
    setLoading(true);
    api
      .getTransactions({
        page,
        pageSize,
        category: category === 'All' ? undefined : category,
      })
      .then((res) => {
        setItems(res.items);
        setTotal(res.total);
      })
      .catch((err) => console.error("Failed to load transactions", err))
      .finally(() => setLoading(false));
  }, [page, category]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-900/40 backdrop-blur-xl">
      <div className="flex items-center justify-between border-b border-white/10 p-4">
        <h3 className="text-sm font-medium text-zinc-200">Recent Transactions</h3>
        <select
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-white/10 bg-zinc-800/60 px-3 py-1.5 text-xs text-zinc-300 outline-none focus:border-white/20 cursor-pointer"
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c} className="bg-zinc-900 text-zinc-300">
              {c}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/5 text-left text-xs uppercase tracking-wider text-zinc-500">
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Description</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 text-right font-medium">Amount</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-white/5">
                  <td className="px-4 py-4" colSpan={4}>
                    <div className="h-4 w-full animate-pulse rounded bg-white/5" />
                  </td>
                </tr>
              ))
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-zinc-500">
                  No transactions found
                </td>
              </tr>
            ) : (
              items.map((tx) => (
                <tr
                  key={tx.id}
                  className="border-b border-white/5 transition-colors hover:bg-white/[0.03]"
                >
                  <td className="px-4 py-3 text-zinc-400">
                    {new Date(tx.date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </td>
                  <td className="px-4 py-3 text-zinc-200">
                    <div className="flex items-center gap-2">
                      <span className="max-w-[220px] truncate" title={tx.description}>{tx.description}</span>
                      {tx.isAIClassified && (
                        <span
                          title="Auto-classified by AI"
                          className="inline-flex items-center gap-1 rounded-full bg-violet-500/10 px-2 py-0.5 text-[10px] font-medium text-violet-300 ring-1 ring-violet-500/20"
                        >
                          <Sparkles className="h-3 w-3" />
                          AI
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
                      style={{
                        backgroundColor: `${categoryColor(tx.category)}1a`,
                        color: categoryColor(tx.category),
                      }}
                    >
                      {tx.category}
                    </span>
                  </td>
                  <td
                    className={cn(
                      'px-4 py-3 text-right font-medium',
                      tx.type === 'INCOME' ? 'text-emerald-400' : 'text-zinc-200',
                    )}
                  >
                    {tx.type === 'INCOME' ? '+' : '-'}
                    {formatCurrency(Math.abs(Number(tx.amount)))}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between border-t border-white/10 p-4 text-xs text-zinc-500">
        <span>
          Page {page} of {totalPages} · {total} transactions
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded-lg border border-white/10 p-1.5 disabled:opacity-30 transition-opacity enabled:hover:bg-white/5"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="rounded-lg border border-white/10 p-1.5 disabled:opacity-30 transition-opacity enabled:hover:bg-white/5"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface Account {
  id: string;
  name: string;
}

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  selectedAccountId?: string | null;
}

export function AddTransactionModal({
  isOpen,
  onClose,
  onSuccess,
  selectedAccountId,
}: AddTransactionModalProps) {
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'INCOME' | 'EXPENSE'>('EXPENSE');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accountId, setAccountId] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetch('/api/accounts')
        .then((res) => res.json())
        .then((data) => {
          const accs = data.accounts || data || [];
          setAccounts(accs);

          if (selectedAccountId) {
            setAccountId(selectedAccountId);
          } else if (accs.length > 0) {
            setAccountId(accs[0].id);
          }
        })
        .catch((e) => console.error('Error fetching accounts:', e));
    }
  }, [isOpen, selectedAccountId]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !category || !accountId) return;

    setLoading(true);
    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(amount),
          type,
          category,
          description,
          accountId,
        }),
      });

      if (res.ok) {
        setAmount('');
        setCategory('');
        setDescription('');
        onSuccess();
        onClose();
      }
    } catch (err) {
      console.error('Failed to add transaction:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-zinc-900 p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-white">Новая транзакция</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-zinc-950 border border-white/5">
            <button
              type="button"
              onClick={() => setType('EXPENSE')}
              className={`py-1.5 text-xs font-medium rounded-lg transition-colors ${
                type === 'EXPENSE' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'text-zinc-400'
              }`}
            >
              Расход
            </button>
            <button
              type="button"
              onClick={() => setType('INCOME')}
              className={`py-1.5 text-xs font-medium rounded-lg transition-colors ${
                type === 'INCOME' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-zinc-400'
              }`}
            >
              Доход
            </button>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">Сумма</label>
            <input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-zinc-950 px-3.5 py-2 text-sm text-white focus:outline-none focus:border-violet-500"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-400">Счёт</label>
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-zinc-950 px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500"
              required
            >
              <option value="" disabled>Выберите счёт</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">Категория</label>
            <input
              type="text"
              placeholder="Продукты, Кафе, Зарплата..."
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-zinc-950 px-3.5 py-2 text-sm text-white focus:outline-none focus:border-violet-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">Описание (необязательно)</label>
            <input
              type="text"
              placeholder="Заметки..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-zinc-950 px-3.5 py-2 text-sm text-white focus:outline-none focus:border-violet-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !accountId}
            className="w-full rounded-xl bg-violet-600 py-2.5 text-sm font-medium text-white transition-colors hover:bg-violet-500 disabled:opacity-50"
          >
            {loading ? 'Сохранение...' : 'Добавить'}
          </button>
        </form>
      </div>
    </div>
  );
}
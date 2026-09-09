'use client';

import { useState, useEffect } from 'react';
import { Wallet, Plus, CreditCard, Banknote, Check, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';

export interface Account {
  id: string;
  name: string;
  type: string;
  balance?: number;
}

interface AccountSelectorProps {
  selectedAccountId?: string | null;
  onSelectAccount?: (accountId: string | null) => void;
  userCurrency?: string;
}

export function AccountSelector({
  selectedAccountId,
  onSelectAccount,
  userCurrency = 'BYN',
}: AccountSelectorProps) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newAccountName, setNewAccountName] = useState('');
  const [newAccountType, setNewAccountType] = useState('card');
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchAccounts = async () => {
    try {
      const res = await fetch('/api/accounts');
      if (res.ok) {
        const data = await res.json();
        setAccounts(data.accounts || data || []);
      }
    } catch (e) {
      console.error('Failed to load accounts', e);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccountName.trim()) return;

    setLoading(true);
    try {
      const res = await fetch('/api/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newAccountName, type: newAccountType }),
      });

      if (res.ok) {
        setNewAccountName('');
        setIsAdding(false);
        fetchAccounts();
      }
    } catch (e) {
      console.error('Failed to create account', e);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async (e: React.MouseEvent, accountId: string, accountName: string) => {
    e.stopPropagation();

    if (!confirm(`Вы действительно хотите удалить счёт «${accountName}» и связанные с ним транзакции?`)) {
      return;
    }

    setDeletingId(accountId);
    try {
      await api.deleteAccount(accountId);

      if (selectedAccountId === accountId && onSelectAccount) {
        onSelectAccount(null);
      }

      fetchAccounts();
    } catch (err) {
      console.error('Failed to delete account:', err);
      alert('Не удалось удалить счёт');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-900/40 p-5 backdrop-blur-xl space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wallet className="h-5 w-5 text-violet-400" />
          <h3 className="text-sm font-medium text-zinc-200">Мои Счета</h3>
        </div>

        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-zinc-800/60 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors cursor-pointer"
        >
          <Plus className="h-3.5 w-3.5" />
          {isAdding ? 'Отмена' : 'Добавить счет'}
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleCreateAccount} className="flex flex-wrap items-center gap-3 pt-2 border-t border-white/5">
          <input
            type="text"
            placeholder="Название (напр. Карта Альфа)"
            value={newAccountName}
            onChange={(e) => setNewAccountName(e.target.value)}
            className="rounded-xl border border-white/10 bg-zinc-950 px-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500"
            required
          />

          <select
            value={newAccountType}
            onChange={(e) => setNewAccountType(e.target.value)}
            className="rounded-xl border border-white/10 bg-zinc-950 px-3 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-violet-500"
          >
            <option value="card">Кредитная/дебетовая карта</option>
            <option value="cash">Наличные</option>
            <option value="savings">Сберегательный счет</option>
          </select>

          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-violet-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-violet-500 transition-colors disabled:opacity-50"
          >
            {loading ? 'Сохранение...' : 'Сохранить'}
          </button>
        </form>
      )}

      <div className="flex flex-wrap gap-2.5 pt-1">
        <button
          onClick={() => onSelectAccount && onSelectAccount(null)}
          className={`flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-medium transition-all ${
            !selectedAccountId
              ? 'border-violet-500/50 bg-violet-500/10 text-violet-300'
              : 'border-white/5 bg-zinc-900/80 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
          }`}
        >
          <span>Все счета</span>
          {!selectedAccountId && <Check className="h-3.5 w-3.5" />}
        </button>

        {accounts.map((acc) => {
          const isSelected = selectedAccountId === acc.id;
          const isCash = String(acc.type).toLowerCase() === 'cash';
          const isDeleting = deletingId === acc.id;

          return (
            <div
              key={acc.id}
              onClick={() => onSelectAccount && onSelectAccount(acc.id)}
              className={`group relative flex cursor-pointer items-center gap-2.5 rounded-xl border px-3.5 py-2 text-xs font-medium transition-all ${
                isSelected
                  ? 'border-violet-500/50 bg-violet-500/10 text-violet-300'
                  : 'border-white/5 bg-zinc-900/80 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
              } ${isDeleting ? 'opacity-50 pointer-events-none' : ''}`}
            >
              {isCash ? (
                <Banknote className="h-3.5 w-3.5 text-amber-400 shrink-0" />
              ) : (
                <CreditCard className="h-3.5 w-3.5 text-sky-400 shrink-0" />
              )}
              
              <span>{acc.name}</span>

              <span className="font-mono text-zinc-200 font-semibold ml-0.5">
                {Number(acc.balance || 0).toLocaleString('ru-RU', { minimumFractionDigits: 2 })} {userCurrency}
              </span>

              {isSelected && <Check className="h-3.5 w-3.5 text-violet-400 shrink-0" />}

              <button
                type="button"
                onClick={(e) => handleDeleteAccount(e, acc.id, acc.name)}
                className="ml-1 rounded p-1 text-zinc-500 opacity-0 transition-opacity hover:bg-red-500/20 hover:text-red-400 group-hover:opacity-100"
                title="Удалить счет"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}

        {accounts.length === 0 && !isAdding && (
          <p className="text-xs text-zinc-500 py-1">
            Счета пока не добавлены. Нажмите «Добавить счет», чтобы создать карту или кошелек.
          </p>
        )}
      </div>
    </div>
  );
}
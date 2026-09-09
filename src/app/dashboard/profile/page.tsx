'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  User, 
  Mail, 
  Calendar, 
  CreditCard, 
  Settings, 
  ArrowLeft, 
  TrendingUp, 
  TrendingDown, 
  Wallet 
} from 'lucide-react';
import { api, UserSettingsResponse } from '@/lib/api';
import { AnalyticsSummary } from '@/types/finance';

export default function ProfilePage() {
  const [user, setUser] = useState<UserSettingsResponse | null>(null);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getSettings().catch((err) => {
        console.error('Failed to fetch user settings:', err);
        return null;
      }),
      api.getSummary(6).catch((err) => {
        console.error('Failed to fetch summary:', err);
        return null;
      }),
    ]).then(([userData, summaryData]) => {
      setUser(userData);
      setSummary(summaryData);
      setIsLoading(false);
    });
  }, []);

  // Форматирование даты регистрации
  const formatDate = (dateString?: string) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date);
  };

  // Инициалы для аватара
  const getInitials = (name?: string | null, email?: string) => {
    if (name && name.trim().length > 0) {
      const parts = name.trim().split(' ');
      if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return email ? email.slice(0, 2).toUpperCase() : 'U';
  };

  // Форматирование суммы с валютой
  const formatCurrency = (val: number = 0, currency = 'USD') => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(val);
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-zinc-950 p-6 text-zinc-50 md:p-10 flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
      </main>
    );
  }

  const currency = user?.currency || 'USD';

  return (
    <main className="min-h-screen bg-zinc-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900 via-zinc-950 to-black p-6 font-sans text-zinc-50 md:p-10">
      <div className="mx-auto max-w-4xl space-y-8">
        
        {/* Навигация назад */}
        <div className="flex items-center justify-between">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-sm text-zinc-400 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Назад на главный экран
          </Link>

          <Link
            href="/dashboard/settings"
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-zinc-900/60 px-3.5 py-2 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white"
          >
            <Settings className="h-4 w-4" />
            Редактировать профиль
          </Link>
        </div>

        {/* Главная карточка профиля */}
        <div className="rounded-3xl border border-white/10 bg-zinc-900/40 p-6 backdrop-blur-xl md:p-8">
          <div className="flex flex-col items-center text-center md:flex-row md:text-left md:items-start gap-6">
            
            {/* Аватар */}
            <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-3xl bg-gradient-to-br from-violet-600 to-indigo-700 text-3xl font-bold text-white shadow-xl shadow-violet-500/10 border border-white/20">
              {getInitials(user?.name, user?.email)}
            </div>

            {/* Основная информация */}
            <div className="space-y-4 flex-1">
              <div>
                <h1 className="text-2xl font-bold text-white md:text-3xl">
                  {user?.name || 'Пользователь'}
                </h1>
                <p className="text-sm text-zinc-400 mt-1 flex items-center justify-center md:justify-start gap-1.5">
                  <Mail className="h-4 w-4 text-zinc-500" />
                  {user?.email}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="flex items-center gap-3 rounded-2xl border border-white/5 bg-white/[0.02] p-3 text-sm">
                  <div className="rounded-xl bg-violet-500/10 p-2 text-violet-400">
                    <Calendar className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500">Дата регистрации</p>
                    <p className="font-medium text-zinc-200">{formatDate(user?.createdAt)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-2xl border border-white/5 bg-white/[0.02] p-3 text-sm">
                  <div className="rounded-xl bg-indigo-500/10 p-2 text-indigo-400">
                    <CreditCard className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500">Привязанные счета</p>
                    <p className="font-medium text-zinc-200">{user?.linkedAccounts ?? 0} сч.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Секция финансовой сводки */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-white">Финансовая сводка (за 6 месяцев)</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            {/* Доходы */}
            <div className="rounded-2xl border border-white/10 bg-zinc-900/40 p-5 backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-400">Общий доход</span>
                <div className="rounded-xl bg-emerald-500/10 p-2 text-emerald-400">
                  <TrendingUp className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-3 text-xl font-bold text-emerald-400">
                {formatCurrency(summary?.totalIncome, currency)}
              </p>
            </div>

            {/* Расходы */}
            <div className="rounded-2xl border border-white/10 bg-zinc-900/40 p-5 backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-400">Общий расход</span>
                <div className="rounded-xl bg-rose-500/10 p-2 text-rose-400">
                  <TrendingDown className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-3 text-xl font-bold text-rose-400">
                {formatCurrency(summary?.totalExpense, currency)}
              </p>
            </div>

            {/* Баланс / Накопления */}
            <div className="rounded-2xl border border-white/10 bg-zinc-900/40 p-5 backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-400">Накопления</span>
                <div className="rounded-xl bg-violet-500/10 p-2 text-violet-400">
                  <Wallet className="h-4 w-4" />
                </div>
              </div>
              <p className={`mt-3 text-xl font-bold ${(summary?.netSavings ?? 0) >= 0 ? 'text-violet-400' : 'text-amber-400'}`}>
                {formatCurrency(summary?.netSavings, currency)}
              </p>
            </div>

          </div>
        </div>

      </div>
    </main>
  );
}
'use client';

import { useCallback, useEffect, useState } from 'react';
import { Plus, Settings, LogOut, User as UserIcon } from 'lucide-react';
import { signOut } from 'next-auth/react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { AnalyticsSummary } from '@/types/finance';
import { SummaryCards } from '@/components/dashboard/summary-cards';
import { ExpenseDonutChart } from '@/components/dashboard/expense-donut-chart';
import { CashflowAreaChart } from '@/components/dashboard/cashflow-area-chart';
import { TransactionTable } from '@/components/dashboard/transaction-table';
import { UploadDropzone } from '@/components/dashboard/upload-dropzone';
import { AIAdvisorCard } from '@/components/dashboard/ai-advisor-card';
import { AddTransactionModal } from '@/components/dashboard/add-transaction-modal';
import { AccountSelector } from '@/components/dashboard/account-selector';

export default function DashboardPage() {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [userCurrency, setUserCurrency] = useState<string>('BYN');
  const [userName, setUserName] = useState<string>('');
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Ключ для принудительного обновления счетов, таблицы и графиков
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchSummary = useCallback(() => {
    setIsLoading(true);
    api
      .getSummary(6, selectedAccountId)
      .then((data) => setSummary(data))
      .catch((err) => console.error('Failed to load summary:', err))
      .finally(() => setIsLoading(false));
  }, [selectedAccountId]);

  // Вызывается при создании транзакции / загрузке выписки
  const handleMutation = useCallback(() => {
    fetchSummary();
    setRefreshKey((prev) => prev + 1); // Сигнал для перезагрузки счетов и таблицы
  }, [fetchSummary]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  useEffect(() => {
    api
      .getSettings()
      .then((res) => {
        if (res.currency) setUserCurrency(res.currency);
        if (res.name) setUserName(res.name);
      })
      .catch((err) => console.error('Failed to load user settings:', err));
  }, []);

  const getInitials = (name: string) => {
    if (!name) return '';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  };

  return (
    <main className="min-h-screen bg-zinc-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900 via-zinc-950 to-black p-6 font-sans text-zinc-50 md:p-10">
      <div className="mx-auto max-w-7xl space-y-8">
        
        {/* Шапка */}
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-medium tracking-tight text-white md:text-3xl">
              {userName ? `С возвращением, ${userName}` : 'ZenFinance'}
            </h1>
            <p className="mt-1 text-sm text-zinc-400">
              Обзор капитала и аналитика личных финансов
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/profile"
              className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-zinc-900/60 px-3.5 py-2 text-sm text-zinc-300 transition-all hover:bg-zinc-800 hover:border-white/20"
              title="Перейти в профиль"
            >
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-500 text-xs font-semibold text-white shadow-sm">
                {userName ? getInitials(userName) : <UserIcon className="h-3.5 w-3.5" />}
              </div>
              <span className="font-medium text-zinc-200 hidden sm:inline">
                {userName || 'Профиль'}
              </span>
            </Link>

            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-medium text-zinc-950 transition-colors hover:bg-zinc-200 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Транзакция</span>
            </button>

            <Link
              href="/dashboard/settings"
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-zinc-900/60 p-2.5 text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white"
              title="Настройки"
            >
              <Settings className="h-4 w-4" />
            </Link>

            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-zinc-900/60 px-3 py-2 text-xs font-medium text-zinc-300 transition-colors hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20"
              title="Выйти"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline cursor-pointer">Выйти</span>
            </button>
          </div>
        </header>

        {/* Интерактивные счета (key заставит перезапросить счета и их балансы) */}
        <AccountSelector
          key={refreshKey}
          selectedAccountId={selectedAccountId}
          onSelectAccount={(id) => setSelectedAccountId(id)}
          userCurrency={userCurrency}
        />

        {/* Сводка карточек */}
        {isLoading || !summary ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-2xl bg-white/5" />
            ))}
          </div>
        ) : (
          <SummaryCards
            totalIncome={summary.totalIncome}
            totalExpense={summary.totalExpense}
            netSavings={summary.netSavings}
            currency={userCurrency}
          />
        )}

        {/* Графики */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-zinc-900/40 p-5 backdrop-blur-xl lg:col-span-1">
            <h3 className="mb-2 text-sm font-medium text-zinc-200">Распределение расходов</h3>
            <ExpenseDonutChart 
              data={(summary?.categoryBreakdown ?? []).map((item: any) => ({
                name: item.category || item.name,
                value: item.total ?? item.value ?? 0,
              }))} 
              currency={userCurrency}
            />
          </div>

          <div className="rounded-2xl border border-white/10 bg-zinc-900/40 p-5 backdrop-blur-xl lg:col-span-2">
            <h3 className="mb-2 text-sm font-medium text-zinc-200">Ежемесячный денежный поток</h3>
            <CashflowAreaChart data={summary?.monthlyTrend ?? []} />
          </div>
        </div>

        {/* Дропзона и AI */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <UploadDropzone onSuccess={handleMutation} />
          </div>
          <AIAdvisorCard />
        </div>

        {/* Таблица транзакций */}
        <div className="rounded-2xl border border-white/10 bg-zinc-900/40 p-5 backdrop-blur-xl">
          <h3 className="mb-4 text-sm font-medium text-zinc-200">История транзакций</h3>
          <TransactionTable
            key={refreshKey}
            accountId={selectedAccountId}
            onMutated={handleMutation}
            currency={userCurrency}
          />
        </div>

        {/* Модальное окно создания транзакции */}
        <AddTransactionModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={handleMutation}
          selectedAccountId={selectedAccountId}
        />
      </div>
    </main>
  );
}
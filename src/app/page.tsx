'use client';

import { useEffect, useState } from 'react';
import { api, AnalyticsSummary } from '../lib/api';
import { SummaryCards } from '../components/dashboard/summary-cards';
import { ExpenseDonutChart } from '../components/dashboard/expense-donut-chart';
import { CashflowAreaChart } from '../components/dashboard/cashflow-area-chart';
import { TransactionTable } from '../components/dashboard/transaction-table';
import { UploadDropzone } from '../components/dashboard/upload-dropzone';
import { Loader2 } from 'lucide-react';
import { LogOut } from 'lucide-react';
import { signOut } from 'next-auth/react';

export default function DashboardPage() {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getSummary(6)
      .then((data) => setSummary(data))
      .catch((err) => console.error("Failed to load dashboard summary", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-zinc-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-violet-400" />
          <p className="text-sm text-zinc-400">Loading ZenFinance Dashboard...</p>
        </div>
      </div>
    );
  }

  const safeSummary = summary || {
    totalIncome: 0,
    totalExpense: 0,
    netSavings: 0,
    categoryBreakdown: [],
    monthlyTrend: []
  };

  return (
    <main className="min-h-screen bg-zinc-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900 via-zinc-950 to-black p-6 font-sans text-zinc-50 md:p-10">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">ZenFinance</h1>
            <p className="text-sm text-zinc-500">Your finances, structured by AI.</p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-zinc-950 px-4 py-2 text-xs font-medium text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-zinc-200">
            <LogOut className="h-3.5 w-3.5" />
            Выйти
          </button>
        </header>

        <SummaryCards
          totalIncome={safeSummary.totalIncome}
          totalExpense={safeSummary.totalExpense}
          netSavings={safeSummary.netSavings}
        />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-zinc-900/40 p-5 backdrop-blur-xl lg:col-span-1">
            <h3 className="mb-2 text-sm font-medium text-zinc-200">Expense Breakdown</h3>
            <ExpenseDonutChart data={safeSummary.categoryBreakdown} />
          </div>

          <div className="rounded-2xl border border-white/10 bg-zinc-900/40 p-5 backdrop-blur-xl lg:col-span-2">
            <h3 className="mb-2 text-sm font-medium text-zinc-200">Monthly Cash Flow</h3>
            <CashflowAreaChart data={safeSummary.monthlyTrend} />
          </div>
        </div>

        <UploadDropzone />

        <TransactionTable />
      </div>
    </main>
  );
}

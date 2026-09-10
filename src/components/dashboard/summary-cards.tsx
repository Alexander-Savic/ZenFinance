'use client';

interface SummaryCardsProps {
  totalIncome?: number | string | null;
  totalExpense?: number | string | null;
  netSavings?: number | string | null;
  currency?: string;
}

const safeNumber = (val: any): number => {
  if (val === null || val === undefined) return 0;
  const num = typeof val === 'number' ? val : parseFloat(String(val));
  return isNaN(num) ? 0 : num;
};

export function SummaryCards({
  totalIncome = 0,
  totalExpense = 0,
  netSavings = 0,
  currency = 'BYN',
}: SummaryCardsProps) {
  const income = safeNumber(totalIncome);
  const expense = safeNumber(totalExpense);
  const savings = safeNumber(netSavings);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <div className="rounded-2xl border border-white/10 bg-zinc-900/40 p-5 backdrop-blur-xl">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
          СОВОКУПНЫЙ ДОХОД
        </span>
        <p className="mt-2 text-2xl font-bold font-mono text-emerald-400">
          {income.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
          <span className="text-sm font-normal text-emerald-500/80">{currency}</span>
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-zinc-900/40 p-5 backdrop-blur-xl">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
          ОБЩИЕ РАСХОДЫ
        </span>
        <p className="mt-2 text-2xl font-bold font-mono text-rose-400">
          {expense.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
          <span className="text-sm font-normal text-rose-500/80">{currency}</span>
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-zinc-900/40 p-5 backdrop-blur-xl">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
          ЧИСТАЯ ЭКОНОМИЯ
        </span>
        <p className={`mt-2 text-2xl font-bold font-mono ${savings >= 0 ? 'text-white' : 'text-rose-400'}`}>
          {savings.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
          <span className="text-sm font-normal text-zinc-400">{currency}</span>
        </p>
      </div>
    </div>
  );
}
import { ArrowUpRight, ArrowDownRight, Wallet } from 'lucide-react';
import { formatCurrency, cn } from '../../lib/utils';

interface Props {
  totalIncome: number;
  totalExpense: number;
  netSavings: number;
}

export function SummaryCards({ totalIncome, totalExpense, netSavings }: Props) {
  const cards = [
    { label: 'Total Income', value: totalIncome, icon: ArrowUpRight, accent: 'text-emerald-400' },
    { label: 'Total Expenses', value: totalExpense, icon: ArrowDownRight, accent: 'text-red-400' },
    { label: 'Net Savings', value: netSavings, icon: Wallet, accent: netSavings >= 0 ? 'text-emerald-400' : 'text-red-400' },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {cards.map((c) => (
        <div
          key={c.label}
          className="rounded-2xl border border-white/10 bg-zinc-900/40 p-5 backdrop-blur-xl"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-zinc-500">{c.label}</span>
            <c.icon className={cn('h-4 w-4', c.accent)} />
          </div>
          <p className={cn('mt-3 text-2xl font-semibold', c.accent)}>
            {formatCurrency(c.value)}
          </p>
        </div>
      ))}
    </div>
  );
}

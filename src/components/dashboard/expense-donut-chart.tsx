'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { categoryColor, formatCurrency } from '@/lib/utils';

interface Props {
  data: { category: string; total: number }[];
}

export function ExpenseDonutChart({ data }: Props) {
  const total = data.reduce((sum, d) => sum + d.total, 0);

  if (!data.length) {
    return (
      <div className="flex h-72 items-center justify-center text-sm text-zinc-500">
        No expense data yet
      </div>
    );
  }

  return (
    <div className="relative h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="total"
            nameKey="category"
            innerRadius="65%"
            outerRadius="90%"
            paddingAngle={3}
            stroke="none"
          >
            {data.map((entry) => (
              <Cell key={entry.category} fill={categoryColor(entry.category)} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: any, name: any) => [formatCurrency(Number(value)), String(name)]}
            contentStyle={{
              backgroundColor: 'rgba(24,24,27,0.9)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '12px',
              backdropFilter: 'blur(8px)',
              color: '#fafafa',
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xs uppercase tracking-wider text-zinc-500">Total Spent</span>
        <span className="text-2xl font-semibold text-zinc-50">{formatCurrency(total)}</span>
      </div>
      <div className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1">
        {data.slice(0, 6).map((d) => (
          <div key={d.category} className="flex items-center gap-1.5 text-xs text-zinc-400">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: categoryColor(d.category) }}
            />
            {d.category}
          </div>
        ))}
      </div>
    </div>
  );
}

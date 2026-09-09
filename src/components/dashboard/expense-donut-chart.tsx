'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { categoryColor, formatCurrency } from '@/lib/utils';

interface CategoryData {
  name: string;
  value: number;
}

interface Props {
  data?: CategoryData[];
  currency?: string;
}

export function ExpenseDonutChart({ data = [], currency = 'BYN' }: Props) {
  const total = data.reduce((sum, d) => {
    const val = Number(d.value);
    return sum + (isNaN(val) ? 0 : val);
  }, 0);

  if (!data || !data.length || total === 0) {
    return (
      <div className="flex h-72 items-center justify-center text-sm text-zinc-500">
        Нет данных о расходах за этот период
      </div>
    );
  }

  return (
    <div className="relative h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius="65%"
            outerRadius="90%"
            paddingAngle={3}
            stroke="none"
          >
            {data.map((entry) => (
              <Cell key={entry.name} fill={categoryColor(entry.name)} />
            ))}
          </Pie>
          <Tooltip
            formatter={(val: any, name: any) => [
              formatCurrency ? formatCurrency(Number(val)) : `${Number(val).toLocaleString('ru-RU')} ${currency}`,
              String(name),
            ]}
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

      <div className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1">
        {data.slice(0, 6).map((d) => (
          <div key={d.name} className="flex items-center gap-1.5 text-xs text-zinc-400">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: categoryColor(d.name) }}
            />
            {d.name}
          </div>
        ))}
      </div>
    </div>
  );
}
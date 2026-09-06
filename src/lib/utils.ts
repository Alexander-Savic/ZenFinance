import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Объединение классов Tailwind CSS
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Красивое форматирование валюты
export function formatCurrency(value: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(value);
}

// Цветовая палитра для графиков и таблиц
export const CATEGORY_COLORS: Record<string, string> = {
  Food: '#f97316',
  Transport: '#3b82f6',
  Utilities: '#eab308',
  Housing: '#8b5cf6',
  Entertainment: '#ec4899',
  Shopping: '#14b8a6',
  Health: '#ef4444',
  Travel: '#06b6d4',
  Subscriptions: '#a855f7',
  Income: '#22c55e',
  Transfer: '#64748b',
  Fees: '#f43f5e',
  Education: '#6366f1',
  Other: '#94a3b8',
};

export function categoryColor(category: string) {
  return CATEGORY_COLORS[category] ?? '#94a3b8';
}

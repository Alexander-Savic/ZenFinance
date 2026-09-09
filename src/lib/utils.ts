import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

const COLOR_PALETTE = [
  '#6366f1', // Indigo
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#8b5cf6', // Purple
  '#06b6d4', // Cyan
  '#f97316', // Orange
  '#14b8a6', // Teal
  '#3b82f6', // Blue
  '#ef4444', // Red
];

const CATEGORY_COLORS: Record<string, string> = {
  'еда': '#10b981',
  'продукты': '#10b981',
  'магазин': '#10b981',
  'супермаркеты': '#10b981',
  'кафе': '#f59e0b',
  'рестораны': '#f59e0b',
  'транспорт': '#3b82f6',
  'такси': '#06b6d4',
  'развлечения': '#ec4899',
  'кино': '#ec4899',
  'покупки': '#8b5cf6',
  'одежда': '#8b5cf6',
  'работа': '#6366f1',
  'зарплата': '#10b981',
  'жилье': '#f97316',
  'коммуналка': '#f97316',
  'здоровье': '#ef4444',
  'аптека': '#ef4444',
  'спорт': '#14b8a6',
};

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number, currency = 'USD') {
  const localeMap: Record<string, string> = {
    BYN: 'be-BY',
    RUB: 'ru-RU',
    EUR: 'de-DE',
    USD: 'en-US',
    KZT: 'kk-KZ',
  };

  const locale = localeMap[currency] || 'en-US';

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(value);
}

export function categoryColor(category: string, index: number = 0): string {
  if (!category) return COLOR_PALETTE[0];
  
  const key = category.toLowerCase().trim();
  
  // Если есть прямое совпадение по названию
  if (CATEGORY_COLORS[key]) {
    return CATEGORY_COLORS[key];
  }

  // Для незнакомых категорий генерируем стабильный цвет на основе строки или индекса
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = key.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const paletteIndex = Math.abs(hash + index) % COLOR_PALETTE.length;
  return COLOR_PALETTE[paletteIndex];
};
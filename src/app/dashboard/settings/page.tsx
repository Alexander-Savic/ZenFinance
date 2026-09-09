'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, User, DollarSign, ListOrdered, Save, Check, ShieldCheck } from 'lucide-react';
import { api, UserSettingsResponse } from '@/lib/api';

export default function SettingsPage() {
  const [settings, setSettings] = useState<UserSettingsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Форма
  const [name, setName] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [transactionsPerPage, setTransactionsPerPage] = useState(10);

  useEffect(() => {
    setLoading(true);
    api
      .getSettings()
      .then((data) => {
        setSettings(data);
        setName(data.name || '');
        setCurrency(data.currency || 'USD');
        setTransactionsPerPage(data.transactionsPerPage || 10);
      })
      .catch((err) => console.error('Ошибка загрузки настроек:', err))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);

    try {
      await api.updateSettings({
        name,
        currency,
        transactionsPerPage,
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error('Ошибка при сохранении:', err);
      alert('Не удалось сохранить настройки');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 p-6 flex items-center justify-center text-zinc-400">
        Загрузка профиля...
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900 via-zinc-950 to-black p-6 font-sans text-zinc-50 md:p-10">
      <div className="mx-auto max-w-3xl space-y-8">
        
        {/* Кнопка назад и заголовок */}
        <div className="flex items-center justify-between">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-zinc-900/60 px-3.5 py-2 text-xs font-medium text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Назад на главный экран
          </Link>
        </div>

        {/* Карточка карточки профиля */}
        <div className="rounded-3xl border border-white/10 bg-zinc-900/40 p-6 backdrop-blur-xl md:p-8">
          <div className="flex items-center gap-4 pb-6 border-b border-white/10">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-500 text-2xl font-bold text-white shadow-lg shadow-indigo-500/20">
              {name ? name[0].toUpperCase() : 'U'}
            </div>
            <div>
              <h1 className="text-xl font-semibold text-zinc-100">
                {name || 'Пользователь'}
              </h1>
              <p className="text-sm text-zinc-400">{settings?.email}</p>
              <span className="inline-flex items-center gap-1 mt-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-medium text-emerald-400 ring-1 ring-emerald-500/20">
                <ShieldCheck className="h-3 w-3" />
                Активный аккаунт
              </span>
            </div>
          </div>

          {/* Форма редактирования */}
          <form onSubmit={handleSave} className="mt-8 space-y-6">
            <div className="space-y-4">
              
              {/* Имя */}
              <div>
                <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-zinc-400">
                  Отображаемое имя
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ваше имя"
                    className="w-full rounded-xl border border-white/10 bg-zinc-800/50 py-2.5 pl-10 pr-4 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition-colors focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50"
                  />
                </div>
              </div>

              {/* Основная валюта */}
              <div>
                <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-zinc-400">
                  Основная валюта
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full cursor-pointer appearance-none rounded-xl border border-white/10 bg-zinc-800/50 py-2.5 pl-10 pr-4 text-sm text-zinc-100 outline-none transition-colors focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50"
                  >
                    <option value="USD" className="bg-zinc-900">USD ($) — Доллар США</option>
                    <option value="EUR" className="bg-zinc-900">EUR (€) — Евро</option>
                    <option value="BYN" className="bg-zinc-900">BYN (Br) — Белорусский рубль</option>
                    <option value="RUB" className="bg-zinc-900">RUB (₽) — Российский рубль</option>
                    <option value="KZT" className="bg-zinc-900">KZT (₸) — Казахстанский тенге</option>
                  </select>
                </div>
              </div>

            </div>

            {/* Сохранение */}
            <div className="flex items-center justify-between pt-4 border-t border-white/10">
              <span className="text-xs text-zinc-500">
                Создан: {settings?.createdAt ? new Date(settings.createdAt).toLocaleDateString() : '—'}
              </span>

              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-medium text-zinc-950 transition-colors hover:bg-zinc-200 disabled:opacity-50"
              >
                {savedSuccess ? (
                  <>
                    <Check className="h-4 w-4 text-emerald-600" />
                    Сохранено!
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    {saving ? 'Сохранение...' : 'Сохранить изменения'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

      </div>
    </main>
  );
}
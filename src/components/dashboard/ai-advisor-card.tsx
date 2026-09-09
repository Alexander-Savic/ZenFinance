'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, RefreshCw, AlertTriangle, Info, TrendingUp, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { AdvisorTip } from '@/types/finance';

const SEVERITY_CONFIG = {
  warning: { icon: AlertTriangle, color: 'text-amber-300', bg: 'bg-amber-500/10', ring: 'ring-amber-500/20' },
  positive: { icon: TrendingUp, color: 'text-emerald-300', bg: 'bg-emerald-500/10', ring: 'ring-emerald-500/20' },
  info: { icon: Info, color: 'text-violet-300', bg: 'bg-violet-500/10', ring: 'ring-violet-500/20' },
} as const;

export function AIAdvisorCard() {
  const [tips, setTips] = useState<AdvisorTip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAdvice = useCallback(() => {
    setIsLoading(true);
    setError(null);
    api
      .getAdvice() // <-- Здесь должен быть именно getAdvice
      .then((res) => setTips(res.tips))
      .catch((err) => setError(err instanceof Error ? err.message : 'Не удалось получить рекомендации'))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    fetchAdvice();
  }, [fetchAdvice]);

  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-900/40 p-5 backdrop-blur-xl">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-500/10 ring-1 ring-violet-500/20">
            <Sparkles className="h-4 w-4 text-violet-300" />
          </div>
          <h3 className="text-sm font-medium text-zinc-200">AI Financial Advisor</h3>
        </div>
        <button
          onClick={fetchAdvice}
          disabled={isLoading}
          className="flex items-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-1.5 text-xs text-zinc-400 transition-colors hover:border-white/20 hover:text-zinc-200 disabled:opacity-50"
        >
          {isLoading ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <RefreshCw className="h-3 w-3" />
          )}
          Обновить
        </button>
      </div>

      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-3"
          >
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl bg-white/5" />
            ))}
          </motion.div>
        ) : error ? (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-xs text-red-300"
          >
            {error}
          </motion.div>
        ) : (
          <motion.div
            key="tips"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-3"
          >
            {tips.map((tip, index) => {
              const config = SEVERITY_CONFIG[tip.severity] ?? SEVERITY_CONFIG.info;
              const Icon = config.icon;
              return (
                <motion.div
                  key={tip.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.08 }}
                  className={`flex gap-3 rounded-xl p-3.5 ${config.bg} ring-1 ${config.ring}`}
                >
                  <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${config.color}`} />
                  <div>
                    <p className="text-sm font-medium text-zinc-100">{tip.title}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-zinc-400">{tip.detail}</p>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
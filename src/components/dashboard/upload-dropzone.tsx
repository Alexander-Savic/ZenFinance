'use client';

import { useCallback, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, FileSpreadsheet, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';

type Status = 'idle' | 'dragging' | 'uploading' | 'success' | 'error';

interface UploadDropzoneProps {
  onSuccess?: () => void;
}

export function UploadDropzone({ onSuccess }: UploadDropzoneProps) {
  const [status, setStatus] = useState<Status>('idle');
  const [fileName, setFileName] = useState<string | null>(null);
  const [message, setMessage] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File) => {
      setFileName(file.name);
      setStatus('uploading');
      try {
        const res = await api.importFile(file);
        setMessage(`Импортировано ${res.totalImported} транзакций · ${res.aiClassifiedCount} авто-категоризировано`);
        setStatus('success');
        onSuccess?.();
      } catch {
        setMessage('Импорт не удался. Проверьте формат файла и попробуйте снова.');
        setStatus('error');
      }
    },
    [onSuccess],
  );

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setStatus('dragging');
      }}
      onDragLeave={() => setStatus('idle')}
      onDrop={onDrop}
      onClick={() => inputRef.current?.click()}
      className="relative cursor-pointer overflow-hidden rounded-2xl border border-dashed border-white/15 bg-zinc-900/30 p-10 text-center backdrop-blur-xl transition-colors hover:border-white/30"
    >
      <input
        ref={inputRef}
        type="file"
        accept=".csv,.xlsx,.xls"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />

      <AnimatePresence mode="wait">
        {status === 'idle' || status === 'dragging' ? (
          <motion.div
            key="idle"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0, scale: status === 'dragging' ? 1.03 : 1 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex flex-col items-center gap-3"
          >
            <motion.div
              animate={{ y: status === 'dragging' ? -4 : 0 }}
              transition={{ repeat: status === 'dragging' ? Infinity : 0, repeatType: 'reverse', duration: 0.6 }}
              className="flex h-14 w-14 items-center justify-center rounded-full bg-violet-500/10 ring-1 ring-violet-500/20"
            >
              <UploadCloud className="h-6 w-6 text-violet-300" />
            </motion.div>
            <p className="text-sm font-medium text-zinc-200">
              Перетащите файл выписки сюда
            </p>
            <p className="text-xs text-zinc-500">CSV, XLS или XLSX — до 10MB</p>
          </motion.div>
        ) : status === 'uploading' ? (
          <motion.div
            key="uploading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-3"
          >
            <Loader2 className="h-8 w-8 animate-spin text-violet-300" />
            <p className="text-sm text-zinc-300">Разбор и категоризация {fileName}…</p>
          </motion.div>
        ) : status === 'success' ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-3"
          >
            <CheckCircle2 className="h-8 w-8 text-emerald-400" />
            <p className="text-sm text-zinc-200">{message}</p>
            <div className="flex items-center gap-1.5 text-xs text-zinc-500">
              <FileSpreadsheet className="h-3.5 w-3.5" />
              {fileName}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="error"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-3"
          >
            <XCircle className="h-8 w-8 text-red-400" />
            <p className="text-sm text-zinc-300">{message}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
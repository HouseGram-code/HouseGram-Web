'use client';

import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { useEffect } from 'react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastState {
  id: number;
  type: ToastType;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

interface ToastProps {
  toast: ToastState | null;
  onClose: () => void;
  duration?: number;
}

const TOAST_ICONS: Record<ToastType, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
};

const TOAST_STYLES: Record<ToastType, { bg: string; iconColor: string; accent: string }> = {
  success: {
    bg: 'bg-emerald-50 border-emerald-200',
    iconColor: 'text-emerald-500',
    accent: 'bg-emerald-500',
  },
  error: {
    bg: 'bg-rose-50 border-rose-200',
    iconColor: 'text-rose-500',
    accent: 'bg-rose-500',
  },
  info: {
    bg: 'bg-sky-50 border-sky-200',
    iconColor: 'text-sky-500',
    accent: 'bg-sky-500',
  },
};

/**
 * Универсальный toast для ошибок/успехов/инфо. Монтируется однократно в
 * родительском представлении; показывается через state { id, type, title }.
 * Новое обновление state с другим id перезапускает автоскрытие.
 */
export default function Toast({ toast, onClose, duration = 3500 }: ToastProps) {
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(onClose, duration);
    return () => clearTimeout(t);
  }, [toast, onClose, duration]);

  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          key={toast.id}
          initial={{ y: -24, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: -16, opacity: 0, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 320, damping: 28 }}
          className="absolute top-3 left-1/2 -translate-x-1/2 z-[120] w-[min(92%,360px)] pointer-events-none"
        >
          <div
            className={`relative pointer-events-auto flex items-start gap-3 rounded-2xl border shadow-xl px-3.5 py-3 ${TOAST_STYLES[toast.type].bg}`}
          >
            <div
              className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl ${TOAST_STYLES[toast.type].accent}`}
            />
            {(() => {
              const Icon = TOAST_ICONS[toast.type];
              return (
                <Icon
                  size={20}
                  className={`${TOAST_STYLES[toast.type].iconColor} shrink-0 mt-0.5`}
                />
              );
            })()}
            <div className="flex-grow min-w-0">
              <div className="text-[14px] font-semibold text-gray-900 leading-tight">
                {toast.title}
              </div>
              {toast.description && (
                <div className="text-[13px] text-gray-600 leading-snug mt-0.5">
                  {toast.description}
                </div>
              )}
              {toast.actionLabel && toast.onAction && (
                <button
                  onClick={() => {
                    toast.onAction?.();
                    onClose();
                  }}
                  className={`mt-2 text-[13px] font-semibold ${TOAST_STYLES[toast.type].iconColor} hover:underline`}
                >
                  {toast.actionLabel}
                </button>
              )}
            </div>
            <button
              onClick={onClose}
              className="shrink-0 p-1 -m-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-black/5 transition-colors"
              aria-label="Закрыть"
            >
              <X size={16} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

let toastIdCounter = 0;
export const nextToastId = () => ++toastIdCounter;

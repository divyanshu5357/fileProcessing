import React from 'react';
import { ToastMessage } from '@/types';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((t) => {
        let style = 'bg-[#E0F2FE] dark:bg-[#0C4A6E] text-[#0369A1] dark:text-[#38BDF8] border-[#7DD3FC] dark:border-[#0284C7]';
        let Icon = Info;

        if (t.type === 'success') {
          style = 'bg-[#DCFCE7] dark:bg-[#14532D] text-[#166534] dark:text-[#BBF7D0] border-[#86EFAC] dark:border-[#22C55E]';
          Icon = CheckCircle2;
        } else if (t.type === 'error') {
          style = 'bg-[#FEE2E2] dark:bg-[#7F1D1D] text-[#991B1B] dark:text-[#FECACA] border-[#FCA5A5] dark:border-[#EF4444]';
          Icon = AlertCircle;
        } else if (t.type === 'warning') {
          style = 'bg-[#FEF3C7] dark:bg-[#78350F] text-[#92400E] dark:text-[#FEF3C7] border-[#FCD34D] dark:border-[#F59E0B]';
          Icon = AlertTriangle;
        }

        return (
          <div
            key={t.id}
            className={`pointer-events-auto p-3.5 border rounded-2xl shadow-lg flex items-start gap-3 transition-all animate-in fade-in slide-in-from-bottom-2 duration-200 ${style}`}
          >
            <Icon className="w-5 h-5 shrink-0 mt-0.5" />

            <div className="flex flex-col flex-1 min-w-0">
              <span className="text-xs font-bold leading-tight">{t.title}</span>
              {t.description && (
                <span className="text-[11px] opacity-90 leading-tight mt-0.5 font-medium">
                  {t.description}
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={() => onDismiss(t.id)}
              className="opacity-70 hover:opacity-100 p-0.5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

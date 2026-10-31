'use client';

import React from 'react';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '../ui/Button';

interface ProcessingStatusProps {
  isProcessing: boolean;
  progressPercent: number;
  statusMessage: string;
  currentFileName?: string;
  errorMessage?: string | null;
  onCancel?: () => void;
}

export function ProcessingStatus({
  isProcessing,
  progressPercent,
  statusMessage,
  currentFileName,
  errorMessage,
  onCancel,
}: ProcessingStatusProps) {
  if (!isProcessing && !errorMessage) return null;

  return (
    <div className="w-full p-5 bg-white dark:bg-[#111827] border border-[#CBD5E1] dark:border-[#334155] rounded-2xl shadow-xs transition-colors">
      {errorMessage ? (
        <div className="flex items-start gap-3 text-rose-600 dark:text-rose-400">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h5 className="text-sm font-bold">Conversion Error</h5>
            <p className="text-xs text-rose-700 dark:text-rose-300 mt-0.5 font-normal">
              {errorMessage}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between text-xs font-semibold">
            <div className="flex items-center gap-2 text-[#0F172A] dark:text-[#F8FAFC]">
              <Loader2 className="w-4 h-4 animate-spin text-[#2563EB] dark:text-[#60A5FA]" />
              <span>{statusMessage || 'Processing conversion...'}</span>
            </div>
            <span className="font-mono text-[#2563EB] dark:text-[#60A5FA] font-bold">
              {progressPercent}%
            </span>
          </div>

          {/* Animated Progress Bar */}
          <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-[#CBD5E1] dark:border-[#334155]">
            <div
              className="h-full bg-gradient-to-r from-[#2563EB] via-indigo-500 to-purple-600 transition-all duration-200 rounded-full"
              style={{ width: `${Math.max(5, progressPercent)}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-[#475569] dark:text-[#CBD5E1]">
            <span className="truncate max-w-sm">
              {currentFileName ? `Active file: ${currentFileName}` : 'Executing client-side memory pipeline...'}
            </span>
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="text-xs text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 font-medium cursor-pointer"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

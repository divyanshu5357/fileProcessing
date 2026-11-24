'use client';

import React from 'react';
import { ShieldAlert, Cpu, Sparkles, Lock } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { GuestQuotaState } from '@/hooks/useGuestProductQuota';

interface GuestQuotaBannerProps {
  quota: GuestQuotaState;
  productName: string;
}

export function GuestQuotaBanner({ quota, productName }: GuestQuotaBannerProps) {
  const { openAuthModal } = useAuth();
  const isExhausted = quota.isGuest && quota.remaining <= 0;

  if (!quota.isGuest && quota.memoryProfile.tier === 'paid') {
    return null;
  }

  return (
    <div
      className={`w-full px-4 py-2 text-xs border-b flex flex-wrap items-center justify-between gap-2 transition-colors ${
        isExhausted
          ? 'bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
          : quota.isGuest
          ? 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200'
          : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
      }`}
    >
      <div className="flex items-center gap-2 flex-wrap">
        {quota.isGuest ? (
          <>
            {isExhausted ? (
              <Lock className="w-3.5 h-3.5 text-rose-600 shrink-0" />
            ) : (
              <ShieldAlert className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            )}
            <span className="font-bold">
              {isExhausted
                ? `${productName}: 0 of ${quota.limit} free guest edits left`
                : `${productName} Guest Mode: ${quota.remaining} of ${quota.limit} edits remaining`}
            </span>
            {quota.ipMasked && (
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10">
                IP {quota.ipMasked}
              </span>
            )}
          </>
        ) : (
          <span className="font-semibold flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Free Account: Unlimited {productName}</span>
          </span>
        )}

        <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/80 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
          <Cpu className="w-3 h-3 text-blue-500" />
          <span>
            {quota.memoryProfile.label} ({quota.memoryProfile.maxCanvasDpr}x DPR, {quota.memoryProfile.maxFileSizeMb}MB max)
          </span>
        </span>
      </div>

      {quota.isGuest && (
        <button
          type="button"
          onClick={() =>
            openAuthModal(
              undefined,
              isExhausted
                ? `Free guest IP limit reached (${quota.limit}/${quota.limit}) for ${productName}. Sign in free for unlimited editing.`
                : `Sign in free to unlock unlimited ${productName} runs and skip the 4-edit IP limit.`
            )
          }
          className={`px-3 py-1 rounded-lg font-bold text-[11px] transition cursor-pointer shrink-0 ${
            isExhausted
              ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-xs'
              : 'bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white'
          }`}
        >
          {isExhausted ? 'Sign In to Continue (Free)' : 'Unlock Unlimited Free'}
        </button>
      )}
    </div>
  );
}

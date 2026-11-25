'use client';

import React from 'react';
import { MotionConfig, motion, useReducedMotion } from 'framer-motion';
import { FileText, ShieldCheck, Ban, Server, ArrowRight } from 'lucide-react';

export function ClientPrivacySandbox() {
  const prefersReduced = useReducedMotion();

  return (
    <MotionConfig reducedMotion="user">
      <div
        aria-label="Client-side WebAssembly privacy architecture diagram"
        className="mt-6 mb-2 p-4 rounded-2xl bg-white dark:bg-[#0D1017] border border-[#E2E6F0] dark:border-[#242B3E] relative overflow-hidden"
      >
        <div className="flex items-center justify-between gap-2 text-[10px] font-mono text-[#4E5360] dark:text-[#9DA3AE] mb-3">
          <span className="inline-flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            LOCAL RAM SANDBOX ACTIVE
          </span>
          <span className="text-rose-600 dark:text-rose-400 font-semibold">
            OUTBOUND UPLOAD BLOCKED
          </span>
        </div>

        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-3">
          {/* Local Browser RAM / WebAssembly Shield */}
          <div className="relative p-3 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 flex flex-col items-center text-center gap-1.5">
            {!prefersReduced && (
              <motion.div
                aria-hidden="true"
                className="absolute inset-0 rounded-xl border-2 border-emerald-400/50 pointer-events-none"
                animate={{ opacity: [0.35, 0.85, 0.35] }}
                transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
              />
            )}

            <div className="relative flex items-center justify-center w-10 h-10 rounded-full bg-white dark:bg-[#111926] border border-emerald-300 dark:border-emerald-700 shadow-2xs">
              <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <motion.div
                aria-hidden="true"
                initial={false}
                animate={
                  prefersReduced
                    ? undefined
                    : { x: [-14, 0], y: [4, 0], scale: [0.85, 1] }
                }
                transition={{
                  duration: 2.2,
                  repeat: Infinity,
                  repeatDelay: 1.1,
                  ease: 'easeOut',
                }}
                className="absolute -left-2 -bottom-1 w-5 h-5 rounded-md bg-[#3B50B2] text-white flex items-center justify-center shadow-xs"
              >
                <FileText className="w-3 h-3" />
              </motion.div>
            </div>

            <span className="text-[11px] font-bold text-[#20232B] dark:text-[#F8FAFC] leading-tight">
              Browser RAM / WebAssembly
            </span>
            <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400">
              Processed Locally
            </span>
          </div>

          {/* Blocked Dotted Transmission Path */}
          <div className="flex flex-col items-center justify-center px-1 gap-1">
            <div className="relative flex items-center w-14 sm:w-20">
              <div className="w-full border-t-2 border-dashed border-rose-300 dark:border-rose-700/70" />
              <motion.div
                aria-hidden="true"
                animate={prefersReduced ? undefined : { scale: [1, 1.08, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-rose-50 dark:bg-rose-950/90 border border-rose-300 dark:border-rose-700 flex items-center justify-center shadow-2xs"
              >
                <Ban className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
              </motion.div>
              <ArrowRight className="w-3 h-3 text-rose-300 dark:text-rose-700 shrink-0 -ml-1" />
            </div>
            <span className="text-[9px] font-mono font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
              0 KB Sent
            </span>
          </div>

          {/* External Cloud Server (Blocked / Untouched) */}
          <div className="p-3 rounded-xl bg-slate-100/70 dark:bg-[#141824] border border-dashed border-[#D3D8E4] dark:border-[#2A3248] flex flex-col items-center text-center gap-1.5 opacity-75">
            <div className="w-10 h-10 rounded-full bg-white dark:bg-[#0D1017] border border-[#D9DEE8] dark:border-[#2A3248] flex items-center justify-center">
              <Server className="w-4.5 h-4.5 text-[#6B7280] dark:text-[#7E8696]" />
            </div>
            <span className="text-[11px] font-bold text-[#4E5360] dark:text-[#9DA3AE] leading-tight">
              Cloud Server
            </span>
            <span className="text-[10px] font-mono text-[#6B7280] dark:text-[#7E8696]">
              Never Receives File
            </span>
          </div>
        </div>
      </div>
    </MotionConfig>
  );
}

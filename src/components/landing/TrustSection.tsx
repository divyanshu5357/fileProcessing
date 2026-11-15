'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Lock, HardDrive, Cpu, Cloud, Check } from 'lucide-react';

export function TrustSection() {
  return (
    <section className="w-full py-24 px-4 sm:px-6 lg:px-8 bg-white dark:bg-[#0D1017] border-t border-[#E9EBF0] dark:border-[#222632] transition-colors">
      <div className="max-w-7xl mx-auto flex flex-col gap-14">
        {/* Section Heading */}
        <div className="max-w-2xl">
          <span className="text-xs font-semibold text-[#159B75] uppercase tracking-wider block mb-2">
            Architecture & Control
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#20232B] dark:text-[#F8FAFC] tracking-tight leading-tight">
            Your files. Your workflow. Your control.
          </h2>
          <p className="text-base sm:text-lg text-[#727783] dark:text-[#9DA3AE] mt-3 leading-relaxed">
            Understand exactly where and how your documents are handled. No hidden background uploads.
          </p>
        </div>

        {/* 2 Clear Columns: Browser-Local Execution vs Optional Cloud Storage */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Card 1: Browser-Local Processing */}
          <div className="p-8 rounded-3xl bg-[#F7F8FA] dark:bg-[#141824] border border-[#E9EBF0] dark:border-[#242B3E] flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-[#159B75] flex items-center justify-center mb-5">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-[#20232B] dark:text-[#F8FAFC] mb-2">
                Standard Client-Side Processing
              </h3>
              <p className="text-sm text-[#727783] dark:text-[#9DA3AE] leading-relaxed mb-6">
                All core document operations—PDF to Word, image compression, page splitting, merging, and scanner effects—execute directly inside your web browser via HTML5 Canvas and WebAssembly.
              </p>

              <div className="flex flex-col gap-3 text-xs text-[#20232B] dark:text-[#F8FAFC]">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#159B75] shrink-0" />
                  <span>Files remain in your device RAM during processing</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#159B75] shrink-0" />
                  <span>Closing the tab instantly frees memory blobs</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#159B75] shrink-0" />
                  <span>Works even when your computer is offline</span>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-[#E9EBF0] dark:border-[#242B3E] text-xs font-mono text-[#727783]">
              STATUS // CLIENT-NATIVE EXECUTION
            </div>
          </div>

          {/* Card 2: Optional Authenticated Cloud Sync */}
          <div className="p-8 rounded-3xl bg-[#F7F8FA] dark:bg-[#141824] border border-[#E9EBF0] dark:border-[#242B3E] flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-[#EDF0FF] dark:bg-[#536BCE]/20 text-[#536BCE] flex items-center justify-center mb-5">
                <Cloud className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-[#20232B] dark:text-[#F8FAFC] mb-2">
                Optional Cloud Workspace Sync
              </h3>
              <p className="text-sm text-[#727783] dark:text-[#9DA3AE] leading-relaxed mb-6">
                For users who explicitly sign in and choose cloud storage, documents are securely synchronized with private storage vaults and short-lived presigned URLs.
              </p>

              <div className="flex flex-col gap-3 text-xs text-[#20232B] dark:text-[#F8FAFC]">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#536BCE] shrink-0" />
                  <span>Only happens when you deliberately click "Save to Cloud"</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#536BCE] shrink-0" />
                  <span>Signed download URLs with automatic expiration</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#536BCE] shrink-0" />
                  <span>Delete and manage your files anytime from your account</span>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-[#E9EBF0] dark:border-[#242B3E] text-xs font-mono text-[#727783]">
              STATUS // EXPLICIT USER CONSENT ONLY
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

'use client';

import React from 'react';
import Link from 'next/link';
import {
  Sparkles,
  ShieldCheck,
  Zap,
  Lock,
  Cpu,
  Layers,
  ArrowRight,
  Globe,
  Award,
} from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-[#0D1017] text-[#20232B] dark:text-[#F8FAFC] selection:bg-[#536BCE] selection:text-white transition-colors duration-150">
      <Header />

      <main className="flex-1 py-14 sm:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-14">
          {/* Header */}
          <div className="border-b border-[#E9EBF0] dark:border-[#222632] pb-8 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-xs font-semibold text-[#536BCE] dark:text-[#93A5F5] border border-blue-200 dark:border-blue-900/60">
              <Sparkles className="w-3.5 h-3.5" />
              <span>About Gyanvatsala</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black text-[#20232B] dark:text-[#F8FAFC] tracking-tight">
              A modern digital workspace for your documents.
            </h1>
            <p className="text-sm sm:text-base text-[#727783] dark:text-[#9DA3AE] leading-relaxed max-w-2xl">
              Gyanvatsala brings everyday document conversion, layout reconstruction, photocopier scan simulation, and interactive PDF editing together in one unified, calm, privacy-first interface.
            </p>
          </div>

          {/* Pillars */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-3xl bg-[#F7F8FA] dark:bg-[#111622] border border-[#E9EBF0] dark:border-[#222632] space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-[#20232B] dark:text-[#F8FAFC]">Local-First Privacy</h3>
              <p className="text-xs text-[#727783] dark:text-[#9DA3AE] leading-relaxed">
                Core transformations run directly in your browser using client-side WebAssembly, Canvas, and vector engines with zero server uploads.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-[#F7F8FA] dark:bg-[#111622] border border-[#E9EBF0] dark:border-[#222632] space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-[#536BCE] flex items-center justify-center">
                <Cpu className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-[#20232B] dark:text-[#F8FAFC]">Layout Preservation</h3>
              <p className="text-xs text-[#727783] dark:text-[#9DA3AE] leading-relaxed">
                Reconstruct Word, PDF, and image documents preserving tables, embedded figures, headings, and font weights without formatting distortions.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-[#F7F8FA] dark:bg-[#111622] border border-[#E9EBF0] dark:border-[#222632] space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-[#20232B] dark:text-[#F8FAFC]">Auto Data Shredding</h3>
              <p className="text-xs text-[#727783] dark:text-[#9DA3AE] leading-relaxed">
                Optional cloud storage features automatic expiration timelines (7 to 365 days) with complete cryptographic shredding on deadline.
              </p>
            </div>
          </div>

          {/* Operator Details */}
          <div className="p-8 rounded-3xl bg-white dark:bg-[#111622] border border-[#E9EBF0] dark:border-[#222632] space-y-4">
            <h2 className="text-lg font-bold text-[#20232B] dark:text-[#F8FAFC]">
              Operator & Legal Information
            </h2>
            <div className="text-xs text-[#727783] dark:text-[#9DA3AE] space-y-2 leading-relaxed">
              <p>
                <strong>Gyanvatsala</strong> (<a href="https://www.gyanvatsala.in" className="text-[#536BCE] underline">https://www.gyanvatsala.in</a>) is operated by <strong>DIVYANSHU PRATAP SINGH</strong>, an individual operating from India.
              </p>
              <p>
                For official correspondence, grievance support, or partnership inquiries, reach out to our team at{' '}
                <a href="mailto:fileprocess@gyanvatsala.in" className="text-[#536BCE] font-bold underline">
                  fileprocess@gyanvatsala.in
                </a>.
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  FileText,
  ScanLine,
  Image as ImageIcon,
  PenTool,
  Check,
  Download,
  Share2,
  ZoomIn,
  ZoomOut,
  Highlighter,
  Type,
  Folder,
  Cloud,
  ShieldCheck,
  CheckCircle2,
  Sliders,
  ChevronRight,
  Maximize2,
} from 'lucide-react';

export function ProductHeroVisual() {
  const [activeTab, setActiveTab] = useState<'editor' | 'scan' | 'convert'>('editor');
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="relative w-full max-w-2xl mx-auto rounded-3xl bg-gradient-to-tr from-[#EDF2FE] via-[#F4F7FF] to-[#EDF4FF] dark:from-[#131929] dark:via-[#161D30] dark:to-[#111726] border border-[#E2E8F8] dark:border-[#222B42] p-4 sm:p-7 shadow-lg shadow-blue-500/5 transition-all duration-300 select-none group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Subtle background ambient line/accent */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-[#536BCE]/8 rounded-full blur-3xl pointer-events-none" />

      {/* ======================================================== */}
      {/* FLOATING SQUIRCLE BADGES (REFERENCE: IMAGE 2 DOCSTUDIO)   */}
      {/* ======================================================== */}
      {/* Floating Badge 1: White Squircle with Blue Folder Icon */}
      <div className="absolute -top-3 -left-2 sm:-left-4 z-20 w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white dark:bg-[#1E2538] border border-[#E9EBF0] dark:border-[#2B354F] shadow-lg shadow-slate-900/10 flex items-center justify-center transition-transform duration-300 hover:scale-105">
        <div className="w-8 h-8 rounded-xl bg-[#EDF0FF] dark:bg-[#536BCE]/20 flex items-center justify-center text-[#536BCE]">
          <Folder className="w-4 h-4 fill-[#536BCE]/20 stroke-[#536BCE]" />
        </div>
      </div>

      {/* Floating Badge 2: Cobalt Blue Squircle with Cloud Check */}
      <div className="absolute top-1/3 -left-3 sm:-left-5 z-20 w-11 h-11 sm:w-13 sm:h-13 rounded-2xl bg-[#536BCE] border border-white/20 shadow-xl shadow-[#536BCE]/25 flex items-center justify-center transition-transform duration-300 hover:scale-105">
        <Cloud className="w-5 h-5 text-white stroke-[2.2]" />
      </div>

      {/* ======================================================== */}
      {/* MAIN DOCUMENT WORKSPACE WINDOW (ACROBAT/DOCSTUDIO STYLE) */}
      {/* ======================================================== */}
      <div className="relative z-10 rounded-2xl bg-white dark:bg-[#151926] border border-[#E9EBF0] dark:border-[#28314A] shadow-md overflow-hidden">
        {/* macOS Window Title Bar */}
        <div className="h-10 px-4 border-b border-[#E9EBF0] dark:border-[#28314A] bg-[#FAFAF8] dark:bg-[#121622] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444]/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]/80" />
            <span className="ml-2 font-mono text-[11px] font-medium text-[#727783] dark:text-[#9DA3AE]">
              Master_Services_Agreement_2026.pdf
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#EDF0FF] dark:bg-[#536BCE]/20 text-[#536BCE] dark:text-[#93A5F5] font-semibold">
              PDF/A-2b
            </span>
            <span className="hidden sm:inline-flex text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
              ● Saved locally
            </span>
          </div>
        </div>

        {/* Workspace Toolbar */}
        <div className="px-4 py-2 border-b border-[#E9EBF0] dark:border-[#28314A] bg-white dark:bg-[#151926] flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="text-[11px] font-medium text-[#727783] dark:text-[#9DA3AE]">Page 1 / 4</span>
            <span className="text-[#E9EBF0] dark:text-[#28314A]">|</span>
            <button
              type="button"
              className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-[#727783]"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-mono text-[#727783]">100%</span>
            <button
              type="button"
              className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-[#727783]"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              className="px-2 py-1 rounded-md bg-[#EDF0FF] dark:bg-[#536BCE]/20 text-[#536BCE] font-semibold flex items-center gap-1 text-[11px]"
            >
              <Type className="w-3 h-3" />
              <span>Text</span>
            </button>
            <button
              type="button"
              className="px-2 py-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-[#727783] flex items-center gap-1 text-[11px]"
            >
              <Highlighter className="w-3 h-3" />
              <span className="hidden sm:inline">Highlight</span>
            </button>
            <button
              type="button"
              className="px-2 py-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-[#727783] flex items-center gap-1 text-[11px]"
            >
              <PenTool className="w-3 h-3" />
              <span className="hidden sm:inline">Sign</span>
            </button>
          </div>
        </div>

        {/* Workspace Body: Document Canvas + Side Inspector */}
        <div className="p-4 sm:p-6 bg-[#F7F8FA] dark:bg-[#0F131D] flex flex-col md:flex-row gap-5 items-stretch">
          {/* Main Document Paper Sheet */}
          <div className="flex-1 bg-white dark:bg-[#1A2030] rounded-xl border border-[#E9EBF0] dark:border-[#28314A] p-5 sm:p-6 shadow-xs flex flex-col justify-between min-h-[290px] relative">
            <div>
              {/* Document Letterhead */}
              <div className="flex items-center justify-between border-b border-[#E9EBF0] dark:border-[#28314A] pb-3 mb-4">
                <div>
                  <h4 className="text-sm font-bold text-[#20232B] dark:text-[#F8FAFC] tracking-tight">
                    MASTER SERVICES AGREEMENT
                  </h4>
                  <span className="text-[10px] font-mono text-[#727783] dark:text-[#9DA3AE]">
                    REF: GYANVATSALA-CORP-2026-X8
                  </span>
                </div>
                <div className="w-6 h-6 rounded-lg bg-[#536BCE]/15 flex items-center justify-center text-[#536BCE]">
                  <FileText className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Document Text Paragraphs with Selection Box */}
              <div className="flex flex-col gap-2.5 text-xs text-[#20232B] dark:text-[#CBD5E1]">
                <p className="leading-relaxed text-[11px] text-[#727783] dark:text-[#9DA3AE]">
                  This Agreement is entered into by and between the Client and the Provider. Both parties agree that all project deliverables, electronic documents, and confidential intellectual assets shall remain strictly managed.
                </p>

                {/* Highlighted / Editable Clause */}
                <div className="p-2.5 rounded-lg bg-[#EDF0FF]/80 dark:bg-[#536BCE]/15 border-2 border-[#536BCE] relative">
                  <span className="absolute -top-2.5 left-2 px-1.5 py-0.2 rounded bg-[#536BCE] text-[9px] font-mono font-bold text-white">
                    EDITABLE TEXT BLOCK
                  </span>
                  <p className="text-[11px] font-medium text-[#20232B] dark:text-[#F8FAFC]">
                    Section 4.2 (Data Sovereignty): All file parsing, PDF-to-Word reconstruction, and scanner transformations run entirely inside client device memory.
                  </p>
                </div>

                <p className="leading-relaxed text-[11px] text-[#727783] dark:text-[#9DA3AE]">
                  IN WITNESS WHEREOF, the parties hereto have executed this Agreement as of the effective date set forth above.
                </p>
              </div>
            </div>

            {/* Bottom Signature Line */}
            <div className="mt-4 pt-3 border-t border-[#E9EBF0] dark:border-[#28314A] flex items-center justify-between">
              <div>
                <span className="block text-[9px] font-mono text-[#727783]">AUTHORIZED SIGNATURE</span>
                <span className="font-serif italic text-xs text-[#536BCE] font-bold">
                  Authorized Executive
                </span>
              </div>
              <div className="flex items-center gap-1 text-[10px] font-mono text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-3 h-3" />
                <span>Verified Client-Side</span>
              </div>
            </div>
          </div>

          {/* Side Contextual Inspector Card */}
          <div className="w-full md:w-48 flex flex-col gap-3 shrink-0">
            {/* Inspector Panel */}
            <div className="p-3.5 rounded-xl bg-white dark:bg-[#1A2030] border border-[#E9EBF0] dark:border-[#28314A] shadow-xs">
              <span className="text-[10px] font-mono uppercase text-[#727783] dark:text-[#9DA3AE] font-semibold block mb-2">
                Document Details
              </span>
              <div className="flex flex-col gap-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#727783]">Pages:</span>
                  <span className="font-semibold text-[#20232B] dark:text-[#F8FAFC]">4 pages</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#727783]">Size:</span>
                  <span className="font-semibold text-[#20232B] dark:text-[#F8FAFC]">1.4 MB</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#727783]">Encoding:</span>
                  <span className="font-semibold text-[#536BCE]">Word Ready</span>
                </div>
              </div>
            </div>

            {/* Secondary Floating Scan Card (Analog FX preview) */}
            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-700 text-white shadow-xs flex flex-col gap-2 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-amber-400 font-bold uppercase">
                  Scan Studio FX
                </span>
                <span className="text-[9px] font-mono bg-amber-400/20 text-amber-300 px-1.5 py-0.2 rounded">
                  Tilt ±0.5°
                </span>
              </div>
              <p className="text-[10px] text-slate-300 leading-tight">
                Simulated photocopier noise & ink bleed active.
              </p>
              <div className="border border-dashed border-red-500/60 rounded px-1.5 py-1 text-center rotate-[-4deg]">
                <span className="text-[9px] font-mono text-red-400 font-bold tracking-widest">
                  OFFICIAL COPY
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import { ToolDefinition, PdfToolId } from '@/types/document';
import { ALL_PDF_TOOLS, getToolsByCategory } from '@/lib/toolRegistry';
import { ConversionCard } from './ConversionCard';
import {
  Search,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  FileText,
  FilePlus,
  FileMinus,
  Layers,
  Wrench,
  PenTool,
  LayoutGrid,
} from 'lucide-react';

interface PdfToolsHubProps {
  onSelectTool: (toolId: PdfToolId) => void;
}

export function PdfToolsHub({ onSelectTool }: PdfToolsHubProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const toPdfTools = getToolsByCategory('to-pdf');
  const fromPdfTools = getToolsByCategory('from-pdf');
  const utilityTools = getToolsByCategory('pdf-utility');

  // Filter tools if searching
  const filteredTools = searchQuery.trim()
    ? ALL_PDF_TOOLS.filter(
        (t) =>
          t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.shortDesc.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.fromFormat.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.toFormat.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : null;

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-10 flex flex-col gap-12">
      {/* Hero Header inspired by reference */}
      <div className="flex flex-col items-center text-center max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-[#2563EB] dark:text-[#60A5FA] text-xs font-bold mb-4 shadow-xs">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Complete Online PDF & Document Suite</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black text-[#0F172A] dark:text-[#F8FAFC] tracking-tight leading-tight">
          Convert your files with ease
        </h1>

        <p className="text-sm sm:text-base text-[#334155] dark:text-[#CBD5E1] mt-3 font-normal max-w-2xl leading-relaxed">
          Convert images, documents and PDFs into the formats you need. 100% processed in your browser with zero server uploads.
        </p>

        {/* Search Bar */}
        <div className="relative w-full max-w-md mt-6">
          <Search className="w-4 h-4 text-[#64748B] dark:text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search tools (e.g. Word to PDF, Merge, Excel...)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#CBD5E1] dark:border-[#475569] bg-white dark:bg-[#111827] text-xs text-[#0F172A] dark:text-[#F8FAFC] placeholder-[#64748B] dark:placeholder-[#94A3B8] shadow-xs focus:outline-none focus:ring-2 focus:ring-[#2563EB] dark:focus:ring-[#3B82F6] transition-all"
          />
        </div>

        {/* Featured Hero Banners: PDF Assembler & PDF Editor */}
        <div className="mt-6 w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* PDF Assembler Card */}
          <div
            onClick={() => onSelectTool('pdf-assembler')}
            className="p-5 rounded-2xl bg-gradient-to-r from-blue-700 via-indigo-600 to-cyan-600 text-white shadow-lg flex items-center justify-between gap-4 cursor-pointer hover:opacity-95 transition-all select-none hover:scale-[1.01]"
          >
            <div className="flex items-center gap-3.5 text-left">
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0 border border-white/30">
                <LayoutGrid className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white text-blue-700">
                    New Feature
                  </span>
                  <span className="text-[10px] text-cyan-200 font-semibold">Interactive</span>
                </div>
                <h3 className="text-sm sm:text-base font-extrabold text-white mt-1 leading-tight">
                  PDF Assembler – Page Management
                </h3>
                <p className="text-xs text-blue-100 mt-0.5 line-clamp-1">
                  Rearrange, alternate merge, and drag pages between documents.
                </p>
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-1 font-bold text-xs bg-white text-blue-600 px-3 py-1.5 rounded-xl shadow-xs shrink-0">
              <span>Assemble</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* PDF Editor Card */}
          <div
            onClick={() => onSelectTool('pdf-editor')}
            className="p-5 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white shadow-lg flex items-center justify-between gap-4 cursor-pointer hover:opacity-95 transition-all select-none hover:scale-[1.01]"
          >
            <div className="flex items-center gap-3.5 text-left">
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0 border border-white/30">
                <PenTool className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white text-indigo-700">
                    Full Suite
                  </span>
                  <span className="text-[10px] text-indigo-200 font-semibold">100% In-Browser</span>
                </div>
                <h3 className="text-sm sm:text-base font-extrabold text-white mt-1 leading-tight">
                  PDF Editor – Text & Docs
                </h3>
                <p className="text-xs text-indigo-100 mt-0.5 line-clamp-1">
                  Edit existing text directly, add signatures & whiteout.
                </p>
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-1 font-bold text-xs bg-white text-indigo-600 px-3 py-1.5 rounded-xl shadow-xs shrink-0">
              <span>Edit</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>
      </div>

      {/* If Search Active: Show Flat Search Grid */}
      {filteredTools ? (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-[#0F172A] dark:text-[#F8FAFC]">
              Search Results ({filteredTools.length})
            </h3>
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="text-xs font-semibold text-[#2563EB] dark:text-[#60A5FA] hover:underline"
            >
              Clear search
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTools.map((tool) => (
              <ConversionCard
                key={tool.id}
                tool={tool}
                onClick={() => onSelectTool(tool.id)}
              />
            ))}
          </div>
        </div>
      ) : (
        /* Standard Categorized Layout */
        <div className="flex flex-col gap-14">
          {/* Two-Column Section: Convert to PDF (Left) vs Convert from PDF (Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* LEFT COLUMN: CONVERT TO PDF */}
            <div className="flex flex-col gap-4 p-6 bg-slate-50/50 dark:bg-slate-900/30 rounded-3xl border border-[#CBD5E1] dark:border-[#334155]">
              <div className="flex items-center gap-2.5 pb-3 border-b border-[#CBD5E1] dark:border-[#334155]">
                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/50 text-[#2563EB] dark:text-[#60A5FA] flex items-center justify-center font-bold">
                  <FilePlus className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-[#0F172A] dark:text-[#F8FAFC] tracking-tight">
                    CONVERT TO PDF
                  </h2>
                  <p className="text-xs text-[#475569] dark:text-[#CBD5E1]">
                    Create high-quality PDF files from any document or image
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {toPdfTools.map((tool) => (
                  <ConversionCard
                    key={tool.id}
                    tool={tool}
                    onClick={() => onSelectTool(tool.id)}
                  />
                ))}
              </div>
            </div>

            {/* RIGHT COLUMN: CONVERT FROM PDF */}
            <div className="flex flex-col gap-4 p-6 bg-slate-50/50 dark:bg-slate-900/30 rounded-3xl border border-[#CBD5E1] dark:border-[#334155]">
              <div className="flex items-center gap-2.5 pb-3 border-b border-[#CBD5E1] dark:border-[#334155]">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                  <FileMinus className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-[#0F172A] dark:text-[#F8FAFC] tracking-tight">
                    CONVERT FROM PDF
                  </h2>
                  <p className="text-xs text-[#475569] dark:text-[#CBD5E1]">
                    Extract editable Office files, images, tables, and archival formats
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {fromPdfTools.map((tool) => (
                  <ConversionCard
                    key={tool.id}
                    tool={tool}
                    onClick={() => onSelectTool(tool.id)}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* BELOW TWO COLUMNS: MORE PDF TOOLS */}
          <div className="flex flex-col gap-5 pt-6 border-t border-[#CBD5E1] dark:border-[#334155]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
                  <Wrench className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-[#0F172A] dark:text-[#F8FAFC] tracking-tight">
                    More PDF Tools
                  </h2>
                  <p className="text-xs text-[#475569] dark:text-[#CBD5E1]">
                    Merge, split, compress, watermark, rotate, organize, and protect your PDF documents
                  </p>
                </div>
              </div>

              <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[#334155] dark:text-[#CBD5E1] font-bold border border-[#CBD5E1] dark:border-[#475569]">
                {utilityTools.length} Utilities
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {utilityTools.map((tool) => (
                <ConversionCard
                  key={tool.id}
                  tool={tool}
                  onClick={() => onSelectTool(tool.id)}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Security and Privacy Assurance Strip */}
      <div className="p-6 bg-white dark:bg-[#111827] border border-[#CBD5E1] dark:border-[#334155] rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-[#0F172A] dark:text-[#F8FAFC]">
              Privacy-First Zero-Upload Guarantee
            </h4>
            <p className="text-xs text-[#334155] dark:text-[#CBD5E1]">
              Every document is converted locally in your browser memory. Your files never touch external servers or cloud storage.
            </p>
          </div>
        </div>

        <div className="text-xs font-mono text-[#2563EB] dark:text-[#60A5FA] font-bold bg-blue-50 dark:bg-blue-950/50 px-3 py-1.5 rounded-lg border border-blue-200 dark:border-blue-800 shrink-0">
          100% In-Browser Execution
        </div>
      </div>
    </div>
  );
}

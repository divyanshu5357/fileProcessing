'use client';

import React, { useState } from 'react';
import { AnimatedSignatureSvg, ScanLaserBeam, ScanTiltCard } from './MotionPrimitives';
import Link from 'next/link';
import {
  FileText,
  ScanLine,
  Image as ImageIcon,
  PenTool,
  ArrowRight,
  Sliders,
  Check,
  Download,
  Eye,
  Layers,
  Sparkles,
  Zap,
  ShieldCheck,
  Split,
  Combine,
  Hash,
  Stamp,
  Maximize2,
  FileCheck,
  ChevronRight,
  RotateCw,
  Scissors,
  CheckCircle2,
} from 'lucide-react';

export function ProductShowcase() {
  const [activeTab, setActiveTab] = useState<'docs' | 'scan' | 'media' | 'canvas'>('docs');

  // Scan Studio state
  const [scanFilter, setScanFilter] = useState<'grayscale' | 'color' | 'bw'>('grayscale');
  const [scanNoise, setScanNoise] = useState(15);
  const [scanAngle, setScanAngle] = useState(1);

  // Media Studio state
  const [mediaQuality, setMediaQuality] = useState(80);
  const [targetFormat, setTargetFormat] = useState<'webp' | 'png' | 'jpg'>('webp');

  const products = [
    {
      id: 'docs' as const,
      title: 'Document Studio',
      description: 'Edit, convert, compress and organize your documents.',
      icon: FileText,
      badge: '24 Tools',
      route: '/pdf',
    },
    {
      id: 'scan' as const,
      title: 'Scan Studio',
      description: 'Give digital documents the look and feel of a physical scan.',
      icon: ScanLine,
      badge: 'Analog FX',
      route: '/scan-studio',
    },
    {
      id: 'media' as const,
      title: 'Media Studio',
      description: 'Prepare images for sharing, publishing and everyday work.',
      icon: ImageIcon,
      badge: 'Lossless',
      route: '/image-converter',
    },
    {
      id: 'canvas' as const,
      title: 'Canvas Editor',
      description: 'Make changes to your documents with precision and flexibility.',
      icon: PenTool,
      badge: 'Interactive',
      route: '/tools/pdf-editor',
    },
  ];

  return (
    <section id="showcase" className="w-full py-24 px-4 sm:px-6 lg:px-8 bg-[#F7F8FA] dark:bg-[#0E121B] border-t border-[#E9EBF0] dark:border-[#222632] transition-colors">
      <div className="max-w-7xl mx-auto flex flex-col gap-14">
        {/* Section Heading */}
        <div className="max-w-2xl">
          <span className="text-xs font-semibold text-[#536BCE] uppercase tracking-wider block mb-2">
            Integrated Product Suite
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#20232B] dark:text-[#F8FAFC] tracking-tight leading-tight">
            One workspace. More ways to get things done.
          </h2>
          <p className="text-base sm:text-lg text-[#4E5360] dark:text-[#9DA3AE] mt-3 leading-relaxed">
            From everyday document tasks to creative file workflows, everything works together.
          </p>
        </div>

        {/* Product Navigation Pills (Linear / Apple style tabs) */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
          {products.map((p) => {
            const Icon = p.icon;
            const isActive = activeTab === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setActiveTab(p.id)}
                className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-white dark:bg-[#1E2538] text-[#3B50B2] dark:text-[#93A5F5] font-bold shadow-sm border border-[#E9EBF0] dark:border-[#2B354F]'
                    : 'text-[#4E5360] dark:text-[#9DA3AE] hover:text-[#20232B] dark:hover:text-[#F8FAFC] hover:bg-white/60 dark:hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#3B50B2] dark:text-[#93A5F5]' : 'text-[#4E5360] dark:text-[#9DA3AE]'}`} />
                <span>{p.title}</span>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                    isActive
                      ? 'bg-[#EDF0FF] dark:bg-[#536BCE]/20 text-[#3B50B2] dark:text-[#93A5F5] font-semibold'
                      : 'bg-slate-200/60 dark:bg-slate-700/60 text-[#4E5360] dark:text-[#9DA3AE]'
                  }`}
                >
                  {p.badge}
                </span>
              </button>
            );
          })}
        </div>

        {/* ======================================================== */}
        {/* INTERACTIVE SHOWCASE CARD CONTAINER                     */}
        {/* ======================================================== */}
        <div className="rounded-3xl bg-white dark:bg-[#141824] border border-[#E9EBF0] dark:border-[#242B3E] p-6 sm:p-10 shadow-sm transition-all duration-300">
          {/* TAB 1: DOCUMENT STUDIO */}
          {activeTab === 'docs' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              <div className="lg:col-span-5 flex flex-col gap-5">
                <span className="text-xs font-semibold text-[#536BCE] uppercase tracking-wider">
                  Document Studio
                </span>
                <h3 className="text-2xl sm:text-3xl font-bold text-[#20232B] dark:text-[#F8FAFC] tracking-tight">
                  Edit, convert, compress and organize your documents.
                </h3>
                <p className="text-sm text-[#4E5360] dark:text-[#9DA3AE] leading-relaxed">
                  Turn locked PDFs into cleanly formatted Word documents, combine pages into clean presentation books, or compress heavy scans without text fuzziness.
                </p>

                <div className="flex flex-col gap-2.5 text-xs text-[#20232B] dark:text-[#F8FAFC] pt-1">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#0D7A5B] dark:text-emerald-400 shrink-0" />
                    <span>Native Word layout with preserved tables and headers</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#0D7A5B] dark:text-emerald-400 shrink-0" />
                    <span>Multi-file merge, burst split, and page rotation</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#0D7A5B] dark:text-emerald-400 shrink-0" />
                    <span>Instant export preview with folder destination picker</span>
                  </div>
                </div>

                <div className="pt-3">
                  <Link
                    href="/pdf"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#536BCE] hover:bg-[#4157B5] text-white text-sm font-semibold transition shadow-xs group"
                  >
                    <span>Convert PDF to Word, Merge &amp; Compress</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>
              </div>

              {/* Realistic Document Studio Interface Preview */}
              <div className="lg:col-span-7 rounded-2xl bg-[#F7F8FA] dark:bg-[#0D1017] border border-[#E9EBF0] dark:border-[#222632] p-5 shadow-xs">
                {/* Simulated App Bar */}
                <div className="flex items-center justify-between border-b border-[#E9EBF0] dark:border-[#222632] pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#536BCE]" />
                    <span className="text-xs font-semibold text-[#20232B] dark:text-[#F8FAFC]">
                      Financial_Audit_Report.pdf → .docx
                    </span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold">
                    Reconstruction Ready
                  </span>
                </div>

                {/* Page Thumbnails + Active Sheet */}
                <div className="grid grid-cols-12 gap-4">
                  {/* Page Thumbnails Column */}
                  <div className="col-span-3 flex flex-col gap-2">
                    {[1, 2, 3].map((page) => (
                      <div
                        key={page}
                        className={`p-2 rounded-lg border text-center transition cursor-pointer ${
                          page === 1
                            ? 'bg-white dark:bg-[#1E2538] border-[#536BCE] shadow-xs'
                            : 'bg-white/50 dark:bg-[#151926] border-[#E9EBF0] dark:border-[#28314A] opacity-60'
                        }`}
                      >
                        <div className="w-full aspect-[1/1.2] bg-slate-100 dark:bg-slate-800 rounded-xs mb-1 flex items-center justify-center text-[10px] text-slate-400">
                          P.{page}
                        </div>
                        <span className="text-[9px] font-mono text-[#4E5360] dark:text-[#9DA3AE]">Page {page}</span>
                      </div>
                    ))}
                  </div>

                  {/* Active Page Preview with Real Table */}
                  <div className="col-span-9 bg-white dark:bg-[#1A2030] rounded-xl border border-[#E9EBF0] dark:border-[#28314A] p-4 flex flex-col justify-between shadow-xs">
                    <div>
                      <div className="border-b border-slate-100 dark:border-slate-800 pb-2 mb-3">
                        <span className="text-xs font-bold text-[#20232B] dark:text-[#F8FAFC]">
                          Enterprise Operations — Q3 Performance Report
                        </span>
                        <span className="block text-[10px] text-[#4E5360] dark:text-[#9DA3AE]">
                          Doc ID: CORP-2026-X9 • Applied Systems & Analytics
                        </span>
                      </div>

                      {/* Reconstructed Table */}
                      <table className="w-full text-[10px] text-left border-collapse">
                        <thead>
                          <tr className="bg-[#EDF0FF] dark:bg-[#1E2538] text-[#3B50B2] dark:text-[#93A5F5] font-bold">
                            <th className="p-1.5 rounded-l">Metric</th>
                            <th className="p-1.5">Target</th>
                            <th className="p-1.5 rounded-r">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-[#4E5360] dark:text-[#9DA3AE]">
                          <tr>
                            <td className="p-1.5 font-medium text-[#20232B] dark:text-[#F8FAFC]">Layout Preservation</td>
                            <td className="p-1.5">100% Vector</td>
                            <td className="p-1.5 text-[#0D7A5B] dark:text-emerald-400 font-semibold">Matched</td>
                          </tr>
                          <tr>
                            <td className="p-1.5 font-medium text-[#20232B] dark:text-[#F8FAFC]">Embedded Figures</td>
                            <td className="p-1.5">High DPI PNG</td>
                            <td className="p-1.5 text-[#0D7A5B] dark:text-emerald-400 font-semibold">Extracted</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <div className="mt-3 pt-2 border-t border-[#E9EBF0] dark:border-[#28314A] flex items-center justify-between text-[10px] text-[#4E5360] dark:text-[#9DA3AE]">
                      <span>Processed in browser (0 uploads)</span>
                      <span className="font-semibold text-[#3B50B2] dark:text-[#93A5F5]">Export to Word (.docx)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SCAN STUDIO */}
          {activeTab === 'scan' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              <div className="lg:col-span-5 flex flex-col gap-5">
                <span className="text-xs font-semibold text-[#059669] uppercase tracking-wider">
                  Scan Studio
                </span>
                <h3 className="text-2xl sm:text-3xl font-bold text-[#20232B] dark:text-[#F8FAFC] tracking-tight">
                  Give digital documents the look and feel of a physical scan.
                </h3>
                <p className="text-sm text-[#4E5360] dark:text-[#9DA3AE] leading-relaxed">
                  Turn pristine digital PDFs and files into authentic scanned paperwork for formal administrative submissions, notarizations, and official records.
                </p>

                {/* Interactive Controls */}
                <div className="flex flex-col gap-3 p-4 rounded-xl border border-[#E9EBF0] dark:border-[#28314A] bg-[#F7F8FA] dark:bg-[#121624]">
                  {/* Tilt Slider */}
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between text-xs font-medium text-[#20232B] dark:text-[#F8FAFC]">
                      <span>Paper Skew Angle</span>
                      <span className="font-mono text-[#536BCE]">{scanAngle}°</span>
                    </div>
                    <input
                      type="range"
                      min="-3"
                      max="3"
                      step="0.5"
                      value={scanAngle}
                      onChange={(e) => setScanAngle(parseFloat(e.target.value))}
                      className="w-full accent-[#536BCE]"
                    />
                  </div>

                  {/* Colorspace Selector */}
                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="font-medium text-[#20232B] dark:text-[#F8FAFC]">Colorspace</span>
                    <div className="inline-flex rounded-lg border border-[#E9EBF0] dark:border-[#28314A] p-0.5 bg-white dark:bg-[#1E2538]">
                      {(['grayscale', 'color', 'bw'] as const).map((mode) => (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => setScanFilter(mode)}
                          aria-label={`Select ${mode === 'bw' ? 'black and white' : mode} colorspace`}
                          className={`px-2.5 py-1 rounded text-xs font-medium capitalize transition cursor-pointer ${
                            scanFilter === mode
                              ? 'bg-[#536BCE] text-white shadow-xs font-semibold'
                              : 'text-[#4E5360] dark:text-[#9DA3AE] hover:text-[#20232B] dark:hover:text-[#F8FAFC]'
                          }`}
                        >
                          {mode === 'bw' ? 'B&W' : mode}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <Link
                    href="/scan-studio"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#536BCE] hover:bg-[#4157B5] text-white text-sm font-semibold transition shadow-xs group"
                  >
                    <span>Simulate Photocopier Scans in Scan Studio FX</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>
              </div>

              {/* Scan Studio Before/After Live Preview */}
              <div className="lg:col-span-7 rounded-2xl bg-slate-900 border border-slate-800 p-6 flex items-center justify-center min-h-[300px]">
                <ScanTiltCard
                  baseAngle={scanAngle}
                  className="w-64 aspect-[1/1.3] bg-white rounded shadow-2xl p-4 flex flex-col justify-between relative overflow-hidden"
                  style={{
                    filter:
                      scanFilter === 'grayscale'
                        ? 'grayscale(100%) contrast(110%)'
                        : scanFilter === 'bw'
                        ? 'grayscale(100%) contrast(200%)'
                        : 'none',
                  }}
                >
                  <ScanLaserBeam tone="emerald" />
                  <div>
                    <div className="flex items-center justify-between border-b pb-1.5 border-black/80">
                      <span className="font-serif font-black text-xs text-black tracking-widest uppercase">
                        ATTESTED TRANSCRIPT
                      </span>
                      <span className="font-mono text-[8px] text-black">NO. 2026-X8</span>
                    </div>
                    <div className="mt-3 flex flex-col gap-1.5">
                      <div className="h-1.5 bg-black/80 rounded-xs w-4/5" />
                      <div className="h-1.5 bg-black/60 rounded-xs w-full" />
                      <div className="h-1.5 bg-black/60 rounded-xs w-3/4" />
                      <div className="h-1.5 bg-black/40 rounded-xs w-5/6" />
                    </div>
                  </div>

                  <div className="self-center border-2 border-red-700 text-red-700 rounded-lg p-1.5 text-center rotate-[-10deg] opacity-85">
                    <span className="block font-mono text-[9px] font-black uppercase tracking-wider">
                      VERIFIED COPY
                    </span>
                    <span className="block text-[7px] font-serif">REGISTRAR OFFICE</span>
                  </div>

                  <div className="flex justify-between items-end pt-2 border-t border-black/40 text-[7px] font-mono text-black">
                    <span>150 PPI // ARCHIVE</span>
                    <span className="underline decoration-wavy">Signature: ____________</span>
                  </div>
                </ScanTiltCard>
              </div>
            </div>
          )}

          {/* TAB 3: MEDIA STUDIO */}
          {activeTab === 'media' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              <div className="lg:col-span-5 flex flex-col gap-5">
                <span className="text-xs font-semibold text-[#D97706] uppercase tracking-wider">
                  Media Studio
                </span>
                <h3 className="text-2xl sm:text-3xl font-bold text-[#20232B] dark:text-[#F8FAFC] tracking-tight">
                  Prepare images for sharing, publishing and everyday work.
                </h3>
                <p className="text-sm text-[#4E5360] dark:text-[#9DA3AE] leading-relaxed">
                  Batch convert and optimize photos between WebP, AVIF, PNG, and JPG. Strip sensitive EXIF location tags and format biometric passport sheets with zero compression artifacts.
                </p>

                {/* Quality & Format Controls */}
                <div className="flex flex-col gap-3 p-4 rounded-xl border border-[#E9EBF0] dark:border-[#28314A] bg-[#F7F8FA] dark:bg-[#121624]">
                  <div className="flex justify-between text-xs font-medium text-[#20232B] dark:text-[#F8FAFC]">
                    <span>WebP Compression Quality</span>
                    <span className="font-mono text-[#3B50B2] dark:text-[#93A5F5]">{mediaQuality}%</span>
                  </div>
                  <input
                    type="range"
                    min="40"
                    max="100"
                    value={mediaQuality}
                    onChange={(e) => setMediaQuality(parseInt(e.target.value))}
                    className="w-full accent-[#536BCE]"
                  />
                  <div className="flex justify-between text-[11px] text-[#4E5360] dark:text-[#9DA3AE] pt-1">
                    <span>Raw PNG: 3.4 MB</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      Output: {Math.round(3400 * (mediaQuality / 100) * 0.2)} KB (-{Math.round(100 - (mediaQuality * 0.2))}%)
                    </span>
                  </div>
                </div>

                <div className="pt-2">
                  <Link
                    href="/image-converter"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#536BCE] hover:bg-[#4157B5] text-white text-sm font-semibold transition shadow-xs group"
                  >
                    <span>Convert JPG, PNG &amp; WebP or Reduce Photo KB</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>
              </div>

              {/* Media Studio Preview */}
              <div className="lg:col-span-7 grid grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-[#F7F8FA] dark:bg-[#121624] border border-[#E9EBF0] dark:border-[#28314A] flex flex-col gap-2">
                  <span className="text-[11px] font-semibold text-[#4E5360] dark:text-[#9DA3AE]">BEFORE (RAW PNG)</span>
                  <div className="w-full aspect-[4/3] rounded-xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center relative overflow-hidden">
                    <ImageIcon className="w-10 h-10 text-slate-400" />
                    <span className="absolute bottom-2 left-2 text-[10px] font-mono px-2 py-0.5 rounded bg-black/60 text-white font-bold">
                      3.4 MB
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 flex flex-col gap-2">
                  <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                    AFTER (WEBP LOSSLESS)
                  </span>
                  <div className="w-full aspect-[4/3] rounded-xl bg-emerald-100/50 dark:bg-emerald-900/30 flex items-center justify-center relative overflow-hidden">
                    <ImageIcon className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
                    <span className="absolute bottom-2 left-2 text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-700 text-white font-bold">
                      {Math.round(3400 * (mediaQuality / 100) * 0.2)} KB
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: CANVAS EDITOR */}
          {activeTab === 'canvas' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              <div className="lg:col-span-5 flex flex-col gap-5">
                <span className="text-xs font-semibold text-[#7C3AED] uppercase tracking-wider">
                  Canvas Editor
                </span>
                <h3 className="text-2xl sm:text-3xl font-bold text-[#20232B] dark:text-[#F8FAFC] tracking-tight">
                  Make changes to your documents with precision and flexibility.
                </h3>
                <p className="text-sm text-[#4E5360] dark:text-[#9DA3AE] leading-relaxed">
                  Direct Acrobat-grade document editing. Click anywhere to type, place images at exact coordinates, draw shapes, and add signatures without damaging original typography.
                </p>

                <div className="flex flex-col gap-2.5 text-xs text-[#20232B] dark:text-[#F8FAFC]">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#0D7A5B] dark:text-emerald-400" />
                    <span>Page-relative coordinates independent of zoom</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#0D7A5B] dark:text-emerald-400" />
                    <span>Auto-detection of font families and sizes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#0D7A5B] dark:text-emerald-400" />
                    <span>Layered PDF.js canvas with interactive bounding boxes</span>
                  </div>
                </div>

                <div className="pt-2">
                  <Link
                    href="/tools/pdf-editor"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#536BCE] hover:bg-[#4157B5] text-white text-sm font-semibold transition shadow-xs group"
                  >
                    <span>Open Free Online PDF Editor Without Watermark</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>
              </div>

              {/* Canvas Editor Mockup */}
              <div className="lg:col-span-7 rounded-2xl bg-white dark:bg-[#1E2538] border border-[#E9EBF0] dark:border-[#28314A] p-5 shadow-xs flex flex-col gap-3">
                <div className="flex items-center justify-between border-b border-[#E9EBF0] dark:border-[#28314A] pb-2 text-xs">
                  <span className="font-semibold text-[#20232B] dark:text-[#F8FAFC]">Active Document Canvas</span>
                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded bg-[#536BCE] text-white text-[10px] font-semibold">
                      Text Tool
                    </span>
                    <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px]">
                      Stamp
                    </span>
                  </div>
                </div>

                <div className="w-full aspect-[4/2.5] bg-[#F7F8FA] dark:bg-[#121622] rounded-xl border border-dashed border-[#536BCE] p-5 flex flex-col justify-between relative">
                  <div>
                    <span className="text-xs font-bold text-[#20232B] dark:text-[#F8FAFC]">
                      Section 3. Non-Disclosure &amp; IP Assignment
                    </span>
                    <p className="text-xs text-[#4E5360] dark:text-[#9DA3AE] mt-1.5">
                      All intellectual work created under this schedule shall remain proprietary. Click and drag to resize selection bounding boxes.
                    </p>
                  </div>
                  <div className="pt-3 border-t border-[#E2E6F0] dark:border-[#242B3E] flex justify-between items-end gap-4">
                    <div>
                      <span className="block text-[9px] font-mono text-[#4E5360] dark:text-[#9DA3AE] uppercase">
                        Signature Field
                      </span>
                      <AnimatedSignatureSvg className="w-28 h-7 text-[#3B50B2] dark:text-[#93A5F5]" />
                    </div>
                    <div className="text-right text-[10px] text-[#4E5360] dark:text-[#9DA3AE] font-mono">
                      <span className="block">X: 120.0pt, Y: 410.5pt</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                        Ready to Save
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

'use client';

import React, { useState } from 'react';
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
} from 'lucide-react';

export function InteractiveShowcase() {
  const [activeTab, setActiveTab] = useState<'docs' | 'scan' | 'image' | 'editor'>('docs');

  // Interactive slider states for Scan tab
  const [scanRotation, setScanRotation] = useState(1);
  const [scanNoise, setScanNoise] = useState(12);
  const [scanColorspace, setScanColorspace] = useState<'colorful' | 'grayscale' | 'bw'>('grayscale');

  // Interactive state for Image tab
  const [imageQuality, setImageQuality] = useState(85);

  return (
    <section id="explore-tools" className="w-full py-20 px-4 sm:px-6 lg:px-8 border-t border-[#E9E9E5] dark:border-[#222630] bg-white dark:bg-[#0D1017]">
      <div className="max-w-7xl mx-auto flex flex-col gap-12">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E9EDFC] dark:bg-[#536BCE]/20 border border-[#536BCE]/30 text-[#536BCE] dark:text-[#93A5F5] text-xs font-mono font-bold mb-3">
              <span>EXPLORE CAPABILITIES</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-[#20232A] dark:text-[#F8FAFC] tracking-tight">
              One seamless workspace. Four precision engines.
            </h2>
            <p className="text-base text-[#777C85] dark:text-[#9DA3AE] mt-2 leading-relaxed">
              Experience the interface before you upload. Every tool runs directly inside your browser with zero latency and zero data transfer.
            </p>
          </div>

          <Link
            href="/workspace"
            className="inline-flex items-center gap-2 text-sm font-bold text-[#536BCE] dark:text-[#93A5F5] hover:text-[#4157B5] dark:hover:text-[#BBC7FC] transition group"
          >
            <span>Launch Unified Workspace</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {/* Tab Navigation Controls */}
        <div className="flex items-center gap-2 border-b border-[#E9E9E5] dark:border-[#222630] overflow-x-auto no-scrollbar pb-px">
          {[
            { id: 'docs', label: 'Documents (PDF & Word)', icon: FileText, count: '24 Tools' },
            { id: 'scan', label: 'Scan Studio (Physical FX)', icon: ScanLine, count: 'Realistic' },
            { id: 'image', label: 'Media & WebP Studio', icon: ImageIcon, count: 'Lossless' },
            { id: 'editor', label: 'Interactive Canvas Editor', icon: PenTool, count: 'Acrobat Grade' },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2.5 px-5 py-3 border-b-2 font-medium text-sm transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'border-[#536BCE] text-[#536BCE] dark:text-[#93A5F5] font-bold bg-[#F7F8FD] dark:bg-[#151928] rounded-t-lg'
                    : 'border-transparent text-[#777C85] dark:text-[#9DA3AE] hover:text-[#20232A] dark:hover:text-[#F8FAFC]'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#536BCE] dark:text-[#93A5F5]' : ''}`} />
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                    isActive
                      ? 'bg-[#536BCE]/15 text-[#536BCE] dark:text-[#93A5F5] font-bold'
                      : 'bg-[#F1F2F6] dark:bg-[#1E2333] text-[#777C85]'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Interactive Mockup Container */}
        <div className="relative rounded-2xl border border-[#E9E9E5] dark:border-[#222630] bg-[#FAFAF8] dark:bg-[#11141E] p-6 lg:p-8 shadow-xs overflow-hidden">
          {/* Subtle Blueprint grid background */}
          <div
            className="absolute inset-0 pointer-events-none opacity-40 dark:opacity-20"
            style={{
              backgroundImage: `
                linear-gradient(to right, rgba(83, 107, 206, 0.08) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(83, 107, 206, 0.08) 1px, transparent 1px)
              `,
              backgroundSize: '20px 20px',
            }}
          />

          {/* TAB 1: DOCUMENTS (PDF TO WORD & MERGE) */}
          {activeTab === 'docs' && (
            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-5 flex flex-col gap-4">
                <span className="font-mono text-xs text-[#536BCE] dark:text-[#93A5F5] font-bold tracking-wider">
                  FEATURE SPOTLIGHT // NATIVE LAYOUT ENGINE
                </span>
                <h3 className="text-2xl font-black text-[#20232A] dark:text-[#F8FAFC] tracking-tight">
                  PDF to Word with Genuine Image & Column Preservation
                </h3>
                <p className="text-sm text-[#777C85] dark:text-[#9DA3AE] leading-relaxed">
                  Unlike converters that flatten pages into uneditable images or scramble multi-column layouts, Gyanvatsala reconstructs real Word tables, headers, headings, font styles, and high-DPI graphics side-by-side.
                </p>
                <div className="flex flex-col gap-2 mt-2">
                  <div className="flex items-center gap-2 text-xs text-[#20232A] dark:text-[#F8FAFC]">
                    <Check className="w-4 h-4 text-[#10B981]" />
                    <span>Side-by-side multi-column headers & institution logos</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[#20232A] dark:text-[#F8FAFC]">
                    <Check className="w-4 h-4 text-[#10B981]" />
                    <span>Exact table gridline and cell width reconstruction</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[#20232A] dark:text-[#F8FAFC]">
                    <Check className="w-4 h-4 text-[#10B981]" />
                    <span>Zero server uploads — 100% processed in browser WebAssembly</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 mt-4">
                  <Link
                    href="/pdf/pdf-to-word"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#536BCE] hover:bg-[#4157B5] text-white text-xs font-bold transition shadow-xs"
                  >
                    <span>Launch PDF to Word</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    href="/pdf"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#E9E9E5] dark:border-[#2B334B] bg-white dark:bg-[#1A2035] hover:bg-[#F7F8FD] text-xs font-bold text-[#20232A] dark:text-[#F8FAFC] transition"
                  >
                    <span>View All 24 PDF Tools</span>
                  </Link>
                </div>
              </div>

              {/* Document Visual Demo */}
              <div className="lg:col-span-7 bg-white dark:bg-[#161B2B] rounded-xl border border-[#E9E9E5] dark:border-[#28314A] p-5 shadow-xs">
                <div className="flex items-center justify-between border-b border-[#E9E9E5] dark:border-[#28314A] pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#536BCE]" />
                    <span className="font-mono text-xs font-bold text-[#20232A] dark:text-[#F8FAFC]">
                      Operations_Annual_Report.pdf → .docx
                    </span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold">
                    LAYOUT READY
                  </span>
                </div>

                {/* Simulated DOCX View with dual logo header */}
                <div className="rounded-lg border border-[#E9E9E5] dark:border-[#28314A] bg-[#FAFAF8] dark:bg-[#11141E] p-4 flex flex-col gap-3">
                  {/* Two Column Logo Header */}
                  <div className="grid grid-cols-2 gap-4 pb-3 border-b border-dashed border-[#CBD5E1] dark:border-[#334155]">
                    <div className="flex items-center gap-2 p-2 rounded bg-white dark:bg-[#1A2035] border border-[#E2E8F0] dark:border-[#334155]">
                      <div className="w-6 h-6 rounded bg-[#536BCE]/20 flex items-center justify-center text-[10px] font-bold text-[#536BCE]">
                        GV
                      </div>
                      <div className="text-[10px] font-bold text-[#20232A] dark:text-[#F8FAFC]">
                        Gyanvatsala Enterprise
                      </div>
                    </div>
                    <div className="flex items-center justify-end gap-2 p-2 rounded bg-white dark:bg-[#1A2035] border border-[#E2E8F0] dark:border-[#334155]">
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                        ISO 9001 Certified
                      </span>
                    </div>
                  </div>

                  {/* Title & Body Lines */}
                  <div className="text-center py-2">
                    <span className="font-bold text-sm text-[#20232A] dark:text-[#F8FAFC] tracking-wide">
                      ANNUAL AUDIT & PERFORMANCE SPECIFICATION
                    </span>
                    <p className="text-[11px] text-[#777C85] dark:text-[#9DA3AE] mt-0.5">
                      Distributed Systems Architecture & Infrastructure Group
                    </p>
                  </div>

                  {/* Table Sample */}
                  <div className="rounded border border-[#E2E8F0] dark:border-[#2E374E] overflow-hidden text-[10px]">
                    <div className="grid grid-cols-3 bg-[#E9EDFC] dark:bg-[#1F273E] p-1.5 font-bold text-[#20232A] dark:text-[#F8FAFC]">
                      <span>Parameter</span>
                      <span>Target Spec</span>
                      <span>Engine Status</span>
                    </div>
                    <div className="grid grid-cols-3 p-1.5 border-t border-[#E2E8F0] dark:border-[#2E374E] text-[#64748B] dark:text-[#94A3B8]">
                      <span>Typography</span>
                      <span>Vector Match</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold">100% Native</span>
                    </div>
                    <div className="grid grid-cols-3 p-1.5 border-t border-[#E2E8F0] dark:border-[#2E374E] text-[#64748B] dark:text-[#94A3B8]">
                      <span>Image Extraction</span>
                      <span>High-DPI Lossless</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Rendered in Word</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SCAN STUDIO (PHYSICAL SCAN EFFECT GENERATOR) */}
          {activeTab === 'scan' && (
            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-5 flex flex-col gap-4">
                <span className="font-mono text-xs text-[#536BCE] dark:text-[#93A5F5] font-bold tracking-wider">
                  SCAN STUDIO // ANALOG TEXTURE SHADER
                </span>
                <h3 className="text-2xl font-black text-[#20232A] dark:text-[#F8FAFC] tracking-tight">
                  Turn Clean Digital PDFs into Authentic Scanned Documents
                </h3>
                <p className="text-sm text-[#777C85] dark:text-[#9DA3AE] leading-relaxed">
                  Need a physical, scanned look for formal submissions or verification? Simulate genuine photocopier artifacts with sub-pixel rotation jitter, paper grain, edge border, and official ink stamps.
                </p>

                {/* Interactive Controls */}
                <div className="flex flex-col gap-3 p-4 rounded-xl border border-[#E9E9E5] dark:border-[#28314A] bg-white dark:bg-[#161B2B]">
                  {/* Rotation Slider */}
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-[#20232A] dark:text-[#F8FAFC]">Rotational Tilt:</span>
                      <span className="text-[#536BCE] font-bold">{scanRotation}°</span>
                    </div>
                    <input
                      type="range"
                      min="-3"
                      max="3"
                      step="0.5"
                      value={scanRotation}
                      onChange={(e) => setScanRotation(parseFloat(e.target.value))}
                      className="w-full accent-[#536BCE]"
                    />
                  </div>

                  {/* Noise Slider */}
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-[#20232A] dark:text-[#F8FAFC]">Paper Noise & Grain:</span>
                      <span className="text-[#536BCE] font-bold">{scanNoise}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="40"
                      value={scanNoise}
                      onChange={(e) => setScanNoise(parseInt(e.target.value))}
                      className="w-full accent-[#536BCE]"
                    />
                  </div>

                  {/* Colorspace toggle */}
                  <div className="flex items-center justify-between text-xs font-mono pt-1">
                    <span className="text-[#20232A] dark:text-[#F8FAFC]">Colorspace:</span>
                    <div className="inline-flex rounded-lg border border-[#E9E9E5] dark:border-[#2E374E] p-0.5 bg-slate-50 dark:bg-[#1A2035]">
                      {(['grayscale', 'colorful', 'bw'] as const).map((mode) => (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => setScanColorspace(mode)}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold capitalize transition ${
                            scanColorspace === mode
                              ? 'bg-[#536BCE] text-white'
                              : 'text-[#777C85] dark:text-[#9DA3AE]'
                          }`}
                        >
                          {mode === 'bw' ? 'B&W' : mode}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 mt-2">
                  <Link
                    href="/scan-studio"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#536BCE] hover:bg-[#4157B5] text-white text-xs font-bold transition shadow-xs"
                  >
                    <span>Open Scan Studio</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>

              {/* Dynamic Scan Preview */}
              <div className="lg:col-span-7 bg-slate-900 rounded-xl border border-slate-700 p-6 flex items-center justify-center min-h-[320px]">
                <div
                  className="w-64 aspect-[1/1.3] bg-white rounded shadow-2xl p-4 flex flex-col justify-between transition-transform duration-200 relative overflow-hidden"
                  style={{
                    transform: `rotate(${scanRotation}deg)`,
                    filter:
                      scanColorspace === 'grayscale'
                        ? `grayscale(100%) contrast(110%)`
                        : scanColorspace === 'bw'
                        ? `grayscale(100%) contrast(200%)`
                        : 'none',
                  }}
                >
                  {/* Noise overlay */}
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      opacity: scanNoise / 100,
                      backgroundImage: `radial-gradient(circle, #000000 1px, transparent 1px)`,
                      backgroundSize: '4px 4px',
                    }}
                  />

                  {/* Header */}
                  <div>
                    <div className="flex items-center justify-between border-b pb-1.5 border-black/80">
                      <span className="font-serif font-black text-xs text-black tracking-widest uppercase">
                        OFFICIAL ATTESTATION
                      </span>
                      <span className="font-mono text-[8px] text-black">NO. 89410</span>
                    </div>
                    <div className="mt-3 flex flex-col gap-1.5">
                      <div className="h-1.5 bg-black/80 rounded-xs w-4/5" />
                      <div className="h-1.5 bg-black/60 rounded-xs w-full" />
                      <div className="h-1.5 bg-black/60 rounded-xs w-3/4" />
                      <div className="h-1.5 bg-black/40 rounded-xs w-5/6" />
                    </div>
                  </div>

                  {/* Center Stamp */}
                  <div className="self-center border-2 border-red-700 text-red-700 rounded-lg p-1.5 text-center rotate-[-12deg] opacity-85">
                    <span className="block font-mono text-[9px] font-black uppercase tracking-wider">
                      VERIFIED COPY
                    </span>
                    <span className="block text-[7px] font-serif">REGISTRAR OFFICE</span>
                  </div>

                  {/* Footer & Signature line */}
                  <div className="flex justify-between items-end pt-2 border-t border-black/40 text-[7px] font-mono text-black">
                    <span>150 PPI // ARCHIVE</span>
                    <span className="underline decoration-wavy">Signature: ____________</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: IMAGE & MEDIA STUDIO */}
          {activeTab === 'image' && (
            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-5 flex flex-col gap-4">
                <span className="font-mono text-xs text-[#536BCE] dark:text-[#93A5F5] font-bold tracking-wider">
                  IMAGE STUDIO // MULTI-THREADED ENCODER
                </span>
                <h3 className="text-2xl font-black text-[#20232A] dark:text-[#F8FAFC] tracking-tight">
                  Lossless WebP, AVIF & High-Speed Batch Compression
                </h3>
                <p className="text-sm text-[#777C85] dark:text-[#9DA3AE] leading-relaxed">
                  Reduce image payloads up to 85% with zero perceivable fidelity loss. Strip EXIF geolocation data, adjust crop ratios, and build official passport photo sheets locally on your device.
                </p>

                <div className="flex flex-col gap-2 p-4 rounded-xl border border-[#E9E9E5] dark:border-[#28314A] bg-white dark:bg-[#161B2B]">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-[#20232A] dark:text-[#F8FAFC]">Compression Quality:</span>
                    <span className="text-[#536BCE] font-bold">{imageQuality}%</span>
                  </div>
                  <input
                    type="range"
                    min="30"
                    max="100"
                    value={imageQuality}
                    onChange={(e) => setImageQuality(parseInt(e.target.value))}
                    className="w-full accent-[#536BCE]"
                  />
                  <div className="flex items-center justify-between text-[11px] text-[#777C85] dark:text-[#9DA3AE] pt-1">
                    <span>Original: 4.8 MB (PNG)</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      Output: {Math.round(4800 * (imageQuality / 100) * 0.18)} KB (WebP) • -{Math.round(100 - (imageQuality * 0.18))}%
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 mt-2">
                  <Link
                    href="/image-converter"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#536BCE] hover:bg-[#4157B5] text-white text-xs font-bold transition shadow-xs"
                  >
                    <span>Launch Image Studio</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>

              {/* Image Preview Comparison */}
              <div className="lg:col-span-7 bg-white dark:bg-[#161B2B] rounded-xl border border-[#E9E9E5] dark:border-[#28314A] p-5 shadow-xs">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <span className="text-[11px] font-mono font-bold text-[#777C85]">BEFORE (RAW PNG)</span>
                    <div className="w-full aspect-[4/3] rounded-lg bg-slate-200 dark:bg-slate-800 flex items-center justify-center relative overflow-hidden">
                      <ImageIcon className="w-12 h-12 text-slate-400" />
                      <span className="absolute bottom-2 left-2 text-[10px] font-mono px-2 py-0.5 rounded bg-black/60 text-white font-bold">
                        4.8 MB
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <span className="text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      AFTER (WEBP LOSSLESS)
                    </span>
                    <div className="w-full aspect-[4/3] rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 flex items-center justify-center relative overflow-hidden">
                      <ImageIcon className="w-12 h-12 text-emerald-500" />
                      <span className="absolute bottom-2 left-2 text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-700 text-white font-bold">
                        {Math.round(4800 * (imageQuality / 100) * 0.18)} KB
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: INTERACTIVE CANVAS EDITOR */}
          {activeTab === 'editor' && (
            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-5 flex flex-col gap-4">
                <span className="font-mono text-xs text-[#536BCE] dark:text-[#93A5F5] font-bold tracking-wider">
                  CANVAS EDITOR // ACROBAT-GRADE ENGINE
                </span>
                <h3 className="text-2xl font-black text-[#20232A] dark:text-[#F8FAFC] tracking-tight">
                  Direct In-Place PDF Text, Shape, Stamp & Signature Editing
                </h3>
                <p className="text-sm text-[#777C85] dark:text-[#9DA3AE] leading-relaxed">
                  Edit PDF pages directly on an interactive multi-layered canvas. Place images at the exact drop coordinate, auto-detect font family & size, draw vectors, and preserve page aspect ratio.
                </p>

                <div className="flex flex-col gap-2 text-xs">
                  <div className="flex items-center gap-2 text-[#20232A] dark:text-[#F8FAFC]">
                    <Check className="w-4 h-4 text-[#10B981]" />
                    <span>Layered PDF.js canvas with drag & resize bounding boxes</span>
                  </div>
                  <div className="flex items-center gap-2 text-[#20232A] dark:text-[#F8FAFC]">
                    <Check className="w-4 h-4 text-[#10B981]" />
                    <span>Page-relative coordinates independent of screen zoom</span>
                  </div>
                  <div className="flex items-center gap-2 text-[#20232A] dark:text-[#F8FAFC]">
                    <Check className="w-4 h-4 text-[#10B981]" />
                    <span>Export Preview modal with custom renaming & local folder picker</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 mt-4">
                  <Link
                    href="/tools/pdf-editor"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#536BCE] hover:bg-[#4157B5] text-white text-xs font-bold transition shadow-xs"
                  >
                    <span>Open Interactive Editor</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>

              {/* Editor Mockup */}
              <div className="lg:col-span-7 bg-[#1E2333] rounded-xl border border-[#2E374E] p-4 flex flex-col gap-3 shadow-md">
                {/* Simulated Editor Toolbar */}
                <div className="flex items-center justify-between border-b border-[#2E374E] pb-2 text-xs text-white">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#93A5F5]">Editing Layer</span>
                    <span className="font-mono text-[10px] text-slate-400">100% Zoom</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded bg-[#536BCE] text-[10px] font-bold">Text</span>
                    <span className="px-2 py-0.5 rounded bg-slate-700 text-[10px]">Image</span>
                    <span className="px-2 py-0.5 rounded bg-slate-700 text-[10px]">Stamp</span>
                  </div>
                </div>

                {/* Canvas Workspace View */}
                <div className="w-full aspect-[4/2.5] bg-white rounded flex items-center justify-center relative p-6">
                  {/* Document page with bounding box */}
                  <div className="w-full h-full border-2 border-dashed border-[#536BCE] rounded p-4 relative flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-slate-800">Section 2. Executive Summary</span>
                      <span className="text-[9px] font-mono bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
                        Active Bounding Box
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 font-sans">
                      Click anywhere on the document canvas to place annotations, insert images at coordinate (x, y), or redact sensitive information.
                    </p>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                      <span>Coordinates: X: 142.5pt, Y: 388.0pt</span>
                      <span>Page 1 of 1</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Popular Tools Quick Grid */}
        <div className="flex flex-col gap-6 pt-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-[#20232A] dark:text-[#F8FAFC]">
              Popular Document & Image Utilities
            </h3>
            <Link
              href="/pdf"
              className="text-xs font-bold text-[#536BCE] dark:text-[#93A5F5] hover:underline"
            >
              View Full Tool Suite (24+) →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                title: 'PDF to Word Converter',
                desc: 'Reconstruct DOCX with native tables, multi-column headers & vector fonts.',
                href: '/pdf/pdf-to-word',
                tag: 'High-Fidelity',
                icon: FileText,
              },
              {
                title: 'Merge PDF Documents',
                desc: 'Combine multiple PDFs into a single file in any desired sequence.',
                href: '/pdf/merge-pdf',
                tag: 'Lossless',
                icon: Combine,
              },
              {
                title: 'Scan Effect Studio',
                desc: 'Photocopier simulation with rotational jitter, noise, and paper grain.',
                href: '/scan-studio',
                tag: 'Analog FX',
                icon: ScanLine,
              },
              {
                title: 'Add Page Numbers',
                desc: 'Customized headers or footers with "Page X of Y" formatting and margins.',
                href: '/pdf/page-numbers',
                tag: 'Formatting',
                icon: Hash,
              },
              {
                title: 'Image Compression & WebP',
                desc: 'Shrink PNG, JPG, and AVIF photos up to 85% with client-side canvas.',
                href: '/image-converter',
                tag: 'Batch Engine',
                icon: ImageIcon,
              },
              {
                title: 'Split & Extract Pages',
                desc: 'Extract specific page ranges or burst all pages into individual files.',
                href: '/pdf/split-pdf',
                tag: 'Modular',
                icon: Split,
              },
              {
                title: 'PDF Watermark & Stamp',
                desc: 'Stamp official draft badges, confidential labels, or custom signatures.',
                href: '/pdf/watermark-pdf',
                tag: 'Security',
                icon: Stamp,
              },
              {
                title: 'Interactive PDF Editor',
                desc: 'Multi-layer document canvas for Acrobat-style annotation and image placement.',
                href: '/tools/pdf-editor',
                tag: 'Canvas WASM',
                icon: PenTool,
              },
            ].map((tool, idx) => {
              const Icon = tool.icon;
              return (
                <Link
                  key={idx}
                  href={tool.href}
                  className="group flex flex-col justify-between p-5 rounded-xl border border-[#E9E9E5] dark:border-[#222630] bg-[#FAFAF8] dark:bg-[#121624] hover:border-[#536BCE] dark:hover:border-[#536BCE] hover:shadow-sm transition-all"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-8 h-8 rounded-lg bg-[#E9EDFC] dark:bg-[#536BCE]/20 flex items-center justify-center text-[#536BCE] dark:text-[#93A5F5]">
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white dark:bg-[#1E2333] border border-[#E9E9E5] dark:border-[#2E374E] text-[#777C85] dark:text-[#9DA3AE] font-semibold">
                        {tool.tag}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-[#20232A] dark:text-[#F8FAFC] group-hover:text-[#536BCE] transition">
                      {tool.title}
                    </h4>
                    <p className="text-xs text-[#777C85] dark:text-[#9DA3AE] mt-1.5 leading-relaxed">
                      {tool.desc}
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-[#E9E9E5] dark:border-[#1E2333] flex items-center text-xs font-bold text-[#536BCE] dark:text-[#93A5F5]">
                    <span>Open Tool</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-1 transition-transform group-hover:translate-x-1" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

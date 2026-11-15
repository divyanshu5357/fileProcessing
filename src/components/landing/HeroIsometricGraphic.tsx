'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export function HeroIsometricGraphic() {
  const [isHovered, setIsHovered] = useState(false);
  const [activeChip, setActiveChip] = useState<'pdf' | 'scan' | 'privacy'>('pdf');

  return (
    <div
      className="relative w-full aspect-[4/3.8] sm:aspect-[4/3.5] lg:aspect-[4/3.6] max-w-xl mx-auto rounded-2xl border border-[#E9E9E5] dark:border-[#222630] bg-[#F7F8FD] dark:bg-[#121624] p-4 sm:p-6 shadow-sm overflow-hidden select-none transition-all duration-300 group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Blueprint Grid Background Pattern */}
      <div
        className="absolute inset-0 pointer-events-none opacity-60 dark:opacity-40"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(83, 107, 206, 0.12) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(83, 107, 206, 0.12) 1px, transparent 1px)
          `,
          backgroundSize: '24px 24px',
        }}
      />

      {/* Blueprint Corner Crosshairs / Ticks */}
      <span className="absolute top-2.5 left-2.5 font-mono text-xs text-[#536BCE]/50 pointer-events-none">+</span>
      <span className="absolute top-2.5 right-2.5 font-mono text-xs text-[#536BCE]/50 pointer-events-none">+</span>
      <span className="absolute bottom-2.5 left-2.5 font-mono text-xs text-[#536BCE]/50 pointer-events-none">+</span>
      <span className="absolute bottom-2.5 right-2.5 font-mono text-xs text-[#536BCE]/50 pointer-events-none">+</span>

      {/* Blueprint Coordinate Status Bar (top-left) */}
      <div className="absolute top-3 left-4 z-10 flex items-center gap-2">
        <span className="inline-block w-2 h-2 rounded-full bg-[#536BCE] animate-pulse" />
        <span className="font-mono text-[10px] tracking-widest uppercase text-[#536BCE] dark:text-[#93A5F5] font-semibold">
          SYS.ENGINE // CLIENT_WASM_V2
        </span>
      </div>

      {/* Isometric Stage SVG */}
      <div
        className={`w-full h-full flex items-center justify-center transition-transform duration-700 ease-out ${
          isHovered ? 'scale-[1.02] -translate-y-1' : 'scale-100'
        }`}
      >
        <svg
          viewBox="0 0 520 440"
          className="w-full h-full overflow-visible drop-shadow-md"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* DEFINITIONS & GRADIENTS */}
          <defs>
            <linearGradient id="prismGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#536BCE" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#7A91ED" stopOpacity="0.06" />
            </linearGradient>
            <linearGradient id="sheetGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="100%" stopColor="#F5F6FA" />
            </linearGradient>
            <linearGradient id="sheetGradientDark" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1E2333" />
              <stop offset="100%" stopColor="#171A27" />
            </linearGradient>
            <filter id="dropShadowSheet" x="-10%" y="-10%" width="125%" height="135%">
              <feDropShadow dx="0" dy="12" stdDeviation="10" floodColor="#536BCE" floodOpacity="0.15" />
            </filter>
          </defs>

          {/* ======================================================== */}
          {/* SHEET 1: BOTTOM ARCHIVAL PAPER (ISOMETRIC)               */}
          {/* ======================================================== */}
          <g transform="translate(18, 48)">
            {/* Sheet Polygon */}
            <polygon
              points="260,250 430,345 260,430 90,335"
              fill="#E3E6F3"
              stroke="#CBD2E8"
              strokeWidth="1.2"
              className="dark:fill-[#1A1F2F] dark:stroke-[#2B334B]"
            />
            {/* 3-hole punch holes on left edge */}
            <circle cx="120" cy="320" r="3.5" fill="#C5CCE3" className="dark:fill-[#121624]" />
            <circle cx="155" cy="300" r="3.5" fill="#C5CCE3" className="dark:fill-[#121624]" />
            <circle cx="190" cy="280" r="3.5" fill="#C5CCE3" className="dark:fill-[#121624]" />
          </g>

          {/* ======================================================== */}
          {/* SHEET 2: MIDDLE DATA SHEET (ISOMETRIC)                   */}
          {/* ======================================================== */}
          <g transform="translate(9, 24)">
            <polygon
              points="260,230 430,325 260,410 90,315"
              fill="#EFF2FA"
              stroke="#D2DAF0"
              strokeWidth="1.2"
              className="dark:fill-[#21273B] dark:stroke-[#343E5C]"
            />
            {/* 3-hole punch holes */}
            <circle cx="120" cy="300" r="3.5" fill="#D2DAF0" className="dark:fill-[#141826]" />
            <circle cx="155" cy="280" r="3.5" fill="#D2DAF0" className="dark:fill-[#141826]" />
            <circle cx="190" cy="260" r="3.5" fill="#D2DAF0" className="dark:fill-[#141826]" />

            {/* Simulated subtle data lines */}
            <line x1="210" y1="290" x2="330" y2="355" stroke="#CBD5E1" strokeWidth="2" strokeDasharray="6 4" />
            <line x1="180" y1="315" x2="300" y2="380" stroke="#CBD5E1" strokeWidth="2" strokeDasharray="8 6" />
          </g>

          {/* ======================================================== */}
          {/* SHEET 3: TOP ACTIVE DOCUMENT (HIGH-FIDELITY ISOMETRIC)   */}
          {/* ======================================================== */}
          <g filter="url(#dropShadowSheet)">
            {/* Main Sheet Polygon */}
            <polygon
              points="260,205 430,300 260,385 90,290"
              fill="url(#sheetGradient)"
              className="dark:fill-[#1E2333]"
              stroke="#536BCE"
              strokeWidth="1.8"
            />

            {/* 3-hole punch holes on left margin */}
            <circle cx="120" cy="275" r="4" fill="#E2E8F0" className="dark:fill-[#121624]" stroke="#94A3B8" strokeWidth="1" />
            <circle cx="155" cy="255" r="4" fill="#E2E8F0" className="dark:fill-[#121624]" stroke="#94A3B8" strokeWidth="1" />
            <circle cx="190" cy="235" r="4" fill="#E2E8F0" className="dark:fill-[#121624]" stroke="#94A3B8" strokeWidth="1" />

            {/* Document Header Bar */}
            <polygon
              points="225,230 380,317 360,328 205,241"
              fill="#536BCE"
              fillOpacity="0.15"
            />
            {/* Document Title Line */}
            <line x1="235" y1="240" x2="340" y2="299" stroke="#536BCE" strokeWidth="3" strokeLinecap="round" />

            {/* Section Divider */}
            <line x1="200" y1="260" x2="390" y2="366" stroke="#E2E8F0" strokeWidth="1.5" className="dark:stroke-[#334155]" />

            {/* Table Header Row */}
            <polygon
              points="165,280 230,243 370,322 305,358"
              fill="#536BCE"
              fillOpacity="0.08"
            />
            {/* Table Line Rows */}
            <line x1="175" y1="295" x2="350" y2="393" stroke="#94A3B8" strokeWidth="1.2" strokeDasharray="3 3" />
            <line x1="150" y1="310" x2="320" y2="405" stroke="#94A3B8" strokeWidth="1.2" strokeDasharray="3 3" />

            {/* Simulated Text Lines */}
            <line x1="180" y1="275" x2="270" y2="325" stroke="#64748B" strokeWidth="2" strokeLinecap="round" />
            <line x1="195" y1="290" x2="280" y2="338" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="210" y1="305" x2="290" y2="350" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" />

            {/* Verification Stamp / Seal in Isometric space */}
            <g transform="translate(330, 310)">
              <ellipse cx="0" cy="0" rx="22" ry="12" fill="#536BCE" fillOpacity="0.1" stroke="#536BCE" strokeWidth="1.5" strokeDasharray="4 2" />
              <ellipse cx="0" cy="0" rx="17" ry="9" fill="none" stroke="#536BCE" strokeWidth="1" />
              <text
                x="0"
                y="3"
                textAnchor="middle"
                fontSize="7"
                fontFamily="monospace"
                fontWeight="bold"
                fill="#536BCE"
                transform="rotate(27)"
              >
                VERIFIED
              </text>
            </g>
          </g>

          {/* ======================================================== */}
          {/* SUSPENDED ISOMETRIC WIREFRAME PRISM (CEILING & CORNERS) */}
          {/* ======================================================== */}
          {/* Vertical Corner Pillar Guidelines */}
          {/* Left Corner: (90, 290) -> (90, 110) */}
          <line x1="90" y1="290" x2="90" y2="110" stroke="#536BCE" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.6" />
          {/* Back Corner: (260, 205) -> (260, 25) */}
          <line x1="260" y1="205" x2="260" y2="25" stroke="#536BCE" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.6" />
          {/* Right Corner: (430, 300) -> (430, 120) */}
          <line x1="430" y1="300" x2="430" y2="120" stroke="#536BCE" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.6" />
          {/* Front Corner: (260, 385) -> (260, 205) */}
          <line x1="260" y1="385" x2="260" y2="205" stroke="#536BCE" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.6" />

          {/* Suspended Top Isometric Ceiling Plane */}
          <polygon
            points="260,25 430,120 260,205 90,110"
            fill="url(#prismGradient)"
            stroke="#536BCE"
            strokeWidth="2"
          />

          {/* Cross Coordinate Guidelines inside Top Prism */}
          <line x1="260" y1="25" x2="260" y2="205" stroke="#536BCE" strokeWidth="0.8" strokeDasharray="2 3" opacity="0.5" />
          <line x1="90" y1="110" x2="430" y2="120" stroke="#536BCE" strokeWidth="0.8" strokeDasharray="2 3" opacity="0.5" />

          {/* Hovering Center Mark (Geometric Gyanvatsala Icon) in Center of Top Prism */}
          <g transform="translate(260, 115)">
            <ellipse cx="0" cy="0" rx="36" ry="20" fill="#536BCE" fillOpacity="0.18" />
            <polygon
              points="0,-16 24,-2 0,12 -24,-2"
              fill="#536BCE"
              stroke="#FFFFFF"
              strokeWidth="1.5"
            />
            <polygon
              points="0,-7 14,1 0,9 -14,1"
              fill="#7B93EE"
            />
          </g>

          {/* Corner Coordinate Pins */}
          <circle cx="260" cy="25" r="3.5" fill="#536BCE" stroke="#FFFFFF" strokeWidth="1.5" />
          <circle cx="430" cy="120" r="3.5" fill="#536BCE" stroke="#FFFFFF" strokeWidth="1.5" />
          <circle cx="260" cy="205" r="3.5" fill="#536BCE" stroke="#FFFFFF" strokeWidth="1.5" />
          <circle cx="90" cy="110" r="3.5" fill="#536BCE" stroke="#FFFFFF" strokeWidth="1.5" />
        </svg>
      </div>

      {/* ======================================================== */}
      {/* FLOATING TECHNICAL ANNOTATION CHIPS                      */}
      {/* ======================================================== */}

      {/* Chip 1: Native Layout Preservation (Top Right) */}
      <button
        type="button"
        onClick={() => setActiveChip('pdf')}
        className={`absolute top-10 right-4 sm:right-6 z-20 flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-mono backdrop-blur-md shadow-xs transition-all ${
          activeChip === 'pdf'
            ? 'bg-white dark:bg-[#1A2035] border-[#536BCE] text-[#536BCE] dark:text-[#93A5F5] ring-2 ring-[#536BCE]/20'
            : 'bg-white/80 dark:bg-[#1A2035]/80 border-[#E9E9E5] dark:border-[#2B334B] text-[#777C85] dark:text-[#9DA3AE] hover:border-[#536BCE]/50'
        }`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-[#536BCE]" />
        <span className="font-semibold">PDF → Word // 100% Native Layout</span>
      </button>

      {/* Chip 2: Zero Server Uploads (Bottom Left) */}
      <button
        type="button"
        onClick={() => setActiveChip('privacy')}
        className={`absolute bottom-10 left-4 sm:left-6 z-20 flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-mono backdrop-blur-md shadow-xs transition-all ${
          activeChip === 'privacy'
            ? 'bg-white dark:bg-[#1A2035] border-[#10B981] text-[#059669] dark:text-[#34D399] ring-2 ring-[#10B981]/20'
            : 'bg-white/80 dark:bg-[#1A2035]/80 border-[#E9E9E5] dark:border-[#2B334B] text-[#777C85] dark:text-[#9DA3AE] hover:border-[#10B981]/50'
        }`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
        <span className="font-semibold">Zero Server Uploads // Device WASM</span>
      </button>

      {/* Chip 3: Photocopier Scan Shader (Bottom Right) */}
      <button
        type="button"
        onClick={() => setActiveChip('scan')}
        className={`absolute bottom-4 right-4 sm:right-6 z-20 hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-mono backdrop-blur-md shadow-xs transition-all ${
          activeChip === 'scan'
            ? 'bg-white dark:bg-[#1A2035] border-[#F59E0B] text-[#D97706] dark:text-[#FBBF24] ring-2 ring-[#F59E0B]/20'
            : 'bg-white/80 dark:bg-[#1A2035]/80 border-[#E9E9E5] dark:border-[#2B334B] text-[#777C85] dark:text-[#9DA3AE] hover:border-[#F59E0B]/50'
        }`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]" />
        <span className="font-semibold">Scan Shader // Analog Jitter ±0.5°</span>
      </button>
    </div>
  );
}

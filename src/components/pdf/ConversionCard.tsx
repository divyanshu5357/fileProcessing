'use client';

import React from 'react';
import { ToolDefinition } from '@/types/document';
import {
  Image,
  FileText,
  Presentation,
  FileSpreadsheet,
  Code,
  FileImage,
  Table,
  ShieldCheck,
  Layers,
  Scissors,
  Minimize2,
  RotateCw,
  Trash2,
  ArrowDownUp,
  Download,
  Lock,
  Unlock,
  Stamp,
  Hash,
  AlignLeft,
  ArrowRight,
  Sparkles,
  PenTool,
} from 'lucide-react';

interface ConversionCardProps {
  tool: ToolDefinition;
  onClick: (tool: ToolDefinition) => void;
}

const ICON_MAP: Record<string, React.ElementType> = {
  Image,
  FileText,
  Presentation,
  FileSpreadsheet,
  Code,
  FileImage,
  Table,
  ShieldCheck,
  Layers,
  Scissors,
  Minimize2,
  RotateCw,
  Trash2,
  ArrowDownUp,
  Download,
  Lock,
  Unlock,
  Stamp,
  Hash,
  AlignLeft,
  PenTool,
};

const ACCENT_STYLES: Record<string, { bg: string; text: string; border: string; glow: string }> = {
  blue: {
    bg: 'bg-blue-50 dark:bg-blue-950/40',
    text: 'text-blue-600 dark:text-blue-400',
    border: 'border-blue-200 dark:border-blue-800',
    glow: 'group-hover:border-blue-500/50 dark:group-hover:border-blue-400/50',
  },
  orange: {
    bg: 'bg-orange-50 dark:bg-orange-950/40',
    text: 'text-orange-600 dark:text-orange-400',
    border: 'border-orange-200 dark:border-orange-800',
    glow: 'group-hover:border-orange-500/50 dark:group-hover:border-orange-400/50',
  },
  green: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    text: 'text-emerald-600 dark:text-emerald-400',
    border: 'border-emerald-200 dark:border-emerald-800',
    glow: 'group-hover:border-emerald-500/50 dark:group-hover:border-emerald-400/50',
  },
  purple: {
    bg: 'bg-purple-50 dark:bg-purple-950/40',
    text: 'text-purple-600 dark:text-purple-400',
    border: 'border-purple-200 dark:border-purple-800',
    glow: 'group-hover:border-purple-500/50 dark:group-hover:border-purple-400/50',
  },
  amber: {
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    text: 'text-amber-600 dark:text-amber-400',
    border: 'border-amber-200 dark:border-amber-800',
    glow: 'group-hover:border-amber-500/50 dark:group-hover:border-amber-400/50',
  },
  teal: {
    bg: 'bg-teal-50 dark:bg-teal-950/40',
    text: 'text-teal-600 dark:text-teal-400',
    border: 'border-teal-200 dark:border-teal-800',
    glow: 'group-hover:border-teal-500/50 dark:group-hover:border-teal-400/50',
  },
  indigo: {
    bg: 'bg-indigo-50 dark:bg-indigo-950/40',
    text: 'text-indigo-600 dark:text-indigo-400',
    border: 'border-indigo-200 dark:border-indigo-800',
    glow: 'group-hover:border-indigo-500/50 dark:group-hover:border-indigo-400/50',
  },
  red: {
    bg: 'bg-rose-50 dark:bg-rose-950/40',
    text: 'text-rose-600 dark:text-rose-400',
    border: 'border-rose-200 dark:border-rose-800',
    glow: 'group-hover:border-rose-500/50 dark:group-hover:border-rose-400/50',
  },
  emerald: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    text: 'text-emerald-600 dark:text-emerald-400',
    border: 'border-emerald-200 dark:border-emerald-800',
    glow: 'group-hover:border-emerald-500/50 dark:group-hover:border-emerald-400/50',
  },
  rose: {
    bg: 'bg-rose-50 dark:bg-rose-950/40',
    text: 'text-rose-600 dark:text-rose-400',
    border: 'border-rose-200 dark:border-rose-800',
    glow: 'group-hover:border-rose-500/50 dark:group-hover:border-rose-400/50',
  },
  cyan: {
    bg: 'bg-cyan-50 dark:bg-cyan-950/40',
    text: 'text-cyan-600 dark:text-cyan-400',
    border: 'border-cyan-200 dark:border-cyan-800',
    glow: 'group-hover:border-cyan-500/50 dark:group-hover:border-cyan-400/50',
  },
  sky: {
    bg: 'bg-sky-50 dark:bg-sky-950/40',
    text: 'text-sky-600 dark:text-sky-400',
    border: 'border-sky-200 dark:border-sky-800',
    glow: 'group-hover:border-sky-500/50 dark:group-hover:border-sky-400/50',
  },
  violet: {
    bg: 'bg-violet-50 dark:bg-violet-950/40',
    text: 'text-violet-600 dark:text-violet-400',
    border: 'border-violet-200 dark:border-violet-800',
    glow: 'group-hover:border-violet-500/50 dark:group-hover:border-violet-400/50',
  },
  fuchsia: {
    bg: 'bg-fuchsia-50 dark:bg-fuchsia-950/40',
    text: 'text-fuchsia-600 dark:text-fuchsia-400',
    border: 'border-fuchsia-200 dark:border-fuchsia-800',
    glow: 'group-hover:border-fuchsia-500/50 dark:group-hover:border-fuchsia-400/50',
  },
  pink: {
    bg: 'bg-pink-50 dark:bg-pink-950/40',
    text: 'text-pink-600 dark:text-pink-400',
    border: 'border-pink-200 dark:border-pink-800',
    glow: 'group-hover:border-pink-500/50 dark:group-hover:border-pink-400/50',
  },
  slate: {
    bg: 'bg-slate-100 dark:bg-slate-800/60',
    text: 'text-slate-700 dark:text-slate-300',
    border: 'border-slate-300 dark:border-slate-700',
    glow: 'group-hover:border-slate-500/50 dark:group-hover:border-slate-400/50',
  },
};

export function ConversionCard({ tool, onClick }: ConversionCardProps) {
  const IconComponent = ICON_MAP[tool.iconName] || FileText;
  const accent = ACCENT_STYLES[tool.accentColor] || ACCENT_STYLES.blue;

  return (
    <div
      onClick={() => onClick(tool)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick(tool);
        }
      }}
      className={`group relative flex flex-col justify-between p-5 bg-white dark:bg-[#111827] rounded-2xl border border-[#CBD5E1] dark:border-[#334155] hover:shadow-lg transition-all duration-200 cursor-pointer text-left hover:-translate-y-0.5 select-none ${accent.glow}`}
    >
      <div>
        {/* Top bar with Icon and Badge */}
        <div className="flex items-center justify-between mb-3.5">
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center border ${accent.bg} ${accent.text} ${accent.border} shadow-xs group-hover:scale-105 transition-transform duration-150`}
          >
            <IconComponent className="w-5 h-5" />
          </div>

          <div className="flex items-center gap-1.5">
            {tool.badge && (
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#EFF6FF] dark:bg-blue-950/60 text-[#2563EB] dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                {tool.badge}
              </span>
            )}
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-semibold">
              Client
            </span>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-base font-bold text-[#0F172A] dark:text-[#F8FAFC] tracking-tight group-hover:text-[#2563EB] dark:group-hover:text-[#60A5FA] transition-colors flex items-center gap-1.5">
          {tool.name}
        </h3>

        {/* Description */}
        <p className="text-xs text-[#334155] dark:text-[#CBD5E1] mt-1.5 line-clamp-2 leading-relaxed font-normal">
          {tool.shortDesc}
        </p>
      </div>

      {/* Footer bar with format path & arrow */}
      <div className="mt-4 pt-3 border-t border-[#F1F5F9] dark:border-[#1E293B] flex items-center justify-between text-[11px] font-medium text-[#475569] dark:text-[#94A3B8]">
        <div className="flex items-center gap-1.5 font-mono">
          <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[#0F172A] dark:text-[#E2E8F0]">
            {tool.fromFormat}
          </span>
          <ArrowRight className="w-3 h-3 text-[#94A3B8]" />
          <span className="px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-bold">
            {tool.toFormat}
          </span>
        </div>

        <div className="flex items-center gap-1 text-[#2563EB] dark:text-[#60A5FA] opacity-0 group-hover:opacity-100 transition-opacity font-semibold">
          <span>Open</span>
          <ArrowRight className="w-3 h-3" />
        </div>
      </div>
    </div>
  );
}

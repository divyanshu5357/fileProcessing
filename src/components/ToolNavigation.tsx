import React from 'react';
import { ToolId } from '@/types';
import {
  Zap,
  Maximize2,
  RefreshCw,
  Crop,
  RotateCw,
  ShieldCheck,
  Palette,
  Sparkles,
  UserCheck,
  Layers,
} from 'lucide-react';

interface ToolNavigationProps {
  activeTool: ToolId;
  onSelectTool: (tool: ToolId) => void;
  queueCount: number;
}

export const TOOLS = [
  { id: 'compress', label: 'Compress', icon: Zap, desc: 'Shrink file size' },
  { id: 'resize', label: 'Resize', icon: Maximize2, desc: 'Change dimensions' },
  { id: 'convert', label: 'Convert', icon: RefreshCw, desc: 'WebP, PNG, JPG, PDF' },
  { id: 'crop', label: 'Crop', icon: Crop, desc: 'Ratios & circular' },
  { id: 'rotate', label: 'Rotate & Flip', icon: RotateCw, desc: 'Straighten & mirror' },
  { id: 'metadata', label: 'Metadata & EXIF', icon: ShieldCheck, desc: 'Inspect & sanitize' },
  { id: 'palette', label: 'Color Palette', icon: Palette, desc: 'Extract hex & contrast' },
  { id: 'beautify', label: 'Beautifier', icon: Sparkles, desc: 'Mockups & gradients' },
  { id: 'passport', label: 'Passport Photo', icon: UserCheck, desc: 'Visas & print sheets' },
  { id: 'batch', label: 'Batch Studio', icon: Layers, desc: 'Process all together' },
] as const;

export function ToolNavigation({
  activeTool,
  onSelectTool,
  queueCount,
}: ToolNavigationProps) {
  return (
    <nav
      aria-label="Tool selection"
      className="w-full bg-[#FFFFFF] dark:bg-[#111827] border-b border-[#CBD5E1] dark:border-[#334155] px-4 py-2 overflow-x-auto scrollbar-none transition-colors"
    >
      <div className="max-w-7xl mx-auto flex items-center gap-1.5 min-w-max">
        {TOOLS.map((tool) => {
          const Icon = tool.icon;
          const isActive = activeTool === tool.id;
          const isBatch = tool.id === 'batch';

          return (
            <button
              key={tool.id}
              type="button"
              onClick={() => onSelectTool(tool.id as ToolId)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                isActive
                  ? 'bg-[#2563EB] text-white border-[#2563EB] dark:bg-[#3B82F6] dark:border-[#3B82F6] shadow-xs'
                  : 'bg-transparent text-[#475569] hover:text-[#0F172A] hover:bg-[#EFF6FF] border-transparent dark:text-[#CBD5E1] dark:hover:text-[#F8FAFC] dark:hover:bg-[#1E293B]'
              }`}
            >
              <Icon
                className={`w-3.5 h-3.5 ${
                  isActive ? 'text-white' : 'text-[#64748B] dark:text-[#94A3B8]'
                }`}
              />
              <span>{tool.label}</span>

              {isBatch && queueCount > 1 && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold leading-none ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-[#DBEAFE] text-[#1E40AF] dark:bg-[#1E3A8A] dark:text-[#93C5FD]'
                  }`}
                >
                  {queueCount}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

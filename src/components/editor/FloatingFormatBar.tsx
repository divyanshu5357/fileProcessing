'use client';

import React from 'react';
import {
  Bold,
  Italic,
  Trash2,
  Type,
  Check,
  ChevronDown,
  Palette,
  X,
} from 'lucide-react';
import { PdfTextItem } from '@/types/pdfEditor';

interface FloatingFormatBarProps {
  item: PdfTextItem;
  position: { top: number; left: number };
  onUpdateItem: (updates: Partial<PdfTextItem>) => void;
  onDeleteItem: () => void;
  onClose: () => void;
}

export function FloatingFormatBar({
  item,
  position,
  onUpdateItem,
  onDeleteItem,
  onClose,
}: FloatingFormatBarProps) {
  const fontFamilies = [
    { label: 'Helvetica (Sans)', value: 'Helvetica' },
    { label: 'Times New Roman (Serif)', value: 'Times-Roman' },
    { label: 'Courier (Monospace)', value: 'Courier' },
    { label: 'Arial', value: 'Arial' },
    { label: 'Georgia', value: 'Georgia' },
  ];

  const colors = [
    '#0F172A', // Black/Slate
    '#2563EB', // Blue
    '#DC2626', // Red
    '#16A34A', // Green
    '#D97706', // Amber
    '#9333EA', // Purple
    '#FFFFFF', // White
  ];

  return (
    <div
      style={{
        position: 'absolute',
        top: Math.max(10, position.top - 46),
        left: Math.max(10, position.left),
        zIndex: 40,
      }}
      className="flex items-center gap-1 p-1.5 bg-white dark:bg-[#111827] border border-[#CBD5E1] dark:border-[#334155] rounded-xl shadow-xl animate-in fade-in duration-100 select-none"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Font Family Selector */}
      <select
        value={item.fontFamily}
        onChange={(e) => onUpdateItem({ fontFamily: e.target.value })}
        className="text-[11px] font-medium p-1 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-[#0F172A] dark:text-[#F8FAFC] cursor-pointer"
      >
        {fontFamilies.map((f) => (
          <option key={f.value} value={f.value}>
            {f.label}
          </option>
        ))}
      </select>

      {/* Font Size */}
      <div className="flex items-center gap-0.5 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 px-1">
        <button
          type="button"
          onClick={() => onUpdateItem({ fontSize: Math.max(6, item.fontSize - 1), pdfFontSize: Math.max(6, item.pdfFontSize - 1) })}
          className="px-1 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-blue-600"
        >
          -
        </button>
        <span className="text-[11px] font-mono px-1 font-bold text-[#0F172A] dark:text-[#F8FAFC]">
          {item.fontSize}
        </span>
        <button
          type="button"
          onClick={() => onUpdateItem({ fontSize: item.fontSize + 1, pdfFontSize: item.pdfFontSize + 1 })}
          className="px-1 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-blue-600"
        >
          +
        </button>
      </div>

      <div className="w-[1px] h-4 bg-slate-200 dark:bg-slate-700 mx-0.5" />

      {/* Bold Toggle */}
      <button
        type="button"
        onClick={() => onUpdateItem({ isBold: !item.isBold })}
        className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
          item.isBold
            ? 'bg-blue-100 dark:bg-blue-900/60 text-[#2563EB] dark:text-[#60A5FA]'
            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
        }`}
        title="Toggle Bold"
      >
        <Bold className="w-3.5 h-3.5" />
      </button>

      {/* Italic Toggle */}
      <button
        type="button"
        onClick={() => onUpdateItem({ isItalic: !item.isItalic })}
        className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
          item.isItalic
            ? 'bg-blue-100 dark:bg-blue-900/60 text-[#2563EB] dark:text-[#60A5FA]'
            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
        }`}
        title="Toggle Italic"
      >
        <Italic className="w-3.5 h-3.5" />
      </button>

      {/* Color Swatches */}
      <div className="flex items-center gap-1 px-1">
        {colors.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => onUpdateItem({ color: c })}
            style={{ backgroundColor: c }}
            className={`w-4 h-4 rounded-full border transition-transform cursor-pointer ${
              item.color === c ? 'scale-125 border-blue-600 ring-2 ring-blue-300' : 'border-slate-300 dark:border-slate-600'
            }`}
          />
        ))}
      </div>

      <div className="w-[1px] h-4 bg-slate-200 dark:bg-slate-700 mx-0.5" />

      {/* Delete Text Item */}
      <button
        type="button"
        onClick={onDeleteItem}
        className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
        title="Delete Text"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>

      {/* Done / Close */}
      <button
        type="button"
        onClick={onClose}
        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        title="Done"
      >
        <Check className="w-3.5 h-3.5 text-emerald-600" />
      </button>
    </div>
  );
}

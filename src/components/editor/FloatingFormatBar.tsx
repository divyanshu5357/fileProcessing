'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Palette,
  Link2,
  Move,
  Copy,
  Trash2,
  ChevronDown,
  Check,
} from 'lucide-react';
import { PdfTextItem } from '@/types/pdfEditor';

export interface FloatingFormatBarProps {
  item: PdfTextItem;
  position: { top: number; left: number };
  containerBounds?: { width: number; height: number };
  onUpdateItem: (updates: Partial<PdfTextItem>) => void;
  onDeleteItem: () => void;
  onDuplicateItem?: () => void;
  onMoveItem?: (dx: number, dy: number) => void;
  onClose?: () => void;
}

export function FloatingFormatBar({
  item,
  position,
  containerBounds = { width: 800, height: 1100 },
  onUpdateItem,
  onDeleteItem,
  onDuplicateItem,
  onMoveItem,
}: FloatingFormatBarProps) {
  const [activeMenu, setActiveMenu] = useState<'none' | 'fontSize' | 'fontFamily' | 'color' | 'link'>('none');
  const [linkUrl, setLinkUrl] = useState('');
  const barRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (barRef.current && !barRef.current.contains(e.target as Node)) {
        setActiveMenu('none');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fontFamilies = [
    { label: 'Helvetica (Sans)', value: 'Helvetica' },
    { label: 'Arial', value: 'Arial' },
    { label: 'Times New Roman (Serif)', value: 'Times-Roman' },
    { label: 'Courier (Monospace)', value: 'Courier' },
    { label: 'Georgia', value: 'Georgia' },
  ];

  const fontSizes = [8, 9, 10, 11, 12, 13, 14, 16, 18, 20, 24, 28, 32, 36, 44];

  const colors = [
    '#000000',
    '#0F172A',
    '#2563EB',
    '#DC2626',
    '#16A34A',
    '#D97706',
    '#9333EA',
    '#475569',
    '#FFFFFF',
  ];

  // Auto-clamp position so toolbar floats neatly above text without clipping
  const toolbarWidth = 360;
  const toolbarHeight = 36;
  let top = position.top - toolbarHeight - 6;
  if (top < 10) {
    top = position.top + Math.max(24, item.height || 20) + 6;
  }
  let left = Math.max(10, Math.min(position.left, containerBounds.width - toolbarWidth - 10));

  return (
    <div
      ref={barRef}
      style={{
        position: 'absolute',
        top: Math.round(top),
        left: Math.round(left),
        zIndex: 50,
      }}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      className="flex items-center h-8.5 bg-white dark:bg-slate-900 border border-blue-400 dark:border-blue-500 rounded-md shadow-md divide-x divide-blue-200 dark:divide-slate-700 text-blue-600 select-none animate-in fade-in zoom-in-95 duration-100"
    >
      {/* 1. Bold Button (B) */}
      <button
        type="button"
        title="Bold"
        onClick={() => onUpdateItem({ isBold: !item.isBold })}
        className={`px-2.5 h-full flex items-center justify-center font-bold text-sm transition-colors cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-l-md ${
          item.isBold ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/60' : 'text-blue-600'
        }`}
      >
        B
      </button>

      {/* 2. Italic Button (I) */}
      <button
        type="button"
        title="Italic"
        onClick={() => onUpdateItem({ isItalic: !item.isItalic })}
        className={`px-2.5 h-full flex items-center justify-center font-serif italic font-bold text-sm transition-colors cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-950/40 ${
          item.isItalic ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/60' : 'text-blue-600'
        }`}
      >
        I
      </button>

      {/* 3. Font Size Button (T↕ ▼) */}
      <div className="relative h-full">
        <button
          type="button"
          title="Font Size"
          onClick={() => setActiveMenu(activeMenu === 'fontSize' ? 'none' : 'fontSize')}
          className="px-2 h-full flex items-center gap-0.5 text-xs font-semibold hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors cursor-pointer"
        >
          <span className="flex items-center tracking-tighter">
            <span className="font-bold">T</span>
            <span className="text-[10px]">↕</span>
          </span>
          <ChevronDown className="w-2.5 h-2.5 ml-0.5 text-blue-500" />
        </button>

        {activeMenu === 'fontSize' && (
          <div className="absolute top-full mt-1.5 left-0 z-50 bg-white dark:bg-slate-900 border border-blue-300 dark:border-slate-700 rounded-md shadow-lg p-1.5 min-w-[120px] text-xs">
            <div className="flex items-center justify-between pb-1 mb-1 border-b border-slate-100 dark:border-slate-800">
              <span className="text-[10px] text-slate-500 font-medium">Font Size</span>
              <span className="font-bold text-blue-600">{Math.round(item.fontSize)}pt</span>
            </div>
            <div className="grid grid-cols-4 gap-1 max-h-36 overflow-y-auto">
              {fontSizes.map((sz) => (
                <button
                  key={sz}
                  type="button"
                  onClick={() => {
                    onUpdateItem({ fontSize: sz, pdfFontSize: sz });
                    setActiveMenu('none');
                  }}
                  className={`px-1.5 py-1 text-center rounded text-[11px] font-medium transition cursor-pointer ${
                    Math.round(item.fontSize) === sz
                      ? 'bg-blue-600 text-white'
                      : 'hover:bg-blue-50 text-slate-700 dark:text-slate-200'
                  }`}
                >
                  {sz}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 4. Font Family Button (Aa ▼) */}
      <div className="relative h-full">
        <button
          type="button"
          title="Font Family"
          onClick={() => setActiveMenu(activeMenu === 'fontFamily' ? 'none' : 'fontFamily')}
          className="px-2 h-full flex items-center gap-0.5 text-xs font-semibold hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors cursor-pointer"
        >
          <span className="font-bold">Aa</span>
          <ChevronDown className="w-2.5 h-2.5 ml-0.5 text-blue-500" />
        </button>

        {activeMenu === 'fontFamily' && (
          <div className="absolute top-full mt-1.5 left-0 z-50 bg-white dark:bg-slate-900 border border-blue-300 dark:border-slate-700 rounded-md shadow-lg p-1 min-w-[150px] text-xs">
            <div className="text-[10px] text-slate-500 font-medium px-2 py-0.5 border-b border-slate-100 dark:border-slate-800 mb-1">
              Font Family
            </div>
            {fontFamilies.map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => {
                  onUpdateItem({ fontFamily: f.value });
                  setActiveMenu('none');
                }}
                className={`w-full text-left px-2 py-1 rounded text-xs transition cursor-pointer flex items-center justify-between ${
                  item.fontFamily === f.value
                    ? 'bg-blue-50 text-blue-600 font-bold'
                    : 'hover:bg-slate-50 text-slate-700 dark:text-slate-200'
                }`}
              >
                <span>{f.label}</span>
                {item.fontFamily === f.value && <Check className="w-3 h-3 text-blue-600" />}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 5. Color Palette Button (🎨 ▼) */}
      <div className="relative h-full">
        <button
          type="button"
          title="Text Color"
          onClick={() => setActiveMenu(activeMenu === 'color' ? 'none' : 'color')}
          className="px-2 h-full flex items-center gap-0.5 text-xs hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors cursor-pointer"
        >
          <div className="relative flex items-center">
            <Palette className="w-3.5 h-3.5 text-blue-600" />
            <span
              style={{ backgroundColor: item.color || '#0F172A' }}
              className="absolute -bottom-1 -right-1 w-2 h-2 rounded-full border border-white dark:border-slate-800"
            />
          </div>
          <ChevronDown className="w-2.5 h-2.5 ml-1 text-blue-500" />
        </button>

        {activeMenu === 'color' && (
          <div className="absolute top-full mt-1.5 left-0 z-50 bg-white dark:bg-slate-900 border border-blue-300 dark:border-slate-700 rounded-md shadow-lg p-2 min-w-[140px]">
            <div className="text-[10px] text-slate-500 font-medium mb-1.5">Color Palette</div>
            <div className="grid grid-cols-4 gap-1.5 mb-2">
              {colors.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => {
                    onUpdateItem({ color: c });
                    setActiveMenu('none');
                  }}
                  style={{ backgroundColor: c }}
                  className={`w-5 h-5 rounded-full border transition cursor-pointer ${
                    item.color === c ? 'ring-2 ring-blue-500 scale-110' : 'border-slate-300'
                  }`}
                />
              ))}
            </div>
            <input
              type="color"
              value={item.color || '#0F172A'}
              onChange={(e) => onUpdateItem({ color: e.target.value })}
              className="w-full h-6 rounded cursor-pointer border border-slate-200"
            />
          </div>
        )}
      </div>

      {/* 6. Link Icon (🔗) */}
      <div className="relative h-full">
        <button
          type="button"
          title="Add or Edit Link"
          onClick={() => {
            if (activeMenu === 'link') {
              setActiveMenu('none');
            } else {
              setLinkUrl('');
              setActiveMenu('link');
            }
          }}
          className={`px-2 h-full flex items-center justify-center hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors cursor-pointer ${
            item.isUnderline ? 'bg-blue-100 text-blue-800' : 'text-blue-600'
          }`}
        >
          <Link2 className="w-3.5 h-3.5" />
        </button>

        {activeMenu === 'link' && (
          <div className="absolute top-full mt-1.5 left-0 z-50 bg-white dark:bg-slate-900 border border-blue-300 dark:border-slate-700 rounded-md shadow-lg p-2 min-w-[200px] flex flex-col gap-1.5">
            <div className="text-[10px] text-slate-500 font-medium">Hyperlink URL</div>
            <input
              type="url"
              placeholder="https://..."
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              className="text-xs px-2 py-1 border border-slate-200 rounded outline-none text-slate-800"
            />
            <div className="flex gap-1 justify-end">
              <button
                type="button"
                onClick={() => {
                  onUpdateItem({ isUnderline: !item.isUnderline });
                  setActiveMenu('none');
                }}
                className="px-2 py-0.5 text-[10px] bg-slate-100 rounded text-slate-600 hover:bg-slate-200"
              >
                Underline
              </button>
              <button
                type="button"
                onClick={() => setActiveMenu('none')}
                className="px-2 py-0.5 text-[10px] bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Apply
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 7. Move / Drag Icon (✥) */}
      <button
        type="button"
        title="Move Text Position"
        onClick={() => {
          if (onMoveItem) onMoveItem(0, -2);
        }}
        className="px-2 h-full flex items-center justify-center hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors cursor-pointer text-blue-600"
      >
        <Move className="w-3.5 h-3.5" />
      </button>

      {/* 8. Duplicate Icon (❐) */}
      <button
        type="button"
        title="Duplicate Text"
        onClick={() => {
          if (onDuplicateItem) {
            onDuplicateItem();
          } else {
            onUpdateItem({ str: item.str });
          }
        }}
        className="px-2 h-full flex items-center justify-center hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors cursor-pointer text-blue-600"
      >
        <Copy className="w-3.5 h-3.5" />
      </button>

      {/* 9. Delete Icon (🗑) */}
      <button
        type="button"
        title="Delete Text"
        onClick={onDeleteItem}
        className="px-2 h-full flex items-center justify-center hover:bg-rose-50 text-rose-500 hover:text-rose-700 transition-colors cursor-pointer rounded-r-md"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

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
  ExternalLink,
  Plus,
  Minus,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';
import { PdfTextItem } from '@/types/pdfEditor';
import { getCssFontFamily } from '@/lib/pdfEditorEngine';

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
  const [activeMenu, setActiveMenu] = useState<'none' | 'fontSize' | 'fontFamily' | 'color' | 'link' | 'move'>('none');
  const [linkInputUrl, setLinkInputUrl] = useState(item.linkUrl || '');
  const [copiedFeedback, setCopiedFeedback] = useState(false);
  const [isDraggingMove, setIsDraggingMove] = useState(false);
  const dragStartRef = useRef<{ clientX: number; clientY: number } | null>(null);
  const barRef = useRef<HTMLDivElement>(null);

  // Sync link input if item changes
  useEffect(() => {
    setLinkInputUrl(item.linkUrl || '');
  }, [item.linkUrl]);

  // Close dropdowns when clicking outside the format bar
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
    { label: 'Arial', value: 'Arial', fontStack: 'Arial, Helvetica, sans-serif' },
    { label: 'Helvetica', value: 'Helvetica', fontStack: 'Helvetica, Arial, sans-serif' },
    { label: 'Times New Roman', value: 'Times-Roman', fontStack: '"Times New Roman", Times, serif' },
    { label: 'Courier New', value: 'Courier', fontStack: '"Courier New", Courier, monospace' },
    { label: 'Georgia', value: 'Georgia', fontStack: 'Georgia, serif' },
    { label: 'Verdana', value: 'Verdana', fontStack: 'Verdana, Geneva, sans-serif' },
  ];

  const fontSizes = [8, 9, 10, 11, 12, 13, 14, 16, 18, 20, 24, 28, 32, 36, 44];

  const colors = [
    { label: 'Black', hex: '#000000' },
    { label: 'Slate', hex: '#0F172A' },
    { label: 'Royal Blue', hex: '#2563EB' },
    { label: 'Navy', hex: '#1E3A8A' },
    { label: 'Crimson Red', hex: '#DC2626' },
    { label: 'Emerald Green', hex: '#16A34A' },
    { label: 'Amber Orange', hex: '#D97706' },
    { label: 'Purple', hex: '#9333EA' },
    { label: 'Muted Gray', hex: '#475569' },
    { label: 'White', hex: '#FFFFFF' },
  ];

  // Auto-clamp position so toolbar floats neatly above text without clipping outside page boundaries
  const toolbarWidth = 370;
  const toolbarHeight = 36;
  let top = position.top - toolbarHeight - 8;
  if (top < 8) {
    top = position.top + Math.max(26, item.height || 22) + 8;
  }
  let left = Math.max(10, Math.min(position.left, containerBounds.width - toolbarWidth - 10));

  // Current display helpers
  const currentFontSize = Math.round(item.fontSize || item.pdfFontSize || 12);
  const currentFontFamily = item.fontFamily || 'Helvetica';
  const currentColor = item.color || '#0F172A';

  // 1. Move Drag Pointer Handlers
  const handleMovePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    e.preventDefault();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
    setIsDraggingMove(true);
    dragStartRef.current = { clientX: e.clientX, clientY: e.clientY };
  };

  const handleMovePointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!isDraggingMove || !dragStartRef.current || !onMoveItem) return;
    const dx = e.clientX - dragStartRef.current.clientX;
    const dy = e.clientY - dragStartRef.current.clientY;

    if (Math.abs(dx) > 0 || Math.abs(dy) > 0) {
      onMoveItem(dx, dy);
      dragStartRef.current = { clientX: e.clientX, clientY: e.clientY };
    }
  };

  const handleMovePointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
    setIsDraggingMove(false);
    dragStartRef.current = null;
  };

  // 2. Copy Handler
  const handleCopy = () => {
    if (item.str) {
      try {
        navigator.clipboard?.writeText(item.str);
      } catch {}
    }
    setCopiedFeedback(true);
    setTimeout(() => setCopiedFeedback(false), 1500);

    if (onDuplicateItem) {
      onDuplicateItem();
    }
  };

  return (
    <div
      ref={barRef}
      style={{
        position: 'absolute',
        top: Math.round(top),
        left: Math.round(left),
        zIndex: 60,
      }}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => {
        // Prevent input in PageCanvasView from losing focus on format bar clicks
        e.preventDefault();
        e.stopPropagation();
      }}
      onPointerDown={(e) => e.stopPropagation()}
      className="flex items-center h-9 bg-white dark:bg-slate-900 border border-blue-400 dark:border-blue-500 rounded-lg shadow-xl divide-x divide-blue-200 dark:divide-slate-700 text-blue-600 select-none animate-in fade-in zoom-in-95 duration-100"
    >
      {/* 1. Bold Button (B) */}
      <button
        type="button"
        title={item.isBold ? 'Remove Bold' : 'Make Bold'}
        onClick={() => onUpdateItem({ isBold: !item.isBold, isEdited: true })}
        className={`px-3 h-full flex items-center justify-center font-bold text-sm transition-colors cursor-pointer rounded-l-lg ${
          item.isBold
            ? 'bg-blue-600 text-white font-extrabold shadow-inner'
            : 'text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40'
        }`}
      >
        B
      </button>

      {/* 2. Italic Button (I) */}
      <button
        type="button"
        title={item.isItalic ? 'Remove Italic' : 'Make Italic'}
        onClick={() => onUpdateItem({ isItalic: !item.isItalic, isEdited: true })}
        className={`px-3 h-full flex items-center justify-center font-serif italic text-sm transition-colors cursor-pointer ${
          item.isItalic
            ? 'bg-blue-600 text-white font-bold shadow-inner'
            : 'text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40'
        }`}
      >
        I
      </button>

      {/* 3. Font Size Button (T↕ ▼) */}
      <div className="relative h-full">
        <button
          type="button"
          title="Change Font Size"
          onClick={() => setActiveMenu(activeMenu === 'fontSize' ? 'none' : 'fontSize')}
          className={`px-2.5 h-full flex items-center gap-1 text-xs font-semibold transition-colors cursor-pointer ${
            activeMenu === 'fontSize'
              ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/70'
              : 'hover:bg-blue-50 dark:hover:bg-blue-950/40 text-blue-600'
          }`}
        >
          <span className="flex items-center tracking-tighter">
            <span className="font-bold text-xs">T</span>
            <span className="text-[11px] leading-none">↕</span>
          </span>
          <span className="text-[11px] font-bold font-mono ml-0.5">{currentFontSize}</span>
          <ChevronDown className="w-2.5 h-2.5 text-blue-500" />
        </button>

        {activeMenu === 'fontSize' && (
          <div className="absolute top-full mt-2 left-0 z-50 bg-white dark:bg-slate-900 border border-blue-300 dark:border-slate-700 rounded-lg shadow-2xl p-2 min-w-[170px] text-xs">
            {/* Quick Step Buttons */}
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-[11px] text-slate-500 font-medium">Font Size: {currentFontSize}pt</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  title="Decrease 1pt"
                  onClick={() => {
                    const newSz = Math.max(6, currentFontSize - 1);
                    onUpdateItem({ fontSize: newSz, pdfFontSize: newSz, isEdited: true });
                  }}
                  className="p-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-blue-100 text-slate-700 dark:text-slate-200 cursor-pointer"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  title="Increase 1pt"
                  onClick={() => {
                    const newSz = Math.min(72, currentFontSize + 1);
                    onUpdateItem({ fontSize: newSz, pdfFontSize: newSz, isEdited: true });
                  }}
                  className="p-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-blue-100 text-slate-700 dark:text-slate-200 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Size Grid */}
            <div className="grid grid-cols-5 gap-1 max-h-40 overflow-y-auto">
              {fontSizes.map((sz) => (
                <button
                  key={sz}
                  type="button"
                  onClick={() => {
                    onUpdateItem({ fontSize: sz, pdfFontSize: sz, isEdited: true });
                    setActiveMenu('none');
                  }}
                  className={`py-1 text-center rounded text-[11px] font-medium transition cursor-pointer ${
                    currentFontSize === sz
                      ? 'bg-blue-600 text-white font-bold'
                      : 'hover:bg-blue-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
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
          title="Change Font Family"
          onClick={() => setActiveMenu(activeMenu === 'fontFamily' ? 'none' : 'fontFamily')}
          className={`px-2.5 h-full flex items-center gap-1 text-xs font-semibold transition-colors cursor-pointer ${
            activeMenu === 'fontFamily'
              ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/70'
              : 'hover:bg-blue-50 dark:hover:bg-blue-950/40 text-blue-600'
          }`}
        >
          <span className="font-bold text-xs">Aa</span>
          <ChevronDown className="w-2.5 h-2.5 text-blue-500" />
        </button>

        {activeMenu === 'fontFamily' && (
          <div className="absolute top-full mt-2 left-0 z-50 bg-white dark:bg-slate-900 border border-blue-300 dark:border-slate-700 rounded-lg shadow-2xl p-1.5 min-w-[190px] text-xs">
            <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold px-2 py-1 border-b border-slate-100 dark:border-slate-800 mb-1">
              Select Typeface
            </div>
            <div className="space-y-0.5">
              {fontFamilies.map((f) => {
                const isSelected = currentFontFamily.toLowerCase().includes(f.value.toLowerCase());
                return (
                  <button
                    key={f.value}
                    type="button"
                    style={{ fontFamily: f.fontStack }}
                    onClick={() => {
                      onUpdateItem({ fontFamily: f.value, isEdited: true });
                      setActiveMenu('none');
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs transition cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 font-bold'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100'
                    }`}
                  >
                    <span>{f.label}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-blue-600" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 5. Color Palette Button (🎨 ▼) */}
      <div className="relative h-full">
        <button
          type="button"
          title="Change Text Color"
          onClick={() => setActiveMenu(activeMenu === 'color' ? 'none' : 'color')}
          className={`px-2.5 h-full flex items-center gap-1.5 text-xs transition-colors cursor-pointer ${
            activeMenu === 'color'
              ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/70'
              : 'hover:bg-blue-50 dark:hover:bg-blue-950/40 text-blue-600'
          }`}
        >
          <div className="relative flex items-center">
            <Palette className="w-3.5 h-3.5 text-blue-600" />
            <span
              style={{ backgroundColor: currentColor }}
              className="absolute -bottom-1 -right-1 w-2.5 h-2.5 rounded-full border border-white dark:border-slate-800 shadow-sm"
            />
          </div>
          <ChevronDown className="w-2.5 h-2.5 text-blue-500" />
        </button>

        {activeMenu === 'color' && (
          <div className="absolute top-full mt-2 left-0 z-50 bg-white dark:bg-slate-900 border border-blue-300 dark:border-slate-700 rounded-lg shadow-2xl p-2.5 min-w-[180px]">
            <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-2">
              Text Color
            </div>
            {/* Color Swatch Grid */}
            <div className="grid grid-cols-5 gap-2 mb-3">
              {colors.map((c) => (
                <button
                  key={c.hex}
                  type="button"
                  title={c.label}
                  onClick={() => {
                    onUpdateItem({ color: c.hex, isEdited: true });
                    setActiveMenu('none');
                  }}
                  style={{ backgroundColor: c.hex }}
                  className={`w-6 h-6 rounded-full border transition cursor-pointer flex items-center justify-center ${
                    currentColor.toLowerCase() === c.hex.toLowerCase()
                      ? 'ring-2 ring-blue-500 ring-offset-1 scale-110'
                      : 'border-slate-300 dark:border-slate-600 hover:scale-105'
                  }`}
                >
                  {currentColor.toLowerCase() === c.hex.toLowerCase() && (
                    <Check
                      className={`w-3 h-3 ${c.hex === '#FFFFFF' ? 'text-black' : 'text-white'}`}
                    />
                  )}
                </button>
              ))}
            </div>

            {/* Custom Hex Color Picker */}
            <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="text-[11px] text-slate-500 font-medium">Custom:</span>
              <input
                type="color"
                value={currentColor}
                onChange={(e) => onUpdateItem({ color: e.target.value, isEdited: true })}
                className="w-7 h-7 rounded cursor-pointer border border-slate-300 dark:border-slate-700 p-0.5 bg-transparent"
              />
              <span className="text-[11px] font-mono font-medium text-slate-700 dark:text-slate-300 uppercase">
                {currentColor}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 6. Link Button (🔗) */}
      <div className="relative h-full">
        <button
          type="button"
          title="Add or Edit Hyperlink"
          onClick={() => setActiveMenu(activeMenu === 'link' ? 'none' : 'link')}
          className={`px-2.5 h-full flex items-center justify-center transition-colors cursor-pointer ${
            item.linkUrl || item.isUnderline || activeMenu === 'link'
              ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/70'
              : 'hover:bg-blue-50 dark:hover:bg-blue-950/40 text-blue-600'
          }`}
        >
          <Link2 className="w-3.5 h-3.5" />
        </button>

        {activeMenu === 'link' && (
          <div className="absolute top-full mt-2 left-0 z-50 bg-white dark:bg-slate-900 border border-blue-300 dark:border-slate-700 rounded-lg shadow-2xl p-2.5 min-w-[240px] flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200">Hyperlink URL</span>
              {item.linkUrl && (
                <a
                  href={item.linkUrl.startsWith('http') ? item.linkUrl : `https://${item.linkUrl}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[10px] text-blue-600 flex items-center gap-0.5 hover:underline"
                >
                  Visit <ExternalLink className="w-2.5 h-2.5" />
                </a>
              )}
            </div>

            <input
              type="url"
              placeholder="https://example.com"
              value={linkInputUrl}
              onChange={(e) => setLinkInputUrl(e.target.value)}
              className="text-xs px-2.5 py-1.5 border border-slate-300 dark:border-slate-600 rounded-md outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            />

            <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800">
              {item.linkUrl ? (
                <button
                  type="button"
                  onClick={() => {
                    onUpdateItem({ linkUrl: undefined, isUnderline: false, isEdited: true });
                    setLinkInputUrl('');
                    setActiveMenu('none');
                  }}
                  className="px-2 py-1 text-[11px] text-rose-500 hover:bg-rose-50 rounded transition"
                >
                  Remove
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    onUpdateItem({ isUnderline: !item.isUnderline, isEdited: true });
                  }}
                  className={`px-2 py-1 text-[11px] rounded transition ${
                    item.isUnderline ? 'bg-blue-100 text-blue-700 font-bold' : 'text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  Underline
                </button>
              )}

              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => setActiveMenu('none')}
                  className="px-2.5 py-1 text-[11px] rounded bg-slate-100 text-slate-600 hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const clean = linkInputUrl.trim();
                    onUpdateItem({
                      linkUrl: clean.length > 0 ? clean : undefined,
                      isUnderline: clean.length > 0 ? true : item.isUnderline,
                      isEdited: true,
                    });
                    setActiveMenu('none');
                  }}
                  className="px-3 py-1 text-[11px] font-bold rounded bg-blue-600 text-white hover:bg-blue-700 transition"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 7. Move Handle & Position Controls (✥) */}
      <div className="relative h-full">
        <button
          type="button"
          title="Drag to Move Text Anywhere (or click for nudge buttons)"
          onPointerDown={handleMovePointerDown}
          onPointerMove={handleMovePointerMove}
          onPointerUp={handleMovePointerUp}
          onClick={() => {
            if (!isDraggingMove) {
              setActiveMenu(activeMenu === 'move' ? 'none' : 'move');
            }
          }}
          className={`px-2.5 h-full flex items-center justify-center transition-colors ${
            isDraggingMove
              ? 'bg-blue-600 text-white cursor-grabbing'
              : activeMenu === 'move'
              ? 'bg-blue-100 text-blue-800 cursor-grab'
              : 'hover:bg-blue-50 dark:hover:bg-blue-950/40 text-blue-600 cursor-grab'
          }`}
        >
          <Move className="w-3.5 h-3.5" />
        </button>

        {activeMenu === 'move' && (
          <div className="absolute top-full mt-2 left-0 z-50 bg-white dark:bg-slate-900 border border-blue-300 dark:border-slate-700 rounded-lg shadow-2xl p-2 min-w-[130px] flex flex-col items-center gap-1.5">
            <span className="text-[10px] uppercase font-bold text-slate-400">Nudge Position</span>
            <div className="grid grid-cols-3 gap-1">
              <div />
              <button
                type="button"
                title="Move Up 3px"
                onClick={() => onMoveItem && onMoveItem(0, -3)}
                className="p-1 rounded bg-slate-100 hover:bg-blue-100 text-slate-700 flex items-center justify-center cursor-pointer"
              >
                <ArrowUp className="w-3.5 h-3.5" />
              </button>
              <div />

              <button
                type="button"
                title="Move Left 3px"
                onClick={() => onMoveItem && onMoveItem(-3, 0)}
                className="p-1 rounded bg-slate-100 hover:bg-blue-100 text-slate-700 flex items-center justify-center cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                title="Move Down 3px"
                onClick={() => onMoveItem && onMoveItem(0, 3)}
                className="p-1 rounded bg-slate-100 hover:bg-blue-100 text-slate-700 flex items-center justify-center cursor-pointer"
              >
                <ArrowDown className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                title="Move Right 3px"
                onClick={() => onMoveItem && onMoveItem(3, 0)}
                className="p-1 rounded bg-slate-100 hover:bg-blue-100 text-slate-700 flex items-center justify-center cursor-pointer"
              >
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <span className="text-[9px] text-slate-400 text-center">or drag icon directly</span>
          </div>
        )}
      </div>

      {/* 8. Copy Button (❐) */}
      <button
        type="button"
        title="Duplicate Text & Copy to Clipboard"
        onClick={handleCopy}
        className={`px-2.5 h-full flex items-center justify-center transition-colors cursor-pointer relative ${
          copiedFeedback
            ? 'bg-emerald-500 text-white'
            : 'hover:bg-blue-50 dark:hover:bg-blue-950/40 text-blue-600'
        }`}
      >
        {copiedFeedback ? (
          <Check className="w-3.5 h-3.5 animate-in zoom-in-75" />
        ) : (
          <Copy className="w-3.5 h-3.5" />
        )}
      </button>

      {/* 9. Delete Button (🗑) */}
      <button
        type="button"
        title="Delete Text from Document"
        onClick={onDeleteItem}
        className="px-3 h-full flex items-center justify-center hover:bg-rose-50 text-rose-500 hover:text-rose-700 dark:hover:bg-rose-950/40 transition-colors cursor-pointer rounded-r-lg"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

'use client';

import React from 'react';
import { Bold, Italic, Minus, Plus, Copy, Trash2 } from 'lucide-react';
import type { CanvasBlock } from './useSnapAlignment';

interface FloatingToolbarProps {
  block: CanvasBlock;
  canvasWidth: number;
  onToggleBold: () => void;
  onToggleItalic: () => void;
  onChangeFontSize: (delta: number) => void;
  onChangeColor: (color: string) => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

const TOOLBAR_WIDTH_EST = 336;
const TOOLBAR_HEIGHT = 40;
const TOP_FLIP_THRESHOLD = 58;

const COLOR_PRESETS = ['#0F172A', '#1E3A8A', '#2563EB', '#047857', '#B91C1C'];

export function FloatingToolbar({
  block,
  canvasWidth,
  onToggleBold,
  onToggleItalic,
  onChangeFontSize,
  onChangeColor,
  onDuplicate,
  onDelete,
}: FloatingToolbarProps) {
  const centeredLeft = block.x + block.width / 2 - TOOLBAR_WIDTH_EST / 2;
  const clampedLeft = Math.max(12, Math.min(canvasWidth - TOOLBAR_WIDTH_EST - 12, centeredLeft));

  const placeBelow = block.y < TOP_FLIP_THRESHOLD;
  const topPosition = placeBelow ? block.y + block.height + 10 : block.y - TOOLBAR_HEIGHT - 10;

  return (
    <div
      role="toolbar"
      aria-label="Block formatting actions"
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      style={{
        left: `${clampedLeft}px`,
        top: `${topPosition}px`,
        minWidth: `${TOOLBAR_WIDTH_EST}px`,
      }}
      className="absolute z-40 flex h-10 items-center gap-1 rounded-xl border border-slate-200 bg-white px-2 text-slate-700 shadow-lg ring-1 ring-black/5"
    >
      {/* Bold */}
      <button
        type="button"
        title="Toggle Bold"
        onClick={onToggleBold}
        className={`flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-xs transition-colors ${
          block.styles.fontWeight === 'bold'
            ? 'bg-blue-50 text-[#2563EB]'
            : 'hover:bg-slate-100 text-slate-700'
        }`}
      >
        <Bold className="h-3.5 w-3.5" />
      </button>

      {/* Italic */}
      <button
        type="button"
        title="Toggle Italic"
        onClick={onToggleItalic}
        className={`flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-xs transition-colors ${
          block.styles.fontStyle === 'italic'
            ? 'bg-blue-50 text-[#2563EB]'
            : 'hover:bg-slate-100 text-slate-700'
        }`}
      >
        <Italic className="h-3.5 w-3.5" />
      </button>

      <span className="mx-1 h-4 w-px bg-slate-200" />

      {/* Font Size Controls */}
      <div className="flex items-center gap-0.5 rounded-md bg-slate-50 px-1 py-0.5 border border-slate-200/80">
        <button
          type="button"
          title="Decrease Font Size"
          onClick={() => onChangeFontSize(-1)}
          className="flex h-6 w-6 cursor-pointer items-center justify-center rounded hover:bg-white hover:shadow-2xs text-slate-600"
        >
          <Minus className="h-3 w-3" />
        </button>
        <span className="w-8 text-center font-mono text-[11px] font-semibold text-slate-800">
          {block.styles.fontSize}
        </span>
        <button
          type="button"
          title="Increase Font Size"
          onClick={() => onChangeFontSize(1)}
          className="flex h-6 w-6 cursor-pointer items-center justify-center rounded hover:bg-white hover:shadow-2xs text-slate-600"
        >
          <Plus className="h-3 w-3" />
        </button>
      </div>

      <span className="mx-1 h-4 w-px bg-slate-200" />

      {/* Quick Color Swatches + Native Picker */}
      <div className="flex items-center gap-1">
        {COLOR_PRESETS.map((preset) => (
          <button
            key={preset}
            type="button"
            title={`Color ${preset}`}
            onClick={() => onChangeColor(preset)}
            style={{ backgroundColor: preset }}
            className={`h-4 w-4 cursor-pointer rounded-full border transition-transform hover:scale-110 ${
              block.styles.color.toLowerCase() === preset.toLowerCase()
                ? 'ring-2 ring-[#2563EB] ring-offset-1 border-white'
                : 'border-slate-300'
            }`}
          />
        ))}
        <label className="relative flex h-6 w-6 cursor-pointer items-center justify-center rounded hover:bg-slate-100">
          <span
            className="h-4 w-4 rounded border border-slate-300 shadow-2xs"
            style={{ backgroundColor: block.styles.color }}
          />
          <input
            type="color"
            aria-label="Custom Text Color"
            value={block.styles.color}
            onChange={(e) => onChangeColor(e.target.value)}
            className="sr-only"
          />
        </label>
      </div>

      <span className="mx-1 h-4 w-px bg-slate-200" />

      {/* Duplicate */}
      <button
        type="button"
        title="Duplicate Block"
        onClick={onDuplicate}
        className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
      >
        <Copy className="h-3.5 w-3.5" />
      </button>

      {/* Delete */}
      <button
        type="button"
        title="Delete Block"
        onClick={onDelete}
        className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-rose-600 transition-colors hover:bg-rose-50"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

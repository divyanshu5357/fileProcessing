'use client';

import React, { useRef, useEffect } from 'react';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Copy,
  Trash2,
  RotateCw,
  Lock,
  Unlock,
  ArrowUp,
  ArrowDown,
  Layers,
  Image as ImageIcon,
  Palette,
  X,
} from 'lucide-react';
import {
  AddedTextElement,
  ImageElement,
  ShapeElement,
  SignatureElement,
  AnnotationElement,
  WhiteoutElement,
  EditableObjectType,
} from '@/types/pdfEditor';

interface ContextualToolbarProps {
  objectType: EditableObjectType;
  objectData: any;
  position: { top: number; left: number };
  containerBounds: { width: number; height: number };
  onUpdate: (updates: any) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onBringForward?: () => void;
  onSendBackward?: () => void;
  onReplaceImage?: () => void;
  onClose: () => void;
}

const FONT_FAMILIES = [
  { label: 'Helvetica', value: 'Helvetica' },
  { label: 'Times Roman', value: 'Times-Roman' },
  { label: 'Courier', value: 'Courier' },
  { label: 'Arial', value: 'Arial' },
  { label: 'Georgia', value: 'Georgia' },
];

const PRESET_COLORS = [
  '#0F172A', // Slate 900
  '#2563EB', // Blue 600
  '#DC2626', // Red 600
  '#16A34A', // Green 600
  '#CA8A04', // Yellow 600
  '#9333EA', // Purple 600
  '#FFFFFF', // White
];

export function ContextualToolbar({
  objectType,
  objectData,
  position,
  containerBounds,
  onUpdate,
  onDuplicate,
  onDelete,
  onBringForward,
  onSendBackward,
  onReplaceImage,
  onClose,
}: ContextualToolbarProps) {
  const toolbarRef = useRef<HTMLDivElement>(null);

  // Auto-clamp within container / viewport
  // Aim to position above the object; if too close to top, position below
  const toolbarWidth = 480;
  const toolbarHeight = 44;

  let top = position.top - toolbarHeight - 12;
  if (top < 10) {
    top = position.top + 30; // Place below if top edge would be cut off
  }

  let left = position.left;
  if (left + toolbarWidth > containerBounds.width - 20) {
    left = Math.max(10, containerBounds.width - toolbarWidth - 20);
  }
  if (left < 10) left = 10;

  return (
    <div
      ref={toolbarRef}
      style={{
        position: 'absolute',
        top: Math.round(top),
        left: Math.round(left),
        zIndex: 100,
      }}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      className="flex items-center gap-1.5 p-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl shadow-xl text-slate-800 dark:text-slate-100 select-none animate-in fade-in zoom-in-95 duration-100"
    >
      {/* 1. TEXT OBJECT CONTROLS */}
      {objectType === 'addedText' && (
        <>
          {/* Font Family */}
          <select
            value={objectData.fontFamily || 'Helvetica'}
            onChange={(e) => onUpdate({ fontFamily: e.target.value })}
            className="text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 font-medium cursor-pointer outline-none"
          >
            {FONT_FAMILIES.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>

          {/* Font Size */}
          <div className="flex items-center gap-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg px-1.5 py-0.5 border border-slate-200 dark:border-slate-700">
            <input
              type="number"
              min={6}
              max={120}
              value={Math.round(objectData.fontSize || 12)}
              onChange={(e) =>
                onUpdate({
                  fontSize: Math.max(6, Math.min(120, parseInt(e.target.value) || 12)),
                })
              }
              className="w-10 text-xs text-center bg-transparent border-none outline-none font-bold"
            />
            <span className="text-[10px] text-slate-400 font-mono">pt</span>
          </div>

          <div className="w-[1px] h-4 bg-slate-200 dark:bg-slate-700 mx-0.5" />

          {/* Bold, Italic, Underline */}
          <button
            type="button"
            title="Bold"
            onClick={() => onUpdate({ isBold: !objectData.isBold })}
            className={`p-1 rounded-md text-xs transition-colors cursor-pointer ${
              objectData.isBold
                ? 'bg-blue-600 text-white'
                : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            <Bold className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            title="Italic"
            onClick={() => onUpdate({ isItalic: !objectData.isItalic })}
            className={`p-1 rounded-md text-xs transition-colors cursor-pointer ${
              objectData.isItalic
                ? 'bg-blue-600 text-white'
                : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            <Italic className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            title="Underline"
            onClick={() => onUpdate({ isUnderline: !objectData.isUnderline })}
            className={`p-1 rounded-md text-xs transition-colors cursor-pointer ${
              objectData.isUnderline
                ? 'bg-blue-600 text-white'
                : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            <Underline className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            title="Strikethrough"
            onClick={() =>
              onUpdate({ isStrikethrough: !objectData.isStrikethrough })
            }
            className={`p-1 rounded-md text-xs transition-colors cursor-pointer ${
              objectData.isStrikethrough
                ? 'bg-blue-600 text-white'
                : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            <Strikethrough className="w-3.5 h-3.5" />
          </button>

          <div className="w-[1px] h-4 bg-slate-200 dark:bg-slate-700 mx-0.5" />

          {/* Alignment */}
          <button
            type="button"
            title="Align Left"
            onClick={() => onUpdate({ alignment: 'left' })}
            className={`p-1 rounded-md text-xs transition-colors cursor-pointer ${
              objectData.alignment === 'left' || !objectData.alignment
                ? 'bg-blue-100 dark:bg-blue-950 text-blue-600'
                : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            <AlignLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            title="Align Center"
            onClick={() => onUpdate({ alignment: 'center' })}
            className={`p-1 rounded-md text-xs transition-colors cursor-pointer ${
              objectData.alignment === 'center'
                ? 'bg-blue-100 dark:bg-blue-950 text-blue-600'
                : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            <AlignCenter className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            title="Align Right"
            onClick={() => onUpdate({ alignment: 'right' })}
            className={`p-1 rounded-md text-xs transition-colors cursor-pointer ${
              objectData.alignment === 'right'
                ? 'bg-blue-100 dark:bg-blue-950 text-blue-600'
                : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            <AlignRight className="w-3.5 h-3.5" />
          </button>

          <div className="w-[1px] h-4 bg-slate-200 dark:bg-slate-700 mx-0.5" />

          {/* Color Picker Swatch */}
          <div className="flex items-center gap-1">
            <input
              type="color"
              value={objectData.color || '#0F172A'}
              onChange={(e) => onUpdate({ color: e.target.value })}
              title="Text Color"
              className="w-5 h-5 rounded-md border border-slate-300 dark:border-slate-600 cursor-pointer p-0 bg-transparent"
            />
          </div>
        </>
      )}

      {/* 2. IMAGE OBJECT CONTROLS */}
      {objectType === 'image' && (
        <>
          {/* Dimensions */}
          <div className="flex items-center gap-1 text-xs px-1">
            <span className="text-slate-400 font-mono">W:</span>
            <span className="font-bold font-mono">
              {Math.round(objectData.pdfWidth)}
            </span>
            <span className="text-slate-400 font-mono ml-1">H:</span>
            <span className="font-bold font-mono">
              {Math.round(objectData.pdfHeight)}
            </span>
          </div>

          <div className="w-[1px] h-4 bg-slate-200 dark:bg-slate-700 mx-0.5" />

          {/* Rotate 90deg */}
          <button
            type="button"
            title="Rotate 90° Clockwise"
            onClick={() =>
              onUpdate({ rotation: ((objectData.rotation || 0) + 90) % 360 })
            }
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 cursor-pointer"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>{objectData.rotation || 0}°</span>
          </button>

          {/* Opacity */}
          <div className="flex items-center gap-1.5 px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs">
            <span className="text-slate-400">Opacity:</span>
            <input
              type="range"
              min={0.1}
              max={1}
              step={0.05}
              value={objectData.opacity ?? 1}
              onChange={(e) => onUpdate({ opacity: parseFloat(e.target.value) })}
              className="w-16 h-1 accent-blue-600 cursor-pointer"
            />
            <span className="font-mono text-[11px] w-7">
              {Math.round((objectData.opacity ?? 1) * 100)}%
            </span>
          </div>

          {/* Replace Image Button */}
          {onReplaceImage && (
            <button
              type="button"
              title="Replace Image"
              onClick={onReplaceImage}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-semibold cursor-pointer"
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Replace</span>
            </button>
          )}
        </>
      )}

      {/* 3. SHAPE OBJECT CONTROLS */}
      {objectType === 'shape' && (
        <>
          {/* Stroke Color */}
          <div className="flex items-center gap-1 text-xs px-1">
            <span className="text-slate-400">Border:</span>
            <input
              type="color"
              value={objectData.strokeColor || '#2563EB'}
              onChange={(e) => onUpdate({ strokeColor: e.target.value })}
              title="Border Color"
              className="w-5 h-5 rounded-md border border-slate-300 cursor-pointer p-0 bg-transparent"
            />
          </div>

          {/* Fill Color */}
          <div className="flex items-center gap-1 text-xs px-1">
            <span className="text-slate-400">Fill:</span>
            <input
              type="color"
              value={objectData.fillColor || '#FFFFFF'}
              onChange={(e) => onUpdate({ fillColor: e.target.value })}
              title="Fill Color"
              className="w-5 h-5 rounded-md border border-slate-300 cursor-pointer p-0 bg-transparent"
            />
          </div>

          {/* Border Width */}
          <select
            value={objectData.strokeWidth || 2}
            onChange={(e) => onUpdate({ strokeWidth: parseInt(e.target.value) })}
            className="text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-1.5 py-1 font-mono cursor-pointer outline-none"
          >
            <option value={1}>1px</option>
            <option value={2}>2px</option>
            <option value={4}>4px</option>
            <option value={6}>6px</option>
          </select>
        </>
      )}

      {/* 4. WHITEOUT & ANNOTATION CONTROLS */}
      {(objectType === 'whiteout' || objectType === 'annotation') && (
        <div className="flex items-center gap-1 text-xs px-1">
          <span className="text-slate-400">Color:</span>
          <input
            type="color"
            value={objectData.color || (objectType === 'whiteout' ? '#FFFFFF' : '#FEF08A')}
            onChange={(e) => onUpdate({ color: e.target.value })}
            className="w-5 h-5 rounded-md border border-slate-300 cursor-pointer p-0 bg-transparent"
          />
        </div>
      )}

      <div className="w-[1px] h-4 bg-slate-200 dark:bg-slate-700 mx-0.5" />

      {/* 5. COMMON CONTROLS: Lock, Stacking Order, Duplicate, Delete */}
      <button
        type="button"
        title={objectData.locked ? 'Unlock object' : 'Lock object'}
        onClick={() => onUpdate({ locked: !objectData.locked })}
        className={`p-1 rounded-md text-xs cursor-pointer ${
          objectData.locked
            ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400'
            : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'
        }`}
      >
        {objectData.locked ? (
          <Lock className="w-3.5 h-3.5" />
        ) : (
          <Unlock className="w-3.5 h-3.5" />
        )}
      </button>

      {onBringForward && (
        <button
          type="button"
          title="Bring Forward"
          onClick={onBringForward}
          className="p-1 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
        >
          <ArrowUp className="w-3.5 h-3.5" />
        </button>
      )}

      {onSendBackward && (
        <button
          type="button"
          title="Send Backward"
          onClick={onSendBackward}
          className="p-1 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
        >
          <ArrowDown className="w-3.5 h-3.5" />
        </button>
      )}

      <button
        type="button"
        title="Duplicate (Ctrl+D)"
        onClick={onDuplicate}
        className="p-1 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
      >
        <Copy className="w-3.5 h-3.5" />
      </button>

      <button
        type="button"
        title="Delete (Delete / Backspace)"
        onClick={onDelete}
        className="p-1 rounded-md text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>

      <div className="w-[1px] h-4 bg-slate-200 dark:bg-slate-700 mx-0.5" />

      {/* Close button */}
      <button
        type="button"
        title="Deselect"
        onClick={onClose}
        className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

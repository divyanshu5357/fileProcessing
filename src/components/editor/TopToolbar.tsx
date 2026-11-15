'use client';

import React from 'react';
import {
  MousePointer,
  Hand,
  Type,
  Edit3,
  Image as ImageIcon,
  Square,
  PenTool,
  Eraser,
  Highlighter,
  CheckSquare,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCw,
  Plus,
  Trash2,
  Download,
  Layers,
} from 'lucide-react';
import { EditorToolMode } from '@/types/pdfEditor';
import { Button } from '../ui/Button';

interface TopToolbarProps {
  activeMode: EditorToolMode;
  onSelectMode: (mode: EditorToolMode) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  zoomScale: number;
  onZoomChange: (newScale: number) => void;
  onFitWidth: () => void;
  currentPage: number;
  totalPages: number;
  onInsertBlankPage: () => void;
  onRotateCurrentPage: () => void;
  onDeleteCurrentPage: () => void;
  onApplyChanges: () => void;
  isSaving: boolean;
  onOpenSignModal: () => void;
  isLayersOpen: boolean;
  onToggleLayers: () => void;
  onTriggerImageUpload: () => void;
}

export function TopToolbar({
  activeMode,
  onSelectMode,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  zoomScale,
  onZoomChange,
  onFitWidth,
  currentPage,
  totalPages,
  onInsertBlankPage,
  onRotateCurrentPage,
  onDeleteCurrentPage,
  onApplyChanges,
  isSaving,
  onOpenSignModal,
  isLayersOpen,
  onToggleLayers,
  onTriggerImageUpload,
}: TopToolbarProps) {
  const tools: { id: EditorToolMode; label: string; icon: any; tooltip: string; action?: () => void }[] = [
    {
      id: 'select',
      label: 'Select',
      icon: MousePointer,
      tooltip: 'Select, move and resize objects (V)',
    },
    {
      id: 'hand',
      label: 'Hand',
      icon: Hand,
      tooltip: 'Pan and scroll viewport (H)',
    },
    {
      id: 'text',
      label: 'Add Text',
      icon: Type,
      tooltip: 'Click anywhere to place a new multiline text box (T)',
    },
    {
      id: 'editText',
      label: 'Edit PDF Text',
      icon: Edit3,
      tooltip: 'Click existing PDF text to edit in-place with auto-detected font (E)',
    },
    {
      id: 'images',
      label: 'Images',
      icon: ImageIcon,
      tooltip: 'Upload and click anywhere to place an image (I)',
      action: onTriggerImageUpload,
    },
    {
      id: 'shapes',
      label: 'Shapes',
      icon: Square,
      tooltip: 'Drag on page to draw rectangles or shapes',
    },
    {
      id: 'annotate',
      label: 'Highlight',
      icon: Highlighter,
      tooltip: 'Drag to highlight or annotate text runs',
    },
    {
      id: 'whiteout',
      label: 'Whiteout',
      icon: Eraser,
      tooltip: 'Drag over text or graphics to erase or redact',
    },
    {
      id: 'sign',
      label: 'Sign',
      icon: PenTool,
      tooltip: 'Add digital signature or stamp',
      action: onOpenSignModal,
    },
    {
      id: 'forms',
      label: 'Forms',
      icon: CheckSquare,
      tooltip: 'Add form inputs and checkboxes',
    },
  ];

  return (
    <div className="w-full bg-white dark:bg-[#111827] border-b border-[#CBD5E1] dark:border-[#334155] sticky top-16 z-20 shadow-xs select-none">
      <div className="max-w-7xl mx-auto px-4 py-2 flex flex-wrap items-center justify-between gap-2">
        {/* Left: Professional Tool Palette */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
          {tools.map((t) => {
            const Icon = t.icon;
            const isActive = activeMode === t.id;

            return (
              <button
                key={t.id}
                type="button"
                title={t.tooltip}
                onClick={() => {
                  if (t.action) {
                    t.action();
                  } else {
                    onSelectMode(t.id);
                  }
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer shrink-0 ${
                  isActive
                    ? 'bg-[#2563EB] text-white shadow-xs'
                    : 'text-[#334155] dark:text-[#CBD5E1] hover:text-[#0F172A] dark:hover:text-[#F8FAFC] hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{t.label}</span>
              </button>
            );
          })}

          <div className="w-[1px] h-5 bg-[#CBD5E1] dark:bg-[#334155] mx-1 shrink-0" />

          {/* Undo & Redo */}
          <button
            type="button"
            disabled={!canUndo}
            onClick={onUndo}
            title="Undo (Ctrl+Z)"
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            disabled={!canRedo}
            onClick={onRedo}
            title="Redo (Ctrl+Shift+Z / Ctrl+Y)"
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <Redo2 className="w-4 h-4" />
          </button>
        </div>

        {/* Right: Layers Toggle, Zoom controls, Page Actions & Primary Export */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Layers Toggle Button */}
          <button
            type="button"
            onClick={onToggleLayers}
            title="Toggle Layers & Objects Sidebar"
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer border ${
              isLayersOpen
                ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-400 dark:border-blue-600 text-blue-600 dark:text-blue-400'
                : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Layers</span>
          </button>

          <div className="w-[1px] h-5 bg-[#CBD5E1] dark:bg-[#334155] mx-0.5 shrink-0" />

          {/* Zoom controls */}
          <div className="flex items-center bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 px-1 py-0.5">
            <button
              type="button"
              onClick={() => onZoomChange(Math.max(0.5, zoomScale - 0.15))}
              className="p-1 text-slate-600 dark:text-slate-300 hover:text-blue-600 cursor-pointer"
              title="Zoom out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-mono font-bold px-1.5 text-[#0F172A] dark:text-[#F8FAFC]">
              {Math.round(zoomScale * 100)}%
            </span>
            <button
              type="button"
              onClick={() => onZoomChange(Math.min(2.5, zoomScale + 0.15))}
              className="p-1 text-slate-600 dark:text-slate-300 hover:text-blue-600 cursor-pointer"
              title="Zoom in"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={onFitWidth}
              className="p-1 text-slate-500 hover:text-blue-600 ml-0.5 cursor-pointer"
              title="Fit to width"
            >
              <Maximize2 className="w-3 h-3" />
            </button>
          </div>

          {/* Page Counter */}
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-[#475569] dark:text-[#CBD5E1] font-mono font-semibold px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800">
            <span>
              Page {currentPage} of {totalPages}
            </span>
          </div>

          {/* Rotate Page */}
          <button
            type="button"
            onClick={onRotateCurrentPage}
            title="Rotate Page 90°"
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>

          {/* Blank Page */}
          <button
            type="button"
            onClick={onInsertBlankPage}
            title="Insert Blank Page"
            className="hidden md:flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Blank Page</span>
          </button>

          {/* Apply Changes & Download Button */}
          <Button
            variant="primary"
            size="sm"
            isLoading={isSaving}
            onClick={onApplyChanges}
            className="font-bold gap-1.5 shadow-md px-4"
          >
            <Download className="w-4 h-4" />
            <span>Apply Changes</span>
          </Button>
        </div>
      </div>
    </div>
  );
}

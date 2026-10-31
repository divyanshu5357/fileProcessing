'use client';

import React, { useRef } from 'react';
import {
  FilePlus,
  Plus,
  Merge,
  GitCompare,
  RotateCcw,
  RotateCw,
  Copy,
  Trash2,
  Undo2,
  Redo2,
  Download,
  ZoomIn,
  ZoomOut,
  CheckSquare,
  Square,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface AssemblerToolbarProps {
  onAddFiles: (files: File[]) => void;
  onNewDocument: () => void;
  onMergeSelected: () => void;
  onMergeAlternately: () => void;
  onRotateSelectedPages: (delta: number) => void;
  onDuplicateSelectedPages: () => void;
  onDeleteSelectedPages: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onOpenSaveModal: () => void;
  zoomScale: number;
  onZoomChange: (scale: number) => void;
  totalSelectedDocs: number;
  totalSelectedPages: number;
  onSelectAllPagesGlobal: (select: boolean) => void;
  isAllPagesSelectedGlobal: boolean;
}

export function AssemblerToolbar({
  onAddFiles,
  onNewDocument,
  onMergeSelected,
  onMergeAlternately,
  onRotateSelectedPages,
  onDuplicateSelectedPages,
  onDeleteSelectedPages,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onOpenSaveModal,
  zoomScale,
  onZoomChange,
  totalSelectedDocs,
  totalSelectedPages,
  onSelectAllPagesGlobal,
  isAllPagesSelectedGlobal,
}: AssemblerToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onAddFiles(Array.from(e.target.files));
      e.target.value = '';
    }
  };

  return (
    <div className="w-full bg-white dark:bg-[#111827] border-b border-[#CBD5E1] dark:border-[#334155] px-4 py-2.5 shadow-xs sticky top-16 z-20 transition-colors">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,application/pdf,image/png,image/jpeg,image/webp"
        onChange={handleFileInputChange}
        className="hidden"
      />

      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Left Section: Primary Document Level Actions */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {/* Add Files */}
          <Button
            size="sm"
            variant="primary"
            onClick={() => fileInputRef.current?.click()}
            className="text-xs font-bold shadow-xs flex items-center gap-1.5"
            title="Upload multiple PDF files or images to assemble"
          >
            <FilePlus className="w-4 h-4" />
            <span>Add Files</span>
          </Button>

          {/* New Document */}
          <Button
            size="sm"
            variant="secondary"
            onClick={onNewDocument}
            className="text-xs font-bold flex items-center gap-1.5"
            title="Create a new empty document to drag pages into"
          >
            <Plus className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>New Document</span>
          </Button>

          <div className="h-5 w-px bg-slate-200 dark:bg-slate-700 mx-1 hidden sm:block" />

          {/* Merge Selected */}
          <button
            type="button"
            disabled={totalSelectedDocs < 2}
            onClick={onMergeSelected}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition"
            title="Merge selected documents into a single PDF in sequence"
          >
            <Merge className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Merge</span>
            {totalSelectedDocs >= 2 && (
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                {totalSelectedDocs}
              </span>
            )}
          </button>

          {/* Merge Alternately */}
          <button
            type="button"
            disabled={totalSelectedDocs < 2}
            onClick={onMergeAlternately}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition"
            title="Interleave pages alternately from selected documents: A1, B1, A2, B2..."
          >
            <GitCompare className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span className="hidden md:inline">Merge Alternately</span>
          </button>
        </div>

        {/* Center / Page-Level Actions */}
        <div className="flex items-center gap-1 sm:gap-1.5">
          {/* Rotate Left */}
          <button
            type="button"
            disabled={totalSelectedPages === 0}
            onClick={() => onRotateSelectedPages(-90)}
            className="p-1.5 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition"
            title="Rotate selected pages (-90°)"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Rotate Right */}
          <button
            type="button"
            disabled={totalSelectedPages === 0}
            onClick={() => onRotateSelectedPages(90)}
            className="p-1.5 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition"
            title="Rotate selected pages (+90°)"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          {/* Duplicate Selected Pages */}
          <button
            type="button"
            disabled={totalSelectedPages === 0}
            onClick={onDuplicateSelectedPages}
            className="p-1.5 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition"
            title="Duplicate selected pages"
          >
            <Copy className="w-4 h-4" />
          </button>

          {/* Delete Selected Pages */}
          <button
            type="button"
            disabled={totalSelectedPages === 0}
            onClick={onDeleteSelectedPages}
            className="p-1.5 rounded-xl text-slate-700 dark:text-slate-200 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 disabled:opacity-30 disabled:cursor-not-allowed transition"
            title="Delete selected pages"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          <div className="h-5 w-px bg-slate-200 dark:bg-slate-700 mx-1" />

          {/* Undo & Redo */}
          <button
            type="button"
            disabled={!canUndo}
            onClick={onUndo}
            className="p-1.5 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition"
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="w-4 h-4" />
          </button>

          <button
            type="button"
            disabled={!canRedo}
            onClick={onRedo}
            className="p-1.5 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition"
            title="Redo (Ctrl+Y)"
          >
            <Redo2 className="w-4 h-4" />
          </button>
        </div>

        {/* Right Section: Zoom & Save Export Button */}
        <div className="flex items-center gap-2">
          {/* Zoom controls */}
          <div className="hidden lg:flex items-center gap-1.5 px-2 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs text-slate-600 dark:text-slate-300">
            <button
              type="button"
              disabled={zoomScale <= 0.8}
              onClick={() => onZoomChange(Math.max(0.8, zoomScale - 0.15))}
              className="p-0.5 hover:text-slate-900 dark:hover:text-white disabled:opacity-30"
              title="Zoom out thumbnails"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="font-mono text-[11px] font-bold w-10 text-center">
              {Math.round(zoomScale * 100)}%
            </span>
            <button
              type="button"
              disabled={zoomScale >= 1.6}
              onClick={() => onZoomChange(Math.min(1.6, zoomScale + 0.15))}
              className="p-0.5 hover:text-slate-900 dark:hover:text-white disabled:opacity-30"
              title="Zoom in thumbnails"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Save / Export Modal Trigger */}
          <Button
            size="sm"
            variant="primary"
            onClick={onOpenSaveModal}
            className="text-xs font-bold px-4 shadow-sm flex items-center gap-1.5 bg-[#2563EB] hover:bg-blue-700 text-white"
            title="Save and export compiled PDF documents"
          >
            <Download className="w-4 h-4" />
            <span>Save & Export</span>
          </Button>
        </div>
      </div>
    </div>
  );
}

'use client';

import React from 'react';
import {
  RotateCcw,
  RotateCw,
  Copy,
  Trash2,
  Check,
  GripVertical,
} from 'lucide-react';
import { AssemblerPage } from '@/types/pdfAssembler';

interface PageThumbnailCardProps {
  page: AssemblerPage;
  pageIndex: number;
  docId: string;
  zoomScale: number; // 0.8 to 1.6
  onToggleSelect: (pageId: string) => void;
  onRotatePage: (pageId: string, delta: number) => void;
  onDuplicatePage: (pageId: string) => void;
  onDeletePage: (pageId: string) => void;
  onDragStart: (e: React.DragEvent, docId: string, pageId: string, pageIndex: number) => void;
  onDragOver: (e: React.DragEvent, docId: string, pageIndex: number) => void;
  onDrop: (e: React.DragEvent, docId: string, pageIndex: number) => void;
  isDragTarget?: boolean;
}

export function PageThumbnailCard({
  page,
  pageIndex,
  docId,
  zoomScale,
  onToggleSelect,
  onRotatePage,
  onDuplicatePage,
  onDeletePage,
  onDragStart,
  onDragOver,
  onDrop,
  isDragTarget = false,
}: PageThumbnailCardProps) {
  // Base dimensions at scale 1.0: width ~140px, height ~190px
  const baseW = 140 * zoomScale;
  const baseH = 190 * zoomScale;

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, docId, page.id, pageIndex)}
      onDragOver={(e) => {
        e.preventDefault();
        onDragOver(e, docId, pageIndex);
      }}
      onDrop={(e) => {
        e.preventDefault();
        onDrop(e, docId, pageIndex);
      }}
      className={`group relative flex flex-col items-center select-none cursor-grab active:cursor-grabbing transition-all duration-150 ${
        isDragTarget ? 'scale-105 ring-2 ring-blue-500 rounded-xl' : ''
      }`}
      style={{ width: `${baseW}px` }}
    >
      {/* Thumbnail Box */}
      <div
        onClick={() => onToggleSelect(page.id)}
        className={`relative w-full rounded-xl border overflow-hidden shadow-xs transition-all ${
          page.selected
            ? 'border-blue-600 dark:border-blue-500 ring-2 ring-blue-500/40 bg-blue-50/20'
            : 'border-[#CBD5E1] dark:border-[#334155] bg-white dark:bg-[#111827] hover:border-blue-400 dark:hover:border-blue-600'
        }`}
        style={{ height: `${baseH}px` }}
      >
        {/* Selection Checkbox Pill */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleSelect(page.id);
          }}
          className={`absolute top-2 left-2 z-10 w-5 h-5 rounded-md flex items-center justify-center transition-all ${
            page.selected
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-black/40 hover:bg-black/60 text-transparent hover:text-white/60 backdrop-blur-xs'
          }`}
          title={page.selected ? 'Deselect page' : 'Select page'}
        >
          <Check className="w-3.5 h-3.5 stroke-[3]" />
        </button>

        {/* Drag Handle Icon on Top Right */}
        <div className="absolute top-2 right-2 z-10 p-1 rounded-md bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <GripVertical className="w-3.5 h-3.5" />
        </div>

        {/* Rendered Preview Image */}
        <div className="w-full h-full flex items-center justify-center p-2 bg-slate-50 dark:bg-[#0B1120] overflow-hidden">
          {page.thumbnailUrl ? (
            <img
              src={page.thumbnailUrl}
              alt={`Page ${pageIndex + 1}`}
              className="max-w-full max-h-full object-contain rounded-xs shadow-2xs transition-transform duration-200"
              style={{
                transform: `rotate(${page.rotation}deg)`,
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-400">
              Loading preview...
            </div>
          )}
        </div>

        {/* Hover Quick Actions Overlay Bar */}
        <div className="absolute inset-x-0 bottom-0 p-1.5 bg-slate-900/80 backdrop-blur-xs flex items-center justify-around opacity-0 group-hover:opacity-100 transition-opacity z-10">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRotatePage(page.id, -90);
            }}
            className="p-1 rounded text-white hover:text-blue-400 hover:bg-white/10 transition"
            title="Rotate Left (-90°)"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRotatePage(page.id, 90);
            }}
            className="p-1 rounded text-white hover:text-blue-400 hover:bg-white/10 transition"
            title="Rotate Right (+90°)"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDuplicatePage(page.id);
            }}
            className="p-1 rounded text-white hover:text-emerald-400 hover:bg-white/10 transition"
            title="Duplicate Page"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDeletePage(page.id);
            }}
            className="p-1 rounded text-white hover:text-rose-400 hover:bg-white/10 transition"
            title="Delete Page"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Page Number Label */}
      <div className="mt-1.5 flex items-center gap-1">
        <span
          className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-full transition-colors ${
            page.selected
              ? 'bg-blue-600 text-white'
              : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
          }`}
        >
          {pageIndex + 1}
        </span>
        {page.rotation !== 0 && (
          <span className="text-[10px] font-mono text-blue-600 dark:text-blue-400 font-bold">
            {page.rotation}°
          </span>
        )}
      </div>
    </div>
  );
}

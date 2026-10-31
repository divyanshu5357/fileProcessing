'use client';

import React, { useState } from 'react';
import {
  FileText,
  ChevronDown,
  ChevronRight,
  Check,
  CheckSquare,
  Square,
  RotateCw,
  Copy,
  Trash2,
  Edit2,
  Plus,
  ArrowUpDown,
  MoveDown,
  MoveUp,
} from 'lucide-react';
import { AssemblerDocument, AssemblerPage } from '@/types/pdfAssembler';
import { PageThumbnailCard } from './PageThumbnailCard';

interface DocumentSectionProps {
  document: AssemblerDocument;
  docIndex: number;
  totalDocs: number;
  zoomScale: number;
  dragTargetDocId: string | null;
  dragTargetPageIndex: number | null;
  onToggleSelectDoc: (docId: string) => void;
  onRenameDoc: (docId: string, newName: string) => void;
  onToggleCollapseDoc: (docId: string) => void;
  onDeleteDoc: (docId: string) => void;
  onDuplicateDoc: (docId: string) => void;
  onMoveDocOrder: (docId: string, direction: 'up' | 'down') => void;
  onSelectAllPagesInDoc: (docId: string, selectAll: boolean) => void;
  onRotateAllPagesInDoc: (docId: string, delta: number) => void;
  onToggleSelectPage: (pageId: string) => void;
  onRotatePage: (pageId: string, delta: number) => void;
  onDuplicatePage: (pageId: string) => void;
  onDeletePage: (pageId: string) => void;
  onPageDragStart: (e: React.DragEvent, docId: string, pageId: string, pageIndex: number) => void;
  onPageDragOver: (e: React.DragEvent, docId: string, pageIndex: number) => void;
  onPageDrop: (e: React.DragEvent, docId: string, targetPageIndex: number) => void;
}

export function DocumentSection({
  document,
  docIndex,
  totalDocs,
  zoomScale,
  dragTargetDocId,
  dragTargetPageIndex,
  onToggleSelectDoc,
  onRenameDoc,
  onToggleCollapseDoc,
  onDeleteDoc,
  onDuplicateDoc,
  onMoveDocOrder,
  onSelectAllPagesInDoc,
  onRotateAllPagesInDoc,
  onToggleSelectPage,
  onRotatePage,
  onDuplicatePage,
  onDeletePage,
  onPageDragStart,
  onPageDragOver,
  onPageDrop,
}: DocumentSectionProps) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(document.name);

  const selectedPagesCount = document.pages.filter((p) => p.selected).length;
  const areAllPagesSelected = document.pages.length > 0 && selectedPagesCount === document.pages.length;

  const handleFinishRename = () => {
    if (tempName.trim()) {
      onRenameDoc(document.id, tempName.trim());
    } else {
      setTempName(document.name);
    }
    setIsEditingName(false);
  };

  return (
    <div className="w-full rounded-2xl border border-[#CBD5E1] dark:border-[#334155] bg-white dark:bg-[#111827] shadow-sm overflow-hidden transition-all">
      {/* Document Section Header Bar */}
      <div className="px-4 py-3 bg-slate-50 dark:bg-[#0B1120] border-b border-[#CBD5E1] dark:border-[#334155] flex flex-wrap items-center justify-between gap-3">
        {/* Left: Document selection checkbox, Name & Page count badge */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => onToggleSelectDoc(document.id)}
            className={`w-5 h-5 rounded-md flex items-center justify-center transition-all cursor-pointer ${
              document.selected
                ? 'bg-blue-600 text-white shadow-xs'
                : 'border border-slate-300 dark:border-slate-700 hover:border-blue-400 bg-white dark:bg-slate-800'
            }`}
            title={document.selected ? 'Deselect document' : 'Select document for merging/export'}
          >
            {document.selected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
          </button>

          <button
            type="button"
            onClick={() => onToggleCollapseDoc(document.id)}
            className="p-1 rounded-md text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition"
            title={document.isCollapsed ? 'Expand document' : 'Collapse document'}
          >
            {document.isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>

          <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />

          {/* Document Title / Inline Rename */}
          {isEditingName ? (
            <input
              type="text"
              autoFocus
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              onBlur={handleFinishRename}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleFinishRename();
                if (e.key === 'Escape') {
                  setTempName(document.name);
                  setIsEditingName(false);
                }
              }}
              className="px-2 py-0.5 text-xs font-bold rounded-lg border border-blue-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none"
            />
          ) : (
            <div className="flex items-center gap-1.5 min-w-0 group/title">
              <span
                onClick={() => setIsEditingName(true)}
                className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-slate-100 truncate cursor-pointer hover:text-blue-600 transition"
                title="Click to rename document"
              >
                {document.name}
              </span>
              <button
                type="button"
                onClick={() => setIsEditingName(true)}
                className="opacity-0 group-hover/title:opacity-100 p-0.5 text-slate-400 hover:text-blue-600 transition"
              >
                <Edit2 className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Page Count Badge */}
          <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            {document.pages.length} {document.pages.length === 1 ? 'page' : 'pages'}
          </span>
        </div>

        {/* Right: Document-Level Action Controls */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Select all pages in doc toggle */}
          <button
            type="button"
            onClick={() => onSelectAllPagesInDoc(document.id, !areAllPagesSelected)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition"
            title={areAllPagesSelected ? 'Deselect all pages in document' : 'Select all pages in document'}
          >
            {areAllPagesSelected ? (
              <CheckSquare className="w-3.5 h-3.5 text-blue-600" />
            ) : (
              <Square className="w-3.5 h-3.5" />
            )}
            <span className="hidden md:inline">
              {areAllPagesSelected ? 'Deselect All' : 'Select All'}
            </span>
          </button>

          {/* Rotate all pages */}
          <button
            type="button"
            onClick={() => onRotateAllPagesInDoc(document.id, 90)}
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:text-blue-600 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition"
            title="Rotate all pages in document (+90°)"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>

          {/* Move Document Order */}
          <div className="flex items-center border-l border-slate-200 dark:border-slate-800 pl-1.5 ml-1">
            <button
              type="button"
              disabled={docIndex === 0}
              onClick={() => onMoveDocOrder(document.id, 'up')}
              className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-20 transition"
              title="Move Document Up"
            >
              <MoveUp className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              disabled={docIndex === totalDocs - 1}
              onClick={() => onMoveDocOrder(document.id, 'down')}
              className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-20 transition"
              title="Move Document Down"
            >
              <MoveDown className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Duplicate Document */}
          <button
            type="button"
            onClick={() => onDuplicateDoc(document.id)}
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:text-emerald-600 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition"
            title="Duplicate entire document"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>

          {/* Delete Document */}
          <button
            type="button"
            onClick={() => onDeleteDoc(document.id)}
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:text-rose-600 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition"
            title="Remove document from workspace"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Document Pages Grid Area */}
      {!document.isCollapsed && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            // If dropping at the end of the document
            onPageDragOver(e, document.id, document.pages.length);
          }}
          onDrop={(e) => {
            e.preventDefault();
            onPageDrop(e, document.id, document.pages.length);
          }}
          className="p-5 bg-white dark:bg-[#111827] min-h-[160px]"
        >
          {document.pages.length === 0 ? (
            <div className="h-32 border-2 border-dashed border-[#CBD5E1] dark:border-[#334155] rounded-2xl flex flex-col items-center justify-center text-center p-4 text-slate-400 text-xs">
              <Plus className="w-6 h-6 mb-1 text-slate-300 dark:text-slate-600" />
              <p className="font-semibold">Empty Document Container</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Drag pages here from other documents to assemble your customized PDF.
              </p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-5 items-start">
              {document.pages.map((page, pageIndex) => {
                const isDragTarget =
                  dragTargetDocId === document.id && dragTargetPageIndex === pageIndex;

                return (
                  <PageThumbnailCard
                    key={page.id}
                    page={page}
                    pageIndex={pageIndex}
                    docId={document.id}
                    zoomScale={zoomScale}
                    isDragTarget={isDragTarget}
                    onToggleSelect={onToggleSelectPage}
                    onRotatePage={onRotatePage}
                    onDuplicatePage={onDuplicatePage}
                    onDeletePage={onDeletePage}
                    onDragStart={onPageDragStart}
                    onDragOver={onPageDragOver}
                    onDrop={onPageDrop}
                  />
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

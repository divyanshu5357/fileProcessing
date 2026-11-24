'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Plus, RotateCcw, Move } from 'lucide-react';
import {
  useSnapAlignment,
  type CanvasBlock,
} from './useSnapAlignment';
import { DraggableBlock } from './DraggableBlock';
import { FloatingToolbar } from './FloatingToolbar';

const PAGE_WIDTH = 794;
const PAGE_HEIGHT = 1123;
const PAGE_MARGIN = 48;

const INITIAL_RESUME_BLOCKS: CanvasBlock[] = [
  {
    id: 'blk-name',
    text: 'DIVYANSHU PRATAP SINGH',
    x: 197,
    y: 48,
    width: 400,
    height: 36,
    styles: {
      fontSize: 24,
      fontWeight: 'bold',
      fontStyle: 'normal',
      color: '#0F172A',
    },
  },
  {
    id: 'blk-contact',
    text: 'Senior Full-Stack Engineer  |  Bengaluru, India  |  hello@gyanvatsala.in',
    x: 162,
    y: 92,
    width: 470,
    height: 24,
    styles: {
      fontSize: 13,
      fontWeight: 'normal',
      fontStyle: 'normal',
      color: '#475569',
    },
  },
  {
    id: 'blk-sec-summary',
    text: 'PROFESSIONAL SUMMARY',
    x: 48,
    y: 148,
    width: 240,
    height: 24,
    styles: {
      fontSize: 13,
      fontWeight: 'bold',
      fontStyle: 'normal',
      color: '#1E3A8A',
    },
  },
  {
    id: 'blk-summary-body',
    text: 'Product-focused software engineer specializing in browser-native document pipelines, WebAssembly rendering, and responsive interactive editors built with React and TypeScript.',
    x: 48,
    y: 178,
    width: 698,
    height: 46,
    styles: {
      fontSize: 13,
      fontWeight: 'normal',
      fontStyle: 'normal',
      color: '#1E293B',
    },
  },
  {
    id: 'blk-sec-experience',
    text: 'EXPERIENCE',
    x: 48,
    y: 256,
    width: 180,
    height: 24,
    styles: {
      fontSize: 13,
      fontWeight: 'bold',
      fontStyle: 'normal',
      color: '#1E3A8A',
    },
  },
  {
    id: 'blk-exp-1-title',
    text: 'Staff Frontend Architect — Gyanvatsala Studio',
    x: 48,
    y: 290,
    width: 390,
    height: 24,
    styles: {
      fontSize: 14,
      fontWeight: 'bold',
      fontStyle: 'normal',
      color: '#0F172A',
    },
  },
  {
    id: 'blk-exp-1-date',
    text: 'Jan 2024 – Present',
    x: 590,
    y: 292,
    width: 146,
    height: 24,
    styles: {
      fontSize: 12,
      fontWeight: 'normal',
      fontStyle: 'italic',
      color: '#475569',
    },
  },
  {
    id: 'blk-exp-1-b1',
    text: '• Engineered zero-upload client-side PDF editing and alignment guide overlays at 60fps.',
    x: 68,
    y: 324,
    width: 668,
    height: 24,
    styles: {
      fontSize: 13,
      fontWeight: 'normal',
      fontStyle: 'normal',
      color: '#334155',
    },
  },
  {
    id: 'blk-exp-1-b2',
    text: '• Cut main-thread layout blocking and memory pressure across multi-page canvas views.',
    x: 68,
    y: 356,
    width: 668,
    height: 24,
    styles: {
      fontSize: 13,
      fontWeight: 'normal',
      fontStyle: 'normal',
      color: '#334155',
    },
  },
  {
    id: 'blk-sec-skills',
    text: 'TECHNICAL SKILLS',
    x: 48,
    y: 416,
    width: 220,
    height: 24,
    styles: {
      fontSize: 13,
      fontWeight: 'bold',
      fontStyle: 'normal',
      color: '#1E3A8A',
    },
  },
  {
    id: 'blk-skills-row1',
    text: 'Core Stack:  TypeScript, React 19, Next.js, Tailwind CSS, HTML5 Canvas, PDF.js',
    x: 48,
    y: 448,
    width: 560,
    height: 24,
    styles: {
      fontSize: 13,
      fontWeight: 'normal',
      fontStyle: 'normal',
      color: '#0F172A',
    },
  },
  {
    id: 'blk-skills-row2',
    text: 'Architecture:  Pointer Events, rAF Batching, Web Workers, PostgreSQL',
    x: 56,
    y: 480,
    width: 520,
    height: 24,
    styles: {
      fontSize: 13,
      fontWeight: 'normal',
      fontStyle: 'normal',
      color: '#0F172A',
    },
  },
];

export function DocumentCanvas() {
  // Primary Canvas State
  const [blocks, setBlocks] = useState<CanvasBlock[]>(INITIAL_RESUME_BLOCKS);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isEditingText, setIsEditingText] = useState(false);

  // Transient Drag State
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const { activeGuides, snapBlockDuringDrag, clearGuides } = useSnapAlignment({
    blocks,
    canvasWidth: PAGE_WIDTH,
    canvasHeight: PAGE_HEIGHT,
    marginX: PAGE_MARGIN,
    marginY: PAGE_MARGIN,
    threshold: 5,
  });

  const selectedBlock = blocks.find((b) => b.id === selectedId) || null;

  // Precision Keyboard Nudging (1px or 10px with Shift) & Escape deselection
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedId || isEditingText) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        setSelectedId(null);
        return;
      }

      const step = e.shiftKey ? 10 : 1;
      let dx = 0;
      let dy = 0;

      if (e.key === 'ArrowLeft') dx = -step;
      else if (e.key === 'ArrowRight') dx = step;
      else if (e.key === 'ArrowUp') dy = -step;
      else if (e.key === 'ArrowDown') dy = step;
      else return;

      e.preventDefault();
      setBlocks((prev) =>
        prev.map((block) => {
          if (block.id !== selectedId) return block;
          return {
            ...block,
            x: Math.max(0, Math.min(PAGE_WIDTH - block.width, block.x + dx)),
            y: Math.max(0, Math.min(PAGE_HEIGHT - block.height, block.y + dy)),
          };
        })
      );
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, isEditingText]);

  const handleDragStart = useCallback((id: string) => {
    setDraggingId(id);
    setSelectedId(id);
  }, []);

  const handleDragMove = useCallback(
    (id: string, rawX: number, rawY: number, disableSnap: boolean) => {
      const target = blocks.find((b) => b.id === id);
      if (!target) return;

      const snapped = snapBlockDuringDrag(
        {
          id: target.id,
          x: rawX,
          y: rawY,
          width: target.width,
          height: target.height,
        },
        disableSnap
      );

      setBlocks((prev) =>
        prev.map((b) =>
          b.id === id ? { ...b, x: snapped.x, y: snapped.y } : b
        )
      );
    },
    [blocks, snapBlockDuringDrag]
  );

  const handleDragEnd = useCallback(() => {
    setDraggingId(null);
    clearGuides();
  }, [clearGuides]);

  const handleTextChange = useCallback(
    (id: string, nextText: string, measuredHeight: number) => {
      setBlocks((prev) =>
        prev.map((b) =>
          b.id === id ? { ...b, text: nextText, height: measuredHeight } : b
        )
      );
    },
    []
  );

  const updateSelectedStyles = (
    updater: (styles: CanvasBlock['styles']) => CanvasBlock['styles']
  ) => {
    if (!selectedId) return;
    setBlocks((prev) =>
      prev.map((b) => (b.id === selectedId ? { ...b, styles: updater(b.styles) } : b))
    );
  };

  const handleDuplicateSelected = () => {
    if (!selectedBlock) return;
    const duplicate: CanvasBlock = {
      ...selectedBlock,
      id: `blk-${Date.now()}`,
      x: Math.min(PAGE_WIDTH - selectedBlock.width, selectedBlock.x + 16),
      y: Math.min(PAGE_HEIGHT - selectedBlock.height, selectedBlock.y + 18),
      styles: { ...selectedBlock.styles },
    };
    setBlocks((prev) => [...prev, duplicate]);
    setSelectedId(duplicate.id);
  };

  const handleDeleteSelected = () => {
    if (!selectedId) return;
    setBlocks((prev) => prev.filter((b) => b.id !== selectedId));
    setSelectedId(null);
    clearGuides();
  };

  const handleAddBlock = () => {
    const newBlock: CanvasBlock = {
      id: `blk-${Date.now()}`,
      text: 'New Editable Text Block',
      x: 48,
      y: 540,
      width: 280,
      height: 26,
      styles: {
        fontSize: 14,
        fontWeight: 'normal',
        fontStyle: 'normal',
        color: '#0F172A',
      },
    };
    setBlocks((prev) => [...prev, newBlock]);
    setSelectedId(newBlock.id);
  };

  return (
    <div
      onClick={() => {
        setSelectedId(null);
        setIsEditingText(false);
      }}
      className={`relative flex min-h-screen w-full flex-col items-center bg-slate-100 px-4 py-8 ${
        draggingId ? 'select-none' : ''
      }`}
    >
      {/* Top Action Controls + Subtle Dark Drag Tooltip Toast */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="mb-5 flex w-full max-w-[794px] flex-wrap items-center justify-between gap-3"
      >
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleAddBlock}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-[#2563EB] px-3.5 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-blue-700"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Text Block
          </button>
          <button
            type="button"
            onClick={() => {
              setBlocks(INITIAL_RESUME_BLOCKS);
              setSelectedId(null);
              clearGuides();
            }}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset Sample Resume
          </button>
        </div>

        <div className="text-xs font-medium text-slate-500">
          {selectedBlock ? (
            <span className="font-mono text-slate-700">
              x: {Math.round(selectedBlock.x)}px, y: {Math.round(selectedBlock.y)}px
            </span>
          ) : (
            <span>Click to select • Double-click to edit • Hold Alt while dragging to bypass snap</span>
          )}
        </div>
      </div>

      {/* Sticky Top Helper Tooltip when a block is selected */}
      {selectedId && (
        <div className="pointer-events-none sticky top-4 z-50 -mb-9 flex items-center gap-2 rounded-full bg-slate-900/95 px-3.5 py-1.5 text-xs font-medium text-white shadow-lg">
          <Move className="h-3.5 w-3.5 text-blue-400" />
          <span>Drag text with your mouse to move it</span>
        </div>
      )}

      {/* Horizontally scrollable wrapper for smaller screens */}
      <div className="w-full overflow-x-auto pb-8 pt-6">
        {/* A4 Proportioned Document Sheet */}
        <div
          onClick={() => setSelectedId(null)}
          style={{
            width: `${PAGE_WIDTH}px`,
            height: `${PAGE_HEIGHT}px`,
          }}
          className="relative mx-auto overflow-hidden rounded-sm border border-slate-200 bg-white shadow-xl"
        >
          {/* Floating Formatting Toolbar (only when selected & not mid-drag) */}
          {selectedBlock && !draggingId && (
            <FloatingToolbar
              block={selectedBlock}
              canvasWidth={PAGE_WIDTH}
              onToggleBold={() =>
                updateSelectedStyles((s) => ({
                  ...s,
                  fontWeight: s.fontWeight === 'bold' ? 'normal' : 'bold',
                }))
              }
              onToggleItalic={() =>
                updateSelectedStyles((s) => ({
                  ...s,
                  fontStyle: s.fontStyle === 'italic' ? 'normal' : 'italic',
                }))
              }
              onChangeFontSize={(delta) =>
                updateSelectedStyles((s) => ({
                  ...s,
                  fontSize: Math.max(9, Math.min(64, s.fontSize + delta)),
                }))
              }
              onChangeColor={(color) =>
                updateSelectedStyles((s) => ({ ...s, color }))
              }
              onDuplicate={handleDuplicateSelected}
              onDelete={handleDeleteSelected}
            />
          )}

          {/* Render Draggable Resume / Content Blocks */}
          {blocks.map((block) => (
            <DraggableBlock
              key={block.id}
              block={block}
              isSelected={block.id === selectedId}
              isDragging={block.id === draggingId}
              canvasWidth={PAGE_WIDTH}
              canvasHeight={PAGE_HEIGHT}
              onSelect={setSelectedId}
              onDragStart={handleDragStart}
              onDragMove={handleDragMove}
              onDragEnd={handleDragEnd}
              onTextChange={handleTextChange}
              onEditingChange={setIsEditingText}
            />
          ))}

          {/* SVG Overlay for Temporary Bright-Blue Dotted Snap Guides */}
          {draggingId && activeGuides.length > 0 && (
            <svg
              width={PAGE_WIDTH}
              height={PAGE_HEIGHT}
              viewBox={`0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}`}
              className="pointer-events-none absolute inset-0 z-30"
              aria-hidden="true"
            >
              {activeGuides.map((guide) =>
                guide.orientation === 'vertical' ? (
                  <g key={guide.id}>
                    <line
                      x1={guide.position}
                      y1={guide.start}
                      x2={guide.position}
                      y2={guide.end}
                      stroke="#2563EB"
                      strokeWidth={1}
                      strokeDasharray="3 3"
                    />
                    <circle cx={guide.position} cy={guide.start} r={2} fill="#2563EB" />
                    <circle cx={guide.position} cy={guide.end} r={2} fill="#2563EB" />
                  </g>
                ) : (
                  <g key={guide.id}>
                    <line
                      x1={guide.start}
                      y1={guide.position}
                      x2={guide.end}
                      y2={guide.position}
                      stroke="#2563EB"
                      strokeWidth={1}
                      strokeDasharray="3 3"
                    />
                    <circle cx={guide.start} cy={guide.position} r={2} fill="#2563EB" />
                    <circle cx={guide.end} cy={guide.position} r={2} fill="#2563EB" />
                  </g>
                )
              )}
            </svg>
          )}
        </div>
      </div>
    </div>
  );
}

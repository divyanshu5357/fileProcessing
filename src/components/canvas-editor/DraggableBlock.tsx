'use client';

import React, { useState, useRef, useEffect } from 'react';
import { GripVertical } from 'lucide-react';
import type { CanvasBlock } from './useSnapAlignment';

interface DraggableBlockProps {
  block: CanvasBlock;
  isSelected: boolean;
  isDragging: boolean;
  canvasWidth: number;
  canvasHeight: number;
  onSelect: (id: string) => void;
  onDragStart: (id: string) => void;
  onDragMove: (id: string, rawX: number, rawY: number, disableSnap: boolean) => void;
  onDragEnd: (id: string) => void;
  onTextChange: (id: string, nextText: string, measuredHeight: number) => void;
  onEditingChange?: (isEditing: boolean) => void;
}

export function DraggableBlock({
  block,
  isSelected,
  isDragging,
  canvasWidth,
  canvasHeight,
  onSelect,
  onDragStart,
  onDragMove,
  onDragEnd,
  onTextChange,
  onEditingChange,
}: DraggableBlockProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draftText, setDraftText] = useState(block.text);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const onDragMoveRef = useRef(onDragMove);
  const rafIdRef = useRef<number | null>(null);
  const activePointerIdRef = useRef<number | null>(null);
  const dragOriginRef = useRef<{
    clientX: number;
    clientY: number;
    startX: number;
    startY: number;
    altKey: boolean;
  } | null>(null);
  const latestPointerRef = useRef<{
    clientX: number;
    clientY: number;
    altKey: boolean;
  } | null>(null);

  useEffect(() => {
    onDragMoveRef.current = onDragMove;
  }, [onDragMove]);

  useEffect(() => {
    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      const el = textareaRef.current;
      el.focus();
      el.select();
      el.style.height = 'auto';
      el.style.height = `${Math.max(el.scrollHeight, block.height)}px`;
    }
  }, [isEditing, block.height]);

  const enterEditing = () => {
    setDraftText(block.text);
    setIsEditing(true);
    onEditingChange?.(true);
  };

  const commitEditing = () => {
    const measuredHeight = textareaRef.current
      ? Math.max(24, Math.ceil(textareaRef.current.scrollHeight))
      : block.height;
    setIsEditing(false);
    onEditingChange?.(false);
    onTextChange(block.id, draftText, measuredHeight);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 || isEditing) return;

    e.stopPropagation();
    onSelect(block.id);

    activePointerIdRef.current = e.pointerId;
    e.currentTarget.setPointerCapture(e.pointerId);

    dragOriginRef.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      startX: block.x,
      startY: block.y,
      altKey: e.altKey,
    };
    latestPointerRef.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      altKey: e.altKey,
    };

    onDragStart(block.id);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (activePointerIdRef.current !== e.pointerId || !dragOriginRef.current) {
      return;
    }

    latestPointerRef.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      altKey: e.altKey,
    };

    if (rafIdRef.current !== null) return;

    rafIdRef.current = requestAnimationFrame(() => {
      rafIdRef.current = null;
      const origin = dragOriginRef.current;
      const pointer = latestPointerRef.current;
      if (!origin || !pointer) return;

      const dx = pointer.clientX - origin.clientX;
      const dy = pointer.clientY - origin.clientY;

      const clampedX = Math.max(0, Math.min(canvasWidth - block.width, origin.startX + dx));
      const clampedY = Math.max(0, Math.min(canvasHeight - block.height, origin.startY + dy));

      onDragMoveRef.current(block.id, clampedX, clampedY, pointer.altKey);
    });
  };

  const finishDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    if (activePointerIdRef.current !== e.pointerId) return;

    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }

    if (dragOriginRef.current && latestPointerRef.current) {
      const dx = latestPointerRef.current.clientX - dragOriginRef.current.clientX;
      const dy = latestPointerRef.current.clientY - dragOriginRef.current.clientY;
      if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) {
        const clampedX = Math.max(
          0,
          Math.min(canvasWidth - block.width, dragOriginRef.current.startX + dx)
        );
        const clampedY = Math.max(
          0,
          Math.min(canvasHeight - block.height, dragOriginRef.current.startY + dy)
        );
        onDragMove(block.id, clampedX, clampedY, latestPointerRef.current.altKey);
      }
    }

    activePointerIdRef.current = null;
    dragOriginRef.current = null;
    latestPointerRef.current = null;

    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }

    onDragEnd(block.id);
  };

  return (
    <div
      ref={containerRef}
      role="button"
      tabIndex={0}
      aria-label={`Draggable text block: ${block.text}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={finishDrag}
      onPointerCancel={finishDrag}
      onClick={(e) => e.stopPropagation()}
      onDoubleClick={(e) => {
        e.stopPropagation();
        enterEditing();
      }}
      style={{
        transform: `translate3d(${block.x}px, ${block.y}px, 0)`,
        width: `${block.width}px`,
        minHeight: `${block.height}px`,
        touchAction: 'none',
      }}
      className={`group absolute left-0 top-0 rounded-sm px-1.5 py-0.5 transition-shadow ${
        isEditing
          ? 'z-30 cursor-text bg-white ring-2 ring-[#2563EB] shadow-sm'
          : isDragging
          ? 'z-30 cursor-grabbing bg-blue-50/40 ring-2 ring-[#2563EB] shadow-md select-none'
          : isSelected
          ? 'z-20 cursor-move bg-blue-50/20 ring-2 ring-[#2563EB] select-none'
          : 'z-10 cursor-move hover:bg-blue-50/30 hover:ring-1 hover:ring-[#2563EB]/50 select-none'
      }`}
    >
      {/* Left drag grip pill shown cleanly when selected or hovered */}
      {!isEditing && (
        <span
          className={`pointer-events-none absolute -left-5 top-1/2 -translate-y-1/2 flex h-5 w-4 items-center justify-center rounded-l bg-[#2563EB] text-white shadow-xs transition-opacity ${
            isSelected || isDragging ? 'opacity-100' : 'opacity-0 group-hover:opacity-75'
          }`}
          aria-hidden="true"
        >
          <GripVertical className="h-3 w-3" />
        </span>
      )}

      {/* Subtle corner selection indicators matching Sejda / Canva */}
      {isSelected && !isEditing && (
        <>
          <span className="pointer-events-none absolute -left-1 -top-1 h-2 w-2 rounded-full border border-[#2563EB] bg-white" />
          <span className="pointer-events-none absolute -right-1 -top-1 h-2 w-2 rounded-full border border-[#2563EB] bg-white" />
          <span className="pointer-events-none absolute -bottom-1 -left-1 h-2 w-2 rounded-full border border-[#2563EB] bg-white" />
          <span className="pointer-events-none absolute -bottom-1 -right-1 h-2 w-2 rounded-full border border-[#2563EB] bg-white" />
        </>
      )}

      {isEditing ? (
        <textarea
          ref={textareaRef}
          value={draftText}
          onChange={(e) => {
            setDraftText(e.target.value);
            e.target.style.height = 'auto';
            e.target.style.height = `${e.target.scrollHeight}px`;
          }}
          onBlur={commitEditing}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              e.stopPropagation();
              commitEditing();
            } else if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
              e.preventDefault();
              commitEditing();
            }
          }}
          style={{
            fontSize: `${block.styles.fontSize}px`,
            fontWeight: block.styles.fontWeight,
            fontStyle: block.styles.fontStyle,
            color: block.styles.color,
            lineHeight: 1.4,
          }}
          className="w-full resize-none overflow-hidden border-none bg-transparent p-0 font-sans outline-none"
        />
      ) : (
        <div
          style={{
            fontSize: `${block.styles.fontSize}px`,
            fontWeight: block.styles.fontWeight,
            fontStyle: block.styles.fontStyle,
            color: block.styles.color,
            lineHeight: 1.4,
          }}
          className="whitespace-pre-wrap break-words font-sans"
        >
          {block.text || 'Empty text block (double-click to edit)'}
        </div>
      )}
    </div>
  );
}

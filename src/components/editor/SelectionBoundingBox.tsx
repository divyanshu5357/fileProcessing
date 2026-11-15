'use client';

import React, { useRef, useState } from 'react';
import { RotateCw, Lock } from 'lucide-react';

export type ResizeHandleType = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';

interface SelectionBoundingBoxProps {
  x: number; // Screen px (relative to canvas container)
  y: number; // Screen px (relative to canvas container)
  width: number; // Screen px
  height: number; // Screen px
  rotation?: number; // In degrees (0-360)
  locked?: boolean;
  lockAspectRatio?: boolean;
  onMove: (deltaX: number, deltaY: number) => void;
  onResize: (
    handle: ResizeHandleType,
    newX: number,
    newY: number,
    newWidth: number,
    newHeight: number
  ) => void;
  onRotate?: (angle: number) => void;
  onInteractionEnd?: () => void;
  className?: string;
}

export function SelectionBoundingBox({
  x,
  y,
  width,
  height,
  rotation = 0,
  locked = false,
  lockAspectRatio = false,
  onMove,
  onResize,
  onRotate,
  onInteractionEnd,
  className = '',
}: SelectionBoundingBoxProps) {
  const [isInteracting, setIsInteracting] = useState(false);
  const dragStartRef = useRef<{
    pointerX: number;
    pointerY: number;
    startX: number;
    startY: number;
    startWidth: number;
    startHeight: number;
    startAngle: number;
    centerX: number;
    centerY: number;
  } | null>(null);

  // 1. Drag to Move
  const handleMovePointerDown = (e: React.PointerEvent) => {
    if (locked || e.button !== 0) return;
    e.stopPropagation();
    e.preventDefault();
    const target = e.currentTarget as HTMLElement;
    target.setPointerCapture(e.pointerId);

    dragStartRef.current = {
      pointerX: e.clientX,
      pointerY: e.clientY,
      startX: x,
      startY: y,
      startWidth: width,
      startHeight: height,
      startAngle: rotation,
      centerX: x + width / 2,
      centerY: y + height / 2,
    };
    setIsInteracting(true);
  };

  const handleMovePointerMove = (e: React.PointerEvent) => {
    if (!dragStartRef.current || locked) return;
    e.stopPropagation();
    e.preventDefault();

    const deltaX = e.clientX - dragStartRef.current.pointerX;
    const deltaY = e.clientY - dragStartRef.current.pointerY;

    if (deltaX !== 0 || deltaY !== 0) {
      onMove(deltaX, deltaY);
      dragStartRef.current.pointerX = e.clientX;
      dragStartRef.current.pointerY = e.clientY;
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!dragStartRef.current) return;
    e.stopPropagation();
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // Ignore if pointer capture already lost
    }
    dragStartRef.current = null;
    setIsInteracting(false);
    onInteractionEnd?.();
  };

  // 2. Resize Handles
  const handleResizePointerDown = (
    handle: ResizeHandleType,
    e: React.PointerEvent
  ) => {
    if (locked || e.button !== 0) return;
    e.stopPropagation();
    e.preventDefault();
    const target = e.currentTarget as HTMLElement;
    target.setPointerCapture(e.pointerId);

    dragStartRef.current = {
      pointerX: e.clientX,
      pointerY: e.clientY,
      startX: x,
      startY: y,
      startWidth: width,
      startHeight: height,
      startAngle: rotation,
      centerX: x + width / 2,
      centerY: y + height / 2,
    };
    setIsInteracting(true);
  };

  const handleResizePointerMove = (
    handle: ResizeHandleType,
    e: React.PointerEvent
  ) => {
    if (!dragStartRef.current || locked) return;
    e.stopPropagation();
    e.preventDefault();

    const { pointerX, pointerY, startX, startY, startWidth, startHeight } =
      dragStartRef.current;
    const dx = e.clientX - pointerX;
    const dy = e.clientY - pointerY;

    let newX = startX;
    let newY = startY;
    let newW = startWidth;
    let newH = startHeight;
    const minSize = 16;
    const initialAspect = startWidth / (startHeight || 1);

    // Calculate unrotated delta
    if (handle === 'e') {
      newW = Math.max(minSize, startWidth + dx);
      if (lockAspectRatio) newH = newW / initialAspect;
    } else if (handle === 'w') {
      const allowedDx = Math.min(dx, startWidth - minSize);
      newX = startX + allowedDx;
      newW = startWidth - allowedDx;
      if (lockAspectRatio) newH = newW / initialAspect;
    } else if (handle === 's') {
      newH = Math.max(minSize, startHeight + dy);
      if (lockAspectRatio) newW = newH * initialAspect;
    } else if (handle === 'n') {
      const allowedDy = Math.min(dy, startHeight - minSize);
      newY = startY + allowedDy;
      newH = startHeight - allowedDy;
      if (lockAspectRatio) newW = newH * initialAspect;
    } else if (handle === 'se') {
      if (lockAspectRatio) {
        const delta = Math.max(dx, dy);
        newW = Math.max(minSize, startWidth + delta);
        newH = newW / initialAspect;
      } else {
        newW = Math.max(minSize, startWidth + dx);
        newH = Math.max(minSize, startHeight + dy);
      }
    } else if (handle === 'sw') {
      if (lockAspectRatio) {
        const delta = -dx;
        newW = Math.max(minSize, startWidth + delta);
        newH = newW / initialAspect;
        newX = startX + (startWidth - newW);
      } else {
        const allowedDx = Math.min(dx, startWidth - minSize);
        newX = startX + allowedDx;
        newW = startWidth - allowedDx;
        newH = Math.max(minSize, startHeight + dy);
      }
    } else if (handle === 'ne') {
      if (lockAspectRatio) {
        const delta = dx;
        newW = Math.max(minSize, startWidth + delta);
        newH = newW / initialAspect;
        newY = startY + (startHeight - newH);
      } else {
        newW = Math.max(minSize, startWidth + dx);
        const allowedDy = Math.min(dy, startHeight - minSize);
        newY = startY + allowedDy;
        newH = startHeight - allowedDy;
      }
    } else if (handle === 'nw') {
      if (lockAspectRatio) {
        const delta = -dx;
        newW = Math.max(minSize, startWidth + delta);
        newH = newW / initialAspect;
        newX = startX + (startWidth - newW);
        newY = startY + (startHeight - newH);
      } else {
        const allowedDx = Math.min(dx, startWidth - minSize);
        const allowedDy = Math.min(dy, startHeight - minSize);
        newX = startX + allowedDx;
        newY = startY + allowedDy;
        newW = startWidth - allowedDx;
        newH = startHeight - allowedDy;
      }
    }

    onResize(handle, newX, newY, Math.round(newW), Math.round(newH));
  };

  // 3. Rotation Handle
  const handleRotatePointerDown = (e: React.PointerEvent) => {
    if (locked || e.button !== 0 || !onRotate) return;
    e.stopPropagation();
    e.preventDefault();
    const target = e.currentTarget as HTMLElement;
    target.setPointerCapture(e.pointerId);

    const centerX = x + width / 2;
    const centerY = y + height / 2;
    const rad = Math.atan2(e.clientY - centerY, e.clientX - centerX);
    const initialDeg = (rad * 180) / Math.PI;

    dragStartRef.current = {
      pointerX: e.clientX,
      pointerY: e.clientY,
      startX: x,
      startY: y,
      startWidth: width,
      startHeight: height,
      startAngle: rotation,
      centerX,
      centerY,
    };
    setIsInteracting(true);
  };

  const handleRotatePointerMove = (e: React.PointerEvent) => {
    if (!dragStartRef.current || locked || !onRotate) return;
    e.stopPropagation();
    e.preventDefault();

    const { centerX, centerY } = dragStartRef.current;
    const rad = Math.atan2(e.clientY - centerY, e.clientX - centerX);
    let deg = (rad * 180) / Math.PI + 90; // Top is 0 degrees
    if (deg < 0) deg += 360;

    // Snap to 45 degree increments if Shift is pressed
    if (e.shiftKey) {
      deg = Math.round(deg / 45) * 45;
    }

    onRotate(Math.round(deg % 360));
  };

  const handleRotatePointerUp = (e: React.PointerEvent) => {
    if (!dragStartRef.current) return;
    e.stopPropagation();
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // Ignore
    }
    dragStartRef.current = null;
    setIsInteracting(false);
    onInteractionEnd?.();
  };

  // Handles configuration
  const handles: { type: ResizeHandleType; cursor: string; style: React.CSSProperties }[] = [
    { type: 'nw', cursor: 'nwse-resize', style: { top: -5, left: -5 } },
    { type: 'n', cursor: 'ns-resize', style: { top: -5, left: '50%', transform: 'translateX(-50%)' } },
    { type: 'ne', cursor: 'nesw-resize', style: { top: -5, right: -5 } },
    { type: 'e', cursor: 'ew-resize', style: { top: '50%', right: -5, transform: 'translateY(-50%)' } },
    { type: 'se', cursor: 'nwse-resize', style: { bottom: -5, right: -5 } },
    { type: 's', cursor: 'ns-resize', style: { bottom: -5, left: '50%', transform: 'translateX(-50%)' } },
    { type: 'sw', cursor: 'nesw-resize', style: { bottom: -5, left: -5 } },
    { type: 'w', cursor: 'ew-resize', style: { top: '50%', left: -5, transform: 'translateY(-50%)' } },
  ];

  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width,
        height,
        transform: rotation ? `rotate(${rotation}deg)` : undefined,
        transformOrigin: 'center center',
        zIndex: 50,
      }}
      className={`pointer-events-none select-none ${className}`}
    >
      {/* Outer Selection Rectangle */}
      <div
        onPointerDown={handleMovePointerDown}
        onPointerMove={handleMovePointerMove}
        onPointerUp={handlePointerUp}
        style={{
          cursor: locked ? 'default' : 'move',
        }}
        className={`w-full h-full border-2 border-[#2563EB] shadow-xs pointer-events-auto ${
          isInteracting ? 'border-dashed' : 'border-solid'
        }`}
      />

      {/* Locked Badge */}
      {locked && (
        <div className="absolute top-1 right-1 bg-amber-500 text-white p-0.5 rounded-xs shadow-xs pointer-events-none">
          <Lock className="w-2.5 h-2.5" />
        </div>
      )}

      {/* Resize Handles (8 Points) */}
      {!locked &&
        handles.map((h) => (
          <div
            key={h.type}
            onPointerDown={(e) => handleResizePointerDown(h.type, e)}
            onPointerMove={(e) => handleResizePointerMove(h.type, e)}
            onPointerUp={handlePointerUp}
            style={{
              ...h.style,
              cursor: h.cursor,
            }}
            className="absolute w-2.5 h-2.5 bg-white border-2 border-[#2563EB] rounded-xs shadow-xs hover:scale-125 transition-transform pointer-events-auto"
          />
        ))}

      {/* Rotation Knob & Stem */}
      {!locked && onRotate && (
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: -24,
            transform: 'translateX(-50%)',
          }}
          className="flex flex-col items-center pointer-events-auto"
        >
          {/* Rotation Handle Button */}
          <div
            onPointerDown={handleRotatePointerDown}
            onPointerMove={handleRotatePointerMove}
            onPointerUp={handleRotatePointerUp}
            title={`Rotate (Current: ${rotation}°)`}
            className="w-4 h-4 rounded-full bg-white border-2 border-[#2563EB] hover:bg-blue-50 flex items-center justify-center cursor-grab active:cursor-grabbing shadow-xs hover:scale-110 transition-transform"
          >
            <RotateCw className="w-2.5 h-2.5 text-[#2563EB]" />
          </div>
          {/* Connecting Stem */}
          <div className="w-[1.5px] h-2 bg-[#2563EB]" />
        </div>
      )}
    </div>
  );
}

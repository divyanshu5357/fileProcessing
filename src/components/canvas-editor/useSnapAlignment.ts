'use client';

import { useState, useCallback, useRef } from 'react';

export interface BlockStyles {
  fontSize: number;
  fontWeight: 'normal' | 'bold';
  fontStyle: 'normal' | 'italic';
  color: string;
}

export interface CanvasBlock {
  id: string;
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  styles: BlockStyles;
}

export interface SnapGuide {
  id: string;
  orientation: 'horizontal' | 'vertical';
  position: number;
  start: number;
  end: number;
  source: 'block' | 'center' | 'margin';
}

export interface DragRect {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SnapAlignmentOptions {
  blocks: CanvasBlock[];
  canvasWidth: number;
  canvasHeight: number;
  marginX?: number;
  marginY?: number;
  threshold?: number;
}

export interface SnapCalculationResult {
  snappedX: number;
  snappedY: number;
  guides: SnapGuide[];
}

interface AxisTarget {
  coord: number;
  spanStart: number;
  spanEnd: number;
  source: 'block' | 'center' | 'margin';
}

/**
 * Pure bounding-box snap & dotted alignment guide calculator.
 * Checks top/verticalCenter/bottom (horizontal guides) and
 * left/horizontalCenter/right (vertical guides) against sibling blocks,
 * page centerlines, and page margins.
 */
export function computeSnapAlignment(
  dragged: DragRect,
  options: Omit<SnapAlignmentOptions, 'blocks'> & {
    otherBlocks: CanvasBlock[];
    disableSnap?: boolean;
  }
): SnapCalculationResult {
  const {
    otherBlocks,
    canvasWidth,
    canvasHeight,
    marginX = 48,
    marginY = 48,
    threshold = 5,
    disableSnap = false,
  } = options;

  if (disableSnap) {
    return { snappedX: dragged.x, snappedY: dragged.y, guides: [] };
  }

  const computeAxisSnap = (
    originCoord: number,
    length: number,
    orthOrigin: number,
    orthLength: number,
    axisLength: number,
    orthAxisLength: number,
    margin: number,
    orientation: 'vertical' | 'horizontal'
  ): { snappedCoord: number; guides: SnapGuide[] } => {
    // 3 anchor offsets relative to the dragged box origin
    const draggedAnchors = [0, length / 2, length];

    const targets: AxisTarget[] = [
      {
        coord: axisLength / 2,
        spanStart: 0,
        spanEnd: orthAxisLength,
        source: 'center',
      },
      {
        coord: margin,
        spanStart: 0,
        spanEnd: orthAxisLength,
        source: 'margin',
      },
      {
        coord: axisLength - margin,
        spanStart: 0,
        spanEnd: orthAxisLength,
        source: 'margin',
      },
    ];

    for (const block of otherBlocks) {
      if (block.id === dragged.id) continue;
      const bCoord = orientation === 'vertical' ? block.x : block.y;
      const bLen = orientation === 'vertical' ? block.width : block.height;
      const bOrthCoord = orientation === 'vertical' ? block.y : block.x;
      const bOrthLen = orientation === 'vertical' ? block.height : block.width;

      const spanStart = Math.min(orthOrigin, bOrthCoord);
      const spanEnd = Math.max(orthOrigin + orthLength, bOrthCoord + bOrthLen);

      targets.push(
        { coord: bCoord, spanStart, spanEnd, source: 'block' },
        { coord: bCoord + bLen / 2, spanStart, spanEnd, source: 'block' },
        { coord: bCoord + bLen, spanStart, spanEnd, source: 'block' }
      );
    }

    let bestDelta = 0;
    let minAbsDelta = threshold + 0.001;

    for (const anchorOffset of draggedAnchors) {
      const draggedEdge = originCoord + anchorOffset;
      for (const target of targets) {
        const delta = target.coord - draggedEdge;
        const absDelta = Math.abs(delta);
        if (absDelta < minAbsDelta) {
          minAbsDelta = absDelta;
          bestDelta = delta;
        }
      }
    }

    const didSnap = minAbsDelta <= threshold;
    const snappedCoord = didSnap ? originCoord + bestDelta : originCoord;

    if (!didSnap) {
      return { snappedCoord, guides: [] };
    }

    // Collect every guide line that cleanly matches the snapped coordinate
    const mergedByPosition = new Map<number, SnapGuide>();

    for (const anchorOffset of draggedAnchors) {
      const snappedEdge = snappedCoord + anchorOffset;
      for (const target of targets) {
        if (Math.abs(target.coord - snappedEdge) <= 0.5) {
          const roundedPos = Math.round(target.coord * 10) / 10;
          const existing = mergedByPosition.get(roundedPos);
          if (existing) {
            existing.start = Math.min(existing.start, target.spanStart);
            existing.end = Math.max(existing.end, target.spanEnd);
            if (target.source !== 'block') {
              existing.source = target.source;
            }
          } else {
            mergedByPosition.set(roundedPos, {
              id: `${orientation}_${roundedPos}`,
              orientation,
              position: target.coord,
              start: target.spanStart,
              end: target.spanEnd,
              source: target.source,
            });
          }
        }
      }
    }

    return {
      snappedCoord,
      guides: Array.from(mergedByPosition.values()),
    };
  };

  // Solve Y first so orthogonal spans for vertical guides use snappedY, then X
  const verticalSolve = computeAxisSnap(
    dragged.x,
    dragged.width,
    dragged.y,
    dragged.height,
    canvasWidth,
    canvasHeight,
    marginX,
    'vertical'
  );

  const horizontalSolve = computeAxisSnap(
    dragged.y,
    dragged.height,
    verticalSolve.snappedCoord,
    dragged.width,
    canvasHeight,
    canvasWidth,
    marginY,
    'horizontal'
  );

  // Re-evaluate vertical guide orthogonal bounds using final snappedY
  const guides: SnapGuide[] = [
    ...verticalSolve.guides.map((g) => ({
      ...g,
      start:
        g.source === 'block'
          ? Math.min(g.start, horizontalSolve.snappedCoord)
          : g.start,
      end:
        g.source === 'block'
          ? Math.max(g.end, horizontalSolve.snappedCoord + dragged.height)
          : g.end,
    })),
    ...horizontalSolve.guides,
  ];

  return {
    snappedX: verticalSolve.snappedCoord,
    snappedY: horizontalSolve.snappedCoord,
    guides,
  };
}

function serializeGuides(guides: SnapGuide[]): string {
  return guides
    .map(
      (g) =>
        `${g.orientation}:${Math.round(g.position)}:${Math.round(g.start)}:${Math.round(g.end)}`
    )
    .join('|');
}

/**
 * Custom React hook encapsulating transient alignment guide state during drags.
 */
export function useSnapAlignment(options: SnapAlignmentOptions) {
  const {
    blocks,
    canvasWidth,
    canvasHeight,
    marginX = 48,
    marginY = 48,
    threshold = 5,
  } = options;

  const [activeGuides, setActiveGuides] = useState<SnapGuide[]>([]);
  const lastSignatureRef = useRef<string>('');

  const clearGuides = useCallback(() => {
    if (lastSignatureRef.current !== '') {
      lastSignatureRef.current = '';
      setActiveGuides([]);
    }
  }, []);

  const snapBlockDuringDrag = useCallback(
    (dragged: DragRect, disableSnap = false): { x: number; y: number } => {
      const result = computeSnapAlignment(dragged, {
        otherBlocks: blocks,
        canvasWidth,
        canvasHeight,
        marginX,
        marginY,
        threshold,
        disableSnap,
      });

      const signature = serializeGuides(result.guides);
      if (signature !== lastSignatureRef.current) {
        lastSignatureRef.current = signature;
        setActiveGuides(result.guides);
      }

      return { x: result.snappedX, y: result.snappedY };
    },
    [blocks, canvasWidth, canvasHeight, marginX, marginY, threshold]
  );

  return {
    activeGuides,
    snapBlockDuringDrag,
    clearGuides,
  };
}

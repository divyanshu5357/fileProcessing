import { AlignmentGuide } from '@/types/pdfEditor';

export interface BoundingBox {
  id?: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface AlignmentResult {
  snappedX: number;
  snappedY: number;
  guides: AlignmentGuide[];
}

/**
 * Calculates smart alignment guides and magnetic snapping against page center and other objects.
 * Similar to Figma / Canva smart guides.
 */
export function calculateAlignmentAndSnap({
  draggedBox,
  referenceBoxes,
  pageBounds,
  snapThreshold = 5,
}: {
  draggedBox: BoundingBox;
  referenceBoxes: BoundingBox[];
  pageBounds: { width: number; height: number };
  snapThreshold?: number;
}): AlignmentResult {
  let snappedX = draggedBox.x;
  let snappedY = draggedBox.y;
  const guides: AlignmentGuide[] = [];

  const draggedLeft = draggedBox.x;
  const draggedCenterX = draggedBox.x + draggedBox.width / 2;
  const draggedRight = draggedBox.x + draggedBox.width;

  const draggedTop = draggedBox.y;
  const draggedCenterY = draggedBox.y + draggedBox.height / 2;
  const draggedBottom = draggedBox.y + draggedBox.height;

  // 1. VERTICAL ALIGNMENT (X-Axis guides)
  interface XCandidate {
    guideX: number;
    diff: number; // how much to shift draggedBox.x
    refYStart: number;
    refYEnd: number;
    label?: string;
  }

  const xCandidates: XCandidate[] = [];

  // A. Page Center X
  const pageCenterX = pageBounds.width / 2;
  const distCenterToPageCenter = pageCenterX - draggedCenterX;
  if (Math.abs(distCenterToPageCenter) <= snapThreshold) {
    xCandidates.push({
      guideX: pageCenterX,
      diff: -distCenterToPageCenter,
      refYStart: 0,
      refYEnd: pageBounds.height,
      label: 'Page Center',
    });
  }

  // B. Other objects on page
  for (const ref of referenceBoxes) {
    const refLeft = ref.x;
    const refCenterX = ref.x + ref.width / 2;
    const refRight = ref.x + ref.width;

    const yStart = Math.min(draggedTop, ref.y);
    const yEnd = Math.max(draggedBottom, ref.y + ref.height);

    // Left-to-Left
    if (Math.abs(refLeft - draggedLeft) <= snapThreshold) {
      xCandidates.push({ guideX: refLeft, diff: draggedLeft - refLeft, refYStart: yStart, refYEnd: yEnd });
    }
    // Right-to-Right
    if (Math.abs(refRight - draggedRight) <= snapThreshold) {
      xCandidates.push({ guideX: refRight, diff: draggedRight - refRight, refYStart: yStart, refYEnd: yEnd });
    }
    // Center-to-Center X
    if (Math.abs(refCenterX - draggedCenterX) <= snapThreshold) {
      xCandidates.push({ guideX: refCenterX, diff: draggedCenterX - refCenterX, refYStart: yStart, refYEnd: yEnd });
    }
    // Left-to-Right
    if (Math.abs(refRight - draggedLeft) <= snapThreshold) {
      xCandidates.push({ guideX: refRight, diff: draggedLeft - refRight, refYStart: yStart, refYEnd: yEnd });
    }
    // Right-to-Left
    if (Math.abs(refLeft - draggedRight) <= snapThreshold) {
      xCandidates.push({ guideX: refLeft, diff: draggedRight - refLeft, refYStart: yStart, refYEnd: yEnd });
    }
  }

  // Pick closest vertical snap
  if (xCandidates.length > 0) {
    xCandidates.sort((a, b) => Math.abs(a.diff) - Math.abs(b.diff));
    const bestX = xCandidates[0];
    snappedX = draggedBox.x - bestX.diff;

    // Include all guides matching best snap within 0.5px
    for (const cand of xCandidates) {
      if (Math.abs(cand.diff - bestX.diff) <= 0.5) {
        guides.push({
          id: `v_${cand.guideX.toFixed(1)}_${Math.random().toString(36).substring(2, 6)}`,
          type: 'vertical',
          position: cand.guideX,
          start: Math.max(0, cand.refYStart - 10),
          end: Math.min(pageBounds.height, cand.refYEnd + 10),
          label: cand.label,
        });
      }
    }
  }

  // 2. HORIZONTAL ALIGNMENT (Y-Axis guides)
  interface YCandidate {
    guideY: number;
    diff: number; // how much to shift draggedBox.y
    refXStart: number;
    refXEnd: number;
    label?: string;
  }

  const yCandidates: YCandidate[] = [];

  // A. Page Center Y
  const pageCenterY = pageBounds.height / 2;
  const distCenterToPageCenterY = pageCenterY - draggedCenterY;
  if (Math.abs(distCenterToPageCenterY) <= snapThreshold) {
    yCandidates.push({
      guideY: pageCenterY,
      diff: -distCenterToPageCenterY,
      refXStart: 0,
      refXEnd: pageBounds.width,
      label: 'Page Center',
    });
  }

  // B. Other objects on page
  for (const ref of referenceBoxes) {
    const refTop = ref.y;
    const refCenterY = ref.y + ref.height / 2;
    const refBottom = ref.y + ref.height;

    const xStart = Math.min(draggedLeft, ref.x);
    const xEnd = Math.max(draggedRight, ref.x + ref.width);

    // Top-to-Top
    if (Math.abs(refTop - draggedTop) <= snapThreshold) {
      yCandidates.push({ guideY: refTop, diff: draggedTop - refTop, refXStart: xStart, refXEnd: xEnd });
    }
    // Bottom-to-Bottom
    if (Math.abs(refBottom - draggedBottom) <= snapThreshold) {
      yCandidates.push({ guideY: refBottom, diff: draggedBottom - refBottom, refXStart: xStart, refXEnd: xEnd });
    }
    // Center-to-Center Y
    if (Math.abs(refCenterY - draggedCenterY) <= snapThreshold) {
      yCandidates.push({ guideY: refCenterY, diff: draggedCenterY - refCenterY, refXStart: xStart, refXEnd: xEnd });
    }
    // Top-to-Bottom
    if (Math.abs(refBottom - draggedTop) <= snapThreshold) {
      yCandidates.push({ guideY: refBottom, diff: draggedTop - refBottom, refXStart: xStart, refXEnd: xEnd });
    }
    // Bottom-to-Top
    if (Math.abs(refTop - draggedBottom) <= snapThreshold) {
      yCandidates.push({ guideY: refTop, diff: draggedBottom - refTop, refXStart: xStart, refXEnd: xEnd });
    }
  }

  // Pick closest horizontal snap
  if (yCandidates.length > 0) {
    yCandidates.sort((a, b) => Math.abs(a.diff) - Math.abs(b.diff));
    const bestY = yCandidates[0];
    snappedY = draggedBox.y - bestY.diff;

    // Include all guides matching best snap within 0.5px
    for (const cand of yCandidates) {
      if (Math.abs(cand.diff - bestY.diff) <= 0.5) {
        guides.push({
          id: `h_${cand.guideY.toFixed(1)}_${Math.random().toString(36).substring(2, 6)}`,
          type: 'horizontal',
          position: cand.guideY,
          start: Math.max(0, cand.refXStart - 10),
          end: Math.min(pageBounds.width, cand.refXEnd + 10),
          label: cand.label,
        });
      }
    }
  }

  return {
    snappedX,
    snappedY,
    guides,
  };
}

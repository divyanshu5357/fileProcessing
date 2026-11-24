import type { AlignmentGuide } from '@/types/pdfEditor';

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
 * Calculates temporary full-page dotted alignment guides (and optional soft snapping)
 * across both sides of the dragged row/object from edge to edge of the page.
 */
export function calculateAlignmentAndSnap({
  draggedBox,
  referenceBoxes,
  pageBounds,
  originBox = null,
  snapThreshold = 4,
  guidesOnly = false,
  includeRowRails = true,
}: {
  draggedBox: BoundingBox;
  referenceBoxes: BoundingBox[];
  pageBounds: { width: number; height: number };
  originBox?: BoundingBox | null;
  snapThreshold?: number;
  guidesOnly?: boolean;
  includeRowRails?: boolean;
}): AlignmentResult {
  let snappedX = draggedBox.x;
  let snappedY = draggedBox.y;

  const draggedLeft = draggedBox.x;
  const draggedCenterX = draggedBox.x + draggedBox.width / 2;
  const draggedRight = draggedBox.x + draggedBox.width;

  const draggedTop = draggedBox.y;
  const draggedCenterY = draggedBox.y + draggedBox.height / 2;
  const draggedBottom = draggedBox.y + draggedBox.height;

  // 1. VERTICAL ALIGNMENT CANDIDATES (Top-to-Bottom dotted guides across full page height)
  interface Candidate {
    pos: number;
    diff: number;
    label?: string;
  }

  const xCandidates: Candidate[] = [];

  // Origin vertical track (keeps a moved row vertically aligned with its starting column)
  if (originBox) {
    const origLeft = originBox.x;
    const origRight = originBox.x + originBox.width;

    if (Math.abs(origLeft - draggedLeft) <= snapThreshold) {
      xCandidates.push({ pos: origLeft, diff: draggedLeft - origLeft, label: 'Start Column' });
    }
    if (Math.abs(origRight - draggedRight) <= snapThreshold) {
      xCandidates.push({ pos: origRight, diff: draggedRight - origRight });
    }
  }

  // Page Center X
  const pageCenterX = pageBounds.width / 2;
  if (Math.abs(pageCenterX - draggedCenterX) <= snapThreshold) {
    xCandidates.push({
      pos: pageCenterX,
      diff: draggedCenterX - pageCenterX,
      label: 'Page Center',
    });
  }

  // Other objects & rows on page
  for (const ref of referenceBoxes) {
    const refLeft = ref.x;
    const refCenterX = ref.x + ref.width / 2;
    const refRight = ref.x + ref.width;

    if (Math.abs(refLeft - draggedLeft) <= snapThreshold) {
      xCandidates.push({ pos: refLeft, diff: draggedLeft - refLeft });
    }
    if (Math.abs(refRight - draggedRight) <= snapThreshold) {
      xCandidates.push({ pos: refRight, diff: draggedRight - refRight });
    }
    if (Math.abs(refCenterX - draggedCenterX) <= snapThreshold) {
      xCandidates.push({ pos: refCenterX, diff: draggedCenterX - refCenterX });
    }
    if (Math.abs(refRight - draggedLeft) <= snapThreshold) {
      xCandidates.push({ pos: refRight, diff: draggedLeft - refRight });
    }
    if (Math.abs(refLeft - draggedRight) <= snapThreshold) {
      xCandidates.push({ pos: refLeft, diff: draggedRight - refLeft });
    }
  }

  const matchGuides: AlignmentGuide[] = [];
  const matchedXPositions: number[] = [];

  if (xCandidates.length > 0) {
    xCandidates.sort((a, b) => Math.abs(a.diff) - Math.abs(b.diff));
    const bestX = xCandidates[0];
    if (!guidesOnly) {
      snappedX = draggedBox.x - bestX.diff;
    }

    const seenX = new Set<number>();
    for (const cand of xCandidates) {
      if (Math.abs(cand.diff - bestX.diff) <= 0.75) {
        const key = Math.round(cand.pos * 2) / 2;
        if (seenX.has(key)) continue;
        seenX.add(key);
        matchedXPositions.push(cand.pos);
        matchGuides.push({
          id: `vm_${key}`,
          type: 'vertical',
          position: cand.pos,
          start: 0,
          end: pageBounds.height,
          label: cand.label,
          variant: 'match',
        });
      }
    }
  }

  // 2. HORIZONTAL ALIGNMENT CANDIDATES (Left-to-Right dotted guides across full page width)
  const yCandidates: Candidate[] = [];

  // Origin horizontal track (keeps a moved row horizontally straight with its starting row line)
  if (originBox) {
    const origTop = originBox.y;
    const origBottom = originBox.y + originBox.height;

    if (Math.abs(origTop - draggedTop) <= snapThreshold) {
      yCandidates.push({ pos: origTop, diff: draggedTop - origTop, label: 'Start Row' });
    }
    if (Math.abs(origBottom - draggedBottom) <= snapThreshold) {
      yCandidates.push({ pos: origBottom, diff: draggedBottom - origBottom });
    }
  }

  // Page Center Y
  const pageCenterY = pageBounds.height / 2;
  if (Math.abs(pageCenterY - draggedCenterY) <= snapThreshold) {
    yCandidates.push({
      pos: pageCenterY,
      diff: draggedCenterY - pageCenterY,
      label: 'Page Center',
    });
  }

  // Other objects & rows on page
  for (const ref of referenceBoxes) {
    const refTop = ref.y;
    const refCenterY = ref.y + ref.height / 2;
    const refBottom = ref.y + ref.height;

    if (Math.abs(refTop - draggedTop) <= snapThreshold) {
      yCandidates.push({ pos: refTop, diff: draggedTop - refTop });
    }
    if (Math.abs(refBottom - draggedBottom) <= snapThreshold) {
      yCandidates.push({ pos: refBottom, diff: draggedBottom - refBottom });
    }
    if (Math.abs(refCenterY - draggedCenterY) <= snapThreshold) {
      yCandidates.push({ pos: refCenterY, diff: draggedCenterY - refCenterY });
    }
    if (Math.abs(refBottom - draggedTop) <= snapThreshold) {
      yCandidates.push({ pos: refBottom, diff: draggedTop - refBottom });
    }
    if (Math.abs(refTop - draggedBottom) <= snapThreshold) {
      yCandidates.push({ pos: refTop, diff: draggedBottom - refTop });
    }
  }

  const matchedYPositions: number[] = [];

  if (yCandidates.length > 0) {
    yCandidates.sort((a, b) => Math.abs(a.diff) - Math.abs(b.diff));
    const bestY = yCandidates[0];
    if (!guidesOnly) {
      snappedY = draggedBox.y - bestY.diff;
    }

    const seenY = new Set<number>();
    for (const cand of yCandidates) {
      if (Math.abs(cand.diff - bestY.diff) <= 0.75) {
        const key = Math.round(cand.pos * 2) / 2;
        if (seenY.has(key)) continue;
        seenY.add(key);
        matchedYPositions.push(cand.pos);
        matchGuides.push({
          id: `hm_${key}`,
          type: 'horizontal',
          position: cand.pos,
          start: 0,
          end: pageBounds.width,
          label: cand.label,
          variant: 'match',
        });
      }
    }
  }

  // 3. Always-on temporary edge-to-edge dotted rails from BOTH sides of the dragged row
  const railGuides: AlignmentGuide[] = [];
  if (includeRowRails) {
    const curLeft = guidesOnly ? draggedLeft : snappedX;
    const curRight = curLeft + draggedBox.width;
    const curTop = guidesOnly ? draggedTop : snappedY;
    const curBottom = curTop + draggedBox.height;

    const hasMatchedNear = (arr: number[], val: number) =>
      arr.some((p) => Math.abs(p - val) <= 1.5);

    if (!hasMatchedNear(matchedXPositions, curLeft)) {
      railGuides.push({
        id: 'vr_left',
        type: 'vertical',
        position: curLeft,
        start: 0,
        end: pageBounds.height,
        variant: 'rail',
      });
    }
    if (draggedBox.width >= 6 && !hasMatchedNear(matchedXPositions, curRight)) {
      railGuides.push({
        id: 'vr_right',
        type: 'vertical',
        position: curRight,
        start: 0,
        end: pageBounds.height,
        variant: 'rail',
      });
    }
    if (!hasMatchedNear(matchedYPositions, curTop)) {
      railGuides.push({
        id: 'hr_top',
        type: 'horizontal',
        position: curTop,
        start: 0,
        end: pageBounds.width,
        variant: 'rail',
      });
    }
    if (draggedBox.height >= 4 && !hasMatchedNear(matchedYPositions, curBottom)) {
      railGuides.push({
        id: 'hr_bottom',
        type: 'horizontal',
        position: curBottom,
        start: 0,
        end: pageBounds.width,
        variant: 'rail',
      });
    }
  }

  return {
    snappedX,
    snappedY,
    guides: [...railGuides, ...matchGuides],
  };
}

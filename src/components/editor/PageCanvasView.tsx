'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { getPdfJs } from '@/lib/pdfjsLoader';
import {
  PdfTextItem,
  AddedTextElement,
  WhiteoutElement,
  ImageElement,
  SignatureElement,
  AnnotationElement,
  ShapeElement,
  FormFieldElement,
  EditorToolMode,
  PageInfo,
  SelectedObjectRef,
  PendingImagePlacement,
  EditableObjectType,
} from '@/types/pdfEditor';
import { SelectionBoundingBox, ResizeHandleType } from './SelectionBoundingBox';
import { ContextualToolbar } from './ContextualToolbar';
import { FloatingFormatBar } from './FloatingFormatBar';
import { RotateCw, Trash2, ImagePlus } from 'lucide-react';
import { getCssFontFamily } from '@/lib/pdfEditorEngine';

interface PageCanvasViewProps {
  pageMeta: PageInfo;
  pdfData: ArrayBuffer | Uint8Array;
  pdfDoc?: any;
  scale: number;
  activeMode: EditorToolMode;
  pendingImage: PendingImagePlacement | null;
  onClearPendingImage: () => void;
  selectedObject: SelectedObjectRef | null;
  onSelectObject: (ref: SelectedObjectRef | null) => void;
  // Existing PDF text items
  textItems: PdfTextItem[];
  onUpdateTextItem: (id: string, updates: Partial<PdfTextItem>) => void;
  onDeleteTextItem: (id: string) => void;
  // Added texts
  addedTexts: AddedTextElement[];
  onAddText: (text: AddedTextElement) => void;
  onUpdateAddedText: (id: string, updates: Partial<AddedTextElement>) => void;
  onDeleteAddedText: (id: string) => void;
  // Whiteouts
  whiteouts: WhiteoutElement[];
  onAddWhiteout: (w: WhiteoutElement) => void;
  onUpdateWhiteout: (id: string, updates: Partial<WhiteoutElement>) => void;
  onDeleteWhiteout: (id: string) => void;
  // Images
  images: ImageElement[];
  onAddImage: (img: ImageElement) => void;
  onUpdateImage: (id: string, updates: Partial<ImageElement>) => void;
  onDeleteImage: (id: string) => void;
  onReplaceImageRequest?: (id: string) => void;
  // Signatures
  signatures: SignatureElement[];
  onAddSignature: (sig: SignatureElement) => void;
  onUpdateSignature: (id: string, updates: Partial<SignatureElement>) => void;
  onDeleteSignature: (id: string) => void;
  // Annotations
  annotations: AnnotationElement[];
  onAddAnnotation: (a: AnnotationElement) => void;
  onUpdateAnnotation: (id: string, updates: Partial<AnnotationElement>) => void;
  onDeleteAnnotation: (id: string) => void;
  // Shapes
  shapes: ShapeElement[];
  onAddShape: (s: ShapeElement) => void;
  onUpdateShape: (id: string, updates: Partial<ShapeElement>) => void;
  onDeleteShape: (id: string) => void;
  // Form fields
  formFields: FormFieldElement[];
  onAddFormField: (f: FormFieldElement) => void;
  // Common object actions
  onDuplicateObject: (type: EditableObjectType, id: string) => void;
  onReorderZIndex: (type: EditableObjectType, id: string, direction: 'up' | 'down') => void;
  // Page actions
  onRotatePage: (pageNum: number) => void;
  onDeletePage: (pageNum: number) => void;
}

export function PageCanvasView({
  pageMeta,
  pdfData,
  pdfDoc,
  scale,
  activeMode,
  pendingImage,
  onClearPendingImage,
  selectedObject,
  onSelectObject,
  textItems,
  onUpdateTextItem,
  onDeleteTextItem,
  addedTexts,
  onAddText,
  onUpdateAddedText,
  onDeleteAddedText,
  whiteouts,
  onAddWhiteout,
  onUpdateWhiteout,
  onDeleteWhiteout,
  images,
  onAddImage,
  onUpdateImage,
  onDeleteImage,
  onReplaceImageRequest,
  signatures,
  onAddSignature,
  onUpdateSignature,
  onDeleteSignature,
  annotations,
  onAddAnnotation,
  onUpdateAnnotation,
  onDeleteAnnotation,
  shapes,
  onAddShape,
  onUpdateShape,
  onDeleteShape,
  formFields,
  onAddFormField,
  onDuplicateObject,
  onReorderZIndex,
  onRotatePage,
  onDeletePage,
}: PageCanvasViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Drag-creation state (for shapes, whiteout, annotations)
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [dragCurrent, setDragCurrent] = useState<{ x: number; y: number } | null>(null);

  // In-line editing state for existing PDF text
  const [activeExistingTextId, setActiveExistingTextId] = useState<string | null>(null);

  // In-line editing state for added text
  const [editingAddedTextId, setEditingAddedTextId] = useState<string | null>(null);

  // Cursor position preview for pending image placement
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);

  // Computed page display dimensions in CSS pixels at current scale
  const is90or270 = pageMeta.rotation === 90 || pageMeta.rotation === 270;
  const pageW = (is90or270 ? pageMeta.height : pageMeta.width) * scale;
  const pageH = (is90or270 ? pageMeta.width : pageMeta.height) * scale;

  // 1. RENDER PDF PAGE VIA PDF.JS WITH HI-DPI SUPPORT
  useEffect(() => {
    let isCancelled = false;
    let renderTask: any = null;

    async function renderPage() {
      if (!canvasRef.current) return;
      try {
        const pdfjs = await getPdfJs();
        let doc = pdfDoc;
        if (!doc) {
          const bytes =
            pdfData instanceof Uint8Array ? pdfData.slice() : new Uint8Array(pdfData).slice();
          const loadingTask = pdfjs.getDocument({ data: bytes });
          doc = await loadingTask.promise;
        }

        if (isCancelled) return;
        const page = await doc.getPage(pageMeta.pageNumber);
        if (isCancelled) return;

        const viewport = page.getViewport({ scale, rotation: pageMeta.rotation || 0 });
        const canvas = canvasRef.current;
        if (!canvas) return;

        const dpr = Math.max(window.devicePixelRatio || 1, 2);
        canvas.width = Math.floor(viewport.width * dpr);
        canvas.height = Math.floor(viewport.height * dpr);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;

        const ctx = canvas.getContext('2d', { alpha: false });
        if (!ctx) return;

        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(dpr, dpr);

        renderTask = page.render({
          canvasContext: ctx,
          viewport,
        });

        await renderTask.promise;
      } catch (err: any) {
        if (err?.name !== 'RenderingCancelledException') {
          console.warn('PDF render error:', err);
        }
      }
    }

    renderPage();

    return () => {
      isCancelled = true;
      if (renderTask && renderTask.cancel) {
        try {
          renderTask.cancel();
        } catch {
          // ignore
        }
      }
    };
  }, [pageMeta.pageNumber, pageMeta.rotation, scale, pdfData, pdfDoc]);

  // Coordinate conversion helpers:
  // PDF coordinates: origin (0, 0) is BOTTOM-LEFT of page.
  // Screen coordinates: origin (0, 0) is TOP-LEFT of page container.
  const pdfToScreen = useCallback(
    (pdfX: number, pdfY: number, pdfWidth: number, pdfHeight: number) => {
      const screenX = pdfX * scale;
      const screenY = (pageMeta.height - (pdfY + pdfHeight)) * scale;
      const screenW = pdfWidth * scale;
      const screenH = pdfHeight * scale;
      return { x: screenX, y: screenY, width: screenW, height: screenH };
    },
    [scale, pageMeta.height]
  );

  const screenToPdf = useCallback(
    (screenX: number, screenY: number, screenWidth: number, screenHeight: number) => {
      const pdfX = screenX / scale;
      const pdfWidth = screenWidth / scale;
      const pdfHeight = screenHeight / scale;
      const pdfY = pageMeta.height - (screenY + screenHeight) / scale;
      return { pdfX, pdfY, pdfWidth, pdfHeight };
    },
    [scale, pageMeta.height]
  );

  // 2. CONTAINER POINTER INTERACTIONS (PLACEMENT & DRAGGING)
  const handleContainerPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // A. Pending Image Placement Mode
    if (pendingImage) {
      e.stopPropagation();
      e.preventDefault();

      const naturalW = pendingImage.naturalWidth || 200;
      const naturalH = pendingImage.naturalHeight || 150;
      const aspect = naturalW / (naturalH || 1);

      // Default placed width: 220 points, clamped to page width
      const initialPdfWidth = Math.min(220, pageMeta.width * 0.6);
      const initialPdfHeight = initialPdfWidth / aspect;

      // Center placed image on the clicked location
      const clickedPdfX = clickX / scale;
      const clickedPdfY = (rect.height - clickY) / scale;

      let pdfX = clickedPdfX - initialPdfWidth / 2;
      let pdfY = clickedPdfY - initialPdfHeight / 2;

      // Clamp within page bounds
      pdfX = Math.max(0, Math.min(pdfX, pageMeta.width - initialPdfWidth));
      pdfY = Math.max(0, Math.min(pdfY, pageMeta.height - initialPdfHeight));

      const newImgId = `img_${Date.now()}`;
      const newImg: ImageElement = {
        id: newImgId,
        pageNumber: pageMeta.pageNumber,
        name: pendingImage.name || `Image`,
        dataUrl: pendingImage.dataUrl,
        pdfX,
        pdfY,
        pdfWidth: initialPdfWidth,
        pdfHeight: initialPdfHeight,
        aspectRatio: aspect,
        rotation: 0,
        opacity: 1,
        zIndex: 20,
      };

      onAddImage(newImg);
      onClearPendingImage();
      onSelectObject({
        id: newImgId,
        type: 'image',
        pageNumber: pageMeta.pageNumber,
      });
      return;
    }

    // B. Text Tool Click-to-Place Mode
    if (activeMode === 'text') {
      const target = e.target as HTMLElement;
      // Allow clicking canvas or blank space to place text
      if (target === containerRef.current || target.tagName === 'CANVAS' || target.getAttribute('data-canvas-bg') === 'true') {
        e.stopPropagation();

        const pdfClickX = clickX / scale;
        const pdfClickY = (rect.height - clickY) / scale;

        // Auto-detect font family & size from nearest ambient PDF text run
        let autoFontFamily = 'Helvetica';
        let autoFontSize = 14;
        let autoColor = '#0F172A';
        let autoBold = false;
        let autoItalic = false;

        if (textItems && textItems.length > 0) {
          let minDist = Infinity;
          for (const it of textItems) {
            if (it.isDeleted) continue;
            const dist = Math.hypot(it.pdfX - pdfClickX, it.pdfY - pdfClickY);
            if (dist < minDist) {
              minDist = dist;
              autoFontFamily = it.fontFamily || 'Helvetica';
              autoFontSize = Math.round(it.pdfFontSize || it.fontSize || 14);
              autoColor = it.color || '#0F172A';
              autoBold = !!it.isBold;
              autoItalic = !!it.isItalic;
            }
          }
        }

        const boxWidthPt = 200;
        const boxHeightPt = Math.max(32, autoFontSize * 2);

        const newTextId = `txt_${Date.now()}`;
        const newText: AddedTextElement = {
          id: newTextId,
          pageNumber: pageMeta.pageNumber,
          name: `Text Box`,
          text: 'Type your text...',
          pdfX: Math.max(10, Math.min(pdfClickX, pageMeta.width - boxWidthPt - 10)),
          pdfY: Math.max(10, Math.min(pdfClickY - boxHeightPt, pageMeta.height - boxHeightPt - 10)),
          pdfWidth: boxWidthPt,
          pdfHeight: boxHeightPt,
          fontSize: autoFontSize,
          fontFamily: autoFontFamily,
          color: autoColor,
          isBold: autoBold,
          isItalic: autoItalic,
          alignment: 'left',
          rotation: 0,
          opacity: 1,
          zIndex: 25,
        };

        onAddText(newText);
        onSelectObject({
          id: newTextId,
          type: 'addedText',
          pageNumber: pageMeta.pageNumber,
        });
        setEditingAddedTextId(newTextId);
        return;
      }
    }

    // C. Drag-creation modes (whiteout, annotate, shapes)
    if (activeMode === 'whiteout' || activeMode === 'annotate' || activeMode === 'shapes') {
      const target = e.target as HTMLElement;
      if (target === containerRef.current || target.tagName === 'CANVAS' || target.getAttribute('data-canvas-bg') === 'true') {
        e.currentTarget.setPointerCapture(e.pointerId);
        setDragStart({ x: clickX, y: clickY });
        setDragCurrent({ x: clickX, y: clickY });
      }
    } else if (activeMode === 'select' || activeMode === 'editText') {
      // Clicking empty background deselects current selection
      const target = e.target as HTMLElement;
      if (target === containerRef.current || target.tagName === 'CANVAS' || target.getAttribute('data-canvas-bg') === 'true') {
        onSelectObject(null);
        setActiveExistingTextId(null);
        setEditingAddedTextId(null);
      }
    }
  };

  const handleContainerPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const currX = e.clientX - rect.left;
    const currY = e.clientY - rect.top;

    if (pendingImage) {
      setMousePos({ x: currX, y: currY });
    }

    if (dragStart) {
      setDragCurrent({ x: currX, y: currY });
    }
  };

  const handleContainerPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }

    if (dragStart && dragCurrent && containerRef.current) {
      const x1 = Math.min(dragStart.x, dragCurrent.x);
      const y1 = Math.min(dragStart.y, dragCurrent.y);
      const w = Math.abs(dragCurrent.x - dragStart.x);
      const h = Math.abs(dragCurrent.y - dragStart.y);

      // Require minimal 8x8 px drag
      if (w > 8 && h > 8) {
        const { pdfX, pdfY, pdfWidth, pdfHeight } = screenToPdf(x1, y1, w, h);

        if (activeMode === 'whiteout') {
          const newId = `wo_${Date.now()}`;
          onAddWhiteout({
            id: newId,
            pageNumber: pageMeta.pageNumber,
            name: 'Whiteout',
            pdfX,
            pdfY,
            pdfWidth,
            pdfHeight,
            color: '#FFFFFF',
            opacity: 1,
            zIndex: 10,
          });
          onSelectObject({ id: newId, type: 'whiteout', pageNumber: pageMeta.pageNumber });
        } else if (activeMode === 'annotate') {
          const newId = `ann_${Date.now()}`;
          onAddAnnotation({
            id: newId,
            pageNumber: pageMeta.pageNumber,
            name: 'Highlight',
            type: 'highlight',
            pdfX,
            pdfY,
            pdfWidth,
            pdfHeight,
            color: '#FEF08A',
            opacity: 0.45,
            zIndex: 15,
          });
          onSelectObject({ id: newId, type: 'annotation', pageNumber: pageMeta.pageNumber });
        } else if (activeMode === 'shapes') {
          const newId = `shp_${Date.now()}`;
          onAddShape({
            id: newId,
            pageNumber: pageMeta.pageNumber,
            name: 'Rectangle',
            type: 'rectangle',
            pdfX,
            pdfY,
            pdfWidth,
            pdfHeight,
            strokeColor: '#2563EB',
            strokeWidth: 2,
            fillColor: '#FFFFFF',
            opacity: 1,
            zIndex: 20,
          });
          onSelectObject({ id: newId, type: 'shape', pageNumber: pageMeta.pageNumber });
        }
      }
    }

    setDragStart(null);
    setDragCurrent(null);
  };

  // Find currently selected element and compute its screen bounding box
  let selectedElementData: any = null;
  let selectedScreenBounds: { x: number; y: number; width: number; height: number } | null = null;
  let selectedRotation = 0;
  let selectedLocked = false;
  let isAspectLocked = false;

  if (selectedObject && selectedObject.pageNumber === pageMeta.pageNumber) {
    if (selectedObject.type === 'addedText') {
      const item = addedTexts.find((t) => t.id === selectedObject.id);
      if (item) {
        selectedElementData = item;
        selectedScreenBounds = pdfToScreen(item.pdfX, item.pdfY, item.pdfWidth, item.pdfHeight);
        selectedRotation = item.rotation || 0;
        selectedLocked = !!item.locked;
      }
    } else if (selectedObject.type === 'image') {
      const item = images.find((i) => i.id === selectedObject.id);
      if (item) {
        selectedElementData = item;
        selectedScreenBounds = pdfToScreen(item.pdfX, item.pdfY, item.pdfWidth, item.pdfHeight);
        selectedRotation = item.rotation || 0;
        selectedLocked = !!item.locked;
        isAspectLocked = true; // Lock aspect ratio by default for images
      }
    } else if (selectedObject.type === 'signature') {
      const item = signatures.find((s) => s.id === selectedObject.id);
      if (item) {
        selectedElementData = item;
        selectedScreenBounds = pdfToScreen(item.pdfX, item.pdfY, item.pdfWidth, item.pdfHeight);
        selectedRotation = item.rotation || 0;
        selectedLocked = !!item.locked;
        isAspectLocked = true;
      }
    } else if (selectedObject.type === 'shape') {
      const item = shapes.find((s) => s.id === selectedObject.id);
      if (item) {
        selectedElementData = item;
        selectedScreenBounds = pdfToScreen(item.pdfX, item.pdfY, item.pdfWidth, item.pdfHeight);
        selectedRotation = item.rotation || 0;
        selectedLocked = !!item.locked;
      }
    } else if (selectedObject.type === 'whiteout') {
      const item = whiteouts.find((w) => w.id === selectedObject.id);
      if (item) {
        selectedElementData = item;
        selectedScreenBounds = pdfToScreen(item.pdfX, item.pdfY, item.pdfWidth, item.pdfHeight);
        selectedLocked = !!item.locked;
      }
    } else if (selectedObject.type === 'annotation') {
      const item = annotations.find((a) => a.id === selectedObject.id);
      if (item) {
        selectedElementData = item;
        selectedScreenBounds = pdfToScreen(item.pdfX, item.pdfY, item.pdfWidth, item.pdfHeight);
        selectedLocked = !!item.locked;
      }
    }
  }

  // Handle bounding box transformation
  const handleObjectMove = (deltaScreenX: number, deltaScreenY: number) => {
    if (!selectedObject || !selectedElementData) return;
    const deltaPdfX = deltaScreenX / scale;
    const deltaPdfY = -deltaScreenY / scale; // PDF Y is inverted

    const newPdfX = Math.max(
      0,
      Math.min(selectedElementData.pdfX + deltaPdfX, pageMeta.width - selectedElementData.pdfWidth)
    );
    const newPdfY = Math.max(
      0,
      Math.min(selectedElementData.pdfY + deltaPdfY, pageMeta.height - selectedElementData.pdfHeight)
    );

    const updates = { pdfX: newPdfX, pdfY: newPdfY };

    if (selectedObject.type === 'addedText') onUpdateAddedText(selectedObject.id, updates);
    else if (selectedObject.type === 'image') onUpdateImage(selectedObject.id, updates);
    else if (selectedObject.type === 'signature') onUpdateSignature(selectedObject.id, updates);
    else if (selectedObject.type === 'shape') onUpdateShape(selectedObject.id, updates);
    else if (selectedObject.type === 'whiteout') onUpdateWhiteout(selectedObject.id, updates);
    else if (selectedObject.type === 'annotation') onUpdateAnnotation(selectedObject.id, updates);
  };

  const handleObjectResize = (
    handle: ResizeHandleType,
    newScreenX: number,
    newScreenY: number,
    newScreenWidth: number,
    newScreenHeight: number
  ) => {
    if (!selectedObject) return;
    const { pdfX, pdfY, pdfWidth, pdfHeight } = screenToPdf(
      newScreenX,
      newScreenY,
      newScreenWidth,
      newScreenHeight
    );

    const updates = {
      pdfX: Math.max(0, pdfX),
      pdfY: Math.max(0, pdfY),
      pdfWidth: Math.max(10, pdfWidth),
      pdfHeight: Math.max(10, pdfHeight),
    };

    if (selectedObject.type === 'addedText') onUpdateAddedText(selectedObject.id, updates);
    else if (selectedObject.type === 'image') onUpdateImage(selectedObject.id, updates);
    else if (selectedObject.type === 'signature') onUpdateSignature(selectedObject.id, updates);
    else if (selectedObject.type === 'shape') onUpdateShape(selectedObject.id, updates);
    else if (selectedObject.type === 'whiteout') onUpdateWhiteout(selectedObject.id, updates);
    else if (selectedObject.type === 'annotation') onUpdateAnnotation(selectedObject.id, updates);
  };

  const handleObjectRotate = (angle: number) => {
    if (!selectedObject) return;
    const updates = { rotation: angle };
    if (selectedObject.type === 'addedText') onUpdateAddedText(selectedObject.id, updates);
    else if (selectedObject.type === 'image') onUpdateImage(selectedObject.id, updates);
    else if (selectedObject.type === 'signature') onUpdateSignature(selectedObject.id, updates);
    else if (selectedObject.type === 'shape') onUpdateShape(selectedObject.id, updates);
  };

  return (
    <div className="flex flex-col items-center mb-10 select-none">
      {/* Page Header Information Bar */}
      <div
        style={{ width: pageW }}
        className="flex items-center justify-between pb-2 mb-1 text-xs text-[#475569] dark:text-[#CBD5E1]"
      >
        <div className="flex items-center gap-2">
          <span className="font-mono font-bold bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded-md text-[#0F172A] dark:text-[#F8FAFC]">
            Page {pageMeta.pageNumber}
          </span>
          <span className="text-[11px] font-mono text-slate-500">
            {Math.round(pageMeta.width)} × {Math.round(pageMeta.height)} pt
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onRotatePage(pageMeta.pageNumber)}
            title="Rotate Page 90° Clockwise"
            className="p-1 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer transition-colors"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onDeletePage(pageMeta.pageNumber)}
            title="Delete Page"
            className="p-1 rounded-md text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Page Sheet Viewport with 4 Layers */}
      <div
        ref={containerRef}
        style={{ width: pageW, height: pageH }}
        onPointerDown={handleContainerPointerDown}
        onPointerMove={handleContainerPointerMove}
        onPointerUp={handleContainerPointerUp}
        data-canvas-bg="true"
        className={`relative bg-white shadow-2xl border border-slate-300 dark:border-slate-700 transition-shadow ${
          pendingImage
            ? 'cursor-copy'
            : activeMode === 'text'
            ? 'cursor-text'
            : activeMode === 'whiteout' || activeMode === 'annotate' || activeMode === 'shapes'
            ? 'cursor-crosshair'
            : 'cursor-default'
        }`}
      >
        {/* ======================================================== */}
        {/* LAYER 1: Underlying High-DPI PDF.js Canvas Layer         */}
        {/* ======================================================== */}
        <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none select-none" />

        {/* ======================================================== */}
        {/* LAYER 2: Editable Object Layer (DOM Elements)            */}
        {/* ======================================================== */}
        <div className="absolute inset-0 pointer-events-none">
          {/* A. User Whiteouts */}
          {whiteouts
            .filter((w) => w.pageNumber === pageMeta.pageNumber && !w.hidden)
            .map((w) => {
              const bounds = pdfToScreen(w.pdfX, w.pdfY, w.pdfWidth, w.pdfHeight);
              const isSelected = selectedObject?.id === w.id;

              return (
                <div
                  key={w.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectObject({ id: w.id, type: 'whiteout', pageNumber: pageMeta.pageNumber });
                  }}
                  style={{
                    position: 'absolute',
                    left: bounds.x,
                    top: bounds.y,
                    width: bounds.width,
                    height: bounds.height,
                    backgroundColor: w.color || '#FFFFFF',
                    opacity: w.opacity ?? 1,
                    zIndex: w.zIndex || 10,
                  }}
                  className={`pointer-events-auto cursor-pointer border ${
                    isSelected ? 'border-blue-500' : 'border-transparent hover:border-slate-300'
                  }`}
                />
              );
            })}

          {/* B. Existing PDF Text Overlays (IN-PLACE DIRECT EDITING WITH AUTO-ALIGNMENT) */}
          {textItems.map((item) => {
            // 1. If item is deleted, render an opaque whiteout cover over the original position so the PDF raster text is hidden
            if (item.isDeleted) {
              const origLeft = (item.originalX ?? item.x) * scale;
              const origTop = (item.originalY ?? item.y) * scale;
              const itemW = (item.width || 80) * scale;
              const itemH = (item.height || 16) * scale;
              return (
                <div
                  key={`deleted_${item.id}`}
                  style={{
                    position: 'absolute',
                    left: Math.max(0, origLeft - 2),
                    top: Math.max(0, origTop - 2),
                    width: itemW + 4,
                    height: itemH + 4,
                    backgroundColor: '#FFFFFF',
                    zIndex: 11,
                    pointerEvents: 'none',
                  }}
                />
              );
            }

            const isEditing = activeExistingTextId === item.id;
            const itemLeft = item.x * scale;
            const itemTop = item.y * scale;
            const itemWidth = item.width * scale;
            const itemHeight = item.height * scale;
            const itemFontSize = (item.fontSize || item.pdfFontSize || 12) * scale;
            const cssFontFamily = getCssFontFamily(item.fontFamily);

            // Compute dynamic box width and height so styled text never clips or overflows
            const estCharWidth = itemFontSize * (item.isBold ? 0.68 : 0.58);
            const dynamicWidth = Math.max(itemWidth + 30, (item.str.length + 3) * estCharWidth);
            const dynamicHeight = Math.max(itemHeight, itemFontSize * 1.35);

            return (
              <React.Fragment key={item.id}>
                {/* Always whiteout original position if text is edited or currently being edited */}
                {(item.isEdited || isEditing) && (
                  <div
                    key={`orig_whiteout_${item.id}`}
                    style={{
                      position: 'absolute',
                      left: Math.max(0, (item.originalX ?? item.x) * scale - 2),
                      top: Math.max(0, (item.originalY ?? item.y) * scale - 2),
                      width: itemWidth + 4,
                      height: itemHeight + 4,
                      backgroundColor: '#FFFFFF',
                      zIndex: 11,
                      pointerEvents: 'none',
                    }}
                  />
                )}

                {/* Floating Format Bar matching Image 2 */}
                {isEditing && (
                  <FloatingFormatBar
                    item={item}
                    position={{ top: itemTop, left: itemLeft }}
                    containerBounds={{ width: pageW, height: pageH }}
                    onUpdateItem={(updates) =>
                      onUpdateTextItem(item.id, { ...updates, isEdited: true })
                    }
                    onDeleteItem={() => {
                      onUpdateTextItem(item.id, { isDeleted: true, isEdited: true });
                      setActiveExistingTextId(null);
                    }}
                    onDuplicateItem={() => {
                      const newId = `txt_dup_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
                      const dup: AddedTextElement = {
                        id: newId,
                        pageNumber: pageMeta.pageNumber,
                        name: `${item.str.slice(0, 16)} Copy`,
                        text: item.str,
                        pdfX: Math.min(item.pdfX + 15, pageMeta.width - (item.pdfWidth || 80)),
                        pdfY: Math.max(10, item.pdfY - (item.pdfHeight || 14) - 6),
                        pdfWidth: Math.max(80, item.pdfWidth || 100),
                        pdfHeight: Math.max(14, item.pdfHeight || 16),
                        fontSize: item.pdfFontSize || item.fontSize || 12,
                        fontFamily: item.fontFamily || 'Helvetica',
                        color: item.color || '#0F172A',
                        isBold: !!item.isBold,
                        isItalic: !!item.isItalic,
                        isUnderline: !!item.isUnderline,
                        rotation: 0,
                        opacity: 1,
                        zIndex: 25,
                      };
                      onAddText(dup);
                      onSelectObject({
                        id: newId,
                        type: 'addedText',
                        pageNumber: pageMeta.pageNumber,
                      });
                      setActiveExistingTextId(null);
                    }}
                    onMoveItem={(dx, dy) => {
                      const deltaPdfX = dx / scale;
                      const deltaPdfY = -dy / scale;
                      onUpdateTextItem(item.id, {
                        x: item.x + dx,
                        y: item.y + dy,
                        pdfX: item.pdfX + deltaPdfX,
                        pdfY: item.pdfY + deltaPdfY,
                        isEdited: true,
                      });
                    }}
                    onClose={() => setActiveExistingTextId(null)}
                  />
                )}

                <div
                  style={{
                    position: 'absolute',
                    left: itemLeft,
                    top: itemTop,
                    zIndex: isEditing ? 35 : 12,
                    minWidth: Math.max(30, dynamicWidth),
                    height: dynamicHeight,
                    lineHeight: `${dynamicHeight}px`,
                  }}
                  onClick={(e) => {
                    if (activeMode === 'editText' || activeMode === 'select') {
                      e.stopPropagation();
                      setActiveExistingTextId(item.id);
                      onSelectObject(null);
                    }
                  }}
                  className={`pointer-events-auto transition-colors ${
                    activeMode === 'editText' || activeMode === 'select'
                      ? isEditing
                        ? 'bg-white ring-1 ring-blue-500 rounded-xs'
                        : 'hover:bg-blue-500/10 hover:ring-1 hover:ring-blue-400/50 cursor-text'
                      : item.isEdited
                      ? 'bg-transparent'
                      : 'pointer-events-none'
                  }`}
                >
                  {/* Clean white background to ensure text is legible when moved or styled */}
                  {(item.isEdited || isEditing) && (
                    <div
                      style={{
                        position: 'absolute',
                        left: -2,
                        top: -2,
                        width: 'calc(100% + 4px)',
                        height: 'calc(100% + 4px)',
                        backgroundColor: '#FFFFFF',
                        zIndex: -1,
                      }}
                    />
                  )}

                  {isEditing ? (
                    <input
                      type="text"
                      autoFocus
                      value={item.str}
                      style={{
                        fontFamily: cssFontFamily,
                        fontSize: `${itemFontSize}px`,
                        lineHeight: `${dynamicHeight}px`,
                        fontWeight: item.isBold ? 700 : 400,
                        fontStyle: item.isItalic ? 'italic' : 'normal',
                        textDecoration: item.isUnderline ? 'underline' : 'none',
                        color: item.color || '#0F172A',
                        width: `${Math.max(itemWidth + 24, dynamicWidth)}px`,
                        height: `${dynamicHeight}px`,
                        padding: '0 2px',
                        margin: 0,
                        border: 'none',
                        outline: 'none',
                        background: 'transparent',
                        verticalAlign: 'middle',
                        boxSizing: 'border-box',
                      }}
                      onChange={(e) => {
                        onUpdateTextItem(item.id, {
                          str: e.target.value,
                          isEdited: true,
                        });
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          setActiveExistingTextId(null);
                        }
                      }}
                      className="outline-none border-none p-0 m-0 bg-transparent"
                    />
                  ) : item.isEdited ? (
                    <span
                      style={{
                        fontFamily: cssFontFamily,
                        fontSize: `${itemFontSize}px`,
                        lineHeight: `${dynamicHeight}px`,
                        fontWeight: item.isBold ? 700 : 400,
                        fontStyle: item.isItalic ? 'italic' : 'normal',
                        textDecoration: item.isUnderline ? 'underline' : 'none',
                        color: item.color || '#0F172A',
                        display: 'inline-block',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {item.str}
                    </span>
                  ) : null}
                </div>
              </React.Fragment>
            );
          })}

          {/* C. User-Added Text Elements (MULTILINE WRAPPING) */}
          {addedTexts
            .filter((t) => t.pageNumber === pageMeta.pageNumber && !t.hidden)
            .map((t) => {
              const bounds = pdfToScreen(t.pdfX, t.pdfY, t.pdfWidth, t.pdfHeight);
              const isSelected = selectedObject?.id === t.id;
              const isInlineEditing = editingAddedTextId === t.id;

              return (
                <div
                  key={t.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectObject({
                      id: t.id,
                      type: 'addedText',
                      pageNumber: pageMeta.pageNumber,
                    });
                  }}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    setEditingAddedTextId(t.id);
                  }}
                  style={{
                    position: 'absolute',
                    left: bounds.x,
                    top: bounds.y,
                    width: bounds.width,
                    minHeight: bounds.height,
                    zIndex: t.zIndex || 25,
                    transform: t.rotation ? `rotate(${t.rotation}deg)` : undefined,
                    transformOrigin: 'center center',
                    opacity: t.opacity ?? 1,
                  }}
                  className={`pointer-events-auto group p-1 transition-all rounded-xs ${
                    isSelected
                      ? 'border border-blue-400 bg-blue-50/20'
                      : 'hover:border hover:border-dashed hover:border-slate-300'
                  }`}
                >
                  {isInlineEditing ? (
                    <textarea
                      autoFocus
                      value={t.text}
                      style={{
                        fontFamily: t.fontFamily,
                        fontSize: `${t.fontSize * scale}px`,
                        fontWeight: t.isBold ? 'bold' : 'normal',
                        fontStyle: t.isItalic ? 'italic' : 'normal',
                        textDecoration: `${t.isUnderline ? 'underline' : ''} ${
                          t.isStrikethrough ? 'line-through' : ''
                        }`.trim(),
                        color: t.color,
                        textAlign: t.alignment || 'left',
                        width: '100%',
                        minHeight: `${bounds.height}px`,
                      }}
                      onChange={(e) => onUpdateAddedText(t.id, { text: e.target.value })}
                      onBlur={() => setEditingAddedTextId(null)}
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') setEditingAddedTextId(null);
                      }}
                      className="w-full bg-transparent outline-none border-none p-0 m-0 resize-none overflow-hidden"
                    />
                  ) : (
                    <div
                      style={{
                        fontFamily: t.fontFamily,
                        fontSize: `${t.fontSize * scale}px`,
                        fontWeight: t.isBold ? 'bold' : 'normal',
                        fontStyle: t.isItalic ? 'italic' : 'normal',
                        textDecoration: `${t.isUnderline ? 'underline' : ''} ${
                          t.isStrikethrough ? 'line-through' : ''
                        }`.trim(),
                        color: t.color,
                        textAlign: t.alignment || 'left',
                        wordBreak: 'break-word',
                        whiteSpace: 'pre-wrap',
                      }}
                      className="w-full h-full cursor-pointer"
                    >
                      {t.text || <span className="text-slate-400 italic">Empty text</span>}
                    </div>
                  )}
                </div>
              );
            })}

          {/* D. User Annotations (Highlights) */}
          {annotations
            .filter((a) => a.pageNumber === pageMeta.pageNumber && !a.hidden)
            .map((a) => {
              const bounds = pdfToScreen(a.pdfX, a.pdfY, a.pdfWidth, a.pdfHeight);
              const isSelected = selectedObject?.id === a.id;

              return (
                <div
                  key={a.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectObject({
                      id: a.id,
                      type: 'annotation',
                      pageNumber: pageMeta.pageNumber,
                    });
                  }}
                  style={{
                    position: 'absolute',
                    left: bounds.x,
                    top: bounds.y,
                    width: bounds.width,
                    height: bounds.height,
                    backgroundColor: a.color || '#FEF08A',
                    opacity: a.opacity ?? 0.45,
                    zIndex: a.zIndex || 15,
                  }}
                  className={`pointer-events-auto cursor-pointer border ${
                    isSelected ? 'border-amber-500' : 'border-transparent hover:border-amber-300'
                  }`}
                />
              );
            })}

          {/* E. User Shapes */}
          {shapes
            .filter((s) => s.pageNumber === pageMeta.pageNumber && !s.hidden)
            .map((s) => {
              const bounds = pdfToScreen(s.pdfX, s.pdfY, s.pdfWidth, s.pdfHeight);
              const isSelected = selectedObject?.id === s.id;

              return (
                <div
                  key={s.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectObject({
                      id: s.id,
                      type: 'shape',
                      pageNumber: pageMeta.pageNumber,
                    });
                  }}
                  style={{
                    position: 'absolute',
                    left: bounds.x,
                    top: bounds.y,
                    width: bounds.width,
                    height: bounds.height,
                    border: `${s.strokeWidth * scale}px solid ${s.strokeColor}`,
                    backgroundColor: s.fillColor || 'transparent',
                    borderRadius: s.type === 'ellipse' ? '50%' : '4px',
                    transform: s.rotation ? `rotate(${s.rotation}deg)` : undefined,
                    transformOrigin: 'center center',
                    opacity: s.opacity ?? 1,
                    zIndex: s.zIndex || 20,
                  }}
                  className={`pointer-events-auto cursor-pointer ${
                    isSelected ? 'ring-2 ring-blue-500' : 'hover:opacity-90'
                  }`}
                />
              );
            })}

          {/* F. Signatures */}
          {signatures
            .filter((sig) => sig.pageNumber === pageMeta.pageNumber && !sig.hidden)
            .map((sig) => {
              const bounds = pdfToScreen(sig.pdfX, sig.pdfY, sig.pdfWidth, sig.pdfHeight);
              const isSelected = selectedObject?.id === sig.id;

              return (
                <div
                  key={sig.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectObject({
                      id: sig.id,
                      type: 'signature',
                      pageNumber: pageMeta.pageNumber,
                    });
                  }}
                  style={{
                    position: 'absolute',
                    left: bounds.x,
                    top: bounds.y,
                    width: bounds.width,
                    height: bounds.height,
                    transform: sig.rotation ? `rotate(${sig.rotation}deg)` : undefined,
                    transformOrigin: 'center center',
                    opacity: sig.opacity ?? 1,
                    zIndex: sig.zIndex || 25,
                  }}
                  className={`pointer-events-auto cursor-pointer p-0.5 ${
                    isSelected ? 'ring-2 ring-blue-500' : 'hover:ring-1 hover:ring-slate-300'
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={sig.dataUrl}
                    alt="Signature"
                    className="w-full h-full object-contain pointer-events-none"
                  />
                </div>
              );
            })}

          {/* G. Images */}
          {images
            .filter((img) => img.pageNumber === pageMeta.pageNumber && !img.hidden)
            .map((img) => {
              const bounds = pdfToScreen(img.pdfX, img.pdfY, img.pdfWidth, img.pdfHeight);
              const isSelected = selectedObject?.id === img.id;

              return (
                <div
                  key={img.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectObject({
                      id: img.id,
                      type: 'image',
                      pageNumber: pageMeta.pageNumber,
                    });
                  }}
                  style={{
                    position: 'absolute',
                    left: bounds.x,
                    top: bounds.y,
                    width: bounds.width,
                    height: bounds.height,
                    transform: img.rotation ? `rotate(${img.rotation}deg)` : undefined,
                    transformOrigin: 'center center',
                    opacity: img.opacity ?? 1,
                    zIndex: img.zIndex || 20,
                  }}
                  className={`pointer-events-auto cursor-pointer p-0.5 ${
                    isSelected ? 'ring-2 ring-blue-500' : 'hover:ring-1 hover:ring-slate-300'
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.dataUrl}
                    alt={img.name || 'Inserted Graphic'}
                    className="w-full h-full object-contain pointer-events-none"
                  />
                </div>
              );
            })}

          {/* H. Interactive Form Fields */}
          {formFields
            .filter((f) => f.pageNumber === pageMeta.pageNumber && !f.hidden)
            .map((f) => {
              const bounds = pdfToScreen(f.pdfX, f.pdfY, f.pdfWidth, f.pdfHeight);
              return (
                <div
                  key={f.id}
                  style={{
                    position: 'absolute',
                    left: bounds.x,
                    top: bounds.y,
                    width: bounds.width,
                    height: bounds.height,
                    zIndex: f.zIndex || 25,
                  }}
                  className="pointer-events-auto bg-blue-50/70 border border-blue-400 rounded-sm p-1"
                >
                  <input
                    type="text"
                    placeholder="Form Input..."
                    className="w-full h-full bg-transparent outline-none text-xs text-slate-800"
                  />
                </div>
              );
            })}
        </div>

        {/* ======================================================== */}
        {/* LAYER 3: Selection Bounding Box & Contextual Toolbar     */}
        {/* ======================================================== */}
        {selectedScreenBounds && (
          <SelectionBoundingBox
            x={selectedScreenBounds.x}
            y={selectedScreenBounds.y}
            width={selectedScreenBounds.width}
            height={selectedScreenBounds.height}
            rotation={selectedRotation}
            locked={selectedLocked}
            lockAspectRatio={isAspectLocked}
            onMove={handleObjectMove}
            onResize={handleObjectResize}
            onRotate={selectedObject?.type !== 'whiteout' ? handleObjectRotate : undefined}
          />
        )}

        {selectedObject && selectedElementData && selectedScreenBounds && (
          <ContextualToolbar
            objectType={selectedObject.type}
            objectData={selectedElementData}
            position={{
              top: selectedScreenBounds.y,
              left: selectedScreenBounds.x,
            }}
            containerBounds={{ width: pageW, height: pageH }}
            onUpdate={(updates) => {
              if (selectedObject.type === 'addedText') {
                onUpdateAddedText(selectedObject.id, updates);
              } else if (selectedObject.type === 'image') {
                onUpdateImage(selectedObject.id, updates);
              } else if (selectedObject.type === 'shape') {
                onUpdateShape(selectedObject.id, updates);
              } else if (selectedObject.type === 'signature') {
                onUpdateSignature(selectedObject.id, updates);
              } else if (selectedObject.type === 'whiteout') {
                onUpdateWhiteout(selectedObject.id, updates);
              } else if (selectedObject.type === 'annotation') {
                onUpdateAnnotation(selectedObject.id, updates);
              }
            }}
            onDuplicate={() => onDuplicateObject(selectedObject.type, selectedObject.id)}
            onDelete={() => {
              if (selectedObject.type === 'addedText') onDeleteAddedText(selectedObject.id);
              else if (selectedObject.type === 'image') onDeleteImage(selectedObject.id);
              else if (selectedObject.type === 'shape') onDeleteShape(selectedObject.id);
              else if (selectedObject.type === 'signature') onDeleteSignature(selectedObject.id);
              else if (selectedObject.type === 'whiteout') onDeleteWhiteout(selectedObject.id);
              else if (selectedObject.type === 'annotation') onDeleteAnnotation(selectedObject.id);
              onSelectObject(null);
            }}
            onBringForward={() => onReorderZIndex(selectedObject.type, selectedObject.id, 'up')}
            onSendBackward={() => onReorderZIndex(selectedObject.type, selectedObject.id, 'down')}
            onReplaceImage={
              selectedObject.type === 'image' && onReplaceImageRequest
                ? () => onReplaceImageRequest(selectedObject.id)
                : undefined
            }
            onClose={() => onSelectObject(null)}
          />
        )}

        {/* ======================================================== */}
        {/* LAYER 4: Temporary Drag Interaction & Placement Previews */}
        {/* ======================================================== */}
        {/* Drag creation preview rectangle */}
        {dragStart && dragCurrent && (
          <div
            style={{
              position: 'absolute',
              left: Math.min(dragStart.x, dragCurrent.x),
              top: Math.min(dragStart.y, dragCurrent.y),
              width: Math.abs(dragCurrent.x - dragStart.x),
              height: Math.abs(dragCurrent.y - dragStart.y),
              backgroundColor:
                activeMode === 'whiteout'
                  ? '#FFFFFF'
                  : activeMode === 'annotate'
                  ? '#FEF08A'
                  : 'transparent',
              opacity: activeMode === 'annotate' ? 0.45 : 1,
              border: '1.5px dashed #2563EB',
              zIndex: 60,
            }}
            className="pointer-events-none"
          />
        )}

        {/* Image placement cursor hover indicator */}
        {pendingImage && mousePos && (
          <div
            style={{
              position: 'absolute',
              left: mousePos.x,
              top: mousePos.y,
              transform: 'translate(-50%, -50%)',
              zIndex: 70,
            }}
            className="pointer-events-none flex flex-col items-center gap-1 animate-pulse"
          >
            <div className="w-16 h-12 border-2 border-dashed border-blue-600 bg-blue-50/70 rounded-md flex items-center justify-center shadow-lg">
              <ImagePlus className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-[10px] font-bold font-sans bg-blue-600 text-white px-2 py-0.5 rounded-full shadow-md whitespace-nowrap">
              Click anywhere to place
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

'use client';

import React, { useEffect, useRef, useState } from 'react';
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
} from '@/types/pdfEditor';
import { FloatingFormatBar } from './FloatingFormatBar';
import { Trash2, Move, RotateCw, Plus } from 'lucide-react';

interface PageCanvasViewProps {
  pageMeta: PageInfo;
  pdfData: ArrayBuffer | Uint8Array;
  pdfDoc?: any;
  scale: number;
  activeMode: EditorToolMode;
  textItems: PdfTextItem[];
  onUpdateTextItem: (id: string, updates: Partial<PdfTextItem>) => void;
  onDeleteTextItem: (id: string) => void;
  addedTexts: AddedTextElement[];
  onAddText: (text: AddedTextElement) => void;
  onUpdateAddedText: (id: string, text: string) => void;
  onDeleteAddedText: (id: string) => void;
  whiteouts: WhiteoutElement[];
  onAddWhiteout: (w: WhiteoutElement) => void;
  onDeleteWhiteout: (id: string) => void;
  images: ImageElement[];
  onDeleteImage: (id: string) => void;
  signatures: SignatureElement[];
  onDeleteSignature: (id: string) => void;
  annotations: AnnotationElement[];
  onAddAnnotation: (a: AnnotationElement) => void;
  onDeleteAnnotation: (id: string) => void;
  shapes: ShapeElement[];
  onAddShape: (s: ShapeElement) => void;
  onDeleteShape: (id: string) => void;
  formFields: FormFieldElement[];
  onAddFormField: (f: FormFieldElement) => void;
  onRotatePage: (pageNum: number) => void;
  onDeletePage: (pageNum: number) => void;
}

export function PageCanvasView({
  pageMeta,
  pdfData,
  pdfDoc,
  scale,
  activeMode,
  textItems,
  onUpdateTextItem,
  onDeleteTextItem,
  addedTexts,
  onAddText,
  onUpdateAddedText,
  onDeleteAddedText,
  whiteouts,
  onAddWhiteout,
  onDeleteWhiteout,
  images,
  onDeleteImage,
  signatures,
  onDeleteSignature,
  annotations,
  onAddAnnotation,
  onDeleteAnnotation,
  shapes,
  onAddShape,
  onDeleteShape,
  formFields,
  onAddFormField,
  onRotatePage,
  onDeletePage,
}: PageCanvasViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Active editing text item
  const [activeTextId, setActiveTextId] = useState<string | null>(null);
  const [floatingBarPos, setFloatingBarPos] = useState<{ top: number; left: number } | null>(null);

  // Drag-to-create state for whiteout / annotations / shapes
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [dragCurrent, setDragCurrent] = useState<{ x: number; y: number } | null>(null);

  // Page dimensions scaled
  const pageW = pageMeta.width * scale;
  const pageH = pageMeta.height * scale;

  // Render PDF page to canvas
  useEffect(() => {
    let isCancelled = false;

    async function renderPage() {
      try {
        let pdf = pdfDoc;
        if (!pdf) {
          const pdfjs = await getPdfJs();
          const bytes =
            pdfData instanceof Uint8Array
              ? pdfData.slice()
              : new Uint8Array(pdfData).slice();
          pdf = await pdfjs.getDocument({ data: bytes }).promise;
        }
        const page = await pdf.getPage(pageMeta.pageNumber);

        if (isCancelled) return;

        const viewport = page.getViewport({ scale, rotation: pageMeta.rotation });
        const canvas = canvasRef.current;
        if (!canvas) return;

        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        await page.render({
          canvasContext: ctx,
          viewport,
        }).promise;
      } catch (err) {
        console.warn('Error rendering page:', err);
      }
    }

    renderPage();

    return () => {
      isCancelled = true;
    };
  }, [pageMeta.pageNumber, pageMeta.rotation, scale, pdfData, pdfDoc]);

  // Click on canvas container to handle placement
  const handleContainerMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // In PDF coordinates:
    const pdfX = clickX / scale;
    const pdfY = (rect.height - clickY) / scale;

    if (activeMode === 'whiteout' || activeMode === 'annotate' || activeMode === 'shapes') {
      setDragStart({ x: clickX, y: clickY });
      setDragCurrent({ x: clickX, y: clickY });
    } else if (activeMode === 'text') {
      // If clicking empty space in text mode: place a new text box
      const target = e.target as HTMLElement;
      if (target === containerRef.current || target.tagName === 'CANVAS') {
        onAddText({
          id: `new_txt_${Date.now()}`,
          pageNumber: pageMeta.pageNumber,
          text: 'Type text here...',
          x: clickX,
          y: clickY,
          pdfX,
          pdfY: pdfY - 12,
          fontSize: 14,
          fontFamily: 'Helvetica',
          color: '#0F172A',
          isBold: false,
          isItalic: false,
        });
      }
    } else if (activeMode === 'forms') {
      // Add text input form field
      onAddFormField({
        id: `form_${Date.now()}`,
        pageNumber: pageMeta.pageNumber,
        type: 'text',
        x: clickX,
        y: clickY,
        width: 140 * scale,
        height: 28 * scale,
        pdfX,
        pdfY: pdfY - 28,
        pdfWidth: 140,
        pdfHeight: 28,
        value: '',
      });
    }
  };

  const handleContainerMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!dragStart || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const currX = e.clientX - rect.left;
    const currY = e.clientY - rect.top;
    setDragCurrent({ x: currX, y: currY });
  };

  const handleContainerMouseUp = () => {
    if (dragStart && dragCurrent) {
      const x1 = Math.min(dragStart.x, dragCurrent.x);
      const y1 = Math.min(dragStart.y, dragCurrent.y);
      const w = Math.abs(dragCurrent.x - dragStart.x);
      const h = Math.abs(dragCurrent.y - dragStart.y);

      // Only create if dimensions are at least 10x10 px
      if (w > 10 && h > 10 && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const pdfX = x1 / scale;
        const pdfY = (rect.height - (y1 + h)) / scale;
        const pdfW = w / scale;
        const pdfH = h / scale;

        if (activeMode === 'whiteout') {
          onAddWhiteout({
            id: `wo_${Date.now()}`,
            pageNumber: pageMeta.pageNumber,
            x: x1,
            y: y1,
            width: w,
            height: h,
            pdfX,
            pdfY,
            pdfWidth: pdfW,
            pdfHeight: pdfH,
            color: '#FFFFFF',
          });
        } else if (activeMode === 'annotate') {
          onAddAnnotation({
            id: `ann_${Date.now()}`,
            pageNumber: pageMeta.pageNumber,
            type: 'highlight',
            x: x1,
            y: y1,
            width: w,
            height: h,
            pdfX,
            pdfY,
            pdfWidth: pdfW,
            pdfHeight: pdfH,
            color: '#FEF08A',
          });
        } else if (activeMode === 'shapes') {
          onAddShape({
            id: `shp_${Date.now()}`,
            pageNumber: pageMeta.pageNumber,
            type: 'rectangle',
            x: x1,
            y: y1,
            width: w,
            height: h,
            pdfX,
            pdfY,
            pdfWidth: pdfW,
            pdfHeight: pdfH,
            strokeColor: '#2563EB',
            strokeWidth: 2,
          });
        }
      }
    }
    setDragStart(null);
    setDragCurrent(null);
  };

  const activeEditingItem = textItems.find((it) => it.id === activeTextId) || null;

  return (
    <div className="flex flex-col items-center mb-10 select-none">
      {/* Page Header Bar */}
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
            title="Rotate Page"
            className="p-1 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onDeletePage(pageMeta.pageNumber)}
            title="Delete Page"
            className="p-1 rounded-md text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Page Sheet Viewport */}
      <div
        ref={containerRef}
        style={{ width: pageW, height: pageH }}
        onMouseDown={handleContainerMouseDown}
        onMouseMove={handleContainerMouseMove}
        onMouseUp={handleContainerMouseUp}
        className={`relative bg-white shadow-xl border border-slate-300 dark:border-slate-700 transition-transform ${
          activeMode === 'whiteout' || activeMode === 'annotate' || activeMode === 'shapes'
            ? 'cursor-crosshair'
            : activeMode === 'text'
            ? 'cursor-text'
            : 'cursor-default'
        }`}
      >
        {/* 1. Underlying PDF Canvas */}
        <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />

        {/* 2. Overlays Layer */}
        <div className="absolute inset-0 pointer-events-auto">
          {/* A. User Whiteouts */}
          {whiteouts
            .filter((w) => w.pageNumber === pageMeta.pageNumber)
            .map((w) => (
              <div
                key={w.id}
                style={{
                  position: 'absolute',
                  left: w.x * (scale / (w.pdfWidth > 0 ? w.width / w.pdfWidth : 1)),
                  top: w.y * (scale / (w.pdfHeight > 0 ? w.height / w.pdfHeight : 1)),
                  width: w.pdfWidth * scale,
                  height: w.pdfHeight * scale,
                  backgroundColor: w.color || '#FFFFFF',
                }}
                className="group border border-transparent hover:border-slate-300"
              >
                <button
                  type="button"
                  onClick={() => onDeleteWhiteout(w.id)}
                  className="opacity-0 group-hover:opacity-100 absolute -top-3 -right-3 p-1 bg-rose-600 text-white rounded-full shadow-xs cursor-pointer"
                >
                  <Trash2 className="w-2.5 h-2.5" />
                </button>
              </div>
            ))}

          {/* B. Existing PDF Text Overlays (IN-PLACE DIRECT EDITING) */}
          {textItems.map((item) => {
            if (item.isDeleted) return null;

            const isEditing = activeTextId === item.id;
            const itemLeft = item.x * scale;
            const itemTop = item.y * scale;
            const itemWidth = item.width * scale;
            const itemHeight = item.height * scale;
            const fontSizePx = Math.max(9, item.fontSize * scale);

            return (
              <div
                key={item.id}
                style={{
                  position: 'absolute',
                  left: itemLeft,
                  top: itemTop,
                  minWidth: Math.max(20, itemWidth),
                  minHeight: Math.max(14, itemHeight),
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveTextId(item.id);
                  setFloatingBarPos({ top: itemTop, left: itemLeft });
                }}
                className={`group transition-all select-none ${
                  isEditing
                    ? 'ring-2 ring-[#2563EB] bg-white rounded-xs z-30 shadow-md'
                    : 'hover:bg-blue-100/40 hover:ring-1 hover:ring-blue-400/60 rounded-xs cursor-text'
                } ${item.isEdited ? 'bg-white z-10' : ''}`}
              >
                {/* When edited, white out the original text area so it doesn't duplicate */}
                {item.isEdited && !isEditing && (
                  <span
                    style={{
                      fontFamily: item.fontFamily,
                      fontSize: `${fontSizePx}px`,
                      fontWeight: item.isBold ? 'bold' : 'normal',
                      fontStyle: item.isItalic ? 'italic' : 'normal',
                      color: item.color,
                      lineHeight: '1.2',
                    }}
                    className="block px-0.5 whitespace-pre bg-white"
                  >
                    {item.str}
                  </span>
                )}

                {/* When actively editing: in-place input field */}
                {isEditing ? (
                  <input
                    type="text"
                    autoFocus
                    value={item.str}
                    style={{
                      fontFamily: item.fontFamily,
                      fontSize: `${fontSizePx}px`,
                      fontWeight: item.isBold ? 'bold' : 'normal',
                      fontStyle: item.isItalic ? 'italic' : 'normal',
                      color: item.color,
                      width: '100%',
                      background: '#FFFFFF',
                    }}
                    onChange={(e) => {
                      onUpdateTextItem(item.id, {
                        str: e.target.value,
                        isEdited: true,
                      });
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        setActiveTextId(null);
                        setFloatingBarPos(null);
                      }
                    }}
                    className="outline-none border-none p-0 m-0 text-slate-900"
                  />
                ) : !item.isEdited ? (
                  // Invisible selectable bounding zone
                  <div
                    style={{
                      width: itemWidth,
                      height: itemHeight,
                    }}
                    className="w-full h-full"
                  />
                ) : null}
              </div>
            );
          })}

          {/* C. User-Added Text Elements */}
          {addedTexts
            .filter((t) => t.pageNumber === pageMeta.pageNumber)
            .map((t) => (
              <div
                key={t.id}
                style={{
                  position: 'absolute',
                  left: t.pdfX * scale,
                  top: pageH - (t.pdfY + t.fontSize) * scale,
                  zIndex: 25,
                }}
                className="group p-1 bg-white/90 border border-dashed border-[#2563EB] rounded-xs"
              >
                <input
                  type="text"
                  value={t.text}
                  style={{
                    fontFamily: t.fontFamily,
                    fontSize: `${t.fontSize * scale}px`,
                    fontWeight: t.isBold ? 'bold' : 'normal',
                    fontStyle: t.isItalic ? 'italic' : 'normal',
                    color: t.color,
                  }}
                  onChange={(e) => onUpdateAddedText(t.id, e.target.value)}
                  className="bg-transparent outline-none border-none p-0 m-0"
                />
                <button
                  type="button"
                  onClick={() => onDeleteAddedText(t.id)}
                  className="opacity-0 group-hover:opacity-100 absolute -top-3 -right-3 p-1 bg-rose-600 text-white rounded-full cursor-pointer shadow-xs"
                >
                  <Trash2 className="w-2.5 h-2.5" />
                </button>
              </div>
            ))}

          {/* D. User Annotations (Highlights) */}
          {annotations
            .filter((a) => a.pageNumber === pageMeta.pageNumber)
            .map((a) => (
              <div
                key={a.id}
                style={{
                  position: 'absolute',
                  left: a.pdfX * scale,
                  top: pageH - (a.pdfY + a.pdfHeight) * scale,
                  width: a.pdfWidth * scale,
                  height: a.pdfHeight * scale,
                  backgroundColor: a.color || '#FEF08A',
                  opacity: 0.4,
                }}
                className="group border border-yellow-400 pointer-events-auto"
              >
                <button
                  type="button"
                  onClick={() => onDeleteAnnotation(a.id)}
                  className="opacity-0 group-hover:opacity-100 absolute -top-3 -right-3 p-1 bg-rose-600 text-white rounded-full cursor-pointer shadow-xs"
                >
                  <Trash2 className="w-2.5 h-2.5" />
                </button>
              </div>
            ))}

          {/* E. User Shapes */}
          {shapes
            .filter((s) => s.pageNumber === pageMeta.pageNumber)
            .map((s) => (
              <div
                key={s.id}
                style={{
                  position: 'absolute',
                  left: s.pdfX * scale,
                  top: pageH - (s.pdfY + s.pdfHeight) * scale,
                  width: s.pdfWidth * scale,
                  height: s.pdfHeight * scale,
                  border: `${s.strokeWidth * scale}px solid ${s.strokeColor}`,
                  borderRadius: s.type === 'ellipse' ? '50%' : '4px',
                }}
                className="group pointer-events-auto"
              >
                <button
                  type="button"
                  onClick={() => onDeleteShape(s.id)}
                  className="opacity-0 group-hover:opacity-100 absolute -top-3 -right-3 p-1 bg-rose-600 text-white rounded-full cursor-pointer shadow-xs"
                >
                  <Trash2 className="w-2.5 h-2.5" />
                </button>
              </div>
            ))}

          {/* F. Signatures */}
          {signatures
            .filter((sig) => sig.pageNumber === pageMeta.pageNumber)
            .map((sig) => (
              <div
                key={sig.id}
                style={{
                  position: 'absolute',
                  left: sig.pdfX * scale,
                  top: pageH - (sig.pdfY + sig.pdfHeight) * scale,
                  width: sig.pdfWidth * scale,
                  height: sig.pdfHeight * scale,
                  zIndex: 25,
                }}
                className="group border border-dashed border-blue-400 p-1 bg-white/70 rounded-md cursor-move"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={sig.dataUrl} alt="Signature" className="w-full h-full object-contain" />
                <button
                  type="button"
                  onClick={() => onDeleteSignature(sig.id)}
                  className="opacity-0 group-hover:opacity-100 absolute -top-3 -right-3 p-1 bg-rose-600 text-white rounded-full cursor-pointer shadow-xs"
                >
                  <Trash2 className="w-2.5 h-2.5" />
                </button>
              </div>
            ))}

          {/* G. Images */}
          {images
            .filter((img) => img.pageNumber === pageMeta.pageNumber)
            .map((img) => (
              <div
                key={img.id}
                style={{
                  position: 'absolute',
                  left: img.pdfX * scale,
                  top: pageH - (img.pdfY + img.pdfHeight) * scale,
                  width: img.pdfWidth * scale,
                  height: img.pdfHeight * scale,
                  zIndex: 25,
                }}
                className="group border border-dashed border-emerald-400 p-1 bg-white/70 rounded-md cursor-move"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.dataUrl} alt="Inserted Graphic" className="w-full h-full object-contain" />
                <button
                  type="button"
                  onClick={() => onDeleteImage(img.id)}
                  className="opacity-0 group-hover:opacity-100 absolute -top-3 -right-3 p-1 bg-rose-600 text-white rounded-full cursor-pointer shadow-xs"
                >
                  <Trash2 className="w-2.5 h-2.5" />
                </button>
              </div>
            ))}

          {/* H. Interactive Form Fields */}
          {formFields
            .filter((f) => f.pageNumber === pageMeta.pageNumber)
            .map((f) => (
              <div
                key={f.id}
                style={{
                  position: 'absolute',
                  left: f.pdfX * scale,
                  top: pageH - (f.pdfY + f.pdfHeight) * scale,
                  width: f.pdfWidth * scale,
                  height: f.pdfHeight * scale,
                  zIndex: 25,
                }}
                className="bg-blue-50/70 border border-blue-400 rounded-sm p-1"
              >
                <input
                  type="text"
                  placeholder="Form Input..."
                  className="w-full h-full bg-transparent outline-none text-xs text-slate-800"
                />
              </div>
            ))}

          {/* Live Dragging Preview Rectangle */}
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
                opacity: activeMode === 'annotate' ? 0.4 : 1,
                border: '1.5px dashed #2563EB',
              }}
              className="pointer-events-none"
            />
          )}

          {/* Floating Contextual Toolbar over Active Text Item */}
          {activeEditingItem && floatingBarPos && (
            <FloatingFormatBar
              item={activeEditingItem}
              position={floatingBarPos}
              onUpdateItem={(updates) => onUpdateTextItem(activeEditingItem.id, updates)}
              onDeleteItem={() => {
                onDeleteTextItem(activeEditingItem.id);
                setActiveTextId(null);
                setFloatingBarPos(null);
              }}
              onClose={() => {
                setActiveTextId(null);
                setFloatingBarPos(null);
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

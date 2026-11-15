'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { getPdfJs } from '@/lib/pdfjsLoader';
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  RefreshCw,
  AlertCircle,
  FileText,
  Eye,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

export interface PdfPreviewerProps {
  /** File or Blob of the PDF */
  file: File | Blob | null;
  /** Custom class for outer wrapper */
  className?: string;
  /** Max height for the canvas container */
  maxHeight?: string;
  /** Optional initial page index (1-based) */
  initialPage?: number;
  /** Callback when page count is loaded */
  onLoadSuccess?: (numPages: number) => void;
  /** Callback on error */
  onError?: (err: Error) => void;
}

export function PdfPreviewer({
  file,
  className = '',
  maxHeight = '520px',
  initialPage = 1,
  onLoadSuccess,
  onError,
}: PdfPreviewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(initialPage);
  const [zoom, setZoom] = useState<number>(1.0);
  const [fitMode, setFitMode] = useState<'custom' | 'width' | 'page'>('width');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Canvas and container refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Keep references to active PDF document and render task for cleanup
  const pdfDocRef = useRef<any>(null);
  const activeRenderTaskRef = useRef<any>(null);
  const isDestroyedRef = useRef<boolean>(false);

  // 1. Load PDF Document from File/Blob
  useEffect(() => {
    isDestroyedRef.current = false;
    let isCancelled = false;

    if (!file) {
      setNumPages(0);
      setCurrentPage(1);
      setErrorMsg(null);
      setIsLoading(false);
      pdfDocRef.current = null;
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    const loadDocument = async () => {
      try {
        const pdfjs = await getPdfJs();
        const arrayBuffer = await file.arrayBuffer();

        if (isCancelled || isDestroyedRef.current) return;

        const loadingTask = pdfjs.getDocument({
          data: new Uint8Array(arrayBuffer),
          cMapUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/',
          cMapPacked: true,
        });

        const doc = await loadingTask.promise;
        if (isCancelled || isDestroyedRef.current) return;

        pdfDocRef.current = doc;
        setNumPages(doc.numPages);
        setCurrentPage((prev) => Math.min(Math.max(1, prev), doc.numPages));
        setIsLoading(false);
        if (onLoadSuccess) onLoadSuccess(doc.numPages);
      } catch (err: any) {
        if (isCancelled || isDestroyedRef.current) return;
        console.error('PDF preview load error:', err);
        const msg = err.message || 'Failed to load PDF document.';
        setErrorMsg(msg);
        setIsLoading(false);
        if (onError) onError(err);
      }
    };

    loadDocument();

    return () => {
      isCancelled = true;
      if (activeRenderTaskRef.current) {
        try {
          activeRenderTaskRef.current.cancel();
        } catch (_) {}
      }
    };
  }, [file, onLoadSuccess, onError]);

  // 2. Render Current Page onto Canvas
  const renderCurrentPage = useCallback(async () => {
    if (!pdfDocRef.current || !canvasRef.current || numPages === 0) return;

    // Cancel any previous in-flight render task
    if (activeRenderTaskRef.current) {
      try {
        activeRenderTaskRef.current.cancel();
      } catch (_) {}
      activeRenderTaskRef.current = null;
    }

    try {
      const page = await pdfDocRef.current.getPage(currentPage);
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas) return;

      const baseViewport = page.getViewport({ scale: 1.0, rotation: page.rotate || 0 });

      // Determine scale based on fit mode & container width
      let computedScale = zoom;
      if (container) {
        const containerWidth = Math.max(280, container.clientWidth - 32);
        const containerHeight = Math.max(300, container.clientHeight - 32);

        if (fitMode === 'width') {
          computedScale = containerWidth / baseViewport.width;
        } else if (fitMode === 'page') {
          const scaleW = containerWidth / baseViewport.width;
          const scaleH = containerHeight / baseViewport.height;
          computedScale = Math.min(scaleW, scaleH);
        }
      }

      // Clamp scale to safe bounds
      computedScale = Math.max(0.3, Math.min(3.5, computedScale));

      const viewport = page.getViewport({ scale: computedScale, rotation: page.rotate || 0 });
      const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;

      // Set physical canvas pixel buffer with Retina devicePixelRatio
      canvas.width = Math.floor(viewport.width * dpr);
      canvas.height = Math.floor(viewport.height * dpr);

      // Set CSS visual dimensions
      canvas.style.width = `${Math.floor(viewport.width)}px`;
      canvas.style.height = `${Math.floor(viewport.height)}px`;

      const ctx = canvas.getContext('2d', { alpha: false });
      if (!ctx) return;

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Fill white background for pages with transparent backgrounds
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.scale(dpr, dpr);

      const renderContext = {
        canvasContext: ctx,
        viewport: viewport,
      };

      const renderTask = page.render(renderContext);
      activeRenderTaskRef.current = renderTask;

      await renderTask.promise;
      activeRenderTaskRef.current = null;
    } catch (err: any) {
      if (err?.name === 'RenderingCancelledException') {
        // Expected when rapid navigation cancels prior render
        return;
      }
      console.warn('PDF Page Render Warning:', err);
    }
  }, [currentPage, zoom, fitMode, numPages]);

  // Trigger render when page, zoom, fitMode, or doc changes
  useEffect(() => {
    renderCurrentPage();
  }, [renderCurrentPage]);

  // Window resize handler to maintain fit-to-width
  useEffect(() => {
    const handleResize = () => {
      if (fitMode !== 'custom') {
        renderCurrentPage();
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [fitMode, renderCurrentPage]);

  // Navigation handlers
  const handlePrevPage = () => {
    setCurrentPage((p) => Math.max(1, p - 1));
  };

  const handleNextPage = () => {
    setCurrentPage((p) => Math.min(numPages, p + 1));
  };

  const handleZoomIn = () => {
    setFitMode('custom');
    setZoom((z) => Math.min(3.0, z + 0.15));
  };

  const handleZoomOut = () => {
    setFitMode('custom');
    setZoom((z) => Math.max(0.4, z - 0.15));
  };

  const handleFitWidth = () => {
    setFitMode('width');
  };

  const handleFitPage = () => {
    setFitMode('page');
  };

  return (
    <div
      className={`flex flex-col bg-slate-50 dark:bg-[#12141a] border border-slate-200 dark:border-[#232632] rounded-2xl overflow-hidden shadow-xs transition-colors ${className}`}
    >
      {/* 1. Header Toolbar */}
      <div className="px-4 py-2.5 bg-white dark:bg-[#181a22] border-b border-slate-200 dark:border-[#232632] flex flex-wrap items-center justify-between gap-2.5 text-xs">
        {/* Page Navigation */}
        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePrevPage}
            disabled={currentPage <= 1 || isLoading || !!errorMsg}
            className="h-7 w-7 p-0"
            title="Previous Page"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>

          <span className="font-mono text-slate-700 dark:text-slate-200 font-bold px-1.5 min-w-20 text-center">
            {numPages > 0 ? `Page ${currentPage} / ${numPages}` : 'No pages'}
          </span>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleNextPage}
            disabled={currentPage >= numPages || isLoading || !!errorMsg}
            className="h-7 w-7 p-0"
            title="Next Page"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* View / Zoom Controls */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleZoomOut}
            disabled={isLoading || !!errorMsg}
            className="h-7 w-7 p-0"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </Button>

          <span className="font-mono text-[11px] text-slate-500 w-10 text-center">
            {Math.round(zoom * 100)}%
          </span>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleZoomIn}
            disabled={isLoading || !!errorMsg}
            className="h-7 w-7 p-0"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </Button>

          <div className="h-4 w-px bg-slate-300 dark:bg-slate-700 mx-1" />

          <button
            onClick={handleFitWidth}
            disabled={isLoading || !!errorMsg}
            className={`px-2 py-1 rounded text-[11px] font-semibold transition ${
              fitMode === 'width'
                ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title="Fit to Width"
          >
            Fit Width
          </button>

          <button
            onClick={handleFitPage}
            disabled={isLoading || !!errorMsg}
            className={`px-2 py-1 rounded text-[11px] font-semibold transition ${
              fitMode === 'page'
                ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title="Fit to Page"
          >
            Fit Page
          </button>
        </div>
      </div>

      {/* 2. Main Canvas Viewport */}
      <div
        ref={containerRef}
        style={{ maxHeight }}
        className="relative flex-1 min-h-[360px] p-4 flex items-center justify-center overflow-auto bg-[#0c0d12] select-none"
      >
        {/* Loading Spinner */}
        {isLoading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/40 backdrop-blur-xs text-white gap-2">
            <RefreshCw className="w-7 h-7 text-blue-400 animate-spin" />
            <span className="text-xs font-semibold text-slate-200">Rendering PDF Page...</span>
          </div>
        )}

        {/* Error Notice */}
        {errorMsg ? (
          <div className="p-6 text-center max-w-sm space-y-2">
            <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
            <h4 className="text-sm font-bold text-slate-200">PDF Preview Unavailable</h4>
            <p className="text-xs text-slate-400 leading-relaxed">{errorMsg}</p>
          </div>
        ) : !file ? (
          <div className="text-center text-slate-500 space-y-2">
            <FileText className="w-10 h-10 mx-auto opacity-40" />
            <p className="text-xs">No PDF document selected for preview</p>
          </div>
        ) : (
          <div className="relative bg-white shadow-2xl rounded-sm overflow-hidden border border-black/10">
            <canvas ref={canvasRef} className="block w-auto h-auto" />
          </div>
        )}
      </div>

      {/* 3. Footer Status Bar */}
      <div className="px-4 py-2 bg-white dark:bg-[#181a22] border-t border-slate-200 dark:border-[#232632] flex items-center justify-between text-[11px] text-slate-500">
        <span className="flex items-center gap-1.5 font-medium">
          <Eye className="w-3.5 h-3.5 text-blue-500" />
          Native PDF Canvas Engine
        </span>
        {numPages > 0 && (
          <span className="font-mono">
            {currentPage} of {numPages} page{numPages > 1 ? 's' : ''}
          </span>
        )}
      </div>
    </div>
  );
}

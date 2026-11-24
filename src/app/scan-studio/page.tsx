'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ScanLine,
  Upload,
  FileText,
  FilePlus,
  Trash2,
  RotateCw,
  ArrowUp,
  ArrowDown,
  Download,
  Cloud,
  Eye,
  EyeOff,
  Sliders,
  Layers,
  FileCode,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  ShieldCheck,
  Check,
  X,
  RefreshCw,
  Stamp,
  Type,
  SplitSquareVertical,
  BookOpen,
  Printer,
  Sparkles,
} from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/Button';
import { Switch } from '@/components/ui/Switch';
import { useAuth } from '@/context/AuthContext';
import { fileManagerService } from '@/lib/fileManagerService';
import {
  ScanPage,
  ScanPageSettings,
  WatermarkSettings,
  PageNumberSettings,
  DocumentMetadata,
  ExportProgress,
  DEFAULT_PAGE_SETTINGS,
  ScanColorspace,
  PaperSize,
  PAPER_SIZE_OPTIONS,
} from '@/types/scanStudio';
import { loadFilesToScanPages } from '@/lib/scanPageLoader';
import { renderFullScannedPage } from '@/lib/scanEngine';
import { exportScannedPdf, exportScannedZip, exportSinglePageImage } from '@/lib/scanPdfExporter';
import { parsePageRangeString } from '@/lib/pageRangeUtils';
import { ExportPreviewModal } from '@/components/common/ExportPreviewModal';
import { fileTransferService } from '@/lib/fileTransferService';

/**
 * LookScanned-style custom slider with bright emerald fill and white circular thumb
 */
function LookScannedSlider({
  label,
  value,
  formattedValue,
  min,
  max,
  step = 1,
  onChange,
}: {
  label: string;
  value: number;
  formattedValue: string;
  min: number;
  max: number;
  step?: number;
  onChange: (val: number) => void;
}) {
  const percentage = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs font-medium">
        <span className="text-slate-300">{label}</span>
        <span className="text-slate-400 font-mono text-[11px]">{formattedValue}</span>
      </div>
      <div className="relative flex items-center w-full py-0.5">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full h-1.5 bg-[#252833] rounded-lg appearance-none cursor-pointer focus:outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-md hover:[&::-webkit-slider-thumb]:scale-110 transition-transform"
          style={{
            background: `linear-gradient(to right, #10b981 0%, #10b981 ${percentage}%, #252833 ${percentage}%, #252833 100%)`,
          }}
        />
      </div>
    </div>
  );
}

/**
 * Accordion section wrapper with collapsible header
 */
function AccordionSection({
  title,
  icon: Icon,
  isOpen,
  onToggle,
  children,
}: {
  title: string;
  icon: any;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-[#12141a] border border-[#232632] rounded-2xl overflow-hidden transition-all shadow-md">
      <button
        type="button"
        onClick={onToggle}
        className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-[#171a22] transition-colors cursor-pointer select-none"
      >
        <div className="flex items-center gap-2.5">
          <Icon className="w-4 h-4 text-slate-300 shrink-0" />
          <span className="text-xs font-bold text-slate-200 tracking-wide">{title}</span>
        </div>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
        )}
      </button>
      {isOpen && <div className="px-4 pb-4 pt-1 space-y-4 border-t border-[#1c1f2a]">{children}</div>}
    </div>
  );
}

export default function ScanStudioPage() {
  const router = useRouter();
  const { isAuthenticated, storageUsage, openAuthModal, refreshStorageUsage } = useAuth();

  // Document pages state
  const [pages, setPages] = useState<ScanPage[]>([]);
  const [activePageIndex, setActivePageIndex] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingText, setLoadingText] = useState<string>('');

  // Filename derivation
  const [baseDocName, setBaseDocName] = useState<string>('document');
  const [filenameSuffix, setFilenameSuffix] = useState<string>('-scan');
  const [outputFormat, setOutputFormat] = useState<'pdf' | 'png_zip' | 'jpeg_zip'>('pdf');
  const [preserveText, setPreserveText] = useState<boolean>(true);
  const [pdfStandard, setPdfStandard] = useState<'off' | 'pdf_a_1b' | 'pdf_a_2b'>('off');

  // Accordion state (Scan Settings open by default, matching LookScanned)
  const [openSections, setOpenSections] = useState({
    scan: true,
    paper: false,
    stamps: false,
    watermark: false,
    metadata: false,
    output: false,
  });

  const toggleSection = (key: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Global LookScanned Page Settings
  const [globalSettings, setGlobalSettings] = useState<ScanPageSettings>({ ...DEFAULT_PAGE_SETTINGS });
  const [watermark, setWatermark] = useState<WatermarkSettings>({
    enabled: false,
    type: 'text',
    text: 'CONFIDENTIAL',
    fontSize: 48,
    color: '#ef4444',
    opacity: 0.25,
    rotation: -35,
    position: 'diagonal',
    imageStampUrl: null,
    imageStampOpacity: 0.8,
    imageStampScale: 0.8,
    imageStampPosition: 'bottom-right',
  });
  const [pageNumbers, setPageNumbers] = useState<PageNumberSettings>({
    enabled: false,
    format: 'Page {page} of {total}',
    position: 'bottom-center',
    fontSize: 12,
    color: '#475569',
  });
  const [metadata, setMetadata] = useState<DocumentMetadata>({
    title: '',
    author: '',
    subject: '',
    keywords: '',
  });

  // Quality & Page Range
  const [jpegQuality, setJpegQuality] = useState<number>(90);
  const [pageRangeStr, setPageRangeStr] = useState<string>('');

  // Viewport & Preview State
  const [viewMode, setViewMode] = useState<'spread' | 'single' | 'split'>('single');
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [splitSliderPercent, setSplitSliderPercent] = useState<number>(50);
  const [previewMode, setPreviewMode] = useState<'scanned' | 'original'>('scanned');
  const [showThumbnails, setShowThumbnails] = useState<boolean>(true);

  // Export progress modal state
  const [exportProgress, setExportProgress] = useState<ExportProgress | null>(null);
  const cancelExportRef = useRef<{ current: boolean }>({ current: false });

  // Pre-Download Export Preview Modal State (folder picker & rename)
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportModalBlob, setExportModalBlob] = useState<Blob | null>(null);
  const [exportModalFilename, setExportModalFilename] = useState<string>('scanned_document.pdf');
  const [exportModalType, setExportModalType] = useState<'pdf' | 'image' | 'generic'>('pdf');

  // Cloud save state
  const [cloudSaveMessage, setCloudSaveMessage] = useState<string | null>(null);
  const [isCloudSaving, setIsCloudSaving] = useState<boolean>(false);

  // Hidden file input refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const stampInputRef = useRef<HTMLInputElement>(null);

  // Active page & Dual-page Spread calculations
  const currentPage = pages[activePageIndex] || null;
  const leftIndex = activePageIndex % 2 === 0 ? activePageIndex : activePageIndex - 1;
  const rightIndex = leftIndex + 1 < pages.length ? leftIndex + 1 : null;
  const leftPage = pages[leftIndex] || null;
  const rightPage = rightIndex !== null ? pages[rightIndex] : null;

  // Real-time canvas references
  const leftCanvasRef = useRef<HTMLCanvasElement>(null);
  const rightCanvasRef = useRef<HTMLCanvasElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  // Render a specific page onto an arbitrary target canvas
  const renderPageToCanvas = useCallback(
    (canvas: HTMLCanvasElement | null, page: ScanPage | null) => {
      if (!canvas || !page || !page.originalCanvas) return;
      const source = page.originalCanvas;

      const maxPreviewDim = 1400;
      const scale = Math.min(1, maxPreviewDim / Math.max(source.width, source.height));
      const targetW = Math.round(source.width * scale);
      const targetH = Math.round(source.height * scale);

      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const effectiveSettings = page.useGlobalSettings ? globalSettings : page.settings;

      const scannedCanvas = renderFullScannedPage(
        source,
        effectiveSettings,
        watermark,
        pageNumbers,
        page.pageNumber,
        pages.length,
        targetW,
        targetH
      );
      ctx.drawImage(scannedCanvas, 0, 0);
    },
    [globalSettings, watermark, pageNumbers, pages.length]
  );

  // Helper to re-render preview canvases whenever active page, settings or viewMode change
  const updatePreview = useCallback(() => {
    if (pages.length === 0) return;

    if (viewMode === 'spread') {
      renderPageToCanvas(leftCanvasRef.current, leftPage);
      if (rightPage) {
        renderPageToCanvas(rightCanvasRef.current, rightPage);
      }
    } else if (viewMode === 'split') {
      if (!currentPage || !currentPage.originalCanvas || !previewCanvasRef.current) return;
      const canvas = previewCanvasRef.current;
      const source = currentPage.originalCanvas;

      const maxPreviewDim = 1400;
      const scale = Math.min(1, maxPreviewDim / Math.max(source.width, source.height));
      const targetW = Math.round(source.width * scale);
      const targetH = Math.round(source.height * scale);

      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const effectiveSettings = currentPage.useGlobalSettings ? globalSettings : currentPage.settings;
      const scannedCanvas = renderFullScannedPage(
        source,
        effectiveSettings,
        watermark,
        pageNumbers,
        currentPage.pageNumber,
        pages.length,
        targetW,
        targetH
      );

      // Render full scanned canvas first
      ctx.drawImage(scannedCanvas, 0, 0);

      // Render left slice of original canvas
      const splitX = Math.round((splitSliderPercent / 100) * targetW);
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, splitX, targetH);
      ctx.clip();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, splitX, targetH);
      ctx.drawImage(source, 0, 0, targetW, targetH);
      ctx.restore();

      // Divider line
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(splitX, 0);
      ctx.lineTo(splitX, targetH);
      ctx.stroke();

      // Divider handle pill
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.arc(splitX, targetH / 2, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('⬌', splitX, targetH / 2 + 4);
    } else {
      // Single page view
      if (!currentPage || !currentPage.originalCanvas || !previewCanvasRef.current) return;
      const canvas = previewCanvasRef.current;
      const source = currentPage.originalCanvas;

      const maxPreviewDim = 1400;
      const scale = Math.min(1, maxPreviewDim / Math.max(source.width, source.height));
      const targetW = Math.round(source.width * scale);
      const targetH = Math.round(source.height * scale);

      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      if (previewMode === 'original') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, targetW, targetH);
        ctx.drawImage(source, 0, 0, targetW, targetH);
      } else {
        const effectiveSettings = currentPage.useGlobalSettings ? globalSettings : currentPage.settings;
        const scannedCanvas = renderFullScannedPage(
          source,
          effectiveSettings,
          watermark,
          pageNumbers,
          currentPage.pageNumber,
          pages.length,
          targetW,
          targetH
        );
        ctx.drawImage(scannedCanvas, 0, 0);
      }
    }
  }, [
    pages.length,
    viewMode,
    renderPageToCanvas,
    leftPage,
    rightPage,
    currentPage,
    globalSettings,
    watermark,
    pageNumbers,
    splitSliderPercent,
    previewMode,
  ]);

  useEffect(() => {
    updatePreview();
  }, [updatePreview]);

  // Load uploaded files
  const handleUploadFiles = async (files: File[]) => {
    if (!files || files.length === 0) return;
    const first = files[0];
    if (first) {
      const rawName = first.name.replace(/\.[^/.]+$/, '');
      setBaseDocName(rawName || 'scanned_document');
    }

    setIsLoading(true);
    setLoadingText('Parsing documents into pages...');
    try {
      const loadedPages = await loadFilesToScanPages(files, (msg) => setLoadingText(msg));
      setPages((prev) => {
        const combined = [...prev, ...loadedPages];
        return combined.map((p, idx) => ({ ...p, pageNumber: idx + 1 }));
      });
      if (pages.length === 0 && loadedPages.length > 0) {
        setActivePageIndex(0);
      }
    } catch (err: any) {
      alert(`Error loading document: ${err.message || err}`);
    } finally {
      setIsLoading(false);
      setLoadingText('');
    }
  };

  // Automatically load pending file from Workspace
  useEffect(() => {
    const pending = fileTransferService.consumePendingFile();
    if (pending && pending.file) {
      handleUploadFiles([pending.file]);
    }
  }, []);

  // Page reordering and manipulation
  const handleMovePage = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= pages.length) return;

    const newPages = [...pages];
    const [moved] = newPages.splice(index, 1);
    newPages.splice(targetIndex, 0, moved);

    const renumbered = newPages.map((p, i) => ({ ...p, pageNumber: i + 1 }));
    setPages(renumbered);
    setActivePageIndex(targetIndex);
  };

  const handleDeletePage = (index: number) => {
    if (pages.length <= 1) {
      setPages([]);
      setActivePageIndex(0);
      return;
    }
    const newPages = pages.filter((_, i) => i !== index).map((p, i) => ({ ...p, pageNumber: i + 1 }));
    setPages(newPages);
    setActivePageIndex(Math.min(activePageIndex, newPages.length - 1));
  };

  const handleRotatePage = (index: number) => {
    setPages((prev) =>
      prev.map((p, i) => {
        if (i !== index) return p;
        const currentRot = p.settings.rotate || 0;
        const nextRot = (currentRot + 90) % 360;
        return {
          ...p,
          settings: { ...p.settings, rotate: nextRot },
          useGlobalSettings: false,
        };
      })
    );
  };

  // Settings update helper
  const updateCurrentSettings = (field: keyof ScanPageSettings, val: any) => {
    if (!currentPage) {
      setGlobalSettings((prev) => ({ ...prev, [field]: val }));
      return;
    }

    if (currentPage.useGlobalSettings) {
      setGlobalSettings((prev) => ({ ...prev, [field]: val }));
    } else {
      setPages((prev) =>
        prev.map((p, idx) => (idx === activePageIndex ? { ...p, settings: { ...p.settings, [field]: val } } : p))
      );
    }
  };

  const toggleGlobalSettings = (useGlobal: boolean) => {
    if (!currentPage) return;
    setPages((prev) =>
      prev.map((p, idx) =>
        idx === activePageIndex
          ? {
              ...p,
              useGlobalSettings: useGlobal,
              settings: useGlobal ? { ...globalSettings } : { ...p.settings },
            }
          : p
      )
    );
  };

  const applyGlobalToAllPages = () => {
    setPages((prev) =>
      prev.map((p) => ({
        ...p,
        useGlobalSettings: true,
        settings: { ...globalSettings },
      }))
    );
  };

  // Stamp / Watermark Image Upload
  const handleStampUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const url = URL.createObjectURL(file);
      setWatermark((prev) => ({
        ...prev,
        enabled: true,
        type: 'image',
        imageUrl: url,
        imageStampUrl: url,
      }));
    }
  };

  // Generate and open preview modal before download
  const handleGenerateScannedPdf = async () => {
    if (pages.length === 0) return;

    // Filter pages if a custom range was supplied
    let pagesToExport = pages;
    if (pageRangeStr.trim()) {
      const selectedIndices = parsePageRangeString(pageRangeStr, pages.length);
      pagesToExport = selectedIndices.map((pageNum) => pages[pageNum - 1]).filter(Boolean);
    }

    if (pagesToExport.length === 0) {
      alert('No pages match the specified page range.');
      return;
    }

    const computedExt = outputFormat === 'pdf' ? 'pdf' : 'zip';
    const targetFilename = `${baseDocName}${filenameSuffix}.${computedExt}`;

    cancelExportRef.current = { current: false };

    try {
      if (outputFormat === 'pdf') {
        const pdfBytes = await exportScannedPdf(
          pagesToExport,
          globalSettings,
          watermark,
          pageNumbers,
          metadata,
          jpegQuality / 100,
          (progress) => setExportProgress(progress),
          cancelExportRef.current
        );

        const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
        setExportModalBlob(blob);
        setExportModalFilename(targetFilename);
        setExportModalType('pdf');
        setIsExportModalOpen(true);
      } else {
        const zipFormat = outputFormat === 'png_zip' ? 'png' : 'jpeg';
        const zipBlob = await exportScannedZip(
          pagesToExport,
          globalSettings,
          watermark,
          pageNumbers,
          zipFormat,
          jpegQuality / 100,
          (progress) => setExportProgress(progress),
          cancelExportRef.current
        );

        setExportModalBlob(zipBlob);
        setExportModalFilename(targetFilename);
        setExportModalType('generic');
        setIsExportModalOpen(true);
      }
    } catch (err: any) {
      if (err.message !== 'Export cancelled by user') {
        alert(`Export failed: ${err.message || err}`);
      }
    } finally {
      setExportProgress(null);
    }
  };

  // Cloud Save
  const handleSaveToCloud = async () => {
    if (!isAuthenticated) {
      openAuthModal();
      return;
    }

    if (pages.length === 0) return;

    setIsCloudSaving(true);
    setCloudSaveMessage(null);

    try {
      const pdfBytes = await exportScannedPdf(
        pages,
        globalSettings,
        watermark,
        pageNumbers,
        metadata,
        jpegQuality / 100
      );
      const safeFilename = `${baseDocName}${filenameSuffix}.pdf`;
      const pdfFile = new File([pdfBytes as any], safeFilename, { type: 'application/pdf' });

      await fileManagerService.uploadFile(pdfFile, null);
      await refreshStorageUsage();

      const retentionDays = storageUsage.retentionDays || 7;
      setCloudSaveMessage(
        `Document saved to Cloud Storage! File will be retained for ${retentionDays} days according to your ${storageUsage.plan} plan.`
      );
    } catch (err: any) {
      alert(`Cloud save error: ${err.message || err}`);
    } finally {
      setIsCloudSaving(false);
    }
  };

  // Single page JPEG export preview
  const handleExportSinglePageJpeg = async () => {
    if (!currentPage) return;
    try {
      const blob = await exportSinglePageImage(
        currentPage,
        globalSettings,
        watermark,
        pageNumbers,
        pages.length,
        jpegQuality / 100
      );
      setExportModalBlob(blob);
      setExportModalFilename(`${baseDocName}-page-${currentPage.pageNumber}.jpg`);
      setExportModalType('image');
      setIsExportModalOpen(true);
    } catch (err: any) {
      alert(`Error exporting page: ${err.message}`);
    }
  };

  const effectiveSettings = currentPage
    ? currentPage.useGlobalSettings
      ? globalSettings
      : currentPage.settings
    : globalSettings;

  const computedExt = outputFormat === 'pdf' ? 'pdf' : 'zip';
  const computedOutputFilename = `${baseDocName}${filenameSuffix}.${computedExt}`;

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] dark:bg-[#0c0d12] text-[#0F172A] dark:text-[#F8FAFC] transition-colors">
      <Header
        activeCategory="scan-studio"
        onSelectCategory={(cat: any) => {
          if (cat === 'scan-studio') return;
          if (cat === 'image-tools') router.push('/');
          else if (cat === 'pdf-tools') router.push('/pdf');
          else if (cat === 'document-converter') router.push('/documents');
          else if (cat === 'image-converter') router.push('/image-converter');
        }}
        onAddImages={() => fileInputRef.current?.click()}
        onClearWorkspace={() => setPages([])}
        onOpenShortcuts={() => {}}
        onOpenPrivacyInfo={() => {}}
        queueLength={pages.length}
      />

      {/* Top Studio Sub-header */}
      <div className="bg-white dark:bg-[#111318] border-b border-[#CBD5E1] dark:border-[#222530] px-4 py-2.5 sticky top-16 z-20">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-md">
              <ScanLine className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-extrabold text-[#0F172A] dark:text-[#F8FAFC]">
                  Gyanvatsala Scan Studio
                </h1>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                  LookScanned Engine
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  100% Client-Side
                </span>
              </div>
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                Transform clean documents into authentic photocopied and sheet-fed scans
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              className="text-xs flex items-center gap-1.5"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Add Files</span>
            </Button>

            {pages.length > 0 && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSaveToCloud}
                  disabled={isCloudSaving}
                  className="text-xs flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800"
                >
                  <Cloud className="w-3.5 h-3.5" />
                  <span>{isCloudSaving ? 'Saving...' : 'Save to Cloud'}</span>
                </Button>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleGenerateScannedPdf}
                  className="text-xs flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Generate Scanned PDF</span>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Cloud Save Notification Banner */}
      {cloudSaveMessage && (
        <div className="bg-emerald-50 dark:bg-emerald-950/60 border-b border-emerald-200 dark:border-emerald-800 px-4 py-2.5 text-xs text-emerald-800 dark:text-emerald-200 flex items-center justify-between">
          <div className="flex items-center gap-2 max-w-5xl mx-auto w-full">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{cloudSaveMessage}</span>
            <Link
              href="/dashboard/files"
              className="font-bold underline ml-2 hover:text-emerald-900 dark:hover:text-white"
            >
              View in Cloud Files
            </Link>
          </div>
          <button
            onClick={() => setCloudSaveMessage(null)}
            className="text-emerald-600 hover:text-emerald-900 dark:hover:text-white ml-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Hidden File Inputs */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.jpg,.jpeg,.png,.webp"
        className="hidden"
        onChange={(e) => {
          if (e.target.files) {
            handleUploadFiles(Array.from(e.target.files));
          }
        }}
      />
      <input
        ref={stampInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={handleStampUpload}
      />

      {/* Main Studio Body: 3-column on desktop */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 flex flex-col lg:flex-row gap-5">
        {pages.length === 0 ? (
          /* Empty State Dropzone */
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                handleUploadFiles(Array.from(e.dataTransfer.files));
              }
            }}
            className="w-full flex-1 flex flex-col items-center justify-center min-h-[520px] border-2 border-dashed border-[#CBD5E1] dark:border-[#334155] hover:border-emerald-500 dark:hover:border-emerald-400 rounded-3xl p-8 bg-white/60 dark:bg-[#111827]/60 text-center transition-all"
          >
            <div className="w-20 h-20 rounded-3xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-5 shadow-lg">
              <ScanLine className="w-10 h-10" />
            </div>

            <h2 className="text-2xl font-black text-[#0F172A] dark:text-[#F8FAFC]">
              Gyanvatsala Scan Studio
            </h2>
            <p className="text-sm text-[#475569] dark:text-[#94A3B8] max-w-lg mt-2 leading-relaxed">
              Transform clean digital PDFs and photos into authentic scanned documents with realistic sheet-feeder tilt, photocopy contrast, paper grain, and photocopier aesthetics.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
              <Button
                variant="primary"
                size="md"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                className="flex items-center gap-2 font-bold px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-md cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>Select PDF or Images</span>
              </Button>
            </div>

            {/* Formats support */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
              <span className="text-xs text-[#64748B] dark:text-[#94A3B8] mr-2">Supported:</span>
              {['PDF Document', 'JPG / JPEG', 'PNG Image', 'WebP'].map((fmt) => (
                <span
                  key={fmt}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                >
                  {fmt}
                </span>
              ))}
            </div>

            {/* Privacy indicator */}
            <div className="mt-8 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                100% Client-Side Privacy: All transformations occur locally in your browser memory. No documents are uploaded to any server without your explicit command.
              </span>
            </div>
          </div>
        ) : (
          /* Active Document Workspace */
          <>
            {/* 1. Left Panel: Multi-page Filmstrip & Organizer (Collapsible via showThumbnails) */}
            {showThumbnails && (
              <aside className="w-full lg:w-60 shrink-0 flex flex-col gap-3 bg-white dark:bg-[#12141a] p-3.5 rounded-2xl border border-[#CBD5E1] dark:border-[#232632] shadow-xs max-h-[calc(100vh-140px)]">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-emerald-500" />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Pages ({pages.length})
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="h-7 text-xs px-2 flex items-center gap-1 text-emerald-600 dark:text-emerald-400"
                  >
                    <FilePlus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </Button>
                </div>

                {/* Thumbnails list */}
                <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                  {pages.map((p, idx) => {
                    const isSelected = idx === activePageIndex;
                    return (
                      <div
                        key={p.id}
                        onClick={() => setActivePageIndex(idx)}
                        className={`group relative p-2 rounded-xl border transition-all cursor-pointer flex flex-col gap-1.5 ${
                          isSelected
                            ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/30 shadow-xs ring-1 ring-emerald-500'
                            : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-[#171a22]'
                        }`}
                      >
                        {/* Thumbnail Image */}
                        <div className="w-full aspect-[1/1.4] bg-white rounded-md overflow-hidden flex items-center justify-center border border-slate-200 dark:border-slate-700 shadow-2xs">
                          {p.thumbnailUrl ? (
                            <img
                              src={p.thumbnailUrl}
                              alt={`Page ${idx + 1}`}
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <FileText className="w-8 h-8 text-slate-300" />
                          )}
                        </div>

                        {/* Page Info and Quick Controls */}
                        <div className="flex items-center justify-between text-xs pt-1">
                          <span className="font-bold text-slate-700 dark:text-slate-300">
                            Page {idx + 1}
                          </span>

                          <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                            {/* Move Up */}
                            <button
                              title="Move Up"
                              disabled={idx === 0}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMovePage(idx, 'up');
                              }}
                              className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-30"
                            >
                              <ArrowUp className="w-3 h-3" />
                            </button>

                            {/* Move Down */}
                            <button
                              title="Move Down"
                              disabled={idx === pages.length - 1}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMovePage(idx, 'down');
                              }}
                              className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-30"
                            >
                              <ArrowDown className="w-3 h-3" />
                            </button>

                            {/* Rotate 90 */}
                            <button
                              title="Rotate 90°"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRotatePage(idx);
                              }}
                              className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-emerald-500"
                            >
                              <RotateCw className="w-3 h-3" />
                            </button>

                            {/* Delete */}
                            <button
                              title="Delete Page"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeletePage(idx);
                              }}
                              className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-950 text-red-600"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Bottom Quick Tools */}
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setPages([])}
                    className="text-xs text-red-600 hover:text-red-700 p-1"
                  >
                    Clear All
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={applyGlobalToAllPages}
                    className="text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 p-1 font-medium"
                  >
                    Sync All Pages
                  </Button>
                </div>
              </aside>
            )}

            {/* 2. Center Panel: Interactive Document Viewport */}
            <section className="flex-1 flex flex-col gap-3 min-w-0">
              {/* Viewport Top Bar */}
              <div className="bg-white dark:bg-[#12141a] px-4 py-2 rounded-2xl border border-[#CBD5E1] dark:border-[#232632] shadow-xs flex flex-wrap items-center justify-between gap-3">
                {/* Page Navigation */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={viewMode === 'spread' ? leftIndex === 0 : activePageIndex === 0}
                    onClick={() => {
                      if (viewMode === 'spread') {
                        setActivePageIndex((prev) => Math.max(0, leftIndex - 2));
                      } else {
                        setActivePageIndex((prev) => Math.max(0, prev - 1));
                      }
                    }}
                    className="h-8 w-8 p-0"
                    title="Previous"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>

                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 min-w-28 text-center">
                    {viewMode === 'spread' && rightPage
                      ? `Pages ${leftIndex + 1}–${rightIndex! + 1} of ${pages.length}`
                      : `Page ${activePageIndex + 1} of ${pages.length}`}
                  </span>

                  <Button
                    variant="outline"
                    size="sm"
                    disabled={
                      viewMode === 'spread'
                        ? rightIndex === null || rightIndex >= pages.length - 1
                        : activePageIndex === pages.length - 1
                    }
                    onClick={() => {
                      if (viewMode === 'spread') {
                        setActivePageIndex((prev) => Math.min(pages.length - 1, leftIndex + 2));
                      } else {
                        setActivePageIndex((prev) => Math.min(pages.length - 1, prev + 1));
                      }
                    }}
                    className="h-8 w-8 p-0"
                    title="Next"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>

                {/* View Mode Selector: Single, Spread, Split */}
                <div className="inline-flex rounded-lg border border-slate-200 dark:border-[#2a2e3d] p-0.5 bg-slate-100 dark:bg-[#181a22]">
                  <button
                    onClick={() => setViewMode('single')}
                    className={`px-2.5 py-1 text-xs font-bold rounded-md flex items-center gap-1.5 transition ${
                      viewMode === 'single'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                    }`}
                    title="Single Page View"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Single</span>
                  </button>

                  <button
                    onClick={() => setViewMode('spread')}
                    className={`px-2.5 py-1 text-xs font-bold rounded-md flex items-center gap-1.5 transition ${
                      viewMode === 'spread'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                    }`}
                    title="2-Page Spread View"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Spread</span>
                  </button>

                  <button
                    onClick={() => setViewMode('split')}
                    className={`px-2.5 py-1 text-xs font-bold rounded-md flex items-center gap-1.5 transition ${
                      viewMode === 'split'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                    }`}
                    title="Split Compare (Original vs Scanned)"
                  >
                    <SplitSquareVertical className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Compare</span>
                  </button>
                </div>

                {/* Single View Scanned vs Original Mode */}
                {viewMode === 'single' && (
                  <div className="inline-flex rounded-lg border border-slate-200 dark:border-[#2a2e3d] p-0.5 bg-slate-100 dark:bg-[#181a22]">
                    <button
                      onClick={() => setPreviewMode('scanned')}
                      className={`px-2 py-1 text-[11px] font-bold rounded transition ${
                        previewMode === 'scanned'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      Scanned
                    </button>
                    <button
                      onClick={() => setPreviewMode('original')}
                      className={`px-2 py-1 text-[11px] font-bold rounded transition ${
                        previewMode === 'original'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      Original
                    </button>
                  </div>
                )}

                {/* Zoom Controls */}
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setZoomLevel((z) => Math.max(40, z - 15))}
                    className="h-8 w-8 p-0"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </Button>
                  <span className="text-xs font-mono font-semibold w-12 text-center text-slate-700 dark:text-slate-300">
                    {zoomLevel}%
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setZoomLevel((z) => Math.min(200, z + 15))}
                    className="h-8 w-8 p-0"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setZoomLevel(100)}
                    className="h-8 px-2 text-xs"
                    title="Fit to Window"
                  >
                    Fit
                  </Button>
                </div>
              </div>

              {/* Split Slider Bar (when Split Mode is Active) */}
              {viewMode === 'split' && (
                <div className="bg-emerald-50 dark:bg-[#131d1a] border border-emerald-200 dark:border-emerald-800/60 rounded-xl px-4 py-2 flex items-center gap-4 text-xs">
                  <span className="font-bold text-slate-700 dark:text-slate-300 shrink-0">
                    Original (Left)
                  </span>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={splitSliderPercent}
                    onChange={(e) => setSplitSliderPercent(Number(e.target.value))}
                    className="flex-1 accent-emerald-500 cursor-pointer"
                  />
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                    Scanned (Right)
                  </span>
                </div>
              )}

              {/* Document Canvas Display Box (LookScanned Dark Studio Backdrop) */}
              <div className="flex-1 min-h-[580px] bg-[#0c0d12] rounded-2xl border border-[#1e2029] p-4 sm:p-8 flex items-center justify-center overflow-auto shadow-2xl relative select-none">
                <div
                  style={{
                    transform: `scale(${zoomLevel / 100})`,
                    transformOrigin: 'center center',
                    transition: 'transform 0.15s ease-out',
                  }}
                  className="max-w-full flex items-center justify-center"
                >
                  {/* VIEW MODE 1: 2-PAGE SPREAD VIEW */}
                  {viewMode === 'spread' && (
                    <div className="flex flex-col md:flex-row items-center justify-center gap-6 lg:gap-10">
                      {/* Left Page */}
                      {leftPage && (
                        <div
                          onClick={() => setActivePageIndex(leftIndex)}
                          className={`relative group flex flex-col items-center cursor-pointer transition-all ${
                            activePageIndex === leftIndex
                              ? 'ring-2 ring-emerald-500 rounded-sm'
                              : 'hover:opacity-95'
                          }`}
                        >
                          <div
                            className="relative bg-white shadow-[0_25px_60px_-15px_rgba(0,0,0,0.95)] border border-black/10 rounded-[2px] overflow-hidden"
                            style={{
                              transform: `rotate(${
                                (leftPage.useGlobalSettings
                                  ? globalSettings.rotate
                                  : leftPage.settings.rotate) || 0
                              }deg)`,
                              transition: 'transform 0.15s ease-out',
                            }}
                          >
                            <canvas
                              ref={leftCanvasRef}
                              className="block w-auto h-auto max-h-[72vh] max-w-[44vw] object-contain"
                            />
                          </div>
                          <div className="mt-3 flex items-center gap-2 text-[11px] font-mono text-slate-400">
                            <span className="px-2 py-0.5 rounded bg-[#181a20] border border-slate-800 text-slate-300">
                              Page {leftIndex + 1}
                            </span>
                            {activePageIndex === leftIndex && (
                              <span className="text-emerald-400 font-bold">Selected</span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Right Page */}
                      {rightPage ? (
                        <div
                          onClick={() => setActivePageIndex(rightIndex!)}
                          className={`relative group flex flex-col items-center cursor-pointer transition-all ${
                            activePageIndex === rightIndex
                              ? 'ring-2 ring-emerald-500 rounded-sm'
                              : 'hover:opacity-95'
                          }`}
                        >
                          <div
                            className="relative bg-white shadow-[0_25px_60px_-15px_rgba(0,0,0,0.95)] border border-black/10 rounded-[2px] overflow-hidden"
                            style={{
                              transform: `rotate(${
                                (rightPage.useGlobalSettings
                                  ? globalSettings.rotate
                                  : rightPage.settings.rotate) || 0
                              }deg)`,
                              transition: 'transform 0.15s ease-out',
                            }}
                          >
                            <canvas
                              ref={rightCanvasRef}
                              className="block w-auto h-auto max-h-[72vh] max-w-[44vw] object-contain"
                            />
                          </div>
                          <div className="mt-3 flex items-center gap-2 text-[11px] font-mono text-slate-400">
                            <span className="px-2 py-0.5 rounded bg-[#181a20] border border-slate-800 text-slate-300">
                              Page {rightIndex! + 1}
                            </span>
                            {activePageIndex === rightIndex && (
                              <span className="text-emerald-400 font-bold">Selected</span>
                            )}
                          </div>
                        </div>
                      ) : pages.length > 1 ? (
                        <div className="hidden md:flex flex-col items-center justify-center w-72 h-96 border border-dashed border-slate-800 rounded-lg text-slate-600 text-xs text-center p-4">
                          <span>End of document</span>
                        </div>
                      ) : null}
                    </div>
                  )}

                  {/* VIEW MODE 2 & 3: SINGLE PAGE / SPLIT VIEW */}
                  {(viewMode === 'single' || viewMode === 'split') && (
                    <div
                      className="relative bg-white shadow-[0_25px_60px_-15px_rgba(0,0,0,0.95)] border border-black/10 rounded-[2px] overflow-hidden"
                      style={{
                        transform: `rotate(${
                          viewMode === 'single' ? effectiveSettings.rotate || 0 : 0
                        }deg)`,
                        transition: 'transform 0.15s ease-out',
                      }}
                    >
                      <canvas
                        ref={previewCanvasRef}
                        className="block w-auto h-auto max-h-[75vh] max-w-[85vw] object-contain"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Filmstrip Toggle & Quick Page Pills Bar (matching LookScanned footer) */}
              <div className="bg-white dark:bg-[#12141a] px-4 py-3 rounded-2xl border border-[#CBD5E1] dark:border-[#232632] shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">
                    Page {activePageIndex + 1} of {pages.length}
                  </span>
                  <button
                    onClick={() => setShowThumbnails((prev) => !prev)}
                    className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition font-semibold cursor-pointer"
                  >
                    {showThumbnails ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    <span>{showThumbnails ? 'Hide thumbnails' : 'Show thumbnails'}</span>
                  </button>
                </div>

                {/* Quick Page Jump Pills 1, 2, 3... */}
                <div className="flex items-center gap-1.5 overflow-x-auto max-w-full py-0.5">
                  {pages.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActivePageIndex(idx)}
                      className={`w-7 h-7 rounded-lg text-xs font-bold transition cursor-pointer ${
                        idx === activePageIndex
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-[#181a22] text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-[#252833] hover:text-slate-900 dark:hover:text-slate-200 border border-slate-200 dark:border-[#2a2e3d]'
                      }`}
                    >
                      {idx + 1}
                    </button>
                  ))}
                </div>
              </div>

              {/* How to make a PDF look scanned (Educational Guide Section) */}
              <div className="p-5 rounded-2xl bg-white dark:bg-[#12141a] border border-[#CBD5E1] dark:border-[#232632] shadow-xs">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
                  How to make a PDF look scanned
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div className="flex items-start gap-3">
                    <span className="font-mono font-bold text-base text-emerald-500 shrink-0">01</span>
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                      Select your PDF and inspect its pages in the original preview.
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="font-mono font-bold text-base text-emerald-500 shrink-0">02</span>
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                      Add subtle noise and rotation, choose color or black and white, and compare small text in the scanned preview.
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="font-mono font-bold text-base text-emerald-500 shrink-0">03</span>
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                      Select “Generate Scanned PDF”, then “Download Scanned PDF” to save the pages with the scan effect.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* 3. Right Panel: LookScanned Sidebar Accordions */}
            <aside className="w-full lg:w-80 shrink-0 flex flex-col gap-3 max-h-[calc(100vh-140px)] overflow-y-auto pr-0.5">
              {/* ACCORDION 1: SCAN SETTINGS (Open by default) */}
              <AccordionSection
                title="Scan Settings"
                icon={ScanLine}
                isOpen={openSections.scan}
                onToggle={() => toggleSection('scan')}
              >
                {/* Top Row: Colorspace dropdown + Border toggle */}
                <div className="grid grid-cols-2 gap-3 items-center pb-1">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                      Colorspace
                    </label>
                    <select
                      value={effectiveSettings.colorspace}
                      onChange={(e) => updateCurrentSettings('colorspace', e.target.value as ScanColorspace)}
                      className="w-full bg-[#181a22] border border-[#2a2e3d] text-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-medium focus:outline-none focus:border-emerald-500"
                    >
                      <option value="colorful" className="bg-[#181a22] text-slate-200">
                        Colorful
                      </option>
                      <option value="grayscale" className="bg-[#181a22] text-slate-200">
                        ● Grayscale
                      </option>
                      <option value="black_and_white" className="bg-[#181a22] text-slate-200">
                        Black & White
                      </option>
                    </select>
                  </div>

                  <div className="flex flex-col items-end">
                    <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                      Border
                    </label>
                    <div className="pt-0.5">
                      <Switch
                        checked={effectiveSettings.border}
                        onCheckedChange={(checked) => updateCurrentSettings('border', checked)}
                      />
                    </div>
                  </div>
                </div>

                {/* Rotate Slider (-10° to 10°, step 0.5) */}
                <LookScannedSlider
                  label="Rotate"
                  value={effectiveSettings.rotate}
                  formattedValue={`${effectiveSettings.rotate}°`}
                  min={-10}
                  max={10}
                  step={0.5}
                  onChange={(val) => updateCurrentSettings('rotate', val)}
                />

                {/* Rotate Variance Slider (0° to 5°, step 0.1) */}
                <LookScannedSlider
                  label="Rotate Variance"
                  value={effectiveSettings.rotateVariance}
                  formattedValue={`±${effectiveSettings.rotateVariance}°`}
                  min={0}
                  max={5}
                  step={0.1}
                  onChange={(val) => updateCurrentSettings('rotateVariance', val)}
                />

                {/* Brightness Slider (0% to 200%, step 1, 100% neutral) */}
                <LookScannedSlider
                  label="Brightness"
                  value={effectiveSettings.brightness}
                  formattedValue={`${effectiveSettings.brightness}%`}
                  min={0}
                  max={200}
                  step={1}
                  onChange={(val) => updateCurrentSettings('brightness', val)}
                />

                {/* Contrast Slider (0% to 200%, step 1, 100% neutral) */}
                <LookScannedSlider
                  label="Contrast"
                  value={effectiveSettings.contrast}
                  formattedValue={`${effectiveSettings.contrast}%`}
                  min={0}
                  max={200}
                  step={1}
                  onChange={(val) => updateCurrentSettings('contrast', val)}
                />

                {/* Blur Slider (0% to 100%, step 1, default 30%) */}
                <LookScannedSlider
                  label="Blur"
                  value={effectiveSettings.blur}
                  formattedValue={`${effectiveSettings.blur}%`}
                  min={0}
                  max={100}
                  step={1}
                  onChange={(val) => updateCurrentSettings('blur', val)}
                />

                {/* Noise Slider (0% to 100%, step 1, default 10%) */}
                <LookScannedSlider
                  label="Noise"
                  value={effectiveSettings.noise}
                  formattedValue={`${effectiveSettings.noise}%`}
                  min={0}
                  max={100}
                  step={1}
                  onChange={(val) => updateCurrentSettings('noise', val)}
                />

                {/* Yellowish Slider (0% to 100%, step 1, default 0%) */}
                <LookScannedSlider
                  label="Yellowish"
                  value={effectiveSettings.yellowish}
                  formattedValue={`${effectiveSettings.yellowish}%`}
                  min={0}
                  max={100}
                  step={1}
                  onChange={(val) => updateCurrentSettings('yellowish', val)}
                />

                {/* Resolution Slider (72 to 300 PPI, step 1, default 150 PPI) */}
                <LookScannedSlider
                  label="Resolution"
                  value={effectiveSettings.resolution}
                  formattedValue={`${effectiveSettings.resolution} PPI`}
                  min={72}
                  max={300}
                  step={1}
                  onChange={(val) => updateCurrentSettings('resolution', val)}
                />

                {/* Per-page vs Global scope toggle */}
                <div className="pt-2 border-t border-[#1c1f2a] flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-slate-300 block">Apply to All Pages</span>
                    <span className="text-[10px] text-slate-500">
                      {currentPage?.useGlobalSettings ? 'Synchronized across document' : 'Custom page settings'}
                    </span>
                  </div>
                  <Switch
                    checked={currentPage?.useGlobalSettings ?? true}
                    onCheckedChange={(checked) => toggleGlobalSettings(checked)}
                  />
                </div>
              </AccordionSection>

              {/* ACCORDION 2: PAPER SETTINGS */}
              <AccordionSection
                title="Paper Settings"
                icon={FileText}
                isOpen={openSections.paper}
                onToggle={() => toggleSection('paper')}
              >
                <div className="space-y-3">
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Paper size of the output PDF and how pages are placed on the sheet
                  </p>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                      Paper Size
                    </label>
                    <select
                      value={effectiveSettings.paperSize}
                      onChange={(e) => updateCurrentSettings('paperSize', e.target.value as PaperSize)}
                      className="w-full bg-[#181a22] border border-[#2a2e3d] text-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:border-emerald-500"
                    >
                      {PAPER_SIZE_OPTIONS.map((opt) => (
                        <option key={opt.id} value={opt.id} className="bg-[#181a22] text-slate-200">
                          {opt.label}
                        </option>
                      ))}
                    </select>

                    {effectiveSettings.paperSize === 'auto' && (
                      <p className="text-[11px] text-emerald-400/90 mt-2 flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        Each page keeps its original size.
                      </p>
                    )}
                  </div>
                </div>
              </AccordionSection>

              {/* ACCORDION 3: SIGNATURES AND STAMPS SETTINGS */}
              <AccordionSection
                title="Signatures and Stamps Settings"
                icon={Stamp}
                isOpen={openSections.stamps}
                onToggle={() => toggleSection('stamps')}
              >
                <div className="space-y-3">
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    A document stamp or signature is a light mark, text, or image added to the background of a document. It's often used to show ownership, protect the document, or add signatures.
                  </p>

                  <div className="flex items-center justify-between text-xs text-slate-400 pb-1">
                    <span>Digital Stamps</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                      Active
                    </span>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => stampInputRef.current?.click()}
                    className="w-full text-xs font-semibold py-2 bg-[#181a22] hover:bg-[#202330] text-slate-200 border-[#2a2e3d] flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Stamp className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{watermark.imageStampUrl ? 'Change Stamp Image' : 'Add Stamp or Signature'}</span>
                  </Button>

                  {watermark.imageStampUrl && (
                    <div className="p-2.5 rounded-xl bg-[#181a22] border border-[#2a2e3d] space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-300 text-[11px] font-semibold">Custom Stamp Loaded</span>
                        <button
                          onClick={() => setWatermark((prev) => ({ ...prev, imageStampUrl: null, imageUrl: null }))}
                          className="text-red-400 hover:text-red-300 text-[11px] cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                      <LookScannedSlider
                        label="Stamp Opacity"
                        value={Math.round((watermark.imageStampOpacity ?? 0.8) * 100)}
                        formattedValue={`${Math.round((watermark.imageStampOpacity ?? 0.8) * 100)}%`}
                        min={10}
                        max={100}
                        onChange={(val) => setWatermark((prev) => ({ ...prev, imageStampOpacity: val / 100 }))}
                      />
                    </div>
                  )}
                </div>
              </AccordionSection>

              {/* ACCORDION 4: WATERMARK SETTINGS */}
              <AccordionSection
                title="Watermark Settings"
                icon={Type}
                isOpen={openSections.watermark}
                onToggle={() => toggleSection('watermark')}
              >
                <div className="space-y-3">
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    A document watermark is a light mark, text, or image added to the background of a document. It's often used to show ownership, protect the document, or add a label like 'CONFIDENTIAL' or 'DRAFT'.
                  </p>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-semibold">Enable Watermark</span>
                    <Switch
                      checked={watermark.enabled}
                      onCheckedChange={(checked) => setWatermark((prev) => ({ ...prev, enabled: checked }))}
                    />
                  </div>

                  {watermark.enabled && (
                    <div className="space-y-3 pt-1">
                      <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#181a22] rounded-xl border border-[#2a2e3d]">
                        <button
                          onClick={() => setWatermark((prev) => ({ ...prev, type: 'text' }))}
                          className={`py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                            watermark.type === 'text'
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          Text
                        </button>
                        <button
                          onClick={() => setWatermark((prev) => ({ ...prev, type: 'image' }))}
                          className={`py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                            watermark.type === 'image'
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          Image
                        </button>
                      </div>

                      {watermark.type === 'text' ? (
                        <div className="space-y-2.5">
                          <div>
                            <label className="text-xs font-semibold text-slate-300 block mb-1">
                              Watermark Text
                            </label>
                            <input
                              type="text"
                              value={watermark.text}
                              onChange={(e) => setWatermark((prev) => ({ ...prev, text: e.target.value }))}
                              placeholder="CONFIDENTIAL"
                              className="w-full bg-[#181a22] border border-[#2a2e3d] text-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-500 font-mono"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-xs font-semibold text-slate-300 block mb-1">
                                Color
                              </label>
                              <input
                                type="color"
                                value={watermark.color}
                                onChange={(e) => setWatermark((prev) => ({ ...prev, color: e.target.value }))}
                                className="w-full h-8 rounded-lg cursor-pointer bg-[#181a22] border border-[#2a2e3d]"
                              />
                            </div>
                            <div>
                              <label className="text-xs font-semibold text-slate-300 block mb-1">
                                Position
                              </label>
                              <select
                                value={watermark.position}
                                onChange={(e) =>
                                  setWatermark((prev) => ({ ...prev, position: e.target.value as any }))
                                }
                                className="w-full h-8 px-2 rounded-lg bg-[#181a22] border border-[#2a2e3d] text-slate-200 text-xs"
                              >
                                <option value="diagonal">Diagonal</option>
                                <option value="center">Center</option>
                                <option value="header">Header</option>
                                <option value="footer">Footer</option>
                              </select>
                            </div>
                          </div>

                          <LookScannedSlider
                            label="Opacity"
                            value={Math.round(watermark.opacity * 100)}
                            formattedValue={`${Math.round(watermark.opacity * 100)}%`}
                            min={5}
                            max={90}
                            onChange={(val) => setWatermark((prev) => ({ ...prev, opacity: val / 100 }))}
                          />
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => stampInputRef.current?.click()}
                            className="w-full text-xs font-semibold py-2 bg-[#181a22] hover:bg-[#202330] text-slate-200 border-[#2a2e3d] flex items-center justify-center gap-2 cursor-pointer"
                          >
                            <Upload className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Select a watermark image</span>
                          </Button>
                          <LookScannedSlider
                            label="Opacity"
                            value={Math.round(watermark.opacity * 100)}
                            formattedValue={`${Math.round(watermark.opacity * 100)}%`}
                            min={5}
                            max={90}
                            onChange={(val) => setWatermark((prev) => ({ ...prev, opacity: val / 100 }))}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </AccordionSection>

              {/* ACCORDION 5: PDF METADATA SETTINGS */}
              <AccordionSection
                title="PDF Metadata Settings"
                icon={FileCode}
                isOpen={openSections.metadata}
                onToggle={() => toggleSection('metadata')}
              >
                <div className="space-y-3">
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    PDF metadata is information about a PDF document that describes its content, authorship, and other properties. It helps with organizing, searching, and categorizing the document without reading its actual content.
                  </p>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                      Archival Standard
                    </label>
                    <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#181a22] rounded-xl border border-[#2a2e3d]">
                      {(['off', 'pdf_a_1b', 'pdf_a_2b'] as const).map((std) => (
                        <button
                          key={std}
                          onClick={() => setPdfStandard(std)}
                          className={`py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                            pdfStandard === std
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {std === 'off' ? 'Off' : std === 'pdf_a_1b' ? 'PDF/A-1b' : 'PDF/A-2b'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">Title</label>
                      <input
                        type="text"
                        value={metadata.title}
                        onChange={(e) => setMetadata((prev) => ({ ...prev, title: e.target.value }))}
                        placeholder="Document Title"
                        className="w-full bg-[#181a22] border border-[#2a2e3d] text-slate-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">Author</label>
                      <input
                        type="text"
                        value={metadata.author}
                        onChange={(e) => setMetadata((prev) => ({ ...prev, author: e.target.value }))}
                        placeholder="Author or Organization"
                        className="w-full bg-[#181a22] border border-[#2a2e3d] text-slate-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                </div>
              </AccordionSection>

              {/* ACCORDION 6: OUTPUT SETTINGS */}
              <AccordionSection
                title="Output Settings"
                icon={Download}
                isOpen={openSections.output}
                onToggle={() => toggleSection('output')}
              >
                <div className="space-y-3.5">
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Choose the format and filename of the scanned result
                  </p>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                      Output Format
                    </label>
                    <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#181a22] rounded-xl border border-[#2a2e3d]">
                      {[
                        { id: 'pdf', label: 'PDF' },
                        { id: 'png_zip', label: 'PNG (ZIP)' },
                        { id: 'jpeg_zip', label: 'JPEG (ZIP)' },
                      ].map((fmt) => (
                        <button
                          key={fmt.id}
                          onClick={() => setOutputFormat(fmt.id as any)}
                          className={`py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                            outputFormat === fmt.id
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {fmt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs py-1">
                    <div>
                      <span className="font-semibold text-slate-300 block">
                        Preserve original text (OCR-like)
                      </span>
                      <span className="text-[10px] text-slate-500">
                        Retains searchable and selectable text
                      </span>
                    </div>
                    <Switch checked={preserveText} onCheckedChange={(val) => setPreserveText(val)} />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      Filename Suffix
                    </label>
                    <input
                      type="text"
                      value={filenameSuffix}
                      onChange={(e) => setFilenameSuffix(e.target.value)}
                      placeholder="-scan"
                      className="w-full bg-[#181a22] border border-[#2a2e3d] text-slate-200 rounded-xl px-3 py-1.5 text-xs font-mono focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="p-3 rounded-xl bg-[#181a22] border border-[#2a2e3d] text-xs">
                    <span className="text-slate-400 text-[11px] block">Files will be saved as:</span>
                    <span className="text-emerald-400 font-mono text-[11px] font-bold break-all">
                      “{computedOutputFilename}”
                    </span>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      Page Range (Optional)
                    </label>
                    <input
                      type="text"
                      value={pageRangeStr}
                      onChange={(e) => setPageRangeStr(e.target.value)}
                      placeholder="e.g. 1-3, 5 (Leave empty for all)"
                      className="w-full bg-[#181a22] border border-[#2a2e3d] text-slate-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </AccordionSection>

              {/* BIG ACTION BUTTON: GENERATE SCANNED PDF (LookScanned Aesthetic) */}
              <div className="pt-2 sticky bottom-0 bg-transparent pb-1">
                <button
                  type="button"
                  onClick={handleGenerateScannedPdf}
                  disabled={pages.length === 0 || isLoading}
                  className="w-full py-3.5 px-4 rounded-xl font-bold flex items-center justify-center gap-2.5 bg-[#0e271f] hover:bg-[#13372b] active:scale-[0.99] text-[#34d399] border-2 border-[#10b981] shadow-lg shadow-emerald-950/40 transition-all text-sm tracking-wide disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <Printer className="w-4.5 h-4.5 text-[#34d399]" />
                  <span>Generate Scanned PDF</span>
                </button>
              </div>
            </aside>
          </>
        )}
      </main>

      {/* Export Progress Modal */}
      {exportProgress && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#12141a] rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 dark:border-[#232632] flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center">
                <ScanLine className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Exporting Scanned Document
                </h3>
                <p className="text-xs text-slate-500">{exportProgress.statusText}</p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-100 dark:bg-[#181a22] rounded-full h-3 overflow-hidden">
              <div
                className="bg-emerald-600 h-full transition-all duration-200 rounded-full"
                style={{ width: `${exportProgress.progressPercent}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>{exportProgress.progressPercent}% completed</span>
              <span>
                Page {exportProgress.currentPage} of {exportProgress.totalPages}
              </span>
            </div>

            {exportProgress.canCancel && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  cancelExportRef.current.current = true;
                }}
                className="mt-2 text-xs text-red-600 border-red-200 hover:bg-red-50"
              >
                Cancel Export
              </Button>
            )}
          </div>
        </div>
      )}

      {/* General Loading Indicator */}
      {isLoading && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#12141a] rounded-2xl p-6 max-w-sm w-full shadow-2xl text-center space-y-3 border border-slate-200 dark:border-[#232632]">
            <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin mx-auto" />
            <p className="text-sm font-bold text-slate-900 dark:text-white">{loadingText}</p>
          </div>
        </div>
      )}

      {/* Pre-Download Export Preview Modal with Folder Selection & Rename */}
      <ExportPreviewModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        blob={exportModalBlob}
        defaultFilename={exportModalFilename}
        title={exportModalType === 'pdf' ? 'Scanned PDF: Preview & Save' : 'Scanned Archive: Preview & Save'}
        fileType={exportModalType}
        metadata={{
          pageCount: exportModalType === 'pdf' ? pages.length : 1,
        }}
      />

      <Footer />
    </div>
  );
}

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  ImageItem,
  ToolId,
  CompressSettings,
  ResizeSettings,
  ConvertSettings,
  CropSettings,
  RotateSettings,
  BeautifySettings,
  PassportSettings,
  ToastMessage,
  ExtractedColor,
} from '@/types';
import { Header } from '@/components/Header';
import { ToolNavigation } from '@/components/ToolNavigation';
import { Dropzone } from '@/components/Dropzone';
import { PreviewViewport } from '@/components/PreviewViewport';
import { QueueTray } from '@/components/QueueTray';
import { ActionBar } from '@/components/ActionBar';
import { ToastContainer } from '@/components/ToastContainer';
import { PrivacyBanner } from '@/components/PrivacyBanner';
import { KeyboardShortcutsModal } from '@/components/KeyboardShortcutsModal';
import { Footer } from '@/components/Footer';

// Platform Categories & Tools
import { MainCategory, PdfToolId } from '@/types/document';
import { PdfToolsHub } from '@/components/pdf/PdfToolsHub';
import { DedicatedToolWorkspace } from '@/components/pdf/DedicatedToolWorkspace';
import { DocumentConverterHub } from '@/components/documents/DocumentConverterHub';
import { ImageConverterHub } from '@/components/images/ImageConverterHub';

// Panels
import { CompressPanel } from '@/components/panels/CompressPanel';
import { ResizePanel } from '@/components/panels/ResizePanel';
import { ConvertPanel } from '@/components/panels/ConvertPanel';
import { CropPanel } from '@/components/panels/CropPanel';
import { RotatePanel } from '@/components/panels/RotatePanel';
import { MetadataPanel } from '@/components/panels/MetadataPanel';
import { PalettePanel } from '@/components/panels/PalettePanel';
import { BeautifyPanel } from '@/components/panels/BeautifyPanel';
import { PassportPanel } from '@/components/panels/PassportPanel';
import { BatchPanel } from '@/components/panels/BatchPanel';

// Libs
import { extractExifMetadata, stripImageMetadata } from '@/lib/exifHelper';
import { extractColorsFromImage } from '@/lib/colorExtractor';
import {
  compressImage,
  resizeImage,
  convertImage,
  cropImage,
  rotateFlipImage,
  beautifyScreenshot,
  generatePassportPhoto,
} from '@/lib/imageProcessing';
import {
  formatBytes,
  downloadBlob,
  createZip,
  exportImagesToPdf,
  loadImage,
} from '@/lib/utils';
import { PASSPORT_PRESETS } from '@/lib/passportTemplates';

export default function Home() {
  // App category & tool state
  const [activeCategory, setActiveCategory] = useState<MainCategory>('image-tools');
  const [selectedPdfTool, setSelectedPdfTool] = useState<PdfToolId | null>(null);

  // Existing App state
  const [queue, setQueue] = useState<ImageItem[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState<ToolId>('compress');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Sync URL search params
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab') as MainCategory;
      const tool = params.get('tool') as PdfToolId;
      if (['image-tools', 'pdf-tools', 'document-converter', 'image-converter'].includes(tab)) {
        setActiveCategory(tab);
      }
      if (tool) {
        setSelectedPdfTool(tool);
        setActiveCategory('pdf-tools');
      }
    }
  }, []);

  // Modals
  const [privacyModalOpen, setPrivacyModalOpen] = useState(false);
  const [shortcutsModalOpen, setShortcutsModalOpen] = useState(false);

  // Tool settings
  const [compressSettings, setCompressSettings] = useState<CompressSettings>({
    quality: 80,
    targetSizeKb: 0,
    maxDimension: 0,
    format: 'original',
  });

  const [resizeSettings, setResizeSettings] = useState<ResizeSettings>({
    mode: 'dimensions',
    width: 1200,
    height: 800,
    lockAspectRatio: true,
    percentage: 100,
    preset: '',
    smoothing: 'high',
  });

  const [convertSettings, setConvertSettings] = useState<ConvertSettings>({
    format: 'image/webp',
    quality: 90,
    bgColor: '#FFFFFF',
  });

  const [cropSettings, setCropSettings] = useState<CropSettings>({
    aspect: 'free',
    cropBox: { x: 10, y: 10, width: 80, height: 80 },
    zoom: 1,
  });

  const [rotateSettings, setRotateSettings] = useState<RotateSettings>({
    rotation: 0,
    fineAngle: 0,
    flipH: false,
    flipV: false,
    bgColor: 'transparent',
  });

  const [beautifySettings, setBeautifySettings] = useState<BeautifySettings>({
    frameStyle: 'macos',
    bgType: 'gradient',
    gradientId: 'aurora',
    solidColor: '#0F172A',
    padding: 48,
    borderRadius: 16,
    shadowIntensity: 'medium',
    aspectRatio: 'auto',
    exportScale: 1,
    windowTitle: 'screenshot.png',
  });

  const [passportSettings, setPassportSettings] = useState<PassportSettings>({
    presetId: 'us',
    widthMm: 50.8,
    heightMm: 50.8,
    dpi: 300,
    bgOption: 'white',
    showBiometricGuides: true,
    sheetLayout: 'single',
    addCutLines: true,
    headScale: 1.0,
    verticalOffset: 0,
  });

  const [extractedColors, setExtractedColors] = useState<ExtractedColor[]>([]);

  // Active item reference
  const activeImage = queue.find((img) => img.id === activeId) || null;

  // Add toast helper
  const addToast = useCallback(
    (title: string, description?: string, type: ToastMessage['type'] = 'success') => {
      const id = `${Date.now()}_${Math.random()}`;
      setToasts((prev) => [...prev, { id, title, description, type }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    },
    []
  );

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Helper to ingest files into queue
  const handleAddFiles = useCallback(
    async (files: File[]) => {
      if (!files || files.length === 0) return;

      const newItems: ImageItem[] = [];

      for (const file of files) {
        const url = URL.createObjectURL(file);
        try {
          const img = await loadImage(url);
          const metadata = await extractExifMetadata(file);

          const item: ImageItem = {
            id: `img_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            file,
            name: file.name,
            originalSize: file.size,
            originalWidth: img.naturalWidth,
            originalHeight: img.naturalHeight,
            url,
            format: file.type || 'image/jpeg',
            processedBlob: null,
            processedUrl: null,
            processedSize: null,
            processedWidth: null,
            processedHeight: null,
            isProcessing: false,
            error: null,
            metadata,
            hasExif: metadata !== null,
          };

          newItems.push(item);
        } catch (err) {
          console.error('Failed to load file:', file.name, err);
        }
      }

      if (newItems.length > 0) {
        setQueue((prev) => [...prev, ...newItems]);
        if (!activeId) {
          setActiveId(newItems[0].id);
        }
        addToast(
          `Added ${newItems.length} image${newItems.length > 1 ? 's' : ''}`,
          'Ready for local processing'
        );
      }
    },
    [activeId, addToast]
  );

  // When active image changes, update resize dimensions and extract palette
  useEffect(() => {
    if (activeImage) {
      setResizeSettings((prev) => ({
        ...prev,
        width: activeImage.originalWidth,
        height: activeImage.originalHeight,
      }));

      // Extract colors for palette tool
      loadImage(activeImage.url).then((img) => {
        const colors = extractColorsFromImage(img, 6);
        setExtractedColors(colors);
      });
    }
  }, [activeImage?.id, activeImage?.url, activeImage?.originalWidth, activeImage?.originalHeight]);

  // Handle color palette extraction count change
  const handleExtractColors = async (count: number) => {
    if (!activeImage) return;
    const img = await loadImage(activeImage.url);
    const colors = extractColorsFromImage(img, count);
    setExtractedColors(colors);
  };

  // Single Process Handlers
  const handleApplyCompress = async () => {
    if (!activeImage) return;
    setIsProcessing(true);
    try {
      const res = await compressImage(activeImage.file, compressSettings);
      const processedUrl = URL.createObjectURL(res.blob);
      setQueue((prev) =>
        prev.map((item) =>
          item.id === activeImage.id
            ? {
                ...item,
                processedBlob: res.blob,
                processedUrl,
                processedSize: res.size,
                processedWidth: res.width,
                processedHeight: res.height,
              }
            : item
        )
      );
      addToast(
        'Compression Complete',
        `${formatBytes(activeImage.originalSize)} → ${formatBytes(res.size)}`
      );
    } catch (err: any) {
      addToast('Compression Failed', err.message, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApplyResize = async () => {
    if (!activeImage) return;
    setIsProcessing(true);
    try {
      const res = await resizeImage(activeImage.file, resizeSettings);
      const processedUrl = URL.createObjectURL(res.blob);
      setQueue((prev) =>
        prev.map((item) =>
          item.id === activeImage.id
            ? {
                ...item,
                processedBlob: res.blob,
                processedUrl,
                processedSize: res.size,
                processedWidth: res.width,
                processedHeight: res.height,
              }
            : item
        )
      );
      addToast(
        'Resized Successfully',
        `Scaled to ${res.width} × ${res.height} px`
      );
    } catch (err: any) {
      addToast('Resize Failed', err.message, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApplyConvert = async () => {
    if (!activeImage) return;
    setIsProcessing(true);
    try {
      const res = await convertImage(activeImage.file, convertSettings);
      const processedUrl = URL.createObjectURL(res.blob);
      setQueue((prev) =>
        prev.map((item) =>
          item.id === activeImage.id
            ? {
                ...item,
                processedBlob: res.blob,
                processedUrl,
                processedSize: res.size,
                processedWidth: res.width,
                processedHeight: res.height,
              }
            : item
        )
      );
      addToast(
        'Format Converted',
        `Converted to ${convertSettings.format}`
      );
    } catch (err: any) {
      addToast('Conversion Failed', err.message, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApplyCrop = async () => {
    if (!activeImage) return;
    setIsProcessing(true);
    try {
      const res = await cropImage(activeImage.file, cropSettings);
      const processedUrl = URL.createObjectURL(res.blob);
      setQueue((prev) =>
        prev.map((item) =>
          item.id === activeImage.id
            ? {
                ...item,
                processedBlob: res.blob,
                processedUrl,
                processedSize: res.size,
                processedWidth: res.width,
                processedHeight: res.height,
              }
            : item
        )
      );
      addToast('Cropped Successfully', `Cropped to ${res.width} × ${res.height} px`);
    } catch (err: any) {
      addToast('Crop Failed', err.message, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApplyRotate = async () => {
    if (!activeImage) return;
    setIsProcessing(true);
    try {
      const res = await rotateFlipImage(activeImage.file, rotateSettings);
      const processedUrl = URL.createObjectURL(res.blob);
      setQueue((prev) =>
        prev.map((item) =>
          item.id === activeImage.id
            ? {
                ...item,
                processedBlob: res.blob,
                processedUrl,
                processedSize: res.size,
                processedWidth: res.width,
                processedHeight: res.height,
              }
            : item
        )
      );
      addToast('Rotation Applied', `Transformed orientation`);
    } catch (err: any) {
      addToast('Rotation Failed', err.message, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStripMetadata = async () => {
    if (!activeImage) return;
    setIsProcessing(true);
    try {
      const img = await loadImage(activeImage.url);
      const blob = await stripImageMetadata(img, activeImage.format || 'image/jpeg');
      const processedUrl = URL.createObjectURL(blob);
      setQueue((prev) =>
        prev.map((item) =>
          item.id === activeImage.id
            ? {
                ...item,
                processedBlob: blob,
                processedUrl,
                processedSize: blob.size,
                metadata: null,
                hasExif: false,
              }
            : item
        )
      );
      addToast('Metadata Sanitized', '100% EXIF-free byte output generated');
    } catch (err: any) {
      addToast('Sanitization Failed', err.message, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApplyBeautify = async () => {
    if (!activeImage) return;
    setIsProcessing(true);
    try {
      const res = await beautifyScreenshot(activeImage.file, beautifySettings);
      const processedUrl = URL.createObjectURL(res.blob);
      setQueue((prev) =>
        prev.map((item) =>
          item.id === activeImage.id
            ? {
                ...item,
                processedBlob: res.blob,
                processedUrl,
                processedSize: res.size,
                processedWidth: res.width,
                processedHeight: res.height,
              }
            : item
        )
      );
      addToast('Screenshot Beautified', 'Rendered modern framed mockup');
    } catch (err: any) {
      addToast('Beautify Failed', err.message, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApplyPassport = async () => {
    if (!activeImage) return;
    setIsProcessing(true);
    try {
      const res = await generatePassportPhoto(activeImage.file, passportSettings);
      const processedUrl = URL.createObjectURL(res.blob);
      setQueue((prev) =>
        prev.map((item) =>
          item.id === activeImage.id
            ? {
                ...item,
                processedBlob: res.blob,
                processedUrl,
                processedSize: res.size,
                processedWidth: res.width,
                processedHeight: res.height,
              }
            : item
        )
      );
      const preset = PASSPORT_PRESETS.find((p) => p.id === passportSettings.presetId);
      addToast(
        'Passport Photo Ready',
        `${preset?.name || 'Custom'} (${passportSettings.sheetLayout === 'single' ? 'Single' : 'Print Sheet'})`
      );
    } catch (err: any) {
      addToast('Passport Photo Failed', err.message, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Batch actions
  const handleBatchCompress = async (quality: number) => {
    setIsProcessing(true);
    let count = 0;
    try {
      for (const item of queue) {
        const res = await compressImage(item.file, {
          quality,
          targetSizeKb: 0,
          maxDimension: 0,
          format: 'original',
        });
        const processedUrl = URL.createObjectURL(res.blob);
        setQueue((prev) =>
          prev.map((q) =>
            q.id === item.id
              ? {
                  ...q,
                  processedBlob: res.blob,
                  processedUrl,
                  processedSize: res.size,
                  processedWidth: res.width,
                  processedHeight: res.height,
                }
              : q
          )
        );
        count++;
      }
      addToast('Batch Compression Complete', `Processed all ${count} images`);
    } catch (err: any) {
      addToast('Batch Error', err.message, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBatchConvert = async (format: string) => {
    setIsProcessing(true);
    let count = 0;
    try {
      for (const item of queue) {
        const res = await convertImage(item.file, {
          format: format as any,
          quality: 90,
          bgColor: '#FFFFFF',
        });
        const processedUrl = URL.createObjectURL(res.blob);
        setQueue((prev) =>
          prev.map((q) =>
            q.id === item.id
              ? {
                  ...q,
                  processedBlob: res.blob,
                  processedUrl,
                  processedSize: res.size,
                  processedWidth: res.width,
                  processedHeight: res.height,
                }
              : q
          )
        );
        count++;
      }
      addToast('Batch Conversion Complete', `Converted all ${count} images to ${format}`);
    } catch (err: any) {
      addToast('Batch Error', err.message, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBatchResize = async (maxWidth: number) => {
    setIsProcessing(true);
    let count = 0;
    try {
      for (const item of queue) {
        let targetW = item.originalWidth;
        let targetH = item.originalHeight;
        if (targetW > maxWidth) {
          targetH = Math.round((targetH * maxWidth) / targetW);
          targetW = maxWidth;
        }

        const res = await resizeImage(item.file, {
          mode: 'dimensions',
          width: targetW,
          height: targetH,
          lockAspectRatio: true,
          percentage: 100,
          preset: '',
          smoothing: 'high',
        });
        const processedUrl = URL.createObjectURL(res.blob);
        setQueue((prev) =>
          prev.map((q) =>
            q.id === item.id
              ? {
                  ...q,
                  processedBlob: res.blob,
                  processedUrl,
                  processedSize: res.size,
                  processedWidth: res.width,
                  processedHeight: res.height,
                }
              : q
          )
        );
        count++;
      }
      addToast('Batch Resize Complete', `Scaled all ${count} images`);
    } catch (err: any) {
      addToast('Batch Error', err.message, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBatchStripMetadata = async () => {
    setIsProcessing(true);
    let count = 0;
    try {
      for (const item of queue) {
        const img = await loadImage(item.url);
        const blob = await stripImageMetadata(img, item.format || 'image/jpeg');
        const processedUrl = URL.createObjectURL(blob);
        setQueue((prev) =>
          prev.map((q) =>
            q.id === item.id
              ? {
                  ...q,
                  processedBlob: blob,
                  processedUrl,
                  processedSize: blob.size,
                  metadata: null,
                  hasExif: false,
                }
              : q
          )
        );
        count++;
      }
      addToast('Batch EXIF Stripping Complete', `Sanitized all ${count} images`);
    } catch (err: any) {
      addToast('Batch Error', err.message, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Downloads
  const handleDownloadSingle = () => {
    if (!activeImage) return;
    const blob = activeImage.processedBlob || activeImage.file;
    let name = activeImage.name;
    const dotIndex = name.lastIndexOf('.');
    const baseName = dotIndex !== -1 ? name.substring(0, dotIndex) : name;
    let ext = dotIndex !== -1 ? name.substring(dotIndex) : '.png';

    if (activeImage.processedBlob) {
      if (activeImage.processedBlob.type === 'image/webp') ext = '.webp';
      else if (activeImage.processedBlob.type === 'image/jpeg') ext = '.jpg';
      else if (activeImage.processedBlob.type === 'image/png') ext = '.png';
      else if (activeImage.processedBlob.type === 'application/pdf') ext = '.pdf';
      else if (activeImage.processedBlob.type === 'image/svg+xml') ext = '.svg';
      name = `${baseName}_pixelkit${ext}`;
    }

    downloadBlob(blob, name);
    addToast('Download Started', name);
  };

  const handleDownloadZip = async () => {
    if (queue.length === 0) return;
    setIsProcessing(true);
    try {
      const itemsToZip = queue.map((q) => {
        const blob = q.processedBlob || q.file;
        let name = q.name;
        if (q.processedBlob) {
          const dot = name.lastIndexOf('.');
          const base = dot !== -1 ? name.substring(0, dot) : name;
          let ext = dot !== -1 ? name.substring(dot) : '.png';
          if (q.processedBlob.type === 'image/webp') ext = '.webp';
          else if (q.processedBlob.type === 'image/jpeg') ext = '.jpg';
          else if (q.processedBlob.type === 'image/png') ext = '.png';
          name = `${base}_pixelkit${ext}`;
        }
        return { name, blob };
      });

      const zipBlob = await createZip(itemsToZip);
      downloadBlob(zipBlob, `pixelkit_processed_${Date.now()}.zip`);
      addToast('ZIP Download Ready', `Packaged ${queue.length} images`);
    } catch (err: any) {
      addToast('ZIP Creation Failed', err.message, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExportPdf = async () => {
    if (!activeImage) return;
    setIsProcessing(true);
    try {
      const blob = activeImage.processedBlob || activeImage.file;
      const pdfBlob = await exportImagesToPdf([
        {
          blob,
          width: activeImage.processedWidth || activeImage.originalWidth,
          height: activeImage.processedHeight || activeImage.originalHeight,
        },
      ]);
      downloadBlob(pdfBlob, `${activeImage.name}_passport_sheet.pdf`);
      addToast('PDF Document Exported', 'Ready for high-resolution printing');
    } catch (err: any) {
      addToast('PDF Export Failed', err.message, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResetOriginal = () => {
    if (!activeImage) return;
    setQueue((prev) =>
      prev.map((item) =>
        item.id === activeImage.id
          ? {
              ...item,
              processedBlob: null,
              processedUrl: null,
              processedSize: null,
              processedWidth: null,
              processedHeight: null,
            }
          : item
      )
    );
    addToast('Reset to Original', 'Cleared active edits');
  };

  const handleClearWorkspace = () => {
    queue.forEach((item) => {
      URL.revokeObjectURL(item.url);
      if (item.processedUrl) URL.revokeObjectURL(item.processedUrl);
    });
    setQueue([]);
    setActiveId(null);
    addToast('Workspace Cleared', 'All images removed from memory');
  };

  const handleRemoveQueueItem = (id: string) => {
    const item = queue.find((q) => q.id === id);
    if (item) {
      URL.revokeObjectURL(item.url);
      if (item.processedUrl) URL.revokeObjectURL(item.processedUrl);
    }
    const filtered = queue.filter((q) => q.id !== id);
    setQueue(filtered);
    if (activeId === id) {
      setActiveId(filtered.length > 0 ? filtered[0].id : null);
    }
  };

  // Keyboard shortcuts listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleDownloadSingle();
      }

      const toolMap: ToolId[] = [
        'compress',
        'resize',
        'convert',
        'crop',
        'rotate',
        'metadata',
        'palette',
        'beautify',
        'passport',
        'batch',
      ];
      const num = parseInt(e.key, 10);
      if (num >= 1 && num <= toolMap.length) {
        setActiveTool(toolMap[num - 1]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeImage]);

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] dark:bg-[#0F172A] text-[#0F172A] dark:text-[#F8FAFC] selection:bg-[#2563EB] selection:text-white transition-colors">
      {/* Top Navbar with Category Navigation */}
      <Header
        activeCategory={activeCategory}
        onSelectCategory={(cat) => {
          setActiveCategory(cat);
          setSelectedPdfTool(null);
        }}
        onAddImages={handleAddFiles}
        onClearWorkspace={handleClearWorkspace}
        onOpenShortcuts={() => setShortcutsModalOpen(true)}
        onOpenPrivacyInfo={() => setPrivacyModalOpen(true)}
        queueLength={queue.length}
      />

      {/* 1. PDF TOOLS CATEGORY */}
      {activeCategory === 'pdf-tools' && (
        <main className="flex-1 flex flex-col">
          {selectedPdfTool ? (
            <DedicatedToolWorkspace
              toolId={selectedPdfTool}
              onBack={() => setSelectedPdfTool(null)}
              onSelectOtherTool={(t) => setSelectedPdfTool(t)}
            />
          ) : (
            <PdfToolsHub onSelectTool={(toolId) => setSelectedPdfTool(toolId)} />
          )}
        </main>
      )}

      {/* 2. DOCUMENT CONVERTER CATEGORY */}
      {activeCategory === 'document-converter' && (
        <main className="flex-1 flex flex-col">
          {selectedPdfTool ? (
            <DedicatedToolWorkspace
              toolId={selectedPdfTool}
              onBack={() => setSelectedPdfTool(null)}
              onSelectOtherTool={(t) => setSelectedPdfTool(t)}
            />
          ) : (
            <DocumentConverterHub onSelectTool={(toolId) => setSelectedPdfTool(toolId)} />
          )}
        </main>
      )}

      {/* 3. IMAGE CONVERTER CATEGORY */}
      {activeCategory === 'image-converter' && (
        <main className="flex-1 flex flex-col">
          {selectedPdfTool ? (
            <DedicatedToolWorkspace
              toolId={selectedPdfTool}
              onBack={() => setSelectedPdfTool(null)}
              onSelectOtherTool={(t) => setSelectedPdfTool(t)}
            />
          ) : (
            <ImageConverterHub
              onSelectPdfTool={(toolId) => setSelectedPdfTool(toolId)}
              onSwitchToImageWorkbench={(tool) => {
                setActiveCategory('image-tools');
                if (tool) setActiveTool(tool as any);
              }}
            />
          )}
        </main>
      )}

      {/* 4. IMAGE TOOLS WORKBENCH (PRESERVED 100%) */}
      {activeCategory === 'image-tools' && (
        <>
          {queue.length === 0 ? (
            <main className="flex-1 flex flex-col items-center justify-center p-4">
              <Dropzone
                onFilesSelected={handleAddFiles}
                onSampleSelected={(file) => handleAddFiles([file])}
                isLoadingSample={isProcessing}
              />
            </main>
          ) : (
        /* When Queue has Images: Show Workbench */
        <main className="flex-1 flex flex-col">
          {/* Tool Selector Bar */}
          <ToolNavigation
            activeTool={activeTool}
            onSelectTool={setActiveTool}
            queueCount={queue.length}
          />

          {/* Workbench Split Workspace */}
          <div className="flex-1 max-w-7xl w-full mx-auto p-4 flex flex-col lg:flex-row gap-5">
            {/* Left Area: Interactive Preview & Bottom Action Bar */}
            <div className="flex-1 flex flex-col gap-4 min-h-[500px]">
              <PreviewViewport
                activeImage={activeImage}
                activeTool={activeTool}
                cropSettings={cropSettings}
                onCropChange={setCropSettings}
                passportSettings={passportSettings}
                onPickColor={(hex) => addToast('Picked Color', hex)}
              />

              <ActionBar
                activeImage={activeImage}
                activeTool={activeTool}
                queueCount={queue.length}
                onDownloadSingle={handleDownloadSingle}
                onDownloadZip={handleDownloadZip}
                onExportPdf={handleExportPdf}
                onResetOriginal={handleResetOriginal}
                onToast={addToast}
                isProcessing={isProcessing}
              />
            </div>

            {/* Right Area: Tool Control Panel */}
            <div className="w-full lg:w-96 shrink-0 flex flex-col">
              <div className="bg-white dark:bg-[#111827] border border-[#CBD5E1] dark:border-[#334155] rounded-2xl shadow-xs p-5 sticky top-24 transition-colors">
                <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0] dark:border-[#334155] mb-4">
                  <h2 className="text-xs font-bold text-[#0F172A] dark:text-[#F8FAFC] uppercase tracking-wider">
                    {activeTool === 'compress' && 'Image Compression'}
                    {activeTool === 'resize' && 'Resolution Resize'}
                    {activeTool === 'convert' && 'Format Conversion'}
                    {activeTool === 'crop' && 'Crop & Aspect Framing'}
                    {activeTool === 'rotate' && 'Rotate & Orientation'}
                    {activeTool === 'metadata' && 'EXIF Privacy Inspector'}
                    {activeTool === 'palette' && 'Color Palette Extraction'}
                    {activeTool === 'beautify' && 'Screenshot Beautifier'}
                    {activeTool === 'passport' && 'Passport & Visa Photo'}
                    {activeTool === 'batch' && 'Batch Processing Studio'}
                  </h2>
                </div>

                {/* Render corresponding panel */}
                {activeTool === 'compress' && (
                  <CompressPanel
                    settings={compressSettings}
                    onChange={setCompressSettings}
                    onApply={handleApplyCompress}
                    isProcessing={isProcessing}
                  />
                )}

                {activeTool === 'resize' && (
                  <ResizePanel
                    settings={resizeSettings}
                    activeImage={activeImage}
                    onChange={setResizeSettings}
                    onApply={handleApplyResize}
                    isProcessing={isProcessing}
                  />
                )}

                {activeTool === 'convert' && (
                  <ConvertPanel
                    settings={convertSettings}
                    onChange={setConvertSettings}
                    onApply={handleApplyConvert}
                    isProcessing={isProcessing}
                  />
                )}

                {activeTool === 'crop' && (
                  <CropPanel
                    settings={cropSettings}
                    activeImage={activeImage}
                    onChange={setCropSettings}
                    onApply={handleApplyCrop}
                    isProcessing={isProcessing}
                  />
                )}

                {activeTool === 'rotate' && (
                  <RotatePanel
                    settings={rotateSettings}
                    onChange={setRotateSettings}
                    onApply={handleApplyRotate}
                    isProcessing={isProcessing}
                  />
                )}

                {activeTool === 'metadata' && (
                  <MetadataPanel
                    activeImage={activeImage}
                    onStripMetadata={handleStripMetadata}
                    isProcessing={isProcessing}
                  />
                )}

                {activeTool === 'palette' && (
                  <PalettePanel
                    activeImage={activeImage}
                    colors={extractedColors}
                    onExtractColors={handleExtractColors}
                    onToast={addToast}
                  />
                )}

                {activeTool === 'beautify' && (
                  <BeautifyPanel
                    settings={beautifySettings}
                    onChange={setBeautifySettings}
                    onApply={handleApplyBeautify}
                    isProcessing={isProcessing}
                  />
                )}

                {activeTool === 'passport' && (
                  <PassportPanel
                    settings={passportSettings}
                    onChange={setPassportSettings}
                    onApply={handleApplyPassport}
                    isProcessing={isProcessing}
                  />
                )}

                {activeTool === 'batch' && (
                  <BatchPanel
                    queue={queue}
                    onBatchCompress={handleBatchCompress}
                    onBatchConvert={handleBatchConvert}
                    onBatchResize={handleBatchResize}
                    onBatchStripMetadata={handleBatchStripMetadata}
                    onDownloadZip={handleDownloadZip}
                    isProcessing={isProcessing}
                    onClearQueue={handleClearWorkspace}
                  />
                )}
              </div>
            </div>
          </div>
        </main>
      )}

      {/* Bottom Queue Strip (Only on Image Tools) */}
      {activeCategory === 'image-tools' && (
        <QueueTray
          queue={queue}
          activeId={activeId}
          onSelect={setActiveId}
          onRemove={handleRemoveQueueItem}
          onAddMore={() => {
            const input = document.createElement('input');
            input.type = 'file';
            input.multiple = true;
            input.accept = 'image/*';
            input.onchange = (e: any) => {
              if (e.target.files) handleAddFiles(Array.from(e.target.files));
            };
            input.click();
          }}
        />
      )}
    </>
  )}

      {/* Footer */}
      <Footer onOpenPrivacyInfo={() => setPrivacyModalOpen(true)} />

      {/* Modals & Toasts */}
      <PrivacyBanner
        isOpen={privacyModalOpen}
        onClose={() => setPrivacyModalOpen(false)}
      />

      <KeyboardShortcutsModal
        isOpen={shortcutsModalOpen}
        onClose={() => setShortcutsModalOpen(false)}
      />

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

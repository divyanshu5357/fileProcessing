'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  UploadCloud,
  Minimize2,
  Download,
  Trash2,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  FileArchive,
  ArrowRight,
} from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/Button';
import { PrivacyBanner } from '@/components/PrivacyBanner';
import { KeyboardShortcutsModal } from '@/components/KeyboardShortcutsModal';
import { GuestQuotaBanner } from '@/components/common/GuestQuotaBanner';
import { useGuestProductQuota } from '@/hooks/useGuestProductQuota';
import { compressImage } from '@/lib/imageProcessing';
import { requestDownloadAllowance, DownloadAllowanceResult } from '@/lib/downloadQuotaClient';
import { DownloadLimitModal } from '@/components/common/DownloadLimitModal';
import { calculateSavings, createZip, downloadBlob, formatBytes } from '@/lib/utils';
import {
  ImageCompressControls,
  ImageCompressControlState,
  normalizeImageCompressSettings,
} from './ImageCompressControls';
import { fileTransferService } from '@/lib/fileTransferService';
import { MainCategory } from '@/types/document';

interface ReducedImageEntry {
  id: string;
  file: File;
  originalSize: number;
  originalUrl: string;
  reducedBlob: Blob | null;
  reducedUrl: string | null;
  reducedSize: number | null;
  width: number | null;
  height: number | null;
  outputExt: string;
  error: string | null;
}

export function ImageSizeReducerClient({ children }: { children?: React.ReactNode }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const quota = useGuestProductQuota('compress-image');

  const [entries, setEntries] = useState<ReducedImageEntry[]>([]);
  const [settings, setSettings] = useState<ImageCompressControlState>(() =>
    normalizeImageCompressSettings({
      compressionMode: 'target_size',
      desiredSizeValue: 100,
      desiredSizeUnit: 'KB',
      percentage: 80,
      quality: 80,
      targetSizeKb: 100,
      maxDimension: 1920,
      format: 'image/jpeg',
    })
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [privacyModalOpen, setPrivacyModalOpen] = useState(false);
  const [shortcutsModalOpen, setShortcutsModalOpen] = useState(false);
  const [limitInfo, setLimitInfo] = useState<DownloadAllowanceResult | null>(null);
  const [pendingDownload, setPendingDownload] = useState<{ blob: Blob; filename: string } | null>(null);

  const handleSelectCategory = (category: MainCategory) => {
    if (category === 'image-tools') router.push('/image-tools');
    else if (category === 'pdf-tools') router.push('/pdf');
    else if (category === 'scan-studio') router.push('/scan-studio');
    else if (category === 'document-converter') router.push('/documents');
    else if (category === 'image-converter') router.push('/image-converter');
  };

  const toReducedEntry = (file: File): ReducedImageEntry => ({
    id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    file,
    originalSize: file.size,
    originalUrl: URL.createObjectURL(file),
    reducedBlob: null,
    reducedUrl: null,
    reducedSize: null,
    width: null,
    height: null,
    outputExt: 'jpg',
    error: null,
  });

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const pending = fileTransferService.consumePendingFile();
      if (!pending?.file || !pending.file.type.startsWith('image/')) return;
      const maxBytes = quota.memoryProfile.maxFileSizeMb * 1024 * 1024;
      if (pending.file.size > maxBytes) {
        setErrorBanner(
          `You can queue up to ${quota.memoryProfile.maxBatchFiles} files (${quota.memoryProfile.maxFileSizeMb} MB max per file).`
        );
        return;
      }
      setEntries((prev) => [...prev, toReducedEntry(pending.file)]);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [quota.memoryProfile.maxBatchFiles, quota.memoryProfile.maxFileSizeMb]);

  const addFiles = (incoming: FileList | File[]) => {
    const allowed = Array.from(incoming).filter((f) => f.type.startsWith('image/'));
    if (allowed.length === 0) {
      setErrorBanner('Please select valid JPG, JPEG, PNG, or WebP image files.');
      return;
    }

    const maxBytes = quota.memoryProfile.maxFileSizeMb * 1024 * 1024;
    const availableSlots = Math.max(0, quota.memoryProfile.maxBatchFiles - entries.length);
    const valid = allowed.filter((f) => f.size <= maxBytes).slice(0, availableSlots);

    if (valid.length < allowed.length) {
      setErrorBanner(
        `You can queue up to ${quota.memoryProfile.maxBatchFiles} files (${quota.memoryProfile.maxFileSizeMb} MB max per file).`
      );
    } else {
      setErrorBanner(null);
    }

    const mapped = valid.map(toReducedEntry);

    setEntries((prev) => [...prev, ...mapped]);
  };

  const handleCompressAll = async () => {
    if (entries.length === 0) return;

    setIsProcessing(true);
    setErrorBanner(null);

    const updated: ReducedImageEntry[] = [];
    for (const item of entries) {
      try {
        const res = await compressImage(item.file, settings);
        if (item.reducedUrl) URL.revokeObjectURL(item.reducedUrl);

        const chosenType =
          settings.format === 'original' ? item.file.type : settings.format;
        const outputExt = chosenType.includes('webp')
          ? 'webp'
          : chosenType.includes('png')
          ? 'png'
          : 'jpg';

        updated.push({
          ...item,
          reducedBlob: res.blob,
          reducedUrl: URL.createObjectURL(res.blob),
          reducedSize: res.size,
          width: res.width,
          height: res.height,
          outputExt,
          error: null,
        });
      } catch (err: unknown) {
        updated.push({
          ...item,
          error: err instanceof Error ? err.message : 'Compression failed',
        });
      }
    }

    setEntries(updated);
    setIsProcessing(false);
  };

  const handleClear = () => {
    entries.forEach((e) => {
      URL.revokeObjectURL(e.originalUrl);
      if (e.reducedUrl) URL.revokeObjectURL(e.reducedUrl);
    });
    setEntries([]);
    setErrorBanner(null);
  };

  const completedEntries = entries.filter((e) => e.reducedBlob !== null);

  const triggerCheckedDownload = async (blob: Blob, filename: string) => {
    const allowance = await requestDownloadAllowance('compress-image', blob.size);
    if (!allowance.allowed) {
      setPendingDownload({ blob, filename });
      setLimitInfo(allowance);
      return;
    }
    downloadBlob(blob, filename);
  };

  const handleDownloadZip = async () => {
    if (completedEntries.length === 0) return;
    const zipBlob = await createZip(
      completedEntries.map((e) => ({
        name: `${e.file.name.replace(/\.[^/.]+$/, '')}_${settings.targetSizeKb > 0 ? `${settings.targetSizeKb}kb` : 'reduced'}.${e.outputExt}`,
        blob: e.reducedBlob as Blob,
      }))
    );
    await triggerCheckedDownload(zipBlob, `reduced_images_${Date.now()}.zip`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] dark:bg-[#0F172A] text-[#0F172A] dark:text-[#F8FAFC] transition-colors">
      <Header
        activeCategory="image-converter"
        onSelectCategory={handleSelectCategory}
        onAddImages={() => fileInputRef.current?.click()}
        onClearWorkspace={handleClear}
        onOpenShortcuts={() => setShortcutsModalOpen(true)}
        onOpenPrivacyInfo={() => setPrivacyModalOpen(true)}
        queueLength={entries.length}
      />

      <main className="flex-1 flex flex-col">
        <div className="w-full max-w-5xl mx-auto px-4 py-8 flex flex-col gap-7">
          <GuestQuotaBanner quota={quota} productName="Image Size Reducer" />

          {/* Header Hero */}
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold shadow-xs">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>100% Client-Side Image Compressor • Zero Uploads</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-[#0F172A] dark:text-[#F8FAFC]">
              Image Size Reducer — Compress Photos to Exact KB &amp; MB
            </h1>
            <p className="text-sm sm:text-base text-[#334155] dark:text-[#CBD5E1] leading-relaxed">
              Reduce JPG, JPEG, PNG, and WebP image size to 20KB, 50KB, 100KB, or custom KB limits for forms, passports, emails, and websites. Need to merge photos into a PDF instead? Try{' '}
              <Link href="/pdf/jpg-to-pdf" className="text-[#2563EB] dark:text-[#60A5FA] font-semibold hover:underline">
                Image to PDF
              </Link>.
            </p>
          </div>

          {/* Controls Card */}
          <div className="p-6 rounded-2xl bg-white dark:bg-[#111827] border border-[#CBD5E1] dark:border-[#334155] shadow-xs">
            <ImageCompressControls settings={settings} onChange={setSettings} />
          </div>

          {errorBanner && (
            <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-xs font-semibold text-amber-800 dark:text-amber-200">
              {errorBanner}
            </div>
          )}

          {/* Dropzone */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
            }}
            onClick={() => fileInputRef.current?.click()}
            className="w-full p-10 border-2 border-dashed border-[#94A3B8] dark:border-[#475569] hover:border-[#2563EB] bg-white dark:bg-[#111827] rounded-3xl flex flex-col items-center text-center cursor-pointer transition shadow-xs"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => e.target.files && addFiles(e.target.files)}
              className="hidden"
            />
            <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-[#2563EB] dark:text-[#60A5FA] flex items-center justify-center mb-3 border border-blue-200 dark:border-blue-800">
              <UploadCloud className="w-7 h-7" />
            </div>
            <p className="text-base font-bold text-[#0F172A] dark:text-[#F8FAFC]">
              Drop JPG, PNG, or WebP images here — or click to browse
            </p>
            <p className="text-xs text-[#475569] dark:text-[#94A3B8] mt-1">
              Shrink photos privately in your browser with instant KB target control
            </p>
          </div>

          {/* Action Row & File List */}
          {entries.length > 0 && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="text-xs font-bold text-[#475569] dark:text-[#94A3B8]">
                  {entries.length} image(s) queued
                </span>
                <div className="flex flex-wrap items-center gap-2.5">
                  <Button variant="ghost" size="sm" onClick={handleClear} className="gap-1.5 text-xs">
                    <Trash2 className="w-3.5 h-3.5" /> Clear
                  </Button>
                  {completedEntries.length > 1 && (
                    <Button variant="secondary" size="sm" onClick={handleDownloadZip} className="gap-1.5 text-xs">
                      <FileArchive className="w-3.5 h-3.5" /> Download All (ZIP)
                    </Button>
                  )}
                  <Button
                    variant="primary"
                    size="lg"
                    isLoading={isProcessing}
                    onClick={handleCompressAll}
                    className="gap-2 font-bold"
                  >
                    <Minimize2 className="w-4 h-4" />
                    <span>Reduce Size Now</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {entries.map((entry) => {
                  const savings = entry.reducedSize
                    ? calculateSavings(entry.originalSize, entry.reducedSize)
                    : null;
                  return (
                    <div
                      key={entry.id}
                      className="p-4 rounded-2xl bg-white dark:bg-[#111827] border border-[#E2E8F0] dark:border-[#1E293B] flex items-center justify-between gap-4 shadow-xs"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* eslint-disable-next-line @next/next/no-img-element -- local ObjectURL blob preview */}
                        <img
                          src={entry.reducedUrl || entry.originalUrl}
                          alt={entry.file.name}
                          className="w-14 h-14 rounded-xl object-cover border border-[#E2E8F0] dark:border-[#334155] shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-bold truncate text-[#0F172A] dark:text-[#F8FAFC]">
                            {entry.file.name}
                          </p>
                          <p className="text-[11px] font-mono text-[#475569] dark:text-[#94A3B8]">
                            Before: {formatBytes(entry.originalSize)}
                            {entry.reducedSize !== null && (
                              <> &rarr; After: <strong className="text-emerald-600 dark:text-emerald-400">{formatBytes(entry.reducedSize)}</strong></>
                            )}
                          </p>
                          {savings && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 mt-0.5">
                              <CheckCircle2 className="w-3 h-3" /> {savings.text}
                            </span>
                          )}
                          {entry.error && (
                            <p className="text-[11px] text-rose-600 mt-0.5">{entry.error}</p>
                          )}
                        </div>
                      </div>

                      {entry.reducedBlob && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() =>
                            void triggerCheckedDownload(
                              entry.reducedBlob as Blob,
                              `${entry.file.name.replace(/\.[^/.]+$/, '')}_reduced.${entry.outputExt}`
                            )
                          }
                          className="shrink-0 gap-1.5 text-xs"
                        >
                          <Download className="w-3.5 h-3.5" /> Save
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Cross-link strip to full Image Studio */}
          <div className="p-4 rounded-2xl bg-[#EFF6FF] dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 font-medium text-[#1E3A8A] dark:text-blue-200">
              <Sparkles className="w-4 h-4 shrink-0" />
              <span>Need passport photo sheets, pixel crop, horizon level, or EXIF metadata removal?</span>
            </div>
            <Link
              href="/image-tools"
              className="font-bold text-[#2563EB] dark:text-[#60A5FA] hover:underline shrink-0"
            >
              Open Full Image Studio &rarr;
            </Link>
          </div>
        </div>

        {/* SSR SEO Content Slot */}
        {children}
      </main>

      <Footer />
      <PrivacyBanner isOpen={privacyModalOpen} onClose={() => setPrivacyModalOpen(false)} />
      <KeyboardShortcutsModal onClose={() => setShortcutsModalOpen(false)} isOpen={shortcutsModalOpen} />
      <DownloadLimitModal
        isOpen={Boolean(limitInfo)}
        onClose={() => {
          setLimitInfo(null);
          setPendingDownload(null);
        }}
        limitInfo={limitInfo}
        onUpgradeSuccess={() => {
          const pending = pendingDownload;
          setLimitInfo(null);
          setPendingDownload(null);
          if (pending) downloadBlob(pending.blob, pending.filename);
        }}
      />
    </div>
  );
}

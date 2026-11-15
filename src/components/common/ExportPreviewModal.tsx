'use client';

import React, { useState, useEffect } from 'react';
import {
  Download,
  Folder,
  Check,
  X,
  Eye,
  FileText,
  Image as ImageIcon,
  HardDrive,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { formatBytes, downloadBlob } from '@/lib/utils';
import { PdfPreviewer } from '@/components/common/PdfPreviewer';

export interface ExportPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  blob: Blob | null;
  defaultFilename: string;
  title?: string;
  fileType?: 'pdf' | 'image' | 'generic';
  previewImageUrl?: string | null;
  metadata?: {
    pageCount?: number;
    width?: number;
    height?: number;
  };
  onSaveComplete?: (savedFilename: string) => void;
}

export function ExportPreviewModal({
  isOpen,
  onClose,
  blob,
  defaultFilename,
  title = 'Export & Download Preview',
  fileType = 'pdf',
  previewImageUrl = null,
  metadata,
  onSaveComplete,
}: ExportPreviewModalProps) {
  const [filename, setFilename] = useState(defaultFilename);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Word (.docx) HTML preview state
  const [docxHtml, setDocxHtml] = useState<string | null>(null);
  const [isDocxLoading, setIsDocxLoading] = useState<boolean>(false);

  const isPdf =
    fileType === 'pdf' ||
    blob?.type === 'application/pdf' ||
    defaultFilename.toLowerCase().endsWith('.pdf');

  const isDocx =
    defaultFilename.toLowerCase().endsWith('.docx') ||
    defaultFilename.toLowerCase().endsWith('.doc') ||
    blob?.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

  const isImage = fileType === 'image' || (blob?.type && blob.type.startsWith('image/'));

  // Sync defaultFilename when opened
  useEffect(() => {
    if (isOpen) {
      setFilename(defaultFilename);
      setSaveSuccess(null);
      setErrorMessage(null);
    }
  }, [isOpen, defaultFilename]);

  // Create & revoke object URL for preview
  useEffect(() => {
    if (blob) {
      const url = URL.createObjectURL(blob);
      setBlobUrl(url);
      return () => {
        URL.revokeObjectURL(url);
      };
    } else {
      setBlobUrl(null);
    }
  }, [blob]);

  // If file is DOCX, convert to rich HTML using mammoth for live document preview
  useEffect(() => {
    if (isOpen && blob && isDocx) {
      setIsDocxLoading(true);
      blob
        .arrayBuffer()
        .then(async (buffer) => {
          try {
            const mammoth = await import('mammoth');
            const result = await mammoth.convertToHtml({ arrayBuffer: buffer });
            setDocxHtml(result.value || '<p>Document converted successfully.</p>');
          } catch (err) {
            console.warn('Could not extract DOCX HTML preview:', err);
            setDocxHtml('<p class="text-slate-500">Microsoft Word (.docx) document ready for download.</p>');
          } finally {
            setIsDocxLoading(false);
          }
        })
        .catch(() => {
          setIsDocxLoading(false);
        });
    } else {
      setDocxHtml(null);
    }
  }, [isOpen, blob, isDocx]);

  if (!isOpen || !blob) return null;

  // Ensure filename has proper extension
  const getSanitizedFilename = () => {
    let clean = filename.trim();
    if (!clean) clean = defaultFilename;

    const extMatch = defaultFilename.match(/\.[0-9a-z]+$/i);
    const expectedExt = extMatch ? extMatch[0].toLowerCase() : '';

    if (expectedExt && !clean.toLowerCase().endsWith(expectedExt)) {
      clean += expectedExt;
    }
    return clean;
  };

  // 1. Native File System Access API: lets user choose the EXACT local folder and filename
  const handleSaveToLocalFolder = async () => {
    setIsSaving(true);
    setErrorMessage(null);
    const targetFilename = getSanitizedFilename();

    try {
      if (typeof window !== 'undefined' && 'showSaveFilePicker' in window) {
        const extMatch = targetFilename.match(/\.([0-9a-z]+)$/i);
        const ext = extMatch ? extMatch[1].toLowerCase() : 'pdf';

        const mimeTypes: Record<string, string> = {
          pdf: 'application/pdf',
          docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          jpg: 'image/jpeg',
          jpeg: 'image/jpeg',
          png: 'image/png',
          webp: 'image/webp',
          zip: 'application/zip',
          txt: 'text/plain',
        };

        const fileHandle = await (window as any).showSaveFilePicker({
          suggestedName: targetFilename,
          types: [
            {
              description: `${ext.toUpperCase()} Document`,
              accept: {
                [blob.type || mimeTypes[ext] || 'application/octet-stream']: [`.${ext}`],
              },
            },
          ],
        });

        const writable = await fileHandle.createWritable();
        await writable.write(blob);
        await writable.close();

        setSaveSuccess(`File saved successfully to local directory as "${targetFilename}"`);
        if (onSaveComplete) onSaveComplete(targetFilename);
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        downloadBlob(blob, targetFilename);
        setSaveSuccess(`File downloaded to your device as "${targetFilename}"`);
        if (onSaveComplete) onSaveComplete(targetFilename);
        setTimeout(() => {
          onClose();
        }, 1500);
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setIsSaving(false);
        return;
      }
      console.warn('Folder save fallback:', err);
      downloadBlob(blob, targetFilename);
      setSaveSuccess(`Downloaded as "${targetFilename}"`);
      if (onSaveComplete) onSaveComplete(targetFilename);
      setTimeout(() => {
        onClose();
      }, 1500);
    } finally {
      setIsSaving(false);
    }
  };

  // 2. Standard Download to Downloads folder
  const handleStandardDownload = () => {
    const targetFilename = getSanitizedFilename();
    downloadBlob(blob, targetFilename);
    setSaveSuccess(`File downloaded as "${targetFilename}"`);
    if (onSaveComplete) onSaveComplete(targetFilename);
    setTimeout(() => {
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-150">
      <div
        className="bg-white dark:bg-[#111827] rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
              {isPdf ? <FileText className="w-5 h-5" /> : isImage ? <ImageIcon className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                {title}
              </h3>
              <p className="text-xs text-slate-500">
                Inspect preview, adjust filename, and select your local destination folder
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* 1. Visual Preview Frame */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
              <span className="flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-blue-600" />
                Document Preview
              </span>
              <span className="font-mono text-slate-500">
                Size: {formatBytes(blob.size)}
                {metadata?.pageCount ? ` • ${metadata.pageCount} page(s)` : ''}
                {metadata?.width && metadata?.height ? ` • ${metadata.width}×${metadata.height}px` : ''}
              </span>
            </div>

            {/* If it's a PDF: Use our rock-solid PdfPreviewer */}
            {isPdf ? (
              <PdfPreviewer file={blob} maxHeight="340px" />
            ) : isDocx ? (
              /* If it's a Word DOCX file: Render rich Word document preview */
              <div className="w-full h-72 sm:h-80 bg-[#12141a] rounded-2xl border border-slate-800 flex flex-col overflow-hidden relative shadow-inner p-3">
                <div className="flex items-center justify-between text-[11px] text-slate-400 pb-2 border-b border-slate-800">
                  <span className="font-semibold text-emerald-400">Microsoft Word (.docx) Preview</span>
                  <span className="font-mono">Editable Layout Extracted</span>
                </div>
                <div className="flex-1 overflow-y-auto mt-2 p-4 bg-white text-slate-900 rounded-xl shadow-md font-serif text-xs leading-relaxed">
                  {isDocxLoading ? (
                    <div className="flex items-center justify-center h-full gap-2 text-slate-500">
                      <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
                      <span>Rendering Word document preview...</span>
                    </div>
                  ) : docxHtml ? (
                    <div
                      className="space-y-2 [&_h1]:text-base [&_h1]:font-bold [&_h2]:text-sm [&_h2]:font-bold [&_table]:w-full [&_table]:border-collapse [&_td]:p-1.5 [&_td]:align-top [&_strong]:font-bold"
                      dangerouslySetInnerHTML={{ __html: docxHtml }}
                    />
                  ) : (
                    <div className="text-center text-slate-500 py-10">
                      <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>Word document ready for download</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (isImage || previewImageUrl) && (blobUrl || previewImageUrl) ? (
              <div className="w-full h-64 sm:h-72 bg-[#0c0d12] rounded-2xl border border-slate-800 flex items-center justify-center overflow-hidden relative shadow-inner p-3">
                <img
                  src={previewImageUrl || blobUrl!}
                  alt="Preview"
                  className="max-w-full max-h-full object-contain rounded-lg shadow-xl"
                />
              </div>
            ) : (
              <div className="w-full h-44 bg-[#0c0d12] rounded-2xl border border-slate-800 flex flex-col items-center justify-center text-center p-4">
                <FileText className="w-10 h-10 text-slate-400 mb-2 opacity-60" />
                <span className="text-xs text-slate-300 font-bold">{getSanitizedFilename()}</span>
                <span className="text-[11px] text-slate-500 mt-1">Ready for export ({formatBytes(blob.size)})</span>
              </div>
            )}
          </div>

          {/* 2. File Name Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
              Save File Name
            </label>
            <div className="relative">
              <input
                type="text"
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
                placeholder="Enter filename..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <p className="text-[11px] text-slate-500">
              You can customize the filename before writing to your computer.
            </p>
          </div>

          {/* 3. Destination Folder Selector Info */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
              <HardDrive className="w-4 h-4 text-emerald-600" />
              <span>Save Location Options</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Click <strong>&quot;Choose Local Folder &amp; Save&quot;</strong> to open your operating system&apos;s file save dialog and place the file in any specific local directory (e.g. Documents, Desktop, Worksheets). Or click <strong>&quot;Download&quot;</strong> to instantly save to your default Downloads folder.
            </p>
          </div>

          {/* Success Banner */}
          {saveSuccess && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center gap-2 text-xs text-emerald-800 dark:text-emerald-200 animate-in fade-in">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-semibold">{saveSuccess}</span>
            </div>
          )}

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 flex items-center gap-2 text-xs text-rose-800 dark:text-rose-200">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-xs text-slate-600 dark:text-slate-400 order-2 sm:order-1 cursor-pointer"
          >
            Cancel
          </Button>

          <div className="flex items-center gap-2 w-full sm:w-auto order-1 sm:order-2">
            <Button
              variant="outline"
              size="md"
              onClick={handleStandardDownload}
              disabled={isSaving}
              className="flex-1 sm:flex-none text-xs font-bold flex items-center justify-center gap-1.5 py-2 px-3 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download</span>
            </Button>

            <Button
              variant="primary"
              size="md"
              onClick={handleSaveToLocalFolder}
              disabled={isSaving}
              className="flex-1 sm:flex-none text-xs font-bold flex items-center justify-center gap-2 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white shadow-md cursor-pointer"
            >
              <Folder className="w-4 h-4 text-blue-200" />
              <span>{isSaving ? 'Saving...' : 'Choose Local Folder & Save'}</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

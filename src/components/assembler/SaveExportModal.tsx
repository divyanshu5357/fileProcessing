'use client';

import React, { useState } from 'react';
import {
  X,
  Download,
  Cloud,
  HardDrive,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileText,
  Merge,
  GitCompare,
  Layers,
  Sparkles,
  Archive,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { fileManagerService } from '@/lib/fileManagerService';
import {
  AssemblerDocument,
  AssemblerPage,
  ExportMode,
} from '@/types/pdfAssembler';
import {
  compilePagesToPdf,
  mergeDocuments,
  mergeDocumentsAlternately,
} from '@/lib/pdfAssemblerEngine';
import { createZip, downloadBlob } from '@/lib/utils';

interface SaveExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  documents: AssemblerDocument[];
}

export function SaveExportModal({
  isOpen,
  onClose,
  documents,
}: SaveExportModalProps) {
  const { isAuthenticated, user, openAuthModal } = useAuth();

  const selectedDocs = documents.filter((d) => d.selected);
  const allSelectedPages = documents.flatMap((d) => d.pages.filter((p) => p.selected));

  // Default mode selection
  const [exportMode, setExportMode] = useState<ExportMode>('merge-selected');
  const [customFileName, setCustomFileName] = useState('PixelKit_Assembled_Document.pdf');
  const [destination, setDestination] = useState<'local' | 'cloud'>('local');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleExport = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsProcessing(true);
    setProgress(20);

    try {
      let finalBlob: Blob | null = null;
      let finalName = customFileName.trim();
      if (!finalName.toLowerCase().endsWith('.pdf') && !finalName.toLowerCase().endsWith('.zip')) {
        finalName += '.pdf';
      }

      if (exportMode === 'merge-selected') {
        const docsToMerge = selectedDocs.length > 0 ? selectedDocs : documents;
        if (docsToMerge.length === 0) {
          throw new Error('No documents available to merge.');
        }
        setProgress(45);
        finalBlob = await mergeDocuments(docsToMerge);
      } else if (exportMode === 'merge-alternately') {
        const docsToMerge = selectedDocs.length > 1 ? selectedDocs : documents;
        if (docsToMerge.length < 2) {
          throw new Error('Please select at least 2 documents to merge alternately.');
        }
        setProgress(45);
        finalBlob = await mergeDocumentsAlternately(docsToMerge);
      } else if (exportMode === 'selected-pages') {
        if (allSelectedPages.length === 0) {
          throw new Error('Please select at least one page across your documents.');
        }
        setProgress(45);
        finalBlob = await compilePagesToPdf(allSelectedPages);
      } else if (exportMode === 'active-document') {
        const docToExport = selectedDocs[0] || documents[0];
        if (!docToExport || docToExport.pages.length === 0) {
          throw new Error('No pages found in the active document.');
        }
        setProgress(45);
        finalBlob = await compilePagesToPdf(docToExport.pages);
      } else if (exportMode === 'all-separate') {
        setProgress(35);
        const filesToZip: { name: string; blob: Blob }[] = [];
        for (let i = 0; i < documents.length; i++) {
          const doc = documents[i];
          if (doc.pages.length > 0) {
            const blob = await compilePagesToPdf(doc.pages);
            const safeName = doc.name.toLowerCase().endsWith('.pdf') ? doc.name : `${doc.name}.pdf`;
            filesToZip.push({ name: safeName, blob });
          }
        }
        setProgress(70);
        finalBlob = await createZip(filesToZip);
        if (!finalName.toLowerCase().endsWith('.zip')) {
          finalName = finalName.replace(/\.pdf$/i, '') + '.zip';
        }
      }

      setProgress(85);

      if (!finalBlob) {
        throw new Error('Failed to compile output document.');
      }

      // Check destination
      if (destination === 'cloud') {
        if (!isAuthenticated) {
          openAuthModal();
          throw new Error('Please sign in to upload to your private S3 cloud storage.');
        }
        const cloudFile = new File([finalBlob], finalName, { type: finalBlob.type });
        await fileManagerService.uploadFile(cloudFile);
        setProgress(100);
        setSuccessMsg(`Document saved to your private S3 storage: ${finalName}`);
      } else {
        // Direct local download
        downloadBlob(finalBlob, finalName);
        setProgress(100);
        setSuccessMsg(`Document exported successfully: ${finalName}`);
      }
    } catch (err: any) {
      console.error('Export error:', err);
      setErrorMsg(err?.message || 'An error occurred during export.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-lg bg-white dark:bg-[#111827] border border-[#CBD5E1] dark:border-[#334155] rounded-3xl shadow-2xl p-6 sm:p-7 relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
            <Download className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-slate-100">
              Save & Export Assembled Document
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Select how to compile and download your assembled PDF pages.
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Success Alert */}
        {successMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleExport} className="space-y-4">
          {/* Export Mode Radios */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Export Action
            </label>
            <div className="space-y-1.5 text-xs">
              {/* Option 1: Merge Selected */}
              <label
                className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition ${
                  exportMode === 'merge-selected'
                    ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/30 text-blue-900 dark:text-blue-200'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="exportMode"
                  checked={exportMode === 'merge-selected'}
                  onChange={() => setExportMode('merge-selected')}
                  className="mt-0.5 text-blue-600"
                />
                <div>
                  <span className="font-bold flex items-center gap-1.5">
                    <Merge className="w-3.5 h-3.5 text-blue-600" />
                    Merge selected documents into one PDF
                  </span>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                    Combines all pages of selected documents in sequential order ({selectedDocs.length > 0 ? selectedDocs.length : documents.length} documents).
                  </p>
                </div>
              </label>

              {/* Option 2: Merge Alternately */}
              <label
                className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition ${
                  exportMode === 'merge-alternately'
                    ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/30 text-blue-900 dark:text-blue-200'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="exportMode"
                  checked={exportMode === 'merge-alternately'}
                  onChange={() => setExportMode('merge-alternately')}
                  className="mt-0.5 text-blue-600"
                />
                <div>
                  <span className="font-bold flex items-center gap-1.5">
                    <GitCompare className="w-3.5 h-3.5 text-purple-600" />
                    Merge alternately (interleave pages)
                  </span>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                    Interleaves pages alternately from documents: A1, B1, A2, B2, A3... Ideal for front/back scans.
                  </p>
                </div>
              </label>

              {/* Option 3: Export Selected Pages */}
              <label
                className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition ${
                  exportMode === 'selected-pages'
                    ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/30 text-blue-900 dark:text-blue-200'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="exportMode"
                  checked={exportMode === 'selected-pages'}
                  onChange={() => setExportMode('selected-pages')}
                  className="mt-0.5 text-blue-600"
                />
                <div>
                  <span className="font-bold flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-emerald-600" />
                    Export only selected pages ({allSelectedPages.length} selected)
                  </span>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                    Generates a new PDF containing only the pages currently checked in your workspace.
                  </p>
                </div>
              </label>

              {/* Option 4: Save All Separately (ZIP) */}
              <label
                className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition ${
                  exportMode === 'all-separate'
                    ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/30 text-blue-900 dark:text-blue-200'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="exportMode"
                  checked={exportMode === 'all-separate'}
                  onChange={() => setExportMode('all-separate')}
                  className="mt-0.5 text-blue-600"
                />
                <div>
                  <span className="font-bold flex items-center gap-1.5">
                    <Archive className="w-3.5 h-3.5 text-amber-600" />
                    Save all documents separately (ZIP package)
                  </span>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                    Exports each document section as an individual PDF bundled in a ZIP archive.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Filename Input */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Output Filename
            </label>
            <input
              type="text"
              required
              value={customFileName}
              onChange={(e) => setCustomFileName(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#0B1120] text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            />
          </div>

          {/* Destination Selector: Local vs Cloud S3 */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Destination
            </label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setDestination('local')}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl border font-bold transition ${
                  destination === 'local'
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-600'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                }`}
              >
                <HardDrive className="w-4 h-4" />
                <span>Local Download</span>
              </button>

              <button
                type="button"
                onClick={() => setDestination('cloud')}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl border font-bold transition ${
                  destination === 'cloud'
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-600'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                }`}
              >
                <Cloud className="w-4 h-4" />
                <span>Save to Cloud S3</span>
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          {isProcessing && (
            <div className="space-y-1 pt-1">
              <div className="flex justify-between text-[11px] font-mono font-bold text-blue-600">
                <span>Compiling vector PDF pages...</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full transition-all duration-200"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={isProcessing}
              onClick={onClose}
              className="text-xs"
            >
              Cancel
            </Button>

            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isProcessing}
              className="text-xs font-bold px-4"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                  <span>Processing PDF...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-1.5" />
                  <span>{destination === 'cloud' ? 'Save to S3' : 'Download PDF'}</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

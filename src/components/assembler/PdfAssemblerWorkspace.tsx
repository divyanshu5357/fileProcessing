'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  FilePlus,
  Plus,
  Merge,
  GitCompare,
  UploadCloud,
  Layers,
  Sparkles,
  ArrowLeft,
  Loader2,
  FileText,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import {
  AssemblerDocument,
  AssemblerPage,
  AssemblerHistorySnapshot,
} from '@/types/pdfAssembler';
import {
  loadFileToAssembler,
  createEmptyAssemblerDocument,
  generateAssemblerId,
} from '@/lib/pdfAssemblerEngine';
import { AssemblerToolbar } from './AssemblerToolbar';
import { DocumentSection } from './DocumentSection';
import { SaveExportModal } from './SaveExportModal';

interface PdfAssemblerWorkspaceProps {
  onBackToTools?: () => void;
}

export function PdfAssemblerWorkspace({
  onBackToTools,
}: PdfAssemblerWorkspaceProps) {
  const [documents, setDocuments] = useState<AssemblerDocument[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState('');
  const [zoomScale, setZoomScale] = useState(1.0);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);

  // Drag and Drop State
  const [dragSource, setDragSource] = useState<{
    docId: string;
    pageId: string;
    pageIndex: number;
  } | null>(null);
  const [dragTargetDocId, setDragTargetDocId] = useState<string | null>(null);
  const [dragTargetPageIndex, setDragTargetPageIndex] = useState<number | null>(null);

  // Undo / Redo History
  const [history, setHistory] = useState<AssemblerHistorySnapshot[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const saveSnapshot = useCallback(
    (newDocs: AssemblerDocument[]) => {
      const snapshot: AssemblerHistorySnapshot = {
        documents: JSON.parse(JSON.stringify(newDocs)),
      };
      setHistory((prev) => [...prev.slice(0, historyIndex + 1), snapshot]);
      setHistoryIndex((prev) => prev + 1);
    },
    [historyIndex]
  );

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevSnapshot = history[historyIndex - 1];
      setDocuments(JSON.parse(JSON.stringify(prevSnapshot.documents)));
      setHistoryIndex((idx) => idx - 1);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextSnapshot = history[historyIndex + 1];
      setDocuments(JSON.parse(JSON.stringify(nextSnapshot.documents)));
      setHistoryIndex((idx) => idx + 1);
    }
  };

  // Keyboard Shortcuts for Undo/Redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        if (e.shiftKey) {
          e.preventDefault();
          handleRedo();
        } else {
          e.preventDefault();
          handleUndo();
        }
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'y') {
        e.preventDefault();
        handleRedo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [historyIndex, history]);

  // Load sample PDFs for demonstration
  const handleLoadSampleDocuments = async () => {
    setIsLoading(true);
    setLoadingStatus('Loading demo multi-document PDFs...');
    try {
      const res = await fetch('/test-sample.pdf');
      const blob = await res.blob();
      const sampleFile1 = new File([blob], 'Document_A_Financials.pdf', {
        type: 'application/pdf',
      });
      const sampleFile2 = new File([blob], 'Document_B_Addendum.pdf', {
        type: 'application/pdf',
      });

      const docA = await loadFileToAssembler(sampleFile1);
      const docB = await loadFileToAssembler(sampleFile2);

      const newDocs = [docA, docB];
      setDocuments(newDocs);
      saveSnapshot(newDocs);
    } catch (err: any) {
      console.error('Failed to load sample docs:', err);
    } finally {
      setIsLoading(false);
      setLoadingStatus('');
    }
  };

  // Add Files (PDFs or Images)
  const handleAddFiles = async (files: File[]) => {
    if (files.length === 0) return;
    setIsLoading(true);

    try {
      const loadedDocs: AssemblerDocument[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setLoadingStatus(`Parsing file ${i + 1} of ${files.length}: ${file.name}...`);
        const doc = await loadFileToAssembler(file, (p, msg) => {
          setLoadingStatus(msg);
        });
        loadedDocs.push(doc);
      }

      const updated = [...documents, ...loadedDocs];
      setDocuments(updated);
      saveSnapshot(updated);
    } catch (err: any) {
      console.error('Error adding files to assembler:', err);
      alert('Failed to process some files: ' + err.message);
    } finally {
      setIsLoading(false);
      setLoadingStatus('');
    }
  };

  // New Empty Document Container
  const handleNewDocument = () => {
    const newDoc = createEmptyAssemblerDocument(
      `Document_${documents.length + 1}_Custom.pdf`
    );
    const updated = [...documents, newDoc];
    setDocuments(updated);
    saveSnapshot(updated);
  };

  // Document-Level Actions
  const handleToggleSelectDoc = (docId: string) => {
    setDocuments((prev) =>
      prev.map((d) => (d.id === docId ? { ...d, selected: !d.selected } : d))
    );
  };

  const handleRenameDoc = (docId: string, newName: string) => {
    const updated = documents.map((d) =>
      d.id === docId ? { ...d, name: newName, isModified: true } : d
    );
    setDocuments(updated);
    saveSnapshot(updated);
  };

  const handleToggleCollapseDoc = (docId: string) => {
    setDocuments((prev) =>
      prev.map((d) => (d.id === docId ? { ...d, isCollapsed: !d.isCollapsed } : d))
    );
  };

  const handleDeleteDoc = (docId: string) => {
    const doc = documents.find((d) => d.id === docId);
    if (!doc) return;
    if (confirm(`Are you sure you want to remove "${doc.name}" from workspace?`)) {
      const updated = documents.filter((d) => d.id !== docId);
      setDocuments(updated);
      saveSnapshot(updated);
    }
  };

  const handleDuplicateDoc = (docId: string) => {
    const doc = documents.find((d) => d.id === docId);
    if (!doc) return;

    const clonedPages: AssemblerPage[] = doc.pages.map((p) => ({
      ...p,
      id: generateAssemblerId('page'),
    }));

    const clonedDoc: AssemblerDocument = {
      ...doc,
      id: generateAssemblerId('doc'),
      name: `${doc.name.replace(/\.pdf$/i, '')}_Copy.pdf`,
      pages: clonedPages,
      createdAt: Date.now(),
    };

    const docIndex = documents.findIndex((d) => d.id === docId);
    const updated = [...documents];
    updated.splice(docIndex + 1, 0, clonedDoc);
    setDocuments(updated);
    saveSnapshot(updated);
  };

  const handleMoveDocOrder = (docId: string, direction: 'up' | 'down') => {
    const idx = documents.findIndex((d) => d.id === docId);
    if (idx === -1) return;
    if (direction === 'up' && idx === 0) return;
    if (direction === 'down' && idx === documents.length - 1) return;

    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    const updated = [...documents];
    const [moved] = updated.splice(idx, 1);
    updated.splice(targetIdx, 0, moved);
    setDocuments(updated);
    saveSnapshot(updated);
  };

  const handleSelectAllPagesInDoc = (docId: string, selectAll: boolean) => {
    setDocuments((prev) =>
      prev.map((d) =>
        d.id === docId
          ? {
              ...d,
              pages: d.pages.map((p) => ({ ...p, selected: selectAll })),
            }
          : d
      )
    );
  };

  const handleRotateAllPagesInDoc = (docId: string, delta: number) => {
    const updated = documents.map((d) =>
      d.id === docId
        ? {
            ...d,
            pages: d.pages.map((p) => ({
              ...p,
              rotation: (p.rotation + delta + 360) % 360,
            })),
          }
        : d
    );
    setDocuments(updated);
    saveSnapshot(updated);
  };

  // Page-Level Actions
  const handleToggleSelectPage = (pageId: string) => {
    setDocuments((prev) =>
      prev.map((d) => ({
        ...d,
        pages: d.pages.map((p) =>
          p.id === pageId ? { ...p, selected: !p.selected } : p
        ),
      }))
    );
  };

  const handleRotatePage = (pageId: string, delta: number) => {
    const updated = documents.map((d) => ({
      ...d,
      pages: d.pages.map((p) =>
        p.id === pageId ? { ...p, rotation: (p.rotation + delta + 360) % 360 } : p
      ),
    }));
    setDocuments(updated);
    saveSnapshot(updated);
  };

  const handleDuplicatePage = (pageId: string) => {
    const updated = documents.map((d) => {
      const pIdx = d.pages.findIndex((p) => p.id === pageId);
      if (pIdx === -1) return d;
      const targetPage = d.pages[pIdx];
      const newPage: AssemblerPage = {
        ...targetPage,
        id: generateAssemblerId('page'),
      };
      const newPages = [...d.pages];
      newPages.splice(pIdx + 1, 0, newPage);
      return { ...d, pages: newPages };
    });
    setDocuments(updated);
    saveSnapshot(updated);
  };

  const handleDeletePage = (pageId: string) => {
    const updated = documents.map((d) => ({
      ...d,
      pages: d.pages.filter((p) => p.id !== pageId),
    }));
    setDocuments(updated);
    saveSnapshot(updated);
  };

  // Batch Page Actions on Selected Pages
  const handleRotateSelectedPages = (delta: number) => {
    const updated = documents.map((d) => ({
      ...d,
      pages: d.pages.map((p) =>
        p.selected ? { ...p, rotation: (p.rotation + delta + 360) % 360 } : p
      ),
    }));
    setDocuments(updated);
    saveSnapshot(updated);
  };

  const handleDuplicateSelectedPages = () => {
    const updated = documents.map((d) => {
      const newPages: AssemblerPage[] = [];
      for (const page of d.pages) {
        newPages.push(page);
        if (page.selected) {
          newPages.push({
            ...page,
            id: generateAssemblerId('page'),
            selected: false,
          });
        }
      }
      return { ...d, pages: newPages };
    });
    setDocuments(updated);
    saveSnapshot(updated);
  };

  const handleDeleteSelectedPages = () => {
    const count = documents.flatMap((d) => d.pages.filter((p) => p.selected)).length;
    if (count === 0) return;
    if (confirm(`Remove ${count} selected pages?`)) {
      const updated = documents.map((d) => ({
        ...d,
        pages: d.pages.filter((p) => !p.selected),
      }));
      setDocuments(updated);
      saveSnapshot(updated);
    }
  };

  const handleSelectAllPagesGlobal = (select: boolean) => {
    setDocuments((prev) =>
      prev.map((d) => ({
        ...d,
        pages: d.pages.map((p) => ({ ...p, selected: select })),
      }))
    );
  };

  // Drag and Drop Logic: Move pages within and BETWEEN documents
  const handlePageDragStart = (
    e: React.DragEvent,
    docId: string,
    pageId: string,
    pageIndex: number
  ) => {
    setDragSource({ docId, pageId, pageIndex });
    e.dataTransfer.setData('text/plain', JSON.stringify({ docId, pageId, pageIndex }));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handlePageDragOver = (
    e: React.DragEvent,
    docId: string,
    pageIndex: number
  ) => {
    e.preventDefault();
    setDragTargetDocId(docId);
    setDragTargetPageIndex(pageIndex);
  };

  const handlePageDrop = (
    e: React.DragEvent,
    targetDocId: string,
    targetPageIndex: number
  ) => {
    e.preventDefault();
    if (!dragSource) return;

    const { docId: sourceDocId, pageId } = dragSource;

    // Find the moving page from source document
    const sourceDoc = documents.find((d) => d.id === sourceDocId);
    if (!sourceDoc) return;
    const movingPage = sourceDoc.pages.find((p) => p.id === pageId);
    if (!movingPage) return;

    let updated = documents.map((d) => ({
      ...d,
      pages: [...d.pages],
    }));

    if (sourceDocId === targetDocId) {
      // Reorder within the same document
      const doc = updated.find((d) => d.id === targetDocId)!;
      const oldIdx = doc.pages.findIndex((p) => p.id === pageId);
      if (oldIdx !== -1) {
        doc.pages.splice(oldIdx, 1);
        const insertIdx = targetPageIndex > oldIdx ? targetPageIndex - 1 : targetPageIndex;
        doc.pages.splice(insertIdx, 0, movingPage);
      }
    } else {
      // Transfer across documents (from Document A into Document B)
      const src = updated.find((d) => d.id === sourceDocId)!;
      const dst = updated.find((d) => d.id === targetDocId)!;

      // Remove from source
      src.pages = src.pages.filter((p) => p.id !== pageId);
      // Insert into destination document at target index
      const insertIdx = Math.min(targetPageIndex, dst.pages.length);
      dst.pages.splice(insertIdx, 0, movingPage);
    }

    setDocuments(updated);
    saveSnapshot(updated);

    // Reset drag indicators
    setDragSource(null);
    setDragTargetDocId(null);
    setDragTargetPageIndex(null);
  };

  // Counts for Toolbar
  const totalSelectedDocs = documents.filter((d) => d.selected).length;
  const allPages = documents.flatMap((d) => d.pages);
  const totalSelectedPages = allPages.filter((p) => p.selected).length;
  const isAllPagesSelectedGlobal =
    allPages.length > 0 && totalSelectedPages === allPages.length;

  return (
    <div className="w-full flex-1 flex flex-col bg-[#F8FAFC] dark:bg-[#0F172A] min-h-[calc(100vh-64px)] selection:bg-[#2563EB] selection:text-white transition-colors">
      {/* Top Application Toolbar */}
      <AssemblerToolbar
        onAddFiles={handleAddFiles}
        onNewDocument={handleNewDocument}
        onMergeSelected={() => setIsSaveModalOpen(true)}
        onMergeAlternately={() => setIsSaveModalOpen(true)}
        onRotateSelectedPages={handleRotateSelectedPages}
        onDuplicateSelectedPages={handleDuplicateSelectedPages}
        onDeleteSelectedPages={handleDeleteSelectedPages}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onOpenSaveModal={() => setIsSaveModalOpen(true)}
        zoomScale={zoomScale}
        onZoomChange={setZoomScale}
        totalSelectedDocs={totalSelectedDocs}
        totalSelectedPages={totalSelectedPages}
        onSelectAllPagesGlobal={handleSelectAllPagesGlobal}
        isAllPagesSelectedGlobal={isAllPagesSelectedGlobal}
      />

      {/* Main Multi-Document Workspace Area */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Loading Overlay */}
        {isLoading && (
          <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-xs text-blue-900 dark:text-blue-200 flex items-center gap-3 animate-pulse shadow-xs">
            <Loader2 className="w-5 h-5 text-blue-600 animate-spin shrink-0" />
            <div className="font-semibold">{loadingStatus || 'Processing documents...'}</div>
          </div>
        )}

        {/* Empty State Hero Dropzone when no documents loaded */}
        {documents.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 max-w-3xl mx-auto my-12 animate-fade-in">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-[#2563EB] dark:text-[#60A5FA] text-xs font-bold mb-3 shadow-xs">
                <Sparkles className="w-3.5 h-3.5" />
                <span>PDF Assembler & Multi-Document Page Workspace</span>
              </div>
              <h1 className="text-3xl sm:text-5xl font-black text-[#0F172A] dark:text-[#F8FAFC] tracking-tight">
                Assemble, Merge & Rearrange PDFs
              </h1>
              <p className="text-sm text-[#334155] dark:text-[#CBD5E1] mt-2 max-w-xl mx-auto">
                Upload multiple PDF files or images. View every page as a thumbnail, reorder pages, move pages between documents, and merge into custom publications.
              </p>
            </div>

            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                  handleAddFiles(Array.from(e.dataTransfer.files));
                }
              }}
              className="w-full p-12 border-2 border-dashed border-[#CBD5E1] dark:border-[#334155] bg-white dark:bg-[#111827] rounded-3xl flex flex-col items-center justify-center text-center shadow-lg hover:border-[#2563EB] transition-all cursor-pointer"
              onClick={() => {
                const inp = document.createElement('input');
                inp.type = 'file';
                inp.multiple = true;
                inp.accept = '.pdf,application/pdf,image/png,image/jpeg,image/webp';
                inp.onchange = (e: any) => {
                  if (e.target.files && e.target.files.length > 0) {
                    handleAddFiles(Array.from(e.target.files));
                  }
                };
                inp.click();
              }}
            >
              <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-[#2563EB] dark:text-[#60A5FA] flex items-center justify-center mb-4 border border-blue-200 dark:border-blue-800 shadow-xs">
                <UploadCloud className="w-8 h-8" />
              </div>

              <h3 className="text-lg font-bold text-[#0F172A] dark:text-[#F8FAFC]">
                Choose Multiple PDF Documents or Images
              </h3>
              <p className="text-xs text-[#475569] dark:text-[#CBD5E1] mt-1 max-w-md">
                Drag and drop your PDF files here, or click to browse files from your computer.
              </p>

              <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                <span className="text-[11px] font-mono px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-semibold">
                  100% In-Browser • Zero Server Uploads
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLoadSampleDocuments();
                  }}
                  className="text-[11px] font-bold px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-[#2563EB] dark:text-[#60A5FA] border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition cursor-pointer flex items-center gap-1.5"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Load Sample Documents</span>
                </button>
              </div>
            </div>

            {onBackToTools && (
              <button
                type="button"
                onClick={onBackToTools}
                className="mt-6 flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-blue-600 transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to PDF Tools Hub</span>
              </button>
            )}
          </div>
        ) : (
          /* Multi-Document List */
          <div className="space-y-6 animate-fade-in">
            {/* Quick Status Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 px-1 text-xs text-slate-500 dark:text-slate-400 font-medium">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {documents.length} {documents.length === 1 ? 'Document' : 'Documents'}
                </span>
                <span>&bull;</span>
                <span>{allPages.length} Total Pages</span>
                {totalSelectedPages > 0 && (
                  <>
                    <span>&bull;</span>
                    <span className="font-bold text-blue-600 dark:text-blue-400">
                      {totalSelectedPages} Selected
                    </span>
                  </>
                )}
              </div>

              <div className="flex items-center gap-3 text-[11px]">
                <span className="flex items-center gap-1 text-slate-400">
                  <HelpCircle className="w-3 h-3" />
                  Drag thumbnails to move pages between documents
                </span>
              </div>
            </div>

            {/* Document Cards */}
            {documents.map((doc, docIndex) => (
              <DocumentSection
                key={doc.id}
                document={doc}
                docIndex={docIndex}
                totalDocs={documents.length}
                zoomScale={zoomScale}
                dragTargetDocId={dragTargetDocId}
                dragTargetPageIndex={dragTargetPageIndex}
                onToggleSelectDoc={handleToggleSelectDoc}
                onRenameDoc={handleRenameDoc}
                onToggleCollapseDoc={handleToggleCollapseDoc}
                onDeleteDoc={handleDeleteDoc}
                onDuplicateDoc={handleDuplicateDoc}
                onMoveDocOrder={handleMoveDocOrder}
                onSelectAllPagesInDoc={handleSelectAllPagesInDoc}
                onRotateAllPagesInDoc={handleRotateAllPagesInDoc}
                onToggleSelectPage={handleToggleSelectPage}
                onRotatePage={handleRotatePage}
                onDuplicatePage={handleDuplicatePage}
                onDeletePage={handleDeletePage}
                onPageDragStart={handlePageDragStart}
                onPageDragOver={handlePageDragOver}
                onPageDrop={handlePageDrop}
              />
            ))}
          </div>
        )}
      </div>

      {/* Save & Export Modal Dialog */}
      <SaveExportModal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        documents={documents}
      />
    </div>
  );
}

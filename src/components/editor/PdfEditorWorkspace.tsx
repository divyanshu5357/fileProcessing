'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
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
import {
  extractPdfDocumentModel,
  exportModifiedPdfDocument,
} from '@/lib/pdfEditorEngine';
import { TopToolbar } from './TopToolbar';
import { PageCanvasView } from './PageCanvasView';
import { SignatureModal } from './SignatureModal';
import { downloadBlob, formatBytes } from '@/lib/utils';
import {
  UploadCloud,
  FileText,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Eye,
  Plus,
  RotateCw,
  Trash2,
  Download,
  ArrowLeft,
} from 'lucide-react';
import { Button } from '../ui/Button';

interface PdfEditorWorkspaceProps {
  onBackToTools?: () => void;
}

export function PdfEditorWorkspace({ onBackToTools }: PdfEditorWorkspaceProps) {
  // Document state
  const [file, setFile] = useState<File | null>(null);
  const [pdfBuffer, setPdfBuffer] = useState<ArrayBuffer | null>(null);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [pages, setPages] = useState<PageInfo[]>([]);
  const [textItemsByPage, setTextItemsByPage] = useState<Record<number, PdfTextItem[]>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  // Editor modes and viewport
  const [activeMode, setActiveMode] = useState<EditorToolMode>('text');
  const [zoomScale, setZoomScale] = useState(1.0);
  const [currentPage, setCurrentPage] = useState(1);

  // Overlay elements state
  const [addedTexts, setAddedTexts] = useState<AddedTextElement[]>([]);
  const [whiteouts, setWhiteouts] = useState<WhiteoutElement[]>([]);
  const [images, setImages] = useState<ImageElement[]>([]);
  const [signatures, setSignatures] = useState<SignatureElement[]>([]);
  const [annotations, setAnnotations] = useState<AnnotationElement[]>([]);
  const [shapes, setShapes] = useState<ShapeElement[]>([]);
  const [formFields, setFormFields] = useState<FormFieldElement[]>([]);

  // Modals & File inputs
  const [signModalOpen, setSignModalOpen] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  const handlePdfInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handlePdfLoaded(e.target.files[0]);
    }
  };

  // Undo / Redo history stacks
  const [history, setHistory] = useState<any[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Save snapshot for undo
  const saveSnapshot = useCallback(() => {
    const snapshot = {
      textItemsByPage: JSON.parse(JSON.stringify(textItemsByPage)),
      addedTexts: [...addedTexts],
      whiteouts: [...whiteouts],
      images: [...images],
      signatures: [...signatures],
      annotations: [...annotations],
      shapes: [...shapes],
      formFields: [...formFields],
      pages: [...pages],
    };
    setHistory((prev) => [...prev.slice(0, historyIndex + 1), snapshot]);
    setHistoryIndex((prev) => prev + 1);
  }, [textItemsByPage, addedTexts, whiteouts, images, signatures, annotations, shapes, formFields, pages, historyIndex]);

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prev = history[historyIndex - 1];
      setTextItemsByPage(prev.textItemsByPage);
      setAddedTexts(prev.addedTexts);
      setWhiteouts(prev.whiteouts);
      setImages(prev.images);
      setSignatures(prev.signatures);
      setAnnotations(prev.annotations);
      setShapes(prev.shapes);
      setFormFields(prev.formFields);
      setPages(prev.pages);
      setHistoryIndex((idx) => idx - 1);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const next = history[historyIndex + 1];
      setTextItemsByPage(next.textItemsByPage);
      setAddedTexts(next.addedTexts);
      setWhiteouts(next.whiteouts);
      setImages(next.images);
      setSignatures(next.signatures);
      setAnnotations(next.annotations);
      setShapes(next.shapes);
      setFormFields(next.formFields);
      setPages(next.pages);
      setHistoryIndex((idx) => idx + 1);
    }
  };

  // Load PDF file
  const handlePdfLoaded = async (uploadedFile: File) => {
    setFile(uploadedFile);
    setIsLoading(true);
    setStatusMessage('Reading PDF structure and extracting selectable text...');

    try {
      const buffer = await uploadedFile.arrayBuffer();
      const safeBuffer = buffer.slice(0);
      setPdfBuffer(safeBuffer);

      const { pages: extractedPages, textItemsByPage: extractedTexts, pdfDoc: loadedDoc } =
        await extractPdfDocumentModel(buffer.slice(0));

      setPdfDoc(loadedDoc);
      setPages(extractedPages);
      setTextItemsByPage(extractedTexts);
      setCurrentPage(1);

      // Initial history point
      setHistory([
        {
          textItemsByPage: extractedTexts,
          addedTexts: [],
          whiteouts: [],
          images: [],
          signatures: [],
          annotations: [],
          shapes: [],
          formFields: [],
          pages: extractedPages,
        },
      ]);
      setHistoryIndex(0);
    } catch (err: any) {
      console.error('Failed to parse PDF document:', err);
      alert('Failed to load PDF document: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSamplePdf = async () => {
    setIsLoading(true);
    setStatusMessage('Loading demo PDF document...');
    try {
      const res = await fetch('/test-sample.pdf');
      const blob = await res.blob();
      const sampleFile = new File([blob], 'sample_document.pdf', { type: 'application/pdf' });
      await handlePdfLoaded(sampleFile);
    } catch (err: any) {
      console.error('Failed to load sample document:', err);
    } finally {
      setIsLoading(false);
      setStatusMessage('');
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('sample') === 'true') {
        loadSamplePdf();
      }
    }
  }, []);

  // Keyboard shortcuts listener
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

  // Text Item Updates
  const handleUpdateTextItem = (id: string, updates: Partial<PdfTextItem>) => {
    setTextItemsByPage((prev) => {
      const copy = { ...prev };
      for (const pNum in copy) {
        copy[pNum] = copy[pNum].map((it) => (it.id === id ? { ...it, ...updates } : it));
      }
      return copy;
    });
  };

  const handleDeleteTextItem = (id: string) => {
    handleUpdateTextItem(id, { isDeleted: true, isEdited: true });
    saveSnapshot();
  };

  // Image insertion
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          const newImg: ImageElement = {
            id: `img_${Date.now()}`,
            pageNumber: currentPage,
            dataUrl: ev.target.result as string,
            x: 80,
            y: 100,
            width: 180,
            height: 120,
            pdfX: 80,
            pdfY: (pages[currentPage - 1]?.height || 792) - 220,
            pdfWidth: 180,
            pdfHeight: 120,
          };
          setImages((prev) => [...prev, newImg]);
          saveSnapshot();
        }
      };
      reader.readAsDataURL(e.target.files[0]);
    }
    if (imageInputRef.current) imageInputRef.current.value = '';
  };

  // Signature insertion
  const handleSaveSignature = (dataUrl: string) => {
    const newSig: SignatureElement = {
      id: `sig_${Date.now()}`,
      pageNumber: currentPage,
      dataUrl,
      x: 100,
      y: 150,
      width: 160,
      height: 60,
      pdfX: 100,
      pdfY: (pages[currentPage - 1]?.height || 792) - 210,
      pdfWidth: 160,
      pdfHeight: 60,
    };
    setSignatures((prev) => [...prev, newSig]);
    saveSnapshot();
  };

  // Page level actions
  const handleRotateCurrentPage = () => {
    setPages((prev) =>
      prev.map((p) =>
        p.pageNumber === currentPage ? { ...p, rotation: (p.rotation + 90) % 360 } : p
      )
    );
    saveSnapshot();
  };

  const handleDeleteCurrentPage = () => {
    if (pages.filter((p) => !p.isDeleted).length <= 1) {
      alert('Cannot delete the only page in the document.');
      return;
    }
    setPages((prev) =>
      prev.map((p) => (p.pageNumber === currentPage ? { ...p, isDeleted: true } : p))
    );
    saveSnapshot();
  };

  const handleInsertBlankPage = () => {
    const newPageNum = pages.length + 1;
    const newPage: PageInfo = {
      pageNumber: newPageNum,
      width: 595.28,
      height: 841.89,
      rotation: 0,
    };
    setPages((prev) => [...prev, newPage]);
    setTextItemsByPage((prev) => ({ ...prev, [newPageNum]: [] }));
    setCurrentPage(newPageNum);
    saveSnapshot();
  };

  // Apply Changes & Export
  const handleApplyChanges = async () => {
    if (!pdfBuffer || !file) return;

    setIsSaving(true);
    try {
      const modifiedBlob = await exportModifiedPdfDocument({
        originalPdfBuffer: pdfBuffer,
        pages,
        textItemsByPage,
        addedTexts,
        whiteouts,
        images,
        signatures,
        annotations,
        shapes,
        formFields,
      });

      const dotIdx = file.name.lastIndexOf('.');
      const baseName = dotIdx !== -1 ? file.name.substring(0, dotIdx) : file.name;
      downloadBlob(modifiedBlob, `${baseName}_edited.pdf`);
    } catch (err: any) {
      console.error('Error applying PDF changes:', err);
      alert('Failed to generate modified PDF: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full flex-1 flex flex-col bg-[#F1F5F9] dark:bg-[#0B1120] text-[#0F172A] dark:text-[#F8FAFC] min-h-[calc(100vh-64px)] select-none">
      {/* Hidden file input for PDF upload */}
      <input
        ref={pdfInputRef}
        id="pdf-editor-file-input"
        type="file"
        accept=".pdf,application/pdf"
        onChange={handlePdfInputChange}
        className="hidden"
      />

      {/* Hidden file input for images */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
      />

      {/* Signature Modal */}
      <SignatureModal
        isOpen={signModalOpen}
        onClose={() => setSignModalOpen(false)}
        onSaveSignature={handleSaveSignature}
      />

      {/* When no PDF is loaded: Display Upload Hero Dropzone */}
      {!pdfBuffer ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-[#2563EB] dark:text-[#60A5FA] text-xs font-bold mb-3 shadow-xs">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Full In-Browser PDF Text & Media Editor</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black text-[#0F172A] dark:text-[#F8FAFC] tracking-tight">
              PDF Editor – Edit Text, Images & Documents
            </h1>
            <p className="text-sm text-[#334155] dark:text-[#CBD5E1] mt-2 max-w-xl mx-auto">
              Click and edit existing text directly on the page. Add signatures, whiteout sensitive info, insert shapes and form fields with zero server uploads.
            </p>
          </div>

          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                handlePdfLoaded(e.dataTransfer.files[0]);
              }
            }}
            className="w-full p-12 border-2 border-dashed border-[#CBD5E1] dark:border-[#334155] bg-white dark:bg-[#111827] rounded-3xl flex flex-col items-center justify-center text-center shadow-lg hover:border-[#2563EB] transition-all cursor-pointer"
            onClick={() => pdfInputRef.current?.click()}
          >
            <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-[#2563EB] dark:text-[#60A5FA] flex items-center justify-center mb-4 border border-blue-200 dark:border-blue-800 shadow-xs">
              <UploadCloud className="w-8 h-8" />
            </div>

            <h3 className="text-lg font-bold text-[#0F172A] dark:text-[#F8FAFC]">
              Upload PDF to Edit Text & Content
            </h3>
            <p className="text-xs text-[#475569] dark:text-[#CBD5E1] mt-1 max-w-md">
              Drag and drop your PDF here, or click to browse files from your device.
            </p>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
              <span className="text-[11px] font-mono px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-semibold">
                100% In-Browser • Files Never Leave Your Computer
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  loadSamplePdf();
                }}
                className="text-[11px] font-bold px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-[#2563EB] dark:text-[#60A5FA] border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition cursor-pointer flex items-center gap-1.5"
              >
                <Sparkles className="w-3 h-3" />
                <span>Load Sample PDF</span>
              </button>
            </div>
          </div>

          {onBackToTools && (
            <button
              type="button"
              onClick={onBackToTools}
              className="mt-6 inline-flex items-center gap-1.5 text-xs font-bold text-[#2563EB] dark:text-[#60A5FA] hover:underline cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to All Conversion Tools
            </button>
          )}
        </div>
      ) : (
        /* When PDF is Loaded: Show Full Sejda-Style Workspace */
        <div className="flex-1 flex flex-col">
          {/* Top Sejda Toolbar */}
          <TopToolbar
            activeMode={activeMode}
            onSelectMode={(mode) => {
              setActiveMode(mode);
              if (mode === 'images') {
                imageInputRef.current?.click();
              }
            }}
            canUndo={historyIndex > 0}
            canRedo={historyIndex < history.length - 1}
            onUndo={handleUndo}
            onRedo={handleRedo}
            zoomScale={zoomScale}
            onZoomChange={setZoomScale}
            onFitWidth={() => setZoomScale(1.2)}
            currentPage={currentPage}
            totalPages={pages.filter((p) => !p.isDeleted).length}
            onInsertBlankPage={handleInsertBlankPage}
            onRotateCurrentPage={handleRotateCurrentPage}
            onDeleteCurrentPage={handleDeleteCurrentPage}
            onApplyChanges={handleApplyChanges}
            isSaving={isSaving}
            onOpenSignModal={() => setSignModalOpen(true)}
          />

          {/* Mode Sub-banner / Instruction Bar */}
          <div className="bg-blue-50/70 dark:bg-blue-950/40 border-b border-blue-200 dark:border-blue-800 px-6 py-2 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-[#0F172A] dark:text-[#F8FAFC]">
              <span className="w-2 h-2 rounded-full bg-[#2563EB] animate-pulse" />
              <span className="font-bold">Active Tool:</span>
              <span className="capitalize font-semibold text-[#2563EB] dark:text-[#60A5FA]">
                {activeMode} Mode
              </span>
              <span className="text-slate-500 hidden sm:inline">
                {activeMode === 'text' && '— Click any text on the page to edit it directly, or click empty space to add new text.'}
                {activeMode === 'whiteout' && '— Drag a rectangle over any area to erase or redact it with whiteout.'}
                {activeMode === 'annotate' && '— Drag over text to highlight it with yellow.'}
                {activeMode === 'shapes' && '— Click and drag to draw shapes on the page.'}
                {activeMode === 'forms' && '— Click anywhere to place an interactive form input field.'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-slate-500">
                {file?.name} ({formatBytes(file?.size || 0)})
              </span>
              <button
                type="button"
                onClick={() => {
                  setPdfBuffer(null);
                  setPdfDoc(null);
                  setFile(null);
                }}
                className="text-xs text-rose-600 dark:text-rose-400 font-bold hover:underline ml-2"
              >
                Close PDF
              </button>
            </div>
          </div>

          {/* Document Pages Container */}
          <div className="flex-1 overflow-y-auto p-8 flex flex-col items-center">
            {pages
              .filter((p) => !p.isDeleted)
              .map((pageMeta) => (
                <PageCanvasView
                  key={pageMeta.pageNumber}
                  pageMeta={pageMeta}
                  pdfData={pdfBuffer}
                  pdfDoc={pdfDoc}
                  scale={zoomScale}
                  activeMode={activeMode}
                  textItems={textItemsByPage[pageMeta.pageNumber] || []}
                  onUpdateTextItem={handleUpdateTextItem}
                  onDeleteTextItem={handleDeleteTextItem}
                  addedTexts={addedTexts}
                  onAddText={(t) => {
                    setAddedTexts((prev) => [...prev, t]);
                    saveSnapshot();
                  }}
                  onUpdateAddedText={(id, txt) => {
                    setAddedTexts((prev) =>
                      prev.map((t) => (t.id === id ? { ...t, text: txt } : t))
                    );
                  }}
                  onDeleteAddedText={(id) => {
                    setAddedTexts((prev) => prev.filter((t) => t.id !== id));
                    saveSnapshot();
                  }}
                  whiteouts={whiteouts}
                  onAddWhiteout={(w) => {
                    setWhiteouts((prev) => [...prev, w]);
                    saveSnapshot();
                  }}
                  onDeleteWhiteout={(id) => {
                    setWhiteouts((prev) => prev.filter((w) => w.id !== id));
                    saveSnapshot();
                  }}
                  images={images}
                  onDeleteImage={(id) => {
                    setImages((prev) => prev.filter((img) => img.id !== id));
                    saveSnapshot();
                  }}
                  signatures={signatures}
                  onDeleteSignature={(id) => {
                    setSignatures((prev) => prev.filter((sig) => sig.id !== id));
                    saveSnapshot();
                  }}
                  annotations={annotations}
                  onAddAnnotation={(a) => {
                    setAnnotations((prev) => [...prev, a]);
                    saveSnapshot();
                  }}
                  onDeleteAnnotation={(id) => {
                    setAnnotations((prev) => prev.filter((a) => a.id !== id));
                    saveSnapshot();
                  }}
                  shapes={shapes}
                  onAddShape={(s) => {
                    setShapes((prev) => [...prev, s]);
                    saveSnapshot();
                  }}
                  onDeleteShape={(id) => {
                    setShapes((prev) => prev.filter((s) => s.id !== id));
                    saveSnapshot();
                  }}
                  formFields={formFields}
                  onAddFormField={(f) => {
                    setFormFields((prev) => [...prev, f]);
                    saveSnapshot();
                  }}
                  onRotatePage={handleRotateCurrentPage}
                  onDeletePage={handleDeleteCurrentPage}
                />
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

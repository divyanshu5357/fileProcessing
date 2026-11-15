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
  SelectedObjectRef,
  PendingImagePlacement,
  EditableObjectType,
} from '@/types/pdfEditor';
import {
  extractPdfDocumentModel,
  exportModifiedPdfDocument,
} from '@/lib/pdfEditorEngine';
import { TopToolbar } from './TopToolbar';
import { PageCanvasView } from './PageCanvasView';
import { LayersPanel } from './LayersPanel';
import { SignatureModal } from './SignatureModal';
import { ExportPreviewModal } from '@/components/common/ExportPreviewModal';
import { formatBytes } from '@/lib/utils';
import { fileTransferService } from '@/lib/fileTransferService';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import {
  UploadCloud,
  Sparkles,
  ArrowLeft,
  Info,
} from 'lucide-react';

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
  const [activeMode, setActiveMode] = useState<EditorToolMode>('select');
  const [zoomScale, setZoomScale] = useState(1.0);
  const [currentPage, setCurrentPage] = useState(1);

  // Selection & Placement States
  const [selectedObject, setSelectedObject] = useState<SelectedObjectRef | null>(null);
  const [pendingImage, setPendingImage] = useState<PendingImagePlacement | null>(null);
  const [replaceImageId, setReplaceImageId] = useState<string | null>(null);
  const [isLayersOpen, setIsLayersOpen] = useState(false);
  const [copiedObject, setCopiedObject] = useState<{ type: EditableObjectType; data: any } | null>(null);

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
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportPreviewBlob, setExportPreviewBlob] = useState<Blob | null>(null);
  const [exportPreviewFilename, setExportPreviewFilename] = useState<string>('');
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
  }, [
    textItemsByPage,
    addedTexts,
    whiteouts,
    images,
    signatures,
    annotations,
    shapes,
    formFields,
    pages,
    historyIndex,
  ]);

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
      setSelectedObject(null);
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
      setSelectedObject(null);
    }
  };

  // 1. DUPLICATION LOGIC
  const handleDuplicateObject = useCallback(
    (type: EditableObjectType, id: string) => {
      const newId = `${type}_${Date.now()}`;
      if (type === 'addedText') {
        const item = addedTexts.find((t) => t.id === id);
        if (item) {
          const clone: AddedTextElement = {
            ...item,
            id: newId,
            name: `${item.name || 'Text'} Copy`,
            pdfX: item.pdfX + 20,
            pdfY: Math.max(10, item.pdfY - 20),
          };
          setAddedTexts((prev) => [...prev, clone]);
          setSelectedObject({ id: newId, type: 'addedText', pageNumber: item.pageNumber });
          saveSnapshot();
        }
      } else if (type === 'image') {
        const item = images.find((i) => i.id === id);
        if (item) {
          const clone: ImageElement = {
            ...item,
            id: newId,
            name: `${item.name || 'Image'} Copy`,
            pdfX: item.pdfX + 20,
            pdfY: Math.max(10, item.pdfY - 20),
          };
          setImages((prev) => [...prev, clone]);
          setSelectedObject({ id: newId, type: 'image', pageNumber: item.pageNumber });
          saveSnapshot();
        }
      } else if (type === 'shape') {
        const item = shapes.find((s) => s.id === id);
        if (item) {
          const clone: ShapeElement = {
            ...item,
            id: newId,
            name: `${item.name || 'Shape'} Copy`,
            pdfX: item.pdfX + 20,
            pdfY: Math.max(10, item.pdfY - 20),
          };
          setShapes((prev) => [...prev, clone]);
          setSelectedObject({ id: newId, type: 'shape', pageNumber: item.pageNumber });
          saveSnapshot();
        }
      } else if (type === 'signature') {
        const item = signatures.find((s) => s.id === id);
        if (item) {
          const clone: SignatureElement = {
            ...item,
            id: newId,
            name: `${item.name || 'Signature'} Copy`,
            pdfX: item.pdfX + 20,
            pdfY: Math.max(10, item.pdfY - 20),
          };
          setSignatures((prev) => [...prev, clone]);
          setSelectedObject({ id: newId, type: 'signature', pageNumber: item.pageNumber });
          saveSnapshot();
        }
      } else if (type === 'whiteout') {
        const item = whiteouts.find((w) => w.id === id);
        if (item) {
          const clone: WhiteoutElement = {
            ...item,
            id: newId,
            name: `${item.name || 'Whiteout'} Copy`,
            pdfX: item.pdfX + 20,
            pdfY: Math.max(10, item.pdfY - 20),
          };
          setWhiteouts((prev) => [...prev, clone]);
          setSelectedObject({ id: newId, type: 'whiteout', pageNumber: item.pageNumber });
          saveSnapshot();
        }
      } else if (type === 'annotation') {
        const item = annotations.find((a) => a.id === id);
        if (item) {
          const clone: AnnotationElement = {
            ...item,
            id: newId,
            name: `${item.name || 'Highlight'} Copy`,
            pdfX: item.pdfX + 20,
            pdfY: Math.max(10, item.pdfY - 20),
          };
          setAnnotations((prev) => [...prev, clone]);
          setSelectedObject({ id: newId, type: 'annotation', pageNumber: item.pageNumber });
          saveSnapshot();
        }
      }
    },
    [addedTexts, images, shapes, signatures, whiteouts, annotations, saveSnapshot]
  );

  // 2. STACKING ORDER (Z-INDEX REORDER)
  const handleReorderZIndex = useCallback(
    (type: EditableObjectType, id: string, direction: 'up' | 'down') => {
      const delta = direction === 'up' ? 2 : -2;

      if (type === 'addedText') {
        setAddedTexts((prev) =>
          prev.map((t) =>
            t.id === id ? { ...t, zIndex: Math.max(1, (t.zIndex || 20) + delta) } : t
          )
        );
      } else if (type === 'image') {
        setImages((prev) =>
          prev.map((i) =>
            i.id === id ? { ...i, zIndex: Math.max(1, (i.zIndex || 20) + delta) } : i
          )
        );
      } else if (type === 'shape') {
        setShapes((prev) =>
          prev.map((s) =>
            s.id === id ? { ...s, zIndex: Math.max(1, (s.zIndex || 20) + delta) } : s
          )
        );
      } else if (type === 'signature') {
        setSignatures((prev) =>
          prev.map((s) =>
            s.id === id ? { ...s, zIndex: Math.max(1, (s.zIndex || 25) + delta) } : s
          )
        );
      } else if (type === 'whiteout') {
        setWhiteouts((prev) =>
          prev.map((w) =>
            w.id === id ? { ...w, zIndex: Math.max(1, (w.zIndex || 10) + delta) } : w
          )
        );
      } else if (type === 'annotation') {
        setAnnotations((prev) =>
          prev.map((a) =>
            a.id === id ? { ...a, zIndex: Math.max(1, (a.zIndex || 15) + delta) } : a
          )
        );
      }
      saveSnapshot();
    },
    [saveSnapshot]
  );

  // 3. OBJECT DELETION
  const handleDeleteObject = useCallback(
    (type: EditableObjectType, id: string) => {
      if (type === 'addedText') {
        setAddedTexts((prev) => prev.filter((t) => t.id !== id));
      } else if (type === 'image') {
        setImages((prev) => prev.filter((i) => i.id !== id));
      } else if (type === 'shape') {
        setShapes((prev) => prev.filter((s) => s.id !== id));
      } else if (type === 'signature') {
        setSignatures((prev) => prev.filter((s) => s.id !== id));
      } else if (type === 'whiteout') {
        setWhiteouts((prev) => prev.filter((w) => w.id !== id));
      } else if (type === 'annotation') {
        setAnnotations((prev) => prev.filter((a) => a.id !== id));
      }
      if (selectedObject?.id === id) {
        setSelectedObject(null);
      }
      saveSnapshot();
    },
    [selectedObject, saveSnapshot]
  );

  // 4. OBJECT UPDATE (from Layers Panel or Toolbar)
  const handleUpdateObject = useCallback(
    (type: EditableObjectType, id: string, updates: any) => {
      if (type === 'addedText') {
        setAddedTexts((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
      } else if (type === 'image') {
        setImages((prev) => prev.map((i) => (i.id === id ? { ...i, ...updates } : i)));
      } else if (type === 'shape') {
        setShapes((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
      } else if (type === 'signature') {
        setSignatures((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
      } else if (type === 'whiteout') {
        setWhiteouts((prev) => prev.map((w) => (w.id === id ? { ...w, ...updates } : w)));
      } else if (type === 'annotation') {
        setAnnotations((prev) => prev.map((a) => (a.id === id ? { ...a, ...updates } : a)));
      }
    },
    []
  );

  // 5. KEYBOARD SHORTCUTS
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is currently typing in an input or textarea
      const targetTag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      const isInput = targetTag === 'input' || targetTag === 'textarea';

      // Undo / Redo
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        if (e.shiftKey) {
          e.preventDefault();
          handleRedo();
        } else {
          e.preventDefault();
          handleUndo();
        }
        return;
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'y') {
        e.preventDefault();
        handleRedo();
        return;
      }

      // Escape: Cancel placement or deselect
      if (e.key === 'Escape') {
        if (pendingImage) {
          setPendingImage(null);
          setActiveMode('select');
        } else if (selectedObject) {
          setSelectedObject(null);
        }
        return;
      }

      // If typing inside an input/textarea, do not intercept editing keys
      if (isInput) return;

      // Delete / Backspace: Delete selected object
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedObject) {
        e.preventDefault();
        handleDeleteObject(selectedObject.type, selectedObject.id);
        return;
      }

      // Cmd/Ctrl + D: Duplicate selected object
      if ((e.metaKey || e.ctrlKey) && e.key === 'd' && selectedObject) {
        e.preventDefault();
        handleDuplicateObject(selectedObject.type, selectedObject.id);
        return;
      }

      // Cmd/Ctrl + C: Copy selected object
      if ((e.metaKey || e.ctrlKey) && e.key === 'c' && selectedObject) {
        let data: any = null;
        if (selectedObject.type === 'addedText') data = addedTexts.find((t) => t.id === selectedObject.id);
        else if (selectedObject.type === 'image') data = images.find((i) => i.id === selectedObject.id);
        else if (selectedObject.type === 'shape') data = shapes.find((s) => s.id === selectedObject.id);
        else if (selectedObject.type === 'signature') data = signatures.find((s) => s.id === selectedObject.id);
        else if (selectedObject.type === 'whiteout') data = whiteouts.find((w) => w.id === selectedObject.id);
        else if (selectedObject.type === 'annotation') data = annotations.find((a) => a.id === selectedObject.id);

        if (data) {
          setCopiedObject({ type: selectedObject.type, data: { ...data } });
        }
        return;
      }

      // Cmd/Ctrl + V: Paste copied object
      if ((e.metaKey || e.ctrlKey) && e.key === 'v' && copiedObject) {
        e.preventDefault();
        const newId = `${copiedObject.type}_${Date.now()}`;
        const pasted = {
          ...copiedObject.data,
          id: newId,
          pageNumber: currentPage,
          pdfX: (copiedObject.data.pdfX || 50) + 20,
          pdfY: Math.max(10, (copiedObject.data.pdfY || 50) - 20),
        };

        if (copiedObject.type === 'addedText') setAddedTexts((prev) => [...prev, pasted]);
        else if (copiedObject.type === 'image') setImages((prev) => [...prev, pasted]);
        else if (copiedObject.type === 'shape') setShapes((prev) => [...prev, pasted]);
        else if (copiedObject.type === 'signature') setSignatures((prev) => [...prev, pasted]);
        else if (copiedObject.type === 'whiteout') setWhiteouts((prev) => [...prev, pasted]);
        else if (copiedObject.type === 'annotation') setAnnotations((prev) => [...prev, pasted]);

        setSelectedObject({ id: newId, type: copiedObject.type, pageNumber: currentPage });
        saveSnapshot();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    historyIndex,
    history,
    pendingImage,
    selectedObject,
    copiedObject,
    currentPage,
    addedTexts,
    images,
    shapes,
    signatures,
    whiteouts,
    annotations,
    handleDeleteObject,
    handleDuplicateObject,
    saveSnapshot,
  ]);

  // Existing Text Item Updates
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

  // 6. IMAGE UPLOAD & PLACEMENT ENGINE
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const imgFile = e.target.files[0];
      const reader = new FileReader();

      reader.onload = (ev) => {
        if (ev.target?.result) {
          const dataUrl = ev.target.result as string;
          const img = new Image();

          img.onload = () => {
            if (replaceImageId) {
              // Replace existing image in place
              const aspect = img.naturalWidth / (img.naturalHeight || 1);
              setImages((prev) =>
                prev.map((it) => {
                  if (it.id === replaceImageId) {
                    return {
                      ...it,
                      dataUrl,
                      aspectRatio: aspect,
                      pdfHeight: it.pdfWidth / aspect,
                    };
                  }
                  return it;
                })
              );
              setReplaceImageId(null);
              saveSnapshot();
            } else {
              // Activate placement mode: User clicks on page to place!
              setPendingImage({
                dataUrl,
                naturalWidth: img.naturalWidth,
                naturalHeight: img.naturalHeight,
                name: imgFile.name,
              });
              setActiveMode('images');
            }
          };
          img.src = dataUrl;
        }
      };
      reader.readAsDataURL(imgFile);
    }
    if (imageInputRef.current) imageInputRef.current.value = '';
  };

  const handleTriggerImageUpload = () => {
    setReplaceImageId(null);
    imageInputRef.current?.click();
  };

  const handleReplaceImageRequest = (id: string) => {
    setReplaceImageId(id);
    imageInputRef.current?.click();
  };

  // Signature insertion
  const handleSaveSignature = (dataUrl: string) => {
    const newSigId = `sig_${Date.now()}`;
    const newSig: SignatureElement = {
      id: newSigId,
      pageNumber: currentPage,
      name: 'Digital Signature',
      dataUrl,
      pdfX: 100,
      pdfY: Math.max(50, (pages[currentPage - 1]?.height || 792) - 210),
      pdfWidth: 160,
      pdfHeight: 60,
      rotation: 0,
      opacity: 1,
      zIndex: 25,
    };
    setSignatures((prev) => [...prev, newSig]);
    setSelectedObject({ id: newSigId, type: 'signature', pageNumber: currentPage });
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
      const targetFilename = `${baseName}_edited.pdf`;

      setExportPreviewBlob(modifiedBlob);
      setExportPreviewFilename(targetFilename);
      setIsExportModalOpen(true);
    } catch (err: any) {
      console.error('Error applying PDF changes:', err);
      alert('Failed to generate modified PDF: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Load PDF file into editor
  const handlePdfLoaded = async (uploadedFile: File) => {
    setFile(uploadedFile);
    setIsLoading(true);
    setStatusMessage('Reading PDF structure and extracting text...');

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

      // Initial history state
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

  // Demo PDF generator fallback
  const loadSamplePdf = async () => {
    setIsLoading(true);
    setStatusMessage('Generating professional sample PDF...');
    try {
      // Create a clean sample PDF in-memory
      const samplePdf = await PDFDocument.create();
      const fontBold = await samplePdf.embedFont(StandardFonts.HelveticaBold);
      const fontRegular = await samplePdf.embedFont(StandardFonts.Helvetica);

      const page1 = samplePdf.addPage([595.28, 841.89]); // A4
      page1.drawText('Gyanvatsala Document Editor Benchmark', {
        x: 50,
        y: 780,
        size: 22,
        font: fontBold,
        color: rgb(0.09, 0.23, 0.54),
      });

      page1.drawText('Standard Enterprise Document for Testing PDF Editing Engine', {
        x: 50,
        y: 752,
        size: 11,
        font: fontRegular,
        color: rgb(0.35, 0.42, 0.53),
      });

      page1.drawLine({
        start: { x: 50, y: 738 },
        end: { x: 545, y: 738 },
        thickness: 1.5,
        color: rgb(0.85, 0.88, 0.93),
      });

      page1.drawText('1. Executive Summary', {
        x: 50,
        y: 700,
        size: 15,
        font: fontBold,
        color: rgb(0.06, 0.09, 0.16),
      });

      const bodyText =
        'This sample document is provided to test the high-fidelity interactive PDF editing engine. ' +
        'Users can click on existing text to edit it in place, insert images at precise clicked coordinates, ' +
        'drag bounding boxes to resize and rotate, and redact areas using the whiteout tool.';

      page1.drawText(bodyText, {
        x: 50,
        y: 650,
        size: 11,
        font: fontRegular,
        color: rgb(0.2, 0.25, 0.33),
        lineHeight: 18,
        maxWidth: 495,
      });

      const pdfBytes = await samplePdf.save();
      const sampleFile = new File([pdfBytes.buffer as ArrayBuffer], 'sample_business_report.pdf', {
        type: 'application/pdf',
      });
      await handlePdfLoaded(sampleFile);
    } catch (err: any) {
      console.error('Failed to create sample PDF:', err);
    } finally {
      setIsLoading(false);
      setStatusMessage('');
    }
  };

  useEffect(() => {
    // Automatically load pending file from Workspace
    const pending = fileTransferService.consumePendingFile();
    if (pending && pending.file) {
      handlePdfLoaded(pending.file);
      return;
    }

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('sample') === 'true') {
        loadSamplePdf();
      }
    }
  }, []);

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
        accept="image/png,image/jpeg,image/webp,image/jpg"
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
              <span>Professional Interactive PDF Editor Engine</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black text-[#0F172A] dark:text-[#F8FAFC] tracking-tight">
              PDF Editor – Precision Editing & Layout
            </h1>
            <p className="text-sm text-[#334155] dark:text-[#CBD5E1] mt-2 max-w-xl mx-auto">
              Place images at exact clicked locations, edit text directly, drag to resize with 8 handles, and manage objects with layers.
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
              Upload PDF Document
            </h3>
            <p className="text-xs text-[#475569] dark:text-[#CBD5E1] mt-1 max-w-md">
              Drag and drop your PDF here, or click to browse files from your computer.
            </p>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
              <span className="text-[11px] font-mono px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-semibold">
                100% In-Browser • Zero Server Uploads
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
        /* When PDF is Loaded: Professional Workspace with Layers Sidebar */
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          {/* Top Editing Toolbar */}
          <TopToolbar
            activeMode={activeMode}
            onSelectMode={(mode) => {
              setActiveMode(mode);
              if (mode === 'select') {
                setPendingImage(null);
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
            isLayersOpen={isLayersOpen}
            onToggleLayers={() => setIsLayersOpen((prev) => !prev)}
            onTriggerImageUpload={handleTriggerImageUpload}
          />

          {/* Mode Sub-banner / Tool Instruction Bar */}
          <div className="bg-blue-50/70 dark:bg-blue-950/40 border-b border-blue-200 dark:border-blue-800 px-6 py-2 flex items-center justify-between text-xs shrink-0">
            <div className="flex items-center gap-2 text-[#0F172A] dark:text-[#F8FAFC]">
              <span className="w-2 h-2 rounded-full bg-[#2563EB] animate-pulse" />
              <span className="font-bold">Active Tool:</span>
              <span className="capitalize font-semibold text-[#2563EB] dark:text-[#60A5FA]">
                {activeMode}
              </span>
              <span className="text-slate-500 hidden md:inline">
                {pendingImage && '— Click anywhere on the PDF page to place the selected image.'}
                {!pendingImage && activeMode === 'select' && '— Click any object to select, move, resize (8 handles) or rotate.'}
                {activeMode === 'text' && '— Click anywhere on the page to insert a new multiline text box.'}
                {activeMode === 'editText' && '— Click existing PDF text to edit directly with auto-detected font family and size.'}
                {activeMode === 'whiteout' && '— Drag a rectangle over any content to erase or redact.'}
                {activeMode === 'annotate' && '— Drag over text or areas to highlight in yellow.'}
                {activeMode === 'shapes' && '— Drag to draw customizable rectangles and shapes.'}
                {activeMode === 'forms' && '— Click anywhere to place an interactive form input field.'}
              </span>
            </div>

            <div className="flex items-center gap-3">
              {pendingImage && (
                <button
                  type="button"
                  onClick={() => {
                    setPendingImage(null);
                    setActiveMode('select');
                  }}
                  className="text-xs bg-rose-50 text-rose-600 border border-rose-200 px-2 py-0.5 rounded-md font-bold hover:bg-rose-100 cursor-pointer"
                >
                  Cancel Image Placement
                </button>
              )}
              <span className="text-[11px] font-mono text-slate-500">
                {file?.name} ({formatBytes(file?.size || 0)})
              </span>
              <button
                type="button"
                onClick={() => {
                  setPdfBuffer(null);
                  setPdfDoc(null);
                  setFile(null);
                  setSelectedObject(null);
                  setPendingImage(null);
                }}
                className="text-xs text-rose-600 dark:text-rose-400 font-bold hover:underline cursor-pointer"
              >
                Close PDF
              </button>
            </div>
          </div>

          {/* Main Workspace Area (Canvas Viewport + Layers Sidebar) */}
          <div className="flex-1 flex overflow-hidden">
            {/* Scrollable Center Canvas Viewport */}
            <div className="flex-1 overflow-auto p-8 flex flex-col items-center">
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
                    pendingImage={pendingImage}
                    onClearPendingImage={() => {
                      setPendingImage(null);
                      setActiveMode('select');
                    }}
                    selectedObject={selectedObject}
                    onSelectObject={setSelectedObject}
                    textItems={textItemsByPage[pageMeta.pageNumber] || []}
                    onUpdateTextItem={handleUpdateTextItem}
                    onDeleteTextItem={handleDeleteTextItem}
                    addedTexts={addedTexts}
                    onAddText={(t) => {
                      setAddedTexts((prev) => [...prev, t]);
                      saveSnapshot();
                    }}
                    onUpdateAddedText={(id, updates) => {
                      setAddedTexts((prev) =>
                        prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
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
                    onUpdateWhiteout={(id, updates) => {
                      setWhiteouts((prev) =>
                        prev.map((w) => (w.id === id ? { ...w, ...updates } : w))
                      );
                    }}
                    onDeleteWhiteout={(id) => {
                      setWhiteouts((prev) => prev.filter((w) => w.id !== id));
                      saveSnapshot();
                    }}
                    images={images}
                    onAddImage={(img) => {
                      setImages((prev) => [...prev, img]);
                      saveSnapshot();
                    }}
                    onUpdateImage={(id, updates) => {
                      setImages((prev) =>
                        prev.map((img) => (img.id === id ? { ...img, ...updates } : img))
                      );
                    }}
                    onDeleteImage={(id) => {
                      setImages((prev) => prev.filter((img) => img.id !== id));
                      saveSnapshot();
                    }}
                    onReplaceImageRequest={handleReplaceImageRequest}
                    signatures={signatures}
                    onAddSignature={(sig) => {
                      setSignatures((prev) => [...prev, sig]);
                      saveSnapshot();
                    }}
                    onUpdateSignature={(id, updates) => {
                      setSignatures((prev) =>
                        prev.map((sig) => (sig.id === id ? { ...sig, ...updates } : sig))
                      );
                    }}
                    onDeleteSignature={(id) => {
                      setSignatures((prev) => prev.filter((sig) => sig.id !== id));
                      saveSnapshot();
                    }}
                    annotations={annotations}
                    onAddAnnotation={(a) => {
                      setAnnotations((prev) => [...prev, a]);
                      saveSnapshot();
                    }}
                    onUpdateAnnotation={(id, updates) => {
                      setAnnotations((prev) =>
                        prev.map((a) => (a.id === id ? { ...a, ...updates } : a))
                      );
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
                    onUpdateShape={(id, updates) => {
                      setShapes((prev) =>
                        prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
                      );
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
                    onDuplicateObject={handleDuplicateObject}
                    onReorderZIndex={handleReorderZIndex}
                    onRotatePage={handleRotateCurrentPage}
                    onDeletePage={handleDeleteCurrentPage}
                  />
                ))}
            </div>

            {/* Right Side: Layers & Objects Panel */}
            {isLayersOpen && (
              <LayersPanel
                currentPage={currentPage}
                addedTexts={addedTexts}
                images={images}
                shapes={shapes}
                signatures={signatures}
                annotations={annotations}
                whiteouts={whiteouts}
                selectedObject={selectedObject}
                onSelectObject={setSelectedObject}
                onUpdateObject={handleUpdateObject}
                onDeleteObject={handleDeleteObject}
                onReorderZIndex={handleReorderZIndex}
                onClose={() => setIsLayersOpen(false)}
              />
            )}
          </div>
        </div>
      )}

      {/* Pre-Download Export Preview Modal with folder selection */}
      <ExportPreviewModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        blob={exportPreviewBlob}
        defaultFilename={exportPreviewFilename}
        title="PDF Editor: Preview & Save"
        fileType="pdf"
        metadata={{
          pageCount: pages.filter((p) => !p.isDeleted).length,
        }}
      />
    </div>
  );
}

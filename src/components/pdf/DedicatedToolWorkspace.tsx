'use client';

import React, { useState, useCallback } from 'react';
import {
  ToolDefinition,
  UploadedFileItem,
  ConversionResultItem,
  PdfToolId,
} from '@/types/document';
import { ALL_PDF_TOOLS, getToolById } from '@/lib/toolRegistry';
import { DocumentUploader } from './DocumentUploader';
import { ToolSettingsPanels } from './ToolSettingsPanels';
import { ProcessingStatus } from './ProcessingStatus';
import { DownloadResults } from './DownloadResults';
import { Button } from '../ui/Button';
import {
  imagesToPdf,
  renderPdfPagesToImages,
  pdfToDocx,
  pdfToExcel,
  pdfToPptx,
  pdfToPdfA,
  mergePdfDocuments,
  splitPdfDocument,
  compressPdfDocument,
  rotatePdfPages,
  deletePdfPages,
  organizePdfPages,
  extractPdfImages,
  watermarkPdf,
  addPageNumbers,
  pdfToPlainText,
} from '@/lib/pdfEngine';
import { docxToPdf, excelToPdf, pptxToPdf, htmlToPdf } from '@/lib/documentEngine';
import { createZip, downloadBlob } from '@/lib/utils';
import {
  ArrowLeft,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  FileCheck,
} from 'lucide-react';
import { PdfEditorWorkspace } from '../editor/PdfEditorWorkspace';

interface DedicatedToolWorkspaceProps {
  toolId: PdfToolId;
  onBack: () => void;
  onSelectOtherTool?: (toolId: PdfToolId) => void;
}

export function DedicatedToolWorkspace({
  toolId,
  onBack,
  onSelectOtherTool,
}: DedicatedToolWorkspaceProps) {
  if (toolId === 'pdf-editor') {
    return <PdfEditorWorkspace onBackToTools={onBack} />;
  }

  const tool = getToolById(toolId) || ALL_PDF_TOOLS[0];

  // Files in workspace
  const [files, setFiles] = useState<UploadedFileItem[]>([]);
  const [results, setResults] = useState<ConversionResultItem[]>([]);

  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Extra result data
  const [validationReport, setValidationReport] = useState<any | null>(null);
  const [excelPreviewRows, setExcelPreviewRows] = useState<(string | number)[][]>([]);

  // Default settings based on tool
  const [settings, setSettings] = useState<any>({
    pageSize: 'a4',
    orientation: 'auto',
    margin: 'normal',
    imageFit: 'fit',
    combineIntoOne: true,
    quality: 90,
    dpi: 150,
    format: 'image/jpeg',
    pageRange: 'all',
    customPages: '',
    conformance: 'pdfa-1b',
    text: 'CONFIDENTIAL',
    opacity: 0.3,
    fontSize: 48,
    rotation: 45,
    position: 'center',
    splitMode: 'all-pages',
    pageRanges: '',
    rotationAngle: 90,
    applyTo: 'all',
    compressionLevel: 'recommended',
    showGridLines: true,
    fitToPage: true,
    slideAspect: '16:9',
    includeSlideNumbers: true,
    sourceType: 'file',
    pastedHtml: '',
  });

  const handleAddFiles = (newFiles: File[]) => {
    const items: UploadedFileItem[] = newFiles.map((file) => ({
      id: `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      file,
      name: file.name,
      size: file.size,
      type: file.type || 'application/octet-stream',
      rotation: 0,
    }));
    setFiles((prev) => [...prev, ...items]);
    setErrorMessage(null);
  };

  const handleRemoveFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleClearFiles = () => {
    setFiles([]);
    setResults([]);
    setErrorMessage(null);
  };

  const handleRotateFile = (id: string) => {
    setFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, rotation: ((f.rotation || 0) + 90) % 360 } : f))
    );
  };

  const handleMoveFile = (id: string, direction: 'up' | 'down') => {
    const idx = files.findIndex((f) => f.id === id);
    if (idx === -1) return;
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= files.length) return;

    const copy = [...files];
    const temp = copy[idx];
    copy[idx] = copy[targetIdx];
    copy[targetIdx] = temp;
    setFiles(copy);
  };

  // MAIN CONVERSION HANDLER
  const handleExecuteConversion = async () => {
    if (files.length === 0 && !(tool.id === 'html-to-pdf' && settings.sourceType === 'html' && settings.pastedHtml)) {
      setErrorMessage('Please select or upload at least one file to convert.');
      return;
    }

    setIsProcessing(true);
    setProgressPercent(10);
    setStatusMessage('Initializing conversion engine...');
    setErrorMessage(null);
    setValidationReport(null);
    setExcelPreviewRows([]);

    try {
      const generatedResults: ConversionResultItem[] = [];

      // 1. JPG TO PDF
      if (tool.id === 'jpg-to-pdf') {
        setStatusMessage('Embedding images into PDF pages...');
        setProgressPercent(40);

        const pdfBlob = await imagesToPdf(
          files.map((f) => ({ blob: f.file, name: f.name, rotation: f.rotation })),
          settings
        );

        const url = URL.createObjectURL(pdfBlob);
        generatedResults.push({
          id: `res_${Date.now()}`,
          name: files.length > 1 ? `converted_images.pdf` : `${files[0].name.replace(/\.[^/.]+$/, '')}.pdf`,
          originalName: files[0].name,
          blob: pdfBlob,
          url,
          size: pdfBlob.size,
          format: 'application/pdf',
          pageCount: files.length,
        });
      }

      // 2. WORD TO PDF
      else if (tool.id === 'word-to-pdf') {
        for (let i = 0; i < files.length; i++) {
          const fileItem = files[i];
          const pdfBlob = await docxToPdf(fileItem.file, settings, (p, msg) => {
            setProgressPercent(Math.round(20 + (p * 0.7)));
            setStatusMessage(`[${fileItem.name}] ${msg}`);
          });

          const url = URL.createObjectURL(pdfBlob);
          generatedResults.push({
            id: `res_${Date.now()}_${i}`,
            name: `${fileItem.name.replace(/\.[^/.]+$/, '')}.pdf`,
            originalName: fileItem.name,
            blob: pdfBlob,
            url,
            size: pdfBlob.size,
            format: 'application/pdf',
          });
        }
      }

      // 3. EXCEL TO PDF
      else if (tool.id === 'excel-to-pdf') {
        for (let i = 0; i < files.length; i++) {
          const fileItem = files[i];
          const pdfBlob = await excelToPdf(fileItem.file, settings, (p, msg) => {
            setProgressPercent(Math.round(20 + (p * 0.7)));
            setStatusMessage(`[${fileItem.name}] ${msg}`);
          });

          const url = URL.createObjectURL(pdfBlob);
          generatedResults.push({
            id: `res_${Date.now()}_${i}`,
            name: `${fileItem.name.replace(/\.[^/.]+$/, '')}.pdf`,
            originalName: fileItem.name,
            blob: pdfBlob,
            url,
            size: pdfBlob.size,
            format: 'application/pdf',
          });
        }
      }

      // 4. POWERPOINT TO PDF
      else if (tool.id === 'powerpoint-to-pdf') {
        for (let i = 0; i < files.length; i++) {
          const fileItem = files[i];
          const pdfBlob = await pptxToPdf(fileItem.file, settings, (p, msg) => {
            setProgressPercent(Math.round(20 + (p * 0.7)));
            setStatusMessage(`[${fileItem.name}] ${msg}`);
          });

          const url = URL.createObjectURL(pdfBlob);
          generatedResults.push({
            id: `res_${Date.now()}_${i}`,
            name: `${fileItem.name.replace(/\.[^/.]+$/, '')}.pdf`,
            originalName: fileItem.name,
            blob: pdfBlob,
            url,
            size: pdfBlob.size,
            format: 'application/pdf',
          });
        }
      }

      // 5. HTML TO PDF
      else if (tool.id === 'html-to-pdf') {
        const source = settings.sourceType === 'html' ? settings.pastedHtml : files[0].file;
        const pdfBlob = await htmlToPdf(source, settings, (p, msg) => {
          setProgressPercent(p);
          setStatusMessage(msg);
        });

        const url = URL.createObjectURL(pdfBlob);
        generatedResults.push({
          id: `res_${Date.now()}`,
          name: files[0] ? `${files[0].name.replace(/\.[^/.]+$/, '')}.pdf` : 'html_document.pdf',
          originalName: files[0] ? files[0].name : 'pasted_html.html',
          blob: pdfBlob,
          url,
          size: pdfBlob.size,
          format: 'application/pdf',
        });
      }

      // 6. PDF TO JPG / PNG
      else if (tool.id === 'pdf-to-jpg') {
        for (let fIdx = 0; fIdx < files.length; fIdx++) {
          const fileItem = files[fIdx];
          const pageImages = await renderPdfPagesToImages(
            fileItem.file,
            settings,
            (curr, tot) => {
              setProgressPercent(Math.round((curr / tot) * 90));
              setStatusMessage(`Rendering page ${curr} of ${tot}...`);
            }
          );

          const ext = settings.format === 'image/png' ? 'png' : 'jpg';
          pageImages.forEach((img) => {
            const url = URL.createObjectURL(img.blob);
            generatedResults.push({
              id: `res_${Date.now()}_${img.pageNumber}`,
              name: `${fileItem.name.replace(/\.[^/.]+$/, '')}_page_${img.pageNumber}.${ext}`,
              originalName: fileItem.name,
              blob: img.blob,
              url,
              size: img.blob.size,
              format: settings.format,
              pageCount: 1,
            });
          });
        }
      }

      // 7. PDF TO WORD (DOCX)
      else if (tool.id === 'pdf-to-word') {
        for (let i = 0; i < files.length; i++) {
          const fileItem = files[i];
          const { blob, isScanned, wordCount, pageCount } = await pdfToDocx(
            fileItem.file,
            settings,
            (p, msg) => {
              setProgressPercent(p);
              setStatusMessage(`[${fileItem.name}] ${msg}`);
            }
          );

          const url = URL.createObjectURL(blob);
          generatedResults.push({
            id: `res_${Date.now()}_${i}`,
            name: `${fileItem.name.replace(/\.[^/.]+$/, '')}.docx`,
            originalName: fileItem.name,
            blob,
            url,
            size: blob.size,
            format: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            pageCount,
            details: { isScanned, wordCount },
          });
        }
      }

      // 8. PDF TO EXCEL (XLSX)
      else if (tool.id === 'pdf-to-excel') {
        for (let i = 0; i < files.length; i++) {
          const fileItem = files[i];
          const { blob, tableRows, sheetCount } = await pdfToExcel(
            fileItem.file,
            settings,
            (p, msg) => {
              setProgressPercent(p);
              setStatusMessage(`[${fileItem.name}] ${msg}`);
            }
          );

          setExcelPreviewRows(tableRows);
          const url = URL.createObjectURL(blob);
          generatedResults.push({
            id: `res_${Date.now()}_${i}`,
            name: `${fileItem.name.replace(/\.[^/.]+$/, '')}.xlsx`,
            originalName: fileItem.name,
            blob,
            url,
            size: blob.size,
            format: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            pageCount: sheetCount,
          });
        }
      }

      // 9. PDF TO POWERPOINT (PPTX)
      else if (tool.id === 'pdf-to-powerpoint') {
        for (let i = 0; i < files.length; i++) {
          const fileItem = files[i];
          const pptxBlob = await pdfToPptx(fileItem.file, settings, (p, msg) => {
            setProgressPercent(p);
            setStatusMessage(`[${fileItem.name}] ${msg}`);
          });

          const url = URL.createObjectURL(pptxBlob);
          generatedResults.push({
            id: `res_${Date.now()}_${i}`,
            name: `${fileItem.name.replace(/\.[^/.]+$/, '')}.pptx`,
            originalName: fileItem.name,
            blob: pptxBlob,
            url,
            size: pptxBlob.size,
            format: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          });
        }
      }

      // 10. PDF TO PDF/A
      else if (tool.id === 'pdf-to-pdfa') {
        for (let i = 0; i < files.length; i++) {
          const fileItem = files[i];
          setStatusMessage(`Applying ISO 19005 archival standards to ${fileItem.name}...`);
          setProgressPercent(60);

          const { blob, validationReport } = await pdfToPdfA(fileItem.file, settings);
          setValidationReport(validationReport);

          const url = URL.createObjectURL(blob);
          generatedResults.push({
            id: `res_${Date.now()}_${i}`,
            name: `${fileItem.name.replace(/\.[^/.]+$/, '')}_pdfa.pdf`,
            originalName: fileItem.name,
            blob,
            url,
            size: blob.size,
            format: 'application/pdf',
          });
        }
      }

      // 11. MERGE PDF
      else if (tool.id === 'merge-pdf') {
        const mergedBlob = await mergePdfDocuments(
          files.map((f) => ({ blob: f.file, name: f.name })),
          (p, msg) => {
            setProgressPercent(p);
            setStatusMessage(msg);
          }
        );

        const url = URL.createObjectURL(mergedBlob);
        generatedResults.push({
          id: `res_${Date.now()}`,
          name: 'merged_document.pdf',
          originalName: files.map((f) => f.name).join(', '),
          blob: mergedBlob,
          url,
          size: mergedBlob.size,
          format: 'application/pdf',
        });
      }

      // 12. SPLIT PDF
      else if (tool.id === 'split-pdf') {
        for (const fileItem of files) {
          const splitResults = await splitPdfDocument(fileItem.file, settings, (p, msg) => {
            setProgressPercent(p);
            setStatusMessage(msg);
          });

          splitResults.forEach((sr, idx) => {
            const url = URL.createObjectURL(sr.blob);
            generatedResults.push({
              id: `res_${Date.now()}_${idx}`,
              name: `${fileItem.name.replace(/\.[^/.]+$/, '')}_${sr.filename}`,
              originalName: fileItem.name,
              blob: sr.blob,
              url,
              size: sr.blob.size,
              format: 'application/pdf',
            });
          });
        }
      }

      // 13. COMPRESS PDF
      else if (tool.id === 'compress-pdf') {
        for (let i = 0; i < files.length; i++) {
          const fileItem = files[i];
          setStatusMessage(`Compressing stream objects for ${fileItem.name}...`);
          setProgressPercent(60);

          const { blob } = await compressPdfDocument(fileItem.file, settings);
          const url = URL.createObjectURL(blob);

          generatedResults.push({
            id: `res_${Date.now()}_${i}`,
            name: `${fileItem.name.replace(/\.[^/.]+$/, '')}_compressed.pdf`,
            originalName: fileItem.name,
            blob,
            url,
            size: blob.size,
            format: 'application/pdf',
          });
        }
      }

      // 14. ROTATE PDF
      else if (tool.id === 'rotate-pdf') {
        for (let i = 0; i < files.length; i++) {
          const fileItem = files[i];
          setStatusMessage(`Rotating pages of ${fileItem.name}...`);
          setProgressPercent(70);

          const rotatedBlob = await rotatePdfPages(fileItem.file, settings);
          const url = URL.createObjectURL(rotatedBlob);

          generatedResults.push({
            id: `res_${Date.now()}_${i}`,
            name: `${fileItem.name.replace(/\.[^/.]+$/, '')}_rotated.pdf`,
            originalName: fileItem.name,
            blob: rotatedBlob,
            url,
            size: rotatedBlob.size,
            format: 'application/pdf',
          });
        }
      }

      // 15. DELETE PDF PAGES
      else if (tool.id === 'delete-pdf-pages') {
        for (let i = 0; i < files.length; i++) {
          const fileItem = files[i];
          const pagesToDelete = settings.pagesToDelete || [1];
          const newBlob = await deletePdfPages(fileItem.file, pagesToDelete);
          const url = URL.createObjectURL(newBlob);

          generatedResults.push({
            id: `res_${Date.now()}_${i}`,
            name: `${fileItem.name.replace(/\.[^/.]+$/, '')}_pages_removed.pdf`,
            originalName: fileItem.name,
            blob: newBlob,
            url,
            size: newBlob.size,
            format: 'application/pdf',
          });
        }
      }

      // 16. EXTRACT IMAGES FROM PDF
      else if (tool.id === 'extract-images') {
        for (const fileItem of files) {
          const imgs = await extractPdfImages(fileItem.file, (p, msg) => {
            setProgressPercent(p);
            setStatusMessage(msg);
          });

          imgs.forEach((im, idx) => {
            const url = URL.createObjectURL(im.blob);
            generatedResults.push({
              id: `res_${Date.now()}_${idx}`,
              name: `${fileItem.name.replace(/\.[^/.]+$/, '')}_${im.filename}`,
              originalName: fileItem.name,
              blob: im.blob,
              url,
              size: im.blob.size,
              format: 'image/png',
            });
          });
        }
      }

      // 17. WATERMARK PDF
      else if (tool.id === 'watermark-pdf') {
        for (let i = 0; i < files.length; i++) {
          const fileItem = files[i];
          setStatusMessage(`Stamping watermark on ${fileItem.name}...`);
          setProgressPercent(70);

          const watermarkedBlob = await watermarkPdf(fileItem.file, settings);
          const url = URL.createObjectURL(watermarkedBlob);

          generatedResults.push({
            id: `res_${Date.now()}_${i}`,
            name: `${fileItem.name.replace(/\.[^/.]+$/, '')}_watermarked.pdf`,
            originalName: fileItem.name,
            blob: watermarkedBlob,
            url,
            size: watermarkedBlob.size,
            format: 'application/pdf',
          });
        }
      }

      // 18. PAGE NUMBERS
      else if (tool.id === 'page-numbers') {
        for (let i = 0; i < files.length; i++) {
          const fileItem = files[i];
          setStatusMessage(`Adding page numbers to ${fileItem.name}...`);
          setProgressPercent(70);

          const numberedBlob = await addPageNumbers(fileItem.file, settings);
          const url = URL.createObjectURL(numberedBlob);

          generatedResults.push({
            id: `res_${Date.now()}_${i}`,
            name: `${fileItem.name.replace(/\.[^/.]+$/, '')}_numbered.pdf`,
            originalName: fileItem.name,
            blob: numberedBlob,
            url,
            size: numberedBlob.size,
            format: 'application/pdf',
          });
        }
      }

      // 19. PDF TO TEXT
      else if (tool.id === 'pdf-to-text') {
        for (let i = 0; i < files.length; i++) {
          const fileItem = files[i];
          setStatusMessage(`Extracting plaintext from ${fileItem.name}...`);
          setProgressPercent(70);

          const { blob } = await pdfToPlainText(fileItem.file, settings);
          const url = URL.createObjectURL(blob);

          generatedResults.push({
            id: `res_${Date.now()}_${i}`,
            name: `${fileItem.name.replace(/\.[^/.]+$/, '')}.txt`,
            originalName: fileItem.name,
            blob,
            url,
            size: blob.size,
            format: 'text/plain',
          });
        }
      }

      // Default fallback
      else {
        // Generic fallback
        if (files[0]) {
          const url = URL.createObjectURL(files[0].file);
          generatedResults.push({
            id: `res_${Date.now()}`,
            name: `converted_${files[0].name}`,
            originalName: files[0].name,
            blob: files[0].file,
            url,
            size: files[0].size,
            format: files[0].type,
          });
        }
      }

      setProgressPercent(100);
      setStatusMessage('Conversion completed successfully!');
      setResults(generatedResults);
    } catch (err: any) {
      console.error('Conversion execution error:', err);
      setErrorMessage(err.message || 'An unexpected error occurred during document conversion.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadZip = async () => {
    if (results.length === 0) return;
    const items = results.map((r) => ({ name: r.name, blob: r.blob }));
    const zipBlob = await createZip(items);
    downloadBlob(zipBlob, `${tool.id}_results_${Date.now()}.zip`);
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-8 flex flex-col gap-8">
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-bold text-[#2563EB] dark:text-[#60A5FA] hover:underline cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to All Tools
        </button>

        <div className="flex items-center gap-2 text-xs text-[#475569] dark:text-[#CBD5E1]">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span className="font-semibold text-emerald-800 dark:text-emerald-300">
            100% In-Browser • 0 Server Uploads
          </span>
        </div>
      </div>

      {/* Tool Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-white dark:bg-[#111827] border border-[#CBD5E1] dark:border-[#334155] rounded-2xl shadow-xs transition-colors">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-[#2563EB] dark:text-[#60A5FA] shrink-0 shadow-xs">
            <Sparkles className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-extrabold text-[#0F172A] dark:text-[#F8FAFC] tracking-tight">
                {tool.name}
              </h2>
              {tool.badge && (
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-[#2563EB] dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  {tool.badge}
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-[#334155] dark:text-[#CBD5E1] mt-1 font-normal">
              {tool.shortDesc}
            </p>
          </div>
        </div>

        {/* Action Trigger Button if files loaded and not converted yet */}
        {results.length === 0 && (
          <Button
            variant="primary"
            size="lg"
            isLoading={isProcessing}
            disabled={files.length === 0 && !(tool.id === 'html-to-pdf' && settings.sourceType === 'html')}
            onClick={handleExecuteConversion}
            className="font-bold shadow-md shrink-0 gap-2"
          >
            <span>Convert Now</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* If conversion results already generated: Display Results */}
      {results.length > 0 ? (
        <DownloadResults
          results={results}
          onReset={() => {
            setResults([]);
            setValidationReport(null);
            setExcelPreviewRows([]);
          }}
          onDownloadZip={handleDownloadZip}
          validationReport={validationReport}
          excelPreviewRows={excelPreviewRows}
        />
      ) : (
        /* Workspace Form: Upload + Settings + Processing */
        <div className="flex flex-col gap-6">
          {/* 1. Upload Section */}
          <DocumentUploader
            files={files}
            onAddFiles={handleAddFiles}
            onRemoveFile={handleRemoveFile}
            onClearFiles={handleClearFiles}
            onRotateFile={handleRotateFile}
            onMoveFile={handleMoveFile}
            accept={tool.accept}
            multiple={true}
            toolName={tool.name}
            allowRotation={tool.id === 'jpg-to-pdf'}
            allowReorder={tool.id === 'jpg-to-pdf' || tool.id === 'merge-pdf'}
          />

          {/* 2. Tool Settings Section */}
          <ToolSettingsPanels
            toolId={tool.id}
            settings={settings}
            onChange={setSettings}
          />

          {/* 3. Processing Status Section */}
          <ProcessingStatus
            isProcessing={isProcessing}
            progressPercent={progressPercent}
            statusMessage={statusMessage}
            currentFileName={files[0]?.name}
            errorMessage={errorMessage}
          />

          {/* Bottom Primary Action Bar */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#CBD5E1] dark:border-[#334155]">
            <Button
              variant="secondary"
              onClick={onBack}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="lg"
              isLoading={isProcessing}
              disabled={files.length === 0 && !(tool.id === 'html-to-pdf' && settings.sourceType === 'html')}
              onClick={handleExecuteConversion}
              className="font-bold px-8 shadow-sm gap-2"
            >
              <span>Convert Now</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

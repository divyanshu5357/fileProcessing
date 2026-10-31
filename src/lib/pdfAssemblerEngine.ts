import { PDFDocument, degrees } from 'pdf-lib';
import { getPdfJs } from './pdfjsLoader';
import { AssemblerDocument, AssemblerPage } from '@/types/pdfAssembler';

export interface SourceFileRecord {
  id: string;
  bytes: Uint8Array;
  mime: string;
  name: string;
}

// In-memory cache of source file byte buffers
export const sourceFilesCache = new Map<string, SourceFileRecord>();

/**
 * Generate a unique random ID
 */
export function generateAssemblerId(prefix: string = 'id'): string {
  return `${prefix}_${Math.random().toString(36).substring(2, 9)}_${Date.now().toString(36)}`;
}

/**
 * Load an uploaded PDF or Image file into an AssemblerDocument with rendered thumbnails
 */
export async function loadFileToAssembler(
  file: File,
  onProgress?: (progress: number, message: string) => void
): Promise<AssemblerDocument> {
  const fileId = generateAssemblerId('src');
  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);

  // Cache source file bytes
  sourceFilesCache.set(fileId, {
    id: fileId,
    bytes: bytes,
    mime: file.type || 'application/pdf',
    name: file.name,
  });

  const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

  if (isPdf) {
    if (onProgress) onProgress(15, `Initializing PDF.js engine for ${file.name}...`);
    const pdfjs = await getPdfJs();

    // Crucial: clone buffer so Web Worker cannot detach our master cached bytes
    const workerBytes = bytes.slice();
    const loadingTask = pdfjs.getDocument({ data: workerBytes });
    const pdfDoc = await loadingTask.promise;
    const numPages = pdfDoc.numPages;

    const pages: AssemblerPage[] = [];

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      if (onProgress) {
        const percent = 20 + Math.round((pageNum / numPages) * 75);
        onProgress(percent, `Rendering thumbnail for page ${pageNum} of ${numPages}...`);
      }

      const page = await pdfDoc.getPage(pageNum);
      // Scale down to ~160px width for snappy thumbnail rendering
      const rawViewport = page.getViewport({ scale: 1.0 });
      const thumbScale = Math.min(0.35, 180 / rawViewport.width);
      const viewport = page.getViewport({ scale: thumbScale });

      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext('2d');

      let thumbnailUrl = '';
      if (ctx) {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        await page.render({
          canvasContext: ctx,
          viewport,
        }).promise;
        thumbnailUrl = canvas.toDataURL('image/jpeg', 0.8);
      }

      pages.push({
        id: generateAssemblerId('page'),
        sourceDocId: fileId,
        sourcePageIndex: pageNum - 1, // 0-based index
        sourceType: 'pdf',
        rotation: 0,
        width: rawViewport.width,
        height: rawViewport.height,
        thumbnailUrl,
        selected: false,
      });
    }

    if (onProgress) onProgress(100, 'Document loaded successfully');

    return {
      id: generateAssemblerId('doc'),
      name: file.name,
      originalFileName: file.name,
      pages,
      selected: true,
      isCollapsed: false,
      createdAt: Date.now(),
    };
  } else {
    // Image file (JPG, PNG, WebP)
    if (onProgress) onProgress(50, `Loading image ${file.name}...`);
    const blob = new Blob([bytes], { type: file.type });
    const objectUrl = URL.createObjectURL(blob);

    // Create thumbnail from image
    const img = new Image();
    img.src = objectUrl;
    await new Promise((resolve) => {
      img.onload = resolve;
      img.onerror = resolve;
    });

    const maxDim = 180;
    const scale = Math.min(1, maxDim / Math.max(img.width || 1, img.height || 1));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round((img.width || 612) * scale));
    canvas.height = Math.max(1, Math.round((img.height || 792) * scale));
    const ctx = canvas.getContext('2d');
    let thumbUrl = objectUrl;

    if (ctx && img.width && img.height) {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      thumbUrl = canvas.toDataURL('image/jpeg', 0.85);
    }

    const page: AssemblerPage = {
      id: generateAssemblerId('page'),
      sourceDocId: fileId,
      sourcePageIndex: 0,
      sourceType: 'image',
      rotation: 0,
      width: img.width || 612,
      height: img.height || 792,
      thumbnailUrl: thumbUrl,
      selected: false,
    };

    if (onProgress) onProgress(100, 'Image loaded successfully');

    return {
      id: generateAssemblerId('doc'),
      name: file.name,
      originalFileName: file.name,
      pages: [page],
      selected: true,
      isCollapsed: false,
      createdAt: Date.now(),
    };
  }
}

/**
 * Creates an empty, new document container
 */
export function createEmptyAssemblerDocument(name?: string): AssemblerDocument {
  return {
    id: generateAssemblerId('doc'),
    name: name || `New_Document_${Math.floor(100 + Math.random() * 900)}.pdf`,
    pages: [],
    selected: true,
    isCollapsed: false,
    isModified: true,
    createdAt: Date.now(),
  };
}

/**
 * Compiles an array of AssemblerPages into a final PDF Blob
 */
export async function compilePagesToPdf(pages: AssemblerPage[]): Promise<Blob> {
  if (pages.length === 0) {
    throw new Error('No pages selected to generate PDF');
  }

  const outDoc = await PDFDocument.create();
  const loadedPdfDocsCache = new Map<string, PDFDocument>();

  for (const page of pages) {
    const srcRecord = sourceFilesCache.get(page.sourceDocId);
    if (!srcRecord) continue;

    if (page.sourceType === 'pdf') {
      // Load source PDF into pdf-lib if not already cached
      let sourcePdf = loadedPdfDocsCache.get(page.sourceDocId);
      if (!sourcePdf) {
        sourcePdf = await PDFDocument.load(srcRecord.bytes, { ignoreEncryption: true });
        loadedPdfDocsCache.set(page.sourceDocId, sourcePdf);
      }

      if (page.sourcePageIndex < sourcePdf.getPageCount()) {
        const [copiedPage] = await outDoc.copyPages(sourcePdf, [page.sourcePageIndex]);
        // Apply custom rotation
        if (page.rotation !== 0) {
          const currentRotation = copiedPage.getRotation().angle;
          copiedPage.setRotation(degrees((currentRotation + page.rotation) % 360));
        }
        outDoc.addPage(copiedPage);
      }
    } else if (page.sourceType === 'image') {
      // Embed Image
      let embeddedImg;
      if (srcRecord.mime === 'image/png') {
        embeddedImg = await outDoc.embedPng(srcRecord.bytes);
      } else {
        embeddedImg = await outDoc.embedJpg(srcRecord.bytes);
      }

      const imgWidth = embeddedImg.width;
      const imgHeight = embeddedImg.height;

      // Create page with matching dimensions
      const imgPage = outDoc.addPage([imgWidth, imgHeight]);
      imgPage.drawImage(embeddedImg, {
        x: 0,
        y: 0,
        width: imgWidth,
        height: imgHeight,
      });

      if (page.rotation !== 0) {
        imgPage.setRotation(degrees(page.rotation % 360));
      }
    }
  }

  const finalPdfBytes = await outDoc.save();
  return new Blob([finalPdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
}

/**
 * Merge multiple documents consecutively into one PDF
 */
export async function mergeDocuments(documents: AssemblerDocument[]): Promise<Blob> {
  const allPages = documents.flatMap((doc) => doc.pages);
  return compilePagesToPdf(allPages);
}

/**
 * Merge documents alternately (interleaving pages)
 * Example: Doc A (A1, A2, A3), Doc B (B1, B2) -> A1, B1, A2, B2, A3
 */
export async function mergeDocumentsAlternately(documents: AssemblerDocument[]): Promise<Blob> {
  const maxPages = Math.max(...documents.map((d) => d.pages.length), 0);
  const interleavedPages: AssemblerPage[] = [];

  for (let i = 0; i < maxPages; i++) {
    for (const doc of documents) {
      if (doc.pages[i]) {
        interleavedPages.push(doc.pages[i]);
      }
    }
  }

  return compilePagesToPdf(interleavedPages);
}

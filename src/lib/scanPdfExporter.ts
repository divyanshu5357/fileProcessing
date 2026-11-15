import { PDFDocument } from 'pdf-lib';
import {
  ScanPage,
  ScanPageSettings,
  WatermarkSettings,
  PageNumberSettings,
  DocumentMetadata,
  ExportProgress,
  PaperSize,
  PAPER_SIZE_OPTIONS,
} from '@/types/scanStudio';
import { renderFullScannedPage } from './scanEngine';
import { createZip } from './utils';

/**
 * Converts a canvas element to a JPEG Uint8Array at specified quality
 */
async function canvasToJpegBytes(canvas: HTMLCanvasElement, quality: number = 0.85): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      async (blob) => {
        if (!blob) {
          reject(new Error('Failed to convert canvas to blob'));
          return;
        }
        const arrayBuffer = await blob.arrayBuffer();
        resolve(new Uint8Array(arrayBuffer));
      },
      'image/jpeg',
      quality
    );
  });
}

/**
 * Converts a canvas element to a PNG Blob
 */
async function canvasToPngBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Failed to convert canvas to PNG blob'));
    }, 'image/png');
  });
}

/**
 * Converts a canvas element to a JPEG Blob
 */
async function canvasToJpegBlob(canvas: HTMLCanvasElement, quality: number = 0.85): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Failed to convert canvas to JPEG blob'));
    }, 'image/jpeg', quality);
  });
}

/**
 * Exports multiple ScanPage items to a scanned PDF using pdf-lib
 */
export async function exportScannedPdf(
  pages: ScanPage[],
  globalSettings: ScanPageSettings,
  watermark: WatermarkSettings,
  pageNumbers: PageNumberSettings,
  metadata: DocumentMetadata,
  jpegQuality: number = 0.85,
  onProgress?: (progress: ExportProgress) => void,
  cancelRef?: { current: boolean }
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();

  // Set document metadata
  if (metadata.title) pdfDoc.setTitle(metadata.title);
  if (metadata.author) pdfDoc.setAuthor(metadata.author);
  if (metadata.subject) pdfDoc.setSubject(metadata.subject);
  if (metadata.keywords) {
    pdfDoc.setKeywords(metadata.keywords.split(',').map((k) => k.trim()));
  }
  pdfDoc.setProducer('Gyanvatsala Scan Studio');
  pdfDoc.setCreator('Gyanvatsala Document Platform');
  pdfDoc.setCreationDate(new Date());

  const totalPages = pages.length;

  for (let i = 0; i < totalPages; i++) {
    // Check if user requested cancellation
    if (cancelRef?.current) {
      throw new Error('Export cancelled by user');
    }

    const page = pages[i];
    const pageIndex = i + 1;

    if (onProgress) {
      onProgress({
        isExporting: true,
        currentPage: pageIndex,
        totalPages,
        progressPercent: Math.round((i / totalPages) * 100),
        statusText: `Transforming page ${pageIndex} of ${totalPages}...`,
        canCancel: true,
      });
    }

    if (!page.originalCanvas) {
      continue;
    }

    // Determine settings to use
    const effectiveSettings = page.useGlobalSettings ? globalSettings : page.settings;

    // Full-resolution rendering
    const scannedCanvas = renderFullScannedPage(
      page.originalCanvas,
      effectiveSettings,
      watermark,
      pageNumbers,
      pageIndex,
      totalPages
    );

    // Convert to JPEG bytes
    const jpegBytes = await canvasToJpegBytes(scannedCanvas, jpegQuality);
    const embeddedImage = await pdfDoc.embedJpg(jpegBytes);

    const paperSize = effectiveSettings.paperSize || 'auto';
    const ppi = effectiveSettings.resolution || 150;

    let pageWidth: number;
    let pageHeight: number;

    const paperOption = PAPER_SIZE_OPTIONS.find((p) => p.id === paperSize);

    if (paperSize !== 'auto' && paperOption && paperOption.dims) {
      const [stdW, stdH] = paperOption.dims;
      const isLandscape = embeddedImage.width > embeddedImage.height;
      pageWidth = isLandscape ? stdH : stdW;
      pageHeight = isLandscape ? stdW : stdH;
    } else {
      // Auto: preserves exact original dimensions in points (72 DPI PDF standard)
      pageWidth = (embeddedImage.width / ppi) * 72;
      pageHeight = (embeddedImage.height / ppi) * 72;
    }

    const pdfPage = pdfDoc.addPage([pageWidth, pageHeight]);

    // Scale image into page while maintaining aspect ratio and centering
    const imgRatio = embeddedImage.width / embeddedImage.height;
    const pageRatio = pageWidth / pageHeight;

    let drawW = pageWidth;
    let drawH = pageHeight;
    let drawX = 0;
    let drawY = 0;

    if (Math.abs(imgRatio - pageRatio) < 0.01) {
      drawW = pageWidth;
      drawH = pageHeight;
    } else if (imgRatio > pageRatio) {
      drawW = pageWidth;
      drawH = pageWidth / imgRatio;
      drawY = (pageHeight - drawH) / 2;
    } else {
      drawH = pageHeight;
      drawW = pageHeight * imgRatio;
      drawX = (pageWidth - drawW) / 2;
    }

    pdfPage.drawImage(embeddedImage, {
      x: drawX,
      y: drawY,
      width: drawW,
      height: drawH,
    });

    // Yield control briefly to allow browser UI updates
    await new Promise((resolve) => setTimeout(resolve, 15));
  }

  if (onProgress) {
    onProgress({
      isExporting: true,
      currentPage: totalPages,
      totalPages,
      progressPercent: 99,
      statusText: 'Assembling and saving final PDF document...',
      canCancel: false,
    });
  }

  const pdfBytes = await pdfDoc.save();

  if (onProgress) {
    onProgress({
      isExporting: false,
      currentPage: totalPages,
      totalPages,
      progressPercent: 100,
      statusText: 'Completed',
      canCancel: false,
    });
  }

  return pdfBytes;
}

/**
 * Exports multiple ScanPage items to a ZIP archive (PNG or JPEG images)
 */
export async function exportScannedZip(
  pages: ScanPage[],
  globalSettings: ScanPageSettings,
  watermark: WatermarkSettings,
  pageNumbers: PageNumberSettings,
  format: 'png' | 'jpeg' = 'png',
  quality: number = 0.85,
  onProgress?: (progress: ExportProgress) => void,
  cancelRef?: { current: boolean }
): Promise<Blob> {
  const filesToZip: { name: string; blob: Blob }[] = [];
  const totalPages = pages.length;

  for (let i = 0; i < totalPages; i++) {
    if (cancelRef?.current) {
      throw new Error('Export cancelled by user');
    }

    const page = pages[i];
    const pageIndex = i + 1;

    if (onProgress) {
      onProgress({
        isExporting: true,
        currentPage: pageIndex,
        totalPages,
        progressPercent: Math.round((i / totalPages) * 100),
        statusText: `Rendering page ${pageIndex} of ${totalPages}...`,
        canCancel: true,
      });
    }

    if (!page.originalCanvas) continue;

    const effectiveSettings = page.useGlobalSettings ? globalSettings : page.settings;
    const scannedCanvas = renderFullScannedPage(
      page.originalCanvas,
      effectiveSettings,
      watermark,
      pageNumbers,
      pageIndex,
      totalPages
    );

    const ext = format === 'png' ? 'png' : 'jpg';
    const blob = format === 'png' ? await canvasToPngBlob(scannedCanvas) : await canvasToJpegBlob(scannedCanvas, quality);
    filesToZip.push({
      name: `page_${pageIndex}.${ext}`,
      blob,
    });
  }

  return await createZip(filesToZip);
}

/**
 * Downloads a Blob directly to the user's browser
 */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Exports a single page as a standalone image blob (JPEG)
 */
export async function exportSinglePageImage(
  page: ScanPage,
  globalSettings: ScanPageSettings,
  watermark: WatermarkSettings,
  pageNumbers: PageNumberSettings,
  totalPages: number = 1,
  jpegQuality: number = 0.85
): Promise<Blob> {
  if (!page.originalCanvas) {
    throw new Error('Original canvas not available for page');
  }

  const effectiveSettings = page.useGlobalSettings ? globalSettings : page.settings;
  const scannedCanvas = renderFullScannedPage(
    page.originalCanvas,
    effectiveSettings,
    watermark,
    pageNumbers,
    page.pageNumber,
    totalPages
  );

  return new Promise<Blob>((resolve, reject) => {
    scannedCanvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Failed to export page image'));
      },
      'image/jpeg',
      jpegQuality
    );
  });
}

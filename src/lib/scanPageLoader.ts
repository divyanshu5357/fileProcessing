import { getPdfJs } from './pdfjsLoader';
import { ScanPage, DEFAULT_PAGE_SETTINGS } from '@/types/scanStudio';

/**
 * Creates a thumbnail data URL from a canvas
 */
function createThumbnail(canvas: HTMLCanvasElement, maxDim: number = 240): string {
  const thumb = document.createElement('canvas');
  const scale = Math.min(maxDim / canvas.width, maxDim / canvas.height, 1);
  thumb.width = Math.max(1, Math.round(canvas.width * scale));
  thumb.height = Math.max(1, Math.round(canvas.height * scale));
  const ctx = thumb.getContext('2d');
  if (ctx) {
    ctx.drawImage(canvas, 0, 0, thumb.width, thumb.height);
    return thumb.toDataURL('image/jpeg', 0.65);
  }
  return '';
}

/**
 * Loads a PDF file and extracts all pages as ScanPage objects
 */
export async function loadPdfToScanPages(
  file: File,
  onProgress?: (current: number, total: number) => void
): Promise<ScanPage[]> {
  const pdfjs = await getPdfJs();
  const arrayBuffer = await file.arrayBuffer();

  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(arrayBuffer),
  });

  const pdfDoc = await loadingTask.promise;
  const numPages = pdfDoc.numPages;
  const pages: ScanPage[] = [];

  for (let i = 1; i <= numPages; i++) {
    if (onProgress) {
      onProgress(i, numPages);
    }

    const page = await pdfDoc.getPage(i);
    // Render at crisp high-resolution scale 2.0 for razor-sharp text clarity with natural page rotation
    const viewport = page.getViewport({ scale: 2.0, rotation: page.rotate || 0 });

    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      continue;
    }

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // PDF background should default to pure white
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    await page.render({
      canvasContext: ctx,
      viewport: viewport,
    }).promise;

    const thumbnailUrl = createThumbnail(canvas);

    pages.push({
      id: `page-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 7)}`,
      pageNumber: i,
      originalCanvas: canvas,
      originalWidth: canvas.width,
      originalHeight: canvas.height,
      thumbnailUrl,
      settings: {
        ...DEFAULT_PAGE_SETTINGS,
        noiseSeed: (i * 1337 + 42) % 100000,
      },
      useGlobalSettings: true,
    });
  }

  return pages;
}

/**
 * Loads an image file (JPG, PNG, WebP) as a ScanPage
 */
export async function loadImageToScanPage(file: File, pageNumber: number = 1): Promise<ScanPage> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to create canvas context'));
        return;
      }

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);

      const thumbnailUrl = createThumbnail(canvas);

      resolve({
        id: `img-${Date.now()}-${pageNumber}-${Math.random().toString(36).substring(2, 7)}`,
        pageNumber,
        originalCanvas: canvas,
        originalWidth: canvas.width,
        originalHeight: canvas.height,
        thumbnailUrl,
        settings: {
          ...DEFAULT_PAGE_SETTINGS,
          noiseSeed: (pageNumber * 1337 + 42) % 100000,
        },
        useGlobalSettings: true,
      });
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error(`Failed to load image: ${file.name}`));
    };

    img.src = objectUrl;
  });
}

/**
 * Loads multiple files (both PDFs and image formats) and combines them into pages
 */
export async function loadFilesToScanPages(
  files: File[],
  onProgress?: (msg: string, percent: number) => void
): Promise<ScanPage[]> {
  const allPages: ScanPage[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

    if (onProgress) {
      onProgress(`Processing ${file.name} (${i + 1}/${files.length})...`, Math.round((i / files.length) * 100));
    }

    if (isPdf) {
      const pdfPages = await loadPdfToScanPages(file);
      allPages.push(...pdfPages);
    } else {
      const page = await loadImageToScanPage(file, allPages.length + 1);
      allPages.push(page);
    }
  }

  // Renumber pages sequentially
  return allPages.map((page, index) => ({
    ...page,
    pageNumber: index + 1,
  }));
}

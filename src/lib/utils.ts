import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import JSZip from 'jszip';
import { PDFDocument } from 'pdf-lib';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 B';
  if (bytes < 0) return '0 B';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const safeI = Math.min(i, sizes.length - 1);

  return `${parseFloat((bytes / Math.pow(k, safeI)).toFixed(dm))} ${sizes[safeI]}`;
}

export function formatDimensions(w: number, h: number): string {
  return `${Math.round(w)} × ${Math.round(h)} px`;
}

export function calculateSavings(originalBytes: number, newBytes: number) {
  if (!originalBytes || !newBytes) return { percent: 0, text: '0%', isSaved: false };
  const diff = originalBytes - newBytes;
  const percent = Math.round((diff / originalBytes) * 100);
  if (percent > 0) {
    return {
      percent,
      text: `-${percent}% (${formatBytes(diff)} saved)`,
      isSaved: true,
    };
  }
  if (percent < 0) {
    return {
      percent: Math.abs(percent),
      text: `+${Math.abs(percent)}% larger`,
      isSaved: false,
    };
  }
  return { percent: 0, text: 'No change', isSaved: false };
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(new Error('Failed to load image: ' + err));
    img.src = src;
  });
}

export function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string = 'image/png',
  quality: number = 0.92
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Canvas to Blob conversion failed'));
        }
      },
      type,
      quality
    );
  });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export async function copyBlobToClipboard(blob: Blob): Promise<boolean> {
  try {
    if (!navigator.clipboard || !navigator.clipboard.write) {
      throw new Error('Clipboard API not supported');
    }

    // Modern browsers require image/png for ClipboardItem
    let pngBlob = blob;
    if (blob.type !== 'image/png') {
      const img = await loadImage(URL.createObjectURL(blob));
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        pngBlob = await canvasToBlob(canvas, 'image/png', 1.0);
      }
    }

    const item = new ClipboardItem({ 'image/png': pngBlob });
    await navigator.clipboard.write([item]);
    return true;
  } catch (err) {
    console.warn('Failed to copy to clipboard directly:', err);
    return false;
  }
}

export async function createZip(items: { name: string; blob: Blob }[]): Promise<Blob> {
  const zip = new JSZip();
  const folder = zip.folder('pixelkit_processed') || zip;

  // Track filenames to avoid collision
  const seenNames = new Map<string, number>();

  for (const item of items) {
    let finalName = item.name;
    if (seenNames.has(finalName)) {
      const count = seenNames.get(finalName)! + 1;
      seenNames.set(finalName, count);
      const dotIndex = finalName.lastIndexOf('.');
      if (dotIndex !== -1) {
        finalName = `${finalName.slice(0, dotIndex)}_${count}${finalName.slice(dotIndex)}`;
      } else {
        finalName = `${finalName}_${count}`;
      }
    } else {
      seenNames.set(finalName, 0);
    }

    folder.file(finalName, item.blob);
  }

  return await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });
}

export async function exportImagesToPdf(
  images: { blob: Blob; width: number; height: number; name?: string }[],
  pageSize: 'fit' | 'a4' | 'letter' = 'fit'
): Promise<Blob> {
  const pdfDoc = await PDFDocument.create();

  for (const imgData of images) {
    const arrayBuffer = await imgData.blob.arrayBuffer();
    let embeddedImg;

    if (imgData.blob.type === 'image/jpeg' || imgData.blob.type === 'image/jpg') {
      embeddedImg = await pdfDoc.embedJpg(arrayBuffer);
    } else {
      // For PNG, WebP, etc., embed as PNG (or convert to PNG if needed)
      if (imgData.blob.type === 'image/png') {
        embeddedImg = await pdfDoc.embedPng(arrayBuffer);
      } else {
        // Fallback convert to PNG
        const img = await loadImage(URL.createObjectURL(imgData.blob));
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const pngBlob = await canvasToBlob(canvas, 'image/png');
          const pngBuffer = await pngBlob.arrayBuffer();
          embeddedImg = await pdfDoc.embedPng(pngBuffer);
        } else {
          continue;
        }
      }
    }

    if (pageSize === 'a4') {
      // Standard A4 is 595.28 x 841.89 pt (72 points per inch)
      const page = pdfDoc.addPage([595.28, 841.89]);
      const pageWidth = 595.28;
      const pageHeight = 841.89;
      const margin = 36; // 0.5 inch margin
      const availWidth = pageWidth - margin * 2;
      const availHeight = pageHeight - margin * 2;

      const scale = Math.min(availWidth / embeddedImg.width, availHeight / embeddedImg.height, 1);
      const drawWidth = embeddedImg.width * scale;
      const drawHeight = embeddedImg.height * scale;
      const x = (pageWidth - drawWidth) / 2;
      const y = (pageHeight - drawHeight) / 2;

      page.drawImage(embeddedImg, { x, y, width: drawWidth, height: drawHeight });
    } else {
      // Page fits the image dimension directly
      const page = pdfDoc.addPage([embeddedImg.width, embeddedImg.height]);
      page.drawImage(embeddedImg, {
        x: 0,
        y: 0,
        width: embeddedImg.width,
        height: embeddedImg.height,
      });
    }
  }

  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
}

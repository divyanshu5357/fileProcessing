import {
  ScanPageSettings,
  WatermarkSettings,
  PageNumberSettings,
  PaperColor,
  PAPER_SIZE_OPTIONS,
} from '@/types/scanStudio';

// Mulberry32 deterministic 32-bit PRNG
export function mulberry32(seed: number): () => number {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Applies LookScanned document scanning effects onto a target canvas
 */
export function applyScanEffects(
  sourceCanvas: HTMLCanvasElement,
  settings: ScanPageSettings,
  targetWidth?: number,
  targetHeight?: number,
  pageIndex: number = 1
): HTMLCanvasElement {
  // If paperSize is auto or not set, preserve the exact original dimensions so no text is ever cut off!
  let width = targetWidth;
  let height = targetHeight;

  if (!width || !height) {
    if (settings.paperSize && settings.paperSize !== 'auto' && settings.paperSize !== 'custom') {
      const option = PAPER_SIZE_OPTIONS.find((p) => p.id === settings.paperSize);
      if (option && option.dims) {
        const ppi = settings.resolution || 150;
        const [stdW, stdH] = option.dims;
        const isLandscape = sourceCanvas.width > sourceCanvas.height;
        const ptW = isLandscape ? stdH : stdW;
        const ptH = isLandscape ? stdW : stdH;
        width = Math.round((ptW / 72) * ppi);
        height = Math.round((ptH / 72) * ppi);
      } else {
        width = sourceCanvas.width;
        height = sourceCanvas.height;
      }
    } else {
      width = sourceCanvas.width;
      height = sourceCanvas.height;
    }
  }

  const outputCanvas = document.createElement('canvas');
  outputCanvas.width = width;
  outputCanvas.height = height;
  const ctx = outputCanvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return sourceCanvas;

  // Initialize deterministic PRNG for this page
  const seed = (settings.noiseSeed || 42) + pageIndex * 997;
  const rng = mulberry32(seed);

  // 1. Fill base paper background (white or warm yellowish)
  const yellowFactor = (settings.yellowish ?? 0) / 100;
  const baseR = 255;
  const baseG = Math.max(200, Math.round(255 - yellowFactor * 16));
  const baseB = Math.max(160, Math.round(255 - yellowFactor * 36));
  ctx.fillStyle = `rgb(${baseR}, ${baseG}, ${baseB})`;
  ctx.fillRect(0, 0, width, height);

  // 2. Flatbed Scanner Border (if enabled)
  if (settings.border) {
    ctx.save();
    const borderThickness = Math.max(8, Math.round(width * 0.015));
    ctx.strokeStyle = 'rgba(20, 22, 28, 0.85)';
    ctx.lineWidth = borderThickness;
    ctx.strokeRect(borderThickness / 2, borderThickness / 2, width - borderThickness, height - borderThickness);
    ctx.restore();
  }

  // 3. Rotation with deterministic variance:
  // e.g. Rotate 1° + Variance ±0.5°
  const baseAngle = settings.rotate ?? (settings.skewAngle ?? 1);
  const variance = settings.rotateVariance ?? 0.5;
  const jitter = (rng() * 2 - 1) * variance;
  const totalAngleDeg = baseAngle + jitter;

  // Calculate scaled drawing dimensions (preserve aspect ratio perfectly)
  const availableW = settings.border ? width * 0.96 : width;
  const availableH = settings.border ? height * 0.96 : height;
  const scale = Math.min(availableW / sourceCanvas.width, availableH / sourceCanvas.height);
  const drawW = sourceCanvas.width * scale;
  const drawH = sourceCanvas.height * scale;

  ctx.save();
  ctx.translate(width / 2, height / 2);
  ctx.rotate((totalAngleDeg * Math.PI) / 180);

  // Optical lens softness (at 30%, blur is gentle ~0.24px to never compromise text legibility)
  const blurVal = settings.blur ?? 30;
  const blurPx = (blurVal / 100) * 0.75;
  if (blurPx > 0.05) {
    ctx.filter = `blur(${blurPx}px)`;
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(sourceCanvas, -drawW / 2, -drawH / 2, drawW, drawH);
  ctx.restore();
  ctx.filter = 'none';

  // 4. Pixel-level manipulation: Colorspace, Brightness, Contrast, Noise, Yellowish
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  // Normalized factors (LookScanned: 100% = 1.0 neutral)
  const colorspace =
    settings.colorspace ||
    (settings.colorMode === 'original'
      ? 'colorful'
      : settings.colorMode === 'black_and_white'
      ? 'black_and_white'
      : 'grayscale');

  const bFactor = (settings.brightness ?? 100) / 100; // 100% = 1.0
  const cFactor = (settings.contrast ?? 100) / 100;   // 100% = 1.0
  const noiseFactor = (settings.noise ?? 10) / 100;  // 10% = 0.1

  const isBw = colorspace === 'black_and_white';
  const isGrayscale = colorspace === 'grayscale';

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];

    // Colorspace conversion
    if (isBw) {
      // 1-bit high-contrast black & white (clear black text)
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      const val = gray < 140 ? 0 : 255;
      r = val;
      g = val;
      b = val;
    } else if (isGrayscale) {
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      r = gray;
      g = gray;
      b = gray;
    }

    // Contrast & Brightness adjustment (neutral at 100%)
    if (!isBw) {
      if (cFactor !== 1.0) {
        r = (r - 128) * cFactor + 128;
        g = (g - 128) * cFactor + 128;
        b = (b - 128) * cFactor + 128;
      }
      if (bFactor !== 1.0) {
        r = r * bFactor;
        g = g * bFactor;
        b = b * bFactor;
      }

      // Yellowish tone (adds warm paper aging)
      if (yellowFactor > 0) {
        r += yellowFactor * 16;
        g += yellowFactor * 8;
        b -= yellowFactor * 18;
      }
    }

    // Authentic scanner noise / sensor grain
    if (noiseFactor > 0) {
      const n = (rng() - 0.5) * noiseFactor * 32;
      r += n;
      g += n;
      b += n;

      // Rare subtle toner dust specks on bright paper
      if (r > 190 && rng() < noiseFactor * 0.025) {
        const speck = 50 + rng() * 40;
        r -= speck;
        g -= speck;
        b -= speck;
      }
    }

    // Clamp values
    data[i] = r < 0 ? 0 : r > 255 ? 255 : r;
    data[i + 1] = g < 0 ? 0 : g > 255 ? 255 : g;
    data[i + 2] = b < 0 ? 0 : b > 255 ? 255 : b;
  }

  ctx.putImageData(imageData, 0, 0);

  return outputCanvas;
}

/**
 * Renders watermark overlays (Text or Image)
 */
export function renderWatermark(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  settings: WatermarkSettings,
  pageNumber: number,
  totalPages: number
) {
  if (!settings || !settings.enabled) return;

  // 1. Text Watermark
  if (settings.type === 'text' && settings.text && settings.text.trim()) {
    ctx.save();
    ctx.globalAlpha = settings.opacity ?? 0.25;
    ctx.fillStyle = settings.color || '#ef4444';
    ctx.font = `bold ${settings.fontSize || 48}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const text = settings.text
      .replace('{page}', String(pageNumber))
      .replace('{total}', String(totalPages));

    if (settings.position === 'diagonal') {
      ctx.translate(width / 2, height / 2);
      ctx.rotate(((settings.rotation ?? -35) * Math.PI) / 180);
      ctx.fillText(text, 0, 0);
    } else if (settings.position === 'center') {
      ctx.fillText(text, width / 2, height / 2);
    } else if (settings.position === 'header') {
      ctx.fillText(text, width / 2, height * 0.08);
    } else if (settings.position === 'footer') {
      ctx.fillText(text, width / 2, height * 0.94);
    }
    ctx.restore();
  }

  // 2. Image Watermark
  const imgUrl = settings.imageUrl || settings.imageStampUrl;
  if ((settings.type === 'image' || imgUrl) && imgUrl) {
    const img = new Image();
    img.src = imgUrl;
    if (img.complete && img.naturalWidth > 0) {
      ctx.save();
      ctx.globalAlpha = settings.opacity ?? 0.6;
      const stampScale = (settings.imageScale ?? settings.imageStampScale ?? 0.8) * (width / 1200);
      const stampW = img.naturalWidth * stampScale;
      const stampH = img.naturalHeight * stampScale;

      let sx = width - stampW - 40;
      let sy = height - stampH - 40;

      if (settings.position === 'center' || settings.imageStampPosition === 'center') {
        sx = (width - stampW) / 2;
        sy = (height - stampH) / 2;
      } else if (settings.imageStampPosition === 'bottom-left') {
        sx = 40;
        sy = height - stampH - 40;
      } else if (settings.imageStampPosition === 'top-right') {
        sx = width - stampW - 40;
        sy = 40;
      }

      ctx.drawImage(img, sx, sy, stampW, stampH);
      ctx.restore();
    }
  }
}

/**
 * Renders page numbers
 */
export function renderPageNumbers(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  settings: PageNumberSettings,
  pageNumber: number,
  totalPages: number
) {
  if (!settings || !settings.enabled) return;

  ctx.save();
  ctx.fillStyle = settings.color || '#475569';
  ctx.font = `${settings.fontSize || 12}px sans-serif`;

  let formattedText: string = settings.format || 'Page {page} of {total}';
  formattedText = formattedText
    .replace('{page}', String(pageNumber))
    .replace('{total}', String(totalPages));

  const margin = 28;

  if (settings.position === 'bottom-center') {
    ctx.textAlign = 'center';
    ctx.fillText(formattedText, width / 2, height - margin);
  } else if (settings.position === 'bottom-right') {
    ctx.textAlign = 'right';
    ctx.fillText(formattedText, width - margin, height - margin);
  } else if (settings.position === 'top-right') {
    ctx.textAlign = 'right';
    ctx.fillText(formattedText, width - margin, margin + (settings.fontSize || 12));
  }
  ctx.restore();
}

/**
 * Combines image effects, watermarks, and page numbers into a final rendered canvas
 */
export function renderFullScannedPage(
  sourceCanvas: HTMLCanvasElement,
  settings: ScanPageSettings,
  watermarkSettings?: WatermarkSettings,
  pageNumberSettings?: PageNumberSettings,
  pageNumber: number = 1,
  totalPages: number = 1,
  targetWidth?: number,
  targetHeight?: number
): HTMLCanvasElement {
  // Apply base scan effects with page-specific variance
  const scannedCanvas = applyScanEffects(sourceCanvas, settings, targetWidth, targetHeight, pageNumber);
  const ctx = scannedCanvas.getContext('2d');
  if (!ctx) return scannedCanvas;

  // Apply watermark overlays
  if (watermarkSettings && watermarkSettings.enabled) {
    renderWatermark(ctx, scannedCanvas.width, scannedCanvas.height, watermarkSettings, pageNumber, totalPages);
  }

  // Apply page numbers
  if (pageNumberSettings && pageNumberSettings.enabled) {
    renderPageNumbers(ctx, scannedCanvas.width, scannedCanvas.height, pageNumberSettings, pageNumber, totalPages);
  }

  return scannedCanvas;
}

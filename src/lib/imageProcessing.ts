import imageCompression from 'browser-image-compression';
import {
  CompressSettings,
  ResizeSettings,
  ConvertSettings,
  CropSettings,
  RotateSettings,
  BeautifySettings,
  PassportSettings,
} from '@/types';
import { canvasToBlob, loadImage, exportImagesToPdf } from './utils';
import { PASSPORT_PRESETS, PASSPORT_BG_COLORS } from './passportTemplates';

export interface ProcessResult {
  blob: Blob;
  width: number;
  height: number;
  size: number;
}

// 1. COMPRESS
export async function compressImage(
  file: File,
  settings: CompressSettings
): Promise<ProcessResult> {
  try {
    const options: any = {
      maxIteration: 15,
      useWebWorker: true,
      initialQuality: Math.max(0.05, settings.quality / 100),
    };

    if (settings.targetSizeKb > 0) {
      options.maxSizeMB = settings.targetSizeKb / 1024;
    }

    if (settings.maxDimension > 0) {
      options.maxWidthOrHeight = settings.maxDimension;
    }

    if (settings.format !== 'original') {
      options.fileType = settings.format;
    }

    const compressedFile = await imageCompression(file, options);
    const img = await loadImage(URL.createObjectURL(compressedFile));

    return {
      blob: compressedFile,
      width: img.naturalWidth,
      height: img.naturalHeight,
      size: compressedFile.size,
    };
  } catch (err) {
    console.warn('browser-image-compression failed, falling back to Canvas:', err);
    // Fallback using Canvas
    const img = await loadImage(URL.createObjectURL(file));
    const canvas = document.createElement('canvas');

    let w = img.naturalWidth;
    let h = img.naturalHeight;
    if (settings.maxDimension > 0 && (w > settings.maxDimension || h > settings.maxDimension)) {
      if (w > h) {
        h = Math.round((h * settings.maxDimension) / w);
        w = settings.maxDimension;
      } else {
        w = Math.round((w * settings.maxDimension) / h);
        h = settings.maxDimension;
      }
    }

    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, w, h);

    const mime = settings.format === 'original' ? (file.type || 'image/jpeg') : settings.format;
    const blob = await canvasToBlob(canvas, mime, settings.quality / 100);

    return {
      blob,
      width: w,
      height: h,
      size: blob.size,
    };
  }
}

// 2. RESIZE
export async function resizeImage(
  file: File,
  settings: ResizeSettings
): Promise<ProcessResult> {
  const img = await loadImage(URL.createObjectURL(file));
  let targetWidth = settings.width;
  let targetHeight = settings.height;

  if (settings.mode === 'percentage') {
    const scale = settings.percentage / 100;
    targetWidth = Math.max(1, Math.round(img.naturalWidth * scale));
    targetHeight = Math.max(1, Math.round(img.naturalHeight * scale));
  } else if (settings.mode === 'preset') {
    // Presets handled by passing width/height
    targetWidth = settings.width;
    targetHeight = settings.height;
  }

  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d')!;

  if (settings.smoothing === 'pixelated') {
    ctx.imageSmoothingEnabled = false;
  } else {
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
  }
  ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

  const mime = file.type || 'image/png';
  const blob = await canvasToBlob(canvas, mime, 0.95);

  return {
    blob,
    width: targetWidth,
    height: targetHeight,
    size: blob.size,
  };
}

// 3. CONVERT
export async function convertImage(
  file: File,
  settings: ConvertSettings
): Promise<ProcessResult> {
  const img = await loadImage(URL.createObjectURL(file));
  const w = img.naturalWidth;
  const h = img.naturalHeight;

  if (settings.format === 'svg') {
    // Generate SVG wrapper
    const reader = new FileReader();
    const dataUrl = await new Promise<string>((res) => {
      reader.onload = () => res(reader.result as string);
      reader.readAsDataURL(file);
    });

    const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
  <image href="${dataUrl}" width="${w}" height="${h}" />
</svg>`;
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    return { blob, width: w, height: h, size: blob.size };
  }

  if (settings.format === 'pdf') {
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(img, 0, 0);
    const pngBlob = await canvasToBlob(canvas, 'image/png');
    const pdfBlob = await exportImagesToPdf([{ blob: pngBlob, width: w, height: h, name: file.name }]);
    return { blob: pdfBlob, width: w, height: h, size: pdfBlob.size };
  }

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  // If converting to JPEG or AVIF and bgColor is specified, fill background
  if (settings.format === 'image/jpeg' || settings.bgColor) {
    ctx.fillStyle = settings.bgColor || '#FFFFFF';
    ctx.fillRect(0, 0, w, h);
  }

  ctx.drawImage(img, 0, 0);
  const blob = await canvasToBlob(canvas, settings.format, settings.quality / 100);

  return {
    blob,
    width: w,
    height: h,
    size: blob.size,
  };
}

// 4. CROP
export async function cropImage(
  file: File,
  settings: CropSettings
): Promise<ProcessResult> {
  const img = await loadImage(URL.createObjectURL(file));
  const iw = img.naturalWidth;
  const ih = img.naturalHeight;

  // Convert normalized percentages to pixel values
  const sx = Math.max(0, Math.round((settings.cropBox.x / 100) * iw));
  const sy = Math.max(0, Math.round((settings.cropBox.y / 100) * ih));
  const sw = Math.min(iw - sx, Math.max(1, Math.round((settings.cropBox.width / 100) * iw)));
  const sh = Math.min(ih - sy, Math.max(1, Math.round((settings.cropBox.height / 100) * ih)));

  const canvas = document.createElement('canvas');
  canvas.width = sw;
  canvas.height = sh;
  const ctx = canvas.getContext('2d')!;

  if (settings.aspect === 'round') {
    // Circle clipping mask
    ctx.beginPath();
    ctx.arc(sw / 2, sh / 2, Math.min(sw, sh) / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
  }

  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);

  const mime = settings.aspect === 'round' ? 'image/png' : (file.type || 'image/png');
  const blob = await canvasToBlob(canvas, mime, 0.95);

  return {
    blob,
    width: sw,
    height: sh,
    size: blob.size,
  };
}

// 5. ROTATE & FLIP
export async function rotateFlipImage(
  file: File,
  settings: RotateSettings
): Promise<ProcessResult> {
  const img = await loadImage(URL.createObjectURL(file));
  const w = img.naturalWidth;
  const h = img.naturalHeight;

  const totalAngleDeg = (settings.rotation + settings.fineAngle) % 360;
  const rad = (totalAngleDeg * Math.PI) / 180;

  // Calculate new canvas bounding box after rotation
  const cos = Math.abs(Math.cos(rad));
  const sin = Math.abs(Math.sin(rad));
  const newW = Math.round(w * cos + h * sin);
  const newH = Math.round(w * sin + h * cos);

  const canvas = document.createElement('canvas');
  canvas.width = newW;
  canvas.height = newH;
  const ctx = canvas.getContext('2d')!;

  if (settings.bgColor && settings.bgColor !== 'transparent') {
    ctx.fillStyle = settings.bgColor;
    ctx.fillRect(0, 0, newW, newH);
  }

  ctx.translate(newW / 2, newH / 2);
  ctx.rotate(rad);
  ctx.scale(settings.flipH ? -1 : 1, settings.flipV ? -1 : 1);
  ctx.drawImage(img, -w / 2, -h / 2);

  const mime = file.type || 'image/png';
  const blob = await canvasToBlob(canvas, mime, 0.95);

  return {
    blob,
    width: newW,
    height: newH,
    size: blob.size,
  };
}

// 6. BEAUTIFY SCREENSHOT
export const GRADIENTS = [
  { id: 'aurora', name: 'Deep Aurora', colors: ['#0F172A', '#065F46', '#0284C7'] },
  { id: 'sunset', name: 'Sunset Glow', colors: ['#312E81', '#9333EA', '#F43F5E'] },
  { id: 'cyber', name: 'Cyberpunk', colors: ['#18181B', '#EC4899', '#8B5CF6'] },
  { id: 'midnight', name: 'Midnight Blue', colors: ['#020617', '#1E293B', '#3B82F6'] },
  { id: 'velvet', name: 'Royal Velvet', colors: ['#4A044E', '#86198F', '#E879F9'] },
  { id: 'clean', name: 'Minimal Slate', colors: ['#0F172A', '#1E293B', '#334155'] },
  { id: 'peach', name: 'Warm Peach', colors: ['#431407', '#EA580C', '#FBBF24'] },
  { id: 'emerald', name: 'Forest Mint', colors: ['#064E3B', '#059669', '#34D399'] },
];

export async function beautifyScreenshot(
  file: File,
  settings: BeautifySettings
): Promise<ProcessResult> {
  const img = await loadImage(URL.createObjectURL(file));
  const scale = settings.exportScale || 1;
  const baseImgW = img.naturalWidth;
  const baseImgH = img.naturalHeight;

  // Window header height for frame styles
  const titleBarHeight = settings.frameStyle === 'macos' || settings.frameStyle === 'windows' ? 44 : 0;
  const contentW = baseImgW;
  const contentH = baseImgH + titleBarHeight;

  const pad = settings.padding;
  let canvasW = contentW + pad * 2;
  let canvasH = contentH + pad * 2;

  // Enforce aspect ratio if requested
  if (settings.aspectRatio !== 'auto') {
    const [rw, rh] = settings.aspectRatio.split(':').map(Number);
    const targetAspect = rw / rh;
    const currentAspect = canvasW / canvasH;

    if (currentAspect < targetAspect) {
      canvasW = Math.round(canvasH * targetAspect);
    } else {
      canvasH = Math.round(canvasW / targetAspect);
    }
  }

  // Create canvas at chosen export scale
  const canvas = document.createElement('canvas');
  canvas.width = canvasW * scale;
  canvas.height = canvasH * scale;
  const ctx = canvas.getContext('2d')!;
  ctx.scale(scale, scale);

  // 1. Draw Background
  if (settings.bgType === 'gradient') {
    const gradDef = GRADIENTS.find((g) => g.id === settings.gradientId) || GRADIENTS[0];
    const bgGrad = ctx.createLinearGradient(0, 0, canvasW, canvasH);
    const step = 1 / (gradDef.colors.length - 1);
    gradDef.colors.forEach((c, idx) => bgGrad.addColorStop(idx * step, c));
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvasW, canvasH);
  } else if (settings.bgType === 'solid') {
    ctx.fillStyle = settings.solidColor;
    ctx.fillRect(0, 0, canvasW, canvasH);
  } else {
    // Transparent
    ctx.clearRect(0, 0, canvasW, canvasH);
  }

  // 2. Draw Window Container with Shadow
  const frameX = (canvasW - contentW) / 2;
  const frameY = (canvasH - contentH) / 2;
  const r = settings.borderRadius;

  ctx.save();

  // Apply shadow
  if (settings.shadowIntensity !== 'none') {
    const shadowMap = {
      soft: { blur: 24, offsetY: 12, color: 'rgba(0, 0, 0, 0.25)' },
      medium: { blur: 48, offsetY: 24, color: 'rgba(0, 0, 0, 0.35)' },
      hard: { blur: 72, offsetY: 36, color: 'rgba(0, 0, 0, 0.5)' },
      floating: { blur: 90, offsetY: 45, color: 'rgba(0, 0, 0, 0.65)' },
    };
    const s = shadowMap[settings.shadowIntensity];
    ctx.shadowColor = s.color;
    ctx.shadowBlur = s.blur;
    ctx.shadowOffsetY = s.offsetY;
  }

  // Window background card
  ctx.fillStyle = '#0F172A';
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(frameX, frameY, contentW, contentH, r);
  } else {
    ctx.rect(frameX, frameY, contentW, contentH);
  }
  ctx.fill();
  ctx.restore();

  // 3. Clip contents to rounded container
  ctx.save();
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(frameX, frameY, contentW, contentH, r);
  } else {
    ctx.rect(frameX, frameY, contentW, contentH);
  }
  ctx.clip();

  // 4. Draw Header Bar if applicable
  if (titleBarHeight > 0) {
    ctx.fillStyle = '#1E293B';
    ctx.fillRect(frameX, frameY, contentW, titleBarHeight);

    if (settings.frameStyle === 'macos') {
      // Traffic lights
      const btnY = frameY + titleBarHeight / 2;
      const btnRadius = 6;
      const startX = frameX + 20;
      const gap = 20;

      // Red
      ctx.fillStyle = '#FF5F56';
      ctx.beginPath();
      ctx.arc(startX, btnY, btnRadius, 0, Math.PI * 2);
      ctx.fill();

      // Yellow
      ctx.fillStyle = '#FFBD2E';
      ctx.beginPath();
      ctx.arc(startX + gap, btnY, btnRadius, 0, Math.PI * 2);
      ctx.fill();

      // Green
      ctx.fillStyle = '#27C93F';
      ctx.beginPath();
      ctx.arc(startX + gap * 2, btnY, btnRadius, 0, Math.PI * 2);
      ctx.fill();
    } else if (settings.frameStyle === 'windows') {
      // Windows buttons
      const iconRight = frameX + contentW - 16;
      ctx.strokeStyle = '#94A3B8';
      ctx.lineWidth = 1.5;

      // Close
      ctx.beginPath();
      ctx.moveTo(iconRight - 10, frameY + 16);
      ctx.lineTo(iconRight, frameY + 26);
      ctx.moveTo(iconRight, frameY + 16);
      ctx.lineTo(iconRight - 10, frameY + 26);
      ctx.stroke();
    }

    if (settings.windowTitle) {
      ctx.fillStyle = '#94A3B8';
      ctx.font = '500 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(settings.windowTitle, frameX + contentW / 2, frameY + titleBarHeight / 2 + 5);
    }
  }

  // 5. Draw Image
  ctx.drawImage(img, frameX, frameY + titleBarHeight, contentW, baseImgH);

  // Subtle border around the frame
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.lineWidth = 1;
  if (ctx.roundRect) {
    ctx.beginPath();
    ctx.roundRect(frameX, frameY, contentW, contentH, r);
    ctx.stroke();
  }

  ctx.restore();

  const blob = await canvasToBlob(canvas, 'image/png');
  return {
    blob,
    width: canvas.width,
    height: canvas.height,
    size: blob.size,
  };
}

// 7. PASSPORT PHOTO & PRINT SHEET
export async function generatePassportPhoto(
  file: File,
  settings: PassportSettings
): Promise<ProcessResult> {
  const img = await loadImage(URL.createObjectURL(file));
  const preset = PASSPORT_PRESETS.find((p) => p.id === settings.presetId) || PASSPORT_PRESETS[0];

  const widthMm = settings.presetId === 'custom' ? settings.widthMm : preset.widthMm;
  const heightMm = settings.presetId === 'custom' ? settings.heightMm : preset.heightMm;

  // Convert mm to pixels at specified DPI (1 inch = 25.4 mm)
  const pxPerMm = settings.dpi / 25.4;
  const photoW = Math.round(widthMm * pxPerMm);
  const photoH = Math.round(heightMm * pxPerMm);

  // First create the individual passport photo
  const singleCanvas = document.createElement('canvas');
  singleCanvas.width = photoW;
  singleCanvas.height = photoH;
  const sCtx = singleCanvas.getContext('2d')!;

  // Fill background if chosen
  const bgHex = PASSPORT_BG_COLORS[settings.bgOption];
  if (bgHex && bgHex !== 'transparent') {
    sCtx.fillStyle = bgHex;
    sCtx.fillRect(0, 0, photoW, photoH);
  }

  // Crop / zoom head according to headScale and verticalOffset
  const aspect = photoW / photoH;
  const imgAspect = img.naturalWidth / img.naturalHeight;

  let srcW: number;
  let srcH: number;

  if (imgAspect > aspect) {
    srcH = img.naturalHeight / (settings.headScale || 1);
    srcW = srcH * aspect;
  } else {
    srcW = img.naturalWidth / (settings.headScale || 1);
    srcH = srcW / aspect;
  }

  const srcX = (img.naturalWidth - srcW) / 2;
  const srcY = Math.max(0, (img.naturalHeight - srcH) / 2 + (settings.verticalOffset || 0) * (img.naturalHeight / 100));

  sCtx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, photoW, photoH);

  // If single layout requested, return this directly
  if (settings.sheetLayout === 'single') {
    const blob = await canvasToBlob(singleCanvas, 'image/jpeg', 0.98);
    return {
      blob,
      width: photoW,
      height: photoH,
      size: blob.size,
    };
  }

  // 4x6" (101.6 x 152.4 mm) or A4 (210 x 297 mm) Print Sheet
  const sheetCanvas = document.createElement('canvas');
  let sheetW: number;
  let sheetH: number;
  let cols: number;
  let rows: number;

  if (settings.sheetLayout === '4x6_grid') {
    sheetW = Math.round(152.4 * pxPerMm); // 6 inches
    sheetH = Math.round(101.6 * pxPerMm); // 4 inches

    // For 2x2" (51mm) photos: 2 cols x 2 rows
    // For 35x45mm photos: 3 cols x 2 rows
    if (widthMm > 40) {
      cols = 2;
      rows = 2;
    } else {
      cols = 3;
      rows = 2;
    }
  } else {
    // A4 sheet
    sheetW = Math.round(210 * pxPerMm);
    sheetH = Math.round(297 * pxPerMm);
    cols = widthMm > 40 ? 3 : 4;
    rows = widthMm > 40 ? 4 : 5;
  }

  sheetCanvas.width = sheetW;
  sheetCanvas.height = sheetH;
  const ctx = sheetCanvas.getContext('2d')!;

  // Crisp white paper background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, sheetW, sheetH);

  // Calculate grid positions with centering
  const spacingX = Math.round(5 * pxPerMm); // 5mm spacing
  const spacingY = Math.round(5 * pxPerMm);
  const totalGridW = cols * photoW + (cols - 1) * spacingX;
  const totalGridH = rows * photoH + (rows - 1) * spacingY;
  const startX = Math.round((sheetW - totalGridW) / 2);
  const startY = Math.round((sheetH - totalGridH) / 2);

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = startX + c * (photoW + spacingX);
      const y = startY + r * (photoH + spacingY);

      // Draw photo
      ctx.drawImage(singleCanvas, x, y);

      // Draw subtle border around photo
      ctx.strokeStyle = '#E2E8F0';
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, photoW, photoH);

      // Cutting guide marks
      if (settings.addCutLines) {
        ctx.strokeStyle = '#94A3B8';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);

        const markLen = Math.round(4 * pxPerMm);
        // Top-left marks
        ctx.beginPath();
        ctx.moveTo(x - markLen, y);
        ctx.lineTo(x, y);
        ctx.moveTo(x, y - markLen);
        ctx.lineTo(x, y);

        // Top-right marks
        ctx.moveTo(x + photoW, y - markLen);
        ctx.lineTo(x + photoW, y);
        ctx.moveTo(x + photoW, y);
        ctx.lineTo(x + photoW + markLen, y);

        // Bottom-left marks
        ctx.moveTo(x - markLen, y + photoH);
        ctx.lineTo(x, y + photoH);
        ctx.moveTo(x, y + photoH);
        ctx.lineTo(x, y + photoH + markLen);

        // Bottom-right marks
        ctx.moveTo(x + photoW + markLen, y + photoH);
        ctx.lineTo(x + photoW, y + photoH);
        ctx.moveTo(x + photoW, y + photoH);
        ctx.lineTo(x + photoW, y + photoH + markLen);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }
  }

  // Footer printing label
  ctx.fillStyle = '#64748B';
  ctx.font = `${Math.round(3.5 * pxPerMm)}px sans-serif`;
  ctx.textAlign = 'center';
  const sheetName = settings.sheetLayout === '4x6_grid' ? '4 × 6 inch' : 'A4';
  ctx.fillText(
    `PixelKit Passport Sheet (${sheetName}) • ${preset.name} (${widthMm}×${heightMm}mm @ ${settings.dpi} DPI) • Print at 100% scale (Do not fit to page)`,
    sheetW / 2,
    sheetH - Math.round(5 * pxPerMm)
  );

  const blob = await canvasToBlob(sheetCanvas, 'image/jpeg', 0.98);
  return {
    blob,
    width: sheetW,
    height: sheetH,
    size: blob.size,
  };
}

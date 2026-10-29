import { ExtractedColor } from '@/types';

// Convert RGB to HEX
export function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => {
    const hex = Math.max(0, Math.min(255, Math.round(n))).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

// Convert RGB to HSL
export function rgbToHsl(r: number, g: number, b: number): string {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
}

// Calculate relative luminance for WCAG contrast
function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

// Contrast ratio
function getContrastRatio(lum1: number, lum2: number): number {
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return parseFloat(((lighter + 0.05) / (darker + 0.05)).toFixed(2));
}

export function extractColorsFromImage(
  imageElement: HTMLImageElement,
  maxColors: number = 6
): ExtractedColor[] {
  const canvas = document.createElement('canvas');
  // Sample at moderate resolution for speed & noise suppression
  const sampleSize = 80;
  canvas.width = sampleSize;
  canvas.height = sampleSize;
  const ctx = canvas.getContext('2d');
  if (!ctx) return [];

  ctx.drawImage(imageElement, 0, 0, sampleSize, sampleSize);
  const imageData = ctx.getImageData(0, 0, sampleSize, sampleSize);
  const data = imageData.data;

  // Bucket quantizer with step of 16
  const bucketMap = new Map<
    string,
    { r: number; g: number; b: number; count: number }
  >();

  const step = 16;
  let totalPixels = 0;

  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3];
    if (a < 128) continue; // ignore transparent pixels

    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    const quantR = Math.floor(r / step) * step;
    const quantG = Math.floor(g / step) * step;
    const quantB = Math.floor(b / step) * step;

    const key = `${quantR},${quantG},${quantB}`;
    const existing = bucketMap.get(key);
    if (existing) {
      existing.r += r;
      existing.g += g;
      existing.b += b;
      existing.count++;
    } else {
      bucketMap.set(key, { r, g, b, count: 1 });
    }
    totalPixels++;
  }

  // Convert map to array sorted by frequency
  const buckets = Array.from(bucketMap.values())
    .map((b) => ({
      r: Math.round(b.r / b.count),
      g: Math.round(b.g / b.count),
      b: Math.round(b.b / b.count),
      count: b.count,
    }))
    .sort((a, b) => b.count - a.count);

  // Filter out visually identical colors (color distance)
  const distinctColors: { r: number; g: number; b: number; count: number }[] = [];

  for (const item of buckets) {
    const isTooClose = distinctColors.some((c) => {
      // Euclidean color distance
      const dist = Math.sqrt(
        Math.pow(c.r - item.r, 2) +
          Math.pow(c.g - item.g, 2) +
          Math.pow(c.b - item.b, 2)
      );
      return dist < 42; // distance threshold
    });

    if (!isTooClose) {
      distinctColors.push(item);
      if (distinctColors.length >= maxColors) break;
    }
  }

  const whiteLum = 1.0;
  const blackLum = 0.0;

  return distinctColors.map((c) => {
    const hex = rgbToHex(c.r, c.g, c.b);
    const rgb = `rgb(${c.r}, ${c.g}, ${c.b})`;
    const hsl = rgbToHsl(c.r, c.g, c.b);
    const lum = getLuminance(c.r, c.g, c.b);
    const isDark = lum < 0.45;
    const contrastWhite = getContrastRatio(lum, whiteLum);
    const contrastBlack = getContrastRatio(lum, blackLum);
    const percentage = totalPixels > 0 ? Math.round((c.count / totalPixels) * 100) : 0;

    return {
      hex,
      rgb,
      hsl,
      isDark,
      contrastWhite,
      contrastBlack,
      percentage,
    };
  });
}

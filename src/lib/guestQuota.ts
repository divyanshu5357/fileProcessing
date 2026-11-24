export const GUEST_LIMIT_6_HOURS = 4;
export const GUEST_LIMIT_DAILY_24H = 9;
export const GUEST_WINDOW_6H_MS = 6 * 60 * 60 * 1000;
export const GUEST_WINDOW_24H_MS = 24 * 60 * 60 * 1000;
export const GUEST_MAX_FILE_SIZE_MB = 15;
export const GUEST_MAX_FILE_SIZE_BYTES = GUEST_MAX_FILE_SIZE_MB * 1024 * 1024;
export const GUEST_SPACE_6H_BYTES = GUEST_MAX_FILE_SIZE_BYTES;

// Retained export name for compatibility with existing imports
export const GUEST_MAX_USES_PER_PRODUCT = GUEST_LIMIT_6_HOURS;

/**
 * Simple lightweight conversions and image utilities stay unlimited.
 * Heavy storage/editing tasks (PDF editing, Scan Studio, Office conversions, PDF compression, etc.)
 * share the cumulative 15 MB / 4-file per 6-hour window & 9-per-day allowance.
 */
export const UNLIMITED_SIMPLE_PRODUCTS = new Set([
  'jpg-to-pdf',
  'pdf-to-jpg',
  'extract-images',
  'compress-image',
  'image-tools',
  'image-converter',
  'pdf-to-text',
  'rotate-pdf',
  'delete-pdf-pages',
  'split-pdf',
  'merge-pdf',
  'page-numbers',
]);

export function isUnlimitedSimpleProduct(productId: string): boolean {
  return UNLIMITED_SIMPLE_PRODUCTS.has(productId.trim().toLowerCase());
}

export interface MeteredProductMeta {
  id: string;
  name: string;
  limit: number;
}

export const METERED_GUEST_PRODUCTS: Record<string, MeteredProductMeta> = {
  'pdf-editor': { id: 'pdf-editor', name: 'PDF Editor', limit: GUEST_LIMIT_6_HOURS },
  'pdf-assembler': { id: 'pdf-assembler', name: 'PDF Assembler', limit: GUEST_LIMIT_6_HOURS },
  'scan-studio': { id: 'scan-studio', name: 'Scan Studio', limit: GUEST_LIMIT_6_HOURS },
  'pdf-to-word': { id: 'pdf-to-word', name: 'PDF to Word', limit: GUEST_LIMIT_6_HOURS },
  'pdf-to-excel': { id: 'pdf-to-excel', name: 'PDF to Excel', limit: GUEST_LIMIT_6_HOURS },
  'pdf-to-powerpoint': { id: 'pdf-to-powerpoint', name: 'PDF to PowerPoint', limit: GUEST_LIMIT_6_HOURS },
  'word-to-pdf': { id: 'word-to-pdf', name: 'Word to PDF', limit: GUEST_LIMIT_6_HOURS },
  'excel-to-pdf': { id: 'excel-to-pdf', name: 'Excel to PDF', limit: GUEST_LIMIT_6_HOURS },
  'powerpoint-to-pdf': { id: 'powerpoint-to-pdf', name: 'PowerPoint to PDF', limit: GUEST_LIMIT_6_HOURS },
  'compress-pdf': { id: 'compress-pdf', name: 'Compress PDF', limit: GUEST_LIMIT_6_HOURS },
  'watermark-pdf': { id: 'watermark-pdf', name: 'Watermark PDF', limit: GUEST_LIMIT_6_HOURS },
  'sign-pdf': { id: 'sign-pdf', name: 'Sign PDF', limit: GUEST_LIMIT_6_HOURS },
  'crop-pdf': { id: 'crop-pdf', name: 'Crop PDF Margins', limit: GUEST_LIMIT_6_HOURS },
  'flatten-pdf': { id: 'flatten-pdf', name: 'Flatten PDF Forms', limit: GUEST_LIMIT_6_HOURS },
  'grayscale-pdf': { id: 'grayscale-pdf', name: 'Grayscale B&W PDF', limit: GUEST_LIMIT_6_HOURS },
  'protect-pdf': { id: 'protect-pdf', name: 'Protect PDF', limit: GUEST_LIMIT_6_HOURS },
  'unlock-pdf': { id: 'unlock-pdf', name: 'Unlock PDF', limit: GUEST_LIMIT_6_HOURS },
  'organize-pdf': { id: 'organize-pdf', name: 'Organize PDF', limit: GUEST_LIMIT_6_HOURS },
  'pdf-to-pdfa': { id: 'pdf-to-pdfa', name: 'PDF to PDF/A', limit: GUEST_LIMIT_6_HOURS },
  'html-to-pdf': { id: 'html-to-pdf', name: 'HTML to PDF', limit: GUEST_LIMIT_6_HOURS },
};

export function isMeteredGuestProduct(productId: string): boolean {
  return Boolean(METERED_GUEST_PRODUCTS[productId]) || /^[a-z0-9-]{2,64}$/.test(productId);
}

export function getProductMeta(productId: string): MeteredProductMeta {
  return (
    METERED_GUEST_PRODUCTS[productId] || {
      id: productId,
      name: productId.replace(/-/g, ' '),
      limit: GUEST_LIMIT_6_HOURS,
    }
  );
}

export function formatWaitDuration(seconds: number): string {
  const totalMinutes = Math.max(1, Math.ceil(seconds / 60));
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  if (hours > 0 && mins > 0) return `${hours}h ${mins}m`;
  if (hours > 0) return `${hours}h`;
  return `${mins}m`;
}

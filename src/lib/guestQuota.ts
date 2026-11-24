export const GUEST_MAX_USES_PER_PRODUCT = 4;

export interface MeteredProductMeta {
  id: string;
  name: string;
  limit: number;
}

/**
 * Products that previously allowed unlimited guest edits; unsigned users (tracked by IP)
 * are capped at 4 edits/runs per product before signing in for unlimited access.
 */
export const METERED_GUEST_PRODUCTS: Record<string, MeteredProductMeta> = {
  'pdf-editor': { id: 'pdf-editor', name: 'PDF Editor', limit: GUEST_MAX_USES_PER_PRODUCT },
  'pdf-assembler': { id: 'pdf-assembler', name: 'PDF Assembler', limit: GUEST_MAX_USES_PER_PRODUCT },
  'scan-studio': { id: 'scan-studio', name: 'Scan Studio', limit: GUEST_MAX_USES_PER_PRODUCT },
  'pdf-to-word': { id: 'pdf-to-word', name: 'PDF to Word', limit: GUEST_MAX_USES_PER_PRODUCT },
  'pdf-to-excel': { id: 'pdf-to-excel', name: 'PDF to Excel', limit: GUEST_MAX_USES_PER_PRODUCT },
  'pdf-to-powerpoint': { id: 'pdf-to-powerpoint', name: 'PDF to PowerPoint', limit: GUEST_MAX_USES_PER_PRODUCT },
  'word-to-pdf': { id: 'word-to-pdf', name: 'Word to PDF', limit: GUEST_MAX_USES_PER_PRODUCT },
  'excel-to-pdf': { id: 'excel-to-pdf', name: 'Excel to PDF', limit: GUEST_MAX_USES_PER_PRODUCT },
  'powerpoint-to-pdf': { id: 'powerpoint-to-pdf', name: 'PowerPoint to PDF', limit: GUEST_MAX_USES_PER_PRODUCT },
  'compress-pdf': { id: 'compress-pdf', name: 'Compress PDF', limit: GUEST_MAX_USES_PER_PRODUCT },
  'merge-pdf': { id: 'merge-pdf', name: 'Merge PDF', limit: GUEST_MAX_USES_PER_PRODUCT },
  'split-pdf': { id: 'split-pdf', name: 'Split PDF', limit: GUEST_MAX_USES_PER_PRODUCT },
  'watermark-pdf': { id: 'watermark-pdf', name: 'Watermark PDF', limit: GUEST_MAX_USES_PER_PRODUCT },
  'sign-pdf': { id: 'sign-pdf', name: 'Sign PDF', limit: GUEST_MAX_USES_PER_PRODUCT },
  'crop-pdf': { id: 'crop-pdf', name: 'Crop PDF Margins', limit: GUEST_MAX_USES_PER_PRODUCT },
  'flatten-pdf': { id: 'flatten-pdf', name: 'Flatten PDF Forms', limit: GUEST_MAX_USES_PER_PRODUCT },
  'grayscale-pdf': { id: 'grayscale-pdf', name: 'Grayscale B&W PDF', limit: GUEST_MAX_USES_PER_PRODUCT },
  'image-tools': { id: 'image-tools', name: 'Image Studio', limit: GUEST_MAX_USES_PER_PRODUCT },
};

export function isMeteredGuestProduct(productId: string): boolean {
  return Boolean(METERED_GUEST_PRODUCTS[productId]);
}

export function getProductMeta(productId: string): MeteredProductMeta {
  return (
    METERED_GUEST_PRODUCTS[productId] || {
      id: productId,
      name: productId.replace(/-/g, ' '),
      limit: GUEST_MAX_USES_PER_PRODUCT,
    }
  );
}

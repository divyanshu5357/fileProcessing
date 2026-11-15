export type ScanColorspace = 'colorful' | 'grayscale' | 'black_and_white';

export type PaperSize =
  | 'auto'
  | 'a4'
  | 'a5'
  | 'a3'
  | 'b4'
  | 'b5'
  | 'letter'
  | 'legal'
  | 'tabloid'
  | 'executive'
  | 'a6'
  | 'jis_b5'
  | 'jis_b4'
  | 'business_card'
  | 'id_card'
  | 'receipt'
  | 'custom';

export type PaperColor = 'white' | 'cream' | 'yellowed' | 'recycled';

export interface ScanPageSettings {
  // LookScanned exact settings
  colorspace: ScanColorspace;
  border: boolean; // Flatbed scanner glass border
  rotate: number; // e.g. 1 deg (-10 to 10)
  rotateVariance: number; // e.g. 0.5 deg (0 to 5)
  brightness: number; // e.g. 100% (0 to 200)
  contrast: number; // e.g. 100% (0 to 200)
  blur: number; // e.g. 30% (0 to 100)
  noise: number; // e.g. 10% (0 to 100)
  yellowish: number; // e.g. 0% (0 to 100)
  resolution: number; // e.g. 150 PPI (72 to 300)
  paperSize: PaperSize;
  paperColor: PaperColor;
  noiseSeed: number; // deterministic seed for matching preview & export

  // Backward compatibility aliases
  colorMode?: 'original' | 'grayscale' | 'black_and_white' | 'sepia';
  skewAngle?: number;
  warmth?: number;
  edgeShadow?: boolean;
}

export interface ScanPage {
  id: string;
  pageNumber: number;
  originalCanvas: HTMLCanvasElement | null;
  originalWidth: number;
  originalHeight: number;
  thumbnailUrl: string;
  settings: ScanPageSettings;
  useGlobalSettings: boolean;
}

export interface StampItem {
  id: string;
  type: 'image' | 'text';
  text?: string;
  imageUrl?: string | null;
  opacity: number;
  scale: number;
  rotation: number;
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
}

export interface WatermarkSettings {
  enabled: boolean;
  type: 'text' | 'image';
  text: string;
  fontSize: number;
  color: string;
  opacity: number; // 0 to 1
  rotation: number; // -90 to 90 deg
  position: 'diagonal' | 'center' | 'header' | 'footer';
  imageUrl?: string | null;
  imageScale?: number;
  // Backward compatibility
  imageStampUrl?: string | null;
  imageStampOpacity?: number;
  imageStampScale?: number;
  imageStampPosition?: 'bottom-right' | 'bottom-left' | 'top-right' | 'center';
}

export interface PageNumberSettings {
  enabled: boolean;
  format: 'Page {page} of {total}' | '{page} / {total}' | '- {page} -' | '{page}';
  position: 'bottom-center' | 'bottom-right' | 'top-right';
  fontSize: number;
  color: string;
}

export interface DocumentMetadata {
  title: string;
  author: string;
  subject: string;
  keywords: string;
  pdfStandard?: 'off' | 'pdf_a_1b' | 'pdf_a_2b';
}

export interface OutputSettings {
  format: 'pdf' | 'png_zip' | 'jpeg_zip';
  preserveText: boolean;
  filenameSuffix: string;
}

export interface ExportProgress {
  isExporting: boolean;
  currentPage: number;
  totalPages: number;
  progressPercent: number;
  statusText: string;
  canCancel: boolean;
}

export const PAPER_SIZE_OPTIONS: { id: PaperSize; label: string; sublabel?: string; dims?: [number, number] }[] = [
  { id: 'auto', label: 'Auto (original size)', sublabel: 'Each page keeps its original size.' },
  { id: 'a4', label: 'A4 · 210 × 297 mm', dims: [595.28, 841.89] },
  { id: 'a5', label: 'A5 · 148 × 210 mm', dims: [419.53, 595.28] },
  { id: 'a3', label: 'A3 · 297 × 420 mm', dims: [841.89, 1190.55] },
  { id: 'b4', label: 'B4 · 250 × 353 mm', dims: [708.66, 1000.63] },
  { id: 'b5', label: 'B5 · 176 × 250 mm', dims: [498.9, 708.66] },
  { id: 'letter', label: 'Letter · 8.5 × 11 in', dims: [612.0, 792.0] },
  { id: 'legal', label: 'Legal · 8.5 × 14 in', dims: [612.0, 1008.0] },
  { id: 'tabloid', label: 'Tabloid · 11 × 17 in', dims: [792.0, 1224.0] },
  { id: 'executive', label: 'Executive · 7.25 × 10.5 in', dims: [522.0, 756.0] },
  { id: 'a6', label: 'A6 · 105 × 148 mm', dims: [297.64, 419.53] },
  { id: 'jis_b5', label: 'JIS B5 · 182 × 257 mm', dims: [515.91, 728.5] },
  { id: 'jis_b4', label: 'JIS B4 · 257 × 364 mm', dims: [728.5, 1031.81] },
  { id: 'business_card', label: 'Business card · 90 × 54 mm', dims: [255.12, 153.07] },
  { id: 'id_card', label: 'ID card · 85.6 × 54 mm', dims: [242.65, 153.07] },
  { id: 'receipt', label: 'Receipt · 80 × 200 mm', dims: [226.77, 566.93] },
  { id: 'custom', label: 'Custom size' },
];

export const DEFAULT_PAGE_SETTINGS: ScanPageSettings = {
  colorspace: 'grayscale',
  border: false,
  rotate: 1,
  rotateVariance: 0.5,
  brightness: 100, // 100% normal exposure
  contrast: 100, // 100% normal contrast
  blur: 30, // 30% soft scanner optical lens
  noise: 10, // 10% authentic toner speckle
  yellowish: 0, // 0% white clean paper
  resolution: 150, // 150 PPI standard scanner resolution
  paperSize: 'auto', // Auto: original size (each page keeps its exact dimensions)
  paperColor: 'white',
  noiseSeed: 42,
  // Compat
  colorMode: 'grayscale',
  skewAngle: 1,
  warmth: 0,
  edgeShadow: false,
};

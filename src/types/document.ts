export type MainCategory = 'image-tools' | 'pdf-tools' | 'document-converter' | 'image-converter';

export type PdfToolCategory = 'to-pdf' | 'from-pdf' | 'pdf-utility';

export type PdfToolId =
  // Convert to PDF
  | 'jpg-to-pdf'
  | 'word-to-pdf'
  | 'powerpoint-to-pdf'
  | 'excel-to-pdf'
  | 'html-to-pdf'
  // Convert from PDF
  | 'pdf-to-jpg'
  | 'pdf-to-word'
  | 'pdf-to-powerpoint'
  | 'pdf-to-excel'
  | 'pdf-to-pdfa'
  // More PDF Tools
  | 'merge-pdf'
  | 'split-pdf'
  | 'compress-pdf'
  | 'rotate-pdf'
  | 'delete-pdf-pages'
  | 'organize-pdf'
  | 'extract-images'
  | 'protect-pdf'
  | 'unlock-pdf'
  | 'watermark-pdf'
  | 'page-numbers'
  | 'pdf-to-text'
  | 'pdf-editor';

export interface ToolDefinition {
  id: PdfToolId;
  name: string;
  shortDesc: string;
  category: PdfToolCategory;
  fromFormat: string;
  toFormat: string;
  iconName: string;
  accentColor: string; // e.g., 'blue', 'red', 'green', 'orange', 'purple'
  accept: string[]; // e.g. ['.jpg', '.jpeg', '.png']
  badge?: string;
  isClientSideOnly: boolean;
}

export interface UploadedFileItem {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  previewUrl?: string;
  pageCount?: number;
  rotation?: number; // 0, 90, 180, 270 for JPG to PDF / Rotate PDF
}

export interface ConversionResultItem {
  id: string;
  name: string;
  originalName: string;
  blob: Blob;
  url: string;
  size: number;
  format: string;
  previewUrl?: string;
  pageCount?: number;
  details?: Record<string, string | number | boolean>;
}

// Settings Interfaces
export interface JpgToPdfSettings {
  pageSize: 'a4' | 'a3' | 'letter' | 'fit';
  orientation: 'portrait' | 'landscape' | 'auto';
  margin: 'none' | 'small' | 'normal';
  imageFit: 'fit' | 'fill' | 'stretch';
  combineIntoOne: boolean;
}

export interface WordToPdfSettings {
  pageSize: 'a4' | 'letter';
  orientation: 'portrait' | 'landscape';
  margin: 'normal' | 'narrow' | 'wide';
}

export interface PptToPdfSettings {
  slideAspect: '16:9' | '4:3';
  includeSlideNumbers: boolean;
}

export interface ExcelToPdfSettings {
  orientation: 'landscape' | 'portrait';
  fitToPage: boolean;
  showGridLines: boolean;
  repeatHeaderRow: boolean;
  selectedSheet: string;
}

export interface HtmlToPdfSettings {
  sourceType: 'file' | 'html' | 'url';
  pastedHtml: string;
  urlInput: string;
  pageSize: 'a4' | 'letter';
  margin: 'normal' | 'small' | 'none';
}

export interface PdfToJpgSettings {
  format: 'image/jpeg' | 'image/png';
  quality: number; // 50 to 100
  dpi: number; // 72, 150, 300
  pageRange: 'all' | 'custom';
  customPages: string; // e.g. "1, 3-5"
}

export interface PdfToWordSettings {
  format: 'docx';
  extractImages: boolean;
  ocrFallback: boolean;
}

export interface PdfToPptSettings {
  slideLayout: '16:9' | '4:3';
  mode: 'high-fidelity' | 'editable-text';
}

export interface PdfToExcelSettings {
  delimiter: 'auto' | 'tab' | 'comma' | 'space';
  detectTables: boolean;
  sheetName: string;
}

export interface PdfToPdfASettings {
  conformance: 'pdfa-1b' | 'pdfa-2b';
  colorProfile: 'sRGB';
  embedFonts: boolean;
}

export interface MergePdfSettings {
  removeBlankPages: boolean;
}

export interface SplitPdfSettings {
  splitMode: 'range' | 'all-pages' | 'every-n-pages';
  pageRanges: string; // e.g. "1-3, 5, 7-10"
  everyN: number;
}

export interface CompressPdfSettings {
  compressionLevel: 'extreme' | 'recommended' | 'low';
}

export interface RotatePdfSettings {
  rotationAngle: 90 | 180 | 270;
  applyTo: 'all' | 'odd' | 'even' | 'custom';
  customPages: string;
}

export interface DeletePdfPagesSettings {
  pagesToDelete: number[]; // 1-based page numbers
}

export interface OrganizePdfSettings {
  pageOrder: number[]; // 1-based indices in new order
}

export interface ExtractImagesSettings {
  imageFormat: 'png' | 'jpeg';
  minWidth: number;
}

export interface ProtectPdfSettings {
  userPassword: string;
  confirmPassword: string;
  restrictPrinting: boolean;
  restrictCopying: boolean;
}

export interface UnlockPdfSettings {
  password: string;
}

export interface WatermarkPdfSettings {
  type: 'text' | 'image';
  text: string;
  fontSize: number;
  opacity: number; // 0.1 to 1.0
  rotation: number; // e.g. 45 or 0
  color: string;
  position: 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

export interface PageNumberSettings {
  format: 'page-x-of-y' | 'page-x' | 'x-of-y' | 'x';
  position: 'bottom-center' | 'bottom-right' | 'bottom-left' | 'top-center' | 'top-right';
  fontSize: number;
  startNumber: number;
  margin: number;
}

export interface PdfToTextSettings {
  pageSeparator: boolean;
  preserveLineBreaks: boolean;
}

export type AnyToolSettings =
  | JpgToPdfSettings
  | WordToPdfSettings
  | PptToPdfSettings
  | ExcelToPdfSettings
  | HtmlToPdfSettings
  | PdfToJpgSettings
  | PdfToWordSettings
  | PdfToPptSettings
  | PdfToExcelSettings
  | PdfToPdfASettings
  | MergePdfSettings
  | SplitPdfSettings
  | CompressPdfSettings
  | RotatePdfSettings
  | DeletePdfPagesSettings
  | OrganizePdfSettings
  | ExtractImagesSettings
  | ProtectPdfSettings
  | UnlockPdfSettings
  | WatermarkPdfSettings
  | PageNumberSettings
  | PdfToTextSettings;

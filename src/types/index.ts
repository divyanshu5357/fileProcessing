export type ToolId =
  | 'compress'
  | 'resize'
  | 'convert'
  | 'crop'
  | 'rotate'
  | 'metadata'
  | 'palette'
  | 'beautify'
  | 'passport'
  | 'batch';

export interface ImageMetadata {
  make?: string;
  model?: string;
  dateTime?: string;
  software?: string;
  focalLength?: string;
  exposureTime?: string;
  fNumber?: string;
  iso?: string;
  lensModel?: string;
  gpsLatitude?: number;
  gpsLongitude?: number;
  gpsAltitude?: number;
  colorSpace?: string;
  rawTags: Record<string, string | number | undefined>;
}

export interface ExtractedColor {
  hex: string;
  rgb: string;
  hsl: string;
  isDark: boolean;
  contrastWhite: number;
  contrastBlack: number;
  percentage: number;
}

export interface ImageItem {
  id: string;
  file: File;
  name: string;
  originalSize: number;
  originalWidth: number;
  originalHeight: number;
  url: string;
  format: string;
  processedBlob: Blob | null;
  processedUrl: string | null;
  processedSize: number | null;
  processedWidth: number | null;
  processedHeight: number | null;
  isProcessing: boolean;
  error: string | null;
  metadata: ImageMetadata | null;
  hasExif: boolean;
  colors?: ExtractedColor[];
}

export interface CompressSettings {
  quality: number; // 1 to 100
  targetSizeKb: number; // 0 = no target, or specific KB
  maxDimension: number; // 0 = original
  format: 'original' | 'image/jpeg' | 'image/webp' | 'image/png';
}

export interface ResizeSettings {
  mode: 'dimensions' | 'percentage' | 'preset';
  width: number;
  height: number;
  lockAspectRatio: boolean;
  percentage: number;
  preset: string;
  smoothing: 'high' | 'pixelated';
}

export interface ConvertSettings {
  format: 'image/png' | 'image/jpeg' | 'image/webp' | 'image/avif' | 'svg' | 'pdf';
  quality: number;
  bgColor: string; // for converting transparent PNGs to JPEG
}

export interface CropBox {
  x: number; // percent 0-100
  y: number; // percent 0-100
  width: number; // percent 0-100
  height: number; // percent 0-100
}

export interface CropSettings {
  aspect: 'free' | '1:1' | '16:9' | '4:3' | '3:2' | '9:16' | 'round';
  cropBox: CropBox;
  zoom: number;
}

export interface RotateSettings {
  rotation: number; // 0, 90, 180, 270
  fineAngle: number; // -45 to 45 or -180 to 180
  flipH: boolean;
  flipV: boolean;
  bgColor: string;
}

export interface MetadataSettings {
  stripAll: boolean;
}

export interface PaletteSettings {
  colorCount: number;
  selectedColor: ExtractedColor | null;
}

export interface BeautifySettings {
  frameStyle: 'macos' | 'windows' | 'pill' | 'shadow' | 'none';
  bgType: 'gradient' | 'solid' | 'transparent';
  gradientId: string;
  solidColor: string;
  padding: number;
  borderRadius: number;
  shadowIntensity: 'none' | 'soft' | 'medium' | 'hard' | 'floating';
  aspectRatio: 'auto' | '16:9' | '1:1' | '4:5' | '9:16';
  exportScale: 1 | 2;
  windowTitle?: string;
}

export interface PassportPreset {
  id: string;
  name: string;
  country: string;
  widthMm: number;
  heightMm: number;
  aspectRatio: number;
  description: string;
}

export interface PassportSettings {
  presetId: string;
  widthMm: number;
  heightMm: number;
  dpi: number;
  bgOption: 'original' | 'white' | 'offwhite' | 'light_blue' | 'light_grey';
  showBiometricGuides: boolean;
  sheetLayout: 'single' | '4x6_grid' | 'a4_grid';
  addCutLines: boolean;
  headScale: number; // adjust crop zoom for head alignment
  verticalOffset: number; // adjust head vertical position
}

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  type: 'success' | 'info' | 'warning' | 'error';
}

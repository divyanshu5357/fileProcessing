import { ToolDefinition, PdfToolId } from '@/types/document';

export type ToolCategory =
  | 'pdf'
  | 'image'
  | 'document'
  | 'scan'
  | 'conversion'
  | 'compression'
  | 'editing';

export interface CentralToolItem {
  id: string;
  name: string;
  category: ToolCategory;
  categoryLabel: string;
  supportedInputs: string[];
  supportedOutputs: string[];
  description: string;
  route: string;
  iconName: string;
  accentColor: string;
  badge?: string;
  popular?: boolean;
  isAvailable: boolean;
  planRequired?: 'Free' | 'Prime' | 'PrimePlus' | 'PrimeUltra';
}

export const CENTRAL_TOOL_REGISTRY: CentralToolItem[] = [
  // 1. PDF Editing & Assembly
  {
    id: 'pdf-editor',
    name: 'PDF Editor',
    category: 'editing',
    categoryLabel: 'Editing Tools',
    supportedInputs: ['.pdf'],
    supportedOutputs: ['.pdf'],
    description: 'Edit text in place, insert images at precise coordinates, add signatures, whiteout, and shapes.',
    route: '/tools/pdf-editor',
    iconName: 'PenTool',
    accentColor: 'blue',
    badge: 'Pro Editor',
    popular: true,
    isAvailable: true,
  },
  {
    id: 'pdf-assembler',
    name: 'Organize & Assemble PDF',
    category: 'editing',
    categoryLabel: 'Editing Tools',
    supportedInputs: ['.pdf', '.jpg', '.jpeg', '.png', '.webp'],
    supportedOutputs: ['.pdf'],
    description: 'Visually rearrange, alternate merge, rotate, and transfer pages between multiple PDF documents.',
    route: '/tools/pdf-assembler',
    iconName: 'LayoutGrid',
    accentColor: 'indigo',
    badge: 'Multi-Page',
    popular: true,
    isAvailable: true,
  },

  // 2. Scan Studio
  {
    id: 'scan-studio',
    name: 'Scan Studio',
    category: 'scan',
    categoryLabel: 'Scan Studio',
    supportedInputs: ['.pdf', '.jpg', '.jpeg', '.png', '.webp'],
    supportedOutputs: ['.pdf'],
    description: 'Transform clean digital documents into authentic photocopied and scanned documents with paper textures.',
    route: '/scan-studio',
    iconName: 'ScanLine',
    accentColor: 'emerald',
    badge: 'Popular',
    popular: true,
    isAvailable: true,
  },

  // 3. Document Conversions (PDF to Word, Word to PDF, etc.)
  {
    id: 'pdf-to-word',
    name: 'PDF to Word',
    category: 'conversion',
    categoryLabel: 'Conversion Tools',
    supportedInputs: ['.pdf'],
    supportedOutputs: ['.docx'],
    description: 'Extract structured text and two-column data tables from PDF into fully editable DOCX Word files.',
    route: '/pdf/pdf-to-word',
    iconName: 'FileText',
    accentColor: 'blue',
    badge: 'High Quality',
    popular: true,
    isAvailable: true,
  },
  {
    id: 'word-to-pdf',
    name: 'Word to PDF',
    category: 'conversion',
    categoryLabel: 'Conversion Tools',
    supportedInputs: ['.docx', '.doc'],
    supportedOutputs: ['.pdf'],
    description: 'Convert Microsoft Word documents (DOC, DOCX) into publication-ready PDF documents.',
    route: '/pdf/word-to-pdf',
    iconName: 'FileText',
    accentColor: 'blue',
    badge: 'Fast',
    popular: true,
    isAvailable: true,
  },
  {
    id: 'excel-to-pdf',
    name: 'Excel to PDF',
    category: 'conversion',
    categoryLabel: 'Conversion Tools',
    supportedInputs: ['.xlsx', '.xls', '.csv'],
    supportedOutputs: ['.pdf'],
    description: 'Convert Excel spreadsheets (XLS, XLSX, CSV) into clean, formatted PDF sheets and reports.',
    route: '/pdf/excel-to-pdf',
    iconName: 'FileSpreadsheet',
    accentColor: 'green',
    popular: true,
    isAvailable: true,
  },
  {
    id: 'pdf-to-excel',
    name: 'PDF to Excel',
    category: 'conversion',
    categoryLabel: 'Conversion Tools',
    supportedInputs: ['.pdf'],
    supportedOutputs: ['.xlsx'],
    description: 'Automatically detect and extract data tables from PDF into structured Excel spreadsheets.',
    route: '/pdf/pdf-to-excel',
    iconName: 'Table',
    accentColor: 'green',
    isAvailable: true,
  },
  {
    id: 'powerpoint-to-pdf',
    name: 'PowerPoint to PDF',
    category: 'conversion',
    categoryLabel: 'Conversion Tools',
    supportedInputs: ['.pptx', '.ppt'],
    supportedOutputs: ['.pdf'],
    description: 'Convert PowerPoint slide presentations (PPT, PPTX) into clear multi-page PDF documents.',
    route: '/pdf/powerpoint-to-pdf',
    iconName: 'Presentation',
    accentColor: 'orange',
    isAvailable: true,
  },
  {
    id: 'pdf-to-powerpoint',
    name: 'PDF to PowerPoint',
    category: 'conversion',
    categoryLabel: 'Conversion Tools',
    supportedInputs: ['.pdf'],
    supportedOutputs: ['.pptx'],
    description: 'Convert PDF document pages into Microsoft PowerPoint presentation slides (PPTX).',
    route: '/pdf/pdf-to-powerpoint',
    iconName: 'Presentation',
    accentColor: 'orange',
    isAvailable: true,
  },

  // 4. Image Conversions & Processing
  {
    id: 'compress-image',
    name: 'Compress Image',
    category: 'compression',
    categoryLabel: 'Compression Tools',
    supportedInputs: ['.jpg', '.jpeg', '.png', '.webp', '.bmp'],
    supportedOutputs: ['.jpg', '.png', '.webp'],
    description: 'Compress JPG, PNG, and WebP images with custom visual quality controls and real-time size savings.',
    route: '/image-converter',
    iconName: 'Minimize2',
    accentColor: 'emerald',
    badge: 'Savings',
    popular: true,
    isAvailable: true,
  },
  {
    id: 'resize-image',
    name: 'Resize Image',
    category: 'image',
    categoryLabel: 'Image Tools',
    supportedInputs: ['.jpg', '.jpeg', '.png', '.webp'],
    supportedOutputs: ['.jpg', '.png', '.webp'],
    description: 'Scale pixel dimensions, change aspect ratios, or target exact resolutions with locked proportions.',
    route: '/image-converter',
    iconName: 'Maximize2',
    accentColor: 'blue',
    isAvailable: true,
  },
  {
    id: 'crop-image',
    name: 'Crop Image',
    category: 'image',
    categoryLabel: 'Image Tools',
    supportedInputs: ['.jpg', '.jpeg', '.png', '.webp'],
    supportedOutputs: ['.jpg', '.png', '.webp'],
    description: 'Crop images for social media, custom ratios, or standard passport headshot guidelines.',
    route: '/image-converter',
    iconName: 'Crop',
    accentColor: 'indigo',
    isAvailable: true,
  },
  {
    id: 'convert-image',
    name: 'Convert Image',
    category: 'conversion',
    categoryLabel: 'Conversion Tools',
    supportedInputs: ['.png', '.jpg', '.jpeg', '.webp', '.bmp', '.svg'],
    supportedOutputs: ['.png', '.jpg', '.webp'],
    description: 'Fast format conversion between JPG, PNG, and next-gen WebP with zero quality degradation.',
    route: '/image-converter',
    iconName: 'Layers',
    accentColor: 'purple',
    popular: true,
    isAvailable: true,
  },
  {
    id: 'jpg-to-pdf',
    name: 'Image to PDF',
    category: 'conversion',
    categoryLabel: 'Conversion Tools',
    supportedInputs: ['.jpg', '.jpeg', '.png', '.webp', '.bmp'],
    supportedOutputs: ['.pdf'],
    description: 'Convert individual photos or bulk image batches into a single organized PDF document.',
    route: '/pdf/jpg-to-pdf',
    iconName: 'Image',
    accentColor: 'blue',
    popular: true,
    isAvailable: true,
  },
  {
    id: 'pdf-to-jpg',
    name: 'PDF to Images',
    category: 'conversion',
    categoryLabel: 'Conversion Tools',
    supportedInputs: ['.pdf'],
    supportedOutputs: ['.jpg', '.png'],
    description: 'Extract and render high-resolution JPG or PNG images from each page of a PDF document.',
    route: '/pdf/pdf-to-jpg',
    iconName: 'FileImage',
    accentColor: 'amber',
    popular: true,
    isAvailable: true,
  },

  // 5. PDF Utilities & Compression
  {
    id: 'compress-pdf',
    name: 'Compress PDF',
    category: 'compression',
    categoryLabel: 'Compression Tools',
    supportedInputs: ['.pdf'],
    supportedOutputs: ['.pdf'],
    description: 'Reduce PDF file size by compressing images and stream objects for email attachments.',
    route: '/pdf/compress-pdf',
    iconName: 'Minimize2',
    accentColor: 'emerald',
    badge: 'Up to 80%',
    popular: true,
    isAvailable: true,
  },
  {
    id: 'merge-pdf',
    name: 'Merge PDF',
    category: 'pdf',
    categoryLabel: 'PDF Tools',
    supportedInputs: ['.pdf'],
    supportedOutputs: ['.pdf'],
    description: 'Combine multiple PDF files into one single unified document in any preferred order.',
    route: '/pdf/merge-pdf',
    iconName: 'Layers',
    accentColor: 'indigo',
    popular: true,
    isAvailable: true,
  },
  {
    id: 'split-pdf',
    name: 'Split PDF',
    category: 'pdf',
    categoryLabel: 'PDF Tools',
    supportedInputs: ['.pdf'],
    supportedOutputs: ['.pdf'],
    description: 'Separate specific page ranges or extract every single page into an individual file.',
    route: '/pdf/split-pdf',
    iconName: 'Scissors',
    accentColor: 'red',
    isAvailable: true,
  },
  {
    id: 'rotate-pdf',
    name: 'Rotate PDF',
    category: 'pdf',
    categoryLabel: 'PDF Tools',
    supportedInputs: ['.pdf'],
    supportedOutputs: ['.pdf'],
    description: 'Permanently rotate PDF pages clockwise by 90, 180, or 270 degrees.',
    route: '/pdf/rotate-pdf',
    iconName: 'RotateCw',
    accentColor: 'blue',
    isAvailable: true,
  },
  {
    id: 'delete-pdf-pages',
    name: 'Delete PDF Pages',
    category: 'pdf',
    categoryLabel: 'PDF Tools',
    supportedInputs: ['.pdf'],
    supportedOutputs: ['.pdf'],
    description: 'Select and remove unwanted pages from a PDF document with visual thumbnails.',
    route: '/pdf/delete-pdf-pages',
    iconName: 'Trash2',
    accentColor: 'rose',
    isAvailable: true,
  },
  {
    id: 'organize-pdf',
    name: 'Organize PDF',
    category: 'pdf',
    categoryLabel: 'PDF Tools',
    supportedInputs: ['.pdf'],
    supportedOutputs: ['.pdf'],
    description: 'Sort, reorder, rotate, or remove pages inside a PDF document with drag and drop.',
    route: '/pdf/organize-pdf',
    iconName: 'ArrowDownUp',
    accentColor: 'cyan',
    isAvailable: true,
  },
  {
    id: 'extract-images',
    name: 'Extract Images from PDF',
    category: 'pdf',
    categoryLabel: 'PDF Tools',
    supportedInputs: ['.pdf'],
    supportedOutputs: ['.zip', '.png', '.jpg'],
    description: 'Extract all embedded graphics and photos from a PDF into a downloadable ZIP archive.',
    route: '/pdf/extract-images',
    iconName: 'Download',
    accentColor: 'sky',
    isAvailable: true,
  },
  {
    id: 'protect-pdf',
    name: 'Protect PDF',
    category: 'pdf',
    categoryLabel: 'PDF Tools',
    supportedInputs: ['.pdf'],
    supportedOutputs: ['.pdf'],
    description: 'Encrypt your PDF with standard user password protection and restrict unauthorized copying.',
    route: '/pdf/protect-pdf',
    iconName: 'Lock',
    accentColor: 'violet',
    isAvailable: true,
  },
  {
    id: 'unlock-pdf',
    name: 'Unlock PDF',
    category: 'pdf',
    categoryLabel: 'PDF Tools',
    supportedInputs: ['.pdf'],
    supportedOutputs: ['.pdf'],
    description: 'Remove password restrictions and printing limitations from authorized PDF documents.',
    route: '/pdf/unlock-pdf',
    iconName: 'Unlock',
    accentColor: 'fuchsia',
    isAvailable: true,
  },
  {
    id: 'watermark-pdf',
    name: 'Watermark PDF',
    category: 'editing',
    categoryLabel: 'Editing Tools',
    supportedInputs: ['.pdf'],
    supportedOutputs: ['.pdf'],
    description: 'Stamp text or image watermarks (e.g. Confidential, Draft) with custom angle and opacity.',
    route: '/pdf/watermark-pdf',
    iconName: 'Stamp',
    accentColor: 'pink',
    isAvailable: true,
  },
  {
    id: 'page-numbers',
    name: 'Add Page Numbers',
    category: 'editing',
    categoryLabel: 'Editing Tools',
    supportedInputs: ['.pdf'],
    supportedOutputs: ['.pdf'],
    description: 'Insert dynamic page numbering (e.g. Page X of Y) into headers or footers.',
    route: '/pdf/page-numbers',
    iconName: 'Hash',
    accentColor: 'indigo',
    isAvailable: true,
  },
  {
    id: 'pdf-to-text',
    name: 'PDF to Text',
    category: 'document',
    categoryLabel: 'Document Tools',
    supportedInputs: ['.pdf'],
    supportedOutputs: ['.txt'],
    description: 'Extract all readable text from your PDF into a clean and searchable TXT document.',
    route: '/pdf/pdf-to-text',
    iconName: 'AlignLeft',
    accentColor: 'slate',
    isAvailable: true,
  },
  {
    id: 'pdf-to-pdfa',
    name: 'PDF to PDF/A',
    category: 'conversion',
    categoryLabel: 'Conversion Tools',
    supportedInputs: ['.pdf'],
    supportedOutputs: ['.pdf'],
    description: 'Convert standard PDFs to ISO 19005 compliant PDF/A-1b or PDF/A-2b for legal archival.',
    route: '/pdf/pdf-to-pdfa',
    iconName: 'ShieldCheck',
    accentColor: 'teal',
    isAvailable: true,
  },
];

// Helper: Get matching tools for an uploaded file extension
export function getToolsForFileExtension(ext: string): CentralToolItem[] {
  const normalizedExt = ext.startsWith('.') ? ext.toLowerCase() : `.${ext.toLowerCase()}`;
  return CENTRAL_TOOL_REGISTRY.filter((t) =>
    t.supportedInputs.some((inp) => inp.toLowerCase() === normalizedExt)
  );
}

// Helper: Categorize file by extension
export function getFileCategory(ext: string): 'pdf' | 'image' | 'word' | 'excel' | 'powerpoint' | 'document' | 'other' {
  const clean = ext.replace('.', '').toLowerCase();
  if (clean === 'pdf') return 'pdf';
  if (['jpg', 'jpeg', 'png', 'webp', 'bmp', 'svg', 'gif'].includes(clean)) return 'image';
  if (['doc', 'docx'].includes(clean)) return 'word';
  if (['xls', 'xlsx', 'csv'].includes(clean)) return 'excel';
  if (['ppt', 'pptx'].includes(clean)) return 'powerpoint';
  if (['txt', 'rtf', 'html', 'htm'].includes(clean)) return 'document';
  return 'other';
}

// Backward Compatibility Helpers for existing PDF tools components
export const ALL_PDF_TOOLS: ToolDefinition[] = CENTRAL_TOOL_REGISTRY.filter(
  (t) => t.category === 'pdf' || t.category === 'editing' || t.category === 'conversion' || t.category === 'compression'
).map((t) => ({
  id: t.id as PdfToolId,
  name: t.name,
  shortDesc: t.description,
  category: t.category === 'conversion' && t.supportedInputs.includes('.pdf') ? 'from-pdf' : t.category === 'conversion' ? 'to-pdf' : 'pdf-utility',
  fromFormat: t.supportedInputs.join(', ').replace(/\./g, '').toUpperCase(),
  toFormat: t.supportedOutputs.join(', ').replace(/\./g, '').toUpperCase(),
  iconName: t.iconName,
  accentColor: t.accentColor as any,
  accept: t.supportedInputs,
  badge: t.badge,
  isClientSideOnly: true,
}));

export function getToolById(id: PdfToolId): ToolDefinition | undefined {
  return ALL_PDF_TOOLS.find((t) => t.id === id);
}

export function getToolsByCategory(category: ToolDefinition['category']): ToolDefinition[] {
  return ALL_PDF_TOOLS.filter((t) => t.category === category);
}

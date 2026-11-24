import { ALL_PDF_TOOLS } from '@/lib/toolRegistry';

export interface ToolFaqItem {
  question: string;
  answer: string;
}

export interface ToolHowToStep {
  name: string;
  text: string;
}

export interface ToolSeoProfile {
  id: string;
  route: string;
  canonicalUrl: string;
  breadcrumbParent: { name: string; href: string };
  seoTitle: string;
  metaDescription: string;
  h1: string;
  subtitle: string;
  keywords: string[];
  alternateNames: string[];
  overview: string;
  highlights: string[];
  howToTitle: string;
  howToSteps: ToolHowToStep[];
  faqs: ToolFaqItem[];
  relatedLinks: { label: string; href: string; tag: string }[];
}

export const SITE_BASE_URL = 'https://www.gyanvatsala.in';

export const GLOBAL_SEARCH_KEYWORDS: string[] = [
  // Exact Brand & Brand + Intent cluster
  'Gyanvatsala',
  'Gyanvatsala PDF editor',
  'pdf editor online gyanvatsala',
  'gyanvatsala.in',
  'Gyanvatsala image to PDF',
  'Gyanvatsala image size reducer',
  'Gyanvatsala Scan Studio',
  'gyanvatsala document workspace',
  // PDF Editing cluster
  'PDF editor',
  'free online PDF editor',
  'edit PDF online',
  'edit PDF text free',
  'modify PDF online',
  'PDF text editor',
  'add signature to PDF',
  'annotate PDF online',
  'fill and sign PDF',
  'edit PDF without watermark',
  'pdf editer',
  'eddit pdf',
  'pdf editr',
  // Image to PDF / IMG to PDF cluster
  'image to PDF',
  'img to PDF',
  'JPG to PDF',
  'JPEG to PDF',
  'PNG to PDF',
  'photo to PDF converter',
  'convert image to PDF online free',
  'combine images into one PDF',
  'picture to PDF',
  'imge to pdf',
  'img to pfd',
  'image to pfd',
  'jpg to pfd',
  'pic to pdf',
  // Image Size Reducer / Compression cluster
  'image size reducer',
  'img size reducer',
  'reduce image size',
  'reduce image size in KB',
  'reduce photo size KB',
  'image size reducer 20KB',
  'image size reducer 50KB',
  'image size reducer 100KB',
  'MB to KB image converter',
  'compress image online',
  'photo compressor',
  'compress JPG PNG WebP',
  'resize image for online form',
  'img size reduser',
  'image size reduser',
  'compres image',
  'imge compressor',
  'reduce img size',
  // PDF Utilities & Office Conversion cluster
  'compress PDF',
  'reduce PDF size in KB',
  'compres pdf',
  'merge PDF',
  'marge pdf',
  'combine PDF files',
  'split PDF',
  'spilt pdf',
  'PDF to Word converter',
  'Word to PDF converter',
  'wrod to pdf',
  'make PDF look scanned',
  'Scan Studio',
  'zero upload PDF tools',
  'private browser PDF editor',
];

const RELATED_DEFAULTS: { label: string; href: string; tag: string }[] = [
  { label: 'Online PDF Editor', href: '/tools/pdf-editor', tag: 'Edit Text' },
  { label: 'Image to PDF (JPG / PNG)', href: '/pdf/jpg-to-pdf', tag: 'IMG to PDF' },
  { label: 'Image Size Reducer (KB / MB)', href: '/tools/image-size-reducer', tag: '20KB–500KB' },
  { label: 'Compress PDF Size', href: '/pdf/compress-pdf', tag: 'Reduce PDF' },
  { label: 'Merge Multiple PDFs', href: '/pdf/merge-pdf', tag: 'Combine' },
  { label: 'PDF to Word (DOCX)', href: '/pdf/pdf-to-word', tag: 'Convert' },
  { label: 'Scan Studio Photocopier FX', href: '/scan-studio', tag: 'Scan Look' },
  { label: 'Batch Image Converter', href: '/image-converter', tag: 'WebP/PNG' },
];

export const TOOL_SEO_PROFILES: Record<string, ToolSeoProfile> = {
  'pdf-editor': {
    id: 'pdf-editor',
    route: '/tools/pdf-editor',
    canonicalUrl: `${SITE_BASE_URL}/tools/pdf-editor`,
    breadcrumbParent: { name: 'PDF Tools', href: '/pdf' },
    seoTitle: 'Free Online PDF Editor — Edit PDF Text, Images & Sign PDF',
    metaDescription:
      'Edit PDF text in place, move lines smoothly with snap guides, whiteout text, insert images, shapes, and signatures online for free with zero server uploads.',
    h1: 'Free Online PDF Editor — Edit PDF Text, Layout & Signatures',
    subtitle:
      'Edit existing PDF text, drag and align rows cleanly with smart snap guides, insert images, highlight, whiteout, and export instantly in your browser.',
    keywords: [
      'PDF editor',
      'free online PDF editor',
      'edit PDF online',
      'edit PDF text free',
      'modify PDF document',
      'PDF text editor no watermark',
      'add image to PDF',
      'sign PDF online',
      'whiteout PDF online',
      'Acrobat alternative free',
      'Sejda alternative private',
      'pdf editer',
      'eddit pdf',
      'pdf editr online',
      'edite pdf',
    ],
    alternateNames: [
      'Online PDF Editor',
      'PDF Editer',
      'Edit PDF Text Tool',
      'Free PDF Modifier',
      'Eddit PDF Online',
    ],
    overview:
      'Gyanvatsala’s Online PDF Editor loads your document directly inside your browser’s memory so sensitive resumes, contracts, invoices, and certificates never leave your device. Click any text row to edit wording, change typography, drag lines smoothly with temporary alignment snap guides, cover outdated entries cleanly, or stamp signatures and images at exact coordinates.',
    highlights: [
      'Direct in-place PDF text editing, font sizing, bold/italic styling, and color changes',
      'Free mouse row movement with temporary dotted horizontal & vertical alignment snap guides',
      'Whiteout tool, signature pad, shapes, callouts, and precise image placement',
      '100% private WebAssembly & Canvas rendering — zero file uploads to third-party servers',
    ],
    howToTitle: 'How to Edit a PDF Online for Free',
    howToSteps: [
      {
        name: 'Upload Your PDF File',
        text: 'Drag and drop any PDF file from your computer or phone into the browser workspace.',
      },
      {
        name: 'Edit Text, Images, or Layout',
        text: 'Click text lines to rewrite content, drag rows with smart alignment guides, or insert signatures and whiteouts.',
      },
      {
        name: 'Export Your Edited PDF',
        text: 'Click Export PDF to save a crisp, high-resolution PDF directly to your device with zero watermarks.',
      },
    ],
    faqs: [
      {
        question: 'Can I edit PDF text online without downloading software?',
        answer:
          'Yes. Gyanvatsala’s PDF Editor runs completely in Chrome, Safari, Edge, or Firefox so you can change PDF text, move rows, add signatures, and download immediately without installing desktop software.',
      },
      {
        question: 'Are my confidential PDF files uploaded to a server when editing?',
        answer:
          'No. All PDF parsing, font editing, annotations, and final PDF generation happen locally inside your browser RAM using WebAssembly and Canvas.',
      },
      {
        question: 'How do I align moved text rows straight in the PDF editor?',
        answer:
          'Simply drag any text block freely with your mouse cursor. Temporary dotted blue alignment snap guides automatically appear when edges or centers match surrounding rows or page margins.',
      },
    ],
    relatedLinks: RELATED_DEFAULTS,
  },

  'jpg-to-pdf': {
    id: 'jpg-to-pdf',
    route: '/pdf/jpg-to-pdf',
    canonicalUrl: `${SITE_BASE_URL}/pdf/jpg-to-pdf`,
    breadcrumbParent: { name: 'PDF Tools', href: '/pdf' },
    seoTitle: 'Image to PDF (IMG & JPG to PDF) Converter — Free & Fast',
    metaDescription:
      'Convert IMG, JPG, JPEG, PNG, WebP, or BMP photos into one clean PDF document online free. Control A4/Letter size, margins, orientation & order in-browser.',
    h1: 'Image to PDF Converter — IMG, JPG & PNG to PDF',
    subtitle:
      'Turn single photos or multi-page image batches (JPG, PNG, WebP, BMP) into one cleanly formatted A4 or Letter PDF directly inside your browser.',
    keywords: [
      'img to pdf',
      'image to pdf',
      'jpg to pdf',
      'jpeg to pdf',
      'png to pdf',
      'photo to pdf converter',
      'convert image to pdf free',
      'combine jpg into pdf',
      'multiple images to pdf',
      'pictures to pdf',
      'a4 jpg to pdf',
      'imge to pdf',
      'img to pfd',
      'image to pfd',
      'jpg to pfd',
      'pic to pdf',
      'photos to pdf online',
    ],
    alternateNames: [
      'IMG to PDF',
      'JPG to PDF Converter',
      'PNG to PDF',
      'Imge to PDF',
      'Photo to PDF',
      'Image to PFD',
    ],
    overview:
      'Whether you need to bundle ID proofs, receipts, homework scans, or portfolio graphics into a shareable document, Gyanvatsala converts JPG, JPEG, PNG, WebP, and BMP images to PDF in seconds. Reorder thumbnails, set A4, Letter, or Fit-to-Image sizing, adjust page margins, and keep every pixel private on your device.',
    highlights: [
      'Supports JPG, JPEG, PNG, WebP, and BMP images in multi-file batches',
      'Choose A4, US Letter, or Auto-Fit page size with portrait/landscape control',
      'Combine all images into one single PDF or export individual PDFs in a ZIP',
      'Zero uploads, zero ads clutter, and no artificial quality distortion',
    ],
    howToTitle: 'How to Convert Images (IMG / JPG / PNG) to PDF',
    howToSteps: [
      {
        name: 'Select or Drop Images',
        text: 'Add one or more JPG, PNG, WebP, or BMP photos into the converter.',
      },
      {
        name: 'Choose Page Size & Margin Settings',
        text: 'Pick A4, Letter, or Fit page dimensions, orientation, and normal or borderless margins.',
      },
      {
        name: 'Convert & Download PDF',
        text: 'Click Convert Now to combine your images into a clean, print-ready PDF instantly.',
      },
    ],
    faqs: [
      {
        question: 'Can I convert multiple JPG and PNG images into one PDF?',
        answer:
          'Yes. Add as many supported images as your batch allows, keep "Combine into one PDF" enabled, and download a single ordered PDF containing every image.',
      },
      {
        question: 'Does Image to PDF work for IMG files from mobile cameras and screenshots?',
        answer:
          'Yes. Photos saved as JPG, JPEG, PNG, or WebP from Android, iPhone, Windows, or macOS convert smoothly with selectable margins and A4/Letter scaling.',
      },
      {
        question: 'Can I reduce image size before converting to PDF?',
        answer:
          'Yes! Use our Image Size Reducer to shrink photo file size in KB first, or compress the exported PDF afterwards with our Compress PDF tool.',
      },
    ],
    relatedLinks: RELATED_DEFAULTS,
  },

  'image-size-reducer': {
    id: 'image-size-reducer',
    route: '/tools/image-size-reducer',
    canonicalUrl: `${SITE_BASE_URL}/tools/image-size-reducer`,
    breadcrumbParent: { name: 'Image Tools', href: '/image-tools' },
    seoTitle: 'Image Size Reducer in KB & MB — Compress IMG Online Free',
    metaDescription:
      'Free online Image Size Reducer (IMG compressor). Shrink JPG, JPEG, PNG, and WebP photos to exact 20KB, 50KB, 100KB, or 200KB sizes privately in your browser.',
    h1: 'Image Size Reducer — Compress Photos to Exact KB & MB',
    subtitle:
      'Reduce JPG, PNG, and WebP image size to 20KB, 50KB, 100KB, or custom KB limits for online application forms, portals, and websites with zero server uploads.',
    keywords: [
      'image size reducer',
      'img size reducer',
      'reduce image size',
      'reduce image size in kb',
      'image size reducer in kb',
      'photo size reducer',
      'compress image to 50kb',
      'compress image to 20kb',
      'compress image to 100kb',
      'reduce jpg size kb',
      'mb to kb image converter',
      'reduce photo size without losing quality',
      'compress png online',
      'img size reduser',
      'image size reduser',
      'compres image',
      'imge compressor',
      'reduce imge size',
      'photo size kam karne wala',
    ],
    alternateNames: [
      'IMG Size Reducer',
      'Photo Size Reducer in KB',
      'Image Compressor KB/MB',
      'Image Size Reduser',
      'Compres Image Tool',
      'MB to KB Photo Converter',
    ],
    overview:
      'Government portals, job forms, university admissions, and websites frequently reject large photos over 50KB, 100KB, or 200KB. Gyanvatsala’s Image Size Reducer intelligently tunes compression quality and optional max dimensions directly in your browser so you hit exact KB targets cleanly without uploading personal IDs or photos.',
    highlights: [
      'One-click KB target presets: 20KB, 50KB, 100KB, 200KB, and 500KB plus custom KB input',
      'Works with JPG, JPEG, PNG, and WebP files with optional format conversion',
      'Instant before-and-after byte savings comparison and preview before download',
      '100% browser-native compression — keeps passport photos, signatures, and IDs private',
    ],
    howToTitle: 'How to Reduce Image Size in KB Online',
    howToSteps: [
      {
        name: 'Upload Your Photo or Image',
        text: 'Select or drag any JPG, PNG, or WebP image into the Image Size Reducer.',
      },
      {
        name: 'Select Target KB or Quality Slider',
        text: 'Click a preset like 20KB, 50KB, or 100KB (or set custom KB & quality percentage).',
      },
      {
        name: 'Download Compressed Image',
        text: 'Inspect the reduced file size in KB/MB and download your optimized photo immediately.',
      },
    ],
    faqs: [
      {
        question: 'How can I reduce an image from MB to 50KB or 100KB without blurring?',
        answer:
          'Select 50KB or 100KB in the target size presets, keep output format as JPEG or WebP, and optionally cap max width/height (such as 1200px or 800px). Our iterative compressor finds the highest visual quality that fits under your KB limit.',
      },
      {
        question: 'Can I compress passport photos and signatures to 20KB?',
        answer:
          'Yes! Choose the 20KB preset (or enter any exact KB target like 30KB or 40KB) to resize and compress signatures, passport photos, and exam upload images safely on your own device.',
      },
      {
        question: 'Is this IMG size reducer free and private?',
        answer:
          'Yes. Everything executes locally using your browser Web Worker and Canvas engine, so personal documents and photos are never sent to external servers.',
      },
    ],
    relatedLinks: RELATED_DEFAULTS,
  },

  'compress-pdf': {
    id: 'compress-pdf',
    route: '/pdf/compress-pdf',
    canonicalUrl: `${SITE_BASE_URL}/pdf/compress-pdf`,
    breadcrumbParent: { name: 'PDF Tools', href: '/pdf' },
    seoTitle: 'Compress PDF Online Free — Reduce PDF File Size in KB & MB',
    metaDescription:
      'Reduce PDF file size online without losing readability. Shrink large PDF documents in KB/MB for email and portals cleanly with zero server uploads.',
    h1: 'Compress PDF — Reduce PDF File Size Online',
    subtitle:
      'Shrink oversized PDFs for email attachments, visa portals, and academic uploads in seconds while keeping pages legible and completely private.',
    keywords: [
      'compress pdf',
      'reduce pdf file size',
      'pdf size reducer',
      'compress pdf to 100kb',
      'compress pdf to 200kb',
      'shrink pdf online free',
      'pdf compressor',
      'compres pdf',
      'comress pdf',
      'reduce pdf size online',
    ],
    alternateNames: [
      'PDF Compressor',
      'PDF Size Reducer',
      'Compres PDF',
      'Shrink PDF Free',
    ],
    overview:
      'Large scanned PDFs and image-heavy reports quickly exceed attachment limits. Gyanvatsala’s Compress PDF engine optimizes embedded image resolution, object streams, and compression ratios directly in your browser.',
    highlights: [
      'Multiple compression presets from light optimization to maximum KB/MB reduction',
      'Preserves sharp page dimensions and readable text',
      'Private client-side processing — zero uploads for resumes, tax returns, or contracts',
    ],
    howToTitle: 'How to Reduce PDF File Size Online',
    howToSteps: [
      { name: 'Upload Large PDF', text: 'Drop any oversized PDF document into the workspace.' },
      { name: 'Choose Compression Level', text: 'Pick balanced or strong compression depending on your MB/KB goal.' },
      { name: 'Download Smaller PDF', text: 'Run compression and save your lightweight PDF instantly.' },
    ],
    faqs: [
      {
        question: 'How much smaller will my compressed PDF be?',
        answer:
          'PDFs containing embedded scans or photos often shrink by 40% to 80% depending on image density and chosen compression preset.',
      },
      {
        question: 'Are compressed PDFs safe for official submissions?',
        answer:
          'Yes. Files never leave your computer during compression and exports carry zero added watermarks.',
      },
    ],
    relatedLinks: RELATED_DEFAULTS,
  },

  'merge-pdf': {
    id: 'merge-pdf',
    route: '/pdf/merge-pdf',
    canonicalUrl: `${SITE_BASE_URL}/pdf/merge-pdf`,
    breadcrumbParent: { name: 'PDF Tools', href: '/pdf' },
    seoTitle: 'Merge PDF Files Online Free — Combine PDFs in Exact Order',
    metaDescription:
      'Merge multiple PDF documents into one unified PDF online for free. Drag to reorder files privately in your browser with zero uploads or watermarks.',
    h1: 'Merge PDF — Combine Multiple PDF Files Into One',
    subtitle:
      'Join invoices, certificates, chapters, and reports into a single seamlessly ordered PDF right inside your browser.',
    keywords: [
      'merge pdf',
      'combine pdf files',
      'join pdf online free',
      'pdf combiner',
      'merge two pdfs',
      'marge pdf',
      'merg pdf',
      'combain pdf',
    ],
    alternateNames: ['Combine PDF', 'Marge PDF', 'Join PDF Files', 'PDF Combiner'],
    overview:
      'Quickly combine two or dozens of PDF files into one structured document without uploading confidential records to third-party clouds.',
    highlights: [
      'Drag-and-drop sequence ordering before merging',
      'Preserves vector text, links, and page orientation',
      'Instant client-side assembly with zero file limits from cloud queues',
    ],
    howToTitle: 'How to Merge PDF Files Together',
    howToSteps: [
      { name: 'Add Multiple PDFs', text: 'Select or drag all the PDF files you want to combine.' },
      { name: 'Arrange File Order', text: 'Order files cleanly from first page bundle to last.' },
      { name: 'Merge & Download', text: 'Click Convert Now to download one combined PDF file.' },
    ],
    faqs: [
      {
        question: 'Can I rearrange pages across multiple PDFs while merging?',
        answer:
          'Yes! For page-level drag-and-drop and alternating interleaving across PDFs, also try our Visual PDF Assembler.',
      },
    ],
    relatedLinks: RELATED_DEFAULTS,
  },

  'split-pdf': {
    id: 'split-pdf',
    route: '/pdf/split-pdf',
    canonicalUrl: `${SITE_BASE_URL}/pdf/split-pdf`,
    breadcrumbParent: { name: 'PDF Tools', href: '/pdf' },
    seoTitle: 'Split PDF Pages Online Free — Extract Page Ranges Instantly',
    metaDescription:
      'Split PDF files by page range or extract every page into separate PDF documents online free with zero uploads.',
    h1: 'Split PDF — Separate Pages & Extract Ranges',
    subtitle:
      'Extract exact page ranges or split multi-page PDF files into standalone pages quickly inside your browser.',
    keywords: [
      'split pdf',
      'extract pdf pages',
      'separate pdf pages',
      'cut pdf online',
      'spilt pdf',
      'split pfd',
    ],
    alternateNames: ['Extract PDF Pages', 'Spilt PDF', 'Separate PDF Pages'],
    overview:
      'Break large manuals, e-books, or multi-document scans into clean individual pages or custom page ranges without uploading private data.',
    highlights: [
      'Extract specific page ranges (e.g., 1-5, 8, 10-12) or split every page individually',
      'Download clean PDF outputs or bundled ZIP archive',
      '100% browser-based privacy',
    ],
    howToTitle: 'How to Split a PDF Online',
    howToSteps: [
      { name: 'Load PDF', text: 'Select the multi-page PDF document from your device.' },
      { name: 'Specify Page Ranges', text: 'Choose Split All Pages or enter exact page ranges.' },
      { name: 'Download Extracted PDFs', text: 'Export separated pages immediately with zero server uploads.' },
    ],
    faqs: [
      {
        question: 'Can I extract just specific pages like pages 2 to 5?',
        answer:
          'Yes. Enter custom page ranges like 2-5 or single page numbers to extract only what you need.',
      },
    ],
    relatedLinks: RELATED_DEFAULTS,
  },

  'pdf-to-word': {
    id: 'pdf-to-word',
    route: '/pdf/pdf-to-word',
    canonicalUrl: `${SITE_BASE_URL}/pdf/pdf-to-word`,
    breadcrumbParent: { name: 'PDF Tools', href: '/pdf' },
    seoTitle: 'PDF to Word Converter Free — Convert PDF to Editable DOCX',
    metaDescription:
      'Convert PDF to editable Microsoft Word (DOCX) online free while preserving paragraphs, fonts, and data tables cleanly in-browser.',
    h1: 'PDF to Word Converter — Export Editable DOCX',
    subtitle:
      'Extract text, headings, and tables from PDF documents into editable Microsoft Word DOCX files right inside your browser.',
    keywords: [
      'pdf to word',
      'convert pdf to word',
      'pdf to docx online free',
      'pdf to doc',
      'pdf to wrod',
      'editable word from pdf',
    ],
    alternateNames: ['PDF to DOCX', 'PDF to Wrod', 'Convert PDF to Word Free'],
    overview:
      'Turn static PDFs into editable Word documents without uploading contracts or resumes to remote servers.',
    highlights: [
      'Reconstructs headings, body paragraphs, and tabular structures cleanly into DOCX',
      'Fast in-browser parsing and ZIP/DOCX download',
      'Zero uploads and zero watermarks',
    ],
    howToTitle: 'How to Convert PDF to Word DOCX',
    howToSteps: [
      { name: 'Upload PDF', text: 'Choose the PDF file you want to convert into Microsoft Word.' },
      { name: 'Start Conversion', text: 'Click Convert Now to extract structure and generate DOCX.' },
      { name: 'Open in Word or Google Docs', text: 'Download your editable .docx file cleanly.' },
    ],
    faqs: [
      {
        question: 'Can I edit the resulting DOCX file in Microsoft Word or Google Docs?',
        answer:
          'Yes. The generated file is standard Office Open XML (.docx), compatible with Microsoft Word, Google Docs, and LibreOffice Writer.',
      },
    ],
    relatedLinks: RELATED_DEFAULTS,
  },

  'word-to-pdf': {
    id: 'word-to-pdf',
    route: '/pdf/word-to-pdf',
    canonicalUrl: `${SITE_BASE_URL}/pdf/word-to-pdf`,
    breadcrumbParent: { name: 'PDF Tools', href: '/pdf' },
    seoTitle: 'Word to PDF Converter Free — Convert DOCX to PDF Online',
    metaDescription:
      'Convert Word (DOC, DOCX) documents into clean, printable PDF files online free directly in your browser.',
    h1: 'Word to PDF Converter — DOCX & DOC to PDF',
    subtitle:
      'Convert Microsoft Word resumes, letters, and reports into consistent cross-device PDF files cleanly in your browser.',
    keywords: [
      'word to pdf',
      'docx to pdf',
      'doc to pdf',
      'convert word to pdf online',
      'wrod to pdf',
      'word to pfd',
    ],
    alternateNames: ['DOCX to PDF', 'DOC to PDF', 'Wrod to PDF'],
    overview:
      'Ensure your formatting stays locked before sharing resumes or official letters by converting DOCX files into crisp PDF documents privately.',
    highlights: [
      'Preserves typography, headings, lists, and clean A4 pagination',
      'Zero external document retention — 100% browser processing',
    ],
    howToTitle: 'How to Convert Word DOCX to PDF',
    howToSteps: [
      { name: 'Upload Word File', text: 'Drop your .docx or .doc file into the converter.' },
      { name: 'Convert to PDF', text: 'Click Convert Now to render your formatted PDF pages.' },
      { name: 'Save PDF', text: 'Download your ready-to-share PDF document.' },
    ],
    faqs: [
      {
        question: 'Does Word to PDF work without Microsoft Office installed?',
        answer:
          'Yes. Our browser converter parses DOCX formatting directly without requiring Word or Office 365.',
      },
    ],
    relatedLinks: RELATED_DEFAULTS,
  },

  'pdf-to-jpg': {
    id: 'pdf-to-jpg',
    route: '/pdf/pdf-to-jpg',
    canonicalUrl: `${SITE_BASE_URL}/pdf/pdf-to-jpg`,
    breadcrumbParent: { name: 'PDF Tools', href: '/pdf' },
    seoTitle: 'PDF to JPG & PNG Converter — Extract PDF Pages as Images',
    metaDescription:
      'Convert every page of a PDF into high-resolution JPG or PNG images online free in your browser.',
    h1: 'PDF to JPG / PNG Converter — Export High-DPI Images',
    subtitle:
      'Render PDF pages as sharp JPG or PNG images with selectable DPI resolution and instant ZIP download.',
    keywords: [
      'pdf to jpg',
      'pdf to png',
      'pdf to image',
      'pdf to img',
      'convert pdf pages to jpg',
      'pdf to jpeg free',
    ],
    alternateNames: ['PDF to Image', 'PDF to IMG', 'PDF to PNG'],
    overview:
      'Convert slides, flyers, certificates, or PDF pages into high-resolution images for presentations and social sharing.',
    highlights: [
      'Export crisp JPG or lossless PNG files at customizable DPI',
      'Download individual page images or a single ZIP archive',
    ],
    howToTitle: 'How to Convert PDF Pages to JPG or PNG',
    howToSteps: [
      { name: 'Select PDF', text: 'Upload the PDF file whose pages you want as images.' },
      { name: 'Pick JPG or PNG & DPI', text: 'Choose image format and quality resolution.' },
      { name: 'Download Images', text: 'Save individual rendered pages or one bundled ZIP.' },
    ],
    faqs: [
      {
        question: 'Can I choose PNG instead of JPG?',
        answer: 'Yes, you can select JPEG or lossless PNG format before running conversion.',
      },
    ],
    relatedLinks: RELATED_DEFAULTS,
  },

  'pdf-assembler': {
    id: 'pdf-assembler',
    route: '/tools/pdf-assembler',
    canonicalUrl: `${SITE_BASE_URL}/tools/pdf-assembler`,
    breadcrumbParent: { name: 'PDF Tools', href: '/pdf' },
    seoTitle: 'Visual PDF Assembler — Reorder, Rotate & Merge PDF Pages',
    metaDescription:
      'Combine PDFs and visually drag, reorder, rotate, duplicate, or delete individual pages inside an interactive page grid.',
    h1: 'Visual PDF Assembler — Reorder, Rotate & Combine Pages',
    subtitle:
      'See thumbnails of every page across multiple PDFs and visually sort, rotate, remove, or merge them cleanly.',
    keywords: [
      'pdf assembler',
      'reorder pdf pages',
      'organize pdf pages online',
      'rearrange pdf',
      'combine and sort pdf pages',
    ],
    alternateNames: ['PDF Page Organizer', 'Rearrange PDF Pages'],
    overview:
      'Inspect multi-document binders side by side, drag thumbnails into the exact order you want, fix rotated scans, and export one clean PDF.',
    highlights: [
      'Visual thumbnail binder across multiple uploaded PDFs and images',
      'Rotate 90/180 degrees, duplicate, delete, and interleave pages',
    ],
    howToTitle: 'How to Visually Reorder & Assemble PDFs',
    howToSteps: [
      { name: 'Add PDFs or Images', text: 'Load one or several documents into the assembler canvas.' },
      { name: 'Drag & Organize Pages', text: 'Reorder, rotate, or delete individual thumbnails effortlessly.' },
      { name: 'Export Combined PDF', text: 'Save your newly ordered PDF in seconds.' },
    ],
    faqs: [
      {
        question: 'Can I mix images and PDF pages together?',
        answer: 'Yes! You can drop PDFs alongside JPG/PNG images and arrange every page in sequence.',
      },
    ],
    relatedLinks: RELATED_DEFAULTS,
  },

  'canvas-editor': {
    id: 'canvas-editor',
    route: '/tools/canvas-editor',
    canonicalUrl: `${SITE_BASE_URL}/tools/canvas-editor`,
    breadcrumbParent: { name: 'PDF Tools', href: '/pdf' },
    seoTitle: 'Document Layout Canvas Editor — Snap Alignment & Text Blocks',
    metaDescription:
      'Interactive A4 document layout editor with draggable text rows, magnetic snap alignment guides, inline formatting, and keyboard nudging.',
    h1: 'Interactive Document Canvas Editor with Smart Snap Guides',
    subtitle:
      'Drag text rows freely across an A4 layout canvas with temporary dotted alignment guides, inline formatting, and 1px/10px keyboard nudging.',
    keywords: [
      'document canvas editor',
      'snap alignment text editor',
      'resume layout editor',
      'drag text row alignment guides',
    ],
    alternateNames: ['A4 Document Canvas Editor', 'Smart Snap Text Editor'],
    overview:
      'Design and refine structured resume and document rows visually on an A4 canvas with smooth pointer-captured dragging and smart dotted snap alignment guides.',
    highlights: [
      'Magnetic snapping to sibling block edges, centers, and page centerlines',
      'Floating contextual formatting bar with bold, italic, size, color, and duplicate',
    ],
    howToTitle: 'How to Arrange Document Rows on Canvas',
    howToSteps: [
      { name: 'Click Any Text Block', text: 'Select a row to reveal formatting controls and bounds.' },
      { name: 'Drag or Nudge Position', text: 'Move freely with mouse pointer while temporary blue snap guides align rows.' },
      { name: 'Double-Click to Edit Text', text: 'Edit inline wording or add and duplicate rows instantly.' },
    ],
    faqs: [
      {
        question: 'Do the dotted alignment lines show up in exported output?',
        answer: 'No, snap alignment guides are temporary visual helpers visible only while dragging.',
      },
    ],
    relatedLinks: RELATED_DEFAULTS,
  },
};

// Build fallback SEO profiles for every remaining tool in ALL_PDF_TOOLS cleanly
for (const tool of ALL_PDF_TOOLS) {
  if (!TOOL_SEO_PROFILES[tool.id]) {
    const cleanSlug = tool.id;
    const altSlugTypo = cleanSlug.replace('-', ' ');
    TOOL_SEO_PROFILES[tool.id] = {
      id: tool.id,
      route: `/pdf/${tool.id}`,
      canonicalUrl: `${SITE_BASE_URL}/pdf/${tool.id}`,
      breadcrumbParent: { name: 'PDF Tools', href: '/pdf' },
      seoTitle: `${tool.name} Online Free — Private Browser Tool`,
      metaDescription: `${tool.shortDesc} Free, fast, and 100% private in-browser ${tool.name} with zero server uploads.`,
      h1: `${tool.name} — Free Online & Private`,
      subtitle: `${tool.shortDesc} Runs 100% inside your browser without uploading files to external servers.`,
      keywords: [
        tool.name,
        `${tool.name} online`,
        `free ${tool.name}`,
        altSlugTypo,
        `${tool.fromFormat.toLowerCase()} to ${tool.toFormat.toLowerCase()}`,
        'private PDF tool',
        'zero upload PDF converter',
        'Gyanvatsala',
      ],
      alternateNames: [tool.name, `${tool.name} Free`, altSlugTypo],
      overview: `Use Gyanvatsala’s ${tool.name} tool directly inside your web browser to process ${tool.fromFormat} files into ${tool.toFormat} cleanly without sending confidential documents to remote servers.`,
      highlights: [
        `Supports ${tool.fromFormat} input and outputs clean ${tool.toFormat}`,
        'Instant client-side WebAssembly execution with zero file upload delays',
        'Clean results without intrusive watermarks',
      ],
      howToTitle: `How to Use ${tool.name} Online`,
      howToSteps: [
        { name: `Upload ${tool.fromFormat} File`, text: `Drag and drop your ${tool.fromFormat} file into the tool dropzone.` },
        { name: 'Adjust Tool Options', text: 'Select any page range, visual formatting, or quality preferences.' },
        { name: `Download ${tool.toFormat}`, text: 'Click Convert Now and download your output immediately.' },
      ],
      faqs: [
        {
          question: `Is ${tool.name} free and safe for confidential files?`,
          answer: `Yes. Gyanvatsala executes ${tool.name} directly in your browser memory so your documents are never transmitted to external servers.`,
        },
        {
          question: `What file formats work with ${tool.name}?`,
          answer: `This tool accepts ${tool.fromFormat} files and outputs ${tool.toFormat} directly in your browser.`,
        },
      ],
      relatedLinks: RELATED_DEFAULTS,
    };
  }
}

export const TOOL_SLUG_ALIASES: Record<string, string> = {
  // Image to PDF / IMG to PDF & common typos
  'img-to-pdf': 'jpg-to-pdf',
  'image-to-pdf': 'jpg-to-pdf',
  'images-to-pdf': 'jpg-to-pdf',
  'png-to-pdf': 'jpg-to-pdf',
  'jpeg-to-pdf': 'jpg-to-pdf',
  'photo-to-pdf': 'jpg-to-pdf',
  'photos-to-pdf': 'jpg-to-pdf',
  'pic-to-pdf': 'jpg-to-pdf',
  'picture-to-pdf': 'jpg-to-pdf',
  'imge-to-pdf': 'jpg-to-pdf',
  'img-to-pfd': 'jpg-to-pdf',
  'image-to-pfd': 'jpg-to-pdf',
  'jpg-to-pfd': 'jpg-to-pdf',
  'png-to-pfd': 'jpg-to-pdf',
  // PDF to Image variants
  'pdf-to-png': 'pdf-to-jpg',
  'pdf-to-img': 'pdf-to-jpg',
  'pdf-to-image': 'pdf-to-jpg',
  'pdf-to-images': 'pdf-to-jpg',
  'pdf-to-jpeg': 'pdf-to-jpg',
  // PDF Editor & typos
  'edit-pdf': 'pdf-editor',
  'pdf-editer': 'pdf-editor',
  'pdf-editr': 'pdf-editor',
  'eddit-pdf': 'pdf-editor',
  'edite-pdf': 'pdf-editor',
  'pdf-modifier': 'pdf-editor',
  // Compress / Merge / Split & typos
  'reduce-pdf': 'compress-pdf',
  'reduce-pdf-size': 'compress-pdf',
  'pdf-size-reducer': 'compress-pdf',
  'pdf-compressor': 'compress-pdf',
  'compres-pdf': 'compress-pdf',
  'comress-pdf': 'compress-pdf',
  'compress-pfd': 'compress-pdf',
  'combine-pdf': 'merge-pdf',
  'join-pdf': 'merge-pdf',
  'marge-pdf': 'merge-pdf',
  'merg-pdf': 'merge-pdf',
  'merge-pfd': 'merge-pdf',
  'combain-pdf': 'merge-pdf',
  'spilt-pdf': 'split-pdf',
  'splt-pdf': 'split-pdf',
  'extract-pdf-pages': 'split-pdf',
  'separate-pdf': 'split-pdf',
  // Word / Excel / PPT & typos
  'pdf-to-docx': 'pdf-to-word',
  'pdf-to-doc': 'pdf-to-word',
  'pdf-to-wrod': 'pdf-to-word',
  'docx-to-pdf': 'word-to-pdf',
  'doc-to-pdf': 'word-to-pdf',
  'wrod-to-pdf': 'word-to-pdf',
  'word-to-pfd': 'word-to-pdf',
  'xlsx-to-pdf': 'excel-to-pdf',
  'xls-to-pdf': 'excel-to-pdf',
  'csv-to-pdf': 'excel-to-pdf',
  'pdf-to-xlsx': 'pdf-to-excel',
  'pptx-to-pdf': 'powerpoint-to-pdf',
  'ppt-to-pdf': 'powerpoint-to-pdf',
  'pdf-to-pptx': 'pdf-to-powerpoint',
  // Signature / Watermark / Lock / Rotate / Page Numbers
  'esign-pdf': 'sign-pdf',
  'signature-pdf': 'sign-pdf',
  'add-signature-pdf': 'sign-pdf',
  'watermak-pdf': 'watermark-pdf',
  'wartermark-pdf': 'watermark-pdf',
  'add-page-numbers': 'page-numbers',
  'password-pdf': 'protect-pdf',
  'encrypt-pdf': 'protect-pdf',
  'lock-pdf': 'protect-pdf',
  'remove-pdf-password': 'unlock-pdf',
  'decrypt-pdf': 'unlock-pdf',
  'remove-pdf-pages': 'delete-pdf-pages',
  'rearrange-pdf': 'organize-pdf',
  'reorder-pdf': 'organize-pdf',
  'pdf-to-txt': 'pdf-to-text',
};

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[] = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= n; j++) {
      const temp = dp[j];
      if (a[i - 1] === b[j - 1]) {
        dp[j] = prev;
      } else {
        dp[j] = 1 + Math.min(prev, dp[j], dp[j - 1]);
      }
      prev = temp;
    }
  }
  return dp[n];
}

/**
 * Resolves a slug inside `/pdf/[tool]` from known aliases or close spelling typos (edit distance <= 2).
 */
export function resolveCanonicalToolSlug(slug: string): string | null {
  const normalized = slug.trim().toLowerCase().replace(/_/g, '-');
  if (normalized === 'compress-image') {
    return 'compress-image';
  }
  if (ALL_PDF_TOOLS.some((t) => t.id === normalized)) {
    return normalized;
  }
  if (TOOL_SLUG_ALIASES[normalized]) {
    return TOOL_SLUG_ALIASES[normalized];
  }

  let bestId: string | null = null;
  let bestDist = Infinity;
  for (const tool of ALL_PDF_TOOLS) {
    const dist = levenshtein(normalized, tool.id);
    if (dist <= 2 && dist < bestDist) {
      bestDist = dist;
      bestId = tool.id;
    }
  }
  if (bestId) return bestId;

  for (const [alias, canonical] of Object.entries(TOOL_SLUG_ALIASES)) {
    const dist = levenshtein(normalized, alias);
    if (dist <= 2 && dist < bestDist) {
      bestDist = dist;
      bestId = canonical;
    }
  }
  return bestId;
}

const CLIENT_SEARCH_SYNONYMS: Record<string, string[]> = {
  'pdf-editor': ['edit pdf', 'pdf editer', 'eddit', 'text editor', 'modify', 'whiteout', 'annotate'],
  'jpg-to-pdf': ['img to pdf', 'imge to pdf', 'image to pdf', 'png to pdf', 'photo to pdf', 'pic to pdf', 'pfd'],
  'compress-image': ['img size reducer', 'image size reducer', 'reduce size', 'kb', 'mb to kb', 'reduser', 'compres', 'photo size', '50kb', '20kb', '100kb'],
  'resize-image': ['dimensions', 'width height', 'px', 'scale photo', 'resizer'],
  'compress-pdf': ['compres pdf', 'reduce pdf', 'shrink pdf', 'pdf size reducer', 'kb', 'mb'],
  'merge-pdf': ['marge pdf', 'combine pdf', 'join pdf', 'merg'],
  'split-pdf': ['spilt pdf', 'cut pdf', 'extract pages', 'separate'],
  'pdf-to-word': ['docx', 'doc', 'pdf to wrod'],
  'word-to-pdf': ['docx to pdf', 'wrod to pdf', 'doc to pdf'],
  'sign-pdf': ['signature', 'esign', 'sign'],
  'scan-studio': ['look scanned', 'photocopier', 'scanner effect', 'scan pdf'],
};

/**
 * Typo-tolerant query matcher for workspace & tool hub search inputs.
 */
export function matchesSeoQuery(toolId: string, textFields: string[], rawQuery: string): boolean {
  const q = rawQuery.trim().toLowerCase();
  if (!q) return true;

  const extraTerms = [
    ...(CLIENT_SEARCH_SYNONYMS[toolId] || []),
    ...(TOOL_SEO_PROFILES[toolId]?.keywords || []),
    ...(TOOL_SEO_PROFILES[toolId]?.alternateNames || []),
  ];
  const haystack = [...textFields, ...extraTerms].join(' ').toLowerCase();
  if (haystack.includes(q)) return true;

  const queryTokens = q.split(/\s+/).filter(Boolean);
  const haystackWords = Array.from(new Set(haystack.split(/[^a-z0-9]+/).filter((w) => w.length >= 3)));

  return queryTokens.every((token) => {
    if (haystack.includes(token)) return true;
    if (token.length < 4) return false;
    const maxDist = token.length >= 7 ? 2 : 1;
    return haystackWords.some(
      (word) => Math.abs(word.length - token.length) <= maxDist && levenshtein(token, word) <= maxDist
    );
  });
}

export function getToolSeoProfile(id: string): ToolSeoProfile {
  if (id === 'compress-image') {
    return TOOL_SEO_PROFILES['image-size-reducer'];
  }
  return TOOL_SEO_PROFILES[id] || TOOL_SEO_PROFILES['pdf-editor'];
}

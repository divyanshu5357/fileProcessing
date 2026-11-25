'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { MotionConfig, motion, useReducedMotion } from 'framer-motion';
import {
  Search,
  X,
  ArrowRight,
  PenTool,
  LayoutGrid,
  ScanLine,
  FileText,
  FileSpreadsheet,
  Table,
  Presentation,
  Code,
  Minimize2,
  Maximize2,
  Crop,
  Layers,
  Image as ImageIcon,
  FileImage,
  Scissors,
  RotateCw,
  Trash2,
  ArrowDownUp,
  Download,
  Lock,
  Unlock,
  Stamp,
  Hash,
  AlignLeft,
  ShieldCheck,
  Contrast,
  Sparkles,
} from 'lucide-react';
import { CENTRAL_TOOL_REGISTRY } from '@/lib/toolRegistry';

export type DirectoryCategoryId =
  | 'all'
  | 'edit-sign'
  | 'convert-pdf'
  | 'image-kb'
  | 'scan-studio';

interface DirectoryCategoryTab {
  id: DirectoryCategoryId;
  label: string;
  sectionHeading: string;
  sectionSubtitle: string;
}

export interface DirectoryToolItem {
  id: string;
  name: string;
  anchorLabel: string;
  microcopy: string;
  route: string;
  category: Exclude<DirectoryCategoryId, 'all'>;
  iconName: string;
  searchTokens: string;
  badge?: string;
}

const CATEGORY_TABS: DirectoryCategoryTab[] = [
  {
    id: 'all',
    label: 'All Tools',
    sectionHeading: 'All Document, PDF & Image Utilities',
    sectionSubtitle: 'Every browser-local PDF editor, converter, KB compressor, and scan simulator ready in one click.',
  },
  {
    id: 'edit-sign',
    label: 'Edit & Sign PDF',
    sectionHeading: 'Edit, Sign, Merge & Organize PDFs',
    sectionSubtitle: 'Modify text, add signatures, rearrange pages, protect passwords, or redact cleanly without watermarks.',
  },
  {
    id: 'convert-pdf',
    label: 'Convert PDF',
    sectionHeading: 'Convert PDF to Office, Images & Archival Formats',
    sectionSubtitle: 'Convert JPG, PNG, Word, Excel, PowerPoint, and HTML to PDF—or extract editable DOCX, XLSX, and images.',
  },
  {
    id: 'image-kb',
    label: 'Image & KB Reducer',
    sectionHeading: 'Image Size Reducer in KB & Photo Studio',
    sectionSubtitle: 'Shrink photos and signatures to exact 20KB, 50KB, 100KB limits or crop passport photos for exam portals.',
  },
  {
    id: 'scan-studio',
    label: 'Scan Studio',
    sectionHeading: 'Scan Effect Simulator & Paper Optics',
    sectionSubtitle: 'Turn clean digital PDFs into authentic photocopied and desk-scanned pages locally on your device.',
  },
];

// Search-query optimized anchor copy & 1-line benefit microcopy overrides
const SEO_TOOL_OVERRIDES: Record<
  string,
  {
    anchorLabel: string;
    microcopy: string;
    category: Exclude<DirectoryCategoryId, 'all'>;
    extraTokens: string;
  }
> = {
  'pdf-editor': {
    anchorLabel: 'Online PDF Editor Without Watermark',
    microcopy: 'Edit PDF text in-place, whiteout fields, add shapes & export with zero watermarks.',
    category: 'edit-sign',
    extraTokens: 'edit pdf free aadhaar pan form text signature modify document',
  },
  'sign-pdf': {
    anchorLabel: 'Sign PDF Document Online Free',
    microcopy: 'Draw, type, or date-stamp your executive signature across any PDF page.',
    category: 'edit-sign',
    extraTokens: 'esign digital signature autograph contract form',
  },
  'pdf-assembler': {
    anchorLabel: 'Assemble & Mix PDF Pages Visually',
    microcopy: 'Combine, reorder, rotate, and interleave pages from multiple PDF or image files.',
    category: 'edit-sign',
    extraTokens: 'rearrange organizer combine visual workspace',
  },
  'merge-pdf': {
    anchorLabel: 'Merge Multiple PDF Files Together',
    microcopy: 'Join certificates, Aadhaar front/back, or multi-part reports into one clean PDF.',
    category: 'edit-sign',
    extraTokens: 'combine join aadhaar front back pan bank statement',
  },
  'split-pdf': {
    anchorLabel: 'Split PDF Pages & Extract Ranges',
    microcopy: 'Separate specific page ranges or save individual PDF sheets instantly.',
    category: 'edit-sign',
    extraTokens: 'extract separate cut remove pages',
  },
  'organize-pdf': {
    anchorLabel: 'Reorder, Rotate & Organize PDF Pages',
    microcopy: 'Drag-and-drop PDF thumbnails to reorder, flip, or delete unwanted pages.',
    category: 'edit-sign',
    extraTokens: 'sort rearrange pages thumbnail',
  },
  'rotate-pdf': {
    anchorLabel: 'Rotate PDF Pages 90° / 180°',
    microcopy: 'Fix upside-down or sideways scanned PDFs permanently in one click.',
    category: 'edit-sign',
    extraTokens: 'orientation portrait landscape turn',
  },
  'delete-pdf-pages': {
    anchorLabel: 'Remove & Delete Unwanted PDF Pages',
    microcopy: 'Select and strip blank covers or extra appendix sheets privately.',
    category: 'edit-sign',
    extraTokens: 'remove strip blank page',
  },
  'watermark-pdf': {
    anchorLabel: 'Add Custom Watermark to PDF',
    microcopy: 'Stamp Draft, Confidential, or logo watermarks with custom opacity and angle.',
    category: 'edit-sign',
    extraTokens: 'stamp confidential draft copyright',
  },
  'page-numbers': {
    anchorLabel: 'Add Page Numbers to PDF',
    microcopy: 'Insert Bates-style or Page X of Y numbering across headers and footers.',
    category: 'edit-sign',
    extraTokens: 'pagination footer header legal',
  },
  'protect-pdf': {
    anchorLabel: 'Protect PDF with Password Encryption',
    microcopy: 'Lock sensitive financial PDFs or Aadhaar exports with a strong open password.',
    category: 'edit-sign',
    extraTokens: 'encrypt lock password security aadhaar',
  },
  'unlock-pdf': {
    anchorLabel: 'Unlock Password-Protected PDFs',
    microcopy: 'Remove open password prompts from authorized bank or Aadhaar PDFs locally.',
    category: 'edit-sign',
    extraTokens: 'decrypt remove password aadhaar epan',
  },
  'crop-pdf': {
    anchorLabel: 'Crop PDF Whitespace & Margins',
    microcopy: 'Trim scanner borders evenly or adjust custom page margin points.',
    category: 'edit-sign',
    extraTokens: 'trim border margins size',
  },
  'flatten-pdf': {
    anchorLabel: 'Flatten PDF Forms & Annotations',
    microcopy: 'Lock form fields and signatures permanently so edits cannot be altered.',
    category: 'edit-sign',
    extraTokens: 'bake annotations non editable',
  },
  'compress-pdf': {
    anchorLabel: 'Compress PDF File Size',
    microcopy: 'Reduce PDF size for exam portals and email attachments without losing clarity.',
    category: 'edit-sign',
    extraTokens: 'reduce pdf kb mb shrink upload quality 100kb 200kb 1mb',
  },
  'jpg-to-pdf': {
    anchorLabel: 'Convert JPG & PNG Photos to PDF',
    microcopy: 'Combine ID photos, marksheets, or receipts into A4/Letter PDFs cleanly.',
    category: 'convert-pdf',
    extraTokens: 'img to pdf image to pdf photo aadhaar marksheet receipt a4',
  },
  'pdf-to-word': {
    anchorLabel: 'Convert PDF to Editable Word (DOCX)',
    microcopy: 'Extract clean paragraphs and two-column tables from PDF into DOCX files.',
    category: 'convert-pdf',
    extraTokens: 'docx resume edit text extract word',
  },
  'word-to-pdf': {
    anchorLabel: 'Convert Word (DOC / DOCX) to PDF',
    microcopy: 'Turn resumes, contracts, and Word reports into locked, print-ready PDFs.',
    category: 'convert-pdf',
    extraTokens: 'docx doc resume contract convert',
  },
  'excel-to-pdf': {
    anchorLabel: 'Convert Excel (XLS / XLSX / CSV) to PDF',
    microcopy: 'Export spreadsheets and invoices into clean, paginated PDF tables.',
    category: 'convert-pdf',
    extraTokens: 'spreadsheet csv invoice table',
  },
  'pdf-to-excel': {
    anchorLabel: 'Extract PDF Tables to Excel (XLSX)',
    microcopy: 'Pull bank statement rows and tabular data from PDFs into XLSX workbooks.',
    category: 'convert-pdf',
    extraTokens: 'bank statement table csv spreadsheet',
  },
  'powerpoint-to-pdf': {
    anchorLabel: 'Convert PowerPoint Slides (PPTX) to PDF',
    microcopy: 'Package presentation decks into portable PDFs that render identically everywhere.',
    category: 'convert-pdf',
    extraTokens: 'ppt deck slides handout',
  },
  'pdf-to-powerpoint': {
    anchorLabel: 'Convert PDF Pages to PowerPoint (PPTX)',
    microcopy: 'Turn PDF pitch decks and handouts back into editable slide presentations.',
    category: 'convert-pdf',
    extraTokens: 'ppt slides presentation',
  },
  'html-to-pdf': {
    anchorLabel: 'Convert HTML Markup to PDF',
    microcopy: 'Render HTML pages and clean invoices into crisp A4 or Letter PDF documents.',
    category: 'convert-pdf',
    extraTokens: 'webpage html code invoice',
  },
  'pdf-to-jpg': {
    anchorLabel: 'Convert PDF Pages to JPG / PNG Images',
    microcopy: 'Render crisp high-DPI JPG or PNG images from every page of a PDF.',
    category: 'convert-pdf',
    extraTokens: 'pdf to image png jpg extract page',
  },
  'extract-images': {
    anchorLabel: 'Extract Embedded Photos from PDF (ZIP)',
    microcopy: 'Pull original embedded images inside a PDF into a clean ZIP archive.',
    category: 'convert-pdf',
    extraTokens: 'photos assets zip extract',
  },
  'pdf-to-text': {
    anchorLabel: 'Extract Plain Text from PDF (TXT)',
    microcopy: 'Copy all readable text out of any digital PDF into a searchable TXT file.',
    category: 'convert-pdf',
    extraTokens: 'txt copy plain text ocr',
  },
  'pdf-to-pdfa': {
    anchorLabel: 'Convert PDF to Archival PDF/A',
    microcopy: 'Export ISO 19005 compliant PDF/A files for long-term legal compliance.',
    category: 'convert-pdf',
    extraTokens: 'archive iso compliance legal',
  },
  'grayscale-pdf': {
    anchorLabel: 'Convert Color PDF to Black & White',
    microcopy: 'Turn color documents into ink-saving, crisp monochrome print PDFs.',
    category: 'convert-pdf',
    extraTokens: 'black white monochrome print ink',
  },
  'compress-image': {
    anchorLabel: 'Reduce Image Size in KB (20KB–100KB)',
    microcopy: 'Compress JPG, PNG, and WebP photos to exact 20KB, 50KB, 100KB or percentage targets.',
    category: 'image-kb',
    extraTokens: '20kb photo 50kb 100kb signature ssc upsc neet passport exam portal',
  },
  'resize-image': {
    anchorLabel: 'Resize Photo Dimensions & Resolution',
    microcopy: 'Adjust pixel width, height, or aspect ratio cleanly without distortion.',
    category: 'image-kb',
    extraTokens: 'dimensions width height pixels scale',
  },
  'crop-image': {
    anchorLabel: 'Crop Photo for Exam Forms & Profiles',
    microcopy: 'Frame ID headshots, signatures, and social avatars with preset aspect ratios.',
    category: 'image-kb',
    extraTokens: 'headshot signature exam frame',
  },
  'convert-image': {
    anchorLabel: 'Convert Between JPG, PNG & WebP',
    microcopy: 'Switch image formats losslessly between JPG, PNG, and WebP inside your browser.',
    category: 'image-kb',
    extraTokens: 'png jpg webp svg bmp format converter',
  },
  'scan-studio': {
    anchorLabel: 'Scan Studio FX — Realistic Scan Simulator',
    microcopy: 'Apply optical skew, scanner light sweep, and paper grain so PDFs look printed & scanned.',
    category: 'scan-studio',
    extraTokens: 'photocopy look scanned attested skew noise texture',
  },
};

function resolveCategory(id: string, fallbackCategory: string): Exclude<DirectoryCategoryId, 'all'> {
  const override = SEO_TOOL_OVERRIDES[id];
  if (override) return override.category;
  if (fallbackCategory === 'scan') return 'scan-studio';
  if (fallbackCategory === 'image' || fallbackCategory === 'compression') return 'image-kb';
  if (fallbackCategory === 'conversion') return 'convert-pdf';
  return 'edit-sign';
}

const DIRECTORY_TOOLS: DirectoryToolItem[] = [
  ...CENTRAL_TOOL_REGISTRY.filter((t) => t.isAvailable).map((t) => {
    const ov = SEO_TOOL_OVERRIDES[t.id];
    const cat = resolveCategory(t.id, t.category);
    return {
      id: t.id,
      name: t.name,
      anchorLabel: ov?.anchorLabel ?? t.name,
      microcopy: ov?.microcopy ?? t.description,
      route: t.route,
      category: cat,
      iconName: t.iconName,
      badge: t.badge,
      searchTokens: `${t.name} ${ov?.anchorLabel ?? ''} ${t.description} ${t.supportedInputs.join(' ')} ${t.supportedOutputs.join(' ')} ${ov?.extraTokens ?? ''}`.toLowerCase(),
    };
  }),
  {
    id: 'passport-photo-studio',
    name: 'Passport Photo & EXIF Studio',
    anchorLabel: 'Create Passport Photos & Strip EXIF Data',
    microcopy: 'Generate printable passport photo sheets (India/US/UK) and strip camera metadata.',
    route: '/image-tools',
    category: 'image-kb',
    iconName: 'Sparkles',
    badge: 'Studio',
    searchTokens:
      'passport photo maker exif cleaner 20kb photo visa pan card headshot background remove metadata'.toLowerCase(),
  },
];

function renderToolIcon(iconName: string) {
  const props = { className: 'w-4 h-4 text-[#3B50B2] dark:text-[#93A5F5] shrink-0' };
  switch (iconName) {
    case 'PenTool':
      return <PenTool {...props} />;
    case 'LayoutGrid':
      return <LayoutGrid {...props} />;
    case 'ScanLine':
      return <ScanLine {...props} />;
    case 'FileText':
      return <FileText {...props} />;
    case 'FileSpreadsheet':
      return <FileSpreadsheet {...props} />;
    case 'Table':
      return <Table {...props} />;
    case 'Presentation':
      return <Presentation {...props} />;
    case 'Code':
      return <Code {...props} />;
    case 'Minimize2':
      return <Minimize2 {...props} />;
    case 'Maximize2':
      return <Maximize2 {...props} />;
    case 'Crop':
      return <Crop {...props} />;
    case 'Layers':
      return <Layers {...props} />;
    case 'Image':
      return <ImageIcon {...props} />;
    case 'FileImage':
      return <FileImage {...props} />;
    case 'Scissors':
      return <Scissors {...props} />;
    case 'RotateCw':
      return <RotateCw {...props} />;
    case 'Trash2':
      return <Trash2 {...props} />;
    case 'ArrowDownUp':
      return <ArrowDownUp {...props} />;
    case 'Download':
      return <Download {...props} />;
    case 'Lock':
      return <Lock {...props} />;
    case 'Unlock':
      return <Unlock {...props} />;
    case 'Stamp':
      return <Stamp {...props} />;
    case 'Hash':
      return <Hash {...props} />;
    case 'AlignLeft':
      return <AlignLeft {...props} />;
    case 'ShieldCheck':
      return <ShieldCheck {...props} />;
    case 'Contrast':
      return <Contrast {...props} />;
    case 'Sparkles':
      return <Sparkles {...props} />;
    default:
      return <FileText {...props} />;
  }
}

export function SearchableToolDirectory() {
  const [activeTab, setActiveTab] = useState<DirectoryCategoryId>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const prefersReduced = useReducedMotion();

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const filteredTools = useMemo(() => {
    const queryWords = normalizedQuery.split(/\s+/).filter(Boolean);
    return DIRECTORY_TOOLS.filter((tool) => {
      if (activeTab !== 'all' && tool.category !== activeTab) return false;
      if (queryWords.length === 0) return true;
      return queryWords.every((word) => tool.searchTokens.includes(word));
    });
  }, [activeTab, normalizedQuery]);

  // Semantic topical clusters when viewing All Tools without active text search
  const groupedSections = useMemo(() => {
    const orderedCategories = CATEGORY_TABS.filter((t) => t.id !== 'all');
    if (activeTab !== 'all' || normalizedQuery.length > 0) {
      const currentMeta = CATEGORY_TABS.find((t) => t.id === activeTab) ?? CATEGORY_TABS[0];
      return [
        {
          meta: currentMeta,
          items: filteredTools,
        },
      ];
    }
    return orderedCategories
      .map((tab) => ({
        meta: tab,
        items: filteredTools.filter((item) => item.category === tab.id),
      }))
      .filter((group) => group.items.length > 0);
  }, [activeTab, filteredTools, normalizedQuery]);

  return (
    <MotionConfig reducedMotion="user">
      <div className="space-y-8">
        {/* Heading + Live Filter Control Bar */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="max-w-2xl">
            <h2 className="text-2xl sm:text-3xl font-black text-[#20232B] dark:text-[#F8FAFC] tracking-tight">
              Every PDF Editor, Converter &amp; KB Image Tool in One Directory
            </h2>
            <p className="text-sm sm:text-base text-[#4E5360] dark:text-[#9DA3AE] mt-2 leading-relaxed">
              Browse 34 private browser utilities organized by task—from reducing exam photos to 20KB–100KB and merging Aadhaar PDFs to converting Word files or simulating scanner optics.
            </p>
          </div>

          <div className="w-full lg:w-96 relative">
            <label htmlFor="tool-directory-search" className="sr-only">
              Search PDF and Image tools
            </label>
            <Search className="w-4 h-4 text-[#4E5360] dark:text-[#9DA3AE] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="tool-directory-search"
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder='Search tasks like "20KB photo", "Aadhaar PDF", "merge"...'
              className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-white dark:bg-[#141824] border border-[#D9DEE8] dark:border-[#2B3349] text-sm text-[#20232B] dark:text-[#F8FAFC] placeholder:text-[#6B7280] dark:placeholder:text-[#7E8696] focus:outline-none focus:ring-2 focus:ring-[#3B50B2]/30 dark:focus:ring-[#536BCE]/40 focus:border-[#3B50B2] dark:focus:border-[#93A5F5] transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search query"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-md text-[#6B7280] hover:text-[#20232B] dark:hover:text-white transition"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div
          role="tablist"
          aria-label="Filter tools by workflow category"
          className="flex flex-wrap items-center gap-2 border-b border-[#E9EBF0] dark:border-[#242B3E] pb-4"
        >
          {CATEGORY_TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            const count =
              tab.id === 'all'
                ? DIRECTORY_TOOLS.length
                : DIRECTORY_TOOLS.filter((i) => i.category === tab.id).length;

            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={isActive}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all border ${
                  isActive
                    ? 'bg-[#20232B] dark:bg-[#536BCE] text-white border-[#20232B] dark:border-[#536BCE] shadow-xs'
                    : 'bg-white dark:bg-[#141824] text-[#4E5360] dark:text-[#9DA3AE] border-[#E9EBF0] dark:border-[#242B3E] hover:border-[#3B50B2]/50 dark:hover:border-[#93A5F5]/50 hover:text-[#20232B] dark:hover:text-[#F8FAFC]'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded-md ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-[#F2F4F8] dark:bg-[#1D2333] text-[#4E5360] dark:text-[#9DA3AE]'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Categorized Semantic Tool Sections */}
        {filteredTools.length === 0 ? (
          <div className="p-10 rounded-2xl bg-white dark:bg-[#141824] border border-[#E9EBF0] dark:border-[#242B3E] text-center space-y-3">
            <p className="text-sm font-semibold text-[#20232B] dark:text-[#F8FAFC]">
              No matching tools found for &ldquo;{searchQuery}&rdquo;
            </p>
            <p className="text-xs text-[#4E5360] dark:text-[#9DA3AE]">
              Try searching &ldquo;20KB photo&rdquo;, &ldquo;PDF editor&rdquo;, &ldquo;JPG to PDF&rdquo;, &ldquo;merge&rdquo;, or &ldquo;Scan Studio&rdquo;.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setActiveTab('all');
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#20232B] dark:bg-[#536BCE] text-white text-xs font-semibold hover:opacity-90 transition"
            >
              Show All {DIRECTORY_TOOLS.length} Tools
            </button>
          </div>
        ) : (
          <div className="space-y-10">
            {groupedSections.map(({ meta, items }) => (
              <section
                key={meta.id}
                aria-labelledby={`dir-cat-${meta.id}`}
                className="space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                  <h3
                    id={`dir-cat-${meta.id}`}
                    className="text-base sm:text-lg font-bold text-[#20232B] dark:text-[#F8FAFC]"
                  >
                    {normalizedQuery ? `Matching Tools (${items.length})` : meta.sectionHeading}
                  </h3>
                  <p className="text-xs text-[#4E5360] dark:text-[#9DA3AE]">
                    {normalizedQuery
                      ? `Filtered by "${searchQuery.trim()}"`
                      : meta.sectionSubtitle}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {items.map((tool) => (
                    <motion.div
                      key={`${meta.id}-${tool.id}`}
                      whileHover={prefersReduced ? undefined : { y: -2 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                      className="h-full"
                    >
                      <Link
                        href={tool.route}
                        className="h-full p-4 rounded-2xl bg-white dark:bg-[#141824] border border-[#E9EBF0] dark:border-[#242B3E] hover:border-[#3B50B2] dark:hover:border-[#93A5F5] shadow-2xs hover:shadow-sm transition flex flex-col justify-between gap-2.5 group"
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="w-8 h-8 rounded-lg bg-[#EDF0FF] dark:bg-[#536BCE]/15 flex items-center justify-center shrink-0">
                                {renderToolIcon(tool.iconName)}
                              </span>
                              <span className="text-xs sm:text-sm font-bold text-[#20232B] dark:text-[#F8FAFC] group-hover:text-[#3B50B2] dark:group-hover:text-[#93A5F5] transition leading-snug">
                                {tool.anchorLabel}
                              </span>
                            </div>
                            {tool.badge && (
                              <span className="shrink-0 text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#F2F4F8] dark:bg-[#1E2436] text-[#3B50B2] dark:text-[#93A5F5] border border-[#E2E6F0] dark:border-[#2C354D]">
                                {tool.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-[#4E5360] dark:text-[#9DA3AE] leading-relaxed pl-10">
                            {tool.microcopy}
                          </p>
                        </div>

                        <div className="flex items-center justify-between pl-10 pt-1">
                          <span className="text-[11px] font-semibold text-[#3B50B2] dark:text-[#93A5F5]">
                            Open {tool.name}
                          </span>
                          <ArrowRight className="w-3.5 h-3.5 text-[#4E5360] dark:text-[#9DA3AE] group-hover:text-[#3B50B2] dark:group-hover:text-[#93A5F5] transition-transform group-hover:translate-x-1" />
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </MotionConfig>
  );
}

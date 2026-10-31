import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib';
import { getPdfJs } from './pdfjsLoader';
import {
  PdfTextItem,
  AddedTextElement,
  WhiteoutElement,
  ImageElement,
  SignatureElement,
  AnnotationElement,
  ShapeElement,
  FormFieldElement,
  PageInfo,
} from '@/types/pdfEditor';

// Helper: Map font name to StandardFonts enum in pdf-lib
export function mapFontToPdfStandard(fontFamily: string, isBold: boolean, isItalic: boolean) {
  const fam = fontFamily.toLowerCase();

  if (fam.includes('times') || fam.includes('roman') || fam.includes('serif')) {
    if (isBold && isItalic) return StandardFonts.TimesRomanBoldItalic;
    if (isBold) return StandardFonts.TimesRomanBold;
    if (isItalic) return StandardFonts.TimesRomanItalic;
    return StandardFonts.TimesRoman;
  }

  if (fam.includes('courier') || fam.includes('mono')) {
    if (isBold && isItalic) return StandardFonts.CourierBoldOblique;
    if (isBold) return StandardFonts.CourierBold;
    if (isItalic) return StandardFonts.CourierOblique;
    return StandardFonts.Courier;
  }

  // Default Sans-Serif (Helvetica)
  if (isBold && isItalic) return StandardFonts.HelveticaBoldOblique;
  if (isBold) return StandardFonts.HelveticaBold;
  if (isItalic) return StandardFonts.HelveticaOblique;
  return StandardFonts.Helvetica;
}

// Convert Hex string #RRGGBB to pdf-lib rgb(0-1, 0-1, 0-1)
export function hexToPdfRgb(hex: string) {
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.substring(0, 2), 16) / 255 || 0;
  const g = parseInt(cleanHex.substring(2, 4), 16) / 255 || 0;
  const b = parseInt(cleanHex.substring(4, 6), 16) / 255 || 0;
  return rgb(r, g, b);
}

// 1. EXTRACT ALL PAGES, DIMENSIONS, AND TEXT ITEMS
export async function extractPdfDocumentModel(pdfArrayBuffer: ArrayBuffer | Uint8Array): Promise<{
  pages: PageInfo[];
  textItemsByPage: Record<number, PdfTextItem[]>;
  pdfDoc?: any;
}> {
  const pdfjs = await getPdfJs();
  // Clone bytes so the caller's ArrayBuffer is never detached by the Web Worker
  const bytes = pdfArrayBuffer instanceof Uint8Array ? pdfArrayBuffer.slice() : new Uint8Array(pdfArrayBuffer).slice();
  const loadingTask = pdfjs.getDocument({ data: bytes });
  const pdf = await loadingTask.promise;
  const numPages = pdf.numPages;

  const pages: PageInfo[] = [];
  const textItemsByPage: Record<number, PdfTextItem[]> = {};

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale: 1.0 }); // 1.0 scale represents raw PDF points (1/72 inch)

    pages.push({
      pageNumber: pageNum,
      width: viewport.width,
      height: viewport.height,
      rotation: page.rotate || 0,
    });

    const textContent = await page.getTextContent({ includeMarkedContent: true });
    const rawItems = textContent.items as any[];
    const pageTextItems: PdfTextItem[] = [];

    // Group items on the same line if they are contiguous
    for (let i = 0; i < rawItems.length; i++) {
      const it = rawItems[i];
      if (!it.str || it.str.trim() === '') continue;

      const tx = it.transform[4];
      const ty = it.transform[5];
      // ScaleX represents font width scale, scaleY represents font height in points
      const fontHeight = Math.abs(it.transform[0] || it.height || 12);
      const fontName = it.fontName || '';

      const isBold =
        fontName.toLowerCase().includes('bold') ||
        fontName.toLowerCase().includes('black') ||
        fontName.toLowerCase().includes('heavy');
      const isItalic =
        fontName.toLowerCase().includes('italic') ||
        fontName.toLowerCase().includes('oblique');

      let fontFamily = 'Helvetica';
      if (fontName.toLowerCase().includes('times') || fontName.toLowerCase().includes('roman')) {
        fontFamily = 'Times-Roman';
      } else if (fontName.toLowerCase().includes('courier') || fontName.toLowerCase().includes('mono')) {
        fontFamily = 'Courier';
      }

      // DOM coordinates at scale 1.0
      // In PDF, Y=0 is bottom. In DOM, Y=0 is top.
      const domX = tx;
      const domY = viewport.height - ty - fontHeight;
      const domWidth = it.width || Math.max(20, it.str.length * (fontHeight * 0.55));
      const domHeight = fontHeight * 1.15;

      pageTextItems.push({
        id: `txt_${pageNum}_${i}_${Math.random().toString(36).substring(2, 6)}`,
        pageNumber: pageNum,
        str: it.str,
        originalStr: it.str,
        x: domX,
        y: domY,
        width: domWidth,
        height: domHeight,
        pdfX: tx,
        pdfY: ty,
        pdfWidth: domWidth,
        pdfHeight: fontHeight,
        fontSize: Math.round(fontHeight),
        pdfFontSize: fontHeight,
        fontFamily,
        fontName,
        isBold,
        isItalic,
        color: '#0F172A',
        isEdited: false,
        isDeleted: false,
      });
    }

    textItemsByPage[pageNum] = pageTextItems;
  }

  return { pages, textItemsByPage, pdfDoc: pdf };
}

// 2. EXPORT MODIFIED PDF WITH IN-PLACE REPLACEMENTS AND ANNOTATIONS
export async function exportModifiedPdfDocument({
  originalPdfBuffer,
  pages,
  textItemsByPage,
  addedTexts,
  whiteouts,
  images,
  signatures,
  annotations,
  shapes,
  formFields,
}: {
  originalPdfBuffer: ArrayBuffer;
  pages: PageInfo[];
  textItemsByPage: Record<number, PdfTextItem[]>;
  addedTexts: AddedTextElement[];
  whiteouts: WhiteoutElement[];
  images: ImageElement[];
  signatures: SignatureElement[];
  annotations: AnnotationElement[];
  shapes: ShapeElement[];
  formFields: FormFieldElement[];
}): Promise<Blob> {
  const pdfDoc = await PDFDocument.load(originalPdfBuffer, { ignoreEncryption: true });

  // Cache embedded standard fonts
  const fontCache: Record<string, any> = {};
  const getFont = async (fam: string, bold: boolean, italic: boolean) => {
    const key = `${fam}_${bold}_${italic}`;
    if (!fontCache[key]) {
      const stdName = mapFontToPdfStandard(fam, bold, italic);
      fontCache[key] = await pdfDoc.embedFont(stdName);
    }
    return fontCache[key];
  };

  const pdfPages = pdfDoc.getPages();

  // 1. Process each page's text modifications & whiteouts
  for (let pIdx = 0; pIdx < pages.length; pIdx++) {
    const pageMeta = pages[pIdx];
    if (pageMeta.isDeleted) continue;

    const pageNum = pageMeta.pageNumber;
    const page = pdfPages[pageNum - 1];
    if (!page) continue;

    // Apply rotation if modified
    if (pageMeta.rotation !== 0) {
      page.setRotation(degrees(pageMeta.rotation));
    }

    const { width: pWidth, height: pHeight } = page.getSize();

    // A. Apply Whiteouts on original edited/deleted text
    const textItems = textItemsByPage[pageNum] || [];
    for (const item of textItems) {
      if (item.isEdited || item.isDeleted) {
        // Draw white mask over original text location
        page.drawRectangle({
          x: item.pdfX - 1,
          y: item.pdfY - 2,
          width: item.pdfWidth + 3,
          height: item.pdfHeight + 4,
          color: rgb(1, 1, 1), // Whiteout
        });

        // If edited (and not deleted), draw the new text at the exact same location
        if (item.isEdited && item.str.trim() !== '') {
          const font = await getFont(item.fontFamily, item.isBold, item.isItalic);
          page.drawText(item.str, {
            x: item.pdfX,
            y: item.pdfY,
            size: item.pdfFontSize,
            font,
            color: hexToPdfRgb(item.color || '#0F172A'),
          });
        }
      }
    }

    // B. Apply User Added Whiteouts / Eraser rectangles
    const pageWhiteouts = whiteouts.filter((w) => w.pageNumber === pageNum);
    for (const w of pageWhiteouts) {
      page.drawRectangle({
        x: w.pdfX,
        y: w.pdfY,
        width: w.pdfWidth,
        height: w.pdfHeight,
        color: hexToPdfRgb(w.color || '#FFFFFF'),
      });
    }

    // C. Apply User Added Text Elements
    const pageAddedTexts = addedTexts.filter((t) => t.pageNumber === pageNum);
    for (const t of pageAddedTexts) {
      if (!t.text || t.text.trim() === '') continue;
      const font = await getFont(t.fontFamily, t.isBold, t.isItalic);
      page.drawText(t.text, {
        x: t.pdfX,
        y: t.pdfY,
        size: t.fontSize,
        font,
        color: hexToPdfRgb(t.color || '#0F172A'),
      });
    }

    // D. Apply Annotations (Highlights, Underlines, Strikeouts)
    const pageAnnotations = annotations.filter((a) => a.pageNumber === pageNum);
    for (const a of pageAnnotations) {
      if (a.type === 'highlight') {
        page.drawRectangle({
          x: a.pdfX,
          y: a.pdfY,
          width: a.pdfWidth,
          height: a.pdfHeight,
          color: hexToPdfRgb(a.color || '#FEF08A'),
          opacity: 0.38,
        });
      } else if (a.type === 'strikeout') {
        page.drawLine({
          start: { x: a.pdfX, y: a.pdfY + a.pdfHeight / 2 },
          end: { x: a.pdfX + a.pdfWidth, y: a.pdfY + a.pdfHeight / 2 },
          thickness: 1.5,
          color: hexToPdfRgb(a.color || '#EF4444'),
        });
      } else if (a.type === 'underline') {
        page.drawLine({
          start: { x: a.pdfX, y: a.pdfY - 1 },
          end: { x: a.pdfX + a.pdfWidth, y: a.pdfY - 1 },
          thickness: 1.5,
          color: hexToPdfRgb(a.color || '#2563EB'),
        });
      }
    }

    // E. Apply Shapes (Rectangles, Ellipses, Lines, Arrows)
    const pageShapes = shapes.filter((s) => s.pageNumber === pageNum);
    for (const s of pageShapes) {
      if (s.type === 'rectangle') {
        page.drawRectangle({
          x: s.pdfX,
          y: s.pdfY,
          width: s.pdfWidth,
          height: s.pdfHeight,
          borderColor: hexToPdfRgb(s.strokeColor || '#2563EB'),
          borderWidth: s.strokeWidth || 2,
          color: s.fillColor ? hexToPdfRgb(s.fillColor) : undefined,
        });
      } else if (s.type === 'ellipse') {
        page.drawEllipse({
          x: s.pdfX + s.pdfWidth / 2,
          y: s.pdfY + s.pdfHeight / 2,
          xScale: s.pdfWidth / 2,
          yScale: s.pdfHeight / 2,
          borderColor: hexToPdfRgb(s.strokeColor || '#2563EB'),
          borderWidth: s.strokeWidth || 2,
          color: s.fillColor ? hexToPdfRgb(s.fillColor) : undefined,
        });
      } else if (s.type === 'line' || s.type === 'arrow') {
        page.drawLine({
          start: { x: s.pdfX, y: s.pdfY },
          end: { x: s.pdfX + s.pdfWidth, y: s.pdfY + s.pdfHeight },
          thickness: s.strokeWidth || 2,
          color: hexToPdfRgb(s.strokeColor || '#2563EB'),
        });
      }
    }

    // F. Apply Embedded Images
    const pageImages = images.filter((img) => img.pageNumber === pageNum);
    for (const img of pageImages) {
      try {
        const imageBytes = await (await fetch(img.dataUrl)).arrayBuffer();
        const embeddedImg = img.dataUrl.includes('image/png')
          ? await pdfDoc.embedPng(imageBytes)
          : await pdfDoc.embedJpg(imageBytes);

        page.drawImage(embeddedImg, {
          x: img.pdfX,
          y: img.pdfY,
          width: img.pdfWidth,
          height: img.pdfHeight,
        });
      } catch (err) {
        console.warn('Failed to embed image:', err);
      }
    }

    // G. Apply Signatures
    const pageSignatures = signatures.filter((sig) => sig.pageNumber === pageNum);
    for (const sig of pageSignatures) {
      try {
        const sigBytes = await (await fetch(sig.dataUrl)).arrayBuffer();
        const embeddedSig = await pdfDoc.embedPng(sigBytes);

        page.drawImage(embeddedSig, {
          x: sig.pdfX,
          y: sig.pdfY,
          width: sig.pdfWidth,
          height: sig.pdfHeight,
        });
      } catch (err) {
        console.warn('Failed to embed signature:', err);
      }
    }

    // H. Apply Form Fields (Simulated Visual Forms)
    const pageForms = formFields.filter((f) => f.pageNumber === pageNum);
    for (const f of pageForms) {
      if (f.type === 'checkbox') {
        page.drawRectangle({
          x: f.pdfX,
          y: f.pdfY,
          width: f.pdfWidth,
          height: f.pdfHeight,
          borderColor: rgb(0.2, 0.2, 0.2),
          borderWidth: 1.5,
          color: rgb(1, 1, 1),
        });
        if (f.value === true) {
          // Draw checkmark
          const helv = await getFont('Helvetica', true, false);
          page.drawText('✓', {
            x: f.pdfX + 2,
            y: f.pdfY + 2,
            size: f.pdfHeight * 0.8,
            font: helv,
            color: rgb(0.1, 0.4, 0.8),
          });
        }
      } else if (f.type === 'text') {
        page.drawRectangle({
          x: f.pdfX,
          y: f.pdfY,
          width: f.pdfWidth,
          height: f.pdfHeight,
          borderColor: rgb(0.6, 0.7, 0.8),
          borderWidth: 1,
          color: rgb(0.97, 0.98, 1.0),
        });
        if (f.value && String(f.value).trim()) {
          const helv = await getFont('Helvetica', false, false);
          page.drawText(String(f.value), {
            x: f.pdfX + 4,
            y: f.pdfY + 4,
            size: 11,
            font: helv,
            color: rgb(0.1, 0.1, 0.1),
          });
        }
      }
    }
  }

  // Handle Deleted Pages: delete in reverse order
  const deletedPageNumbers = pages
    .filter((p) => p.isDeleted)
    .map((p) => p.pageNumber)
    .sort((a, b) => b - a);

  for (const pNum of deletedPageNumbers) {
    if (pNum >= 1 && pNum <= pdfDoc.getPageCount()) {
      pdfDoc.removePage(pNum - 1);
    }
  }

  const modifiedPdfBytes = await pdfDoc.save();
  return new Blob([modifiedPdfBytes as any], { type: 'application/pdf' });
}

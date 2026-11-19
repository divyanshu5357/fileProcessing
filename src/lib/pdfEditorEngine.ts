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
  const cleanHex = (hex || '#000000').replace('#', '');
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
    const styles = (textContent.styles || {}) as Record<string, any>;
    const pageTextItems: PdfTextItem[] = [];

    // 1. Preprocess raw text chunks from PDF.js
    interface RawTextChunk {
      str: string;
      tx: number;
      ty: number;
      width: number;
      height: number;
      fontHeight: number;
      fontFamily: string;
      fontName: string;
      isBold: boolean;
      isItalic: boolean;
    }

    const processedChunks: RawTextChunk[] = [];
    for (let i = 0; i < rawItems.length; i++) {
      const it = rawItems[i];
      if (!it.str || it.str === '') continue;

      const tx = it.transform[4];
      const ty = it.transform[5];

      // Auto-detect font size in points from affine matrix
      const scaleX = Math.hypot(it.transform[0] || 0, it.transform[1] || 0);
      const scaleY = Math.hypot(it.transform[2] || 0, it.transform[3] || 0);
      const rawFontSize = scaleY || scaleX || Math.abs(it.height) || 12;
      const fontHeight = Math.max(8, Math.round(rawFontSize * 10) / 10);

      // Auto-detect font family & styles from PDF.js styles table
      const fontStyle = styles[it.fontName] || {};
      const styleFontFamily = fontStyle.fontFamily || '';
      const rawFontName = it.fontName || '';
      const cleanFontName = rawFontName.includes('+') ? rawFontName.split('+')[1] : rawFontName;
      const combined = `${cleanFontName} ${styleFontFamily}`.toLowerCase();

      const isBold =
        combined.includes('bold') ||
        combined.includes('black') ||
        combined.includes('heavy') ||
        combined.includes('semibold') ||
        combined.includes('w7') ||
        combined.includes('w8');

      const isItalic =
        combined.includes('italic') ||
        combined.includes('oblique') ||
        combined.includes('slanted');

      let fontFamily = 'Helvetica';
      if (
        combined.includes('times') ||
        combined.includes('roman') ||
        combined.includes('serif') ||
        combined.includes('cambria') ||
        combined.includes('georgia') ||
        combined.includes('garamond')
      ) {
        fontFamily = 'Times-Roman';
      } else if (
        combined.includes('courier') ||
        combined.includes('mono') ||
        combined.includes('consolas') ||
        combined.includes('menlo')
      ) {
        fontFamily = 'Courier';
      } else if (combined.includes('arial')) {
        fontFamily = 'Arial';
      } else if (combined.includes('georgia')) {
        fontFamily = 'Georgia';
      }

      const itemWidth = it.width || Math.max(4, it.str.length * (fontHeight * 0.55));

      processedChunks.push({
        str: it.str,
        tx,
        ty,
        width: itemWidth,
        height: fontHeight,
        fontHeight,
        fontFamily,
        fontName: it.fontName || 'Helvetica',
        isBold,
        isItalic,
      });
    }

    // 2. Sort chunks: Top to bottom (ty descending), then left to right (tx ascending)
    processedChunks.sort((a, b) => {
      const yDiff = b.ty - a.ty;
      if (Math.abs(yDiff) > Math.min(a.fontHeight, b.fontHeight) * 0.35) {
        return yDiff;
      }
      return a.tx - b.tx;
    });

    // 3. Intelligent Line Merging: Group contiguous items on the same baseline into unified lines
    const mergedLines: RawTextChunk[] = [];
    for (const chunk of processedChunks) {
      if (mergedLines.length === 0) {
        mergedLines.push({ ...chunk });
        continue;
      }

      const prev = mergedLines[mergedLines.length - 1];
      const sameLine = Math.abs(prev.ty - chunk.ty) <= Math.min(prev.fontHeight, chunk.fontHeight) * 0.35;
      const similarFont = prev.fontFamily === chunk.fontFamily && Math.abs(prev.fontHeight - chunk.fontHeight) <= 2.5;
      const sameStyle = prev.isBold === chunk.isBold && prev.isItalic === chunk.isItalic;

      const prevRight = prev.tx + prev.width;
      const gap = chunk.tx - prevRight;
      // Contiguous if gap is small or normal word space
      const isContiguous = gap >= -3 && gap <= prev.fontHeight * 2.2;

      if (sameLine && similarFont && sameStyle && isContiguous) {
        const needsSpace = !prev.str.endsWith(' ') && !chunk.str.startsWith(' ') && gap > prev.fontHeight * 0.12;
        prev.str = prev.str + (needsSpace ? ' ' : '') + chunk.str;
        prev.width = Math.max(prev.width, chunk.tx + chunk.width - prev.tx);
      } else {
        mergedLines.push({ ...chunk });
      }
    }

    // 4. Create unified text items with exact baseline alignment
    for (let i = 0; i < mergedLines.length; i++) {
      const line = mergedLines[i];
      if (!line.str || line.str.trim() === '') continue;

      const domX = line.tx;
      // In PDF, ty is baseline. Exact DOM top:
      const domY = viewport.height - line.ty - line.fontHeight;
      const domWidth = line.width;
      const domHeight = line.fontHeight * 1.15;

      pageTextItems.push({
        id: `txt_${pageNum}_${i}_${Math.random().toString(36).substring(2, 6)}`,
        pageNumber: pageNum,
        str: line.str,
        originalStr: line.str,
        x: domX,
        y: domY,
        width: domWidth,
        height: domHeight,
        pdfX: line.tx,
        pdfY: line.ty,
        pdfWidth: domWidth,
        pdfHeight: line.fontHeight,
        fontSize: line.fontHeight,
        pdfFontSize: line.fontHeight,
        fontFamily: line.fontFamily,
        fontName: line.fontName,
        isBold: line.isBold,
        isItalic: line.isItalic,
        color: '#0F172A',
        isEdited: false,
        isDeleted: false,
      });
    }

    textItemsByPage[pageNum] = pageTextItems;
  }

  return {
    pages,
    textItemsByPage,
    pdfDoc: pdf,
  };
}

// 2. EXPORT MODIFIED PDF DOCUMENT VIA PDF-LIB
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

  // Cache standard fonts
  const fontCache: Record<string, any> = {};
  async function getFont(fontFamily: string, isBold: boolean, isItalic: boolean) {
    const stdFontKey = mapFontToPdfStandard(fontFamily, isBold, isItalic);
    if (!fontCache[stdFontKey]) {
      fontCache[stdFontKey] = await pdfDoc.embedFont(stdFontKey);
    }
    return fontCache[stdFontKey];
  }

  const pdfPages = pdfDoc.getPages();

  // Iterate over each page
  for (let i = 0; i < pages.length; i++) {
    const meta = pages[i];
    if (meta.isDeleted) {
      continue;
    }

    const pageNum = meta.pageNumber;
    let page = pdfPages[pageNum - 1];

    if (!page) {
      page = pdfDoc.addPage([meta.width || 595.28, meta.height || 841.89]);
    }

    if (meta.rotation !== undefined) {
      page.setRotation(degrees(meta.rotation));
    }

    // A. Apply Whiteouts on original edited/deleted text
    const textItems = textItemsByPage[pageNum] || [];
    for (const item of textItems) {
      if (item.isEdited || item.isDeleted) {
        page.drawRectangle({
          x: item.pdfX - 1,
          y: item.pdfY - 2,
          width: item.pdfWidth + 3,
          height: item.pdfHeight + 4,
          color: rgb(1, 1, 1),
        });

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
    const pageWhiteouts = whiteouts.filter((w) => w.pageNumber === pageNum && !w.hidden);
    for (const w of pageWhiteouts) {
      page.drawRectangle({
        x: w.pdfX,
        y: w.pdfY,
        width: w.pdfWidth,
        height: w.pdfHeight,
        color: hexToPdfRgb(w.color || '#FFFFFF'),
        opacity: w.opacity ?? 1,
      });
    }

    // C. Apply User Added Text Elements (Multiline & Wrapped)
    const pageAddedTexts = addedTexts.filter((t) => t.pageNumber === pageNum && !t.hidden);
    for (const t of pageAddedTexts) {
      if (!t.text || t.text.trim() === '') continue;
      const font = await getFont(t.fontFamily, t.isBold, t.isItalic);
      const fontSize = t.fontSize || 12;
      const lineHeight = fontSize * 1.25;

      // Split multiline text
      const rawLines = t.text.split('\n');
      const formattedLines: string[] = [];

      for (const rawLine of rawLines) {
        const words = rawLine.split(' ');
        let currentLine = '';

        for (const word of words) {
          const testLine = currentLine ? `${currentLine} ${word}` : word;
          const testWidth = font.widthOfTextAtSize(testLine, fontSize);

          if (testWidth <= t.pdfWidth || !currentLine) {
            currentLine = testLine;
          } else {
            formattedLines.push(currentLine);
            currentLine = word;
          }
        }
        if (currentLine) {
          formattedLines.push(currentLine);
        }
      }

      for (let lIdx = 0; lIdx < formattedLines.length; lIdx++) {
        const line = formattedLines[lIdx];
        const lineWidth = font.widthOfTextAtSize(line, fontSize);
        let lineX = t.pdfX;

        if (t.alignment === 'center') {
          lineX = t.pdfX + Math.max(0, (t.pdfWidth - lineWidth) / 2);
        } else if (t.alignment === 'right') {
          lineX = t.pdfX + Math.max(0, t.pdfWidth - lineWidth);
        }

        const lineY = t.pdfY + t.pdfHeight - fontSize - lIdx * lineHeight;

        page.drawText(line, {
          x: lineX,
          y: Math.max(0, lineY),
          size: fontSize,
          font,
          color: hexToPdfRgb(t.color || '#0F172A'),
          opacity: t.opacity ?? 1,
        });

        // Underline
        if (t.isUnderline) {
          page.drawLine({
            start: { x: lineX, y: lineY - 1 },
            end: { x: lineX + lineWidth, y: lineY - 1 },
            thickness: 1,
            color: hexToPdfRgb(t.color || '#0F172A'),
            opacity: t.opacity ?? 1,
          });
        }

        // Strikethrough
        if (t.isStrikethrough) {
          page.drawLine({
            start: { x: lineX, y: lineY + fontSize * 0.35 },
            end: { x: lineX + lineWidth, y: lineY + fontSize * 0.35 },
            thickness: 1,
            color: hexToPdfRgb(t.color || '#0F172A'),
            opacity: t.opacity ?? 1,
          });
        }
      }
    }

    // D. Apply Annotations (Highlights, Underlines, Strikeouts)
    const pageAnnotations = annotations.filter((a) => a.pageNumber === pageNum && !a.hidden);
    for (const a of pageAnnotations) {
      if (a.type === 'highlight') {
        page.drawRectangle({
          x: a.pdfX,
          y: a.pdfY,
          width: a.pdfWidth,
          height: a.pdfHeight,
          color: hexToPdfRgb(a.color || '#FEF08A'),
          opacity: a.opacity ?? 0.45,
        });
      } else if (a.type === 'strikeout') {
        page.drawLine({
          start: { x: a.pdfX, y: a.pdfY + a.pdfHeight / 2 },
          end: { x: a.pdfX + a.pdfWidth, y: a.pdfY + a.pdfHeight / 2 },
          thickness: 1.5,
          color: hexToPdfRgb(a.color || '#EF4444'),
          opacity: a.opacity ?? 1,
        });
      } else if (a.type === 'underline') {
        page.drawLine({
          start: { x: a.pdfX, y: a.pdfY - 1 },
          end: { x: a.pdfX + a.pdfWidth, y: a.pdfY - 1 },
          thickness: 1.5,
          color: hexToPdfRgb(a.color || '#2563EB'),
          opacity: a.opacity ?? 1,
        });
      }
    }

    // E. Apply Shapes (Rectangles, Ellipses, Lines, Arrows)
    const pageShapes = shapes.filter((s) => s.pageNumber === pageNum && !s.hidden);
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
          opacity: s.opacity ?? 1,
          rotate: degrees(s.rotation || 0),
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
          opacity: s.opacity ?? 1,
        });
      } else if (s.type === 'line' || s.type === 'arrow') {
        page.drawLine({
          start: { x: s.pdfX, y: s.pdfY },
          end: { x: s.pdfX + s.pdfWidth, y: s.pdfY + s.pdfHeight },
          thickness: s.strokeWidth || 2,
          color: hexToPdfRgb(s.strokeColor || '#2563EB'),
          opacity: s.opacity ?? 1,
        });
      }
    }

    // F. Apply Embedded Images with exact rotation and center anchor
    const pageImages = images.filter((img) => img.pageNumber === pageNum && !img.hidden);
    for (const img of pageImages) {
      try {
        const imageBytes = await (await fetch(img.dataUrl)).arrayBuffer();
        const embeddedImg = img.dataUrl.includes('image/png')
          ? await pdfDoc.embedPng(imageBytes)
          : await pdfDoc.embedJpg(imageBytes);

        const rot = img.rotation || 0;
        let drawX = img.pdfX;
        let drawY = img.pdfY;

        if (rot !== 0) {
          // Center of the unrotated bounding box
          const cx = img.pdfX + img.pdfWidth / 2;
          const cy = img.pdfY + img.pdfHeight / 2;
          const rad = (rot * Math.PI) / 180;
          // Vector from (x, y) to center rotated counter-clockwise by -rad in PDF coords
          const dxPrime = (img.pdfWidth / 2) * Math.cos(-rad) - (img.pdfHeight / 2) * Math.sin(-rad);
          const dyPrime = (img.pdfWidth / 2) * Math.sin(-rad) + (img.pdfHeight / 2) * Math.cos(-rad);
          drawX = cx - dxPrime;
          drawY = cy - dyPrime;
        }

        page.drawImage(embeddedImg, {
          x: drawX,
          y: drawY,
          width: img.pdfWidth,
          height: img.pdfHeight,
          rotate: degrees(rot),
          opacity: img.opacity ?? 1,
        });
      } catch (err) {
        console.warn('Failed to embed image:', err);
      }
    }

    // G. Apply Signatures
    const pageSignatures = signatures.filter((sig) => sig.pageNumber === pageNum && !sig.hidden);
    for (const sig of pageSignatures) {
      try {
        const sigBytes = await (await fetch(sig.dataUrl)).arrayBuffer();
        const embeddedSig = await pdfDoc.embedPng(sigBytes);

        page.drawImage(embeddedSig, {
          x: sig.pdfX,
          y: sig.pdfY,
          width: sig.pdfWidth,
          height: sig.pdfHeight,
          opacity: sig.opacity ?? 1,
        });
      } catch (err) {
        console.warn('Failed to embed signature:', err);
      }
    }

    // H. Apply Form Fields (Simulated Visual Forms)
    const pageForms = formFields.filter((f) => f.pageNumber === pageNum && !f.hidden);
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
          page.drawLine({
            start: { x: f.pdfX + 2, y: f.pdfY + f.pdfHeight / 2 },
            end: { x: f.pdfX + f.pdfWidth / 2, y: f.pdfY + 2 },
            thickness: 2,
            color: rgb(0.15, 0.39, 0.92),
          });
          page.drawLine({
            start: { x: f.pdfX + f.pdfWidth / 2, y: f.pdfY + 2 },
            end: { x: f.pdfX + f.pdfWidth - 2, y: f.pdfY + f.pdfHeight - 2 },
            thickness: 2,
            color: rgb(0.15, 0.39, 0.92),
          });
        }
      } else {
        page.drawRectangle({
          x: f.pdfX,
          y: f.pdfY,
          width: f.pdfWidth,
          height: f.pdfHeight,
          borderColor: rgb(0.5, 0.6, 0.8),
          borderWidth: 1,
          color: rgb(0.96, 0.98, 1),
        });
        if (f.value && typeof f.value === 'string') {
          const font = await getFont('Helvetica', false, false);
          page.drawText(f.value, {
            x: f.pdfX + 4,
            y: f.pdfY + 4,
            size: 10,
            font,
            color: rgb(0.1, 0.1, 0.1),
          });
        }
      }
    }
  }

  // Remove pages marked as deleted
  for (let i = pages.length - 1; i >= 0; i--) {
    if (pages[i].isDeleted && i < pdfPages.length) {
      pdfDoc.removePage(i);
    }
  }

  const modifiedPdfBytes = await pdfDoc.save();
  return new Blob([modifiedPdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
}

import { PDFDocument, rgb, StandardFonts, PageSizes } from 'pdf-lib';
import mammoth from 'mammoth';
import * as XLSX from 'xlsx';
import JSZip from 'jszip';
import {
  WordToPdfSettings,
  ExcelToPdfSettings,
  PptToPdfSettings,
  HtmlToPdfSettings,
} from '@/types/document';

// Helper: word-wrap text into lines based on maximum available width
function wrapText(text: string, font: any, fontSize: number, maxWidth: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const testWidth = font.widthOfTextAtSize(testLine, fontSize);

    if (testWidth <= maxWidth) {
      currentLine = testLine;
    } else {
      if (currentLine) {
        lines.push(currentLine);
      }
      currentLine = word;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines.length > 0 ? lines : [''];
}

// 1. WORD TO PDF (DOC / DOCX -> PDF)
export async function docxToPdf(
  file: File,
  settings: WordToPdfSettings,
  onProgress?: (percent: number, msg: string) => void
): Promise<Blob> {
  if (onProgress) onProgress(20, 'Reading Word document structure...');
  const arrayBuffer = await file.arrayBuffer();

  // Extract structured HTML and raw text using Mammoth
  const conversionResult = await mammoth.convertToHtml({ arrayBuffer });
  const htmlContent = conversionResult.value;

  if (onProgress) onProgress(50, 'Parsing headings, tables, and paragraphs...');

  // Parse HTML via DOMParser in browser
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, 'text/html');

  const pdfDoc = await PDFDocument.create();
  const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const pageSize = settings.pageSize === 'letter' ? PageSizes.Letter : PageSizes.A4;
  const isLandscape = settings.orientation === 'landscape';
  const pageWidth = isLandscape ? pageSize[1] : pageSize[0];
  const pageHeight = isLandscape ? pageSize[0] : pageSize[1];

  const margin = settings.margin === 'narrow' ? 28 : settings.margin === 'wide' ? 54 : 36;
  const contentWidth = pageWidth - margin * 2;

  let currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
  let cursorY = pageHeight - margin - 20;

  const addNewPage = () => {
    currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
    cursorY = pageHeight - margin - 20;
  };

  const checkPageSpace = (neededHeight: number) => {
    if (cursorY - neededHeight < margin + 20) {
      addNewPage();
    }
  };

  // Document Title Header
  currentPage.drawText(file.name.replace(/\.[^/.]+$/, ''), {
    x: margin,
    y: cursorY,
    size: 20,
    font: boldFont,
    color: rgb(0.09, 0.25, 0.6), // Primary Blue
  });
  cursorY -= 32;

  const elements = Array.from(doc.body.children);

  for (const el of elements) {
    const tagName = el.tagName.toLowerCase();
    const text = (el.textContent || '').trim();
    if (!text && tagName !== 'table') continue;

    if (tagName === 'h1') {
      checkPageSpace(32);
      cursorY -= 10;
      currentPage.drawText(text, {
        x: margin,
        y: cursorY,
        size: 16,
        font: boldFont,
        color: rgb(0.06, 0.09, 0.16),
      });
      cursorY -= 22;
    } else if (tagName === 'h2' || tagName === 'h3') {
      checkPageSpace(26);
      cursorY -= 6;
      currentPage.drawText(text, {
        x: margin,
        y: cursorY,
        size: 13,
        font: boldFont,
        color: rgb(0.12, 0.23, 0.45),
      });
      cursorY -= 18;
    } else if (tagName === 'table') {
      // Draw Table
      const rows = Array.from(el.querySelectorAll('tr'));
      if (rows.length > 0) {
        cursorY -= 10;
        const colCount = Math.max(...rows.map((r) => r.querySelectorAll('td, th').length), 1);
        const colWidth = contentWidth / colCount;
        const rowHeight = 22;

        for (let rIdx = 0; rIdx < rows.length; rIdx++) {
          checkPageSpace(rowHeight + 10);
          const cells = Array.from(rows[rIdx].querySelectorAll('td, th'));

          // Row background
          if (rIdx === 0) {
            currentPage.drawRectangle({
              x: margin,
              y: cursorY - 4,
              width: contentWidth,
              height: rowHeight,
              color: rgb(0.9, 0.94, 0.98),
            });
          }

          for (let cIdx = 0; cIdx < cells.length; cIdx++) {
            const cellText = (cells[cIdx].textContent || '').trim();
            currentPage.drawText(cellText.substring(0, 30), {
              x: margin + cIdx * colWidth + 6,
              y: cursorY + 2,
              size: 9,
              font: rIdx === 0 ? boldFont : regularFont,
              color: rgb(0.1, 0.1, 0.1),
            });
          }
          cursorY -= rowHeight;
        }
        cursorY -= 12;
      }
    } else {
      // Paragraph or List Item
      const fontSize = 10;
      const lineHeight = 15;
      const wrappedLines = wrapText(text, regularFont, fontSize, contentWidth);

      for (const line of wrappedLines) {
        checkPageSpace(lineHeight);
        currentPage.drawText(line, {
          x: margin,
          y: cursorY,
          size: fontSize,
          font: regularFont,
          color: rgb(0.15, 0.18, 0.25),
        });
        cursorY -= lineHeight;
      }
      cursorY -= 6; // paragraph spacing
    }
  }

  if (onProgress) onProgress(90, 'Generating final PDF document...');
  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes as any], { type: 'application/pdf' });
}

// 2. EXCEL TO PDF (XLS / XLSX -> PDF)
export async function excelToPdf(
  file: File,
  settings: ExcelToPdfSettings,
  onProgress?: (percent: number, msg: string) => void
): Promise<Blob> {
  if (onProgress) onProgress(20, 'Reading spreadsheet worksheets...');
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });

  const pdfDoc = await PDFDocument.create();
  const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Landscape is preferred for spreadsheets
  const isLandscape = settings.orientation === 'landscape';
  const baseDim = PageSizes.A4;
  const pageWidth = isLandscape ? baseDim[1] : baseDim[0];
  const pageHeight = isLandscape ? baseDim[0] : baseDim[1];
  const margin = 28;
  const contentWidth = pageWidth - margin * 2;

  const targetSheetNames =
    settings.selectedSheet && workbook.SheetNames.includes(settings.selectedSheet)
      ? [settings.selectedSheet]
      : workbook.SheetNames;

  for (let sIdx = 0; sIdx < targetSheetNames.length; sIdx++) {
    const sheetName = targetSheetNames[sIdx];
    if (onProgress) {
      onProgress(
        Math.round(40 + (sIdx / targetSheetNames.length) * 45),
        `Rendering sheet: ${sheetName}...`
      );
    }

    const sheet = workbook.Sheets[sheetName];
    const data: (string | number)[][] = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      blankrows: false,
    });

    if (!data || data.length === 0) continue;

    let currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
    let cursorY = pageHeight - margin - 20;

    const addNewPage = () => {
      currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
      cursorY = pageHeight - margin - 20;
    };

    // Sheet Title Header
    currentPage.drawText(`${file.name} — [${sheetName}]`, {
      x: margin,
      y: cursorY,
      size: 14,
      font: boldFont,
      color: rgb(0.08, 0.45, 0.22), // Excel green
    });
    cursorY -= 24;

    // Determine max columns
    const maxCols = Math.min(Math.max(...data.map((r) => r.length), 1), 12);
    const colWidth = contentWidth / maxCols;
    const rowHeight = 20;

    for (let rIdx = 0; rIdx < data.length; rIdx++) {
      if (cursorY - rowHeight < margin + 15) {
        addNewPage();
      }

      const row = data[rIdx];
      const isHeader = rIdx === 0;

      // Draw Row Background
      if (isHeader) {
        currentPage.drawRectangle({
          x: margin,
          y: cursorY - 4,
          width: contentWidth,
          height: rowHeight,
          color: rgb(0.85, 0.95, 0.88),
        });
      } else if (rIdx % 2 === 0) {
        currentPage.drawRectangle({
          x: margin,
          y: cursorY - 4,
          width: contentWidth,
          height: rowHeight,
          color: rgb(0.97, 0.98, 0.99),
        });
      }

      // Draw Cells
      for (let cIdx = 0; cIdx < maxCols; cIdx++) {
        const val = row[cIdx] !== undefined && row[cIdx] !== null ? String(row[cIdx]) : '';
        const truncated = val.length > 25 ? val.substring(0, 22) + '...' : val;

        currentPage.drawText(truncated, {
          x: margin + cIdx * colWidth + 5,
          y: cursorY + 2,
          size: 8.5,
          font: isHeader ? boldFont : regularFont,
          color: isHeader ? rgb(0.05, 0.2, 0.1) : rgb(0.15, 0.15, 0.2),
        });

        // Grid border
        if (settings.showGridLines) {
          currentPage.drawRectangle({
            x: margin + cIdx * colWidth,
            y: cursorY - 4,
            width: colWidth,
            height: rowHeight,
            borderColor: rgb(0.85, 0.88, 0.92),
            borderWidth: 0.5,
          });
        }
      }

      cursorY -= rowHeight;
    }
  }

  if (onProgress) onProgress(95, 'Writing Excel PDF file...');
  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes as any], { type: 'application/pdf' });
}

// 3. POWERPOINT TO PDF (PPT / PPTX -> PDF)
export async function pptxToPdf(
  file: File,
  settings: PptToPdfSettings,
  onProgress?: (percent: number, msg: string) => void
): Promise<Blob> {
  if (onProgress) onProgress(20, 'Unpacking PowerPoint presentation package...');
  const arrayBuffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);

  const pdfDoc = await PDFDocument.create();
  const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // 16:9 widescreen presentation page dimensions (points: 960 x 540)
  const is16x9 = settings.slideAspect === '16:9';
  const slideW = is16x9 ? 960 : 720;
  const slideH = 540;

  // Find all slide XML files in ppt/slides/
  const slideFiles: { name: string; num: number }[] = [];
  zip.forEach((path) => {
    const match = path.match(/^ppt\/slides\/slide(\d+)\.xml$/i);
    if (match) {
      slideFiles.push({ name: path, num: parseInt(match[1], 10) });
    }
  });

  slideFiles.sort((a, b) => a.num - b.num);

  if (slideFiles.length === 0) {
    // Fallback if structure is unusual
    const page = pdfDoc.addPage([slideW, slideH]);
    page.drawText(`Presentation: ${file.name}`, {
      x: 60,
      y: slideH - 100,
      size: 24,
      font: boldFont,
      color: rgb(0.9, 0.4, 0.1),
    });
  } else {
    for (let idx = 0; idx < slideFiles.length; idx++) {
      const slide = slideFiles[idx];
      if (onProgress) {
        onProgress(
          Math.round(30 + (idx / slideFiles.length) * 60),
          `Rendering slide ${idx + 1} of ${slideFiles.length}...`
        );
      }

      const xmlText = await zip.file(slide.name)?.async('string');
      const page = pdfDoc.addPage([slideW, slideH]);

      // Subtle slide gradient/border background
      page.drawRectangle({
        x: 0,
        y: 0,
        width: slideW,
        height: slideH,
        color: rgb(0.98, 0.98, 1.0),
      });

      // Top decorative header line
      page.drawRectangle({
        x: 0,
        y: slideH - 8,
        width: slideW,
        height: 8,
        color: rgb(0.95, 0.45, 0.15), // PPT orange
      });

      // Extract all text elements (<a:t> tags) from slide XML
      const textMatches = (xmlText || '').match(/<a:t[^>]*>(.*?)<\/a:t>/gi) || [];
      const extractedTexts: string[] = [];

      for (const t of textMatches) {
        const clean = t.replace(/<[^>]+>/g, '').trim();
        if (clean) extractedTexts.push(clean);
      }

      // Title
      const title = extractedTexts.length > 0 ? extractedTexts[0] : `Slide ${idx + 1}`;
      page.drawText(title.substring(0, 60), {
        x: 60,
        y: slideH - 70,
        size: 24,
        font: boldFont,
        color: rgb(0.1, 0.15, 0.25),
      });

      // Slide content bullets
      let bulletY = slideH - 120;
      for (let tIdx = 1; tIdx < Math.min(extractedTexts.length, 12); tIdx++) {
        const itemText = extractedTexts[tIdx];
        if (!itemText) continue;

        page.drawCircle({
          x: 68,
          y: bulletY + 4,
          size: 3,
          color: rgb(0.95, 0.45, 0.15),
        });

        const wrapped = wrapText(itemText, regularFont, 13, slideW - 160);
        for (const line of wrapped) {
          page.drawText(line, {
            x: 82,
            y: bulletY,
            size: 13,
            font: regularFont,
            color: rgb(0.2, 0.25, 0.35),
          });
          bulletY -= 20;
        }
        bulletY -= 6;
      }

      // Slide Number Footer
      if (settings.includeSlideNumbers) {
        page.drawText(`${idx + 1} / ${slideFiles.length}`, {
          x: slideW - 100,
          y: 28,
          size: 10,
          font: regularFont,
          color: rgb(0.5, 0.5, 0.6),
        });
      }
    }
  }

  if (onProgress) onProgress(95, 'Writing PowerPoint presentation PDF...');
  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes as any], { type: 'application/pdf' });
}

// 4. HTML TO PDF
export async function htmlToPdf(
  htmlSource: string | File,
  settings: HtmlToPdfSettings,
  onProgress?: (percent: number, msg: string) => void
): Promise<Blob> {
  if (onProgress) onProgress(20, 'Reading HTML source content...');
  let htmlString = '';

  if (typeof htmlSource === 'string') {
    htmlString = htmlSource;
  } else {
    htmlString = await htmlSource.text();
  }

  if (onProgress) onProgress(50, 'Parsing HTML DOM and typography...');
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlString, 'text/html');

  const pdfDoc = await PDFDocument.create();
  const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const pageSize = settings.pageSize === 'letter' ? PageSizes.Letter : PageSizes.A4;
  const pageWidth = pageSize[0];
  const pageHeight = pageSize[1];
  const margin = settings.margin === 'none' ? 18 : settings.margin === 'small' ? 24 : 36;
  const contentWidth = pageWidth - margin * 2;

  let currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
  let cursorY = pageHeight - margin - 20;

  const addNewPage = () => {
    currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
    cursorY = pageHeight - margin - 20;
  };

  const checkPageSpace = (neededHeight: number) => {
    if (cursorY - neededHeight < margin + 20) {
      addNewPage();
    }
  };

  const pageTitle = doc.title || 'HTML Document';
  currentPage.drawText(pageTitle, {
    x: margin,
    y: cursorY,
    size: 20,
    font: boldFont,
    color: rgb(0.4, 0.15, 0.7), // HTML purple
  });
  cursorY -= 32;

  const bodyElements = Array.from(doc.body.children);

  for (const el of bodyElements) {
    const tag = el.tagName.toLowerCase();
    const text = (el.textContent || '').trim();
    if (!text && tag !== 'table') continue;

    if (tag === 'h1') {
      checkPageSpace(34);
      cursorY -= 8;
      currentPage.drawText(text, {
        x: margin,
        y: cursorY,
        size: 16,
        font: boldFont,
        color: rgb(0.1, 0.1, 0.2),
      });
      cursorY -= 22;
    } else if (tag === 'h2' || tag === 'h3') {
      checkPageSpace(26);
      cursorY -= 6;
      currentPage.drawText(text, {
        x: margin,
        y: cursorY,
        size: 13,
        font: boldFont,
        color: rgb(0.2, 0.2, 0.4),
      });
      cursorY -= 18;
    } else {
      const fontSize = 10;
      const lineHeight = 15;
      const lines = wrapText(text, regularFont, fontSize, contentWidth);

      for (const line of lines) {
        checkPageSpace(lineHeight);
        currentPage.drawText(line, {
          x: margin,
          y: cursorY,
          size: fontSize,
          font: regularFont,
          color: rgb(0.2, 0.2, 0.25),
        });
        cursorY -= lineHeight;
      }
      cursorY -= 6;
    }
  }

  if (onProgress) onProgress(90, 'Writing styled HTML PDF...');
  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes as any], { type: 'application/pdf' });
}

import { PDFDocument, rgb, StandardFonts, PageSizes, PDFImage } from 'pdf-lib';
import mammoth from 'mammoth';
import * as XLSX from 'xlsx';
import JSZip from 'jszip';
import {
  WordToPdfSettings,
  ExcelToPdfSettings,
  PptToPdfSettings,
  HtmlToPdfSettings,
} from '@/types/document';

// Comprehensive character map to safely convert unicode characters to WinAnsi standard font encodings
export function sanitizeForPdf(text: string): string {
  if (!text) return '';
  const charMap: Record<string, string> = {
    // Greek letters & math symbols (e.g. Σ, π, etc.)
    'Σ': 'Sigma', 'σ': 'sigma', 'ς': 'sigma',
    'Α': 'Alpha', 'α': 'alpha', 'Β': 'Beta', 'β': 'beta',
    'Γ': 'Gamma', 'γ': 'gamma', 'Δ': 'Delta', 'δ': 'delta',
    'Ε': 'Epsilon', 'ε': 'epsilon', 'Ζ': 'Zeta', 'ζ': 'zeta',
    'Η': 'Eta', 'η': 'eta', 'Θ': 'Theta', 'θ': 'theta',
    'Ι': 'Iota', 'ι': 'iota', 'Κ': 'Kappa', 'κ': 'kappa',
    'Λ': 'Lambda', 'λ': 'lambda', 'Μ': 'Mu', 'μ': 'mu',
    'Ν': 'Nu', 'ν': 'nu', 'Ξ': 'Xi', 'ξ': 'xi',
    'Ο': 'Omicron', 'ο': 'omicron', 'Π': 'Pi', 'π': 'pi',
    'Ρ': 'Rho', 'ρ': 'rho', 'Τ': 'Tau', 'τ': 'tau',
    'Υ': 'Upsilon', 'υ': 'upsilon', 'Φ': 'Phi', 'φ': 'phi',
    'Χ': 'Chi', 'χ': 'chi', 'Ψ': 'Psi', 'ψ': 'psi',
    'Ω': 'Omega', 'ω': 'omega',

    // Typographic symbols, dashes, quotes
    '“': '"', '”': '"', '‘': "'", '’': "'", '`': "'", '´': "'",
    '—': '--', '–': '-', '―': '--', '…': '...', '•': '*', '·': '*',
    '→': '->', '←': '<-', '↔': '<->', '⇒': '=>', '⇐': '<=',
    '≤': '<=', '≥': '>=', '≠': '!=', '±': '+/-', '≈': '~=',
    '×': 'x', '÷': '/', '√': 'sqrt', '∞': 'inf',
    '°': ' deg', '©': '(c)', '®': '(r)', '™': '(tm)',
    '₹': 'Rs. ', '€': 'EUR ', '£': 'GBP ', '¥': 'JPY ',
    '\u00A0': ' ', // Non-breaking space
    '\u202F': ' ', // Narrow no-break space
    '\u200B': '',  // Zero-width space
    '\u200E': '',  // Left-to-right mark
    '\u200F': '',  // Right-to-left mark
    '\t': '    ',
  };

  let cleaned = '';
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (charMap[char] !== undefined) {
      cleaned += charMap[char];
    } else {
      const code = char.charCodeAt(0);
      // WinAnsi standard printable range (ASCII 32-126) and Latin-1 supplement (160-255)
      if ((code >= 32 && code <= 126) || (code >= 160 && code <= 255)) {
        cleaned += char;
      } else if (code === 10 || code === 13) {
        cleaned += ' ';
      } else {
        // Fallback for unmappable unicode glyphs
        cleaned += ' ';
      }
    }
  }
  return cleaned;
}

// Helper: parse base64 image into Uint8Array
function parseBase64Image(dataUrl: string): { bytes: Uint8Array; format: 'png' | 'jpg' } | null {
  try {
    const matches = dataUrl.match(/^data:image\/(png|jpeg|jpg|webp);base64,(.+)$/);
    if (!matches) return null;
    const format = matches[1] === 'png' ? 'png' : 'jpg';
    const binary = atob(matches[2]);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return { bytes, format };
  } catch (e) {
    console.warn('Failed to parse base64 image', e);
    return null;
  }
}

// Helper: word-wrap text into lines based on maximum available width
function wrapText(rawText: string, font: any, fontSize: number, maxWidth: number): string[] {
  const text = sanitizeForPdf(rawText);
  if (!text) return [];
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    let testWidth = 0;
    try {
      testWidth = font.widthOfTextAtSize(testLine, fontSize);
    } catch {
      testWidth = testLine.length * (fontSize * 0.6);
    }

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
  if (onProgress) onProgress(15, 'Reading Word document structure...');
  const arrayBuffer = await file.arrayBuffer();

  // Extract structured HTML and embedded images using Mammoth
  if (onProgress) onProgress(35, 'Extracting document text and embedded images...');
  const conversionResult = await mammoth.convertToHtml(
    { arrayBuffer },
    {
      convertImage: mammoth.images.imgElement((image) => {
        return image.read('base64').then((imageBuffer) => {
          return {
            src: `data:${image.contentType};base64,${imageBuffer}`,
          };
        });
      }),
    }
  );
  const htmlContent = conversionResult.value;

  if (onProgress) onProgress(55, 'Parsing document hierarchy, tables & graphics...');

  // Parse HTML via DOMParser in browser
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, 'text/html');

  const pdfDoc = await PDFDocument.create();
  const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const obliqueFont = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

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

  // Document Title Header Banner
  const titleClean = sanitizeForPdf(file.name.replace(/\.[^/.]+$/, ''));
  currentPage.drawText(titleClean.substring(0, 75), {
    x: margin,
    y: cursorY,
    size: 18,
    font: boldFont,
    color: rgb(0.12, 0.25, 0.55),
  });
  cursorY -= 26;

  // Thin separator rule
  currentPage.drawLine({
    start: { x: margin, y: cursorY + 6 },
    end: { x: pageWidth - margin, y: cursorY + 6 },
    thickness: 1,
    color: rgb(0.85, 0.88, 0.92),
  });
  cursorY -= 14;

  const elements = Array.from(doc.body.children);

  for (const el of elements) {
    const tagName = el.tagName.toLowerCase();

    // Check for images inside this element or if element itself is <img>
    const imgEls = tagName === 'img' ? [el as HTMLImageElement] : Array.from(el.querySelectorAll('img'));
    if (imgEls.length > 0) {
      for (const imgEl of imgEls) {
        const src = imgEl.getAttribute('src');
        if (src && src.startsWith('data:image/')) {
          const parsed = parseBase64Image(src);
          if (parsed) {
            try {
              let embeddedImg: PDFImage;
              if (parsed.format === 'png') {
                embeddedImg = await pdfDoc.embedPng(parsed.bytes);
              } else {
                embeddedImg = await pdfDoc.embedJpg(parsed.bytes);
              }

              const dims = embeddedImg.scale(1);
              const maxW = contentWidth;
              const maxH = Math.min(320, pageHeight - margin * 2 - 60);
              const scale = Math.min(maxW / dims.width, maxH / dims.height, 1);
              const drawW = Math.max(dims.width * scale, 40);
              const drawH = Math.max(dims.height * scale, 30);

              checkPageSpace(drawH + 20);
              cursorY -= drawH;

              currentPage.drawImage(embeddedImg, {
                x: margin + (contentWidth - drawW) / 2, // Center horizontally
                y: cursorY,
                width: drawW,
                height: drawH,
              });
              cursorY -= 14;
            } catch (err) {
              console.warn('Could not embed document image into PDF:', err);
            }
          }
        }
      }
    }

    const rawText = (el.textContent || '').trim();
    if (!rawText && tagName !== 'table' && imgEls.length === 0) continue;
    const text = sanitizeForPdf(rawText);

    if (tagName === 'h1') {
      checkPageSpace(34);
      cursorY -= 10;
      currentPage.drawText(text, {
        x: margin,
        y: cursorY,
        size: 15,
        font: boldFont,
        color: rgb(0.08, 0.12, 0.2),
      });
      cursorY -= 20;
    } else if (tagName === 'h2') {
      checkPageSpace(28);
      cursorY -= 8;
      currentPage.drawText(text, {
        x: margin,
        y: cursorY,
        size: 13,
        font: boldFont,
        color: rgb(0.12, 0.22, 0.42),
      });
      cursorY -= 18;
    } else if (tagName === 'h3' || tagName === 'h4') {
      checkPageSpace(24);
      cursorY -= 6;
      currentPage.drawText(text, {
        x: margin,
        y: cursorY,
        size: 11.5,
        font: boldFont,
        color: rgb(0.18, 0.25, 0.38),
      });
      cursorY -= 16;
    } else if (tagName === 'ul' || tagName === 'ol') {
      const items = Array.from(el.querySelectorAll('li'));
      for (let idx = 0; idx < items.length; idx++) {
        const itemText = sanitizeForPdf(items[idx].textContent || '').trim();
        if (!itemText) continue;
        const bullet = tagName === 'ul' ? '* ' : `${idx + 1}. `;
        const fullItemText = `${bullet}${itemText}`;
        const itemLines = wrapText(fullItemText, regularFont, 10, contentWidth - 16);

        for (const line of itemLines) {
          checkPageSpace(15);
          currentPage.drawText(line, {
            x: margin + 12,
            y: cursorY,
            size: 10,
            font: regularFont,
            color: rgb(0.15, 0.18, 0.24),
          });
          cursorY -= 14;
        }
      }
      cursorY -= 4;
    } else if (tagName === 'table') {
      // Reconstruct Table with auto cell wrapping and borders
      const rows = Array.from(el.querySelectorAll('tr'));
      if (rows.length > 0) {
        cursorY -= 8;
        const colCount = Math.max(...rows.map((r) => r.querySelectorAll('td, th').length), 1);
        const colWidth = contentWidth / colCount;

        for (let rIdx = 0; rIdx < rows.length; rIdx++) {
          const cells = Array.from(rows[rIdx].querySelectorAll('td, th'));
          const isHeader = rIdx === 0 || rows[rIdx].querySelector('th') !== null;

          // Wrap cell texts to calculate row height
          const cellLinesList: string[][] = [];
          let maxLinesInRow = 1;
          for (let cIdx = 0; cIdx < colCount; cIdx++) {
            const rawCell = cells[cIdx] ? sanitizeForPdf(cells[cIdx].textContent || '').trim() : '';
            const wrapped = wrapText(rawCell, isHeader ? boldFont : regularFont, 8.5, colWidth - 10);
            cellLinesList.push(wrapped);
            if (wrapped.length > maxLinesInRow) {
              maxLinesInRow = Math.min(wrapped.length, 6);
            }
          }

          const dynamicRowHeight = Math.max(18, maxLinesInRow * 11 + 6);
          checkPageSpace(dynamicRowHeight + 8);

          // Row background
          if (isHeader) {
            currentPage.drawRectangle({
              x: margin,
              y: cursorY - dynamicRowHeight + 12,
              width: contentWidth,
              height: dynamicRowHeight,
              color: rgb(0.91, 0.94, 0.98),
            });
          } else if (rIdx % 2 === 1) {
            currentPage.drawRectangle({
              x: margin,
              y: cursorY - dynamicRowHeight + 12,
              width: contentWidth,
              height: dynamicRowHeight,
              color: rgb(0.98, 0.99, 1.0),
            });
          }

          // Draw cell borders and text
          for (let cIdx = 0; cIdx < colCount; cIdx++) {
            const cellX = margin + cIdx * colWidth;
            // Border outline
            currentPage.drawRectangle({
              x: cellX,
              y: cursorY - dynamicRowHeight + 12,
              width: colWidth,
              height: dynamicRowHeight,
              borderWidth: 0.5,
              borderColor: rgb(0.82, 0.86, 0.9),
              color: undefined,
            });

            const lines = cellLinesList[cIdx] || [];
            let cellTextY = cursorY + 2;
            for (let lIdx = 0; lIdx < Math.min(lines.length, 6); lIdx++) {
              currentPage.drawText(lines[lIdx], {
                x: cellX + 5,
                y: cellTextY,
                size: 8.5,
                font: isHeader ? boldFont : regularFont,
                color: isHeader ? rgb(0.08, 0.15, 0.3) : rgb(0.15, 0.18, 0.22),
              });
              cellTextY -= 11;
            }
          }
          cursorY -= dynamicRowHeight;
        }
        cursorY -= 12;
      }
    } else {
      // Standard Paragraph
      if (text) {
        const fontSize = 10;
        const lineHeight = 14.5;
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
  }

  if (onProgress) onProgress(90, 'Generating final high-fidelity PDF document...');
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
    const sheetHeaderClean = sanitizeForPdf(`${file.name} - [${sheetName}]`);
    currentPage.drawText(sheetHeaderClean.substring(0, 60), {
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
        const rawVal = row[cIdx] !== undefined && row[cIdx] !== null ? String(row[cIdx]) : '';
        const val = sanitizeForPdf(rawVal);
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

  const pageTitle = sanitizeForPdf(doc.title || 'HTML Document');
  currentPage.drawText(pageTitle.substring(0, 60), {
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
    const rawText = (el.textContent || '').trim();
    if (!rawText && tag !== 'table') continue;
    const text = sanitizeForPdf(rawText);

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

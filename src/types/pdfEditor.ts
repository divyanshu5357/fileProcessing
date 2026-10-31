export interface PdfTextItem {
  id: string;
  pageNumber: number;
  str: string;
  originalStr: string;
  // Canvas/DOM coordinates (pixels at current scale)
  x: number;
  y: number;
  width: number;
  height: number;
  // Raw PDF coordinates (points: 72 points per inch, origin bottom-left)
  pdfX: number;
  pdfY: number;
  pdfWidth: number;
  pdfHeight: number;
  // Font details
  fontSize: number; // in DOM pixels at current scale
  pdfFontSize: number; // in PDF points
  fontFamily: string;
  fontName: string;
  isBold: boolean;
  isItalic: boolean;
  color: string; // hex
  isEdited: boolean;
  isDeleted: boolean;
}

export interface AddedTextElement {
  id: string;
  pageNumber: number;
  text: string;
  x: number; // percentage 0-100 or points
  y: number;
  pdfX: number;
  pdfY: number;
  fontSize: number;
  fontFamily: string;
  color: string;
  isBold: boolean;
  isItalic: boolean;
}

export interface WhiteoutElement {
  id: string;
  pageNumber: number;
  x: number;
  y: number;
  width: number;
  height: number;
  pdfX: number;
  pdfY: number;
  pdfWidth: number;
  pdfHeight: number;
  color: string; // e.g. '#FFFFFF'
}

export interface ImageElement {
  id: string;
  pageNumber: number;
  dataUrl: string;
  x: number;
  y: number;
  width: number;
  height: number;
  pdfX: number;
  pdfY: number;
  pdfWidth: number;
  pdfHeight: number;
}

export interface SignatureElement {
  id: string;
  pageNumber: number;
  dataUrl: string;
  x: number;
  y: number;
  width: number;
  height: number;
  pdfX: number;
  pdfY: number;
  pdfWidth: number;
  pdfHeight: number;
}

export interface AnnotationElement {
  id: string;
  pageNumber: number;
  type: 'highlight' | 'strikeout' | 'underline';
  x: number;
  y: number;
  width: number;
  height: number;
  pdfX: number;
  pdfY: number;
  pdfWidth: number;
  pdfHeight: number;
  color: string; // e.g. '#FEF08A'
}

export interface ShapeElement {
  id: string;
  pageNumber: number;
  type: 'rectangle' | 'ellipse' | 'line' | 'arrow';
  x: number;
  y: number;
  width: number;
  height: number;
  pdfX: number;
  pdfY: number;
  pdfWidth: number;
  pdfHeight: number;
  strokeColor: string;
  fillColor?: string;
  strokeWidth: number;
}

export interface FormFieldElement {
  id: string;
  pageNumber: number;
  type: 'text' | 'checkbox' | 'radio';
  x: number;
  y: number;
  width: number;
  height: number;
  pdfX: number;
  pdfY: number;
  pdfWidth: number;
  pdfHeight: number;
  value: string | boolean;
  label?: string;
}

export type EditorToolMode =
  | 'select'
  | 'text'
  | 'link'
  | 'forms'
  | 'images'
  | 'sign'
  | 'whiteout'
  | 'annotate'
  | 'shapes';

export interface PageInfo {
  pageNumber: number;
  width: number; // points
  height: number; // points
  rotation: number; // 0, 90, 180, 270
  isDeleted?: boolean;
}

export interface EditorAction {
  type: string;
  payload: any;
  undo: () => void;
  redo: () => void;
}

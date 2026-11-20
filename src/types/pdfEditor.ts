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
  isUnderline?: boolean;
  color: string; // hex
  isEdited: boolean;
  isDeleted: boolean;
  originalX?: number;
  originalY?: number;
  originalPdfX?: number;
  originalPdfY?: number;
  baselineY?: number;
  originalBaselineY?: number;
  linkUrl?: string;
}

export interface AddedTextElement {
  id: string;
  pageNumber: number;
  text: string;
  name?: string;
  // PDF coordinates (points)
  pdfX: number;
  pdfY: number;
  pdfWidth: number;
  pdfHeight: number;
  fontSize: number; // points
  fontFamily: string;
  color: string;
  isBold: boolean;
  isItalic: boolean;
  isUnderline?: boolean;
  isStrikethrough?: boolean;
  alignment?: 'left' | 'center' | 'right';
  backgroundColor?: string;
  rotation?: number; // degrees 0-360
  opacity?: number; // 0-1
  locked?: boolean;
  hidden?: boolean;
  zIndex?: number;
}

export interface WhiteoutElement {
  id: string;
  pageNumber: number;
  name?: string;
  pdfX: number;
  pdfY: number;
  pdfWidth: number;
  pdfHeight: number;
  color: string; // e.g. '#FFFFFF'
  opacity?: number;
  locked?: boolean;
  hidden?: boolean;
  zIndex?: number;
  // Backward compatibility
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

export interface ImageElement {
  id: string;
  pageNumber: number;
  name?: string;
  dataUrl: string;
  pdfX: number;
  pdfY: number;
  pdfWidth: number;
  pdfHeight: number;
  rotation?: number; // degrees 0-360
  opacity?: number; // 0-1
  aspectRatio?: number; // width / height
  locked?: boolean;
  hidden?: boolean;
  zIndex?: number;
  // Backward compatibility
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

export interface SignatureElement {
  id: string;
  pageNumber: number;
  name?: string;
  dataUrl: string;
  pdfX: number;
  pdfY: number;
  pdfWidth: number;
  pdfHeight: number;
  rotation?: number;
  opacity?: number;
  locked?: boolean;
  hidden?: boolean;
  zIndex?: number;
  // Backward compatibility
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

export interface AnnotationElement {
  id: string;
  pageNumber: number;
  name?: string;
  type: 'highlight' | 'strikeout' | 'underline';
  pdfX: number;
  pdfY: number;
  pdfWidth: number;
  pdfHeight: number;
  color: string; // e.g. '#FEF08A'
  opacity?: number;
  locked?: boolean;
  hidden?: boolean;
  zIndex?: number;
  // Backward compatibility
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

export interface ShapeElement {
  id: string;
  pageNumber: number;
  name?: string;
  type: 'rectangle' | 'ellipse' | 'line' | 'arrow';
  pdfX: number;
  pdfY: number;
  pdfWidth: number;
  pdfHeight: number;
  strokeColor: string;
  fillColor?: string;
  strokeWidth: number;
  rotation?: number;
  opacity?: number;
  locked?: boolean;
  hidden?: boolean;
  zIndex?: number;
  // Backward compatibility
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

export interface FreehandDrawingElement {
  id: string;
  pageNumber: number;
  name?: string;
  points: { x: number; y: number }[]; // PDF points
  pdfX: number;
  pdfY: number;
  pdfWidth: number;
  pdfHeight: number;
  color: string;
  strokeWidth: number;
  opacity?: number;
  locked?: boolean;
  hidden?: boolean;
  zIndex?: number;
}

export interface FormFieldElement {
  id: string;
  pageNumber: number;
  name?: string;
  type: 'text' | 'checkbox' | 'radio';
  pdfX: number;
  pdfY: number;
  pdfWidth: number;
  pdfHeight: number;
  value: string | boolean;
  label?: string;
  locked?: boolean;
  hidden?: boolean;
  zIndex?: number;
  // Backward compatibility
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

export type EditorToolMode =
  | 'select'
  | 'hand'
  | 'text'
  | 'editText'
  | 'images'
  | 'shapes'
  | 'draw'
  | 'whiteout'
  | 'annotate'
  | 'sign'
  | 'forms'
  | 'links';

export type EditableObjectType =
  | 'addedText'
  | 'image'
  | 'signature'
  | 'shape'
  | 'whiteout'
  | 'annotation'
  | 'drawing'
  | 'formField'
  | 'existingText';

export interface SelectedObjectRef {
  id: string;
  type: EditableObjectType;
  pageNumber: number;
}

export interface PendingImagePlacement {
  dataUrl: string;
  naturalWidth: number;
  naturalHeight: number;
  name: string;
}

export interface PageInfo {
  pageNumber: number;
  width: number; // points
  height: number; // points
  rotation: number; // 0, 90, 180, 270
  isDeleted?: boolean;
}

export interface AlignmentGuide {
  id: string;
  type: 'vertical' | 'horizontal';
  position: number; // Screen coordinate (X for vertical line, Y for horizontal line)
  start: number;    // Start along perpendicular axis
  end: number;      // End along perpendicular axis
  label?: string;
}

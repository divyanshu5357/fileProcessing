export interface AssemblerPage {
  id: string; // Unique page identifier
  sourceDocId: string; // Reference to the original source file
  sourcePageIndex: number; // 0-based page index in the source PDF
  sourceType: 'pdf' | 'image';
  rotation: number; // Cumulative rotation degrees: 0, 90, 180, 270
  width: number; // In points (1/72 inch)
  height: number;
  thumbnailUrl: string; // Pre-rendered thumbnail image URL
  selected?: boolean;
}

export interface AssemblerDocument {
  id: string; // Unique document identifier
  name: string;
  originalFileName?: string;
  pages: AssemblerPage[];
  selected: boolean;
  isCollapsed: boolean;
  isModified?: boolean;
  createdAt: number;
}

export interface AssemblerHistorySnapshot {
  documents: AssemblerDocument[];
}

export type ExportMode =
  | 'merge-selected'
  | 'merge-alternately'
  | 'all-separate'
  | 'active-document'
  | 'selected-pages';

export interface SaveExportConfig {
  mode: ExportMode;
  fileName: string;
  destination: 'local' | 'cloud';
}

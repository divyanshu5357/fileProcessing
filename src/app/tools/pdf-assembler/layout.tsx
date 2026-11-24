import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Visual PDF Assembler — Reorder, Rotate & Merge Pages',
  description:
    'Combine multiple PDFs and visually reorder, rotate, duplicate, or remove pages privately in your browser before exporting.',
  keywords: [
    'PDF page organizer',
    'PDF assembler',
    'reorder PDF pages',
    'Gyanvatsala PDF assembler',
  ],
  alternates: {
    canonical: 'https://www.gyanvatsala.in/tools/pdf-assembler',
  },
  openGraph: {
    title: 'Visual PDF Assembler — Reorder, Rotate & Merge Pages | Gyanvatsala',
    description:
      'Organize, rotate, and merge PDF pages visually inside your browser.',
    url: 'https://www.gyanvatsala.in/tools/pdf-assembler',
    siteName: 'Gyanvatsala',
  },
};

export default function PdfAssemblerToolLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

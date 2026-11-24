import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Document Workspace — All-in-One Private File Suite | Gyanvatsala',
  description:
    'Unified workspace for all document transformations: PDF Editor, PDF to Word converter, Merge PDF, Split PDF, Compress PDF, Scan Studio, and Batch Image Converter with 100% client-side privacy.',
  keywords: [
    'document workspace',
    'all in one PDF suite',
    'file processing tools',
    'free online document manager',
    'Gyanvatsala workspace',
  ],
  alternates: {
    canonical: 'https://www.gyanvatsala.in/workspace',
  },
  openGraph: {
    title: 'Document Workspace — All-in-One Private File Suite | Gyanvatsala',
    description:
      'Access 24+ professional document processing and file conversion tools in one unified, calm, privacy-first interface.',
    url: 'https://www.gyanvatsala.in/workspace',
    siteName: 'Gyanvatsala',
  },
};

export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

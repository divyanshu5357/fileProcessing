import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Document Converter — Word, Excel, PowerPoint & PDF',
  description:
    'Convert Word, PDF, Excel, and PowerPoint files cleanly inside your privacy-first Gyanvatsala document workspace.',
  keywords: [
    'document converter',
    'PDF to Word',
    'Word to PDF',
    'PDF to Excel',
    'Gyanvatsala documents',
  ],
  alternates: {
    canonical: 'https://www.gyanvatsala.in/documents',
  },
  openGraph: {
    title: 'Document Converter — Word, Excel, PowerPoint & PDF | Gyanvatsala',
    description:
      'Convert and prepare office documents and PDFs with Gyanvatsala.',
    url: 'https://www.gyanvatsala.in/documents',
    siteName: 'Gyanvatsala',
  },
};

export default function DocumentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    default: 'All PDF Tools — Edit PDF, IMG to PDF, Merge, Split & Compress',
    template: '%s | Gyanvatsala',
  },
  description:
    '28+ free privacy-first PDF tools running directly in your browser: Online PDF Editor, IMG/JPG to PDF, Compress PDF, Merge PDF, Split PDF, PDF to Word, and Sign PDF.',
  keywords: [
    'PDF tools online',
    'free PDF editor',
    'edit PDF online',
    'img to PDF',
    'JPG to PDF',
    'compress PDF',
    'merge PDF',
    'split PDF',
    'PDF to Word',
    'pdf editer',
    'marge pdf',
    'spilt pdf',
    'Gyanvatsala PDF tools',
  ],
  alternates: {
    canonical: 'https://www.gyanvatsala.in/pdf',
  },
  openGraph: {
    title: 'All PDF Tools — Edit, Merge, Split, Compress & Sign | Gyanvatsala',
    description:
      'Complete suite of private client-side PDF utilities in one fast workspace.',
    url: 'https://www.gyanvatsala.in/pdf',
    siteName: 'Gyanvatsala',
    images: [
      {
        url: 'https://www.gyanvatsala.in/opengraph-image',
        width: 1200,
        height: 630,
      },
    ],
  },
};

export default function PdfLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

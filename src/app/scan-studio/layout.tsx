import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Scan Studio — Make PDF Look Scanned Online (Free & Private) | Gyanvatsala',
  description:
    'Generate realistic analog photocopier and scanner effects for PDF documents online. Add rotational skew, photocopier noise textures, paper grain, and contrast directly in your browser with 100% privacy.',
  keywords: [
    'make PDF look scanned',
    'scanner effect generator',
    'look scanned online',
    'analog scanner simulation',
    'photocopier effect PDF',
    'scan effect PDF',
    'Scan Studio',
    'Gyanvatsala Scan Studio',
  ],
  alternates: {
    canonical: 'https://www.gyanvatsala.in/scan-studio',
  },
  openGraph: {
    title: 'Scan Studio — Make PDF Look Scanned Online (Free & Private)',
    description:
      'Turn clean digital PDFs into realistic scanned documents with authentic photocopier textures, rotational jitter, and paper grain. 100% private in-browser processing.',
    url: 'https://www.gyanvatsala.in/scan-studio',
    siteName: 'Gyanvatsala',
    images: [{ url: 'https://www.gyanvatsala.in/icon.svg', width: 512, height: 512 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Scan Studio — Make PDF Look Scanned Online',
    description:
      'Transform clean PDFs into realistic scanned documents with customizable noise, skew, and contrast.',
  },
};

export default function ScanStudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

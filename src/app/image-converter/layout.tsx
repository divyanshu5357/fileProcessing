import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Image Converter & Compressor — WebP, PNG, JPG, IMG to PDF',
  description:
    'Convert between WebP, PNG, JPG, SVG, and PDF or reduce image size in KB/MB directly in your browser. Zero server uploads and lossless precision.',
  keywords: [
    'image converter',
    'image size reducer',
    'img size reducer',
    'img to pdf',
    'JPG to PDF',
    'batch image converter',
    'WebP to PNG',
    'HEIC to JPG converter',
    'PNG to JPG',
    'compress images online',
    'reduce photo size KB',
    'lossless image compression',
    'Gyanvatsala image converter',
  ],
  alternates: {
    canonical: 'https://www.gyanvatsala.in/image-converter',
  },
  openGraph: {
    title: 'Image Converter & Compressor — WebP, PNG, JPG, IMG to PDF | Gyanvatsala',
    description:
      'Convert between all major image formats, create PDFs from images, and compress photos privately in your browser.',
    url: 'https://www.gyanvatsala.in/image-converter',
    siteName: 'Gyanvatsala',
    images: [
      {
        url: 'https://www.gyanvatsala.in/opengraph-image',
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Image Converter & Compressor — Gyanvatsala',
    description: 'Convert and compress images in your browser with 100% privacy.',
    images: ['https://www.gyanvatsala.in/twitter-image'],
  },
};

export default function ImageConverterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

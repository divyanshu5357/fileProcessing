import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Free Batch Image Converter — WebP, PNG, JPG, HEIC, SVG | Gyanvatsala',
  description:
    'Convert, resize, and compress images in batch with zero quality degradation. Fast format conversion between WebP, PNG, JPG, HEIC, and SVG with 100% client-side privacy.',
  keywords: [
    'image converter',
    'batch image converter',
    'WebP to PNG',
    'HEIC to JPG converter',
    'PNG to JPG',
    'compress images online',
    'lossless image compression',
    'Gyanvatsala image converter',
  ],
  alternates: {
    canonical: 'https://www.gyanvatsala.in/image-converter',
  },
  openGraph: {
    title: 'Free Batch Image Converter — WebP, PNG, JPG, HEIC, SVG | Gyanvatsala',
    description:
      'Fast, high-fidelity image converter and compressor. Convert between all major formats directly in your browser with zero server uploads.',
    url: 'https://www.gyanvatsala.in/image-converter',
    siteName: 'Gyanvatsala',
    images: [{ url: 'https://www.gyanvatsala.in/icon.svg', width: 512, height: 512 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Free Batch Image Converter — Gyanvatsala',
    description: 'Convert and compress images in your browser with 100% privacy.',
  },
};

export default function ImageConverterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

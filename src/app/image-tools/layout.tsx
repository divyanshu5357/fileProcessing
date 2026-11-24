import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Image Size Reducer, Resize, Crop & EXIF Studio',
  description:
    'Compress JPG/PNG/WebP photos to exact KB limits (20KB, 50KB, 100KB), resize pixels, crop passport photos, remove EXIF metadata, and export to PDF privately.',
  keywords: [
    'image size reducer',
    'img size reducer',
    'reduce image size in kb',
    'image tools',
    'compress image online',
    'EXIF privacy inspector',
    'strip EXIF metadata',
    'passport photo size maker',
    'img size reduser',
    'Gyanvatsala image tools',
  ],
  alternates: {
    canonical: 'https://www.gyanvatsala.in/image-tools',
  },
  openGraph: {
    title: 'Image Size Reducer, Resize, Crop & EXIF Studio | Gyanvatsala',
    description:
      'Client-side image optimization, KB size reduction, resizing, and EXIF metadata inspection in your browser.',
    url: 'https://www.gyanvatsala.in/image-tools',
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

export default function ImageToolsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

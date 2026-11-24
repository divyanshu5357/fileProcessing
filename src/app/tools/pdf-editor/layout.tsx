import type { Metadata } from 'next';
import { getToolSeoProfile } from '@/lib/seoData';

const seo = getToolSeoProfile('pdf-editor');

export const metadata: Metadata = {
  title: seo.seoTitle,
  description: seo.metaDescription,
  keywords: seo.keywords,
  alternates: {
    canonical: seo.canonicalUrl,
  },
  openGraph: {
    title: `${seo.seoTitle} | Gyanvatsala`,
    description: seo.metaDescription,
    url: seo.canonicalUrl,
    siteName: 'Gyanvatsala',
    images: [
      {
        url: 'https://www.gyanvatsala.in/opengraph-image',
        width: 1200,
        height: 630,
        alt: `${seo.h1} — Gyanvatsala`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${seo.seoTitle} | Gyanvatsala`,
    description: seo.metaDescription,
    images: ['https://www.gyanvatsala.in/twitter-image'],
  },
};

export default function PdfEditorToolLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

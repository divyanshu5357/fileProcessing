import { Suspense } from 'react';
import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import { ALL_PDF_TOOLS, getToolById } from '@/lib/toolRegistry';
import { PdfToolId } from '@/types/document';
import { getToolSeoProfile, resolveCanonicalToolSlug } from '@/lib/seoData';
import { ToolSeoSection } from '@/components/seo/ToolSeoSection';
import ToolClientView from './ToolClientView';

export function generateStaticParams() {
  const ids = Array.from(new Set([...ALL_PDF_TOOLS.map((t) => t.id), 'compress-image']));
  return ids.map((tool) => ({ tool }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tool: string }>;
}): Promise<Metadata> {
  const { tool } = await params;
  const resolved = resolveCanonicalToolSlug(tool) || tool;
  const toolDef = getToolById(resolved as PdfToolId);
  if (!toolDef) {
    return {
      title: 'PDF Tool | Gyanvatsala',
      description: 'Privacy-first online PDF processing with zero server uploads.',
      robots: { index: false, follow: false },
    };
  }

  const seo = getToolSeoProfile(toolDef.id);

  return {
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
}

async function ToolContent({ params }: { params: Promise<{ tool: string }> }) {
  const { tool } = await params;
  const canonical = resolveCanonicalToolSlug(tool);
  if (!canonical) {
    notFound();
  }
  if (canonical !== tool) {
    permanentRedirect(`/pdf/${canonical}`);
  }

  return (
    <ToolClientView toolId={canonical as PdfToolId}>
      <ToolSeoSection profileId={canonical} />
    </ToolClientView>
  );
}

export default function IndividualToolPage({
  params,
}: {
  params: Promise<{ tool: string }>;
}) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0F172A]" />}>
      <ToolContent params={params} />
    </Suspense>
  );
}

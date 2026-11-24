import { Suspense } from 'react';
import type { Metadata } from 'next';
import { ALL_PDF_TOOLS } from '@/lib/toolRegistry';
import { PdfToolId } from '@/types/document';
import ToolClientView from './ToolClientView';

export function generateStaticParams() {
  return ALL_PDF_TOOLS.map((t) => ({ tool: t.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tool: string }>;
}): Promise<Metadata> {
  const { tool } = await params;
  const toolDef = ALL_PDF_TOOLS.find((t) => t.id === tool);
  if (!toolDef) {
    return {
      title: 'PDF Tool | Gyanvatsala',
      description: 'Privacy-first online PDF processing with zero server uploads.',
    };
  }

  const title = `${toolDef.name} — Free Online Tool | Gyanvatsala`;
  const description = `${toolDef.shortDesc || 'Fast, free, and 100% private in-browser document processing with zero server uploads.'} Client-side WebAssembly processing.`;
  const canonicalUrl = `https://www.gyanvatsala.in/pdf/${tool}`;

  return {
    title,
    description,
    keywords: [
      toolDef.name,
      `${toolDef.name} online`,
      `free ${toolDef.name}`,
      'PDF converter',
      'Gyanvatsala',
      'client-side PDF',
      'zero upload PDF tool',
    ],
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: 'Gyanvatsala',
      images: [
        {
          url: 'https://www.gyanvatsala.in/icon.svg',
          width: 512,
          height: 512,
          alt: `${toolDef.name} — Gyanvatsala`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['https://www.gyanvatsala.in/icon.svg'],
    },
  };
}

async function ToolContent({ params }: { params: Promise<{ tool: string }> }) {
  const { tool } = await params;
  return <ToolClientView toolId={tool as PdfToolId} />;
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

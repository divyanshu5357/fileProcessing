import { Suspense } from 'react';
import { ALL_PDF_TOOLS } from '@/lib/toolRegistry';
import { PdfToolId } from '@/types/document';
import ToolClientView from './ToolClientView';

export function generateStaticParams() {
  return ALL_PDF_TOOLS.map((t) => ({ tool: t.id }));
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

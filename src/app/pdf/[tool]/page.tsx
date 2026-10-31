import { ALL_PDF_TOOLS } from '@/lib/toolRegistry';
import { PdfToolId } from '@/types/document';
import ToolClientView from './ToolClientView';

export function generateStaticParams() {
  return ALL_PDF_TOOLS.map((t) => ({ tool: t.id }));
}

export default async function IndividualToolPage({
  params,
}: {
  params: Promise<{ tool: string }>;
}) {
  const { tool } = await params;
  return <ToolClientView toolId={tool as PdfToolId} />;
}

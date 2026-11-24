import React from 'react';
import { PdfEditorPageClient } from '@/components/editor/PdfEditorPageClient';
import { ToolSeoSection } from '@/components/seo/ToolSeoSection';

export default function DedicatedPdfEditorPage() {
  return (
    <PdfEditorPageClient>
      <ToolSeoSection profileId="pdf-editor" />
    </PdfEditorPageClient>
  );
}

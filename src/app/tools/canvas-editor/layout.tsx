import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Smart Snap Document Canvas Editor',
  description:
    'Interactive A4 document layout canvas with draggable text blocks, magnetic alignment snapping, smart dotted snap guides, and keyboard nudging.',
  keywords: [
    'document canvas editor',
    'snap alignment guides',
    'drag and drop document editor',
    'Gyanvatsala canvas editor',
  ],
  alternates: {
    canonical: 'https://www.gyanvatsala.in/tools/canvas-editor',
  },
  openGraph: {
    title: 'Smart Snap Document Canvas Editor | Gyanvatsala',
    description:
      'Build and arrange document rows on an A4 canvas with magnetic snap alignment guides.',
    url: 'https://www.gyanvatsala.in/tools/canvas-editor',
    siteName: 'Gyanvatsala',
  },
};

export default function CanvasEditorToolLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

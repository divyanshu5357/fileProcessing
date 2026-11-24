import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About Gyanvatsala — Private Digital Document Workspace',
  description:
    'Learn about Gyanvatsala, our mission for private in-browser document processing, and how we deliver Acrobat-grade PDF tools and scanner effects with Zero Uploads.',
  keywords: [
    'about Gyanvatsala',
    'document workspace mission',
    'zero uploads file processing',
    'private document editor',
  ],
  alternates: {
    canonical: 'https://www.gyanvatsala.in/about',
  },
  openGraph: {
    title: 'About Gyanvatsala — Private Digital Document Workspace',
    description:
      'Gyanvatsala is an online document processing suite operated by Divyanshu Pratap Singh, engineered for 100% privacy with in-browser client-side WebAssembly.',
    url: 'https://www.gyanvatsala.in/about',
    siteName: 'Gyanvatsala',
  },
};

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

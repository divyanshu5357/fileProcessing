import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description:
    'Review Gyanvatsala’s Terms of Service for using our private document processing workspace, PDF tools, image utilities, and optional subscription plans.',
  keywords: [
    'Gyanvatsala terms of service',
    'document workspace terms',
  ],
  alternates: {
    canonical: 'https://www.gyanvatsala.in/terms',
  },
  openGraph: {
    title: 'Terms of Service | Gyanvatsala',
    description:
      'Terms and conditions governing use of the Gyanvatsala digital document workspace.',
    url: 'https://www.gyanvatsala.in/terms',
    siteName: 'Gyanvatsala',
  },
};

export default function TermsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

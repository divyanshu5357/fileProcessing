import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact Us — Support & Inquiries',
  description:
    'Get in touch with the Gyanvatsala team for product support, enterprise inquiries, privacy questions, or bug reports.',
  keywords: [
    'contact Gyanvatsala',
    'Gyanvatsala support',
    'document workspace help',
  ],
  alternates: {
    canonical: 'https://www.gyanvatsala.in/contact',
  },
  openGraph: {
    title: 'Contact Us — Support & Inquiries | Gyanvatsala',
    description:
      'Reach the Gyanvatsala support team directly for assistance with PDF tools, accounts, or plans.',
    url: 'https://www.gyanvatsala.in/contact',
    siteName: 'Gyanvatsala',
  },
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

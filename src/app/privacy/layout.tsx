import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy — Zero-Upload Browser Processing',
  description:
    'Read Gyanvatsala’s Privacy Policy covering local in-browser file processing, optional cloud workspace storage, security controls, and user data protection.',
  keywords: [
    'Gyanvatsala privacy policy',
    'private PDF processing',
    'zero uploads policy',
  ],
  alternates: {
    canonical: 'https://www.gyanvatsala.in/privacy',
  },
  openGraph: {
    title: 'Privacy Policy — Zero-Upload Browser Processing | Gyanvatsala',
    description:
      'How Gyanvatsala protects your documents and account information.',
    url: 'https://www.gyanvatsala.in/privacy',
    siteName: 'Gyanvatsala',
  },
};

export default function PrivacyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

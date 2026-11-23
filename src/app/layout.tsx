import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/context/ThemeContext';
import { AuthProvider } from '@/context/AuthContext';
import { AuthModal } from '@/components/auth/AuthModal';

export const metadata: Metadata = {
  metadataBase: new URL('https://www.gyanvatsala.in'),
  title: {
    default: 'Gyanvatsala — Your Digital Document Workspace',
    template: '%s | Gyanvatsala',
  },
  description:
    'Everything you need to work with documents. All in one place. Convert PDF to Word with native layout, generate realistic scan effects, merge, split, compress, and edit with 100% client-side privacy.',
  keywords: [
    'Gyanvatsala',
    'document workspace',
    'PDF to Word converter',
    'PDF editor',
    'scan effect generator',
    'look scanned',
    'merge PDF',
    'split PDF',
    'add page numbers PDF',
    'image compressor WebP',
    'privacy first document processing',
    'zero upload PDF converter',
  ],
  authors: [{ name: 'Gyanvatsala', url: 'https://www.gyanvatsala.in' }],
  creator: 'Gyanvatsala',
  publisher: 'Gyanvatsala',
  alternates: {
    canonical: 'https://www.gyanvatsala.in',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://www.gyanvatsala.in',
    title: 'Gyanvatsala — Your Digital Document Workspace',
    description:
      'Everything you need to work with documents. All in one place. Convert PDF to Word, simulate scanner effects, and edit documents with zero server uploads.',
    siteName: 'Gyanvatsala',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Gyanvatsala — Your Digital Document Workspace',
    description:
      'Everything you need to work with documents. All in one place. 100% client-side document processing.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Gyanvatsala',
    operatingSystem: 'All (Web Browser)',
    applicationCategory: 'ProductivityApplication',
    url: 'https://www.gyanvatsala.in',
    description:
      'A modern digital workspace that helps people manage, transform, edit, and organize their documents and files with zero server uploads.',
    offers: {
      '@type': 'Offer',
      price: '0.00',
      priceCurrency: 'USD',
    },
    featureList: [
      'High-Fidelity PDF to Word Conversion with Vector Font & Table Preservation',
      'Analog Photocopier Scan Studio with Rotational Skew & Noise Shader',
      'Interactive Acrobat-Grade PDF Canvas Editor',
      'Lossless WebP, AVIF, and Batch Image Compression',
      'Zero Server Uploads Client-Side WebAssembly Processing',
    ],
  };

  return (
    <html lang="en" suppressHydrationWarning className="h-full antialiased">
      <head suppressHydrationWarning>
        <script
          id="theme-initializer"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var saved = localStorage.getItem('gyanvatsala-theme') || localStorage.getItem('pixelkit-theme');
                var isDark = saved === 'dark';
                if (isDark) {
                  document.documentElement.classList.add('dark');
                  document.documentElement.classList.remove('light');
                } else {
                  document.documentElement.classList.remove('dark');
                  document.documentElement.classList.add('light');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body
        suppressHydrationWarning
        className="min-h-full flex flex-col bg-white dark:bg-[#0D1017] text-[#20232B] dark:text-[#F8FAFC] font-sans transition-colors duration-150"
      >
        <script
          id="json-ld-app"
          type="application/ld+json"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <ThemeProvider>
          <AuthProvider>
            {children}
            <AuthModal />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

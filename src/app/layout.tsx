import type { Metadata } from 'next';
import dynamic from 'next/dynamic';
import './globals.css';
import { ThemeProvider } from '@/context/ThemeContext';
import { AuthProvider } from '@/context/AuthContext';

const AuthModal = dynamic(
  () => import('@/components/auth/AuthModal').then((mod) => mod.AuthModal)
);

export const metadata: Metadata = {
  metadataBase: new URL('https://www.gyanvatsala.in'),
  title: {
    default: 'Gyanvatsala — Free Online File & PDF Processing Workspace',
    template: '%s | Gyanvatsala',
  },
  description:
    'All-in-one private online file and document processing platform. Convert PDF to Word, edit PDFs, simulate photocopier scan effects with Scan Studio, convert and compress images (WebP, PNG, JPG), merge, split, and organize documents with 100% in-browser client-side privacy (Zero Uploads).',
  keywords: [
    'Gyanvatsala',
    'file processing suite',
    'online file converter',
    'PDF to Word converter',
    'free online PDF editor',
    'PDF converter',
    'scan effect generator',
    'look scanned',
    'Scan Studio',
    'merge PDF',
    'split PDF',
    'compress PDF',
    'compress image WebP',
    'HEIC to JPG converter',
    'WebP converter',
    'PNG to PDF',
    'Word to PDF',
    'Excel to PDF',
    'PDF to Excel',
    'watermark PDF',
    'add page numbers PDF',
    'document workspace',
    'privacy first document processing',
    'zero upload PDF converter',
    'client-side document tools',
    'online document editor',
    'batch file processing',
  ],
  authors: [{ name: 'Gyanvatsala', url: 'https://www.gyanvatsala.in' }],
  creator: 'Gyanvatsala',
  publisher: 'Gyanvatsala',
  category: 'technology',
  alternates: {
    canonical: 'https://www.gyanvatsala.in',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://www.gyanvatsala.in',
    title: 'Gyanvatsala — Free Online File & PDF Processing Workspace',
    description:
      'All-in-one private online file and document processing suite. Convert PDF to Word, edit PDFs, simulate photocopier scan effects, convert and compress images with 100% client-side privacy (Zero Uploads).',
    siteName: 'Gyanvatsala',
    images: [
      {
        url: 'https://www.gyanvatsala.in/icon.svg',
        width: 512,
        height: 512,
        alt: 'Gyanvatsala — Digital Document Workspace & File Processing Suite',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Gyanvatsala — Free Online File & PDF Processing Workspace',
    description:
      'Everything you need to process, convert, and edit documents and images. 100% client-side privacy with Zero Uploads.',
    images: ['https://www.gyanvatsala.in/icon.svg'],
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
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': 'https://www.gyanvatsala.in/#website',
        name: 'Gyanvatsala',
        alternateName: [
          'Gyanvatsala Document Workspace',
          'Gyanvatsala File Processing',
          'Gyanvatsala PDF Suite',
        ],
        url: 'https://www.gyanvatsala.in',
        description:
          'Free online file processing and digital document workspace providing PDF editing, high-fidelity PDF to Word conversion, scan effects, and image tools.',
        publisher: {
          '@id': 'https://www.gyanvatsala.in/#organization',
        },
      },
      {
        '@type': 'Organization',
        '@id': 'https://www.gyanvatsala.in/#organization',
        name: 'Gyanvatsala',
        url: 'https://www.gyanvatsala.in',
        logo: {
          '@type': 'ImageObject',
          url: 'https://www.gyanvatsala.in/icon.svg',
          caption: 'Gyanvatsala Logo',
        },
        description:
          'Gyanvatsala is a modern, privacy-focused digital document workspace and online file processing platform that operates without uploading confidential files to third-party servers.',
        founder: {
          '@type': 'Person',
          name: 'Divyanshu Pratap Singh',
        },
        contactPoint: {
          '@type': 'ContactPoint',
          email: 'fileprocess@gyanvatsala.in',
          contactType: 'customer support',
          areaServed: 'Worldwide',
          availableLanguage: ['English', 'Hindi'],
        },
      },
      {
        '@type': 'SoftwareApplication',
        '@id': 'https://www.gyanvatsala.in/#software',
        name: 'Gyanvatsala',
        applicationCategory: 'UtilitiesApplication',
        operatingSystem: 'All (Web Browser, Windows, macOS, Linux, Android, iOS)',
        url: 'https://www.gyanvatsala.in',
        description:
          'Comprehensive in-browser file processing suite: PDF to Word conversion, Acrobat-grade PDF canvas editor, realistic photocopier scanner effects (Scan Studio), and multi-format batch image conversion.',
        offers: {
          '@type': 'Offer',
          price: '0.00',
          priceCurrency: 'INR',
        },
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: '4.9',
          reviewCount: '1280',
          bestRating: '5',
          worstRating: '1',
        },
        featureList: [
          'High-Fidelity PDF to Word Conversion with Vector Font & Table Preservation',
          'Analog Photocopier Scan Studio with Rotational Skew & Noise Shader',
          'Interactive Acrobat-Grade PDF Canvas Editor (Text, Annotations, Whiteout, Signatures)',
          'Lossless WebP, AVIF, HEIC, PNG, and Batch Image Conversion',
          'Zero Server Uploads Client-Side WebAssembly Processing for 100% Privacy',
        ],
      },
      {
        '@type': 'FAQPage',
        '@id': 'https://www.gyanvatsala.in/#faq',
        mainEntity: [
          {
            '@type': 'Question',
            name: 'What is Gyanvatsala?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Gyanvatsala is an all-in-one private online file and document processing suite. It provides tools for PDF editing, PDF to Word conversion, realistic scanner simulation (Scan Studio), and batch image conversion and compression directly in your browser.',
            },
          },
          {
            '@type': 'Question',
            name: 'Are my files uploaded to any servers during processing?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'No. Gyanvatsala prioritizes 100% privacy using client-side WebAssembly, Canvas, and vector processing. Your files are transformed directly on your device without being uploaded to remote servers.',
            },
          },
          {
            '@type': 'Question',
            name: 'Is Gyanvatsala free to use?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Yes! The core tools and Free Starter plan are completely free with unlimited in-browser private processing and 15 MB optional cloud storage.',
            },
          },
          {
            '@type': 'Question',
            name: 'What file formats does Gyanvatsala support?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Gyanvatsala supports PDF, Microsoft Word (DOCX), Excel (XLSX), PowerPoint (PPTX), JPG, PNG, WebP, HEIC, SVG, BMP, and plain text files.',
            },
          },
        ],
      },
    ],
  };

  return (
    <html lang="en" suppressHydrationWarning className="h-full antialiased">
      <head suppressHydrationWarning>
        <link rel="preconnect" href="https://www.gyanvatsala.in" />
        <link rel="dns-prefetch" href="https://www.gyanvatsala.in" />
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

import type { Metadata } from 'next';
import dynamic from 'next/dynamic';
import './globals.css';
import { ThemeProvider } from '@/context/ThemeContext';
import { AuthProvider } from '@/context/AuthContext';
import { GLOBAL_SEARCH_KEYWORDS } from '@/lib/seoData';

const AuthModal = dynamic(
  () => import('@/components/auth/AuthModal').then((mod) => mod.AuthModal)
);

export const metadata: Metadata = {
  metadataBase: new URL('https://www.gyanvatsala.in'),
  title: {
    default: 'Free Online PDF Editor, JPG to PDF & Image Size Reducer (20KB–100KB) | Gyanvatsala',
    template: '%s | Gyanvatsala',
  },
  description:
    'Edit PDFs without watermarks, convert JPG/PNG to PDF, compress PDFs, and reduce photo size to 20KB, 50KB, or 100KB—100% locally in your browser with zero server uploads.',
  keywords: GLOBAL_SEARCH_KEYWORDS,
  authors: [{ name: 'Gyanvatsala', url: 'https://www.gyanvatsala.in' }],
  creator: 'Gyanvatsala',
  publisher: 'Gyanvatsala',
  category: 'technology',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://www.gyanvatsala.in/',
    title: 'Free Online PDF Editor, JPG to PDF & Image Size Reducer (20KB–100KB) | Gyanvatsala',
    description:
      'Edit PDFs without watermarks, convert JPG/PNG to PDF, compress PDFs, and reduce photo size to 20KB, 50KB, or 100KB—100% locally in your browser with zero server uploads.',
    siteName: 'Gyanvatsala',
    images: [
      {
        url: 'https://www.gyanvatsala.in/opengraph-image',
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Free Online PDF Editor, JPG to PDF & Image Size Reducer (20KB–100KB) | Gyanvatsala',
    description:
      'Edit PDFs without watermarks, convert JPG/PNG to PDF, compress PDFs, and reduce photo size to 20KB, 50KB, or 100KB—100% locally in your browser with zero server uploads.',
    images: ['https://www.gyanvatsala.in/twitter-image'],
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
          'Gyanvatsala Online PDF Editor',
          'Gyanvatsala Image to PDF Converter',
          'Gyanvatsala Image Size Reducer',
          'Gyanvatsala PDF Suite',
        ],
        url: 'https://www.gyanvatsala.in/',
        description:
          'Free online PDF editor, IMG/JPG/PNG to PDF converter, Image Size Reducer in KB/MB, PDF to Word converter, and Scan Studio running privately in-browser.',
        publisher: {
          '@id': 'https://www.gyanvatsala.in/#organization',
        },
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: 'https://www.gyanvatsala.in/workspace?q={search_term_string}',
          },
          'query-input': 'required name=search_term_string',
        },
      },
      {
        '@type': 'Organization',
        '@id': 'https://www.gyanvatsala.in/#organization',
        name: 'Gyanvatsala',
        url: 'https://www.gyanvatsala.in/',
        logo: {
          '@type': 'ImageObject',
          url: 'https://www.gyanvatsala.in/icon.svg',
          caption: 'Gyanvatsala Logo',
        },
        description:
          'Gyanvatsala is a modern, privacy-focused digital document workspace and online file processing platform that processes PDFs and images locally without server uploads.',
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
        name: 'Gyanvatsala Free Online PDF Editor, JPG to PDF & Image Size Reducer',
        applicationCategory: 'UtilitiesApplication',
        operatingSystem: 'All (Web Browser, Windows, macOS, Linux, Android, iOS)',
        url: 'https://www.gyanvatsala.in/',
        description:
          'Edit PDFs without watermarks, convert JPG/PNG to PDF, compress PDFs without losing quality, convert PDF to Word, simulate photocopier scans, and reduce photo size to 20KB, 50KB, or 100KB locally in your browser.',
        offers: {
          '@type': 'Offer',
          price: '0.00',
          priceCurrency: 'INR',
        },
        featureList: [
          'Online PDF Editor — Edit PDF text in-place, add signatures, whiteout, and shapes without watermarks',
          'Image Size Reducer in KB — Reduce JPG, PNG, and WebP photo file size to 20KB, 50KB, 100KB, or custom KB sizes',
          'JPG to PDF — Convert JPG, PNG, and WebP photos into clean A4 or Letter PDF documents',
          'PDF to Word — Extract text and multi-column tables from PDFs into editable DOCX Word documents',
          'Compress PDF — Shrink PDF file size without losing quality for email and exam uploads',
          'Scan Studio FX — Realistic optical scanner effect, paper texture, and rotational tilt simulator',
        ],
        hasPart: [
          {
            '@type': 'SoftwareApplication',
            name: 'Online PDF Editor',
            applicationCategory: 'BusinessApplication',
            operatingSystem: 'Web Browser',
            url: 'https://www.gyanvatsala.in/tools/pdf-editor',
            description: 'Edit existing PDF text, add handwritten or typed signatures, fill forms, and export without watermarks.',
          },
          {
            '@type': 'SoftwareApplication',
            name: 'Image Size Reducer in KB',
            applicationCategory: 'MultimediaApplication',
            operatingSystem: 'Web Browser',
            url: 'https://www.gyanvatsala.in/tools/image-size-reducer',
            description: 'Reduce photo and signature file size in KB (20KB, 50KB, 100KB) or percentage locally in browser memory.',
          },
          {
            '@type': 'SoftwareApplication',
            name: 'JPG to PDF',
            applicationCategory: 'UtilitiesApplication',
            operatingSystem: 'Web Browser',
            url: 'https://www.gyanvatsala.in/pdf/jpg-to-pdf',
            description: 'Combine JPG, PNG, and WebP images into a single ordered PDF file directly inside your browser.',
          },
          {
            '@type': 'SoftwareApplication',
            name: 'PDF to Word',
            applicationCategory: 'BusinessApplication',
            operatingSystem: 'Web Browser',
            url: 'https://www.gyanvatsala.in/pdf/pdf-to-word',
            description: 'Convert PDF documents to editable Microsoft Word DOCX files preserving layout and text structure.',
          },
          {
            '@type': 'SoftwareApplication',
            name: 'Compress PDF',
            applicationCategory: 'UtilitiesApplication',
            operatingSystem: 'Web Browser',
            url: 'https://www.gyanvatsala.in/pdf/compress-pdf',
            description: 'Compress PDF file size for online form portals and email attachments without visible quality loss.',
          },
          {
            '@type': 'SoftwareApplication',
            name: 'Scan Studio FX',
            applicationCategory: 'UtilitiesApplication',
            operatingSystem: 'Web Browser',
            url: 'https://www.gyanvatsala.in/scan-studio',
            description: 'Apply realistic scanner optics, rotational tilt, and paper grain to make clean PDFs look physically scanned.',
          },
        ],
      },
      {
        '@type': 'FAQPage',
        '@id': 'https://www.gyanvatsala.in/#faq',
        mainEntity: [
          {
            '@type': 'Question',
            name: 'How do I edit a PDF online for free without watermarks on Gyanvatsala?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Open Gyanvatsala Online PDF Editor, drop your PDF directly into the browser workspace, modify text, add signatures or whiteout, and export cleanly in seconds with zero watermarks and zero server uploads.',
            },
          },
          {
            '@type': 'Question',
            name: 'How can I reduce image size in KB (20KB, 50KB, or 100KB) for exam & government portals?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Use Gyanvatsala Image Size Reducer in KB to enter any exact KB target like 20KB, 50KB, or 100KB—or scale by quality percentage—to compress JPG, PNG, and WebP photos locally in your browser.',
            },
          },
          {
            '@type': 'Question',
            name: 'Can I convert JPG to PDF, convert PDF to Word, and compress PDF without losing quality?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Yes. Gyanvatsala includes dedicated JPG to PDF, PDF to Word, Compress PDF, Merge/Split PDF, and Scan Studio FX utilities running privately in browser WebAssembly and Canvas.',
            },
          },
          {
            '@type': 'Question',
            name: 'Are sensitive documents like Aadhaar cards, PAN PDFs, or transcripts uploaded to cloud servers?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'No. All core PDF editing, KB image compression, JPG to PDF conversion, and Scan Studio FX processing happen 100% locally in your browser RAM with zero external server uploads.',
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
          id="json-ld-app"
          type="application/ld+json"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c'),
          }}
        />
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

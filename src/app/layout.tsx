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
    default: 'Gyanvatsala — Free Online PDF Editor, Image to PDF & Image Size Reducer',
    template: '%s | Gyanvatsala',
  },
  description:
    'Free online PDF editor, Image to PDF (IMG/JPG/PNG to PDF) converter, and Image Size Reducer in KB & MB. Edit PDF text, merge, split, compress PDFs, convert PDF to Word, and simulate scans privately in your browser with Zero Uploads.',
  keywords: GLOBAL_SEARCH_KEYWORDS,
  authors: [{ name: 'Gyanvatsala', url: 'https://www.gyanvatsala.in' }],
  creator: 'Gyanvatsala',
  publisher: 'Gyanvatsala',
  category: 'technology',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://www.gyanvatsala.in/',
    title: 'Gyanvatsala — Free Online PDF Editor, Image to PDF & Image Size Reducer',
    description:
      'Edit PDFs in-place, convert IMG/JPG/PNG to PDF, reduce image size to 20KB–500KB, convert PDF to Word, and simulate photocopier scans cleanly with 100% client-side privacy.',
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
    title: 'Gyanvatsala — Free Online PDF Editor, Image to PDF & Image Size Reducer',
    description:
      'Edit PDFs, convert images to PDF, and compress photos to exact KB sizes privately in your browser with zero uploads.',
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
        name: 'Gyanvatsala PDF Editor, Image to PDF & Image Size Reducer',
        applicationCategory: 'UtilitiesApplication',
        operatingSystem: 'All (Web Browser, Windows, macOS, Linux, Android, iOS)',
        url: 'https://www.gyanvatsala.in/',
        description:
          'Complete client-side document and media suite: free online PDF editor, JPG/PNG/IMG to PDF converter, Image Size Reducer (20KB, 50KB, 100KB, custom KB), PDF compressor, Merge/Split PDF, PDF to Word, and Photocopier Scan Studio.',
        offers: {
          '@type': 'Offer',
          price: '0.00',
          priceCurrency: 'INR',
        },
        featureList: [
          'Free Online PDF Editor with direct text editing, alignment snap guides, whiteout, and signatures',
          'Image to PDF (IMG, JPG, JPEG, PNG, WebP, BMP to PDF) converter with A4 & Letter layout options',
          'Image Size Reducer in KB & MB (20KB, 50KB, 100KB, 200KB presets for forms and uploads)',
          'Compress PDF, Merge PDF, Split PDF, Sign PDF, Protect PDF, and PDF to Word conversion',
          'Analog Photocopier Scan Studio with rotational skew, noise shaders, and paper grain',
          'Zero Server Uploads client-side WebAssembly processing for complete privacy',
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

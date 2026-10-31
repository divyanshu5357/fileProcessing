import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/context/ThemeContext';
import { AuthProvider } from '@/context/AuthContext';

export const metadata: Metadata = {
  title: 'PixelKit — All-in-One Image Utility',
  description:
    'Privacy-first, browser-based image toolkit. Compress, resize, convert, crop, rotate, strip EXIF metadata, extract color palettes, beautify screenshots, and generate passport photos with zero server uploads.',
  keywords: [
    'image compression',
    'resize image',
    'convert image',
    'strip exif',
    'passport photo',
    'color palette extractor',
    'beautify screenshot',
    'client-side image editor',
  ],
  authors: [{ name: 'PixelKit' }],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className="h-full antialiased">
      <head suppressHydrationWarning>
        <script
          id="theme-initializer"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var saved = localStorage.getItem('pixelkit-theme');
                var isDark = saved ? saved === 'dark' : (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
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
      <body suppressHydrationWarning className="min-h-full flex flex-col bg-[#F8FAFC] dark:bg-[#0F172A] text-[#0F172A] dark:text-[#F8FAFC] font-sans transition-colors duration-150">
        <ThemeProvider>
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

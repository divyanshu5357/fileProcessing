import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { ArrowRight } from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ProductHeroVisual } from '@/components/landing/ProductHeroVisual';
import { ALL_PDF_TOOLS } from '@/lib/toolRegistry';
import { GLOBAL_SEARCH_KEYWORDS, SITE_BASE_URL } from '@/lib/seoData';

export const metadata: Metadata = {
  title: 'Free Online PDF Editor, Image to PDF & Image Size Reducer | Gyanvatsala',
  description:
    'Edit PDF text online, convert JPG/PNG/IMG to PDF, and reduce image size to 20KB, 50KB, or 100KB for free. Merge, split & compress PDFs, convert PDF to Word, and create realistic scans with 100% browser privacy.',
  keywords: GLOBAL_SEARCH_KEYWORDS,
  alternates: {
    canonical: 'https://www.gyanvatsala.in/',
  },
  openGraph: {
    title: 'Free Online PDF Editor, Image to PDF & Image Size Reducer | Gyanvatsala',
    description:
      'All-in-one client-side workspace for PDF editing, IMG/JPG/PNG to PDF conversion, Image Size Reduction in KB/MB, PDF compression, Merge/Split, and Scan Studio.',
    url: 'https://www.gyanvatsala.in/',
    siteName: 'Gyanvatsala',
    images: [
      {
        url: 'https://www.gyanvatsala.in/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'Gyanvatsala — Free Online PDF Editor, Image to PDF & Image Size Reducer',
      },
    ],
  },
};

const ProductShowcase = dynamic(
  () => import('@/components/landing/ProductShowcase').then((mod) => mod.ProductShowcase),
  {
    loading: () => <div className="w-full min-h-[450px]" />,
  }
);

const VisualWorkflow = dynamic(
  () => import('@/components/landing/VisualWorkflow').then((mod) => mod.VisualWorkflow),
  {
    loading: () => <div className="w-full min-h-[350px]" />,
  }
);

const CapabilitiesSection = dynamic(
  () => import('@/components/landing/CapabilitiesSection').then((mod) => mod.CapabilitiesSection),
  {
    loading: () => <div className="w-full min-h-[300px]" />,
  }
);

const TrustSection = dynamic(
  () => import('@/components/landing/TrustSection').then((mod) => mod.TrustSection),
  {
    loading: () => <div className="w-full min-h-[300px]" />,
  }
);

import { LandingClientModals } from '@/components/landing/LandingClientModals';

export default function GyanvatsalaHomepage() {
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-[#0D1017] text-[#20232B] dark:text-[#F8FAFC] selection:bg-[#536BCE] selection:text-white transition-colors duration-150">
      {/* 1. CLEAN SINGLE NAVIGATION HEADER */}
      <Header />

      <main className="flex-1 flex flex-col">
        {/* ======================================================== */}
        {/* 2. NEW HERO SECTION (APPLE / LINEAR RESTYLED)            */}
        {/* ======================================================== */}
        <section className="relative w-full pt-16 pb-24 sm:pt-20 sm:pb-32 px-4 sm:px-6 lg:px-8 overflow-hidden bg-white dark:bg-[#0D1017]">
          {/* Subtle ambient light gradient */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-3/4 h-96 bg-gradient-to-b from-[#EDF2FE]/60 to-transparent dark:from-[#536BCE]/8 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-7xl mx-auto flex flex-col items-center text-center gap-8 relative z-10">
            {/* Small Introductory Label */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#F7F8FA] dark:bg-[#151926] border border-[#E9EBF0] dark:border-[#28314A] text-xs font-semibold text-[#3B50B2] dark:text-[#93A5F5] tracking-wider uppercase shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-[#3B50B2] dark:bg-[#93A5F5]" />
              <span>Free Online File Processing & Document Suite</span>
            </div>

            {/* Main Bold Headline */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-[#20232B] dark:text-[#F8FAFC] tracking-tight max-w-5xl leading-[1.08]">
              Edit PDFs, convert images to PDF &amp; reduce image size privately.
            </h1>

            {/* Supporting Paragraph */}
            <p className="text-base sm:text-xl text-[#4E5360] dark:text-[#9DA3AE] max-w-3xl leading-relaxed font-normal">
              Free online PDF editor, IMG &amp; JPG to PDF converter, and KB/MB image size reducer (20KB, 50KB, 100KB). Merge, split &amp; compress PDFs, convert PDF to Word, and run Scan Studio — 100% in-browser with Zero Uploads.
            </p>

            {/* Primary Button & Secondary Link */}
            <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
              <Link
                href="/workspace"
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-[#20232B] dark:bg-[#536BCE] hover:bg-[#343A46] dark:hover:bg-[#4157B5] text-white text-sm font-semibold transition-all shadow-sm hover:shadow-md group"
              >
                <span>Explore Workspace</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>

              <a
                href="#showcase"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#3B50B2] dark:text-[#93A5F5] hover:underline px-4 py-3.5 transition"
              >
                <span>See what you can do</span>
                <span>→</span>
              </a>
            </div>

            {/* Direct Popular Tool Shortcuts for Instant Access & Crawling */}
            <nav
              aria-label="Popular Document and Image Tools"
              className="flex flex-wrap items-center justify-center gap-2 pt-2 max-w-4xl"
            >
              {[
                { label: 'Online PDF Editor', href: '/tools/pdf-editor' },
                { label: 'Image to PDF (JPG / PNG)', href: '/pdf/jpg-to-pdf' },
                { label: 'Image Size Reducer (KB)', href: '/tools/image-size-reducer' },
                { label: 'Compress PDF', href: '/pdf/compress-pdf' },
                { label: 'Merge PDF', href: '/pdf/merge-pdf' },
                { label: 'Split PDF', href: '/pdf/split-pdf' },
                { label: 'PDF to Word', href: '/pdf/pdf-to-word' },
                { label: 'Scan Studio', href: '/scan-studio' },
              ].map((shortcut) => (
                <Link
                  key={shortcut.href}
                  href={shortcut.href}
                  className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#F7F8FA] dark:bg-[#151926] border border-[#E2E6F0] dark:border-[#28314A] text-[#20232B] dark:text-[#E2E8F0] hover:border-[#3B50B2] dark:hover:border-[#93A5F5] hover:text-[#3B50B2] dark:hover:text-[#93A5F5] transition"
                >
                  {shortcut.label}
                </Link>
              ))}
            </nav>

            {/* Subtle Supporting Statement */}
            <span className="text-xs sm:text-sm text-[#4E5360] dark:text-[#9DA3AE] tracking-wide pt-1">
              Documents. Images. Scanning. Creativity.
            </span>

            {/* Hero Visual Composition */}
            <div className="w-full pt-10 sm:pt-14">
              <ProductHeroVisual />
            </div>
          </div>
        </section>

        {/* ======================================================== */}
        {/* 3. INTERACTIVE PRODUCT SHOWCASE                          */}
        {/* ======================================================== */}
        <ProductShowcase />

        {/* ======================================================== */}
        {/* 4. VISUAL WORKFLOW SECTION                               */}
        {/* ======================================================== */}
        <VisualWorkflow />

        {/* ======================================================== */}
        {/* 5. EDITORIAL CAPABILITIES SECTION                        */}
        {/* ======================================================== */}
        <CapabilitiesSection />

        {/* ======================================================== */}
        {/* 6. TRUST AND PRIVACY ARCHITECTURE                        */}
        {/* ======================================================== */}
        <TrustSection />

        {/* ======================================================== */}
        {/* 7. FINAL CALL TO ACTION (MINIMALIST ELEGANCE)            */}
        {/* ======================================================== */}
        <section className="w-full py-28 px-4 sm:px-6 lg:px-8 bg-white dark:bg-[#0D1017] border-t border-[#E9EBF0] dark:border-[#222632] transition-colors">
          <div className="max-w-4xl mx-auto rounded-3xl bg-[#F7F8FA] dark:bg-[#121622] border border-[#E9EBF0] dark:border-[#242B3E] p-10 sm:p-16 text-center flex flex-col items-center gap-6 shadow-sm">
            <span className="text-xs font-semibold text-[#3B50B2] dark:text-[#93A5F5] uppercase tracking-wider">
              Get Started
            </span>

            <h2 className="text-3xl sm:text-5xl font-black text-[#20232B] dark:text-[#F8FAFC] tracking-tight max-w-2xl">
              Make your next file task feel effortless.
            </h2>

            <p className="text-base sm:text-lg text-[#4E5360] dark:text-[#9DA3AE] max-w-lg leading-relaxed">
              Discover a simpler way to work with your digital documents.
            </p>

            <div className="pt-2">
              <Link
                href="/workspace"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-[#20232B] dark:bg-[#536BCE] hover:bg-[#343A46] dark:hover:bg-[#4157B5] text-white text-base font-semibold transition-all shadow-sm hover:shadow-md group"
              >
                <span>Enter Your Workspace</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>

            <span className="text-xs text-[#4E5360] dark:text-[#9DA3AE]">
              No registration required to begin • 100% client-side available
            </span>
          </div>
        </section>

        {/* ======================================================== */}
        {/* 8. COMPLETE TOOL DIRECTORY & FAQ (SSR SEO ARCHITECTURE)  */}
        {/* ======================================================== */}
        {(() => {
          const homeFaqs = [
            {
              question: 'How do I edit a PDF online for free without watermarks?',
              answer:
                'Open Gyanvatsala’s Free Online PDF Editor, upload any PDF from your device, click existing text lines to edit wording or move rows with snap guides, add signatures or whiteout, and export directly in your browser without watermarks.',
            },
            {
              question: 'How can I convert an image (IMG, JPG, PNG) into a PDF?',
              answer:
                'Use our Image to PDF (JPG / PNG to PDF) converter. Select one or multiple images, pick A4, Letter, or Auto-Fit page sizing, adjust margins, and combine them into one crisp PDF in seconds.',
            },
            {
              question: 'Can I reduce an image size to 20KB, 50KB, or 100KB?',
              answer:
                'Yes. Open Gyanvatsala’s Image Size Reducer, select a target KB preset (20KB, 50KB, 100KB, 200KB, or custom KB), choose JPEG or WebP, and shrink photos locally for exam portals, forms, and emails.',
            },
            {
              question: 'Are my PDFs and photos uploaded to external servers?',
              answer:
                'No. Core PDF editing, IMG to PDF conversion, KB image compression, merging, splitting, and Scan Studio run locally in your browser using WebAssembly and HTML5 Canvas.',
            },
          ];

          const homeSchema = {
            '@context': 'https://schema.org',
            '@graph': [
              {
                '@type': 'ItemList',
                name: 'Gyanvatsala PDF & Image Tools Directory',
                itemListElement: [
                  {
                    '@type': 'ListItem',
                    position: 1,
                    name: 'Online PDF Editor',
                    url: `${SITE_BASE_URL}/tools/pdf-editor`,
                  },
                  {
                    '@type': 'ListItem',
                    position: 2,
                    name: 'Image to PDF (JPG / PNG to PDF)',
                    url: `${SITE_BASE_URL}/pdf/jpg-to-pdf`,
                  },
                  {
                    '@type': 'ListItem',
                    position: 3,
                    name: 'Image Size Reducer (KB / MB)',
                    url: `${SITE_BASE_URL}/tools/image-size-reducer`,
                  },
                  ...ALL_PDF_TOOLS.slice(0, 12).map((t, idx) => ({
                    '@type': 'ListItem',
                    position: idx + 4,
                    name: t.name,
                    url: `${SITE_BASE_URL}/pdf/${t.id}`,
                  })),
                ],
              },
              {
                '@type': 'FAQPage',
                mainEntity: homeFaqs.map((faq) => ({
                  '@type': 'Question',
                  name: faq.question,
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: faq.answer,
                  },
                })),
              },
            ],
          };

          return (
            <section
              aria-label="All PDF and Image Tools Directory and FAQ"
              className="w-full py-20 px-4 sm:px-6 lg:px-8 bg-[#F7F8FA] dark:bg-[#0E121B] border-t border-[#E9EBF0] dark:border-[#222632]"
            >
              <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(homeSchema) }}
              />
              <div className="max-w-7xl mx-auto space-y-14">
                <div className="space-y-6">
                  <div className="max-w-3xl">
                    <h2 className="text-2xl sm:text-3xl font-black text-[#20232B] dark:text-[#F8FAFC] tracking-tight">
                      Every PDF Editor, Image to PDF &amp; File Compressor Tool in One Place
                    </h2>
                    <p className="text-sm sm:text-base text-[#4E5360] dark:text-[#9DA3AE] mt-2 leading-relaxed">
                      Jump straight into any dedicated client-side utility—from editing PDF text and reducing photo file sizes in KB to merging, splitting, signing, and scanning documents.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                    <Link
                      href="/tools/pdf-editor"
                      className="p-3.5 rounded-xl bg-white dark:bg-[#141824] border border-[#E9EBF0] dark:border-[#242B3E] hover:border-[#3B50B2] dark:hover:border-[#93A5F5] text-xs font-bold text-[#20232B] dark:text-[#F8FAFC] transition"
                    >
                      Online PDF Editor
                    </Link>
                    <Link
                      href="/tools/image-size-reducer"
                      className="p-3.5 rounded-xl bg-white dark:bg-[#141824] border border-[#E9EBF0] dark:border-[#242B3E] hover:border-[#3B50B2] dark:hover:border-[#93A5F5] text-xs font-bold text-[#20232B] dark:text-[#F8FAFC] transition"
                    >
                      Image Size Reducer (KB)
                    </Link>
                    <Link
                      href="/scan-studio"
                      className="p-3.5 rounded-xl bg-white dark:bg-[#141824] border border-[#E9EBF0] dark:border-[#242B3E] hover:border-[#3B50B2] dark:hover:border-[#93A5F5] text-xs font-bold text-[#20232B] dark:text-[#F8FAFC] transition"
                    >
                      Scan Studio FX
                    </Link>
                    <Link
                      href="/image-tools"
                      className="p-3.5 rounded-xl bg-white dark:bg-[#141824] border border-[#E9EBF0] dark:border-[#242B3E] hover:border-[#3B50B2] dark:hover:border-[#93A5F5] text-xs font-bold text-[#20232B] dark:text-[#F8FAFC] transition"
                    >
                      Passport Photo &amp; EXIF Studio
                    </Link>
                    <Link
                      href="/image-converter"
                      className="p-3.5 rounded-xl bg-white dark:bg-[#141824] border border-[#E9EBF0] dark:border-[#242B3E] hover:border-[#3B50B2] dark:hover:border-[#93A5F5] text-xs font-bold text-[#20232B] dark:text-[#F8FAFC] transition"
                    >
                      WebP / PNG / JPG Converter
                    </Link>
                    {ALL_PDF_TOOLS.map((tool) => (
                      <Link
                        key={tool.id}
                        href={
                          tool.id === 'pdf-editor'
                            ? '/tools/pdf-editor'
                            : tool.id === 'pdf-assembler'
                            ? '/tools/pdf-assembler'
                            : `/pdf/${tool.id}`
                        }
                        className="p-3.5 rounded-xl bg-white dark:bg-[#141824] border border-[#E9EBF0] dark:border-[#242B3E] hover:border-[#3B50B2] dark:hover:border-[#93A5F5] text-xs font-semibold text-[#20232B] dark:text-[#F8FAFC] transition truncate"
                      >
                        {tool.name}
                      </Link>
                    ))}
                  </div>
                </div>

                <div className="space-y-5 pt-6 border-t border-[#E9EBF0] dark:border-[#242B3E]">
                  <h2 className="text-2xl font-black text-[#20232B] dark:text-[#F8FAFC] tracking-tight">
                    Frequently Asked Questions
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {homeFaqs.map((faq) => (
                      <article
                        key={faq.question}
                        className="p-5 rounded-2xl bg-white dark:bg-[#141824] border border-[#E9EBF0] dark:border-[#242B3E] space-y-2"
                      >
                        <h3 className="text-sm font-bold text-[#20232B] dark:text-[#F8FAFC]">
                          {faq.question}
                        </h3>
                        <p className="text-xs sm:text-sm text-[#4E5360] dark:text-[#9DA3AE] leading-relaxed">
                          {faq.answer}
                        </p>
                      </article>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          );
        })()}
      </main>

      {/* 8. CLEAN PROFESSIONAL FOOTER */}
      <Footer />

      {/* Deferred Modals & Client-side Redirects */}
      <LandingClientModals />
    </div>
  );
}

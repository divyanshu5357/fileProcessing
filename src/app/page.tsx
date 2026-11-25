import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ProductHeroVisual } from '@/components/landing/ProductHeroVisual';
import { ProductShowcase } from '@/components/landing/ProductShowcase';
import { VisualWorkflow } from '@/components/landing/VisualWorkflow';
import { CapabilitiesSection } from '@/components/landing/CapabilitiesSection';
import { TrustSection } from '@/components/landing/TrustSection';
import { ALL_PDF_TOOLS } from '@/lib/toolRegistry';
import { GLOBAL_SEARCH_KEYWORDS, SITE_BASE_URL } from '@/lib/seoData';
import { HeroTaskPills } from '@/components/landing/HeroTaskPills';
import { HeroDropzoneSurface } from '@/components/landing/MotionPrimitives';
import { SearchableToolDirectory } from '@/components/landing/SearchableToolDirectory';

export const metadata: Metadata = {
  title: {
    absolute: 'Free Online PDF Editor, JPG to PDF & Image Size Reducer (20KB–100KB) | Gyanvatsala',
  },
  description:
    'Edit PDFs without watermarks, convert JPG/PNG to PDF, compress PDFs, and reduce photo size to 20KB, 50KB, or 100KB—100% locally in your browser with zero server uploads.',
  keywords: GLOBAL_SEARCH_KEYWORDS,
  alternates: {
    canonical: 'https://www.gyanvatsala.in/',
  },
  openGraph: {
    title: 'Free Online PDF Editor, JPG to PDF & Image Size Reducer (20KB–100KB) | Gyanvatsala',
    description:
      'Edit PDFs without watermarks, convert JPG/PNG to PDF, compress PDFs, and reduce photo size to 20KB, 50KB, or 100KB—100% locally in your browser with zero server uploads.',
    url: 'https://www.gyanvatsala.in/',
    siteName: 'Gyanvatsala',
    images: [
      {
        url: 'https://www.gyanvatsala.in/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'Free Online PDF Editor, JPG to PDF & Image Size Reducer (20KB–100KB) | Gyanvatsala',
      },
    ],
  },
};

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
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>100% Client-Side Browser Processing • Zero Watermarks</span>
            </div>

            {/* Main Bold Headline (Static on initial paint for <1.2s LCP) */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-[#20232B] dark:text-[#F8FAFC] tracking-tight max-w-5xl leading-[1.08]">
              Free Online PDF Editor, Image to PDF &amp; KB Size Reducer
            </h1>

            {/* Supporting Paragraph */}
            <p className="text-base sm:text-xl text-[#4E5360] dark:text-[#9DA3AE] max-w-3xl leading-relaxed font-normal">
              Edit PDF text, sign documents, merge/split pages, convert JPG to PDF, and shrink photos to 20KB–100KB for exam &amp; government portals. 100% private browser processing—zero server uploads.
            </p>

            {/* Primary Button & Secondary Link */}
            <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
              <Link
                href="/workspace"
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-[#20232B] dark:bg-[#536BCE] hover:bg-[#343A46] dark:hover:bg-[#4157B5] text-white text-sm font-semibold transition-all shadow-sm hover:shadow-md group"
              >
                <span>Open Free PDF &amp; Image Workspace</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>

              <a
                href="#tool-directory"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#3B50B2] dark:text-[#93A5F5] hover:underline px-4 py-3.5 transition"
              >
                <span>Browse All 34 PDF &amp; KB Tools</span>
                <span>→</span>
              </a>
            </div>

            {/* Staggered Functional Task Pills */}
            <HeroTaskPills />

            {/* Subtle Supporting Statement */}
            <span className="text-xs sm:text-sm text-[#4E5360] dark:text-[#9DA3AE] tracking-wide pt-1">
              Drop any PDF or image directly onto the preview canvas below to start immediately.
            </span>

            {/* Hero Visual Composition with Interactive Dropzone */}
            <div className="w-full pt-8 sm:pt-12">
              <HeroDropzoneSurface>
                <ProductHeroVisual />
              </HeroDropzoneSurface>
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
              question: 'How do I edit a PDF online for free without watermarks on Gyanvatsala?',
              answer:
                'Open Gyanvatsala Online PDF Editor, drop your PDF directly into the browser workspace, modify text, add signatures or whiteout, and export cleanly in seconds with zero watermarks and zero server uploads.',
            },
            {
              question: 'How can I reduce image size in KB (20KB, 50KB, or 100KB) for exam & government portals?',
              answer:
                'Use Gyanvatsala Image Size Reducer in KB to enter any exact KB target like 20KB, 50KB, or 100KB—or scale by quality percentage—to compress JPG, PNG, and WebP photos locally in your browser.',
            },
            {
              question: 'Can I convert JPG to PDF, convert PDF to Word, and compress PDF without losing quality?',
              answer:
                'Yes. Gyanvatsala includes dedicated JPG to PDF, PDF to Word, Compress PDF, Merge/Split PDF, and Scan Studio FX utilities running privately in browser WebAssembly and Canvas.',
            },
            {
              question: 'Are sensitive documents like Aadhaar cards, PAN PDFs, or transcripts uploaded to cloud servers?',
              answer:
                'No. All core PDF editing, KB image compression, JPG to PDF conversion, and Scan Studio FX processing happen 100% locally in your browser RAM with zero external server uploads.',
            },
          ];

          const homeDirectorySchema = {
            '@context': 'https://schema.org',
            '@type': 'ItemList',
            name: 'Gyanvatsala PDF & Image Tools Directory',
            itemListElement: [
              {
                '@type': 'ListItem',
                position: 1,
                name: 'Online PDF Editor Without Watermark',
                url: `${SITE_BASE_URL}/tools/pdf-editor`,
              },
              {
                '@type': 'ListItem',
                position: 2,
                name: 'Reduce Image Size in KB (20KB–100KB)',
                url: `${SITE_BASE_URL}/tools/image-size-reducer`,
              },
              {
                '@type': 'ListItem',
                position: 3,
                name: 'Convert JPG & PNG Photos to PDF',
                url: `${SITE_BASE_URL}/pdf/jpg-to-pdf`,
              },
              {
                '@type': 'ListItem',
                position: 4,
                name: 'Compress PDF File Size',
                url: `${SITE_BASE_URL}/pdf/compress-pdf`,
              },
              {
                '@type': 'ListItem',
                position: 5,
                name: 'Convert PDF to Editable Word (DOCX)',
                url: `${SITE_BASE_URL}/pdf/pdf-to-word`,
              },
              {
                '@type': 'ListItem',
                position: 6,
                name: 'Scan Studio FX Simulator',
                url: `${SITE_BASE_URL}/scan-studio`,
              },
              ...ALL_PDF_TOOLS.slice(0, 10).map((t, idx) => ({
                '@type': 'ListItem',
                position: idx + 7,
                name: t.name,
                url: `${SITE_BASE_URL}/pdf/${t.id}`,
              })),
            ],
          };

          return (
            <section
              id="tool-directory"
              aria-label="Searchable PDF and Image Tools Directory and FAQ"
              className="w-full py-20 px-4 sm:px-6 lg:px-8 bg-[#F7F8FA] dark:bg-[#0E121B] border-t border-[#E9EBF0] dark:border-[#222632]"
            >
              <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                  __html: JSON.stringify(homeDirectorySchema).replace(/</g, '\\u003c'),
                }}
              />
              <div className="max-w-7xl mx-auto space-y-14">
                <SearchableToolDirectory />

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

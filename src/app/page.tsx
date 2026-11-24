'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ProductHeroVisual } from '@/components/landing/ProductHeroVisual';
import { ProductShowcase } from '@/components/landing/ProductShowcase';
import { VisualWorkflow } from '@/components/landing/VisualWorkflow';
import { CapabilitiesSection } from '@/components/landing/CapabilitiesSection';
import { TrustSection } from '@/components/landing/TrustSection';
import { PrivacyBanner } from '@/components/PrivacyBanner';
import { KeyboardShortcutsModal } from '@/components/KeyboardShortcutsModal';

export default function GyanvatsalaHomepage() {
  const router = useRouter();
  const [privacyModalOpen, setPrivacyModalOpen] = useState(false);
  const [shortcutsModalOpen, setShortcutsModalOpen] = useState(false);

  // Backwards compatibility for query params (?tab=..., ?tool=...)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab');
      const tool = params.get('tool');
      if (tab === 'pdf-tools' || tool) {
        router.push(tool ? `/pdf/${tool}` : '/pdf');
      } else if (tab === 'scan-studio') {
        router.push('/scan-studio');
      } else if (tab === 'image-converter') {
        router.push('/image-converter');
      } else if (tab === 'image-tools') {
        router.push('/image-tools');
      }
    }
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-[#0D1017] text-[#20232B] dark:text-[#F8FAFC] selection:bg-[#536BCE] selection:text-white transition-colors duration-150">
      {/* 1. CLEAN SINGLE NAVIGATION HEADER */}
      <Header
        onOpenPrivacyInfo={() => setPrivacyModalOpen(true)}
        onOpenShortcuts={() => setShortcutsModalOpen(true)}
      />

      <main className="flex-1 flex flex-col">
        {/* ======================================================== */}
        {/* 2. NEW HERO SECTION (APPLE / LINEAR RESTYLED)            */}
        {/* ======================================================== */}
        <section className="relative w-full pt-16 pb-24 sm:pt-20 sm:pb-32 px-4 sm:px-6 lg:px-8 overflow-hidden bg-white dark:bg-[#0D1017]">
          {/* Subtle ambient light gradient */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-3/4 h-96 bg-gradient-to-b from-[#EDF2FE]/60 to-transparent dark:from-[#536BCE]/8 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-7xl mx-auto flex flex-col items-center text-center gap-8 relative z-10">
            {/* Small Introductory Label */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#F7F8FA] dark:bg-[#151926] border border-[#E9EBF0] dark:border-[#28314A] text-xs font-semibold text-[#536BCE] tracking-wider uppercase shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-[#536BCE]" />
              <span>Free Online File Processing & Document Suite</span>
            </div>

            {/* Main Bold Headline */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-[#20232B] dark:text-[#F8FAFC] tracking-tight max-w-4xl leading-[1.1]">
              Private file processing and document workspace.
            </h1>

            {/* Supporting Paragraph */}
            <p className="text-base sm:text-xl text-[#727783] dark:text-[#9DA3AE] max-w-2xl leading-relaxed font-normal">
              Convert PDF to Word, edit PDFs in-place, simulate analog photocopier scan effects with Scan Studio, and convert or compress images. 100% private with in-browser Zero Upload processing.
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
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#536BCE] dark:text-[#93A5F5] hover:underline px-4 py-3.5 transition"
              >
                <span>See what you can do</span>
                <span>→</span>
              </a>
            </div>

            {/* Subtle Supporting Statement */}
            <span className="text-xs sm:text-sm text-[#727783] dark:text-[#9DA3AE] tracking-wide pt-1">
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
            <span className="text-xs font-semibold text-[#536BCE] uppercase tracking-wider">
              Get Started
            </span>

            <h2 className="text-3xl sm:text-5xl font-black text-[#20232B] dark:text-[#F8FAFC] tracking-tight max-w-2xl">
              Make your next file task feel effortless.
            </h2>

            <p className="text-base sm:text-lg text-[#727783] dark:text-[#9DA3AE] max-w-lg leading-relaxed">
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

            <span className="text-xs text-[#727783] dark:text-[#9DA3AE]">
              No registration required to begin • 100% client-side available
            </span>
          </div>
        </section>
      </main>

      {/* 8. CLEAN PROFESSIONAL FOOTER */}
      <Footer onOpenPrivacyInfo={() => setPrivacyModalOpen(true)} />

      {/* Modals */}
      <PrivacyBanner
        isOpen={privacyModalOpen}
        onClose={() => setPrivacyModalOpen(false)}
      />
      <KeyboardShortcutsModal
        isOpen={shortcutsModalOpen}
        onClose={() => setShortcutsModalOpen(false)}
      />
    </div>
  );
}

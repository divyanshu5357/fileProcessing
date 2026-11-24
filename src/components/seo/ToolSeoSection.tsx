import React from 'react';
import Link from 'next/link';
import { CheckCircle2, ChevronRight, ShieldCheck, Sparkles, HelpCircle } from 'lucide-react';
import { getToolSeoProfile, SITE_BASE_URL } from '@/lib/seoData';

interface ToolSeoSectionProps {
  profileId: string;
}

export function ToolSeoSection({ profileId }: ToolSeoSectionProps) {
  const profile = getToolSeoProfile(profileId);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: `${SITE_BASE_URL}/`,
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: profile.breadcrumbParent.name,
            item: `${SITE_BASE_URL}${profile.breadcrumbParent.href}`,
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: profile.h1,
            item: profile.canonicalUrl,
          },
        ],
      },
      {
        '@type': 'SoftwareApplication',
        name: profile.seoTitle,
        alternateName: profile.alternateNames,
        applicationCategory: 'UtilitiesApplication',
        operatingSystem: 'Web Browser (Windows, macOS, Linux, Android, iOS)',
        url: profile.canonicalUrl,
        description: profile.metaDescription,
        featureList: profile.highlights,
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
        },
        provider: {
          '@id': `${SITE_BASE_URL}/#organization`,
        },
      },
      {
        '@type': 'HowTo',
        name: profile.howToTitle,
        description: profile.metaDescription,
        step: profile.howToSteps.map((step, idx) => ({
          '@type': 'HowToStep',
          position: idx + 1,
          name: step.name,
          text: step.text,
        })),
      },
      {
        '@type': 'FAQPage',
        mainEntity: profile.faqs.map((faq) => ({
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
      aria-label={`${profile.h1} Guide and FAQ`}
      className="w-full border-t border-[#E2E8F0] dark:border-[#1E293B] bg-white dark:bg-[#0B1120] py-14 px-4 sm:px-6 lg:px-8 transition-colors"
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="max-w-5xl mx-auto flex flex-col gap-12">
        {/* Visible Semantic Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-xs text-[#475569] dark:text-[#94A3B8]">
          <Link href="/" className="hover:text-[#2563EB] dark:hover:text-[#60A5FA] font-medium">
            Home
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link
            href={profile.breadcrumbParent.href}
            className="hover:text-[#2563EB] dark:hover:text-[#60A5FA] font-medium"
          >
            {profile.breadcrumbParent.name}
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="font-semibold text-[#0F172A] dark:text-[#F8FAFC]">{profile.h1}</span>
        </nav>

        {/* Overview & Highlights */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>100% Client-Side Private Execution</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-[#0F172A] dark:text-[#F8FAFC] tracking-tight">
              {profile.h1}
            </h2>
            <p className="text-sm sm:text-base text-[#334155] dark:text-[#CBD5E1] leading-relaxed">
              {profile.overview}
            </p>
          </div>

          <div className="lg:col-span-5 p-6 rounded-2xl bg-[#F8FAFC] dark:bg-[#111827] border border-[#E2E8F0] dark:border-[#1E293B] space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#2563EB] dark:text-[#60A5FA]">
              <Sparkles className="w-4 h-4" />
              <span>Key Capabilities</span>
            </div>
            <ul className="space-y-2.5 text-xs sm:text-sm text-[#1E293B] dark:text-[#E2E8F0]">
              {profile.highlights.map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* How-To 3-Step Guide */}
        <div className="space-y-5">
          <h3 className="text-xl font-extrabold text-[#0F172A] dark:text-[#F8FAFC] tracking-tight">
            {profile.howToTitle}
          </h3>
          <ol className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {profile.howToSteps.map((step, index) => (
              <li
                key={step.name}
                className="p-5 rounded-2xl bg-[#F8FAFC] dark:bg-[#111827] border border-[#E2E8F0] dark:border-[#1E293B] space-y-2"
              >
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-[#2563EB] text-white text-xs font-extrabold">
                  {index + 1}
                </span>
                <h4 className="text-sm font-bold text-[#0F172A] dark:text-[#F8FAFC]">{step.name}</h4>
                <p className="text-xs text-[#475569] dark:text-[#94A3B8] leading-relaxed">{step.text}</p>
              </li>
            ))}
          </ol>
        </div>

        {/* Frequently Asked Questions */}
        <div className="space-y-5">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-[#2563EB] dark:text-[#60A5FA]" />
            <h3 className="text-xl font-extrabold text-[#0F172A] dark:text-[#F8FAFC] tracking-tight">
              Frequently Asked Questions
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {profile.faqs.map((faq) => (
              <article
                key={faq.question}
                className="p-5 rounded-2xl bg-[#F8FAFC] dark:bg-[#111827] border border-[#E2E8F0] dark:border-[#1E293B] space-y-2"
              >
                <h4 className="text-sm font-bold text-[#0F172A] dark:text-[#F8FAFC]">
                  {faq.question}
                </h4>
                <p className="text-xs sm:text-sm text-[#475569] dark:text-[#94A3B8] leading-relaxed">
                  {faq.answer}
                </p>
              </article>
            ))}
          </div>
        </div>

        {/* Popular Related Tools Internal Link Cluster */}
        <div className="space-y-4 pt-4 border-t border-[#E2E8F0] dark:border-[#1E293B]">
          <h3 className="text-base font-extrabold text-[#0F172A] dark:text-[#F8FAFC]">
            Popular Gyanvatsala PDF &amp; Image Tools
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {profile.relatedLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center justify-between gap-2 p-3 rounded-xl border border-[#E2E8F0] dark:border-[#1E293B] bg-[#F8FAFC] dark:bg-[#111827] hover:border-[#2563EB] dark:hover:border-[#60A5FA] transition text-xs font-semibold text-[#0F172A] dark:text-[#F8FAFC]"
              >
                <span className="truncate">{item.label}</span>
                <span className="shrink-0 text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-[#2563EB] dark:text-[#60A5FA]">
                  {item.tag}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

'use client';

import React from 'react';
import Link from 'next/link';
import {
  FileText,
  ScanLine,
  Image as ImageIcon,
  PenTool,
  ArrowRight,
  Combine,
  Split,
  Hash,
  Stamp,
  Layers,
  Minimize2,
  FileCheck,
} from 'lucide-react';

export function CapabilitiesSection() {
  const groups = [
    {
      category: 'PDF and Documents',
      description: 'Convert, merge, split, and organize standard documents with full layout preservation.',
      icon: FileText,
      tools: [
        { name: 'PDF to Word Converter', href: '/pdf/pdf-to-word', note: 'Native DOCX' },
        { name: 'Merge PDF Pages', href: '/pdf/merge-pdf', note: 'Sequence control' },
        { name: 'Split & Extract Pages', href: '/pdf/split-pdf', note: 'Page ranges' },
        { name: 'Add Page Numbers', href: '/pdf/page-numbers', note: 'Page X of Y' },
      ],
    },
    {
      category: 'Images and Media',
      description: 'Prepare, convert, compress and crop digital imagery without server latency.',
      icon: ImageIcon,
      tools: [
        { name: 'Image Format Converter', href: '/image-converter', note: 'PNG, JPG, SVG' },
        { name: 'Lossless WebP & AVIF', href: '/image-tools', note: 'Up to 85% smaller' },
        { name: 'EXIF Metadata Stripper', href: '/image-tools', note: 'Privacy sanitization' },
        { name: 'Passport Photo Framing', href: '/image-tools', note: 'Standard biometric' },
      ],
    },
    {
      category: 'Scanning and Enhancement',
      description: 'Turn digital files into convincing physical paperwork with authentic scanner artifacts.',
      icon: ScanLine,
      tools: [
        { name: 'Scan Effect Simulator', href: '/scan-studio', note: 'Tilt & noise' },
        { name: 'Attestation Stamps', href: '/scan-studio', note: 'Official seals' },
        { name: 'Paper Noise & Shading', href: '/scan-studio', note: '150/300 PPI' },
        { name: 'Document Metadata Editor', href: '/scan-studio', note: 'PDF properties' },
      ],
    },
    {
      category: 'Editing and Annotation',
      description: 'Make direct changes to document pages with layered Acrobat-grade precision.',
      icon: PenTool,
      tools: [
        { name: 'Interactive PDF Editor', href: '/tools/pdf-editor', note: 'Direct canvas' },
        { name: 'Digital Signatures', href: '/pdf/sign-pdf', note: 'Vector ink' },
        { name: 'Watermark & Branding', href: '/pdf/watermark-pdf', note: 'Draft/Confidential' },
        { name: 'Multi-Document Assembler', href: '/tools/pdf-assembler', note: 'Binder workspace' },
      ],
    },
  ];

  return (
    <section className="w-full py-24 px-4 sm:px-6 lg:px-8 bg-[#F7F8FA] dark:bg-[#0E121B] border-t border-[#E9EBF0] dark:border-[#222632] transition-colors">
      <div className="max-w-7xl mx-auto flex flex-col gap-14">
        {/* Section Heading */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="max-w-2xl">
            <span className="text-xs font-semibold text-[#536BCE] uppercase tracking-wider block mb-2">
              Capabilities
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#20232B] dark:text-[#F8FAFC] tracking-tight leading-tight">
              Everything you need. Nothing you don't.
            </h2>
            <p className="text-base sm:text-lg text-[#727783] dark:text-[#9DA3AE] mt-3 leading-relaxed">
              Carefully engineered document tools organized by task. Direct access to every working feature.
            </p>
          </div>

          <Link
            href="/pdf"
            className="inline-flex items-center gap-2 text-sm font-bold text-[#536BCE] dark:text-[#93A5F5] hover:underline shrink-0 group"
          >
            <span>View all 24 tools</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {/* 4 Editorial Capability Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {groups.map((group) => {
            const Icon = group.icon;
            return (
              <div
                key={group.category}
                className="p-8 rounded-3xl bg-white dark:bg-[#141824] border border-[#E9EBF0] dark:border-[#242B3E] shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-[#EDF0FF] dark:bg-[#536BCE]/20 flex items-center justify-center text-[#536BCE] dark:text-[#93A5F5]">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="text-xl font-bold text-[#20232B] dark:text-[#F8FAFC]">
                      {group.category}
                    </h3>
                  </div>

                  <p className="text-xs sm:text-sm text-[#727783] dark:text-[#9DA3AE] leading-relaxed mb-6">
                    {group.description}
                  </p>

                  <div className="flex flex-col divide-y divide-[#E9EBF0] dark:divide-[#242B3E]">
                    {group.tools.map((tool) => (
                      <Link
                        key={tool.name}
                        href={tool.href}
                        className="py-3 flex items-center justify-between text-sm group hover:text-[#536BCE] transition"
                      >
                        <span className="font-medium text-[#20232B] dark:text-[#F8FAFC] group-hover:text-[#536BCE] transition">
                          {tool.name}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-mono text-[#727783] dark:text-[#9DA3AE]">
                            {tool.note}
                          </span>
                          <ArrowRight className="w-3.5 h-3.5 text-[#727783] group-hover:text-[#536BCE] transition-transform group-hover:translate-x-1" />
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

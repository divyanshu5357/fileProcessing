'use client';

import React from 'react';
import Link from 'next/link';
import { MotionConfig, motion, useReducedMotion } from 'framer-motion';
import {
  PenTool,
  ImageDown,
  FileImage,
  Minimize2,
  FileText,
  ScanLine,
} from 'lucide-react';

interface HeroTaskPill {
  label: string;
  href: string;
  title: string;
  iconName: 'pen' | 'reduce' | 'jpg' | 'compress' | 'word' | 'scan';
}

const HERO_TASK_PILLS: HeroTaskPill[] = [
  {
    label: 'Edit PDF Free',
    href: '/tools/pdf-editor',
    title: 'Free Online PDF Editor Without Watermark',
    iconName: 'pen',
  },
  {
    label: 'Resize Photo to 20KB–100KB',
    href: '/tools/image-size-reducer',
    title: 'Reduce Image Size in KB for Exam & Government Forms',
    iconName: 'reduce',
  },
  {
    label: 'JPG to PDF',
    href: '/pdf/jpg-to-pdf',
    title: 'JPG to PDF & PNG to PDF Converter',
    iconName: 'jpg',
  },
  {
    label: 'Compress PDF',
    href: '/pdf/compress-pdf',
    title: 'Compress PDF File Size Without Losing Quality',
    iconName: 'compress',
  },
  {
    label: 'PDF to Word',
    href: '/pdf/pdf-to-word',
    title: 'Convert PDF to Editable Word DOCX',
    iconName: 'word',
  },
  {
    label: 'Scan Studio',
    href: '/scan-studio',
    title: 'Scan Effect Simulator (Scan Studio FX)',
    iconName: 'scan',
  },
];

function renderPillIcon(iconName: HeroTaskPill['iconName']) {
  switch (iconName) {
    case 'pen':
      return <PenTool className="w-3.5 h-3.5 text-[#3B50B2] dark:text-[#93A5F5]" />;
    case 'reduce':
      return <ImageDown className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />;
    case 'jpg':
      return <FileImage className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />;
    case 'compress':
      return <Minimize2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />;
    case 'word':
      return <FileText className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />;
    case 'scan':
      return <ScanLine className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />;
  }
}

export function HeroTaskPills() {
  const prefersReduced = useReducedMotion();

  return (
    <MotionConfig reducedMotion="user">
      <nav
        aria-label="Popular Document and Image Tasks"
        className="flex flex-wrap items-center justify-center gap-2.5 pt-2 max-w-4xl"
      >
        {HERO_TASK_PILLS.map((pill, index) => (
          <motion.div
            key={pill.href}
            initial={prefersReduced ? false : { y: 6 }}
            animate={{ y: 0 }}
            transition={{
              delay: index * 0.04,
              type: 'spring',
              stiffness: 420,
              damping: 26,
            }}
            whileHover={prefersReduced ? undefined : { y: -2, scale: 1.03 }}
            whileTap={prefersReduced ? undefined : { scale: 0.98 }}
            className="will-change-transform"
          >
            <Link
              href={pill.href}
              title={pill.title}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#F7F8FA] dark:bg-[#151926] border border-[#E2E6F0] dark:border-[#28314A] text-[#20232B] dark:text-[#E2E8F0] hover:border-[#3B50B2] dark:hover:border-[#93A5F5] hover:text-[#3B50B2] dark:hover:text-[#93A5F5] shadow-2xs transition-colors"
            >
              {renderPillIcon(pill.iconName)}
              <span>{pill.label}</span>
            </Link>
          </motion.div>
        ))}
      </nav>
    </MotionConfig>
  );
}

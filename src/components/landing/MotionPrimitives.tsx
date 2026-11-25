'use client';

import React, { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MotionConfig, motion, useReducedMotion } from 'framer-motion';
import { UploadCloud, ShieldCheck, AlertCircle, FileUp } from 'lucide-react';
import { fileTransferService } from '@/lib/fileTransferService';

interface HeroDropzoneSurfaceProps {
  children: React.ReactNode;
}

const ACCEPTED_IMAGE_EXTS = ['.jpg', '.jpeg', '.png', '.webp'];

function classifyDroppedFile(file: File): 'pdf' | 'image' | null {
  const lower = file.name.toLowerCase();
  if (file.type === 'application/pdf' || lower.endsWith('.pdf')) return 'pdf';
  if (
    file.type === 'image/jpeg' ||
    file.type === 'image/png' ||
    file.type === 'image/webp' ||
    ACCEPTED_IMAGE_EXTS.some((ext) => lower.endsWith(ext))
  ) {
    return 'image';
  }
  return null;
}

export function HeroDropzoneSurface({ children }: HeroDropzoneSurfaceProps) {
  const router = useRouter();
  const prefersReduced = useReducedMotion();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounterRef = useRef(0);

  const [isDragging, setIsDragging] = useState(false);
  const [dropError, setDropError] = useState<string | null>(null);
  const [routingLabel, setRoutingLabel] = useState<string | null>(null);

  const handleIncomingFile = (file: File | undefined) => {
    if (!file) return;
    const kind = classifyDroppedFile(file);
    if (!kind) {
      setDropError('Unsupported file type. Drop a .pdf, .jpg, .png, or .webp file.');
      return;
    }

    setDropError(null);
    if (kind === 'pdf') {
      setRoutingLabel(`Opening ${file.name} in Online PDF Editor...`);
      fileTransferService.setPendingFile(file, 'pdf-editor');
      router.push('/tools/pdf-editor');
    } else {
      setRoutingLabel(`Opening ${file.name} in KB Image Size Reducer...`);
      fileTransferService.setPendingFile(file, 'compress-image');
      router.push('/tools/image-size-reducer');
    }
  };

  return (
    <MotionConfig reducedMotion="user">
      <div className="w-full max-w-5xl mx-auto">
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp"
          className="sr-only"
          aria-label="Drop or select a PDF, JPG, PNG, or WebP file"
          onChange={(e) => {
            handleIncomingFile(e.target.files?.[0]);
            e.target.value = '';
          }}
        />

        {/* Quick Drop / Browse Strip above the interactive workspace window */}
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 px-1">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#F7F8FA] dark:bg-[#151926] border border-[#E2E6F0] dark:border-[#28314A] hover:border-emerald-500/70 dark:hover:border-emerald-400/70 text-xs font-semibold text-[#20232B] dark:text-[#F8FAFC] transition shadow-2xs"
          >
            <FileUp className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Drop or upload PDF / JPG / PNG / WebP here</span>
          </button>

          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[#4E5360] dark:text-[#9DA3AE]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>
              {routingLabel ?? 'Instant client-memory routing • PDFs → Editor • Photos → KB Reducer'}
            </span>
          </span>
        </div>

        {dropError && (
          <div
            role="alert"
            className="mb-3 px-3.5 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs font-medium text-rose-700 dark:text-rose-300 flex items-center gap-2"
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{dropError}</span>
          </div>
        )}

        <motion.div
          onDragEnter={(e) => {
            e.preventDefault();
            e.stopPropagation();
            dragCounterRef.current += 1;
            setIsDragging(true);
            setDropError(null);
          }}
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            e.stopPropagation();
            dragCounterRef.current = Math.max(0, dragCounterRef.current - 1);
            if (dragCounterRef.current === 0) setIsDragging(false);
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            dragCounterRef.current = 0;
            setIsDragging(false);
            handleIncomingFile(e.dataTransfer.files?.[0]);
          }}
          animate={{
            scale: !prefersReduced && isDragging ? 1.01 : 1,
          }}
          transition={{ type: 'spring', stiffness: 360, damping: 28 }}
          className={`relative rounded-2xl transition-shadow duration-200 will-change-transform ${
            isDragging
              ? 'ring-2 ring-emerald-500 shadow-[0_0_40px_-6px_rgba(16,185,129,0.55)] dark:shadow-[0_0_44px_-6px_rgba(52,211,153,0.45)]'
              : ''
          }`}
        >
          {children}

          {/* Emerald Magnetic Dropzone Overlay */}
          {isDragging && (
            <motion.div
              initial={prefersReduced ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-30 rounded-2xl bg-emerald-950/75 backdrop-blur-xs border-2 border-dashed border-emerald-400 flex flex-col items-center justify-center p-6 text-center pointer-events-none"
            >
              <motion.div
                animate={prefersReduced ? undefined : { y: [-3, 3, -3] }}
                transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
                className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-400/60 flex items-center justify-center mb-3"
              >
                <UploadCloud className="w-7 h-7 text-emerald-300" />
              </motion.div>
              <p className="text-base sm:text-lg font-bold text-white">
                Release to open directly in browser memory
              </p>
              <p className="text-xs sm:text-sm text-emerald-200 mt-1">
                PDF files route to Online PDF Editor • JPG / PNG / WebP route to Image Size Reducer
              </p>
            </motion.div>
          )}
        </motion.div>
      </div>
    </MotionConfig>
  );
}

export function AnimatedSignatureSvg({
  className = 'w-28 h-7 text-[#3B50B2] dark:text-[#93A5F5]',
}: {
  className?: string;
}) {
  const prefersReduced = useReducedMotion();

  return (
    <MotionConfig reducedMotion="user">
      <svg
        viewBox="0 0 180 44"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Animated digital signature stroke"
        className={className}
      >
        <motion.path
          d="M10 31 C16 14, 24 8, 28 24 C30 33, 35 12, 44 18 C49 21, 47 30, 56 26 C64 23, 72 13, 78 24 C81 30, 88 18, 97 23 C105 27, 114 15, 121 24 C127 31, 138 19, 152 22 C160 24, 166 22, 171 20"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={prefersReduced ? false : { pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 1.35, ease: 'easeInOut' }}
        />
        <motion.path
          d="M14 37 C58 33, 112 31, 164 34"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
          initial={prefersReduced ? false : { pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7, delay: 0.85, ease: 'easeOut' }}
        />
      </svg>
    </MotionConfig>
  );
}

export function ScanLaserBeam({ tone = 'emerald' }: { tone?: 'emerald' | 'blue' }) {
  const prefersReduced = useReducedMotion();
  if (prefersReduced) return null;

  const glowClass =
    tone === 'emerald'
      ? 'via-emerald-400 shadow-[0_0_12px_2px_rgba(16,185,129,0.75)]'
      : 'via-sky-400 shadow-[0_0_12px_2px_rgba(56,189,248,0.75)]';
  const washClass =
    tone === 'emerald' ? 'from-emerald-400/20' : 'from-sky-400/20';

  return (
    <motion.div
      aria-hidden="true"
      initial={{ top: '4%' }}
      animate={{ top: ['4%', '92%', '4%'] }}
      transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
      className="absolute left-0 right-0 z-20 pointer-events-none"
    >
      <div className={`h-0.5 w-full bg-gradient-to-r from-transparent ${glowClass} to-transparent`} />
      <div className={`h-5 w-full bg-gradient-to-b ${washClass} to-transparent`} />
    </motion.div>
  );
}

export function ScanTiltCard({
  baseAngle = 0,
  className,
  style,
  children,
}: {
  baseAngle?: number;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}) {
  const prefersReduced = useReducedMotion();

  return (
    <MotionConfig reducedMotion="user">
      <motion.div
        animate={{ rotate: baseAngle }}
        whileHover={
          prefersReduced
            ? undefined
            : {
                rotate: baseAngle >= 0 ? baseAngle + 0.5 : baseAngle - 0.5,
                scale: 1.01,
              }
        }
        transition={{ type: 'spring', stiffness: 300, damping: 24 }}
        className={className}
        style={style}
      >
        {children}
      </motion.div>
    </MotionConfig>
  );
}

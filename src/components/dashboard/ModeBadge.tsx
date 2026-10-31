'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  ShieldCheck,
  Cloud,
  Cpu,
  ChevronDown,
  Check,
  Zap,
} from 'lucide-react';
import { useAuth, ProcessingMode } from '@/context/AuthContext';

export function ModeBadge() {
  const { processingMode, setProcessingMode, isAuthenticated, openAuthModal } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectMode = (mode: ProcessingMode) => {
    if (mode === 'cloud' && !isAuthenticated) {
      openAuthModal();
      setIsOpen(false);
      return;
    }
    setProcessingMode(mode);
    setIsOpen(false);
  };

  const getBadgeDetails = () => {
    switch (processingMode) {
      case 'local':
        return {
          icon: ShieldCheck,
          label: 'Local (In-Browser)',
          color: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700/60',
          dot: 'bg-emerald-500',
        };
      case 'cloud':
        return {
          icon: Cloud,
          label: 'Cloud SaaS (S3+Celery)',
          color: 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700/60',
          dot: 'bg-blue-500',
        };
      case 'auto':
      default:
        return {
          icon: Zap,
          label: 'Auto (Smart Route)',
          color: 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-700/60',
          dot: 'bg-indigo-500',
        };
    }
  };

  const current = getBadgeDetails();
  const IconComp = current.icon;

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border text-xs font-semibold transition-all shadow-2xs cursor-pointer ${current.color}`}
        title="Change file processing pipeline (Local vs Cloud S3)"
      >
        <span className={`w-2 h-2 rounded-full ${current.dot} animate-pulse`} />
        <IconComp className="w-3.5 h-3.5" />
        <span className="truncate max-w-[130px] sm:max-w-none text-[11px] font-bold">
          {current.label}
        </span>
        <ChevronDown className="w-3 h-3 opacity-70 ml-0.5" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-white dark:bg-[#111827] border border-[#CBD5E1] dark:border-[#334155] shadow-xl p-2 z-50 animate-fade-in text-xs">
          <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
            <p className="font-bold text-slate-900 dark:text-slate-100">Processing Engine</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Choose where your image and document conversions execute.
            </p>
          </div>

          <div className="p-1 space-y-1 mt-1">
            {/* Auto Mode */}
            <button
              type="button"
              onClick={() => handleSelectMode('auto')}
              className={`w-full flex items-start gap-2.5 p-2 rounded-xl text-left transition ${
                processingMode === 'auto'
                  ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-900 dark:text-indigo-200'
                  : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              <Zap className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs">Automatic (Recommended)</span>
                  {processingMode === 'auto' && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                  Uses client-side memory for &lt;25MB and offloads heavy PDFs to Celery workers.
                </p>
              </div>
            </button>

            {/* Local Mode */}
            <button
              type="button"
              onClick={() => handleSelectMode('local')}
              className={`w-full flex items-start gap-2.5 p-2 rounded-xl text-left transition ${
                processingMode === 'local'
                  ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-200'
                  : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs">100% Local (Private)</span>
                  {processingMode === 'local' && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                  Zero server uploads. Entirely in-memory web workers. No login needed.
                </p>
              </div>
            </button>

            {/* Cloud Mode */}
            <button
              type="button"
              onClick={() => handleSelectMode('cloud')}
              className={`w-full flex items-start gap-2.5 p-2 rounded-xl text-left transition ${
                processingMode === 'cloud'
                  ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-900 dark:text-blue-200'
                  : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              <Cloud className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs">Cloud SaaS Mode</span>
                  {processingMode === 'cloud' && <Check className="w-3.5 h-3.5 text-blue-600" />}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                  Fast S3 multipart uploads, background Celery queue, persistent file history.
                </p>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

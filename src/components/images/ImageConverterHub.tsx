'use client';

import React from 'react';
import { PdfToolId } from '@/types/document';
import { ALL_PDF_TOOLS } from '@/lib/toolRegistry';
import { ConversionCard } from '../pdf/ConversionCard';
import {
  Image as ImageIcon,
  Sparkles,
  ArrowRight,
  Layers,
  Wand2,
  Minimize2,
  Crop,
  Shield,
  Palette,
} from 'lucide-react';
import { Button } from '../ui/Button';

interface ImageConverterHubProps {
  onSelectPdfTool: (toolId: PdfToolId) => void;
  onSwitchToImageWorkbench: (toolId?: string) => void;
}

export function ImageConverterHub({
  onSelectPdfTool,
  onSwitchToImageWorkbench,
}: ImageConverterHubProps) {
  const imageConversionTools = ALL_PDF_TOOLS.filter((t) =>
    ['jpg-to-pdf', 'pdf-to-jpg', 'extract-images'].includes(t.id)
  );

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-10 flex flex-col gap-10">
      {/* Header */}
      <div className="flex flex-col items-center text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-[#2563EB] dark:text-[#60A5FA] text-xs font-bold mb-3 shadow-xs">
          <ImageIcon className="w-3.5 h-3.5" />
          <span>Image Transformation Hub</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-black text-[#0F172A] dark:text-[#F8FAFC] tracking-tight">
          Image Converter & Utilities
        </h1>

        <p className="text-xs sm:text-sm text-[#334155] dark:text-[#CBD5E1] mt-2 font-normal">
          Convert images between PDF, JPG, PNG, WebP, AVIF, and SVG. Re-encode formats with zero server uploads.
        </p>
      </div>

      {/* Featured Document & Image Conversion Tools */}
      <div className="flex flex-col gap-4">
        <h3 className="text-base font-bold text-[#0F172A] dark:text-[#F8FAFC]">
          Image & PDF Bridges
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {imageConversionTools.map((tool) => (
            <ConversionCard
              key={tool.id}
              tool={tool}
              onClick={() => onSelectPdfTool(tool.id)}
            />
          ))}
        </div>
      </div>

      {/* Quick Launch Cards to PixelKit's Existing Image Studio */}
      <div className="flex flex-col gap-4 pt-6 border-t border-[#CBD5E1] dark:border-[#334155]">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-[#0F172A] dark:text-[#F8FAFC]">
            Advanced Image Editing & Studio Tools
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onSwitchToImageWorkbench()}
            className="text-xs text-[#2563EB] dark:text-[#60A5FA] font-bold"
          >
            Open Full Workbench <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              id: 'compress',
              name: 'Image Compressor',
              desc: 'Adaptive WebP & JPEG compression with live before/after slider.',
              icon: Minimize2,
              color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800',
            },
            {
              id: 'convert',
              name: 'Multi-Format Re-encoder',
              desc: 'Convert transparent PNGs to WebP, JPEG, AVIF, or SVG.',
              icon: Wand2,
              color: 'text-purple-500 bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800',
            },
            {
              id: 'crop',
              name: 'Aspect Ratio Cropper',
              desc: 'Crop to 1:1, 16:9, round avatars, and social platform bounds.',
              icon: Crop,
              color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800',
            },
            {
              id: 'passport',
              name: 'Passport Photo Studio',
              desc: 'ICAO biometric guides & 4x6" print sheet generation.',
              icon: Shield,
              color: 'text-orange-500 bg-orange-50 dark:bg-orange-950/40 border-orange-200 dark:border-orange-800',
            },
          ].map((item) => {
            const IconComp = item.icon;
            return (
              <div
                key={item.id}
                onClick={() => onSwitchToImageWorkbench(item.id)}
                className="p-5 bg-white dark:bg-[#111827] border border-[#CBD5E1] dark:border-[#334155] rounded-2xl hover:border-[#2563EB] dark:hover:border-[#3B82F6] hover:shadow-md transition-all cursor-pointer flex flex-col justify-between select-none"
              >
                <div>
                  <div className={`w-10 h-10 rounded-xl border flex items-center justify-center mb-3 ${item.color}`}>
                    <IconComp className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-bold text-[#0F172A] dark:text-[#F8FAFC]">
                    {item.name}
                  </h4>
                  <p className="text-xs text-[#475569] dark:text-[#CBD5E1] mt-1 font-normal">
                    {item.desc}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-[#2563EB] dark:text-[#60A5FA] font-bold">
                  <span>Launch Editor</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

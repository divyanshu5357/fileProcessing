'use client';

import React, { useState } from 'react';
import { ToolDefinition, PdfToolId } from '@/types/document';
import { ALL_PDF_TOOLS } from '@/lib/toolRegistry';
import { ConversionCard } from '../pdf/ConversionCard';
import {
  FileText,
  FileSpreadsheet,
  Presentation,
  Code,
  Sparkles,
  ArrowRight,
  Filter,
} from 'lucide-react';

interface DocumentConverterHubProps {
  onSelectTool: (toolId: PdfToolId) => void;
}

export function DocumentConverterHub({ onSelectTool }: DocumentConverterHubProps) {
  const [filterFormat, setFilterFormat] = useState<string>('all');

  const docToolIds: PdfToolId[] = [
    'word-to-pdf',
    'excel-to-pdf',
    'powerpoint-to-pdf',
    'html-to-pdf',
    'pdf-to-word',
    'pdf-to-excel',
    'pdf-to-powerpoint',
    'pdf-to-text',
    'pdf-to-pdfa',
  ];

  const docTools = ALL_PDF_TOOLS.filter((t) => docToolIds.includes(t.id));

  const filteredTools =
    filterFormat === 'all'
      ? docTools
      : docTools.filter((t) =>
          t.fromFormat.toLowerCase().includes(filterFormat) ||
          t.toFormat.toLowerCase().includes(filterFormat)
        );

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-10 flex flex-col gap-10">
      {/* Header */}
      <div className="flex flex-col items-center text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-[#2563EB] dark:text-[#60A5FA] text-xs font-bold mb-3 shadow-xs">
          <FileText className="w-3.5 h-3.5" />
          <span>Office & Document Hub</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-black text-[#0F172A] dark:text-[#F8FAFC] tracking-tight">
          Document Converter
        </h1>

        <p className="text-xs sm:text-sm text-[#334155] dark:text-[#CBD5E1] mt-2 font-normal">
          Convert Word, Excel, PowerPoint, HTML, and PDF documents into editable and printable formats.
        </p>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 mt-6">
          {[
            { id: 'all', label: 'All Documents' },
            { id: 'docx', label: 'Word (.docx)' },
            { id: 'xlsx', label: 'Excel (.xlsx)' },
            { id: 'pptx', label: 'PowerPoint (.pptx)' },
            { id: 'html', label: 'HTML / Web' },
            { id: 'pdf', label: 'PDF Conversions' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setFilterFormat(item.id)}
              className={`text-xs px-3.5 py-1.5 rounded-full font-semibold transition-all cursor-pointer ${
                filterFormat === item.id
                  ? 'bg-[#2563EB] text-white shadow-xs'
                  : 'bg-white dark:bg-[#1E293B] text-[#334155] dark:text-[#CBD5E1] border border-[#CBD5E1] dark:border-[#475569] hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Tools */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredTools.map((tool) => (
          <ConversionCard
            key={tool.id}
            tool={tool}
            onClick={() => onSelectTool(tool.id)}
          />
        ))}
      </div>
    </div>
  );
}

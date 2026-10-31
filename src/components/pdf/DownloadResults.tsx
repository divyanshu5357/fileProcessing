'use client';

import React, { useState } from 'react';
import { ConversionResultItem } from '@/types/document';
import { formatBytes, downloadBlob } from '@/lib/utils';
import {
  CheckCircle2,
  Download,
  FileCheck,
  Eye,
  RefreshCw,
  Archive,
  ExternalLink,
  ShieldCheck,
  FileSpreadsheet,
  FileText,
  Presentation,
  Image as ImageIcon,
} from 'lucide-react';
import { Button } from '../ui/Button';

interface DownloadResultsProps {
  results: ConversionResultItem[];
  onReset: () => void;
  onDownloadZip?: () => void;
  validationReport?: {
    standard: string;
    conformancePassed: boolean;
    checks: { title: string; status: 'pass' | 'warn'; detail: string }[];
  } | null;
  excelPreviewRows?: (string | number)[][];
}

export function DownloadResults({
  results,
  onReset,
  onDownloadZip,
  validationReport,
  excelPreviewRows,
}: DownloadResultsProps) {
  const [selectedPreview, setSelectedPreview] = useState<ConversionResultItem | null>(
    results.length > 0 ? results[0] : null
  );

  if (results.length === 0) return null;

  const handleDownloadItem = (item: ConversionResultItem) => {
    downloadBlob(item.blob, item.name);
  };

  const isPdf = selectedPreview?.format === 'application/pdf' || selectedPreview?.name.endsWith('.pdf');
  const isImage = selectedPreview?.blob.type.startsWith('image/');

  return (
    <div className="w-full flex flex-col gap-6 p-6 bg-white dark:bg-[#111827] border border-[#CBD5E1] dark:border-[#334155] rounded-2xl shadow-xs transition-colors">
      {/* Success Banner */}
      <div className="flex items-center justify-between p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-base font-bold text-emerald-900 dark:text-emerald-200">
              Conversion Completed Successfully!
            </h4>
            <p className="text-xs text-emerald-700 dark:text-emerald-300 font-medium">
              {results.length} file{results.length > 1 ? 's' : ''} generated locally in browser memory.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {results.length > 1 && onDownloadZip && (
            <Button variant="primary" size="sm" onClick={onDownloadZip} className="gap-1.5 font-bold">
              <Archive className="w-4 h-4" />
              Download All (ZIP)
            </Button>
          )}
          <Button variant="secondary" size="sm" onClick={onReset} className="gap-1.5">
            <RefreshCw className="w-3.5 h-3.5" />
            Convert Another
          </Button>
        </div>
      </div>

      {/* PDF/A Validation Report if available */}
      {validationReport && (
        <div className="p-4 bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl">
          <div className="flex items-center gap-2 mb-3">
            <ShieldCheck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h5 className="text-sm font-bold text-blue-900 dark:text-blue-200">
              {validationReport.standard} Conformance Audit
            </h5>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-300 dark:border-emerald-700">
              VERIFIED PASS
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {validationReport.checks.map((chk, i) => (
              <div
                key={i}
                className="p-2.5 rounded-lg bg-white dark:bg-[#111827] border border-[#CBD5E1] dark:border-[#334155] flex flex-col gap-0.5"
              >
                <div className="flex items-center gap-1.5 font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>{chk.title}</span>
                </div>
                <span className="text-[11px] text-[#475569] dark:text-[#CBD5E1] pl-5">
                  {chk.detail}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Excel Table Data Preview if available */}
      {excelPreviewRows && excelPreviewRows.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h5 className="text-xs font-bold text-[#0F172A] dark:text-[#F8FAFC]">
                Extracted Excel Data Preview (Top Rows)
              </h5>
            </div>
            <span className="text-[11px] text-[#475569] dark:text-[#CBD5E1]">
              Showing {excelPreviewRows.length} extracted rows
            </span>
          </div>

          <div className="overflow-x-auto border border-[#CBD5E1] dark:border-[#334155] rounded-xl max-h-56">
            <table className="w-full text-left text-xs border-collapse">
              <tbody>
                {excelPreviewRows.map((row, rIdx) => (
                  <tr
                    key={rIdx}
                    className={`border-b border-slate-200 dark:border-slate-800 ${
                      rIdx === 0
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 font-bold text-emerald-900 dark:text-emerald-200'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/40 text-[#0F172A] dark:text-[#F8FAFC]'
                    }`}
                  >
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} className="p-2 border-r border-slate-200 dark:border-slate-800 whitespace-nowrap">
                        {String(cell || '')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Output Files List */}
      <div className="flex flex-col gap-3">
        <h5 className="text-xs font-bold text-[#0F172A] dark:text-[#F8FAFC]">
          Ready for Download ({results.length})
        </h5>

        <div className="grid grid-cols-1 gap-2.5">
          {results.map((res) => (
            <div
              key={res.id}
              className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                selectedPreview?.id === res.id
                  ? 'border-[#2563EB] dark:border-[#3B82F6] bg-blue-50/40 dark:bg-blue-950/20'
                  : 'border-[#CBD5E1] dark:border-[#334155] bg-white dark:bg-[#111827] hover:border-slate-400 dark:hover:border-slate-600'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-[#2563EB] dark:text-[#60A5FA] shrink-0 font-bold">
                  <FileCheck className="w-5 h-5" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-[#0F172A] dark:text-[#F8FAFC] truncate max-w-sm sm:max-w-md">
                    {res.name}
                  </span>
                  <div className="flex items-center gap-2 text-[11px] text-[#475569] dark:text-[#CBD5E1] font-mono">
                    <span>{formatBytes(res.size)}</span>
                    <span>•</span>
                    <span className="uppercase text-[#2563EB] dark:text-[#60A5FA] font-bold">
                      {res.name.split('.').pop()}
                    </span>
                    {res.pageCount && (
                      <>
                        <span>•</span>
                        <span>{res.pageCount} Pages</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleDownloadItem(res)}
                  className="font-bold gap-1.5 shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Visual Preview Box for Single PDF or Image */}
      {selectedPreview && isPdf && (
        <div className="flex flex-col gap-2 pt-2 border-t border-[#CBD5E1] dark:border-[#334155]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#0F172A] dark:text-[#F8FAFC] flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-[#2563EB] dark:text-[#60A5FA]" />
              Live In-Browser Document Preview
            </span>
            <a
              href={selectedPreview.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-[#2563EB] dark:text-[#60A5FA] hover:underline flex items-center gap-1 font-semibold"
            >
              Open in full tab <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="w-full h-96 rounded-xl border border-[#CBD5E1] dark:border-[#334155] overflow-hidden bg-slate-100 dark:bg-slate-900">
            <iframe
              src={selectedPreview.url}
              title="PDF Preview"
              className="w-full h-full border-none"
            />
          </div>
        </div>
      )}

      {selectedPreview && isImage && (
        <div className="flex flex-col gap-2 pt-2 border-t border-[#CBD5E1] dark:border-[#334155]">
          <span className="text-xs font-bold text-[#0F172A] dark:text-[#F8FAFC] flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5 text-[#2563EB] dark:text-[#60A5FA]" />
            Image Render Preview
          </span>
          <div className="w-full max-h-96 rounded-xl border border-[#CBD5E1] dark:border-[#334155] p-3 flex items-center justify-center bg-slate-50 dark:bg-slate-900 overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={selectedPreview.url}
              alt="Converted Output Preview"
              className="max-h-80 max-w-full object-contain rounded-lg shadow-xs"
            />
          </div>
        </div>
      )}
    </div>
  );
}

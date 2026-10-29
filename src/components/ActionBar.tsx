import React, { useState } from 'react';
import { ImageItem, ToolId } from '@/types';
import { Button } from './ui/Button';
import {
  Download,
  Copy,
  Archive,
  FileText,
  RotateCcw,
  Check,
} from 'lucide-react';
import { copyBlobToClipboard } from '@/lib/utils';

interface ActionBarProps {
  activeImage: ImageItem | null;
  activeTool: ToolId;
  queueCount: number;
  onDownloadSingle: () => void;
  onDownloadZip: () => void;
  onExportPdf: () => void;
  onResetOriginal: () => void;
  onToast: (title: string, desc?: string) => void;
  isProcessing: boolean;
}

export function ActionBar({
  activeImage,
  activeTool,
  queueCount,
  onDownloadSingle,
  onDownloadZip,
  onExportPdf,
  onResetOriginal,
  onToast,
  isProcessing,
}: ActionBarProps) {
  const [copied, setCopied] = useState(false);

  if (!activeImage) return null;

  const hasProcessed = Boolean(activeImage.processedBlob);

  const handleCopyClipboard = async () => {
    const targetBlob = activeImage.processedBlob || activeImage.file;
    const ok = await copyBlobToClipboard(targetBlob);
    if (ok) {
      setCopied(true);
      onToast('Copied to Clipboard!', 'Image is ready to paste into documents or apps');
      setTimeout(() => setCopied(false), 2000);
    } else {
      onToast('Copy failed', 'Please use the download button');
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white dark:bg-[#111827] rounded-2xl border border-[#CBD5E1] dark:border-[#334155] shadow-xs transition-colors">
      <div className="flex items-center gap-2.5 flex-wrap">
        {/* Primary Download Button */}
        <Button
          variant="primary"
          size="md"
          onClick={onDownloadSingle}
          disabled={!hasProcessed && !activeImage.file}
          isLoading={isProcessing}
        >
          <Download className="w-4 h-4 mr-1.5" />
          {hasProcessed ? 'Download Processed Image' : 'Download Original'}
        </Button>

        {/* Copy to Clipboard */}
        <Button
          variant="secondary"
          size="md"
          onClick={handleCopyClipboard}
          disabled={isProcessing}
        >
          {copied ? (
            <Check className="w-4 h-4 mr-1.5 text-[#15803D] dark:text-[#4ADE80]" />
          ) : (
            <Copy className="w-4 h-4 mr-1.5" />
          )}
          {copied ? 'Copied to Clipboard' : 'Copy to Clipboard'}
        </Button>

        {/* PDF export for passport photos */}
        {activeTool === 'passport' && (
          <Button
            variant="outline"
            size="md"
            onClick={onExportPdf}
            disabled={isProcessing}
          >
            <FileText className="w-4 h-4 mr-1.5 text-[#2563EB] dark:text-[#60A5FA]" />
            Export as PDF
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {queueCount > 1 && (
          <Button
            variant="secondary"
            size="md"
            onClick={onDownloadZip}
            isLoading={isProcessing}
          >
            <Archive className="w-4 h-4 mr-1.5 text-[#B45309] dark:text-[#FBBF24]" />
            Download All as ZIP ({queueCount} images)
          </Button>
        )}

        {hasProcessed && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onResetOriginal}
            className="text-[#64748B] hover:text-[#0F172A] dark:text-[#94A3B8] dark:hover:text-[#F8FAFC]"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1" />
            Reset to Original
          </Button>
        )}
      </div>
    </div>
  );
}

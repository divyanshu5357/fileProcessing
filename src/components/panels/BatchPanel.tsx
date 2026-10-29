import React, { useState } from 'react';
import { ImageItem } from '@/types';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import {
  Layers,
  Archive,
  Zap,
  RefreshCw,
  Maximize2,
  Trash2,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { formatBytes } from '@/lib/utils';

interface BatchPanelProps {
  queue: ImageItem[];
  onBatchCompress: (quality: number) => Promise<void>;
  onBatchConvert: (format: string) => Promise<void>;
  onBatchResize: (maxWidth: number) => Promise<void>;
  onBatchStripMetadata: () => Promise<void>;
  onDownloadZip: () => Promise<void>;
  isProcessing: boolean;
  onClearQueue: () => void;
}

export function BatchPanel({
  queue,
  onBatchCompress,
  onBatchConvert,
  onBatchResize,
  onBatchStripMetadata,
  onDownloadZip,
  isProcessing,
  onClearQueue,
}: BatchPanelProps) {
  const [selectedAction, setSelectedAction] = useState<
    'compress' | 'convert' | 'resize' | 'metadata'
  >('compress');
  const [batchQuality, setBatchQuality] = useState(80);
  const [batchFormat, setBatchFormat] = useState('image/webp');
  const [batchMaxWidth, setBatchMaxWidth] = useState(1920);

  const processedCount = queue.filter((item) => item.processedBlob !== null).length;

  const handleExecuteBatch = async () => {
    if (selectedAction === 'compress') {
      await onBatchCompress(batchQuality);
    } else if (selectedAction === 'convert') {
      await onBatchConvert(batchFormat);
    } else if (selectedAction === 'resize') {
      await onBatchResize(batchMaxWidth);
    } else if (selectedAction === 'metadata') {
      await onBatchStripMetadata();
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Queue summary */}
      <div className="p-3.5 bg-[#F8FAFC] dark:bg-[#1E293B] rounded-xl border border-[#CBD5E1] dark:border-[#334155] flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-xs font-bold text-[#0F172A] dark:text-[#F8FAFC]">
            Batch Queue: {queue.length} Images
          </span>
          <span className="text-[11px] text-[#475569] dark:text-[#CBD5E1]">
            {processedCount} of {queue.length} processed
          </span>
        </div>
        <div className="flex gap-2">
          {processedCount > 0 && (
            <Button variant="primary" size="sm" onClick={onDownloadZip} isLoading={isProcessing}>
              <Archive className="w-3.5 h-3.5 mr-1" />
              Download ZIP
            </Button>
          )}
        </div>
      </div>

      {/* Choose Batch Operation */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
          Choose Batch Action
        </label>
        <div className="grid grid-cols-2 gap-2">
          {[
            { id: 'compress', label: 'Batch Compress', icon: Zap },
            { id: 'convert', label: 'Batch Convert', icon: RefreshCw },
            { id: 'resize', label: 'Batch Resize', icon: Maximize2 },
            { id: 'metadata', label: 'Batch Strip EXIF', icon: CheckCircle2 },
          ].map((action) => {
            const Icon = action.icon;
            const isSelected = selectedAction === action.id;
            return (
              <button
                key={action.id}
                type="button"
                onClick={() => setSelectedAction(action.id as any)}
                className={`p-2.5 rounded-xl border text-xs font-semibold text-left transition-all flex items-center gap-2 cursor-pointer ${
                  isSelected
                    ? 'bg-[#EFF6FF] border-[#2563EB] text-[#1D4ED8] dark:bg-[#1E3A8A] dark:border-[#3B82F6] dark:text-[#60A5FA]'
                    : 'bg-white border-[#CBD5E1] text-[#334155] hover:bg-[#F1F5F9] dark:bg-[#1E293B] dark:border-[#475569] dark:text-[#CBD5E1] dark:hover:bg-[#334155]'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{action.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Action parameters */}
      {selectedAction === 'compress' && (
        <div className="p-3 bg-[#F8FAFC] dark:bg-[#1E293B] rounded-xl border border-[#CBD5E1] dark:border-[#334155] flex flex-col gap-2">
          <div className="flex justify-between text-xs font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
            <span>Compress Quality</span>
            <span className="font-mono text-[#2563EB] dark:text-[#60A5FA]">{batchQuality}%</span>
          </div>
          <input
            type="range"
            min={20}
            max={95}
            value={batchQuality}
            onChange={(e) => setBatchQuality(Number(e.target.value))}
            className="w-full accent-[#2563EB] dark:accent-[#3B82F6]"
          />
        </div>
      )}

      {selectedAction === 'convert' && (
        <div className="p-3 bg-[#F8FAFC] dark:bg-[#1E293B] rounded-xl border border-[#CBD5E1] dark:border-[#334155] flex flex-col gap-2">
          <label className="text-xs font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
            Target Format:
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'image/webp', label: 'WebP' },
              { id: 'image/png', label: 'PNG' },
              { id: 'image/jpeg', label: 'JPEG' },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setBatchFormat(f.id)}
                className={`py-1.5 rounded-lg border text-xs font-mono font-bold text-center cursor-pointer ${
                  batchFormat === f.id
                    ? 'bg-[#2563EB] border-[#2563EB] text-white dark:bg-[#3B82F6] dark:border-[#3B82F6]'
                    : 'bg-white border-[#CBD5E1] text-[#334155] dark:bg-[#111827] dark:border-[#475569] dark:text-[#CBD5E1]'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {selectedAction === 'resize' && (
        <div className="p-3 bg-[#F8FAFC] dark:bg-[#1E293B] rounded-xl border border-[#CBD5E1] dark:border-[#334155] flex flex-col gap-2">
          <label className="text-xs font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
            Max Bounding Width:
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { w: 1920, label: '1920px (FHD)' },
              { w: 1280, label: '1280px (HD)' },
              { w: 800, label: '800px (Web)' },
            ].map((d) => (
              <button
                key={d.w}
                type="button"
                onClick={() => setBatchMaxWidth(d.w)}
                className={`py-1.5 rounded-lg border text-[11px] font-bold text-center cursor-pointer ${
                  batchMaxWidth === d.w
                    ? 'bg-[#2563EB] border-[#2563EB] text-white dark:bg-[#3B82F6] dark:border-[#3B82F6]'
                    : 'bg-white border-[#CBD5E1] text-[#334155] dark:bg-[#111827] dark:border-[#475569] dark:text-[#CBD5E1]'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {selectedAction === 'metadata' && (
        <div className="p-3 bg-[#F8FAFC] dark:bg-[#1E293B] rounded-xl border border-[#CBD5E1] dark:border-[#334155] text-xs text-[#334155] dark:text-[#CBD5E1]">
          Stripping EXIF will sanitize all {queue.length} images simultaneously, scrubbing GPS locations, camera hardware profiles, and device timestamps.
        </div>
      )}

      {/* Run batch button */}
      <Button
        onClick={handleExecuteBatch}
        isLoading={isProcessing}
        size="lg"
        className="w-full"
      >
        <Layers className="w-4 h-4 mr-1.5 text-white" />
        Process All {queue.length} Images
      </Button>

      {/* Queue items list */}
      <div className="flex flex-col gap-2 mt-2">
        <div className="flex items-center justify-between text-xs text-[#475569] dark:text-[#CBD5E1]">
          <span className="font-semibold">Queued Files ({queue.length})</span>
          <button
            type="button"
            onClick={onClearQueue}
            className="text-[#DC2626] dark:text-[#F87171] hover:underline flex items-center gap-1 font-semibold cursor-pointer"
          >
            <Trash2 className="w-3 h-3" /> Clear Queue
          </button>
        </div>

        <div className="max-h-48 overflow-y-auto rounded-xl border border-[#CBD5E1] dark:border-[#334155] bg-white dark:bg-[#111827] divide-y divide-[#E2E8F0] dark:divide-[#334155]">
          {queue.map((item, idx) => (
            <div key={item.id} className="p-2.5 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-mono text-[10px] text-[#64748B] dark:text-[#94A3B8] w-4">
                  {idx + 1}
                </span>
                <span className="text-[#0F172A] dark:text-[#F8FAFC] font-semibold truncate max-w-[140px]">
                  {item.name}
                </span>
                <span className="text-[10px] text-[#64748B] dark:text-[#94A3B8] font-mono">
                  ({formatBytes(item.originalSize)})
                </span>
              </div>

              <div>
                {item.isProcessing ? (
                  <Badge variant="warning" size="sm">
                    <Loader2 className="w-3 h-3 animate-spin mr-1" /> Processing
                  </Badge>
                ) : item.processedBlob ? (
                  <Badge variant="success" size="sm">
                    Done ({formatBytes(item.processedSize || 0)})
                  </Badge>
                ) : (
                  <Badge variant="outline" size="sm">
                    Pending
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

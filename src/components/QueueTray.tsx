import React from 'react';
import { ImageItem } from '@/types';
import { formatBytes } from '@/lib/utils';
import { Plus, X, Check, Loader2 } from 'lucide-react';

interface QueueTrayProps {
  queue: ImageItem[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
  onAddMore: () => void;
}

export function QueueTray({
  queue,
  activeId,
  onSelect,
  onRemove,
  onAddMore,
}: QueueTrayProps) {
  if (queue.length === 0) return null;

  return (
    <aside
      aria-label="Image queue tray"
      className="w-full bg-white dark:bg-[#111827] border-t border-[#CBD5E1] dark:border-[#334155] px-4 py-3 z-20 transition-colors shadow-xs"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Label */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-bold text-[#0F172A] dark:text-[#F8FAFC]">Queue</span>
          <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-[#F1F5F9] dark:bg-[#1E293B] text-[#334155] dark:text-[#CBD5E1] border border-[#CBD5E1] dark:border-[#334155]">
            {queue.length} {queue.length === 1 ? 'file' : 'files'}
          </span>
        </div>

        {/* Thumbnail Carousel strip */}
        <div className="flex items-center gap-2.5 overflow-x-auto py-1 px-1 scrollbar-none flex-1">
          {queue.map((item) => {
            const isActive = item.id === activeId;
            const isProcessed = Boolean(item.processedBlob);

            return (
              <div
                key={item.id}
                onClick={() => onSelect(item.id)}
                className={`relative group shrink-0 flex items-center gap-2.5 p-1.5 pr-3 rounded-xl border transition-all cursor-pointer select-none ${
                  isActive
                    ? 'bg-[#EFF6FF] border-[#2563EB] dark:bg-[#1E293B] dark:border-[#3B82F6] ring-2 ring-[#2563EB]/20 dark:ring-[#3B82F6]/30 shadow-xs'
                    : 'bg-[#F8FAFC] border-[#CBD5E1] hover:bg-[#F1F5F9] hover:border-[#94A3B8] dark:bg-[#1E293B] dark:border-[#334155] dark:hover:border-[#475569]'
                }`}
              >
                {/* Thumbnail */}
                <div className="w-10 h-10 rounded-lg overflow-hidden bg-[#F1F5F9] dark:bg-[#0F172A] border border-[#CBD5E1] dark:border-[#334155] shrink-0 relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.processedUrl || item.url}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                  {isProcessed && (
                    <div className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 rounded-full bg-[#15803D] dark:bg-[#4ADE80] text-white flex items-center justify-center shadow-xs">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </div>
                  )}
                  {item.isProcessing && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <Loader2 className="w-4 h-4 text-white animate-spin" />
                    </div>
                  )}
                </div>

                {/* File info */}
                <div className="flex flex-col min-w-0 max-w-[120px]">
                  <span className="text-xs font-bold text-[#0F172A] dark:text-[#F8FAFC] truncate">
                    {item.name}
                  </span>
                  <span className="text-[10px] text-[#64748B] dark:text-[#94A3B8] font-mono">
                    {formatBytes(item.processedSize || item.originalSize)}
                  </span>
                </div>

                {/* Remove item button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove(item.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-[#64748B] hover:text-[#DC2626] dark:text-[#94A3B8] dark:hover:text-[#F87171] hover:bg-[#F1F5F9] dark:hover:bg-[#334155] transition-opacity ml-1 cursor-pointer"
                  title="Remove from queue"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}

          {/* Add file button */}
          <button
            type="button"
            onClick={onAddMore}
            className="shrink-0 flex items-center justify-center w-10 h-10 rounded-xl border border-dashed border-[#94A3B8] hover:border-[#2563EB] hover:bg-[#EFF6FF] dark:border-[#475569] dark:hover:border-[#3B82F6] dark:hover:bg-[#1E293B] text-[#475569] hover:text-[#2563EB] dark:text-[#CBD5E1] dark:hover:text-[#60A5FA] transition-all cursor-pointer"
            title="Add more photos"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}

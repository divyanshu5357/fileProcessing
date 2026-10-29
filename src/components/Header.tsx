import React from 'react';
import {
  ShieldCheck,
  Sparkles,
  Plus,
  Trash2,
  Keyboard,
  Info,
} from 'lucide-react';
import { Button } from './ui/Button';
import { ThemeToggle } from './ThemeToggle';

interface HeaderProps {
  onAddImages: (files: File[]) => void;
  onClearWorkspace: () => void;
  onOpenShortcuts: () => void;
  onOpenPrivacyInfo: () => void;
  queueLength: number;
}

export function Header({
  onAddImages,
  onClearWorkspace,
  onOpenShortcuts,
  onOpenPrivacyInfo,
  queueLength,
}: HeaderProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onAddImages(Array.from(e.target.files));
    }
  };

  return (
    <header className="w-full bg-white dark:bg-[#111827] border-b border-[#CBD5E1] dark:border-[#334155] sticky top-0 z-30 transition-colors shadow-xs">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo and Brand */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#2563EB] dark:bg-[#3B82F6] flex items-center justify-center text-white shadow-xs">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-bold text-base tracking-tight text-[#0F172A] dark:text-[#F8FAFC]">
                PixelKit
              </span>
              <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded-full bg-[#DBEAFE] dark:bg-[#1E3A8A] text-[#1E40AF] dark:text-[#93C5FD] border border-[#BFDBFE] dark:border-[#3B82F6] font-bold">
                Client-Side
              </span>
            </div>
            <span className="text-[11px] text-[#475569] dark:text-[#CBD5E1] -mt-0.5 hidden sm:block">
              All-in-One Image Utility & Studio
            </span>
          </div>
        </div>

        {/* Privacy Shield Central Indicator */}
        <button
          type="button"
          onClick={onOpenPrivacyInfo}
          className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#DCFCE7] dark:bg-[#14532D] hover:bg-[#BBF7D0] dark:hover:bg-[#166534] border border-[#86EFAC] dark:border-[#22C55E] text-[#166534] dark:text-[#BBF7D0] text-xs font-semibold transition-all cursor-pointer shadow-xs"
          title="Click to view full client-side privacy architecture"
        >
          <span className="w-2 h-2 rounded-full bg-[#15803D] dark:bg-[#4ADE80] animate-pulse" />
          <ShieldCheck className="w-3.5 h-3.5" />
          <span className="truncate max-w-[340px]">
            100% In-Browser • 0 Server Uploads
          </span>
          <Info className="w-3 h-3 opacity-80" />
        </button>

        {/* Workspace Actions & Theme Toggle */}
        <div className="flex items-center gap-2.5">
          <ThemeToggle />

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />

          {queueLength > 0 && (
            <>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="hidden sm:inline-flex"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Add Photos
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={onClearWorkspace}
                className="text-[#64748B] hover:text-[#DC2626] dark:text-[#94A3B8] dark:hover:text-[#F87171]"
                title="Clear Workspace"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </>
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={onOpenShortcuts}
            className="text-[#475569] dark:text-[#CBD5E1]"
            title="Keyboard Shortcuts"
          >
            <Keyboard className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}

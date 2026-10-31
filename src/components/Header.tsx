'use client';

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
import { NavigationTabs } from './NavigationTabs';
import { MainCategory } from '@/types/document';
import { UserMenu } from './auth/UserMenu';
import { ModeBadge } from './dashboard/ModeBadge';
import { AuthModal } from './auth/AuthModal';

interface HeaderProps {
  activeCategory: MainCategory;
  onSelectCategory: (category: MainCategory) => void;
  onAddImages: (files: File[]) => void;
  onClearWorkspace: () => void;
  onOpenShortcuts: () => void;
  onOpenPrivacyInfo: () => void;
  queueLength: number;
}

export function Header({
  activeCategory,
  onSelectCategory,
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
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Logo and Brand */}
        <div
          onClick={() => onSelectCategory('image-tools')}
          className="flex items-center gap-3 cursor-pointer shrink-0"
        >
          <div className="w-9 h-9 rounded-xl bg-[#2563EB] dark:bg-[#3B82F6] flex items-center justify-center text-white shadow-xs">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-tight text-[#0F172A] dark:text-[#F8FAFC]">
                PixelKit
              </span>
              <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded-full bg-[#DBEAFE] dark:bg-[#1E3A8A] text-[#1E40AF] dark:text-[#93C5FD] border border-[#BFDBFE] dark:border-[#3B82F6] font-bold">
                Platform
              </span>
            </div>
            <span className="text-[11px] text-[#475569] dark:text-[#CBD5E1] -mt-0.5 hidden xl:block font-medium">
              Image & Document Processing
            </span>
          </div>
        </div>

        {/* Central Categories Navigation Tabs */}
        <div className="hidden md:flex items-center justify-center flex-1 max-w-2xl">
          <NavigationTabs
            activeCategory={activeCategory}
            onSelectCategory={onSelectCategory}
            queueCount={queueLength}
          />
        </div>

        {/* Workspace Actions, Mode Selector, User Menu & Theme Toggle */}
        <div className="flex items-center gap-2 shrink-0">
          <ModeBadge />
          <ThemeToggle />
          <UserMenu />

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />

          {activeCategory === 'image-tools' && queueLength > 0 && (
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

      {/* Mobile Category Nav Bar */}
      <div className="md:hidden flex items-center justify-start px-4 py-2 border-t border-[#CBD5E1] dark:border-[#334155] bg-slate-50 dark:bg-[#0B1120] overflow-x-auto no-scrollbar">
        <NavigationTabs
          activeCategory={activeCategory}
          onSelectCategory={onSelectCategory}
          queueCount={queueLength}
        />
      </div>
      <AuthModal />
    </header>
  );
}

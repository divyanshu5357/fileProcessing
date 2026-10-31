'use client';

import React from 'react';
import { MainCategory } from '@/types/document';
import {
  Image as ImageIcon,
  FileText,
  FileSpreadsheet,
  Layers,
  Sparkles,
} from 'lucide-react';

interface NavigationTabsProps {
  activeCategory: MainCategory;
  onSelectCategory: (category: MainCategory) => void;
  queueCount?: number;
}

export function NavigationTabs({
  activeCategory,
  onSelectCategory,
  queueCount = 0,
}: NavigationTabsProps) {
  const tabs = [
    {
      id: 'image-tools' as MainCategory,
      label: 'Image Tools',
      icon: ImageIcon,
      badge: queueCount > 0 ? `${queueCount}` : undefined,
    },
    {
      id: 'pdf-tools' as MainCategory,
      label: 'PDF Tools',
      icon: FileText,
      badge: '22 Tools',
    },
    {
      id: 'document-converter' as MainCategory,
      label: 'Document Converter',
      icon: FileSpreadsheet,
    },
    {
      id: 'image-converter' as MainCategory,
      label: 'Image Converter',
      icon: Layers,
    },
  ];

  return (
    <nav className="flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar py-1">
      {tabs.map((tab) => {
        const IconComponent = tab.icon;
        const isActive = activeCategory === tab.id;

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onSelectCategory(tab.id)}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-150 shrink-0 cursor-pointer select-none ${
              isActive
                ? 'bg-[#2563EB] text-white shadow-xs'
                : 'text-[#334155] dark:text-[#CBD5E1] hover:text-[#0F172A] dark:hover:text-[#F8FAFC] hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <IconComponent className="w-3.5 h-3.5" />
            <span>{tab.label}</span>
            {tab.badge && (
              <span
                className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold ${
                  isActive
                    ? 'bg-blue-400/30 text-white border border-white/20'
                    : 'bg-slate-200/80 dark:bg-slate-700/80 text-[#334155] dark:text-[#CBD5E1]'
                }`}
              >
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}

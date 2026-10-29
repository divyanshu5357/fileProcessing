import React from 'react';
import { X, Keyboard } from 'lucide-react';
import { Button } from './ui/Button';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SHORTCUTS = [
  { key: 'Cmd/Ctrl + V', desc: 'Paste image directly from clipboard' },
  { key: 'Cmd/Ctrl + S', desc: 'Download current processed image' },
  { key: 'Cmd/Ctrl + C', desc: 'Copy processed image to clipboard' },
  { key: 'Esc', desc: 'Close open dialogs & menus' },
  { key: '1 - 9', desc: 'Quick switch between toolkit operations' },
];

export function KeyboardShortcutsModal({
  isOpen,
  onClose,
}: KeyboardShortcutsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#111827] border border-[#CBD5E1] dark:border-[#334155] rounded-3xl max-w-md w-full p-6 shadow-xl relative transition-colors">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-1 rounded-lg text-[#64748B] hover:text-[#0F172A] dark:text-[#94A3B8] dark:hover:text-[#F8FAFC] hover:bg-[#F1F5F9] dark:hover:bg-[#1E293B] transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] dark:bg-[#1E3A8A] border border-[#BFDBFE] dark:border-[#3B82F6]/50 flex items-center justify-center text-[#2563EB] dark:text-[#60A5FA]">
            <Keyboard className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#0F172A] dark:text-[#F8FAFC]">Keyboard Shortcuts</h3>
            <span className="text-xs text-[#475569] dark:text-[#CBD5E1]">Power user workflow accelerators</span>
          </div>
        </div>

        <div className="flex flex-col divide-y divide-[#E2E8F0] dark:divide-[#334155] mb-6">
          {SHORTCUTS.map((s) => (
            <div key={s.key} className="py-2.5 flex items-center justify-between text-xs">
              <span className="text-[#334155] dark:text-[#CBD5E1] font-medium">{s.desc}</span>
              <kbd className="px-2 py-1 rounded bg-[#F1F5F9] dark:bg-[#1E293B] text-[#1D4ED8] dark:text-[#60A5FA] font-mono text-xs font-bold border border-[#CBD5E1] dark:border-[#475569]">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>

        <Button onClick={onClose} className="w-full" size="md">
          Close Guide
        </Button>
      </div>
    </div>
  );
}

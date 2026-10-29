import React from 'react';
import { ConvertSettings } from '@/types';
import { Slider } from '../ui/Slider';
import { Button } from '../ui/Button';
import { RefreshCw } from 'lucide-react';

interface ConvertPanelProps {
  settings: ConvertSettings;
  onChange: (settings: ConvertSettings) => void;
  onApply: () => void;
  isProcessing: boolean;
}

const FORMAT_OPTIONS = [
  { id: 'image/webp', label: 'WebP', ext: '.webp', desc: 'Modern web standard, high compression' },
  { id: 'image/png', label: 'PNG', ext: '.png', desc: 'Lossless quality, full transparency' },
  { id: 'image/jpeg', label: 'JPEG', ext: '.jpg', desc: 'Universal compatibility for photos' },
  { id: 'image/avif', label: 'AVIF', ext: '.avif', desc: 'Next-gen ultra-high compression' },
  { id: 'svg', label: 'SVG', ext: '.svg', desc: 'Vector XML container wrapper' },
  { id: 'pdf', label: 'PDF Document', ext: '.pdf', desc: 'Printable single-page PDF document' },
];

export function ConvertPanel({
  settings,
  onChange,
  onApply,
  isProcessing,
}: ConvertPanelProps) {
  const isLossy = settings.format === 'image/jpeg' || settings.format === 'image/webp';
  const showBgColor = settings.format === 'image/jpeg';

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
          Select Target Format
        </label>
        <div className="grid grid-cols-2 gap-2">
          {FORMAT_OPTIONS.map((fmt) => {
            const isSelected = settings.format === fmt.id;
            return (
              <button
                key={fmt.id}
                type="button"
                onClick={() => onChange({ ...settings, format: fmt.id as any })}
                className={`p-3 rounded-xl border text-left transition-all flex flex-col gap-1 cursor-pointer ${
                  isSelected
                    ? 'bg-[#EFF6FF] border-[#2563EB] dark:bg-[#1E3A8A] dark:border-[#3B82F6] shadow-xs'
                    : 'bg-white border-[#E2E8F0] hover:border-[#93C5FD] dark:bg-[#1E293B] dark:border-[#334155] dark:hover:border-[#3B82F6]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold font-mono text-[#0F172A] dark:text-[#F8FAFC]">
                    {fmt.label}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-semibold bg-[#F1F5F9] dark:bg-[#111827] text-[#0F172A] dark:text-[#F8FAFC] border border-[#CBD5E1] dark:border-[#475569]">
                    {fmt.ext}
                  </span>
                </div>
                <span className="text-[11px] text-[#475569] dark:text-[#CBD5E1] leading-tight">
                  {fmt.desc}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {isLossy && (
        <Slider
          label="Output Quality"
          sublabel="Lower quality reduces byte size, higher preserves fidelity."
          value={settings.quality}
          min={10}
          max={100}
          unit="%"
          onChangeValue={(val) => onChange({ ...settings, quality: val })}
        />
      )}

      {showBgColor && (
        <div className="flex flex-col gap-2 p-3 bg-[#F8FAFC] dark:bg-[#1E293B] rounded-xl border border-[#CBD5E1] dark:border-[#334155]">
          <label className="text-xs font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
            Background Fill (for transparent areas)
          </label>
          <div className="flex items-center gap-3">
            {[
              { id: '#FFFFFF', label: 'White' },
              { id: '#000000', label: 'Black' },
              { id: '#0F172A', label: 'Slate' },
            ].map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => onChange({ ...settings, bgColor: c.id })}
                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer ${
                  settings.bgColor === c.id
                    ? 'border-[#2563EB] bg-[#EFF6FF] text-[#1D4ED8] dark:border-[#60A5FA] dark:bg-[#1E3A8A] dark:text-[#93C5FD]'
                    : 'border-[#CBD5E1] bg-white text-[#334155] dark:border-[#475569] dark:bg-[#111827] dark:text-[#CBD5E1]'
                }`}
              >
                <span
                  className="w-3.5 h-3.5 rounded-full border border-[#94A3B8]"
                  style={{ backgroundColor: c.id }}
                />
                <span>{c.label}</span>
              </button>
            ))}
            <input
              type="color"
              value={settings.bgColor}
              onChange={(e) => onChange({ ...settings, bgColor: e.target.value })}
              className="w-7 h-7 rounded-lg cursor-pointer bg-transparent border-0"
              title="Custom hex color"
            />
          </div>
        </div>
      )}

      <Button
        onClick={onApply}
        isLoading={isProcessing}
        className="w-full mt-2"
        size="lg"
      >
        <RefreshCw className="w-4 h-4 mr-1 text-white" />
        Convert to{' '}
        {FORMAT_OPTIONS.find((f) => f.id === settings.format)?.label || settings.format}
      </Button>
    </div>
  );
}

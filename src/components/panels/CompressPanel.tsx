import React from 'react';
import { CompressSettings } from '@/types';
import { Slider } from '../ui/Slider';
import { Button } from '../ui/Button';
import { Zap } from 'lucide-react';

interface CompressPanelProps {
  settings: CompressSettings;
  onChange: (settings: CompressSettings) => void;
  onApply: () => void;
  isProcessing: boolean;
}

export function CompressPanel({
  settings,
  onChange,
  onApply,
  isProcessing,
}: CompressPanelProps) {
  const targetSizes = [
    { label: 'Auto', value: 0 },
    { label: '200 KB', value: 200 },
    { label: '500 KB', value: 500 },
    { label: '1 MB', value: 1024 },
    { label: '2 MB', value: 2048 },
  ];

  const maxDimensions = [
    { label: 'Original', value: 0 },
    { label: '4K (3840px)', value: 3840 },
    { label: 'Full HD (1920px)', value: 1920 },
    { label: 'HD (1280px)', value: 1280 },
    { label: 'Web (800px)', value: 800 },
  ];

  return (
    <div className="flex flex-col gap-5">
      <div>
        <Slider
          label="Compression Quality"
          sublabel="Higher quality preserves fine detail; lower quality yields smaller file size."
          value={settings.quality}
          min={5}
          max={98}
          unit="%"
          onChangeValue={(val) => onChange({ ...settings, quality: val })}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
          Target Maximum File Size
        </label>
        <div className="grid grid-cols-5 gap-1.5">
          {targetSizes.map((item) => {
            const isSelected = settings.targetSizeKb === item.value;
            return (
              <button
                key={item.label}
                type="button"
                onClick={() => onChange({ ...settings, targetSizeKb: item.value })}
                className={`text-xs py-1.5 px-1.5 rounded-lg font-semibold transition-all text-center border cursor-pointer ${
                  isSelected
                    ? 'bg-[#EFF6FF] border-[#2563EB] text-[#1D4ED8] dark:bg-[#1E3A8A] dark:border-[#3B82F6] dark:text-[#60A5FA]'
                    : 'bg-white border-[#CBD5E1] text-[#334155] hover:bg-[#F1F5F9] dark:bg-[#1E293B] dark:border-[#475569] dark:text-[#CBD5E1] dark:hover:bg-[#334155]'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
          Max Dimension Constraint
        </label>
        <div className="grid grid-cols-2 gap-2">
          {maxDimensions.map((dim) => {
            const isSelected = settings.maxDimension === dim.value;
            return (
              <button
                key={dim.label}
                type="button"
                onClick={() => onChange({ ...settings, maxDimension: dim.value })}
                className={`text-xs py-2 px-2.5 rounded-lg font-semibold transition-all text-left border flex items-center justify-between cursor-pointer ${
                  isSelected
                    ? 'bg-[#EFF6FF] border-[#2563EB] text-[#1D4ED8] dark:bg-[#1E3A8A] dark:border-[#3B82F6] dark:text-[#60A5FA]'
                    : 'bg-white border-[#CBD5E1] text-[#334155] hover:bg-[#F1F5F9] dark:bg-[#1E293B] dark:border-[#475569] dark:text-[#CBD5E1] dark:hover:bg-[#334155]'
                }`}
              >
                <span>{dim.label}</span>
                {isSelected && (
                  <span className="w-2 h-2 rounded-full bg-[#2563EB] dark:bg-[#60A5FA]" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
          Output Encoding Format
        </label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { id: 'original', label: 'Original' },
            { id: 'image/webp', label: 'WebP (Smallest)' },
            { id: 'image/jpeg', label: 'JPEG' },
          ].map((fmt) => {
            const isSelected = settings.format === fmt.id;
            return (
              <button
                key={fmt.id}
                type="button"
                onClick={() => onChange({ ...settings, format: fmt.id as any })}
                className={`text-xs py-2 px-2 rounded-lg font-semibold transition-all text-center border cursor-pointer ${
                  isSelected
                    ? 'bg-[#EFF6FF] border-[#2563EB] text-[#1D4ED8] dark:bg-[#1E3A8A] dark:border-[#3B82F6] dark:text-[#60A5FA]'
                    : 'bg-white border-[#CBD5E1] text-[#334155] hover:bg-[#F1F5F9] dark:bg-[#1E293B] dark:border-[#475569] dark:text-[#CBD5E1] dark:hover:bg-[#334155]'
                }`}
              >
                {fmt.label}
              </button>
            );
          })}
        </div>
      </div>

      <Button
        onClick={onApply}
        isLoading={isProcessing}
        className="w-full mt-2"
        size="lg"
      >
        <Zap className="w-4 h-4 mr-1 text-white" />
        Compress Image Now
      </Button>
    </div>
  );
}

import React from 'react';
import { ResizeSettings, ImageItem } from '@/types';
import { Button } from '../ui/Button';
import { Switch } from '../ui/Switch';
import { Lock, Unlock, Maximize2 } from 'lucide-react';

interface ResizePanelProps {
  settings: ResizeSettings;
  activeImage: ImageItem | null;
  onChange: (settings: ResizeSettings) => void;
  onApply: () => void;
  isProcessing: boolean;
}

const PRESETS = [
  { name: 'Instagram Square', width: 1080, height: 1080, cat: 'Social' },
  { name: 'Instagram Story / Reel', width: 1080, height: 1920, cat: 'Social' },
  { name: 'YouTube Thumbnail', width: 1280, height: 720, cat: 'Video' },
  { name: 'Twitter / X Header', width: 1500, height: 500, cat: 'Social' },
  { name: 'Twitter / X Post', width: 1200, height: 675, cat: 'Social' },
  { name: 'LinkedIn Banner', width: 1584, height: 396, cat: 'Professional' },
  { name: 'Full HD 1080p', width: 1920, height: 1080, cat: 'Standard' },
  { name: 'Favicon 64px', width: 64, height: 64, cat: 'Icon' },
];

export function ResizePanel({
  settings,
  activeImage,
  onChange,
  onApply,
  isProcessing,
}: ResizePanelProps) {
  const origW = activeImage?.originalWidth || 1000;
  const origH = activeImage?.originalHeight || 1000;
  const aspect = origW / origH;

  const handleWidthChange = (w: number) => {
    const newW = Math.max(1, w);
    if (settings.lockAspectRatio) {
      const newH = Math.max(1, Math.round(newW / aspect));
      onChange({ ...settings, width: newW, height: newH });
    } else {
      onChange({ ...settings, width: newW });
    }
  };

  const handleHeightChange = (h: number) => {
    const newH = Math.max(1, h);
    if (settings.lockAspectRatio) {
      const newW = Math.max(1, Math.round(newH * aspect));
      onChange({ ...settings, width: newW, height: newH });
    } else {
      onChange({ ...settings, height: newH });
    }
  };

  const handlePercentageChange = (pct: number) => {
    const newW = Math.max(1, Math.round((origW * pct) / 100));
    const newH = Math.max(1, Math.round((origH * pct) / 100));
    onChange({
      ...settings,
      mode: 'percentage',
      percentage: pct,
      width: newW,
      height: newH,
    });
  };

  const handlePresetSelect = (preset: (typeof PRESETS)[0]) => {
    onChange({
      ...settings,
      mode: 'preset',
      preset: preset.name,
      width: preset.width,
      height: preset.height,
      lockAspectRatio: false,
    });
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Mode Switcher */}
      <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#F1F5F9] dark:bg-[#1E293B] rounded-xl border border-[#CBD5E1] dark:border-[#334155]">
        {[
          { id: 'dimensions', label: 'Custom' },
          { id: 'percentage', label: 'Percent' },
          { id: 'preset', label: 'Presets' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange({ ...settings, mode: tab.id as any })}
            className={`text-xs py-1.5 rounded-lg font-semibold transition-all text-center cursor-pointer ${
              settings.mode === tab.id
                ? 'bg-white text-[#0F172A] shadow-xs border border-[#CBD5E1] dark:bg-[#111827] dark:text-[#F8FAFC] dark:border-[#475569]'
                : 'text-[#475569] hover:text-[#0F172A] dark:text-[#CBD5E1] dark:hover:text-[#F8FAFC]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Mode 1: Exact Dimensions */}
      {settings.mode === 'dimensions' && (
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3 items-end">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-[#0F172A] dark:text-[#F8FAFC] font-semibold">
                Width (px)
              </label>
              <input
                type="number"
                min={1}
                max={10000}
                value={settings.width || origW}
                onChange={(e) => handleWidthChange(Number(e.target.value))}
                className="w-full bg-white dark:bg-[#1E293B] border border-[#CBD5E1] dark:border-[#475569] rounded-xl px-3 py-2 text-sm text-[#0F172A] dark:text-[#F8FAFC] font-mono focus:outline-none focus:border-[#2563EB] dark:focus:border-[#60A5FA] focus:ring-2 focus:ring-[#BFDBFE] dark:focus:ring-[#1E3A8A]"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-[#0F172A] dark:text-[#F8FAFC] font-semibold">
                Height (px)
              </label>
              <input
                type="number"
                min={1}
                max={10000}
                value={settings.height || origH}
                onChange={(e) => handleHeightChange(Number(e.target.value))}
                className="w-full bg-white dark:bg-[#1E293B] border border-[#CBD5E1] dark:border-[#475569] rounded-xl px-3 py-2 text-sm text-[#0F172A] dark:text-[#F8FAFC] font-mono focus:outline-none focus:border-[#2563EB] dark:focus:border-[#60A5FA] focus:ring-2 focus:ring-[#BFDBFE] dark:focus:ring-[#1E3A8A]"
              />
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-[#F8FAFC] dark:bg-[#1E293B] rounded-xl border border-[#CBD5E1] dark:border-[#334155]">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
              {settings.lockAspectRatio ? (
                <Lock className="w-4 h-4 text-[#2563EB] dark:text-[#60A5FA]" />
              ) : (
                <Unlock className="w-4 h-4 text-[#64748B] dark:text-[#94A3B8]" />
              )}
              <span>Maintain Aspect Ratio</span>
            </div>
            <Switch
              checked={settings.lockAspectRatio}
              onCheckedChange={(val) => onChange({ ...settings, lockAspectRatio: val })}
            />
          </div>
        </div>
      )}

      {/* Mode 2: Percentage */}
      {settings.mode === 'percentage' && (
        <div className="flex flex-col gap-3">
          <label className="text-xs text-[#0F172A] dark:text-[#F8FAFC] font-semibold">
            Quick Scaling Presets
          </label>
          <div className="grid grid-cols-4 gap-2">
            {[25, 50, 75, 200].map((pct) => {
              const isSelected = settings.percentage === pct;
              return (
                <button
                  key={pct}
                  type="button"
                  onClick={() => handlePercentageChange(pct)}
                  className={`py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#EFF6FF] border-[#2563EB] text-[#1D4ED8] dark:bg-[#1E3A8A] dark:border-[#3B82F6] dark:text-[#60A5FA]'
                      : 'bg-white border-[#CBD5E1] text-[#334155] hover:bg-[#F1F5F9] dark:bg-[#1E293B] dark:border-[#475569] dark:text-[#CBD5E1] dark:hover:bg-[#334155]'
                  }`}
                >
                  {pct}%
                </button>
              );
            })}
          </div>

          <div className="flex flex-col gap-1.5 mt-2">
            <div className="flex justify-between text-xs text-[#0F172A] dark:text-[#F8FAFC] font-semibold">
              <span>Custom Multiplier</span>
              <span className="font-mono text-[#2563EB] dark:text-[#60A5FA]">{settings.percentage}%</span>
            </div>
            <input
              type="range"
              min={10}
              max={300}
              value={settings.percentage}
              onChange={(e) => handlePercentageChange(Number(e.target.value))}
              className="w-full accent-[#2563EB] dark:accent-[#3B82F6]"
            />
            <span className="text-[11px] text-[#475569] dark:text-[#CBD5E1] mt-1 font-mono">
              Output: {settings.width} × {settings.height} px
            </span>
          </div>
        </div>
      )}

      {/* Mode 3: Presets */}
      {settings.mode === 'preset' && (
        <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-1">
          {PRESETS.map((preset) => {
            const isSelected = settings.width === preset.width && settings.height === preset.height;
            return (
              <button
                key={preset.name}
                type="button"
                onClick={() => handlePresetSelect(preset)}
                className={`flex items-center justify-between p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#EFF6FF] border-[#2563EB] text-[#0F172A] dark:bg-[#1E3A8A] dark:border-[#3B82F6] dark:text-[#F8FAFC]'
                    : 'bg-white border-[#E2E8F0] text-[#334155] hover:border-[#93C5FD] dark:bg-[#1E293B] dark:border-[#334155] dark:text-[#CBD5E1] dark:hover:border-[#3B82F6]'
                }`}
              >
                <div className="flex flex-col">
                  <span className="text-xs font-bold">{preset.name}</span>
                  <span className="text-[11px] text-[#475569] dark:text-[#CBD5E1]">{preset.cat}</span>
                </div>
                <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-[#F1F5F9] dark:bg-[#111827] text-[#0F172A] dark:text-[#F8FAFC] border border-[#CBD5E1] dark:border-[#475569]">
                  {preset.width} × {preset.height}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Resampling Algorithm */}
      <div className="flex items-center justify-between p-3 bg-[#F8FAFC] dark:bg-[#1E293B] rounded-xl border border-[#CBD5E1] dark:border-[#334155]">
        <span className="text-xs font-semibold text-[#0F172A] dark:text-[#F8FAFC]">Resample Algorithm</span>
        <div className="flex gap-1">
          {(['high', 'pixelated'] as const).map((smooth) => (
            <button
              key={smooth}
              type="button"
              onClick={() => onChange({ ...settings, smoothing: smooth })}
              className={`text-xs px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer border ${
                settings.smoothing === smooth
                  ? 'bg-[#2563EB] text-white border-[#2563EB] dark:bg-[#3B82F6] dark:border-[#3B82F6]'
                  : 'bg-white text-[#334155] border-[#CBD5E1] dark:bg-[#111827] dark:text-[#CBD5E1] dark:border-[#475569]'
              }`}
            >
              {smooth === 'high' ? 'Bicubic (Smooth)' : 'Nearest (Pixelated)'}
            </button>
          ))}
        </div>
      </div>

      <Button
        onClick={onApply}
        isLoading={isProcessing}
        className="w-full mt-2"
        size="lg"
      >
        <Maximize2 className="w-4 h-4 mr-1 text-white" />
        Resize to {settings.width} × {settings.height} px
      </Button>
    </div>
  );
}

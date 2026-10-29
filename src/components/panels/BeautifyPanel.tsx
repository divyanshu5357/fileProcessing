import React from 'react';
import { BeautifySettings } from '@/types';
import { Slider } from '../ui/Slider';
import { Button } from '../ui/Button';
import { GRADIENTS } from '@/lib/imageProcessing';
import { Sparkles } from 'lucide-react';

interface BeautifyPanelProps {
  settings: BeautifySettings;
  onChange: (settings: BeautifySettings) => void;
  onApply: () => void;
  isProcessing: boolean;
}

export function BeautifyPanel({
  settings,
  onChange,
  onApply,
  isProcessing,
}: BeautifyPanelProps) {
  const frameStyles = [
    { id: 'macos', label: 'macOS Window' },
    { id: 'windows', label: 'Windows 11' },
    { id: 'shadow', label: 'Shadow Only' },
    { id: 'none', label: 'No Frame' },
  ];

  const shadowLevels = [
    { id: 'none', label: 'None' },
    { id: 'soft', label: 'Soft' },
    { id: 'medium', label: 'Medium' },
    { id: 'hard', label: 'Hard' },
    { id: 'floating', label: 'Floating 3D' },
  ];

  const aspectRatios = [
    { id: 'auto', label: 'Auto Fit' },
    { id: '16:9', label: '16:9 (Landscape)' },
    { id: '1:1', label: '1:1 (Square)' },
    { id: '4:5', label: '4:5 (Portrait)' },
  ];

  return (
    <div className="flex flex-col gap-5">
      {/* Frame Style */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
          Window Mockup Frame
        </label>
        <div className="grid grid-cols-2 gap-2">
          {frameStyles.map((frame) => {
            const isSelected = settings.frameStyle === frame.id;
            return (
              <button
                key={frame.id}
                type="button"
                onClick={() => onChange({ ...settings, frameStyle: frame.id as any })}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#EFF6FF] border-[#2563EB] text-[#1D4ED8] dark:bg-[#1E3A8A] dark:border-[#3B82F6] dark:text-[#60A5FA]'
                    : 'bg-white border-[#CBD5E1] text-[#334155] hover:bg-[#F1F5F9] dark:bg-[#1E293B] dark:border-[#475569] dark:text-[#CBD5E1] dark:hover:bg-[#334155]'
                }`}
              >
                {frame.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Background Backdrops */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
            Background Backdrop
          </label>
          <div className="flex gap-1 p-0.5 rounded-lg bg-[#F1F5F9] dark:bg-[#1E293B] border border-[#CBD5E1] dark:border-[#334155]">
            {(['gradient', 'solid', 'transparent'] as const).map((type) => {
              const isSelected = settings.bgType === type;
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => onChange({ ...settings, bgType: type })}
                  className={`text-[11px] px-2 py-0.5 rounded font-semibold capitalize cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-white text-[#0F172A] shadow-xs dark:bg-[#111827] dark:text-[#F8FAFC]'
                      : 'text-[#475569] dark:text-[#CBD5E1]'
                  }`}
                >
                  {type}
                </button>
              );
            })}
          </div>
        </div>

        {settings.bgType === 'gradient' && (
          <div className="grid grid-cols-4 gap-2">
            {GRADIENTS.map((g) => {
              const isSelected = settings.gradientId === g.id;
              return (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => onChange({ ...settings, gradientId: g.id })}
                  className={`h-11 rounded-xl p-1 border transition-all cursor-pointer relative ${
                    isSelected
                      ? 'ring-2 ring-[#2563EB] dark:ring-[#60A5FA] border-transparent scale-105'
                      : 'border-[#CBD5E1] dark:border-[#475569] hover:opacity-90'
                  }`}
                  style={{
                    background: `linear-gradient(135deg, ${g.colors.join(', ')})`,
                  }}
                  title={g.name}
                >
                  <span className="sr-only">{g.name}</span>
                </button>
              );
            })}
          </div>
        )}

        {settings.bgType === 'solid' && (
          <div className="flex items-center gap-3">
            {['#0F172A', '#1E293B', '#F8FAFC', '#2563EB', '#881337'].map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => onChange({ ...settings, solidColor: c })}
                className={`w-8 h-8 rounded-full border transition-all cursor-pointer ${
                  settings.solidColor === c
                    ? 'ring-2 ring-[#2563EB] dark:ring-[#60A5FA] scale-110'
                    : 'border-[#CBD5E1] dark:border-[#475569]'
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
            <input
              type="color"
              value={settings.solidColor}
              onChange={(e) => onChange({ ...settings, solidColor: e.target.value })}
              className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
            />
          </div>
        )}
      </div>

      {/* Sliders */}
      <div className="flex flex-col gap-4">
        <Slider
          label="Canvas Padding"
          value={settings.padding}
          min={16}
          max={120}
          unit="px"
          onChangeValue={(val) => onChange({ ...settings, padding: val })}
        />

        <Slider
          label="Window Corner Radius"
          value={settings.borderRadius}
          min={0}
          max={32}
          unit="px"
          onChangeValue={(val) => onChange({ ...settings, borderRadius: val })}
        />
      </div>

      {/* Shadow Intensity */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
          Drop Shadow Depth
        </label>
        <div className="grid grid-cols-5 gap-1">
          {shadowLevels.map((lvl) => {
            const isSelected = settings.shadowIntensity === lvl.id;
            return (
              <button
                key={lvl.id}
                type="button"
                onClick={() => onChange({ ...settings, shadowIntensity: lvl.id as any })}
                className={`py-1.5 px-1 rounded-lg border text-[11px] font-semibold transition-all text-center cursor-pointer ${
                  isSelected
                    ? 'bg-[#EFF6FF] border-[#2563EB] text-[#1D4ED8] dark:bg-[#1E3A8A] dark:border-[#3B82F6] dark:text-[#60A5FA]'
                    : 'bg-white border-[#CBD5E1] text-[#334155] hover:bg-[#F1F5F9] dark:bg-[#1E293B] dark:border-[#475569] dark:text-[#CBD5E1] dark:hover:bg-[#334155]'
                }`}
              >
                {lvl.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Aspect Ratio & Scale */}
      <div className="grid grid-cols-2 gap-3 items-end">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
            Aspect Ratio
          </label>
          <div className="grid grid-cols-2 gap-1">
            {aspectRatios.map((ar) => {
              const isSelected = settings.aspectRatio === ar.id;
              return (
                <button
                  key={ar.id}
                  type="button"
                  onClick={() => onChange({ ...settings, aspectRatio: ar.id as any })}
                  className={`py-1.5 px-1.5 rounded-lg border text-[10px] font-bold text-center truncate cursor-pointer ${
                    isSelected
                      ? 'bg-[#2563EB] text-white border-[#2563EB] dark:bg-[#3B82F6] dark:border-[#3B82F6]'
                      : 'bg-white border-[#CBD5E1] text-[#334155] dark:bg-[#1E293B] dark:border-[#475569] dark:text-[#CBD5E1]'
                  }`}
                >
                  {ar.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
            Export Scale
          </label>
          <div className="grid grid-cols-2 gap-1">
            {[1, 2].map((s) => {
              const isSelected = settings.exportScale === s;
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => onChange({ ...settings, exportScale: s as any })}
                  className={`py-1.5 px-2 rounded-lg border text-xs font-bold text-center cursor-pointer ${
                    isSelected
                      ? 'bg-[#2563EB] text-white border-[#2563EB] dark:bg-[#3B82F6] dark:border-[#3B82F6]'
                      : 'bg-white border-[#CBD5E1] text-[#334155] dark:bg-[#1E293B] dark:border-[#475569] dark:text-[#CBD5E1]'
                  }`}
                >
                  {s}x {s === 2 ? 'Retina' : 'Standard'}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <Button
        onClick={onApply}
        isLoading={isProcessing}
        className="w-full mt-2"
        size="lg"
      >
        <Sparkles className="w-4 h-4 mr-1 text-white" />
        Render Beautified Mockup
      </Button>
    </div>
  );
}

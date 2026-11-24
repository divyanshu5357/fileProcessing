'use client';

import React from 'react';
import { Percent, HardDrive } from 'lucide-react';
import { CompressSettings } from '@/types';

export interface ImageCompressControlState extends CompressSettings {
  compressionMode: 'target_size' | 'percentage';
  desiredSizeValue: number;
  desiredSizeUnit: 'KB' | 'MB';
  percentage: number;
}

interface Props {
  settings: Partial<ImageCompressControlState>;
  onChange: (updated: ImageCompressControlState) => void;
}

const KB_PRESETS = [
  { label: '20 KB', value: 20, unit: 'KB' as const },
  { label: '50 KB', value: 50, unit: 'KB' as const },
  { label: '100 KB', value: 100, unit: 'KB' as const },
  { label: '200 KB', value: 200, unit: 'KB' as const },
  { label: '500 KB', value: 500, unit: 'KB' as const },
  { label: '1 MB', value: 1, unit: 'MB' as const },
];

const PERCENTAGE_PRESETS = [90, 80, 70, 60, 50];

export function normalizeImageCompressSettings(
  raw: Partial<ImageCompressControlState>
): ImageCompressControlState {
  const unit: 'KB' | 'MB' = raw.desiredSizeUnit === 'MB' ? 'MB' : 'KB';
  const desiredVal =
    typeof raw.desiredSizeValue === 'number' && Number.isFinite(raw.desiredSizeValue) && raw.desiredSizeValue > 0
      ? raw.desiredSizeValue
      : raw.targetSizeKb && raw.targetSizeKb > 0
        ? unit === 'MB'
          ? Number((raw.targetSizeKb / 1024).toFixed(2))
          : raw.targetSizeKb
        : 100;

  const computedKb =
    unit === 'MB' ? Math.max(1, Math.round(desiredVal * 1024)) : Math.max(1, Math.round(desiredVal));

  const pct = Math.max(
    1,
    Math.min(99, Math.round(Number(raw.percentage ?? raw.quality ?? 80) || 80))
  );

  const compressionMode: 'target_size' | 'percentage' =
    raw.compressionMode === 'percentage'
      ? 'percentage'
      : raw.compressionMode === 'target_size'
        ? 'target_size'
        : raw.targetSizeKb === 0
          ? 'percentage'
          : 'target_size';

  return {
    compressionMode,
    desiredSizeValue: desiredVal,
    desiredSizeUnit: unit,
    targetSizeKb: compressionMode === 'target_size' ? computedKb : 0,
    percentage: pct,
    quality: compressionMode === 'percentage' ? pct : raw.quality ?? 85,
    maxDimension: raw.maxDimension ?? 1920,
    format: raw.format || 'image/jpeg',
  };
}

export function ImageCompressControls({ settings, onChange }: Props) {
  const state = normalizeImageCompressSettings(settings);

  const emit = (patch: Partial<ImageCompressControlState>) => {
    onChange(normalizeImageCompressSettings({ ...state, ...patch }));
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* LEFT: Desired Size (KB / MB) */}
        <div
          onClick={() => emit({ compressionMode: 'target_size' })}
          className={`p-4 rounded-2xl border transition cursor-pointer space-y-3 ${
            state.compressionMode === 'target_size'
              ? 'border-[#2563EB] bg-blue-50/40 dark:bg-blue-950/30 ring-1 ring-[#2563EB]'
              : 'border-[#CBD5E1] dark:border-[#334155] bg-[#F8FAFC] dark:bg-[#0F172A] opacity-85 hover:opacity-100'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#0F172A] dark:text-[#F8FAFC]">
              <HardDrive className="w-3.5 h-3.5 text-[#2563EB] dark:text-[#60A5FA]" />
              Desired File Size
            </span>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                state.compressionMode === 'target_size'
                  ? 'bg-[#2563EB] text-white'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              {state.compressionMode === 'target_size' ? 'Active' : 'Click to use'}
            </span>
          </div>

          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <input
              type="number"
              min={1}
              max={state.desiredSizeUnit === 'MB' ? 50 : 51200}
              step={state.desiredSizeUnit === 'MB' ? '0.1' : '1'}
              aria-label="Desired target file size"
              value={state.desiredSizeValue}
              onChange={(e) => {
                const v = Math.max(0.1, Number(e.target.value) || 0);
                emit({
                  compressionMode: 'target_size',
                  desiredSizeValue: v,
                });
              }}
              className="flex-1 px-3 py-2 rounded-xl border border-[#CBD5E1] dark:border-[#475569] bg-white dark:bg-[#1E293B] text-sm font-bold text-[#0F172A] dark:text-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
            />
            <div className="inline-flex rounded-xl border border-[#CBD5E1] dark:border-[#475569] overflow-hidden bg-white dark:bg-[#1E293B]">
              {(['KB', 'MB'] as const).map((unit) => (
                <button
                  key={unit}
                  type="button"
                  onClick={() =>
                    emit({
                      compressionMode: 'target_size',
                      desiredSizeUnit: unit,
                      desiredSizeValue:
                        unit === 'MB'
                          ? Math.max(0.1, Number((state.desiredSizeValue / 1024).toFixed(2)))
                          : Math.max(10, Math.round(state.desiredSizeValue * 1024)),
                    })
                  }
                  className={`px-3 py-2 text-xs font-extrabold cursor-pointer transition ${
                    state.desiredSizeUnit === unit
                      ? 'bg-[#2563EB] text-white'
                      : 'text-[#475569] dark:text-[#94A3B8] hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {unit}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5" onClick={(e) => e.stopPropagation()}>
            {KB_PRESETS.map((preset) => {
              const selected =
                state.compressionMode === 'target_size' &&
                state.desiredSizeUnit === preset.unit &&
                state.desiredSizeValue === preset.value;
              return (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() =>
                    emit({
                      compressionMode: 'target_size',
                      desiredSizeValue: preset.value,
                      desiredSizeUnit: preset.unit,
                    })
                  }
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition cursor-pointer ${
                    selected
                      ? 'bg-[#2563EB] text-white border-[#2563EB]'
                      : 'bg-white dark:bg-[#1E293B] border-[#CBD5E1] dark:border-[#334155] text-[#334155] dark:text-[#CBD5E1] hover:border-[#2563EB]'
                  }`}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* RIGHT: By Percentage Only (like 90%, 80%) */}
        <div
          onClick={() => emit({ compressionMode: 'percentage' })}
          className={`p-4 rounded-2xl border transition cursor-pointer space-y-3 ${
            state.compressionMode === 'percentage'
              ? 'border-emerald-600 bg-emerald-50/40 dark:bg-emerald-950/30 ring-1 ring-emerald-600'
              : 'border-[#CBD5E1] dark:border-[#334155] bg-[#F8FAFC] dark:bg-[#0F172A] opacity-85 hover:opacity-100'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#0F172A] dark:text-[#F8FAFC]">
              <Percent className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              Percentage Only (90%, 80%...)
            </span>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                state.compressionMode === 'percentage'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              {state.compressionMode === 'percentage' ? 'Active' : 'Click to use'}
            </span>
          </div>

          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <input
              type="number"
              min={1}
              max={99}
              aria-label="Compression percentage"
              value={state.percentage}
              onChange={(e) => {
                const pct = Math.max(1, Math.min(99, Math.round(Number(e.target.value) || 80)));
                emit({
                  compressionMode: 'percentage',
                  percentage: pct,
                  quality: pct,
                });
              }}
              className="flex-1 px-3 py-2 rounded-xl border border-[#CBD5E1] dark:border-[#475569] bg-white dark:bg-[#1E293B] text-sm font-bold text-[#0F172A] dark:text-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
            <span className="px-3.5 py-2 rounded-xl border border-[#CBD5E1] dark:border-[#475569] bg-white dark:bg-[#1E293B] text-xs font-extrabold text-[#0F172A] dark:text-[#F8FAFC]">
              %
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5" onClick={(e) => e.stopPropagation()}>
            {PERCENTAGE_PRESETS.map((pct) => {
              const selected =
                state.compressionMode === 'percentage' && state.percentage === pct;
              return (
                <button
                  key={pct}
                  type="button"
                  onClick={() =>
                    emit({
                      compressionMode: 'percentage',
                      percentage: pct,
                      quality: pct,
                    })
                  }
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition cursor-pointer ${
                    selected
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-white dark:bg-[#1E293B] border-[#CBD5E1] dark:border-[#334155] text-[#334155] dark:text-[#CBD5E1] hover:border-emerald-600'
                  }`}
                >
                  {pct}%
                </button>
              );
            })}
          </div>
          <p className="text-[11px] text-[#475569] dark:text-[#94A3B8]">
            Compresses cleanly using only this percentage (no target KB/MB needed).
          </p>
        </div>
      </div>

      {/* Output Format & Max Dimension */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-[#0F172A] dark:text-[#F8FAFC]">
            Output Format
          </label>
          <select
            value={state.format}
            onChange={(e) =>
              emit({ format: e.target.value as CompressSettings['format'] })
            }
            className="text-xs p-2.5 rounded-xl border border-[#CBD5E1] dark:border-[#475569] bg-white dark:bg-[#1E293B] text-[#0F172A] dark:text-[#F8FAFC] font-medium cursor-pointer"
          >
            <option value="image/jpeg">JPEG (.jpg — smallest file size)</option>
            <option value="image/webp">WebP (.webp — crisp &amp; ultra-light)</option>
            <option value="image/png">PNG (.png — lossless PNG)</option>
            <option value="original">Keep Original Format</option>
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-[#0F172A] dark:text-[#F8FAFC]">
            Max Dimension
          </label>
          <select
            value={state.maxDimension}
            onChange={(e) => emit({ maxDimension: Number(e.target.value) })}
            className="text-xs p-2.5 rounded-xl border border-[#CBD5E1] dark:border-[#475569] bg-white dark:bg-[#1E293B] text-[#0F172A] dark:text-[#F8FAFC] font-medium cursor-pointer"
          >
            <option value={0}>Original Dimensions</option>
            <option value={1920}>Max 1920px (HD Full)</option>
            <option value={1200}>Max 1200px (Web / Portal)</option>
            <option value={800}>Max 800px (Compact)</option>
          </select>
        </div>
      </div>
    </div>
  );
}

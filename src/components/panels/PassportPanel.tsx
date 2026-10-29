import React from 'react';
import { PassportSettings } from '@/types';
import { PASSPORT_PRESETS } from '@/lib/passportTemplates';
import { Slider } from '../ui/Slider';
import { Switch } from '../ui/Switch';
import { Button } from '../ui/Button';
import { UserCheck } from 'lucide-react';

interface PassportPanelProps {
  settings: PassportSettings;
  onChange: (settings: PassportSettings) => void;
  onApply: () => void;
  isProcessing: boolean;
}

export function PassportPanel({
  settings,
  onChange,
  onApply,
  isProcessing,
}: PassportPanelProps) {
  const selectedPreset =
    PASSPORT_PRESETS.find((p) => p.id === settings.presetId) || PASSPORT_PRESETS[0];

  const handlePresetSelect = (presetId: string) => {
    const p = PASSPORT_PRESETS.find((item) => item.id === presetId);
    if (p) {
      onChange({
        ...settings,
        presetId,
        widthMm: p.widthMm,
        heightMm: p.heightMm,
      });
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Preset Selector */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
          Official Visa & Passport Standard
        </label>
        <div className="grid grid-cols-2 gap-2">
          {PASSPORT_PRESETS.map((p) => {
            const isSelected = settings.presetId === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => handlePresetSelect(p.id)}
                className={`p-2.5 rounded-xl border text-left transition-all flex flex-col gap-0.5 cursor-pointer ${
                  isSelected
                    ? 'bg-[#EFF6FF] border-[#2563EB] text-[#0F172A] dark:bg-[#1E3A8A] dark:border-[#3B82F6] dark:text-[#F8FAFC]'
                    : 'bg-white border-[#E2E8F0] text-[#334155] hover:border-[#93C5FD] dark:bg-[#1E293B] dark:border-[#334155] dark:text-[#CBD5E1] dark:hover:border-[#3B82F6]'
                }`}
              >
                <span className="text-xs font-bold">{p.name}</span>
                <span className="text-[10px] text-[#475569] dark:text-[#CBD5E1] font-mono font-medium">
                  {p.widthMm} × {p.heightMm} mm
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom Millimeters */}
      {settings.presetId === 'custom' && (
        <div className="grid grid-cols-2 gap-3 p-3 bg-[#F8FAFC] dark:bg-[#1E293B] rounded-xl border border-[#CBD5E1] dark:border-[#334155]">
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold text-[#0F172A] dark:text-[#F8FAFC]">Width (mm)</label>
            <input
              type="number"
              value={settings.widthMm}
              onChange={(e) => onChange({ ...settings, widthMm: Number(e.target.value) })}
              className="bg-white dark:bg-[#111827] border border-[#CBD5E1] dark:border-[#475569] rounded-lg px-2.5 py-1.5 text-xs text-[#0F172A] dark:text-[#F8FAFC]"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold text-[#0F172A] dark:text-[#F8FAFC]">Height (mm)</label>
            <input
              type="number"
              value={settings.heightMm}
              onChange={(e) => onChange({ ...settings, heightMm: Number(e.target.value) })}
              className="bg-white dark:bg-[#111827] border border-[#CBD5E1] dark:border-[#475569] rounded-lg px-2.5 py-1.5 text-xs text-[#0F172A] dark:text-[#F8FAFC]"
            />
          </div>
        </div>
      )}

      {/* Framing adjustments */}
      <div className="flex flex-col gap-3">
        <Slider
          label="Face / Head Zoom Scale"
          sublabel="Align head within standard 70-80% height guidelines"
          value={Math.round(settings.headScale * 100)}
          min={80}
          max={180}
          unit="%"
          onChangeValue={(val) => onChange({ ...settings, headScale: val / 100 })}
        />

        <Slider
          label="Vertical Head Offset"
          sublabel="Align eye-line according to biometric guidelines"
          value={settings.verticalOffset}
          min={-30}
          max={30}
          unit="%"
          onChangeValue={(val) => onChange({ ...settings, verticalOffset: val })}
        />
      </div>

      {/* Background Tint */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
          Background Color Standard
        </label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { id: 'white', label: 'Pure White', bg: '#FFFFFF' },
            { id: 'offwhite', label: 'Off-White', bg: '#F4F4F6' },
            { id: 'light_blue', label: 'Light Blue', bg: '#C5D8E8' },
            { id: 'light_grey', label: 'Light Grey', bg: '#E2E8F0' },
            { id: 'original', label: 'Original BG', bg: 'transparent' },
          ].map((bg) => {
            const isSelected = settings.bgOption === bg.id;
            return (
              <button
                key={bg.id}
                type="button"
                onClick={() => onChange({ ...settings, bgOption: bg.id as any })}
                className={`py-1.5 px-2 rounded-xl border text-xs font-semibold flex items-center gap-2 cursor-pointer ${
                  isSelected
                    ? 'bg-[#EFF6FF] border-[#2563EB] text-[#1D4ED8] dark:bg-[#1E3A8A] dark:border-[#3B82F6] dark:text-[#60A5FA]'
                    : 'bg-white border-[#CBD5E1] text-[#334155] hover:bg-[#F1F5F9] dark:bg-[#1E293B] dark:border-[#475569] dark:text-[#CBD5E1] dark:hover:bg-[#334155]'
                }`}
              >
                <span
                  className="w-3.5 h-3.5 rounded-full border border-[#94A3B8] shrink-0"
                  style={{ backgroundColor: bg.bg }}
                />
                <span className="truncate">{bg.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Sheet Layout */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
          Output Sheet Layout
        </label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { id: 'single', label: 'Single Photo', desc: 'Online Visa' },
            { id: '4x6_grid', label: '4 × 6" Sheet', desc: 'Photo Print' },
            { id: 'a4_grid', label: 'A4 Paper', desc: 'Home Print' },
          ].map((layout) => {
            const isSelected = settings.sheetLayout === layout.id;
            return (
              <button
                key={layout.id}
                type="button"
                onClick={() => onChange({ ...settings, sheetLayout: layout.id as any })}
                className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#EFF6FF] border-[#2563EB] text-[#0F172A] dark:bg-[#1E3A8A] dark:border-[#3B82F6] dark:text-[#F8FAFC]'
                    : 'bg-white border-[#CBD5E1] text-[#334155] hover:bg-[#F1F5F9] dark:bg-[#1E293B] dark:border-[#475569] dark:text-[#CBD5E1] dark:hover:bg-[#334155]'
                }`}
              >
                <span className="text-xs font-bold block">{layout.label}</span>
                <span className="text-[10px] text-[#475569] dark:text-[#CBD5E1] block font-medium">
                  {layout.desc}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Toggles */}
      <div className="flex flex-col gap-2.5 p-3 bg-[#F8FAFC] dark:bg-[#1E293B] rounded-xl border border-[#CBD5E1] dark:border-[#334155]">
        <Switch
          checked={settings.showBiometricGuides}
          onCheckedChange={(val) => onChange({ ...settings, showBiometricGuides: val })}
          label="Biometric Guidelines Overlay"
          description="Displays ICAO standard head crown and chin lines in preview"
        />

        {settings.sheetLayout !== 'single' && (
          <Switch
            checked={settings.addCutLines}
            onCheckedChange={(val) => onChange({ ...settings, addCutLines: val })}
            label="Print Cutting Marks"
            description="Draws crop marks to guide scissors when cutting printed sheets"
          />
        )}
      </div>

      <Button
        onClick={onApply}
        isLoading={isProcessing}
        className="w-full mt-2"
        size="lg"
      >
        <UserCheck className="w-4 h-4 mr-1 text-white" />
        Generate Passport Photo ({selectedPreset.name})
      </Button>
    </div>
  );
}

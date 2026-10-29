import React from 'react';
import { RotateSettings } from '@/types';
import { Slider } from '../ui/Slider';
import { Button } from '../ui/Button';
import {
  RotateCw,
  RotateCcw,
  FlipHorizontal,
  FlipVertical,
  RefreshCw,
  Compass,
} from 'lucide-react';

interface RotatePanelProps {
  settings: RotateSettings;
  onChange: (settings: RotateSettings) => void;
  onApply: () => void;
  isProcessing: boolean;
}

export function RotatePanel({
  settings,
  onChange,
  onApply,
  isProcessing,
}: RotatePanelProps) {
  const rotateRight = () => {
    onChange({ ...settings, rotation: (settings.rotation + 90) % 360 });
  };

  const rotateLeft = () => {
    onChange({ ...settings, rotation: (settings.rotation + 270) % 360 });
  };

  const rotate180 = () => {
    onChange({ ...settings, rotation: (settings.rotation + 180) % 360 });
  };

  const toggleFlipH = () => {
    onChange({ ...settings, flipH: !settings.flipH });
  };

  const toggleFlipV = () => {
    onChange({ ...settings, flipV: !settings.flipV });
  };

  const resetAll = () => {
    onChange({
      rotation: 0,
      fineAngle: 0,
      flipH: false,
      flipV: false,
      bgColor: 'transparent',
    });
  };

  return (
    <div className="flex flex-col gap-5">
      {/* 90-degree quick buttons */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
          Quick 90° Rotations
        </label>
        <div className="grid grid-cols-3 gap-2">
          <Button variant="secondary" size="md" onClick={rotateLeft}>
            <RotateCcw className="w-4 h-4 mr-1 text-[#64748B] dark:text-[#94A3B8]" />
            -90°
          </Button>
          <Button variant="secondary" size="md" onClick={rotateRight}>
            <RotateCw className="w-4 h-4 mr-1 text-[#2563EB] dark:text-[#60A5FA]" />
            +90°
          </Button>
          <Button variant="secondary" size="md" onClick={rotate180}>
            <RefreshCw className="w-4 h-4 mr-1 text-[#7C3AED] dark:text-[#A78BFA]" />
            180°
          </Button>
        </div>
      </div>

      {/* Flips */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
          Flip / Mirror
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={toggleFlipH}
            className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              settings.flipH
                ? 'bg-[#EFF6FF] border-[#2563EB] text-[#1D4ED8] dark:bg-[#1E3A8A] dark:border-[#3B82F6] dark:text-[#60A5FA]'
                : 'bg-white border-[#CBD5E1] text-[#334155] hover:bg-[#F1F5F9] dark:bg-[#1E293B] dark:border-[#475569] dark:text-[#CBD5E1] dark:hover:bg-[#334155]'
            }`}
          >
            <FlipHorizontal className="w-4 h-4 text-[#2563EB] dark:text-[#60A5FA]" />
            Flip Horizontal
          </button>
          <button
            type="button"
            onClick={toggleFlipV}
            className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              settings.flipV
                ? 'bg-[#EFF6FF] border-[#2563EB] text-[#1D4ED8] dark:bg-[#1E3A8A] dark:border-[#3B82F6] dark:text-[#60A5FA]'
                : 'bg-white border-[#CBD5E1] text-[#334155] hover:bg-[#F1F5F9] dark:bg-[#1E293B] dark:border-[#475569] dark:text-[#CBD5E1] dark:hover:bg-[#334155]'
            }`}
          >
            <FlipVertical className="w-4 h-4 text-[#7C3AED] dark:text-[#A78BFA]" />
            Flip Vertical
          </button>
        </div>
      </div>

      {/* Fine Angle Slider */}
      <div className="flex flex-col gap-1">
        <Slider
          label="Fine Angle / Horizon Leveler"
          sublabel="Straighten tilted horizons or adjust by fractional degrees."
          value={settings.fineAngle}
          min={-45}
          max={45}
          step={0.5}
          unit="°"
          onChangeValue={(val) => onChange({ ...settings, fineAngle: val })}
        />
        <div className="flex justify-between text-[11px] text-[#64748B] dark:text-[#94A3B8] font-mono px-1 font-semibold">
          <span>-45°</span>
          <button
            type="button"
            onClick={() => onChange({ ...settings, fineAngle: 0 })}
            className="text-[#1D4ED8] dark:text-[#60A5FA] hover:underline cursor-pointer"
          >
            Reset (0°)
          </button>
          <span>+45°</span>
        </div>
      </div>

      {/* Background Fill for Arbitrary Angle */}
      {settings.fineAngle !== 0 && (
        <div className="flex flex-col gap-2 p-3 bg-[#F8FAFC] dark:bg-[#1E293B] rounded-xl border border-[#CBD5E1] dark:border-[#334155]">
          <label className="text-xs font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
            Corner Fill Color (for tilted canvas)
          </label>
          <div className="flex items-center gap-3">
            {[
              { id: 'transparent', label: 'Transparent' },
              { id: '#000000', label: 'Black' },
              { id: '#FFFFFF', label: 'White' },
            ].map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => onChange({ ...settings, bgColor: c.id })}
                className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer ${
                  settings.bgColor === c.id
                    ? 'border-[#2563EB] bg-[#EFF6FF] text-[#1D4ED8] dark:border-[#60A5FA] dark:bg-[#1E3A8A] dark:text-[#93C5FD]'
                    : 'border-[#CBD5E1] bg-white text-[#334155] dark:border-[#475569] dark:bg-[#111827] dark:text-[#CBD5E1]'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <Button variant="secondary" onClick={resetAll} className="w-full" size="md">
          Reset Orientation
        </Button>
      </div>

      <Button
        onClick={onApply}
        isLoading={isProcessing}
        className="w-full mt-2"
        size="lg"
      >
        <Compass className="w-4 h-4 mr-1 text-white" />
        Apply Rotation ({settings.rotation + settings.fineAngle}°)
      </Button>
    </div>
  );
}

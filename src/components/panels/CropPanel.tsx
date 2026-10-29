import React from 'react';
import { CropSettings, ImageItem } from '@/types';
import { Button } from '../ui/Button';
import { Crop, Circle, Square, RotateCcw } from 'lucide-react';

interface CropPanelProps {
  settings: CropSettings;
  activeImage: ImageItem | null;
  onChange: (settings: CropSettings) => void;
  onApply: () => void;
  isProcessing: boolean;
}

const ASPECT_OPTIONS = [
  { id: 'free', label: 'Freeform', ratio: null },
  { id: '1:1', label: '1:1 Square', ratio: 1.0 },
  { id: '16:9', label: '16:9 Widescreen', ratio: 16 / 9 },
  { id: '4:3', label: '4:3 Standard', ratio: 4 / 3 },
  { id: '3:2', label: '3:2 Photo', ratio: 3 / 2 },
  { id: '9:16', label: '9:16 Stories', ratio: 9 / 16 },
  { id: 'round', label: 'Circular Crop', ratio: 1.0 },
];

export function CropPanel({
  settings,
  activeImage,
  onChange,
  onApply,
  isProcessing,
}: CropPanelProps) {
  const origW = activeImage?.originalWidth || 800;
  const origH = activeImage?.originalHeight || 600;

  const handleAspectChange = (aspectId: CropSettings['aspect']) => {
    const opt = ASPECT_OPTIONS.find((o) => o.id === aspectId);
    let newCropBox = { ...settings.cropBox };

    if (opt?.ratio) {
      const imgRatio = origW / origH;
      if (opt.ratio > imgRatio) {
        const width = 90;
        const height = (width * origW) / (opt.ratio * origH);
        newCropBox = {
          x: 5,
          y: Math.max(0, (100 - height) / 2),
          width,
          height: Math.min(90, height),
        };
      } else {
        const height = 90;
        const width = (height * origH * opt.ratio) / origW;
        newCropBox = {
          x: Math.max(0, (100 - width) / 2),
          y: 5,
          width: Math.min(90, width),
          height,
        };
      }
    } else {
      newCropBox = { x: 10, y: 10, width: 80, height: 80 };
    }

    onChange({
      ...settings,
      aspect: aspectId,
      cropBox: newCropBox,
    });
  };

  const handleReset = () => {
    onChange({
      ...settings,
      cropBox: { x: 5, y: 5, width: 90, height: 90 },
    });
  };

  const croppedW = Math.round((settings.cropBox.width / 100) * origW);
  const croppedH = Math.round((settings.cropBox.height / 100) * origH);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
          Aspect Ratio Preset
        </label>
        <div className="grid grid-cols-2 gap-2">
          {ASPECT_OPTIONS.map((opt) => {
            const isSelected = settings.aspect === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => handleAspectChange(opt.id as any)}
                className={`py-2.5 px-3 rounded-xl border text-xs font-semibold text-left transition-all flex items-center justify-between cursor-pointer ${
                  isSelected
                    ? 'bg-[#EFF6FF] border-[#2563EB] text-[#1D4ED8] dark:bg-[#1E3A8A] dark:border-[#3B82F6] dark:text-[#60A5FA]'
                    : 'bg-white border-[#CBD5E1] text-[#334155] hover:bg-[#F1F5F9] dark:bg-[#1E293B] dark:border-[#475569] dark:text-[#CBD5E1] dark:hover:bg-[#334155]'
                }`}
              >
                <span>{opt.label}</span>
                {opt.id === 'round' ? (
                  <Circle className="w-3.5 h-3.5 text-[#2563EB] dark:text-[#60A5FA]" />
                ) : (
                  <Square className="w-3.5 h-3.5 opacity-60" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-3 bg-[#F8FAFC] dark:bg-[#1E293B] rounded-xl border border-[#CBD5E1] dark:border-[#334155] flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-[#64748B] dark:text-[#94A3B8] font-medium">Cropped Dimensions:</span>
          <span className="font-mono text-[#0F172A] dark:text-[#F8FAFC] font-bold bg-white dark:bg-[#111827] px-2 py-0.5 rounded border border-[#CBD5E1] dark:border-[#475569]">
            {croppedW} × {croppedH} px
          </span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-[#64748B] dark:text-[#94A3B8] font-medium">Coordinates:</span>
          <span className="font-mono text-[#475569] dark:text-[#CBD5E1] text-[11px] font-semibold">
            X: {Math.round(settings.cropBox.x)}% • Y: {Math.round(settings.cropBox.y)}%
          </span>
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          variant="secondary"
          onClick={handleReset}
          className="flex-1"
          size="md"
        >
          <RotateCcw className="w-3.5 h-3.5 mr-1" />
          Reset Crop Area
        </Button>
      </div>

      <Button
        onClick={onApply}
        isLoading={isProcessing}
        className="w-full mt-2"
        size="lg"
      >
        <Crop className="w-4 h-4 mr-1 text-white" />
        Apply Crop ({croppedW} × {croppedH} px)
      </Button>
    </div>
  );
}

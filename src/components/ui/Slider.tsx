import React from 'react';
import { cn } from '@/lib/utils';

interface SliderProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  value: number;
  unit?: string;
  min?: number;
  max?: number;
  step?: number;
  sublabel?: string;
  onChangeValue?: (val: number) => void;
}

export function Slider({
  label,
  value,
  unit = '',
  min = 0,
  max = 100,
  step = 1,
  sublabel,
  onChangeValue,
  className,
  ...props
}: SliderProps) {
  const percentage = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-[#0F172A] dark:text-[#F8FAFC]">{label}</span>
        <div className="flex items-center gap-1 font-mono font-bold px-2 py-0.5 rounded-md border text-xs bg-[#EFF6FF] dark:bg-[#1E3A8A] text-[#1D4ED8] dark:text-[#60A5FA] border-[#BFDBFE] dark:border-[#3B82F6]/50">
          <span>{value}</span>
          {unit && <span className="text-[11px] font-normal">{unit}</span>}
        </div>
      </div>
      {sublabel && (
        <p className="text-[11px] text-[#475569] dark:text-[#94A3B8] -mt-1 leading-normal">
          {sublabel}
        </p>
      )}
      <div className="relative flex items-center w-full py-1">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChangeValue?.(Number(e.target.value))}
          className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-[#2563EB] dark:accent-[#3B82F6] focus:outline-none focus:ring-2 focus:ring-[#BFDBFE] dark:focus:ring-[#1E3A8A]"
          style={{
            background: `linear-gradient(to right, #2563EB ${percentage}%, #CBD5E1 ${percentage}%)`,
          }}
          {...props}
        />
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { ExtractedColor, ImageItem } from '@/types';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import {
  Copy,
  Check,
  Code,
  Download,
  Layers,
} from 'lucide-react';
import { canvasToBlob, downloadBlob } from '@/lib/utils';

interface PalettePanelProps {
  activeImage: ImageItem | null;
  colors: ExtractedColor[];
  onExtractColors: (count: number) => void;
  onToast: (title: string, desc?: string) => void;
}

export function PalettePanel({
  activeImage,
  colors,
  onExtractColors,
  onToast,
}: PalettePanelProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [colorCount, setColorCount] = useState<number>(6);

  const copyToClipboard = async (text: string, key: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      onToast(`Copied ${label}`, text);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      onToast('Copy failed', 'Please allow clipboard permissions');
    }
  };

  const handleExportCss = () => {
    const cssVars = colors
      .map((c, i) => `  --color-${i + 1}: ${c.hex}; /* ${c.percentage}% */`)
      .join('\n');
    const fullCss = `:root {\n${cssVars}\n}`;
    copyToClipboard(fullCss, 'css-vars', 'CSS Variables');
  };

  const handleExportTailwind = () => {
    const obj: Record<string, string> = {};
    colors.forEach((c, i) => {
      obj[`palette-${i + 1}`] = c.hex;
    });
    copyToClipboard(JSON.stringify(obj, null, 2), 'tailwind-json', 'Tailwind Config');
  };

  const handleDownloadPaletteCard = async () => {
    if (!colors || colors.length === 0) return;
    const canvas = document.createElement('canvas');
    const width = 1200;
    const height = 400;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;

    // Clean background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);

    const swatchW = width / colors.length;

    colors.forEach((c, idx) => {
      const x = idx * swatchW;
      ctx.fillStyle = c.hex;
      ctx.fillRect(x, 0, swatchW, 280);

      ctx.fillStyle = '#F8FAFC';
      ctx.fillRect(x, 280, swatchW, 120);

      ctx.fillStyle = '#0F172A';
      ctx.font = 'bold 22px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(c.hex, x + swatchW / 2, 330);

      ctx.fillStyle = '#475569';
      ctx.font = '15px monospace';
      ctx.fillText(c.rgb, x + swatchW / 2, 365);
    });

    const blob = await canvasToBlob(canvas, 'image/png');
    downloadBlob(blob, `palette_${activeImage?.name || 'colors'}.png`);
    onToast('Palette Card Downloaded', 'Saved as high-res PNG');
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Palette Count Selector */}
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
          Extract Dominant Colors
        </label>
        <div className="flex gap-1">
          {[4, 6, 8, 10].map((count) => {
            const isSelected = colorCount === count;
            return (
              <button
                key={count}
                type="button"
                onClick={() => {
                  setColorCount(count);
                  onExtractColors(count);
                }}
                className={`text-xs px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer border ${
                  isSelected
                    ? 'bg-[#2563EB] text-white border-[#2563EB] dark:bg-[#3B82F6] dark:border-[#3B82F6]'
                    : 'bg-white text-[#334155] border-[#CBD5E1] hover:bg-[#F1F5F9] dark:bg-[#1E293B] dark:text-[#CBD5E1] dark:border-[#475569] dark:hover:bg-[#334155]'
                }`}
              >
                {count}
              </button>
            );
          })}
        </div>
      </div>

      {/* Swatches List - Inside normal themed cards: Light #FFFFFF, Dark #111827 */}
      <div className="flex flex-col gap-2.5">
        {colors.map((color, idx) => {
          const isCopied = copiedKey === `hex-${idx}`;
          return (
            <div
              key={color.hex + idx}
              className="p-3 bg-white dark:bg-[#111827] border border-[#CBD5E1] dark:border-[#334155] rounded-xl flex items-center justify-between gap-3 shadow-xs hover:border-[#94A3B8] dark:hover:border-[#475569] transition-all"
            >
              <div className="flex items-center gap-3 min-w-0">
                {/* Visual color square */}
                <div
                  className="w-10 h-10 rounded-lg border border-[#CBD5E1] dark:border-[#475569] shadow-xs shrink-0"
                  style={{ backgroundColor: color.hex }}
                />

                {/* Normal themed text beside color preview (never placed directly on top of arbitrary color) */}
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-[#0F172A] dark:text-[#F8FAFC]">
                      {color.hex}
                    </span>
                    <Badge variant={color.isDark ? 'default' : 'info'} size="sm">
                      {color.percentage}%
                    </Badge>
                  </div>
                  <span className="font-mono text-[11px] text-[#475569] dark:text-[#CBD5E1] truncate">
                    {color.rgb}
                  </span>
                  <span className="font-mono text-[10px] text-[#64748B] dark:text-[#94A3B8] truncate">
                    {color.hsl}
                  </span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  title="Copy HEX code"
                  onClick={() => copyToClipboard(color.hex, `hex-${idx}`, 'HEX')}
                  className="p-2 rounded-lg bg-[#F1F5F9] dark:bg-[#1E293B] hover:bg-[#E2E8F0] dark:hover:bg-[#334155] text-[#0F172A] dark:text-[#F8FAFC] transition-all border border-[#CBD5E1] dark:border-[#475569] cursor-pointer"
                >
                  {isCopied ? (
                    <Check className="w-3.5 h-3.5 text-[#15803D] dark:text-[#4ADE80]" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Export Options */}
      <div className="flex flex-col gap-2 pt-2 border-t border-[#E2E8F0] dark:border-[#334155]">
        <label className="text-xs font-semibold text-[#475569] dark:text-[#CBD5E1]">
          Export Palette Code
        </label>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="secondary" size="sm" onClick={handleExportCss}>
            <Code className="w-3.5 h-3.5 mr-1 text-[#2563EB] dark:text-[#60A5FA]" />
            Copy CSS Variables
          </Button>
          <Button variant="secondary" size="sm" onClick={handleExportTailwind}>
            <Layers className="w-3.5 h-3.5 mr-1 text-[#2563EB] dark:text-[#60A5FA]" />
            Copy Tailwind JSON
          </Button>
        </div>

        <Button
          variant="outline"
          size="md"
          onClick={handleDownloadPaletteCard}
          className="w-full mt-1"
        >
          <Download className="w-4 h-4 mr-1 text-[#2563EB] dark:text-[#60A5FA]" />
          Download Palette Swatch PNG
        </Button>
      </div>
    </div>
  );
}

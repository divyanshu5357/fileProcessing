'use client';

import React from 'react';
import { PdfToolId } from '@/types/document';
import { Slider } from '../ui/Slider';
import { Switch } from '../ui/Switch';
import { Info, ShieldAlert, Sparkles, Sliders } from 'lucide-react';

interface ToolSettingsPanelsProps {
  toolId: PdfToolId;
  settings: any;
  onChange: (updated: any) => void;
}

export function ToolSettingsPanels({
  toolId,
  settings,
  onChange,
}: ToolSettingsPanelsProps) {
  const update = (key: string, value: any) => {
    onChange({ ...settings, [key]: value });
  };

  return (
    <div className="w-full flex flex-col gap-5 p-5 bg-white dark:bg-[#111827] border border-[#CBD5E1] dark:border-[#334155] rounded-2xl shadow-xs transition-colors">
      <div className="flex items-center gap-2 pb-3 border-b border-[#E2E8F0] dark:border-[#334155]">
        <Sliders className="w-4 h-4 text-[#2563EB] dark:text-[#60A5FA]" />
        <h4 className="text-sm font-bold text-[#0F172A] dark:text-[#F8FAFC]">
          Conversion Settings
        </h4>
      </div>

      {/* 1. JPG TO PDF SETTINGS */}
      {toolId === 'jpg-to-pdf' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[#0F172A] dark:text-[#F8FAFC]">
              Page Size
            </label>
            <select
              value={settings.pageSize || 'a4'}
              onChange={(e) => update('pageSize', e.target.value)}
              className="text-xs p-2.5 rounded-xl border border-[#CBD5E1] dark:border-[#475569] bg-white dark:bg-[#1E293B] text-[#0F172A] dark:text-[#F8FAFC] font-medium cursor-pointer"
            >
              <option value="a4">A4 (210 × 297 mm)</option>
              <option value="a3">A3 (297 × 420 mm)</option>
              <option value="letter">US Letter (8.5 × 11 in)</option>
              <option value="fit">Fit to Image Size</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[#0F172A] dark:text-[#F8FAFC]">
              Orientation
            </label>
            <select
              value={settings.orientation || 'auto'}
              onChange={(e) => update('orientation', e.target.value)}
              className="text-xs p-2.5 rounded-xl border border-[#CBD5E1] dark:border-[#475569] bg-white dark:bg-[#1E293B] text-[#0F172A] dark:text-[#F8FAFC] font-medium cursor-pointer"
            >
              <option value="auto">Auto (Match Image)</option>
              <option value="portrait">Portrait</option>
              <option value="landscape">Landscape</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[#0F172A] dark:text-[#F8FAFC]">
              Margins
            </label>
            <select
              value={settings.margin || 'normal'}
              onChange={(e) => update('margin', e.target.value)}
              className="text-xs p-2.5 rounded-xl border border-[#CBD5E1] dark:border-[#475569] bg-white dark:bg-[#1E293B] text-[#0F172A] dark:text-[#F8FAFC] font-medium cursor-pointer"
            >
              <option value="none">No Margin (Border to Border)</option>
              <option value="small">Small Margin (18 pt)</option>
              <option value="normal">Standard Margin (36 pt)</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[#0F172A] dark:text-[#F8FAFC]">
              Image Fit
            </label>
            <select
              value={settings.imageFit || 'fit'}
              onChange={(e) => update('imageFit', e.target.value)}
              className="text-xs p-2.5 rounded-xl border border-[#CBD5E1] dark:border-[#475569] bg-white dark:bg-[#1E293B] text-[#0F172A] dark:text-[#F8FAFC] font-medium cursor-pointer"
            >
              <option value="fit">Preserve Proportions (Fit)</option>
              <option value="fill">Fill Entire Page</option>
              <option value="stretch">Stretch to Edges</option>
            </select>
          </div>
        </div>
      )}

      {/* 2. PDF TO JPG SETTINGS */}
      {toolId === 'pdf-to-jpg' && (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[#0F172A] dark:text-[#F8FAFC]">
                Output Format
              </label>
              <select
                value={settings.format || 'image/jpeg'}
                onChange={(e) => update('format', e.target.value)}
                className="text-xs p-2.5 rounded-xl border border-[#CBD5E1] dark:border-[#475569] bg-white dark:bg-[#1E293B] text-[#0F172A] dark:text-[#F8FAFC] font-medium cursor-pointer"
              >
                <option value="image/jpeg">JPG (Standard photo)</option>
                <option value="image/png">PNG (Lossless with transparency)</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[#0F172A] dark:text-[#F8FAFC]">
                Resolution / DPI
              </label>
              <select
                value={settings.dpi || 150}
                onChange={(e) => update('dpi', parseInt(e.target.value, 10))}
                className="text-xs p-2.5 rounded-xl border border-[#CBD5E1] dark:border-[#475569] bg-white dark:bg-[#1E293B] text-[#0F172A] dark:text-[#F8FAFC] font-medium cursor-pointer"
              >
                <option value={72}>Standard Web (72 DPI - Fast)</option>
                <option value={150}>Crisp Quality (150 DPI - Recommended)</option>
                <option value={300}>High-Res Print (300 DPI - Ultra Sharp)</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[#0F172A] dark:text-[#F8FAFC]">
                Page Selection
              </label>
              <select
                value={settings.pageRange || 'all'}
                onChange={(e) => update('pageRange', e.target.value)}
                className="text-xs p-2.5 rounded-xl border border-[#CBD5E1] dark:border-[#475569] bg-white dark:bg-[#1E293B] text-[#0F172A] dark:text-[#F8FAFC] font-medium cursor-pointer"
              >
                <option value="all">Convert All Pages</option>
                <option value="custom">Select Specific Pages</option>
              </select>
            </div>
          </div>

          {settings.pageRange === 'custom' && (
            <div className="flex flex-col gap-1.5 max-w-sm">
              <label className="text-xs font-bold text-[#0F172A] dark:text-[#F8FAFC]">
                Page Ranges
              </label>
              <input
                type="text"
                placeholder="e.g. 1, 3-5, 8"
                value={settings.customPages || ''}
                onChange={(e) => update('customPages', e.target.value)}
                className="text-xs p-2.5 rounded-xl border border-[#CBD5E1] dark:border-[#475569] bg-white dark:bg-[#1E293B] text-[#0F172A] dark:text-[#F8FAFC]"
              />
              <span className="text-[11px] text-[#475569] dark:text-[#CBD5E1]">
                Separate page numbers or ranges with commas.
              </span>
            </div>
          )}

          {settings.format === 'image/jpeg' && (
            <div className="flex flex-col gap-2 max-w-md">
              <Slider
                label="JPEG Encoding Quality"
                min={50}
                max={100}
                value={settings.quality || 90}
                unit="%"
                onChangeValue={(val) => update('quality', val)}
              />
            </div>
          )}
        </div>
      )}

      {/* 3. WORD TO PDF SETTINGS */}
      {toolId === 'word-to-pdf' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[#0F172A] dark:text-[#F8FAFC]">
              Target Page Size
            </label>
            <select
              value={settings.pageSize || 'a4'}
              onChange={(e) => update('pageSize', e.target.value)}
              className="text-xs p-2.5 rounded-xl border border-[#CBD5E1] dark:border-[#475569] bg-white dark:bg-[#1E293B] text-[#0F172A] dark:text-[#F8FAFC] font-medium cursor-pointer"
            >
              <option value="a4">A4 (Standard)</option>
              <option value="letter">US Letter</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[#0F172A] dark:text-[#F8FAFC]">
              Orientation
            </label>
            <select
              value={settings.orientation || 'portrait'}
              onChange={(e) => update('orientation', e.target.value)}
              className="text-xs p-2.5 rounded-xl border border-[#CBD5E1] dark:border-[#475569] bg-white dark:bg-[#1E293B] text-[#0F172A] dark:text-[#F8FAFC] font-medium cursor-pointer"
            >
              <option value="portrait">Portrait</option>
              <option value="landscape">Landscape</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[#0F172A] dark:text-[#F8FAFC]">
              Margins
            </label>
            <select
              value={settings.margin || 'normal'}
              onChange={(e) => update('margin', e.target.value)}
              className="text-xs p-2.5 rounded-xl border border-[#CBD5E1] dark:border-[#475569] bg-white dark:bg-[#1E293B] text-[#0F172A] dark:text-[#F8FAFC] font-medium cursor-pointer"
            >
              <option value="normal">Normal (36 pt)</option>
              <option value="narrow">Narrow (28 pt)</option>
              <option value="wide">Wide (54 pt)</option>
            </select>
          </div>
        </div>
      )}

      {/* 4. PDF TO WORD (DOCX) SETTINGS */}
      {toolId === 'pdf-to-word' && (
        <div className="flex flex-col gap-3">
          <div className="p-3.5 bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-xl flex items-start gap-2.5 text-xs">
            <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <div className="text-[#0F172A] dark:text-[#F8FAFC]">
              <span className="font-bold">Editable Document Extraction: </span>
              Text headings, paragraphs, and tabular lines will be packaged into a genuine Microsoft Word (.docx) file.
              If the PDF is a scanned photocopy or flattened raster image, extracted text will indicate scanned status.
            </div>
          </div>
        </div>
      )}

      {/* 5. EXCEL TO PDF SETTINGS */}
      {toolId === 'excel-to-pdf' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[#0F172A] dark:text-[#F8FAFC]">
              Page Orientation
            </label>
            <select
              value={settings.orientation || 'landscape'}
              onChange={(e) => update('orientation', e.target.value)}
              className="text-xs p-2.5 rounded-xl border border-[#CBD5E1] dark:border-[#475569] bg-white dark:bg-[#1E293B] text-[#0F172A] dark:text-[#F8FAFC] font-medium cursor-pointer"
            >
              <option value="landscape">Landscape (Recommended for tables)</option>
              <option value="portrait">Portrait</option>
            </select>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl border border-[#CBD5E1] dark:border-[#334155] bg-slate-50/50 dark:bg-slate-800/30">
            <div>
              <span className="text-xs font-bold text-[#0F172A] dark:text-[#F8FAFC] block">
                Show Grid Lines
              </span>
              <span className="text-[11px] text-[#475569] dark:text-[#CBD5E1]">
                Draw table borders
              </span>
            </div>
            <Switch
              checked={settings.showGridLines ?? true}
              onCheckedChange={(chk: boolean) => update('showGridLines', chk)}
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl border border-[#CBD5E1] dark:border-[#334155] bg-slate-50/50 dark:bg-slate-800/30">
            <div>
              <span className="text-xs font-bold text-[#0F172A] dark:text-[#F8FAFC] block">
                Fit to Width
              </span>
              <span className="text-[11px] text-[#475569] dark:text-[#CBD5E1]">
                Prevent wide split
              </span>
            </div>
            <Switch
              checked={settings.fitToPage ?? true}
              onCheckedChange={(chk: boolean) => update('fitToPage', chk)}
            />
          </div>
        </div>
      )}

      {/* 6. POWERPOINT TO PDF SETTINGS */}
      {toolId === 'powerpoint-to-pdf' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[#0F172A] dark:text-[#F8FAFC]">
              Slide Aspect Ratio
            </label>
            <select
              value={settings.slideAspect || '16:9'}
              onChange={(e) => update('slideAspect', e.target.value)}
              className="text-xs p-2.5 rounded-xl border border-[#CBD5E1] dark:border-[#475569] bg-white dark:bg-[#1E293B] text-[#0F172A] dark:text-[#F8FAFC] font-medium cursor-pointer"
            >
              <option value="16:9">16:9 Widescreen (Modern displays)</option>
              <option value="4:3">4:3 Standard</option>
            </select>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl border border-[#CBD5E1] dark:border-[#334155] bg-slate-50/50 dark:bg-slate-800/30">
            <div>
              <span className="text-xs font-bold text-[#0F172A] dark:text-[#F8FAFC] block">
                Include Slide Numbers
              </span>
              <span className="text-[11px] text-[#475569] dark:text-[#CBD5E1]">
                Add page footer on slides
              </span>
            </div>
            <Switch
              checked={settings.includeSlideNumbers ?? true}
              onCheckedChange={(chk: boolean) => update('includeSlideNumbers', chk)}
            />
          </div>
        </div>
      )}

      {/* 7. PDF TO PDF/A SETTINGS */}
      {toolId === 'pdf-to-pdfa' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[#0F172A] dark:text-[#F8FAFC]">
              Archival Conformance Standard
            </label>
            <select
              value={settings.conformance || 'pdfa-1b'}
              onChange={(e) => update('conformance', e.target.value)}
              className="text-xs p-2.5 rounded-xl border border-[#CBD5E1] dark:border-[#475569] bg-white dark:bg-[#1E293B] text-[#0F172A] dark:text-[#F8FAFC] font-medium cursor-pointer"
            >
              <option value="pdfa-1b">PDF/A-1b (ISO 19005-1 Level B - Maximum compatibility)</option>
              <option value="pdfa-2b">PDF/A-2b (ISO 19005-2 Level B - Modern archival)</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[#0F172A] dark:text-[#F8FAFC]">
              Color Profile Target
            </label>
            <input
              type="text"
              readOnly
              value="sRGB IEC61966-2.1 (Device-Independent)"
              className="text-xs p-2.5 rounded-xl border border-[#CBD5E1] dark:border-[#475569] bg-slate-50 dark:bg-slate-800 text-[#475569] dark:text-[#CBD5E1] font-mono cursor-not-allowed"
            />
          </div>
        </div>
      )}

      {/* 8. WATERMARK PDF SETTINGS */}
      {toolId === 'watermark-pdf' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[#0F172A] dark:text-[#F8FAFC]">
              Watermark Text
            </label>
            <input
              type="text"
              value={settings.text || 'CONFIDENTIAL'}
              onChange={(e) => update('text', e.target.value)}
              placeholder="e.g. DRAFT or CONFIDENTIAL"
              className="text-xs p-2.5 rounded-xl border border-[#CBD5E1] dark:border-[#475569] bg-white dark:bg-[#1E293B] text-[#0F172A] dark:text-[#F8FAFC]"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[#0F172A] dark:text-[#F8FAFC]">
              Position
            </label>
            <select
              value={settings.position || 'center'}
              onChange={(e) => update('position', e.target.value)}
              className="text-xs p-2.5 rounded-xl border border-[#CBD5E1] dark:border-[#475569] bg-white dark:bg-[#1E293B] text-[#0F172A] dark:text-[#F8FAFC] font-medium cursor-pointer"
            >
              <option value="center">Center Diagonal</option>
              <option value="top-left">Top Left</option>
              <option value="top-right">Top Right</option>
              <option value="bottom-left">Bottom Left</option>
              <option value="bottom-right">Bottom Right</option>
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <Slider
              label="Watermark Opacity"
              min={10}
              max={100}
              value={Math.round((Number(settings.opacity) || 0.3) * 100)}
              unit="%"
              onChangeValue={(v) => update('opacity', v / 100)}
            />
          </div>
        </div>
      )}

      {/* 9. PAGE NUMBERS SETTINGS */}
      {toolId === 'page-numbers' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[#0F172A] dark:text-[#F8FAFC]">
              Number Format
            </label>
            <select
              value={settings.format || 'page-x-of-y'}
              onChange={(e) => update('format', e.target.value)}
              className="text-xs p-2.5 rounded-xl border border-[#CBD5E1] dark:border-[#475569] bg-white dark:bg-[#1E293B] text-[#0F172A] dark:text-[#F8FAFC] font-medium cursor-pointer"
            >
              <option value="page-x-of-y">Page X of Y</option>
              <option value="page-x">Page X</option>
              <option value="x-of-y">X / Y</option>
              <option value="x">X (Numbers only)</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[#0F172A] dark:text-[#F8FAFC]">
              Placement
            </label>
            <select
              value={settings.position || 'bottom-center'}
              onChange={(e) => update('position', e.target.value)}
              className="text-xs p-2.5 rounded-xl border border-[#CBD5E1] dark:border-[#475569] bg-white dark:bg-[#1E293B] text-[#0F172A] dark:text-[#F8FAFC] font-medium cursor-pointer"
            >
              <option value="bottom-center">Bottom Center</option>
              <option value="bottom-right">Bottom Right</option>
              <option value="bottom-left">Bottom Left</option>
              <option value="top-center">Top Center</option>
              <option value="top-right">Top Right</option>
            </select>
          </div>
        </div>
      )}

      {/* 10. SPLIT PDF SETTINGS */}
      {toolId === 'split-pdf' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[#0F172A] dark:text-[#F8FAFC]">
              Split Mode
            </label>
            <select
              value={settings.splitMode || 'all-pages'}
              onChange={(e) => update('splitMode', e.target.value)}
              className="text-xs p-2.5 rounded-xl border border-[#CBD5E1] dark:border-[#475569] bg-white dark:bg-[#1E293B] text-[#0F172A] dark:text-[#F8FAFC] font-medium cursor-pointer"
            >
              <option value="all-pages">Extract Every Page as Separate PDF</option>
              <option value="range">Extract Specific Page Range</option>
            </select>
          </div>

          {settings.splitMode === 'range' && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[#0F172A] dark:text-[#F8FAFC]">
                Page Range
              </label>
              <input
                type="text"
                placeholder="e.g. 1-3, 5, 8"
                value={settings.pageRanges || ''}
                onChange={(e) => update('pageRanges', e.target.value)}
                className="text-xs p-2.5 rounded-xl border border-[#CBD5E1] dark:border-[#475569] bg-white dark:bg-[#1E293B] text-[#0F172A] dark:text-[#F8FAFC]"
              />
            </div>
          )}
        </div>
      )}

      {/* 11. ROTATE PDF SETTINGS */}
      {toolId === 'rotate-pdf' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[#0F172A] dark:text-[#F8FAFC]">
              Rotation Angle
            </label>
            <select
              value={settings.rotationAngle || 90}
              onChange={(e) => update('rotationAngle', parseInt(e.target.value, 10))}
              className="text-xs p-2.5 rounded-xl border border-[#CBD5E1] dark:border-[#475569] bg-white dark:bg-[#1E293B] text-[#0F172A] dark:text-[#F8FAFC] font-medium cursor-pointer"
            >
              <option value={90}>90° Clockwise</option>
              <option value={180}>180° Flip</option>
              <option value={270}>90° Counter-Clockwise</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[#0F172A] dark:text-[#F8FAFC]">
              Apply Rotation To
            </label>
            <select
              value={settings.applyTo || 'all'}
              onChange={(e) => update('applyTo', e.target.value)}
              className="text-xs p-2.5 rounded-xl border border-[#CBD5E1] dark:border-[#475569] bg-white dark:bg-[#1E293B] text-[#0F172A] dark:text-[#F8FAFC] font-medium cursor-pointer"
            >
              <option value="all">All Pages in Document</option>
              <option value="odd">Odd Pages Only</option>
              <option value="even">Even Pages Only</option>
            </select>
          </div>
        </div>
      )}

      {/* 12. COMPRESS PDF SETTINGS */}
      {toolId === 'compress-pdf' && (
        <div className="flex flex-col gap-2 max-w-sm">
          <label className="text-xs font-bold text-[#0F172A] dark:text-[#F8FAFC]">
            Compression Profile
          </label>
          <select
            value={settings.compressionLevel || 'recommended'}
            onChange={(e) => update('compressionLevel', e.target.value)}
            className="text-xs p-2.5 rounded-xl border border-[#CBD5E1] dark:border-[#475569] bg-white dark:bg-[#1E293B] text-[#0F172A] dark:text-[#F8FAFC] font-medium cursor-pointer"
          >
            <option value="recommended">Recommended (Optimal balance of size & clarity)</option>
            <option value="extreme">Extreme Compression (Maximum byte savings)</option>
            <option value="low">Less Compression (Highest visual quality)</option>
          </select>
        </div>
      )}

      {/* 13. HTML TO PDF SETTINGS */}
      {toolId === 'html-to-pdf' && (
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[#0F172A] dark:text-[#F8FAFC]">
                HTML Input Mode
              </label>
              <select
                value={settings.sourceType || 'file'}
                onChange={(e) => update('sourceType', e.target.value)}
                className="text-xs p-2.5 rounded-xl border border-[#CBD5E1] dark:border-[#475569] bg-white dark:bg-[#1E293B] text-[#0F172A] dark:text-[#F8FAFC] font-medium cursor-pointer"
              >
                <option value="file">Upload .html File</option>
                <option value="html">Paste Raw HTML Code</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[#0F172A] dark:text-[#F8FAFC]">
                Page Size
              </label>
              <select
                value={settings.pageSize || 'a4'}
                onChange={(e) => update('pageSize', e.target.value)}
                className="text-xs p-2.5 rounded-xl border border-[#CBD5E1] dark:border-[#475569] bg-white dark:bg-[#1E293B] text-[#0F172A] dark:text-[#F8FAFC] font-medium cursor-pointer"
              >
                <option value="a4">A4</option>
                <option value="letter">Letter</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[#0F172A] dark:text-[#F8FAFC]">
                Margins
              </label>
              <select
                value={settings.margin || 'normal'}
                onChange={(e) => update('margin', e.target.value)}
                className="text-xs p-2.5 rounded-xl border border-[#CBD5E1] dark:border-[#475569] bg-white dark:bg-[#1E293B] text-[#0F172A] dark:text-[#F8FAFC] font-medium cursor-pointer"
              >
                <option value="normal">Normal</option>
                <option value="small">Small</option>
                <option value="none">Zero</option>
              </select>
            </div>
          </div>

          {settings.sourceType === 'html' && (
            <div className="flex flex-col gap-1.5 mt-2">
              <label className="text-xs font-bold text-[#0F172A] dark:text-[#F8FAFC]">
                Paste HTML Code
              </label>
              <textarea
                rows={4}
                value={settings.pastedHtml || ''}
                onChange={(e) => update('pastedHtml', e.target.value)}
                placeholder="<html><body><h1>My Document</h1><p>Content...</p></body></html>"
                className="text-xs font-mono p-3 rounded-xl border border-[#CBD5E1] dark:border-[#475569] bg-white dark:bg-[#1E293B] text-[#0F172A] dark:text-[#F8FAFC] resize-y"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

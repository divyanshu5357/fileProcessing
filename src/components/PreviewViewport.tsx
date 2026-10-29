import React, { useState, useRef } from 'react';
import { ImageItem, ToolId, CropSettings, PassportSettings } from '@/types';
import { formatBytes, formatDimensions, calculateSavings } from '@/lib/utils';
import {
  ZoomIn,
  ZoomOut,
  Maximize,
  Sliders,
  Pipette,
  Scissors,
} from 'lucide-react';

interface PreviewViewportProps {
  activeImage: ImageItem | null;
  activeTool: ToolId;
  cropSettings?: CropSettings;
  onCropChange?: (settings: CropSettings) => void;
  passportSettings?: PassportSettings;
  onPickColor?: (hex: string) => void;
}

export function PreviewViewport({
  activeImage,
  activeTool,
  cropSettings,
  passportSettings,
  onPickColor,
}: PreviewViewportProps) {
  const [zoom, setZoom] = useState<number>(1);
  const [sliderPosition, setSliderPosition] = useState<number>(50); // 0 to 100%
  const [isComparing, setIsComparing] = useState<boolean>(true);
  const [isDraggingSlider, setIsDraggingSlider] = useState<boolean>(false);
  const [checkerboardTheme, setCheckerboardTheme] = useState<'pattern' | 'solid'>('pattern');

  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const hasProcessed = Boolean(activeImage?.processedUrl);
  const savings = calculateSavings(
    activeImage?.originalSize || 0,
    activeImage?.processedSize || 0
  );

  const handleZoomIn = () => setZoom((z) => Math.min(3, parseFloat((z + 0.25).toFixed(2))));
  const handleZoomOut = () => setZoom((z) => Math.max(0.5, parseFloat((z - 0.25).toFixed(2))));
  const handleZoomReset = () => setZoom(1);

  // Handle comparison slider drag
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDraggingSlider || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    setSliderPosition((x / rect.width) * 100);
  };

  const handleMouseUp = () => {
    setIsDraggingSlider(false);
  };

  // Eyedropper pixel picker
  const handleImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
    if (activeTool !== 'palette' || !onPickColor || !imageRef.current) return;

    const img = imageRef.current;
    const rect = img.getBoundingClientRect();
    const xRatio = (e.clientX - rect.left) / rect.width;
    const yRatio = (e.clientY - rect.top) / rect.height;

    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(img, 0, 0);
    const pxX = Math.floor(xRatio * img.naturalWidth);
    const pxY = Math.floor(yRatio * img.naturalHeight);
    const pixel = ctx.getImageData(pxX, pxY, 1, 1).data;

    const toHex = (n: number) => n.toString(16).padStart(2, '0').toUpperCase();
    const hex = `#${toHex(pixel[0])}${toHex(pixel[1])}${toHex(pixel[2])}`;
    onPickColor(hex);
  };

  if (!activeImage) {
    return (
      <div className="flex-1 min-h-[450px] flex items-center justify-center bg-white dark:bg-[#111827] rounded-2xl border border-dashed border-[#CBD5E1] dark:border-[#334155] text-[#64748B] dark:text-[#94A3B8] text-sm">
        No image loaded in preview
      </div>
    );
  }

  const currentDisplayUrl =
    hasProcessed && !isComparing ? activeImage.processedUrl! : activeImage.url;

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      className="flex-1 flex flex-col bg-white dark:bg-[#111827] rounded-2xl border border-[#CBD5E1] dark:border-[#334155] overflow-hidden shadow-xs relative select-none transition-colors"
    >
      {/* Top Viewport Header */}
      <div className="flex flex-wrap items-center justify-between px-4 py-2.5 bg-[#F1F5F9] dark:bg-[#111827] border-b border-[#CBD5E1] dark:border-[#334155] text-xs z-20 gap-2">
        {/* Image Information: Light Label #64748B Value #0F172A / Dark Label #94A3B8 Value #F8FAFC */}
        <div className="flex items-center gap-2 min-w-0 flex-wrap">
          <div className="flex items-center gap-1">
            <span className="text-[#64748B] dark:text-[#94A3B8] font-medium">File:</span>
            <span className="font-bold text-[#0F172A] dark:text-[#F8FAFC] truncate max-w-[180px]">
              {activeImage.name}
            </span>
          </div>

          <div className="flex items-center gap-1 font-mono text-xs px-2 py-0.5 rounded-md bg-white dark:bg-[#1E293B] border border-[#CBD5E1] dark:border-[#334155]">
            <span className="text-[#64748B] dark:text-[#94A3B8]">Dimensions:</span>
            <span className="text-[#0F172A] dark:text-[#F8FAFC] font-semibold">
              {formatDimensions(activeImage.originalWidth, activeImage.originalHeight)}
            </span>
          </div>

          <div className="flex items-center gap-1 font-mono text-xs px-2 py-0.5 rounded-md bg-white dark:bg-[#1E293B] border border-[#CBD5E1] dark:border-[#334155]">
            <span className="text-[#64748B] dark:text-[#94A3B8]">Size:</span>
            <span className="text-[#0F172A] dark:text-[#F8FAFC] font-semibold">
              {formatBytes(activeImage.originalSize)}
            </span>
          </div>

          {/* Processed Badge */}
          {hasProcessed && (
            <div className="flex items-center gap-1.5 ml-1">
              <span className="text-[#64748B] dark:text-[#94A3B8]">→</span>
              <span
                className={`font-mono text-xs font-bold px-2 py-0.5 rounded-md border ${
                  savings.isSaved
                    ? 'bg-[#DCFCE7] dark:bg-[#14532D] text-[#166534] dark:text-[#BBF7D0] border-[#86EFAC] dark:border-[#22C55E]'
                    : 'bg-[#EFF6FF] dark:bg-[#1E3A8A] text-[#1D4ED8] dark:text-[#93C5FD] border-[#BFDBFE] dark:border-[#3B82F6]'
                }`}
              >
                {formatBytes(activeImage.processedSize || 0)} ({savings.text})
              </span>
            </div>
          )}
        </div>

        {/* Zoom & View Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          {hasProcessed && (
            <button
              type="button"
              onClick={() => setIsComparing(!isComparing)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                isComparing
                  ? 'bg-[#2563EB] text-white border-[#2563EB] dark:bg-[#3B82F6] dark:border-[#3B82F6]'
                  : 'bg-white dark:bg-[#1E293B] border-[#CBD5E1] dark:border-[#475569] text-[#334155] dark:text-[#CBD5E1] hover:bg-[#F1F5F9] dark:hover:bg-[#334155]'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Split Comparison</span>
            </button>
          )}

          <div className="h-4 w-px bg-[#CBD5E1] dark:bg-[#334155] mx-1" />

          <button
            type="button"
            onClick={handleZoomOut}
            className="p-1.5 rounded-lg bg-white dark:bg-[#1E293B] border border-[#CBD5E1] dark:border-[#475569] text-[#334155] dark:text-[#CBD5E1] hover:bg-[#F1F5F9] dark:hover:bg-[#334155] transition-all cursor-pointer"
            title="Zoom out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="font-mono text-xs font-semibold text-[#0F172A] dark:text-[#F8FAFC] w-10 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            onClick={handleZoomIn}
            className="p-1.5 rounded-lg bg-white dark:bg-[#1E293B] border border-[#CBD5E1] dark:border-[#475569] text-[#334155] dark:text-[#CBD5E1] hover:bg-[#F1F5F9] dark:hover:bg-[#334155] transition-all cursor-pointer"
            title="Zoom in"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleZoomReset}
            className="p-1.5 rounded-lg bg-white dark:bg-[#1E293B] border border-[#CBD5E1] dark:border-[#475569] text-[#334155] dark:text-[#CBD5E1] hover:bg-[#F1F5F9] dark:hover:bg-[#334155] transition-all cursor-pointer ml-0.5"
            title="Fit to Screen"
          >
            <Maximize className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Visual Display Canvas Area */}
      <div
        className={`flex-1 relative flex items-center justify-center p-6 overflow-hidden transition-colors ${
          checkerboardTheme === 'pattern'
            ? 'bg-checkerboard-light dark:bg-checkerboard-dark'
            : 'bg-[#F8FAFC] dark:bg-[#0F172A]'
        }`}
      >
        <div
          className="relative transition-transform duration-100 ease-out flex items-center justify-center max-w-full max-h-full"
          style={{ transform: `scale(${zoom})` }}
        >
          {/* Normal Single View or Crop/Passport View */}
          {(!hasProcessed || !isComparing) && (
            <div className="relative inline-block max-w-[85vw] max-h-[65vh]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                ref={imageRef}
                src={currentDisplayUrl}
                alt={activeImage.name}
                onClick={handleImageClick}
                className={`max-w-full max-h-[65vh] object-contain rounded shadow-md transition-all ${
                  activeTool === 'palette' ? 'cursor-crosshair' : ''
                }`}
              />

              {/* Crop Tool Overlay */}
              {activeTool === 'crop' && cropSettings && (
                <div
                  className="absolute inset-0 pointer-events-auto"
                  style={{
                    boxShadow: '0 0 0 9999px rgba(15, 23, 42, 0.65)',
                  }}
                >
                  <div
                    className="absolute border-2 border-[#2563EB] dark:border-[#60A5FA] bg-transparent cursor-move"
                    style={{
                      left: `${cropSettings.cropBox.x}%`,
                      top: `${cropSettings.cropBox.y}%`,
                      width: `${cropSettings.cropBox.width}%`,
                      height: `${cropSettings.cropBox.height}%`,
                      borderRadius: cropSettings.aspect === 'round' ? '9999px' : '0px',
                    }}
                  >
                    <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-[#2563EB] dark:bg-[#60A5FA] rounded-full shadow-xs" />
                    <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-[#2563EB] dark:bg-[#60A5FA] rounded-full shadow-xs" />
                    <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-[#2563EB] dark:bg-[#60A5FA] rounded-full shadow-xs" />
                    <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-[#2563EB] dark:bg-[#60A5FA] rounded-full shadow-xs" />

                    <div className="w-full h-full grid grid-cols-3 grid-rows-3 pointer-events-none opacity-40">
                      <div className="border-r border-b border-white" />
                      <div className="border-r border-b border-white" />
                      <div className="border-b border-white" />
                      <div className="border-r border-b border-white" />
                      <div className="border-r border-b border-white" />
                      <div className="border-b border-white" />
                      <div className="border-r border-white" />
                      <div className="border-r border-white" />
                      <div />
                    </div>
                  </div>
                </div>
              )}

              {/* Passport Biometric Overlay */}
              {activeTool === 'passport' && passportSettings?.showBiometricGuides && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div
                    className="w-[60%] h-[75%] rounded-[50%/60%] border-2 border-dashed border-[#15803D] dark:border-[#4ADE80] shadow-[0_0_15px_rgba(74,222,128,0.3)] flex flex-col justify-between p-2"
                    style={{
                      transform: `translateY(${passportSettings.verticalOffset || 0}%)`,
                    }}
                  >
                    <div className="text-[10px] text-white font-mono text-center bg-[#15803D] dark:bg-[#14532D] px-1 py-0.5 rounded self-center font-bold">
                      Crown of Head
                    </div>
                    <div className="w-full border-t border-[#15803D] dark:border-[#4ADE80] flex justify-between text-[9px] text-[#15803D] dark:text-[#4ADE80] px-1 font-bold">
                      <span>Eye Line</span>
                      <span>Eye Line</span>
                    </div>
                    <div className="text-[10px] text-white font-mono text-center bg-[#15803D] dark:bg-[#14532D] px-1 py-0.5 rounded self-center font-bold">
                      Chin Line
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Before & After Interactive Split Slider */}
          {hasProcessed && isComparing && (
            <div className="relative inline-block max-w-[85vw] max-h-[65vh] overflow-hidden select-none">
              {/* Original Image */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={activeImage.url}
                alt="Original"
                className="max-w-full max-h-[65vh] object-contain rounded"
              />

              {/* Foreground: Processed Image clipped */}
              <div
                className="absolute inset-0 overflow-hidden"
                style={{
                  clipPath: `polygon(${sliderPosition}% 0, 100% 0, 100% 100%, ${sliderPosition}% 100%)`,
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={activeImage.processedUrl!}
                  alt="Processed"
                  className="max-w-full max-h-[65vh] object-contain rounded"
                />
              </div>

              {/* Split Line & Handle */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_8px_rgba(0,0,0,0.8)] cursor-ew-resize z-10"
                style={{ left: `${sliderPosition}%` }}
                onMouseDown={() => setIsDraggingSlider(true)}
              >
                <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-[#2563EB] dark:bg-[#3B82F6] text-white flex items-center justify-center shadow-md border-2 border-white cursor-ew-resize">
                  <Sliders className="w-4 h-4" />
                </div>
              </div>

              {/* Exact Before/After Badges from specification */}
              {/* Light: Original #F1F5F9 text #334155, Processed #DCFCE7 text #166534 */}
              {/* Dark: Original #334155 text #F8FAFC, Processed #14532D text #BBF7D0 */}
              <span className="absolute top-3 left-3 px-2.5 py-1 rounded-md text-xs font-bold tracking-wider uppercase border border-[#CBD5E1] dark:border-[#475569] shadow-sm bg-[#F1F5F9] dark:bg-[#334155] text-[#334155] dark:text-[#F8FAFC]">
                Original
              </span>
              <span className="absolute top-3 right-3 px-2.5 py-1 rounded-md text-xs font-bold tracking-wider uppercase border border-[#86EFAC] dark:border-[#22C55E] shadow-sm bg-[#DCFCE7] dark:bg-[#14532D] text-[#166534] dark:text-[#BBF7D0]">
                Processed
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Hint / Status Bar */}
      <div className="px-4 py-2 bg-[#F1F5F9] dark:bg-[#111827] border-t border-[#CBD5E1] dark:border-[#334155] text-xs text-[#475569] dark:text-[#CBD5E1] flex items-center justify-between">
        <div className="flex items-center gap-2">
          {activeTool === 'palette' && (
            <span className="flex items-center gap-1.5 font-medium text-[#2563EB] dark:text-[#60A5FA]">
              <Pipette className="w-3.5 h-3.5" /> Click anywhere on image to pick a pixel color
            </span>
          )}
          {activeTool === 'crop' && (
            <span className="flex items-center gap-1.5">
              <Scissors className="w-3.5 h-3.5 text-[#2563EB] dark:text-[#60A5FA]" /> Adjust crop presets or handles
            </span>
          )}
          {activeTool !== 'palette' && activeTool !== 'crop' && hasProcessed && isComparing && (
            <span>Drag center divider to compare original vs processed visual quality</span>
          )}
          {activeTool !== 'palette' && activeTool !== 'crop' && (!hasProcessed || !isComparing) && (
            <span>100% In-Browser Execution • Lossless preview until saved</span>
          )}
        </div>

        <button
          type="button"
          onClick={() => setCheckerboardTheme(checkerboardTheme === 'pattern' ? 'solid' : 'pattern')}
          className="text-xs text-[#1D4ED8] dark:text-[#60A5FA] hover:underline font-semibold cursor-pointer"
        >
          {checkerboardTheme === 'pattern' ? 'Show Solid Canvas' : 'Show Grid Pattern'}
        </button>
      </div>
    </div>
  );
}

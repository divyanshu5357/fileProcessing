import React, { useState, useRef, useEffect } from 'react';
import { UploadCloud, ShieldCheck, Sparkles, Image as ImageIcon } from 'lucide-react';
import { SAMPLE_IMAGES, createSampleFile } from '@/lib/sampleData';

interface DropzoneProps {
  onFilesSelected: (files: File[]) => void;
  onSampleSelected: (file: File) => void;
  isLoadingSample?: boolean;
}

export function Dropzone({
  onFilesSelected,
  onSampleSelected,
  isLoadingSample = false,
}: DropzoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Global paste handler (Ctrl+V / Cmd+V)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      const pastedFiles: File[] = [];
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile();
          if (file) {
            const ext = file.type.split('/')[1] || 'png';
            const namedFile = new File([file], `clipboard_${Date.now()}.${ext}`, {
              type: file.type,
            });
            pastedFiles.push(namedFile);
          }
        }
      }

      if (pastedFiles.length > 0) {
        onFilesSelected(pastedFiles);
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [onFilesSelected]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files).filter((f) =>
      f.type.startsWith('image/')
    );
    if (files.length > 0) {
      onFilesSelected(files);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files).filter((f) =>
        f.type.startsWith('image/')
      );
      onFilesSelected(files);
    }
  };

  const handleLoadSample = async (sampleId: string) => {
    try {
      const file = await createSampleFile(sampleId);
      onSampleSelected(file);
    } catch (err) {
      console.error('Failed to load sample:', err);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-4xl mx-auto py-8 px-4 transition-colors">
      {/* Privacy Guarantee Banner */}
      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#DCFCE7] dark:bg-[#14532D] border border-[#86EFAC] dark:border-[#22C55E] text-[#166534] dark:text-[#BBF7D0] text-xs font-semibold mb-6 shadow-xs">
        <ShieldCheck className="w-4 h-4 text-[#15803D] dark:text-[#4ADE80]" />
        <span>Your images are processed locally in your browser and are never uploaded to our servers.</span>
      </div>

      {/* Hero Text */}
      <div className="text-center max-w-2xl mb-8">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0F172A] dark:text-[#F8FAFC] tracking-tight mb-3">
          Browser-Based Image Toolkit
        </h1>
        <p className="text-sm sm:text-base text-[#475569] dark:text-[#CBD5E1] leading-relaxed">
          High-performance, zero-upload photo manipulation. Compress, resize, format convert, crop, level horizons, strip EXIF metadata, and build passport photo sheets entirely on your device.
        </p>
      </div>

      {/* Main Upload Box */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`w-full relative group cursor-pointer rounded-3xl border-2 border-dashed transition-all duration-150 p-10 flex flex-col items-center text-center shadow-xs ${
          isDragOver
            ? 'border-[#2563EB] bg-[#EFF6FF] dark:border-[#60A5FA] dark:bg-[#172554] scale-[1.01]'
            : 'border-[#94A3B8] bg-white hover:border-[#2563EB] hover:bg-[#EFF6FF] dark:border-[#475569] dark:bg-[#111827] dark:hover:border-[#60A5FA] dark:hover:bg-[#172554]'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleInputChange}
          className="hidden"
        />

        {/* Icon Container */}
        <div className="w-16 h-16 rounded-2xl bg-[#EFF6FF] dark:bg-[#1E3A8A] border border-[#BFDBFE] dark:border-[#3B82F6]/50 flex items-center justify-center text-[#2563EB] dark:text-[#60A5FA] mb-4 group-hover:scale-105 transition-transform">
          <UploadCloud className="w-8 h-8" />
        </div>

        <h2 className="text-lg sm:text-xl font-bold text-[#0F172A] dark:text-[#F8FAFC] tracking-tight mb-2">
          Drop your images here, or browse files
        </h2>

        <p className="text-xs sm:text-sm text-[#475569] dark:text-[#CBD5E1] max-w-md mb-4 leading-relaxed">
          Select single or batch images. You can also paste directly from your clipboard with{' '}
          <kbd className="px-2 py-0.5 rounded bg-[#F1F5F9] dark:bg-[#1E293B] text-[#0F172A] dark:text-[#F8FAFC] font-mono text-xs border border-[#CBD5E1] dark:border-[#475569] font-bold">
            Ctrl + V
          </kbd>
        </p>

        {/* Formats */}
        <div className="flex flex-wrap items-center justify-center gap-1.5 text-xs text-[#64748B] dark:text-[#94A3B8] font-mono font-medium">
          <span className="px-2 py-0.5 rounded-md bg-[#F1F5F9] dark:bg-[#1E293B] border border-[#CBD5E1] dark:border-[#334155]">
            PNG
          </span>
          <span className="px-2 py-0.5 rounded-md bg-[#F1F5F9] dark:bg-[#1E293B] border border-[#CBD5E1] dark:border-[#334155]">
            JPEG / JPG
          </span>
          <span className="px-2 py-0.5 rounded-md bg-[#F1F5F9] dark:bg-[#1E293B] border border-[#CBD5E1] dark:border-[#334155]">
            WebP
          </span>
          <span className="px-2 py-0.5 rounded-md bg-[#F1F5F9] dark:bg-[#1E293B] border border-[#CBD5E1] dark:border-[#334155]">
            AVIF
          </span>
          <span className="px-2 py-0.5 rounded-md bg-[#F1F5F9] dark:bg-[#1E293B] border border-[#CBD5E1] dark:border-[#334155]">
            GIF
          </span>
          <span className="px-2 py-0.5 rounded-md bg-[#F1F5F9] dark:bg-[#1E293B] border border-[#CBD5E1] dark:border-[#334155]">
            SVG
          </span>
        </div>
      </div>

      {/* Tool Cards for Instant Samples */}
      <div className="w-full mt-8 flex flex-col items-center">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-[#2563EB] dark:text-[#60A5FA]" />
          <span className="text-xs font-bold uppercase tracking-wider text-[#475569] dark:text-[#CBD5E1]">
            Or test instantly with pre-built benchmark images
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 w-full">
          {SAMPLE_IMAGES.map((sample) => (
            <button
              key={sample.id}
              type="button"
              disabled={isLoadingSample}
              onClick={() => handleLoadSample(sample.id)}
              className="p-4 rounded-2xl bg-white dark:bg-[#111827] border border-[#E2E8F0] dark:border-[#334155] hover:border-[#93C5FD] dark:hover:border-[#3B82F6] text-left transition-all flex flex-col gap-2 group cursor-pointer shadow-xs"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#0F172A] dark:text-[#F8FAFC] group-hover:text-[#2563EB] dark:group-hover:text-[#60A5FA] transition-colors">
                  {sample.title}
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#EFF6FF] dark:bg-[#1E3A8A] text-[#2563EB] dark:text-[#93C5FD] border border-[#BFDBFE] dark:border-[#3B82F6]/50">
                  {sample.category}
                </span>
              </div>
              <p className="text-xs text-[#475569] dark:text-[#CBD5E1] line-clamp-2 leading-relaxed">
                {sample.description}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

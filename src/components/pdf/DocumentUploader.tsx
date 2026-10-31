'use client';

import React, { useRef, useState } from 'react';
import { UploadedFileItem } from '@/types/document';
import { formatBytes } from '@/lib/utils';
import {
  UploadCloud,
  File,
  X,
  Plus,
  Trash2,
  RotateCw,
  ArrowUp,
  ArrowDown,
  CheckCircle2,
  FileText,
  FileSpreadsheet,
  Presentation,
  Image as ImageIcon,
} from 'lucide-react';
import { Button } from '../ui/Button';

interface DocumentUploaderProps {
  files: UploadedFileItem[];
  onAddFiles: (newFiles: File[]) => void;
  onRemoveFile: (id: string) => void;
  onClearFiles: () => void;
  onRotateFile?: (id: string) => void;
  onMoveFile?: (id: string, direction: 'up' | 'down') => void;
  accept: string[];
  multiple?: boolean;
  toolName: string;
  allowRotation?: boolean;
  allowReorder?: boolean;
}

export function DocumentUploader({
  files,
  onAddFiles,
  onRemoveFile,
  onClearFiles,
  onRotateFile,
  onMoveFile,
  accept,
  multiple = true,
  toolName,
  allowRotation = false,
  allowReorder = false,
}: DocumentUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onAddFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onAddFiles(Array.from(e.target.files));
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'webp', 'svg', 'gif'].includes(ext || '')) {
      return <ImageIcon className="w-5 h-5 text-blue-500" />;
    }
    if (['xlsx', 'xls', 'csv'].includes(ext || '')) {
      return <FileSpreadsheet className="w-5 h-5 text-emerald-500" />;
    }
    if (['pptx', 'ppt'].includes(ext || '')) {
      return <Presentation className="w-5 h-5 text-orange-500" />;
    }
    return <FileText className="w-5 h-5 text-rose-500" />;
  };

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Hidden native input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={accept.join(',')}
        multiple={multiple}
        onChange={handleFileInput}
        className="hidden"
      />

      {/* Drop Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 select-none ${
          isDragging
            ? 'border-[#2563EB] bg-blue-50/70 dark:bg-blue-950/30 scale-[1.01]'
            : 'border-[#CBD5E1] dark:border-[#334155] bg-white dark:bg-[#111827] hover:border-[#2563EB] dark:hover:border-[#3B82F6]'
        }`}
      >
        <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-[#2563EB] dark:text-[#60A5FA] mb-3 shadow-xs">
          <UploadCloud className="w-7 h-7" />
        </div>

        <h4 className="text-base font-bold text-[#0F172A] dark:text-[#F8FAFC]">
          Select {toolName} files
        </h4>
        <p className="text-xs text-[#334155] dark:text-[#CBD5E1] mt-1 max-w-md font-normal">
          Drag and drop files here, or click to browse from your device.
        </p>

        <div className="flex items-center gap-2 mt-3">
          <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[#334155] dark:text-[#CBD5E1] border border-[#CBD5E1] dark:border-[#475569]">
            Supported: {accept.join(', ')}
          </span>
          {multiple && (
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              Multiple files supported
            </span>
          )}
        </div>
      </div>

      {/* Selected File List */}
      {files.length > 0 && (
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-[#0F172A] dark:text-[#F8FAFC]">
              Selected Files ({files.length})
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Add More
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onClearFiles();
                }}
                className="text-rose-600 dark:text-rose-400 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1" />
                Clear All
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-2 max-h-72 overflow-y-auto pr-1">
            {files.map((item, index) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 bg-white dark:bg-[#111827] border border-[#CBD5E1] dark:border-[#334155] rounded-xl shadow-xs transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0">
                    {getFileIcon(item.name)}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-semibold text-[#0F172A] dark:text-[#F8FAFC] truncate max-w-xs sm:max-w-md">
                      {item.name}
                    </span>
                    <div className="flex items-center gap-2 text-[11px] text-[#475569] dark:text-[#CBD5E1] font-mono">
                      <span>{formatBytes(item.size)}</span>
                      <span>•</span>
                      <span className="uppercase">{item.name.split('.').pop()}</span>
                      {item.rotation && item.rotation !== 0 ? (
                        <>
                          <span>•</span>
                          <span className="text-blue-600 dark:text-blue-400 font-bold">
                            Rotated {item.rotation}°
                          </span>
                        </>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {allowRotation && onRotateFile && (
                    <button
                      type="button"
                      onClick={() => onRotateFile(item.id)}
                      title="Rotate 90 degrees"
                      className="p-1.5 rounded-lg text-[#475569] hover:text-[#0F172A] dark:text-[#CBD5E1] dark:hover:text-[#F8FAFC] hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {allowReorder && onMoveFile && (
                    <>
                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={() => onMoveFile(item.id, 'up')}
                        title="Move Up"
                        className="p-1.5 rounded-lg text-[#475569] hover:text-[#0F172A] dark:text-[#CBD5E1] dark:hover:text-[#F8FAFC] hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={index === files.length - 1}
                        onClick={() => onMoveFile(item.id, 'down')}
                        title="Move Down"
                        className="p-1.5 rounded-lg text-[#475569] hover:text-[#0F172A] dark:text-[#CBD5E1] dark:hover:text-[#F8FAFC] hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}

                  <button
                    type="button"
                    onClick={() => onRemoveFile(item.id)}
                    title="Remove file"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer ml-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

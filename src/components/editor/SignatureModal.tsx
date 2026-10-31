'use client';

import React, { useRef, useState, useEffect } from 'react';
import { PenTool, Type, Upload, X, Check, RotateCcw } from 'lucide-react';
import { Button } from '../ui/Button';

interface SignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveSignature: (dataUrl: string) => void;
}

export function SignatureModal({ isOpen, onClose, onSaveSignature }: SignatureModalProps) {
  const [activeTab, setActiveTab] = useState<'draw' | 'type' | 'upload'>('draw');
  const [typedName, setTypedName] = useState('');
  const [selectedFont, setSelectedFont] = useState('Brush Script MT, cursive');

  // Drawing canvas state
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  useEffect(() => {
    if (isOpen && activeTab === 'draw' && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = '#0F172A';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
    }
  }, [isOpen, activeTab]);

  if (!isOpen) return null;

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    setIsDrawing(true);
    setHasDrawn(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  const handleSave = () => {
    if (activeTab === 'draw') {
      const canvas = canvasRef.current;
      if (!canvas) return;
      onSaveSignature(canvas.toDataURL('image/png'));
      onClose();
    } else if (activeTab === 'type') {
      // Render typed signature to a temporary canvas
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = 400;
      tempCanvas.height = 120;
      const ctx = tempCanvas.getContext('2d')!;
      ctx.font = `44px ${selectedFont}`;
      ctx.fillStyle = '#0F172A';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(typedName || 'Signature', 200, 60);
      onSaveSignature(tempCanvas.toDataURL('image/png'));
      onClose();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          onSaveSignature(ev.target.result as string);
          onClose();
        }
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-white dark:bg-[#111827] border border-[#CBD5E1] dark:border-[#334155] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/50 text-[#2563EB] dark:text-[#60A5FA] flex items-center justify-center font-bold">
              <PenTool className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-[#0F172A] dark:text-[#F8FAFC]">
              Create Your Signature
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 px-4 pt-2 gap-2">
          {[
            { id: 'draw' as const, label: 'Draw', icon: PenTool },
            { id: 'type' as const, label: 'Type', icon: Type },
            { id: 'upload' as const, label: 'Upload Image', icon: Upload },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                  isActive
                    ? 'border-[#2563EB] text-[#2563EB] dark:text-[#60A5FA] bg-white dark:bg-[#111827] rounded-t-lg'
                    : 'border-transparent text-[#475569] dark:text-[#CBD5E1] hover:text-[#0F172A] dark:hover:text-[#F8FAFC]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Body */}
        <div className="p-5 flex flex-col gap-4">
          {activeTab === 'draw' && (
            <div className="flex flex-col gap-2">
              <div className="relative w-full h-44 bg-slate-50 dark:bg-slate-900 border border-dashed border-[#CBD5E1] dark:border-[#475569] rounded-xl overflow-hidden cursor-crosshair">
                <canvas
                  ref={canvasRef}
                  width={460}
                  height={176}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  className="w-full h-full"
                />
                {!hasDrawn && (
                  <span className="absolute inset-0 flex items-center justify-center text-xs text-slate-400 pointer-events-none select-none font-medium">
                    Sign with your mouse or touchpad here...
                  </span>
                )}
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={clearCanvas}
                  className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-rose-600 font-medium cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" /> Clear Pad
                </button>
              </div>
            </div>
          )}

          {activeTab === 'type' && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[#0F172A] dark:text-[#F8FAFC]">
                  Type your name
                </label>
                <input
                  type="text"
                  placeholder="e.g. John Doe"
                  value={typedName}
                  onChange={(e) => setTypedName(e.target.value)}
                  className="p-2.5 rounded-xl border border-[#CBD5E1] dark:border-[#475569] bg-white dark:bg-[#1E293B] text-sm text-[#0F172A] dark:text-[#F8FAFC]"
                />
              </div>

              <div className="p-6 bg-slate-50 dark:bg-slate-900 border rounded-xl flex items-center justify-center min-h-24">
                <span
                  style={{ fontFamily: selectedFont }}
                  className="text-3xl sm:text-4xl text-[#0F172A] dark:text-[#F8FAFC]"
                >
                  {typedName || 'Your Signature'}
                </span>
              </div>
            </div>
          )}

          {activeTab === 'upload' && (
            <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-[#CBD5E1] dark:border-[#475569] rounded-xl text-center">
              <Upload className="w-8 h-8 text-[#2563EB] mb-2" />
              <p className="text-xs text-[#0F172A] dark:text-[#F8FAFC] font-bold">
                Upload image of signature
              </p>
              <p className="text-[11px] text-slate-500 mt-1">PNG or JPG with transparent or white background</p>
              <label className="mt-3 inline-flex items-center px-3 py-1.5 bg-[#2563EB] text-white text-xs font-bold rounded-lg cursor-pointer hover:bg-blue-700">
                Browse Files
                <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleSave} className="font-bold gap-1">
            <Check className="w-4 h-4" />
            Place Signature
          </Button>
        </div>
      </div>
    </div>
  );
}

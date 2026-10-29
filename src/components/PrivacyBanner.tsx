import React from 'react';
import { ShieldCheck, Lock, Cpu, EyeOff, X } from 'lucide-react';
import { Button } from './ui/Button';

interface PrivacyBannerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PrivacyBanner({ isOpen, onClose }: PrivacyBannerProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#111827] border border-[#CBD5E1] dark:border-[#334155] rounded-3xl max-w-lg w-full p-6 shadow-xl relative transition-colors">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-1 rounded-lg text-[#64748B] hover:text-[#0F172A] dark:text-[#94A3B8] dark:hover:text-[#F8FAFC] hover:bg-[#F1F5F9] dark:hover:bg-[#1E293B] transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-[#DCFCE7] dark:bg-[#14532D] border border-[#86EFAC] dark:border-[#22C55E] flex items-center justify-center text-[#15803D] dark:text-[#4ADE80] shadow-xs">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#0F172A] dark:text-[#F8FAFC]">
              Zero-Upload Privacy Architecture
            </h3>
            <span className="text-xs text-[#15803D] dark:text-[#4ADE80] font-semibold">
              100% Client-Side In-Browser Execution
            </span>
          </div>
        </div>

        <blockquote className="p-3.5 rounded-xl bg-[#F1F5F9] dark:bg-[#1E293B] border-l-4 border-[#15803D] dark:border-[#4ADE80] text-xs font-medium text-[#0F172A] dark:text-[#F8FAFC] italic mb-5 leading-relaxed">
          &ldquo;Your images are processed locally in your browser and are never uploaded to our servers.&rdquo;
        </blockquote>

        <div className="flex flex-col gap-3.5 text-xs text-[#334155] dark:text-[#CBD5E1] mb-6">
          <div className="flex items-start gap-2.5">
            <Cpu className="w-4 h-4 text-[#2563EB] dark:text-[#60A5FA] shrink-0 mt-0.5" />
            <div>
              <strong className="text-[#0F172A] dark:text-[#F8FAFC] block font-semibold">
                Local Hardware Acceleration
              </strong>
              <span>
                All compression, resizing, color extraction, and canvas manipulations run directly on your device via HTML5 Canvas API and WebAssembly.
              </span>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <EyeOff className="w-4 h-4 text-[#7C3AED] dark:text-[#A78BFA] shrink-0 mt-0.5" />
            <div>
              <strong className="text-[#0F172A] dark:text-[#F8FAFC] block font-semibold">
                No Tracking & No Account Needed
              </strong>
              <span>
                No registration, cookies, analytics tracking, or image data persistence. Closing this tab clears all volatile memory blobs.
              </span>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <Lock className="w-4 h-4 text-[#15803D] dark:text-[#4ADE80] shrink-0 mt-0.5" />
            <div>
              <strong className="text-[#0F172A] dark:text-[#F8FAFC] block font-semibold">
                EXIF GPS Sanitization
              </strong>
              <span>
                PixelKit provides dedicated metadata stripping to prevent accidental disclosure of geolocation and device serial numbers.
              </span>
            </div>
          </div>
        </div>

        <Button onClick={onClose} className="w-full" size="md">
          Got it, Proceed Securely
        </Button>
      </div>
    </div>
  );
}

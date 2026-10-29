import React from 'react';
import { ShieldCheck, Sparkles, Heart } from 'lucide-react';

interface FooterProps {
  onOpenPrivacyInfo?: () => void;
}

export function Footer({ onOpenPrivacyInfo }: FooterProps) {
  return (
    <footer className="w-full bg-[#F1F5F9] dark:bg-[#020617] border-t border-[#CBD5E1] dark:border-[#334155] py-12 px-4 transition-colors">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start justify-between gap-8">
        {/* Brand & Guarantee */}
        <div className="flex flex-col gap-3 max-w-sm">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#2563EB] dark:bg-[#3B82F6] flex items-center justify-center text-white shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="font-bold text-base text-[#0F172A] dark:text-[#F8FAFC] tracking-tight">
              PixelKit
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#DCFCE7] dark:bg-[#14532D] text-[#166534] dark:text-[#BBF7D0] border border-[#86EFAC] dark:border-[#22C55E] font-semibold">
              100% Client-Side
            </span>
          </div>

          <p className="text-xs text-[#475569] dark:text-[#CBD5E1] leading-relaxed">
            All-in-One browser image utility. Your images are processed locally in your browser using the HTML5 Canvas API and WebAssembly, and are never uploaded to any remote server.
          </p>

          <div className="flex items-center gap-2 text-xs font-semibold text-[#15803D] dark:text-[#4ADE80]">
            <ShieldCheck className="w-4 h-4" />
            <span>Zero-Upload Privacy Architecture</span>
          </div>
        </div>

        {/* Quick Tools Navigation */}
        <div className="flex flex-col gap-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#0F172A] dark:text-[#F8FAFC]">
            Toolkit Features
          </h4>
          <ul className="text-xs text-[#475569] dark:text-[#CBD5E1] flex flex-col gap-1.5">
            <li>• Image Compression & WebP Encoding</li>
            <li>• Dimension Resizing with Aspect Lock</li>
            <li>• Multi-Format Conversion (PNG, JPG, AVIF, PDF)</li>
            <li>• Custom & Biometric Passport Framing</li>
            <li>• EXIF Metadata Stripping & Privacy Inspector</li>
          </ul>
        </div>

        {/* Privacy & Resources */}
        <div className="flex flex-col gap-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#0F172A] dark:text-[#F8FAFC]">
            Privacy & Trust
          </h4>
          <p className="text-xs text-[#475569] dark:text-[#CBD5E1] max-w-xs">
            No cookies, no user registration, and no tracking scripts. Closing this browser session frees all memory blobs.
          </p>
          {onOpenPrivacyInfo && (
            <button
              type="button"
              onClick={onOpenPrivacyInfo}
              className="text-xs font-medium text-[#1D4ED8] dark:text-[#60A5FA] hover:underline self-start mt-1 cursor-pointer"
            >
              Learn about our zero-upload architecture →
            </button>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-8 pt-6 border-t border-[#CBD5E1] dark:border-[#334155] flex flex-col sm:flex-row items-center justify-between text-xs text-[#64748B] dark:text-[#94A3B8] gap-4">
        <span>© 2026 PixelKit. Free & Open Client-Side Image Utility.</span>
        <span className="flex items-center gap-1">
          Crafted for privacy & high performance.
        </span>
      </div>
    </footer>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShieldCheck, Lock, Globe } from 'lucide-react';
import { GyanvatsalaLogo } from './common/GyanvatsalaLogo';

interface FooterProps {
  onOpenPrivacyInfo?: () => void;
}

export function Footer({ onOpenPrivacyInfo }: FooterProps) {
  const [currentYear, setCurrentYear] = useState(2026);

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);

  return (
    <footer className="w-full bg-white dark:bg-[#0B0E14] border-t border-[#E9EBF0] dark:border-[#222632] py-16 px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="max-w-7xl mx-auto flex flex-col gap-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand Column (2 cols wide) */}
          <div className="lg:col-span-2 flex flex-col gap-4 max-w-sm">
            <Link href="/" className="inline-block">
              <GyanvatsalaLogo size={32} showWordmark={true} descriptor="Your Digital Document Workspace" />
            </Link>

            <p className="text-xs sm:text-sm text-[#727783] dark:text-[#9DA3AE] leading-relaxed">
              A thoughtfully designed workspace for documents, images and digital files. Everything you need to edit, convert, transform and create with confidence.
            </p>

            <div className="flex items-center gap-2 text-xs font-semibold text-[#159B75]">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>Client-Side Processing Available</span>
            </div>

            <div className="text-xs text-[#727783] font-mono">
              <span>https://www.gyanvatsala.in</span>
            </div>
          </div>

          {/* Product Column */}
          <div className="flex flex-col gap-3">
            <h4 className="text-xs font-semibold text-[#20232B] dark:text-[#F8FAFC] uppercase tracking-wider">
              Product
            </h4>
            <ul className="text-xs sm:text-sm text-[#727783] dark:text-[#9DA3AE] flex flex-col gap-2.5">
              <li>
                <Link href="/workspace" className="hover:text-[#536BCE] transition font-medium">
                  Workspace
                </Link>
              </li>
              <li>
                <Link href="/pdf" className="hover:text-[#536BCE] transition">
                  Document Studio
                </Link>
              </li>
              <li>
                <Link href="/scan-studio" className="hover:text-[#536BCE] transition">
                  Scan Studio
                </Link>
              </li>
              <li>
                <Link href="/image-converter" className="hover:text-[#536BCE] transition">
                  Media Studio
                </Link>
              </li>
              <li>
                <Link href="/tools/pdf-editor" className="hover:text-[#536BCE] transition">
                  Canvas Editor
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources Column */}
          <div className="flex flex-col gap-3">
            <h4 className="text-xs font-semibold text-[#20232B] dark:text-[#F8FAFC] uppercase tracking-wider">
              Resources
            </h4>
            <ul className="text-xs sm:text-sm text-[#727783] dark:text-[#9DA3AE] flex flex-col gap-2.5">
              <li>
                <Link href="/pdf" className="hover:text-[#536BCE] transition">
                  Explore Tools
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-[#536BCE] transition">
                  Help Center & Plans
                </Link>
              </li>
              <li>
                <Link href="/#how-it-works" className="hover:text-[#536BCE] transition">
                  How It Works
                </Link>
              </li>
              {onOpenPrivacyInfo ? (
                <li>
                  <button
                    type="button"
                    onClick={onOpenPrivacyInfo}
                    className="hover:text-[#536BCE] text-left transition cursor-pointer"
                  >
                    Privacy Architecture
                  </button>
                </li>
              ) : (
                <li>
                  <Link href="/privacy" className="hover:text-[#536BCE] transition">
                    Privacy Architecture
                  </Link>
                </li>
              )}
            </ul>
          </div>

          {/* Company Column */}
          <div className="flex flex-col gap-3">
            <h4 className="text-xs font-semibold text-[#20232B] dark:text-[#F8FAFC] uppercase tracking-wider">
              Company
            </h4>
            <ul className="text-xs sm:text-sm text-[#727783] dark:text-[#9DA3AE] flex flex-col gap-2.5">
              <li>
                <Link href="/about" className="hover:text-[#536BCE] transition">
                  About
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-[#536BCE] transition">
                  Contact & Support
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-[#536BCE] transition">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-[#536BCE] transition">
                  Terms and Conditions
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Sub-Footer Bar */}
        <div className="pt-8 border-t border-[#E9EBF0] dark:border-[#222632] flex flex-col sm:flex-row items-center justify-between text-xs text-[#727783] dark:text-[#9DA3AE] gap-4">
          <div className="flex items-center gap-2">
            <span>© {currentYear} Gyanvatsala. All rights reserved.</span>
            <span>•</span>
            <span>gyanvatsala.in</span>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <Lock className="w-3.5 h-3.5 text-[#159B75]" />
            <span>Built for speed, privacy and document precision</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

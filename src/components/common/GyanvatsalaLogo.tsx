'use client';

import React from 'react';

interface GyanvatsalaLogoProps {
  className?: string;
  size?: number;
  showWordmark?: boolean;
  wordmarkClassName?: string;
  descriptor?: string;
}

export function GyanvatsalaLogo({
  className = '',
  size = 32,
  showWordmark = false,
  wordmarkClassName = 'text-[15px] font-bold tracking-tight text-[#20232B] dark:text-[#F8FAFC]',
  descriptor = 'Your Digital Document Workspace',
}: GyanvatsalaLogoProps) {
  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      <div className="relative flex items-center justify-center shrink-0">
        <svg
          width={size}
          height={size}
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="transition-transform duration-200 group-hover:scale-105"
        >
          {/* Deep Teal Base Squircle */}
          <rect
            width="32"
            height="32"
            rx="7.5"
            fill="#0D5C58"
            className="transition-colors"
          />

          {/* Folded Corner Notch Triangle (Mint Accent) */}
          <path
            d="M18.5 7.5V11.5C18.5 12.0523 18.9477 12.5 19.5 12.5H23.5L18.5 7.5Z"
            fill="#5EEAD4"
          />

          {/* Abstract G Monogram with Document Silhouette */}
          <path
            d="M18.5 7.5H12C9.51472 7.5 7.5 9.51472 7.5 12V20C7.5 22.4853 9.51472 24.5 12 24.5H20C22.4853 24.5 24.5 22.4853 24.5 20V15.5H16.5V18.2H21.5V19.8C21.5 20.7389 20.7389 21.5 19.8 21.5H12.2C11.2611 21.5 10.5 20.7389 10.5 19.8V12.2C10.5 11.2611 11.2611 10.5 12.2 10.5H18.5V7.5Z"
            fill="white"
          />

          {/* Subtle Document Accent Rule */}
          <path
            d="M12.5 13.8H16.5"
            stroke="#0D5C58"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {showWordmark && (
        <div className="flex flex-col text-left leading-none">
          <span className={wordmarkClassName}>Gyanvatsala</span>
          {descriptor && (
            <span className="text-[11px] text-[#727783] dark:text-[#9DA3AE] mt-1 font-normal tracking-normal truncate max-w-[210px]">
              {descriptor}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

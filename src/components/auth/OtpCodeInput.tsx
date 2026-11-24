'use client';

import React from 'react';

export const OTP_LENGTH = 4;

export function createEmptyOtp(length: number = OTP_LENGTH): string[] {
  return Array.from({ length }, () => '');
}

interface OtpCodeInputProps {
  value: string[];
  onChange: (next: string[]) => void;
  idPrefix: string;
  length?: number;
  className?: string;
  inputClassName: string;
}

/**
 * Shared accessible numeric OTP digit input grid supporting typing,
 * multi-digit mobile autofill, clipboard paste, and keyboard navigation.
 */
export function OtpCodeInput({
  value,
  onChange,
  idPrefix,
  length = OTP_LENGTH,
  className = 'flex items-center justify-center gap-2.5 sm:gap-3 pt-1',
  inputClassName,
}: OtpCodeInputProps) {
  const focusAt = (idx: number) => {
    document.getElementById(`${idPrefix}-${idx}`)?.focus();
  };

  const applyDigits = (digitsStr: string) => {
    const clean = digitsStr.replace(/\D/g, '').slice(0, length);
    if (!clean) return;
    const next = createEmptyOtp(length);
    for (let i = 0; i < length; i++) {
      next[i] = clean[i] || '';
    }
    onChange(next);
    focusAt(Math.min(clean.length, length - 1));
  };

  const handleChange = (index: number, raw: string) => {
    const digitsOnly = raw.replace(/\D/g, '');
    // Handle full-code autofill (e.g. OS one-time-code fill)
    if (digitsOnly.length >= length) {
      applyDigits(digitsOnly);
      return;
    }

    let digit = digitsOnly;
    if (digitsOnly.length > 1) {
      const prev = value[index];
      digit =
        prev && digitsOnly.startsWith(prev)
          ? digitsOnly.slice(-1)
          : digitsOnly[0];
    }

    const next = [...value];
    next[index] = digit;
    onChange(next);

    if (digit && index < length - 1) {
      focusAt(index + 1);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !value[index] && index > 0) {
      focusAt(index - 1);
    } else if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      focusAt(index - 1);
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      e.preventDefault();
      focusAt(index + 1);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    applyDigits(e.clipboardData.getData('text'));
  };

  return (
    <div className={className}>
      {value.slice(0, length).map((digit, idx) => (
        <input
          key={idx}
          id={`${idPrefix}-${idx}`}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete={idx === 0 ? 'one-time-code' : 'off'}
          autoFocus={idx === 0}
          maxLength={length}
          aria-label={`Verification digit ${idx + 1} of ${length}`}
          value={digit}
          onChange={(e) => handleChange(idx, e.target.value)}
          onKeyDown={(e) => handleKeyDown(idx, e)}
          onPaste={handlePaste}
          className={inputClassName}
        />
      ))}
    </div>
  );
}

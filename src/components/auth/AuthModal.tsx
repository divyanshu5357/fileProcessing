'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  X,
  Mail,
  Lock,
  Eye,
  EyeOff,
  User as UserIcon,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  KeyRound,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { GyanvatsalaLogo } from '@/components/common/GyanvatsalaLogo';
import { validatePasswordStrength } from '@/lib/passwordPolicy';

export function AuthModal() {
  const {
    isAuthModalOpen,
    closeAuthModal,
    signInWithGoogle,
    sendEmailOtp,
    verifyEmailOtp,
    signInWithPassword,
    signUpWithPassword,
    setInitialPassword,
    authModalInitialEmail,
    authModalNotice,
  } = useAuth();

  const [step, setStep] = useState<'options' | 'otp' | 'setPassword'>('options');
  const [authMethod, setAuthMethod] = useState<'password' | 'otp'>('otp');
  const [passwordMode, setPasswordMode] = useState<'signin' | 'signup'>('signin');
  const [otpPurpose, setOtpPurpose] = useState<'sign-in' | 'email-verification'>('sign-in');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [otpCode, setOtpCode] = useState('');
  const otpInputRefs = React.useRef<(HTMLInputElement | null)[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (authModalInitialEmail) {
      setEmail(authModalInitialEmail);
    }
  }, [authModalInitialEmail]);

  useEffect(() => {
    if (!isAuthModalOpen) {
      setStep('options');
      setOtpPurpose('sign-in');
      setError(null);
      setSuccessMsg(null);
      setPassword('');
      setConfirmPassword('');
      setOtpCode('');
    }
  }, [isAuthModalOpen]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (cooldown > 0) {
      timer = setInterval(() => setCooldown((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  if (!isAuthModalOpen) return null;

  const handleGoogleLogin = async () => {
    setError(null);
    setIsLoading(true);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      setError(err?.message || 'Failed to authenticate with Google. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    const cleanEmail = email.toLowerCase().trim();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    setError(null);
    setSuccessMsg(null);
    setIsLoading(true);
    try {
      const res = await sendEmailOtp(cleanEmail, 'sign-in');
      if (res.success) {
        setOtpPurpose('sign-in');
        setOtpCode('');
        setStep('otp');
        setCooldown(60);
        setSuccessMsg(`Verification code sent to ${cleanEmail}.`);
      } else {
        if (res.retryAfter) {
          setCooldown(res.retryAfter);
        }
        setError(res.message || 'Failed to send verification code. Please check your email.');
      }
    } catch (err: any) {
      setError(err?.message || 'Authentication service error. Try again shortly.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    const fullCode = otpCode.trim();
    if (fullCode.length < 4) {
      setError('Please enter a valid verification code.');
      return;
    }
    setError(null);
    setIsLoading(true);
    try {
      const res = await verifyEmailOtp(email.toLowerCase().trim(), fullCode, otpPurpose);
      if (!res.success) {
        setError(res.message || 'Invalid or expired verification code.');
      } else if (res.needsPasswordSetup) {
        setSuccessMsg('Email verified! Set a password for quick password sign-in anytime.');
        setStep('setPassword');
      }
    } catch (err: any) {
      setError(err?.message || 'Verification error. Please retry.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    const cleanEmail = email.toLowerCase().trim();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    if (passwordMode === 'signup') {
      const pwCheck = validatePasswordStrength(password, cleanEmail);
      if (!pwCheck.valid) {
        setError(pwCheck.message || 'Password does not meet security requirements.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
    } else if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setError(null);
    setSuccessMsg(null);
    setIsLoading(true);
    try {
      const res =
        passwordMode === 'signin'
          ? await signInWithPassword(cleanEmail, password)
          : await signUpWithPassword(name, cleanEmail, password);

      if (res.needsEmailVerification) {
        setOtpPurpose('email-verification');
        setOtpCode('');
        setCooldown(60);
        setStep('otp');
        setSuccessMsg(
          res.message || `Verification code sent to ${cleanEmail}.`
        );
      } else if (!res.success) {
        setError(res.message || 'Authentication failed. Please check your details.');
      }
    } catch (err: any) {
      setError(err?.message || 'Authentication error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveFirstPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    const pwCheck = validatePasswordStrength(password, email);
    if (!pwCheck.valid) {
      setError(pwCheck.message || 'Password does not meet security requirements.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setError(null);
    setIsLoading(true);
    try {
      const res = await setInitialPassword(password);
      if (res.success) {
        closeAuthModal();
      } else {
        setError(res.message || 'Could not save password.');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to save password.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (cooldown > 0 || isLoading) return;
    setError(null);
    setSuccessMsg(null);
    setIsLoading(true);
    try {
      const res = await sendEmailOtp(email.toLowerCase().trim(), otpPurpose);
      if (res.success) {
        setOtpCode('');
        setCooldown(60);
        setSuccessMsg('A new verification code has been sent to your email.');
      } else {
        if (res.retryAfter) {
          setCooldown(res.retryAfter);
        }
        setError(res.message || 'Failed to resend code.');
      }
    } catch {
      setError('Failed to resend verification code.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-md bg-white dark:bg-[#111827] border border-[#CBD5E1] dark:border-[#334155] rounded-2xl shadow-2xl p-6 sm:p-8 relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={closeAuthModal}
          aria-label="Close authentication modal"
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-5">
          <GyanvatsalaLogo size={44} className="mb-3" />
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#0F172A] dark:text-[#F8FAFC]">
            {step === 'otp'
              ? 'Verify Your Email'
              : step === 'setPassword'
              ? 'Set Your Password'
              : 'Welcome to Gyanvatsala'}
          </h2>
          <p className="text-xs sm:text-sm text-[#475569] dark:text-[#94A3B8] mt-1">
            {step === 'otp'
              ? `Enter the verification code sent to ${email} (expires in 5 min)`
              : step === 'setPassword'
              ? 'First-time setup: add a password so you can sign in with either Password or Email OTP.'
              : 'Sign in to access your saved files, document history & cloud workspace.'}
          </p>
        </div>

        {/* Optional Quota / Context Notice */}
        {authModalNotice && step === 'options' && (
          <div className="mb-4 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-300 text-xs flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>{authModalNotice}</span>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Success Alert */}
        {successMsg && !error && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {step === 'options' ? (
          <div className="space-y-4">
            {/* Google OAuth Button */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl bg-white dark:bg-[#1E293B] border border-[#CBD5E1] dark:border-[#334155] text-slate-800 dark:text-slate-100 font-semibold text-sm hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-all shadow-xs cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
              ) : (
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              )}
              <span>{isLoading ? 'Connecting to Google...' : 'Sign in with Google'}</span>
            </button>

            {/* Auth Method Tabs: OTP vs Password */}
            <div className="grid grid-cols-2 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  setAuthMethod('otp');
                  setError(null);
                  setSuccessMsg(null);
                }}
                className={`py-2 rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  authMethod === 'otp'
                    ? 'bg-white dark:bg-[#111827] text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Mail className="w-3.5 h-3.5" />
                <span>OTP</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMethod('password');
                  setError(null);
                  setSuccessMsg(null);
                }}
                className={`py-2 rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  authMethod === 'password'
                    ? 'bg-white dark:bg-[#111827] text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Password</span>
              </button>
            </div>

            {authMethod === 'otp' ? (
              /* Email OTP Form */
              <form onSubmit={handleSendOtp} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#CBD5E1] dark:border-[#334155] bg-slate-50 dark:bg-[#0B1120] text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  disabled={isLoading}
                  className="w-full py-2.5 text-xs font-bold flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Sending Code...</span>
                    </>
                  ) : (
                    <>
                      <span>Send Code</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </Button>
              </form>
            ) : (
              /* Password Sign In / First-Time Password Registration */
              <form onSubmit={handlePasswordSubmit} className="space-y-3">
                {passwordMode === 'signup' && (
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Full Name
                    </label>
                    <div className="relative">
                      <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Your Name"
                        className="w-full pl-10 pr-4 py-2 rounded-xl border border-[#CBD5E1] dark:border-[#334155] bg-slate-50 dark:bg-[#0B1120] text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full pl-10 pr-4 py-2 rounded-xl border border-[#CBD5E1] dark:border-[#334155] bg-slate-50 dark:bg-[#0B1120] text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={8}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={passwordMode === 'signup' ? 'Create 8+ char password' : 'Enter password'}
                      className="w-full pl-10 pr-10 py-2 rounded-xl border border-[#CBD5E1] dark:border-[#334155] bg-slate-50 dark:bg-[#0B1120] text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {passwordMode === 'signup' && (
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        minLength={8}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Repeat password"
                        className="w-full pl-10 pr-4 py-2 rounded-xl border border-[#CBD5E1] dark:border-[#334155] bg-slate-50 dark:bg-[#0B1120] text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                      />
                    </div>
                  </div>
                )}

                <Button
                  type="submit"
                  variant="primary"
                  disabled={isLoading}
                  className="w-full py-2.5 text-xs font-bold flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>{passwordMode === 'signin' ? 'Signing In...' : 'Creating Account...'}</span>
                    </>
                  ) : (
                    <>
                      <span>{passwordMode === 'signin' ? 'Sign In with Password' : 'Create Account & Sign In'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </Button>

                <div className="flex items-center justify-between text-[11px] pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setPasswordMode((prev) => (prev === 'signin' ? 'signup' : 'signin'));
                      setError(null);
                    }}
                    className="text-blue-600 dark:text-blue-400 hover:underline font-semibold cursor-pointer"
                  >
                    {passwordMode === 'signin'
                      ? 'First time? Create account with password'
                      : 'Already have a password? Sign In'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMethod('otp');
                      setError(null);
                    }}
                    className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 underline cursor-pointer"
                  >
                    Use OTP instead
                  </button>
                </div>
              </form>
            )}
          </div>
        ) : step === 'otp' ? (
          /* Step 2: Verification Code (4 spaced input boxes) */
          <form onSubmit={handleVerifyOtp} className="space-y-5">
            <div className="space-y-3">
              <label
                htmlFor="otp-digit-0"
                className="text-xs font-semibold text-slate-700 dark:text-slate-300 block text-center"
              >
                Verification Code
              </label>
              <div className="flex items-center justify-center gap-3 sm:gap-4">
                {[0, 1, 2, 3].map((idx) => (
                  <input
                    key={idx}
                    id={`otp-digit-${idx}`}
                    ref={(el) => {
                      otpInputRefs.current[idx] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    autoComplete={idx === 0 ? 'one-time-code' : 'off'}
                    autoFocus={idx === 0}
                    maxLength={1}
                    aria-label={`Verification code digit ${idx + 1}`}
                    value={otpCode[idx] || ''}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/\D/g, '');
                      if (!raw) {
                        const chars = otpCode.padEnd(4, ' ').split('');
                        chars[idx] = ' ';
                        setOtpCode(chars.join('').replace(/\s+$/g, '').replace(/\s/g, ''));
                        return;
                      }
                      if (raw.length > 1) {
                        const pasted = raw.slice(0, 4);
                        setOtpCode(pasted);
                        const nextFocus = Math.min(3, pasted.length - 1);
                        otpInputRefs.current[nextFocus]?.focus();
                        return;
                      }
                      const digits = Array.from({ length: 4 }, (_, i) => otpCode[i] || '');
                      digits[idx] = raw;
                      setOtpCode(digits.join(''));
                      if (idx < 3) {
                        otpInputRefs.current[idx + 1]?.focus();
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Backspace') {
                        const digits = Array.from({ length: 4 }, (_, i) => otpCode[i] || '');
                        if (digits[idx]) {
                          digits[idx] = '';
                          setOtpCode(digits.join(''));
                        } else if (idx > 0) {
                          digits[idx - 1] = '';
                          setOtpCode(digits.join(''));
                          otpInputRefs.current[idx - 1]?.focus();
                        }
                        e.preventDefault();
                      } else if (e.key === 'ArrowLeft' && idx > 0) {
                        otpInputRefs.current[idx - 1]?.focus();
                      } else if (e.key === 'ArrowRight' && idx < 3) {
                        otpInputRefs.current[idx + 1]?.focus();
                      }
                    }}
                    onPaste={(e) => {
                      e.preventDefault();
                      const pasted = e.clipboardData
                        .getData('text')
                        .replace(/\D/g, '')
                        .slice(0, 4);
                      if (!pasted) return;
                      setOtpCode(pasted);
                      const focusIdx = Math.min(3, pasted.length - 1);
                      otpInputRefs.current[focusIdx]?.focus();
                    }}
                    className="w-12 h-14 sm:w-14 sm:h-16 text-center text-xl sm:text-2xl font-mono font-bold rounded-xl border border-[#CBD5E1] dark:border-[#334155] bg-slate-50 dark:bg-[#0B1120] text-blue-600 dark:text-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  />
                ))}
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              disabled={isLoading || otpCode.trim().length < 4}
              className="w-full py-3 text-sm font-bold flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying Session...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Confirm & Continue</span>
                </>
              )}
            </Button>

            {/* Resend & Back controls */}
            <div className="flex items-center justify-between text-xs pt-1">
              <button
                type="button"
                onClick={() => {
                  setStep('options');
                  setOtpPurpose('sign-in');
                  setOtpCode('');
                  setError(null);
                  setSuccessMsg(null);
                }}
                className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition underline underline-offset-4 cursor-pointer"
              >
                Change email
              </button>

              <button
                type="button"
                disabled={cooldown > 0 || isLoading}
                onClick={handleResendOtp}
                className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 hover:underline disabled:text-slate-400 disabled:no-underline font-semibold cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                <span>{cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend Code'}</span>
              </button>
            </div>
          </form>
        ) : (
          /* Step 3: First-Time User Password Setup */
          <form onSubmit={handleSaveFirstPassword} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                New Password (8+ characters)
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a strong password"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-[#CBD5E1] dark:border-[#334155] bg-slate-50 dark:bg-[#0B1120] text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm password"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#CBD5E1] dark:border-[#334155] bg-slate-50 dark:bg-[#0B1120] text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              disabled={isLoading}
              className="w-full py-2.5 text-sm font-bold flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving Password...</span>
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>Save Password & Enter Workspace</span>
                </>
              )}
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={closeAuthModal}
                className="text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 underline underline-offset-4 cursor-pointer"
              >
                Skip for now (set later in Settings)
              </button>
            </div>
          </form>
        )}

        {/* Terms and Conditions Footnote */}
        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
          <p className="text-[11px] text-slate-400">
            By authenticating, you agree to our{' '}
            <Link
              href="/terms"
              onClick={closeAuthModal}
              className="text-slate-600 dark:text-slate-300 hover:underline"
            >
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link
              href="/privacy"
              onClick={closeAuthModal}
              className="text-slate-600 dark:text-slate-300 hover:underline"
            >
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}

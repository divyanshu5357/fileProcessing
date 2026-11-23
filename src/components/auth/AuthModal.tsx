'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  X,
  Mail,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  Lock,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { GyanvatsalaLogo } from '@/components/common/GyanvatsalaLogo';

export function AuthModal() {
  const {
    isAuthModalOpen,
    closeAuthModal,
    signInWithGoogle,
    signInWithPassword,
    sendEmailOtp,
    verifyEmailOtp,
    authModalInitialEmail,
  } = useAuth();

  const [step, setStep] = useState<'options' | 'otp'>('options');
  const [authMode, setAuthMode] = useState<'password' | 'otp'>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '', '', '']);
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
      const res = await sendEmailOtp(cleanEmail);
      if (res.success) {
        setStep('otp');
        setCooldown(60);
        setSuccessMsg(`We sent an 8-digit verification code to ${cleanEmail}`);
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

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    const cleanEmail = email.toLowerCase().trim();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }
    setError(null);
    setIsLoading(true);
    try {
      const res = await signInWithPassword(cleanEmail, password);
      if (!res.success) {
        setError(res.message || 'Invalid email or password.');
      }
    } catch (err: any) {
      setError(err?.message || 'Login failed. Please retry.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (index: number, val: string) => {
    if (val.length > 1) {
      val = val[val.length - 1];
    }
    const nextOtp = [...otp];
    nextOtp[index] = val;
    setOtp(nextOtp);

    // Auto-focus next input
    if (val && index < 7) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-input-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').trim().replace(/\D/g, '').slice(0, 8);
    if (pasted.length > 0) {
      const nextOtp = ['', '', '', '', '', '', '', ''];
      for (let i = 0; i < 8; i++) {
        nextOtp[i] = pasted[i] || '';
      }
      setOtp(nextOtp);
      const targetIdx = Math.min(pasted.length, 7);
      document.getElementById(`otp-input-${targetIdx}`)?.focus();
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    const fullCode = otp.join('').trim();
    if (fullCode.length !== 8) {
      setError('Please enter the complete 8-digit verification code.');
      return;
    }
    setError(null);
    setIsLoading(true);
    try {
      const res = await verifyEmailOtp(email.toLowerCase().trim(), fullCode);
      if (!res.success) {
        setError(res.message || 'Invalid or expired verification code.');
      }
    } catch (err: any) {
      setError(err?.message || 'Verification error. Please retry.');
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
      const res = await sendEmailOtp(email.toLowerCase().trim());
      if (res.success) {
        setCooldown(60);
        setSuccessMsg('A new 8-digit verification code has been dispatched to your email.');
      } else {
        if (res.retryAfter) {
          setCooldown(res.retryAfter);
        }
        setError(res.message || 'Failed to resend code.');
      }
    } catch (e: any) {
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
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <GyanvatsalaLogo size={44} className="mb-3" />
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#0F172A] dark:text-[#F8FAFC]">
            {step === 'options' ? 'Welcome to Gyanvatsala' : 'Verify Your Email'}
          </h2>
          <p className="text-xs sm:text-sm text-[#475569] dark:text-[#94A3B8] mt-1">
            {step === 'options'
              ? 'Your Digital Document Workspace — Access cloud storage & persistent workspaces.'
              : `Enter the 8-digit code sent to ${email} (expires in 5 min)`}
          </p>
        </div>

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
              className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-white dark:bg-[#1E293B] border border-[#CBD5E1] dark:border-[#334155] text-slate-800 dark:text-slate-100 font-semibold text-sm hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-all shadow-xs cursor-pointer disabled:opacity-50"
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

            {/* Divider */}
            <div className="relative flex items-center justify-center my-3">
              <div className="border-t border-[#CBD5E1] dark:border-[#334155] w-full" />
              <span className="bg-white dark:bg-[#111827] px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Or Continue With Email
              </span>
            </div>

            {/* Auth Mode Switcher */}
            <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-slate-100 dark:bg-[#0B1120] border border-[#CBD5E1] dark:border-[#334155] text-xs font-semibold">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('password');
                  setError(null);
                }}
                className={`py-1.5 rounded-lg transition text-center ${
                  authMode === 'password'
                    ? 'bg-white dark:bg-[#1E293B] text-blue-600 dark:text-blue-400 font-bold shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Password Login
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('otp');
                  setError(null);
                }}
                className={`py-1.5 rounded-lg transition text-center ${
                  authMode === 'otp'
                    ? 'bg-white dark:bg-[#1E293B] text-blue-600 dark:text-blue-400 font-bold shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Email Code (OTP)
              </button>
            </div>

            {authMode === 'password' ? (
              /* Password Form */
              <form onSubmit={handlePasswordLogin} className="space-y-3">
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

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-[#CBD5E1] dark:border-[#334155] bg-slate-50 dark:bg-[#0B1120] text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
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
                      <span>Signing In...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In with Password</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </Button>
              </form>
            ) : (
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
                      <span>Dispatching Code...</span>
                    </>
                  ) : (
                    <>
                      <span>Continue with Email Code</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </Button>
              </form>
            )}
          </div>
        ) : (
          /* Step 2: 8-Digit OTP Verification */
          <form onSubmit={handleVerifyOtp} className="space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block text-center">
                8-Digit Security Code
              </label>
              <div className="flex items-center justify-center gap-1 sm:gap-1.5 pt-1">
                {otp.map((digit, idx) => (
                  <React.Fragment key={idx}>
                    {idx === 4 && <div className="w-1.5 h-0.5 bg-slate-300 dark:bg-slate-700 mx-0.5" />}
                    <input
                      id={`otp-input-${idx}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                      onPaste={handlePaste}
                      className="w-8 h-11 sm:w-10 sm:h-12 text-center text-lg sm:text-xl font-mono font-bold rounded-xl border border-[#CBD5E1] dark:border-[#334155] bg-slate-50 dark:bg-[#0B1120] text-blue-600 dark:text-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    />
                  </React.Fragment>
                ))}
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              disabled={isLoading || otp.join('').trim().length !== 8}
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
                  <span>Confirm & Enter Workspace</span>
                </>
              )}
            </Button>

            {/* Resend & Back controls */}
            <div className="flex items-center justify-between text-xs pt-1">
              <button
                type="button"
                onClick={() => {
                  setStep('options');
                  setOtp(['', '', '', '', '', '', '', '']);
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

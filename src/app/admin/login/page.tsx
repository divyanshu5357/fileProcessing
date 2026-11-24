'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { GyanvatsalaLogo } from '@/components/common/GyanvatsalaLogo';
import { useAuth } from '@/context/AuthContext';
import {
  ShieldCheck,
  Lock,
  ArrowRight,
  AlertCircle,
  Loader2,
  Mail,
  ArrowLeft,
  KeyRound,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function AdminLoginPage() {
  const {
    user,
    isAuthenticated,
    isLoading: isAuthLoading,
    signInWithGoogle,
    sendEmailOtp,
    verifyEmailOtp,
    signOut,
  } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState<'options' | 'otp'>('options');
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  const isAdminOrSupport = user?.role === 'admin' || user?.role === 'support';

  // Automatically redirect authenticated admins to /admin
  useEffect(() => {
    if (!isAuthLoading && isAuthenticated && user) {
      if (isAdminOrSupport) {
        router.push('/admin');
      }
    }
  }, [isAuthLoading, isAuthenticated, user, isAdminOrSupport, router]);

  // Cooldown timer for resending OTP
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (cooldown > 0) {
      timer = setInterval(() => setCooldown((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleGoogleLogin = async () => {
    setError(null);
    setIsLoading(true);
    try {
      await signInWithGoogle('/admin');
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
      setError('Please enter a valid administrator email.');
      return;
    }

    setError(null);
    setIsLoading(true);
    try {
      const res = await sendEmailOtp(cleanEmail);
      if (res.success) {
        setOtpCode('');
        setStep('otp');
        setCooldown(60);
      } else {
        if (res.retryAfter) {
          setCooldown(res.retryAfter);
        }
        setError(res.message || 'Failed to dispatch verification code. Please try again.');
      }
    } catch (err: any) {
      setError(err?.message || 'Authentication service error. Try again shortly.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (cooldown > 0 || isLoading) return;
    setError(null);
    setIsLoading(true);
    try {
      const res = await sendEmailOtp(email.toLowerCase().trim());
      if (res.success) {
        setOtpCode('');
        setCooldown(60);
      } else {
        if (res.retryAfter) {
          setCooldown(res.retryAfter);
        }
        setError(res.message || 'Failed to resend code.');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to dispatch code.');
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
      const res = await verifyEmailOtp(email.toLowerCase().trim(), fullCode);
      if (res.success) {
        router.push('/admin');
      } else {
        setError(res.message || 'Invalid or expired verification code.');
      }
    } catch (err: any) {
      setError(err?.message || 'Verification error. Please retry.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0D1017] text-white">
        <Loader2 className="w-6 h-6 animate-spin text-[#536BCE]" />
      </div>
    );
  }

  // If signed in as an ordinary user, show access restriction banner
  if (isAuthenticated && !isAdminOrSupport) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#0D1017] text-[#F8FAFC]">
        <div className="max-w-md w-full p-8 rounded-3xl bg-[#111622] border border-[#222632] text-center space-y-4 shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
            <Lock className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h1 className="text-xl font-bold">Standard Account Detected</h1>
            <p className="text-xs text-[#9DA3AE] leading-relaxed">
              You are signed in as <strong className="text-white">{user?.email}</strong>. This account does not possess administrator privileges.
            </p>
          </div>
          <div className="pt-3 flex flex-col gap-2">
            <Link
              href="/workspace"
              className="w-full py-2.5 rounded-xl bg-[#536BCE] hover:bg-[#4157B5] text-white text-xs font-semibold flex items-center justify-center gap-2"
            >
              <span>Continue to Workspace</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <button
              type="button"
              onClick={() => signOut()}
              className="w-full py-2 text-xs text-[#9DA3AE] hover:text-white transition cursor-pointer"
            >
              Sign out & use another account
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#0D1017] text-[#F8FAFC]">
      <div className="max-w-md w-full p-8 rounded-3xl bg-[#111622] border border-[#222632] shadow-2xl space-y-6 relative overflow-hidden">
        {/* Subtle brand accent glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-[#536BCE] rounded-full shadow-[0_0_20px_#536BCE]" />

        {/* Brand Header */}
        <div className="flex flex-col items-center text-center space-y-2">
          <GyanvatsalaLogo size={42} showWordmark={false} />
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center justify-center gap-2">
              <span>Gyanvatsala Admin</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#536BCE]/20 text-[#93A5F5] border border-[#536BCE]/30">
                Staff
              </span>
            </h1>
            <p className="text-xs text-[#9DA3AE] mt-1">
              Secure administrator access
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {step === 'options' ? (
          <div className="space-y-4">
            {/* Continue with Google */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-[#1D2335] hover:bg-[#252D44] border border-[#28314A] text-white text-sm font-semibold transition cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin text-[#536BCE]" />
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
              <span>{isLoading ? 'Connecting to Google...' : 'Continue with Google'}</span>
            </button>

            {/* Divider */}
            <div className="relative flex items-center justify-center my-2">
              <div className="border-t border-[#222632] w-full" />
              <span className="bg-[#111622] px-3 text-[10px] font-bold uppercase tracking-wider text-[#727783]">
                Authorized Staff Email
              </span>
            </div>

            {/* Email Form */}
            <form onSubmit={handleSendOtp} className="space-y-3">
              <div className="relative">
                <Mail className="w-4 h-4 text-[#727783] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@gyanvatsala.in"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#28314A] bg-[#0D1017] text-sm text-white placeholder-[#727783] focus:outline-none focus:ring-2 focus:ring-[#536BCE]"
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                disabled={isLoading}
                className="w-full py-2.5 text-xs font-bold bg-[#536BCE] hover:bg-[#4157B5] text-white flex items-center justify-center gap-2"
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
          </div>
        ) : (
          /* Step 2: OTP Verification */
          <form onSubmit={handleVerifyOtp} className="space-y-5">
            <div className="space-y-2">
              <label
                htmlFor="admin-otp-input"
                className="text-xs font-semibold text-[#CBD5E1] block text-center"
              >
                Enter Admin Passcode
              </label>
              <p className="text-[11px] text-[#9DA3AE] text-center">
                Verification code sent to <span className="text-white font-mono">{email}</span> (expires in 5 min)
              </p>
              <input
                id="admin-otp-input"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="one-time-code"
                autoFocus
                maxLength={8}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 8))}
                placeholder="Enter verification code"
                className="w-full h-12 sm:h-14 text-center text-xl sm:text-2xl font-mono font-bold tracking-[0.4em] rounded-xl border border-[#28314A] bg-[#0D1017] text-[#93A5F5] focus:outline-none focus:ring-2 focus:ring-[#536BCE] transition"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              disabled={isLoading || otpCode.trim().length < 4}
              className="w-full py-2.5 text-xs font-bold bg-[#536BCE] hover:bg-[#4157B5] text-white flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Verifying Code...</span>
                </>
              ) : (
                <span>Verify & Open Dashboard</span>
              )}
            </Button>

            <div className="flex items-center justify-between text-xs pt-1">
              <button
                type="button"
                onClick={() => {
                  setStep('options');
                  setOtpCode('');
                  setError(null);
                }}
                className="text-[#9DA3AE] hover:text-white transition"
              >
                &larr; Back to login options
              </button>

              <button
                type="button"
                disabled={cooldown > 0 || isLoading}
                onClick={handleResendOtp}
                className="flex items-center gap-1 text-[#93A5F5] hover:text-white disabled:text-[#727783] font-medium transition cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                <span>{cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend Code'}</span>
              </button>
            </div>
          </form>
        )}

        {/* Security Notice Footer */}
        <div className="pt-4 border-t border-[#222632] flex flex-col items-center gap-1.5 text-center text-[10px] text-[#727783]">
          <div className="flex items-center gap-1 text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Strict Role-Based Access Control</span>
          </div>
          <p>
            Access is restricted to authorized personnel. Unofficial attempts are logged.
          </p>
        </div>
      </div>
    </div>
  );
}

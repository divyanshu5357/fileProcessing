'use client';

import React, { useState, useEffect } from 'react';
import { Crown, Clock, X, ShieldCheck, ArrowRight, Loader2, Sparkles, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuth, PlanTier } from '@/context/AuthContext';
import { openRazorpayCheckout } from '@/lib/razorpayClient';
import { DownloadAllowanceResult } from '@/lib/downloadQuotaClient';

interface DownloadLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  limitInfo: DownloadAllowanceResult | null;
  onUpgradeSuccess?: () => void;
}

function formatDurationDisplay(seconds: number): string {
  const totalMinutes = Math.max(1, Math.ceil(seconds / 60));
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  if (hours > 0 && mins > 0) return `${hours}h ${mins}m`;
  if (hours > 0) return `${hours}h`;
  return `${mins}m`;
}

const PREMIUM_PLANS: {
  id: 'prime' | 'prime_plus' | 'prime_ultra';
  tier: PlanTier;
  name: string;
  price: string;
  note: string;
  recommended?: boolean;
}[] = [
  {
    id: 'prime',
    tier: 'Prime',
    name: 'Prime',
    price: '₹49/mo',
    note: 'Unlimited downloads • 25 MB files',
  },
  {
    id: 'prime_plus',
    tier: 'PrimePlus',
    name: 'PrimePlus',
    price: '₹99/mo',
    note: 'Unlimited exports • 50 MB files',
    recommended: true,
  },
  {
    id: 'prime_ultra',
    tier: 'PrimeUltra',
    name: 'PrimeUltra',
    price: '₹249/mo',
    note: 'Unlimited team tools • 100 MB files',
  },
];

export function DownloadLimitModal({
  isOpen,
  onClose,
  limitInfo,
  onUpgradeSuccess,
}: DownloadLimitModalProps) {
  const { user, isAuthenticated, openAuthModal, updateUserPlan } = useAuth();
  const [selectedPlanId, setSelectedPlanId] = useState<'prime' | 'prime_plus' | 'prime_ultra'>('prime_plus');
  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const [statusNote, setStatusNote] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [paymentsEnabled, setPaymentsEnabled] = useState(false);
  const [livePlans, setLivePlans] = useState(PREMIUM_PLANS);

  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    fetch('/api/subscriptions/plans', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!active || !data) return;
        if (typeof data.paymentsEnabled === 'boolean') {
          setPaymentsEnabled(data.paymentsEnabled);
        }
        if (Array.isArray(data.plans)) {
          const paid = data.plans.filter((p: { id?: string }) => p.id && p.id !== 'free');
          if (paid.length > 0) {
            setLivePlans(
              paid.map((p: { id: string; tier: PlanTier; name: string; priceMonthlyInr: number; maxFileSizeBytes: number; isRecommended?: boolean }) => ({
                id: p.id as 'prime' | 'prime_plus' | 'prime_ultra',
                tier: p.tier,
                name: p.name,
                price: `₹${p.priceMonthlyInr}/mo`,
                note: `Unlimited exports • ${Math.max(1, Math.round((p.maxFileSizeBytes || 26214400) / (1024 * 1024)))} MB files`,
                recommended: Boolean(p.isRecommended),
              }))
            );
          }
        }
      })
      .catch(() => {});

    const timer = setInterval(() => {
      setElapsedSeconds((s) => s + 60);
    }, 60000);
    return () => {
      active = false;
      clearInterval(timer);
      setElapsedSeconds(0);
    };
  }, [isOpen, limitInfo]);

  if (!isOpen || !limitInfo) return null;

  const isFileSizeIssue = limitInfo.reason === 'file_size';
  const isSpaceIssue = limitInfo.reason === 'space_6h';
  const isDailyIssue = limitInfo.reason === 'daily_limit';
  const isVerifyFailed = limitInfo.reason === 'verification_failed';
  const remainingSeconds = Math.max(
    0,
    (limitInfo.retryAfterSeconds || 0) - elapsedSeconds
  );
  const liveWaitText =
    remainingSeconds > 0 ? formatDurationDisplay(remainingSeconds) : limitInfo.waitLabel || '6h';

  const handleBuyPremium = async () => {
    if (!paymentsEnabled) {
      setStatusNote('Paid plan upgrades are currently paused (Coming Soon). Your free allowance refreshes automatically.');
      return;
    }

    if (!isAuthenticated || !user) {
      openAuthModal(
        undefined,
        'Sign in to upgrade to Premium and download your edited file immediately.'
      );
      return;
    }

    const plan = livePlans.find((p) => p.id === selectedPlanId) || livePlans[1] || PREMIUM_PLANS[1];
    setCheckoutBusy(true);
    setStatusNote(null);

    try {
      const orderRes = await fetch('/api/subscriptions/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan_id: plan.id, billing_cycle: 'monthly' }),
      });

      const orderData = await orderRes.json().catch(() => ({}));
      if (!orderRes.ok || !orderData?.orderId) {
        throw new Error(orderData?.error || 'Could not start upgrade checkout.');
      }

      await openRazorpayCheckout({
        orderId: orderData.orderId,
        amount: orderData.amount,
        currency: orderData.currency,
        keyId: orderData.keyId,
        planName: plan.name,
        user: { name: user.name, email: user.email },
        onSuccess: async (paymentResult) => {
          setStatusNote('Verifying payment and unlocking your download...');
          try {
            const verifyRes = await fetch('/api/subscriptions/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                ...paymentResult,
                plan_id: plan.id,
                billing_cycle: 'monthly',
              }),
            });
            const verifyData = await verifyRes.json().catch(() => ({}));
            if (verifyRes.ok && verifyData.status === 'success') {
              updateUserPlan(plan.tier);
              onClose();
              onUpgradeSuccess?.();
            } else {
              setStatusNote(verifyData.error || 'Verification failed. Please contact support.');
            }
          } catch {
            updateUserPlan(plan.tier);
            onClose();
            onUpgradeSuccess?.();
          }
        },
        onDismiss: () => {
          setCheckoutBusy(false);
        },
      });
    } catch (err: unknown) {
      setStatusNote(err instanceof Error ? err.message : 'Payment initialization failed.');
    } finally {
      setCheckoutBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[80] bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-3xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-5 bg-gradient-to-r from-amber-500/10 via-blue-600/10 to-indigo-600/10 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              {isFileSizeIssue ? <ShieldCheck className="w-5 h-5" /> : <Crown className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-tight">
                {isVerifyFailed
                  ? 'Download Verification Required'
                  : isFileSizeIssue
                  ? 'File Exceeds Standard Space'
                  : isSpaceIssue
                  ? 'Space Allowance Reached'
                  : isDailyIssue
                  ? 'Daily Limit Exceeded'
                  : 'Download Limit Exceeded'}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                Your edited file is ready — upgrade to Premium to download it immediately.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-start gap-3">
            <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              {!isFileSizeIssue && !isVerifyFailed && (
                <p className="font-bold text-slate-900 dark:text-white mb-0.5">
                  Auto-refreshes in {liveWaitText}
                </p>
              )}
              <p>
                {limitInfo.message ||
                  'Your current allowance is exhausted. Wait for the 6-hour refresh or upgrade to Premium to download your edited file immediately.'}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Select Premium Plan to Unlock Download
              </span>
              <a
                href="/pricing"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
              >
                Compare plans <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {livePlans.map((plan) => {
                const active = selectedPlanId === plan.id;
                return (
                  <button
                    key={plan.id}
                    type="button"
                    onClick={() => setSelectedPlanId(plan.id)}
                    className={`p-3 rounded-2xl border text-left transition cursor-pointer relative ${
                      active
                        ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/40 ring-1 ring-blue-600'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-400'
                    }`}
                  >
                    {plan.recommended && (
                      <span className="absolute -top-2 right-2 text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-600 text-white">
                        Best
                      </span>
                    )}
                    <p className="text-xs font-black text-slate-900 dark:text-white">{plan.name}</p>
                    <p className="text-sm font-extrabold text-blue-600 dark:text-blue-400 mt-0.5">
                      {plan.price}
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                      {plan.note}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {statusNote && (
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-xs font-semibold text-amber-800 dark:text-amber-200">
              {statusNote}
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-1">
            <Button
              variant="primary"
              size="lg"
              disabled={checkoutBusy || !paymentsEnabled}
              onClick={handleBuyPremium}
              className="w-full sm:flex-1 font-extrabold gap-2 justify-center"
            >
              {checkoutBusy ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Connecting Checkout...</span>
                </>
              ) : !paymentsEnabled ? (
                <>
                  <Crown className="w-4 h-4" />
                  <span>Paid Upgrades Coming Soon</span>
                </>
              ) : (
                <>
                  <Crown className="w-4 h-4" />
                  <span>
                    {isAuthenticated ? 'Buy Premium & Download' : 'Sign In & Buy Premium'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>

            <Button
              variant="outline"
              size="lg"
              onClick={onClose}
              className="w-full sm:w-auto text-xs font-semibold"
            >
              Wait {liveWaitText}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

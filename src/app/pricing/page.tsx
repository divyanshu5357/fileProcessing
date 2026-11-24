'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Check,
  Sparkles,
  ShieldCheck,
  Clock,
  HardDrive,
  Download,
  Lock,
  Info,
  CreditCard,
  Loader2,
  Sliders,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuth, PlanTier } from '@/context/AuthContext';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { openRazorpayCheckout } from '@/lib/razorpayClient';

interface LivePlanDto {
  id: string;
  slug: string;
  tier: PlanTier;
  name: string;
  badge: string;
  description: string;
  priceMonthlyInr: number;
  priceYearlyInr: number;
  storageLimitBytes: number;
  retentionDays: number;
  maxFileSizeBytes: number;
  features: string[];
  isRecommended: boolean;
  isActive: boolean;
  isPaid: boolean;
}

const FALLBACK_PLANS: LivePlanDto[] = [
  {
    id: 'free',
    slug: 'free',
    tier: 'Free',
    name: 'Free Starter',
    badge: 'Zero Cost',
    description: 'Ideal for everyday document tasks, in-browser privacy, and fast conversions.',
    priceMonthlyInr: 0,
    priceYearlyInr: 0,
    storageLimitBytes: 15 * 1024 * 1024,
    retentionDays: 7,
    maxFileSizeBytes: 15 * 1024 * 1024,
    features: [
      '15 MB Cloud Storage',
      '7-day automatic data retention',
      '100% In-Browser Private Mode (Zero Uploads)',
      'Standard conversion queue',
      'Direct local download before expiry',
      'Full access to all PDF & Image tools',
    ],
    isRecommended: false,
    isActive: true,
    isPaid: false,
  },
  {
    id: 'prime',
    slug: 'prime',
    tier: 'Prime',
    name: 'Prime',
    badge: 'Starter Pro',
    description: 'Double retention and storage for active students and freelancers.',
    priceMonthlyInr: 49,
    priceYearlyInr: 499,
    storageLimitBytes: 50 * 1024 * 1024,
    retentionDays: 14,
    maxFileSizeBytes: 25 * 1024 * 1024,
    features: [
      '50 MB Cloud Storage',
      '14-day automatic data retention',
      'Priority queue processing',
      '48h & 24h expiration email alerts',
      'Unlimited heavy PDF tool exports',
      'Faster image & PDF compression',
    ],
    isRecommended: false,
    isActive: true,
    isPaid: true,
  },
  {
    id: 'prime_plus',
    slug: 'prime_plus',
    tier: 'PrimePlus',
    name: 'PrimePlus',
    badge: 'Most Popular',
    description: '30-day retention and high-speed parallel processing for power users.',
    priceMonthlyInr: 99,
    priceYearlyInr: 999,
    storageLimitBytes: 100 * 1024 * 1024,
    retentionDays: 30,
    maxFileSizeBytes: 50 * 1024 * 1024,
    features: [
      '100 MB Cloud Storage',
      '30-day extended data retention',
      'High-speed parallel workers',
      'Batch PDF Assembler & Editor',
      'Automated expiration warnings',
      'Priority email support',
      'Unlimited local exports',
    ],
    isRecommended: true,
    isActive: true,
    isPaid: true,
  },
  {
    id: 'prime_ultra',
    slug: 'prime_ultra',
    tier: 'PrimeUltra',
    name: 'PrimeUltra',
    badge: 'Best Value',
    description: 'Long-term 1-year archival and maximum concurrency for professional teams.',
    priceMonthlyInr: 249,
    priceYearlyInr: 2499,
    storageLimitBytes: 500 * 1024 * 1024,
    retentionDays: 365,
    maxFileSizeBytes: 100 * 1024 * 1024,
    features: [
      '500 MB Enterprise Cloud Storage',
      '365-day (1 full year) retention',
      'Unlimited batch conversions',
      'Dedicated worker concurrency',
      'VIP customer support',
      'Advance data export packages',
    ],
    isRecommended: false,
    isActive: true,
    isPaid: true,
  },
];

function formatMbLabel(bytes: number): string {
  const mb = Math.max(1, Math.round(bytes / (1024 * 1024)));
  return `${mb} MB`;
}

function formatInr(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`;
}

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const { user, updateUserPlan, openAuthModal } = useAuth();

  const [plans, setPlans] = useState<LivePlanDto[]>(FALLBACK_PLANS);
  const [paymentsEnabled, setPaymentsEnabled] = useState(false);
  const [announcementBanner, setAnnouncementBanner] = useState('');
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [freeLoading, setFreeLoading] = useState(false);
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);

  const isAdminUser = user?.role === 'admin' || user?.role === 'support';

  useEffect(() => {
    let active = true;
    fetch('/api/subscriptions/plans', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!active || !data) return;
        if (Array.isArray(data.plans) && data.plans.length > 0) {
          setPlans(data.plans);
        }
        if (typeof data.paymentsEnabled === 'boolean') {
          setPaymentsEnabled(data.paymentsEnabled);
        }
        if (typeof data.announcementBanner === 'string') {
          setAnnouncementBanner(data.announcementBanner);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const handleSelectPlan = async (plan: LivePlanDto) => {
    if (isAdminUser) {
      return;
    }

    if (!user) {
      openAuthModal();
      return;
    }

    if (user.plan === plan.tier) {
      setNoticeMessage(`You are already subscribed to the ${plan.name} plan.`);
      setTimeout(() => setNoticeMessage(null), 4000);
      return;
    }

    if (!plan.isPaid) {
      setFreeLoading(true);
      try {
        const res = await fetch('/api/subscriptions/activate-free', {
          method: 'POST',
        });
        if (res.ok) {
          updateUserPlan('Free');
          setNoticeMessage('Free Starter plan activated successfully.');
          setTimeout(() => setNoticeMessage(null), 4000);
        }
      } catch {
        updateUserPlan('Free');
      } finally {
        setFreeLoading(false);
      }
      return;
    }

    if (!paymentsEnabled) {
      setNoticeMessage('Paid plan upgrades are currently paused (Coming Soon).');
      setTimeout(() => setNoticeMessage(null), 4000);
      return;
    }

    setCheckoutLoading(plan.id);
    try {
      const orderRes = await fetch('/api/subscriptions/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan_id: plan.id,
          billing_cycle: billingCycle,
        }),
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok || !orderData?.orderId) {
        throw new Error(orderData?.error || 'Failed to initialize checkout order.');
      }

      await openRazorpayCheckout({
        orderId: orderData.orderId,
        amount: orderData.amount,
        currency: orderData.currency,
        keyId: orderData.keyId,
        planName: plan.name,
        user: {
          name: user.name,
          email: user.email,
        },
        onSuccess: async (paymentResult) => {
          setNoticeMessage('Verifying payment...');
          try {
            const verifyRes = await fetch('/api/subscriptions/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                ...paymentResult,
                plan_id: plan.id,
                billing_cycle: billingCycle,
              }),
            });
            const verifyData = await verifyRes.json();
            if (verifyRes.ok && verifyData.status === 'success') {
              updateUserPlan(plan.tier);
              setNoticeMessage(`Payment verified! Welcome to Gyanvatsala ${plan.name}.`);
              setTimeout(() => setNoticeMessage(null), 6000);
            } else {
              setNoticeMessage(verifyData.error || 'Payment verification failed. Please contact support.');
            }
          } catch {
            setNoticeMessage('Payment received. Finalizing account update...');
            updateUserPlan(plan.tier);
          }
        },
        onDismiss: () => {
          setCheckoutLoading(null);
        },
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Payment initiation failed. Please try again.';
      setNoticeMessage(message);
      setTimeout(() => setNoticeMessage(null), 5000);
    } finally {
      setCheckoutLoading(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-[#0D1017] text-[#20232B] dark:text-[#F8FAFC] selection:bg-[#536BCE] selection:text-white transition-colors duration-150">
      <Header />

      <main className="flex-1">
        {/* Optional Admin Announcement Banner */}
        {announcementBanner && (
          <div className="bg-blue-50 dark:bg-blue-950/30 border-b border-blue-200 dark:border-blue-900/50 py-2 px-4 text-center text-xs font-semibold text-blue-800 dark:text-blue-200">
            {announcementBanner}
          </div>
        )}

        {/* Admin Mode Management Bar (Admins manage pricing/availability rather than buying plans) */}
        {isAdminUser && (
          <div className="bg-indigo-50/90 dark:bg-indigo-950/40 border-b border-indigo-200 dark:border-indigo-900/60 py-3 px-4">
            <div className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-indigo-900 dark:text-indigo-200">
                <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span>
                  <strong>Administrator View:</strong> Manage prices, tier storage limits, and toggle{' '}
                  <strong>{paymentsEnabled ? 'Live Active' : 'Coming Soon'}</strong> checkout mode in Admin Controls.
                </span>
              </div>
              <Link
                href="/admin?tab=controls"
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shrink-0"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Edit Plans & Payment Mode</span>
              </Link>
            </div>
          </div>
        )}

        {/* Header Hero */}
        <section className="max-w-4xl mx-auto px-4 pt-12 pb-8 text-center space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/60 text-xs font-semibold text-[#536BCE] dark:text-[#93A5F5]">
            <CreditCard className="w-3.5 h-3.5" />
            <span>Document Workspace Subscriptions</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-[#20232B] dark:text-[#F8FAFC]">
            Simple, Transparent Pricing
          </h1>

          <p className="text-sm sm:text-base text-[#727783] dark:text-[#9DA3AE] max-w-2xl mx-auto leading-relaxed">
            Start free with private in-browser PDF & image processing, or upgrade for expanded cloud quota, extended retention, and unlimited batch workflows.
          </p>

          {/* Notification Toast */}
          {noticeMessage && (
            <div className="max-w-md mx-auto p-3 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-xs font-semibold text-blue-700 dark:text-blue-300 flex items-center justify-center gap-2">
              <Info className="w-4 h-4 shrink-0" />
              <span>{noticeMessage}</span>
            </div>
          )}

          {/* Billing Cycle Switch */}
          <div className="pt-4 flex items-center justify-center gap-3">
            <span
              className={`text-xs font-bold ${
                billingCycle === 'monthly' ? 'text-[#20232B] dark:text-white' : 'text-[#727783]'
              }`}
            >
              Monthly Billing
            </span>
            <button
              type="button"
              onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
              className="w-12 h-6 rounded-full bg-slate-200 dark:bg-slate-800 p-1 relative transition cursor-pointer"
              aria-label="Toggle billing cycle"
            >
              <div
                className={`w-4 h-4 rounded-full bg-[#536BCE] transition-transform duration-200 ${
                  billingCycle === 'yearly' ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
            <div className="flex items-center gap-1.5">
              <span
                className={`text-xs font-bold ${
                  billingCycle === 'yearly' ? 'text-[#20232B] dark:text-white' : 'text-[#727783]'
                }`}
              >
                Yearly Billing
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                Save ~16%
              </span>
            </div>
          </div>
        </section>

        {/* Pricing Cards Grid */}
        <section className="max-w-6xl mx-auto px-4 pb-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {plans.map((p) => {
              const rawPrice = billingCycle === 'yearly' ? p.priceYearlyInr : p.priceMonthlyInr;
              const price = formatInr(rawPrice);
              const period = !p.isPaid
                ? 'forever'
                : billingCycle === 'yearly'
                  ? 'per year'
                  : 'per month';
              const isCustomerCurrentPlan =
                !isAdminUser && (user?.plan === p.tier || (!p.isPaid && user && !user.plan));
              const isPaidLocked = p.isPaid && !paymentsEnabled;

              return (
                <div
                  key={p.id}
                  className={`relative rounded-3xl p-6 flex flex-col justify-between transition duration-200 ${
                    p.isRecommended
                      ? 'bg-white dark:bg-[#111622] border-2 border-[#536BCE] shadow-xl md:-translate-y-2'
                      : 'bg-white dark:bg-[#111622] border border-[#E9EBF0] dark:border-[#222632] shadow-xs hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  {/* Recommended / Status Badge */}
                  {p.isRecommended && paymentsEnabled ? (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-[#536BCE] text-white text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 shadow-sm whitespace-nowrap">
                      <Sparkles className="w-3 h-3" />
                      <span>Most Popular</span>
                    </div>
                  ) : isPaidLocked ? (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-slate-800 dark:bg-slate-700 text-slate-100 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 shadow-sm whitespace-nowrap">
                      <Clock className="w-3 h-3" />
                      <span>Coming Soon</span>
                    </div>
                  ) : null}

                  {isCustomerCurrentPlan && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 shadow-sm">
                      <Check className="w-3 h-3" />
                      <span>Current Active Plan</span>
                    </div>
                  )}

                  <div className="space-y-4">
                    {/* Plan Header */}
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-lg font-bold text-[#20232B] dark:text-[#F8FAFC]">
                          {p.name}
                        </h3>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            p.id === 'prime_plus'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                              : p.id === 'prime'
                                ? 'bg-amber-100/80 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                                : p.id === 'prime_ultra'
                                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                                  : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                          }`}
                        >
                          {p.badge}
                        </span>
                      </div>
                      <p className="text-xs text-[#727783] dark:text-[#9DA3AE] mt-1.5 leading-relaxed min-h-[36px]">
                        {p.description}
                      </p>
                    </div>

                    {/* Price */}
                    <div className="pt-2 border-t border-[#E9EBF0] dark:border-[#222632]">
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-black text-[#20232B] dark:text-[#F8FAFC]">
                          {price}
                        </span>
                        <span className="text-xs text-[#727783] font-medium">/ {period}</span>
                      </div>
                    </div>

                    {/* Storage & Retention Highlights */}
                    <div className="space-y-2 py-3 px-3 rounded-2xl bg-[#F7F8FA] dark:bg-[#0D1017] border border-[#E9EBF0] dark:border-[#222632]">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[#727783] flex items-center gap-1.5">
                          <HardDrive className="w-3.5 h-3.5 text-[#536BCE]" />
                          Storage:
                        </span>
                        <span className="font-bold text-[#20232B] dark:text-[#F8FAFC]">
                          {formatMbLabel(p.storageLimitBytes)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[#727783] flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-amber-500" />
                          Retention:
                        </span>
                        <span className="font-bold text-[#20232B] dark:text-[#F8FAFC]">
                          {p.retentionDays === 365 ? '365 days (1 Year)' : `${p.retentionDays} days`}
                        </span>
                      </div>
                    </div>

                    {/* Features List */}
                    <div className="space-y-2.5 pt-2">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-[#727783]">
                        Included Capabilities:
                      </p>
                      <ul className="space-y-2 text-xs text-[#20232B] dark:text-[#E2E8F0]">
                        {p.features.map((feat, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="pt-6 mt-6 border-t border-[#E9EBF0] dark:border-[#222632]">
                    {isAdminUser ? (
                      <Link
                        href="/admin?tab=controls"
                        className="w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 border border-[#E9EBF0] dark:border-[#222632] bg-[#F7F8FA] dark:bg-[#0D1017] text-[#20232B] dark:text-[#E2E8F0] hover:border-[#536BCE] transition"
                      >
                        <Sliders className="w-3.5 h-3.5 text-[#536BCE]" />
                        <span>Configure Tier in Admin</span>
                      </Link>
                    ) : (
                      <Button
                        onClick={() => handleSelectPlan(p)}
                        variant={!p.isPaid || paymentsEnabled ? 'primary' : 'outline'}
                        disabled={
                          Boolean(isCustomerCurrentPlan) ||
                          freeLoading ||
                          checkoutLoading === p.id ||
                          isPaidLocked
                        }
                        className={`w-full py-2.5 rounded-xl font-bold text-xs cursor-pointer ${
                          isPaidLocked
                            ? 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-dashed border-slate-300 dark:border-slate-700'
                            : !p.isPaid || p.isRecommended
                              ? 'bg-[#536BCE] hover:bg-[#4157B5] text-white shadow-md'
                              : 'bg-[#20232B] dark:bg-indigo-600 hover:opacity-95 text-white shadow-sm'
                        }`}
                      >
                        {checkoutLoading === p.id ? (
                          <span className="flex items-center justify-center gap-1.5">
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Connecting...</span>
                          </span>
                        ) : isPaidLocked ? (
                          <span className="flex items-center justify-center gap-1.5">
                            <Lock className="w-3.5 h-3.5" />
                            <span>Coming Soon</span>
                          </span>
                        ) : isCustomerCurrentPlan ? (
                          'Current Active Plan'
                        ) : !p.isPaid ? (
                          freeLoading ? (
                            'Activating...'
                          ) : (
                            'Select Free Starter'
                          )
                        ) : (
                          <span className="flex items-center justify-center gap-1.5">
                            <span>Upgrade to {p.name}</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Clear Explanation of Automatic Data Deletion */}
        <section className="max-w-5xl mx-auto px-4 pb-16">
          <div className="rounded-3xl p-8 bg-[#F7F8FA] dark:bg-[#111622] border border-[#E9EBF0] dark:border-[#222632] shadow-sm space-y-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
                <Clock className="w-6 h-6" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-black text-[#20232B] dark:text-[#F8FAFC]">
                  How Automatic Data Retention & Expiration Works
                </h2>
                <p className="text-xs sm:text-sm text-[#727783] dark:text-[#9DA3AE] leading-relaxed">
                  Gyanvatsala protects your privacy and keeps cloud storage sustainable with automated data retention lifecycles.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="p-5 rounded-2xl bg-white dark:bg-[#0D1017] border border-[#E9EBF0] dark:border-[#222632] space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-[#20232B] dark:text-[#F8FAFC]">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span>1. In-Browser Mode (Zero Retention)</span>
                </div>
                <p className="text-xs text-[#727783] dark:text-[#9DA3AE] leading-relaxed">
                  Files edited locally in your browser never touch our cloud servers. Storage quota is not consumed and files are discarded the instant you close your tab.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-white dark:bg-[#0D1017] border border-[#E9EBF0] dark:border-[#222632] space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-[#20232B] dark:text-[#F8FAFC]">
                  <HardDrive className="w-4 h-4 text-amber-500" />
                  <span>2. Tiered Retention Windows</span>
                </div>
                <p className="text-xs text-[#727783] dark:text-[#9DA3AE] leading-relaxed">
                  Cloud workspace files persist according to your subscription tier. Automated warnings notify you before expiration so you can download or upgrade cleanly.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-white dark:bg-[#0D1017] border border-[#E9EBF0] dark:border-[#222632] space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-[#20232B] dark:text-[#F8FAFC]">
                  <Download className="w-4 h-4 text-blue-500" />
                  <span>3. Permanent Shredding</span>
                </div>
                <p className="text-xs text-[#727783] dark:text-[#9DA3AE] leading-relaxed">
                  When a cloud file reaches its expiration deadline, it is permanently deleted from encrypted object storage with an audit deletion log.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Comparison Table (Live from plans & siteSettings) */}
        <section className="max-w-5xl mx-auto px-4 pb-20">
          <div className="text-center space-y-2 mb-8">
            <h2 className="text-2xl font-black text-[#20232B] dark:text-[#F8FAFC]">
              Compare Plan Specifications
            </h2>
            <p className="text-xs text-[#727783] dark:text-[#9DA3AE]">
              Detailed breakdown of storage quotas, retention periods, and worker processing tiers.
            </p>
          </div>

          <div className="overflow-x-auto rounded-3xl border border-[#E9EBF0] dark:border-[#222632] bg-white dark:bg-[#111622] shadow-xs">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-[#E9EBF0] dark:border-[#222632] bg-[#F7F8FA] dark:bg-[#0D1017]">
                  <th className="p-4 font-bold text-[#727783]">Metric / Feature</th>
                  {plans.map((p) => (
                    <th
                      key={p.id}
                      className={`p-4 font-bold ${
                        p.isRecommended
                          ? 'text-[#536BCE] dark:text-[#93A5F5]'
                          : 'text-[#20232B] dark:text-[#F8FAFC]'
                      }`}
                    >
                      {p.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E9EBF0] dark:divide-[#222632] text-[#20232B] dark:text-[#E2E8F0]">
                <tr>
                  <td className="p-4 font-medium text-[#727783]">Launch Status</td>
                  {plans.map((p) => (
                    <td
                      key={p.id}
                      className={`p-4 font-bold ${
                        !p.isPaid || paymentsEnabled ? 'text-emerald-600' : 'text-amber-600'
                      }`}
                    >
                      {!p.isPaid || paymentsEnabled ? 'Active Now' : 'Coming Soon'}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-4 font-medium text-[#727783]">Monthly Price</td>
                  {plans.map((p) => (
                    <td
                      key={p.id}
                      className={`p-4 font-bold ${p.isRecommended ? 'text-[#536BCE]' : ''}`}
                    >
                      {formatInr(p.priceMonthlyInr)}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-4 font-medium text-[#727783]">Yearly Price</td>
                  {plans.map((p) => (
                    <td
                      key={p.id}
                      className={`p-4 font-bold ${p.isRecommended ? 'text-[#536BCE]' : ''}`}
                    >
                      {formatInr(p.priceYearlyInr)}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-4 font-medium text-[#727783]">Cloud Storage Quota</td>
                  {plans.map((p) => (
                    <td
                      key={p.id}
                      className={`p-4 font-bold ${p.isRecommended ? 'text-[#536BCE]' : ''}`}
                    >
                      {formatMbLabel(p.storageLimitBytes)}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-4 font-medium text-[#727783]">Data Retention Window</td>
                  {plans.map((p) => (
                    <td
                      key={p.id}
                      className={`p-4 font-bold ${p.isRecommended ? 'text-[#536BCE]' : ''}`}
                    >
                      {p.retentionDays} days
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-4 font-medium text-[#727783]">Max Single File Size</td>
                  {plans.map((p) => (
                    <td
                      key={p.id}
                      className={`p-4 ${p.isRecommended ? 'text-[#536BCE] font-bold' : ''}`}
                    >
                      {formatMbLabel(p.maxFileSizeBytes)}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-4 font-medium text-[#727783]">In-Browser Private Mode</td>
                  {plans.map((p) => (
                    <td key={p.id} className="p-4">
                      <Check className="w-4 h-4 text-emerald-500" />
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

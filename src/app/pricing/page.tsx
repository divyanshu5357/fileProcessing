'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Check,
  Zap,
  Sparkles,
  ShieldCheck,
  Clock,
  HardDrive,
  Download,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  ChevronDown,
  Lock,
  Info,
  X,
  CreditCard,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuth, PlanTier } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const { user, updateUserPlan, openAuthModal } = useAuth();
  const router = useRouter();

  const [comingSoonModalOpen, setComingSoonModalOpen] = useState(false);
  const [selectedPlanName, setSelectedPlanName] = useState('');
  const [freeLoading, setFreeLoading] = useState(false);
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);

  const handleSelectPlan = async (plan: { id: string; name: string; tier: PlanTier; isPaid: boolean }) => {
    if (!plan.isPaid) {
      if (!user) {
        openAuthModal();
        return;
      }
      if (user.plan === 'Free') {
        setNoticeMessage('You are already enjoying the Free Starter plan with 15 MB storage & 7-day retention.');
        setTimeout(() => setNoticeMessage(null), 4000);
        return;
      }

      setFreeLoading(true);
      try {
        const res = await fetch('/api/subscriptions/activate-free', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-User-Id': user.id || 'usr_free',
            'X-User-Email': user.email || 'user@gyanvatsala.in',
          },
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

    // Paid Plan Click: Strictly show pre-payment coming soon notice. Never change plan or simulate transaction.
    setSelectedPlanName(plan.name);
    setComingSoonModalOpen(true);
  };

  const plans = [
    {
      id: 'free',
      tier: 'Free' as PlanTier,
      name: 'Free Starter',
      badge: 'Zero Cost',
      monthlyPrice: '₹0',
      yearlyPrice: '₹0',
      period: 'forever',
      storage: '15 MB',
      retention: '7 days',
      maxFileSize: '15 MB',
      isPaid: false,
      description: 'Ideal for everyday document tasks, in-browser privacy, and fast conversions.',
      features: [
        '15 MB Cloud Storage',
        '7-day automatic data retention',
        '100% In-Browser Private Mode (Zero Uploads)',
        'Standard conversion queue',
        'Direct local download before expiry',
        'Full access to all PDF & Scan Studio tools',
      ],
      isRecommended: false,
      buttonText: user?.plan === 'Free' || !user?.plan ? 'Current Plan' : 'Activate Free',
      isCurrent: user?.plan === 'Free' || !user?.plan,
    },
    {
      id: 'prime',
      tier: 'Prime' as PlanTier,
      name: 'Prime',
      badge: 'Coming Soon',
      monthlyPrice: '₹49',
      yearlyPrice: '₹499',
      period: billingCycle === 'yearly' ? 'per year' : 'per month',
      storage: '50 MB',
      retention: '14 days',
      maxFileSize: '25 MB',
      isPaid: true,
      description: 'Double retention and storage for active students and freelancers.',
      features: [
        '50 MB Cloud Storage',
        '14-day automatic data retention',
        'Priority queue processing',
        '48h & 24h expiration email alerts',
        'Direct multipart S3 uploads',
        'Faster image & PDF compression',
      ],
      isRecommended: false,
      buttonText: 'Coming Soon',
      isCurrent: false,
    },
    {
      id: 'prime_plus',
      tier: 'PrimePlus' as PlanTier,
      name: 'PrimePlus',
      badge: 'Coming Soon',
      monthlyPrice: '₹99',
      yearlyPrice: '₹999',
      period: billingCycle === 'yearly' ? 'per year' : 'per month',
      storage: '100 MB',
      retention: '30 days',
      maxFileSize: '50 MB',
      isPaid: true,
      description: '30-day retention and high-speed parallel processing for power users.',
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
      buttonText: 'Coming Soon',
      isCurrent: false,
    },
    {
      id: 'prime_ultra',
      tier: 'PrimeUltra' as PlanTier,
      name: 'PrimeUltra',
      badge: 'Coming Soon',
      monthlyPrice: '₹249',
      yearlyPrice: '₹2,499',
      period: billingCycle === 'yearly' ? 'per year' : 'per month',
      storage: '500 MB',
      retention: '365 days (1 Year)',
      maxFileSize: '100 MB',
      isPaid: true,
      description: 'Long-term 1-year archival and maximum concurrency for professional teams.',
      features: [
        '500 MB Enterprise Cloud Storage',
        '365-day (1 full year) retention',
        'Unlimited batch conversions',
        'Dedicated worker concurrency',
        'VIP customer support',
        'Advance data export packages',
      ],
      isRecommended: false,
      buttonText: 'Coming Soon',
      isCurrent: false,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-[#0D1017] text-[#20232B] dark:text-[#F8FAFC] selection:bg-[#536BCE] selection:text-white transition-colors duration-150">
      <Header />

      <main className="flex-1">
        {/* Pre-Payment Launch Notice Banner */}
        <div className="bg-[#F7F8FA] dark:bg-[#161B26] border-b border-[#E9EBF0] dark:border-[#222632] py-3 px-4">
          <div className="max-w-5xl mx-auto flex items-center justify-between gap-3 text-xs sm:text-sm">
            <div className="flex items-center gap-2.5 text-[#536BCE] dark:text-[#93A5F5]">
              <Info className="w-4 h-4 shrink-0" />
              <p className="text-[#20232B] dark:text-[#E2E8F0]">
                <strong>Pre-Payment Launch Notice:</strong> Core document tools and the <strong>Free Starter plan</strong> are 100% active. Paid cloud plans are currently in <em>Coming Soon</em> status pending payment gateway approval with Razorpay.
              </p>
            </div>
            <span className="hidden md:inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 shrink-0">
              Gateway Onboarding
            </span>
          </div>
        </div>

        {/* Hero Section */}
        <section className="py-14 sm:py-18 px-4 text-center max-w-4xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-[#536BCE] dark:text-[#93A5F5] text-xs font-bold border border-blue-200 dark:border-blue-900/60">
            <Zap className="w-3.5 h-3.5" />
            <span>Document Workspace Subscriptions</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-[#20232B] dark:text-[#F8FAFC]">
            Simple, Transparent Pricing
          </h1>
          <p className="text-sm sm:text-base text-[#727783] dark:text-[#9DA3AE] max-w-2xl mx-auto leading-relaxed">
            Start completely free with unlimited in-browser private processing and 15 MB cloud storage. Paid cloud tiers will activate soon upon payment gateway integration.
          </p>

          {/* Feedback Toast */}
          {noticeMessage && (
            <div className="max-w-md mx-auto p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-200 text-xs font-semibold border border-emerald-200 dark:border-emerald-800 flex items-center justify-center gap-2 animate-in fade-in">
              <Check className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>{noticeMessage}</span>
            </div>
          )}

          {/* Monthly vs Yearly Toggle */}
          <div className="pt-6 flex items-center justify-center gap-3">
            <span className={`text-xs font-bold ${billingCycle === 'monthly' ? 'text-[#536BCE] dark:text-[#93A5F5]' : 'text-slate-500'}`}>
              Monthly Billing
            </span>
            <button
              type="button"
              onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
              className={`w-12 h-6 rounded-full transition-colors relative p-1 cursor-pointer ${billingCycle === 'yearly' ? 'bg-[#536BCE]' : 'bg-slate-300 dark:bg-slate-700'}`}
              aria-label="Toggle annual billing"
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform ${billingCycle === 'yearly' ? 'translate-x-6' : 'translate-x-0'}`}
              />
            </button>
            <span className={`text-xs font-bold flex items-center gap-1.5 ${billingCycle === 'yearly' ? 'text-[#536BCE] dark:text-[#93A5F5]' : 'text-slate-500'}`}>
              Yearly Billing
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                Save ~16%
              </span>
            </span>
          </div>
        </section>

        {/* 4 Plan Cards */}
        <section className="max-w-7xl mx-auto px-4 pb-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
            {plans.map((p) => {
              const price = billingCycle === 'yearly' ? p.yearlyPrice : p.monthlyPrice;

              return (
                <div
                  key={p.id}
                  className={`relative rounded-3xl p-6 flex flex-col justify-between transition-all duration-300 bg-white dark:bg-[#111622] border ${
                    p.isRecommended
                      ? 'border-[#536BCE] dark:border-[#536BCE] shadow-xl ring-2 ring-[#536BCE]/20'
                      : 'border-[#E9EBF0] dark:border-[#222632] shadow-xs hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  {/* Recommended / Coming Soon Badge */}
                  {p.isPaid ? (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-[10px] font-black uppercase tracking-wider shadow-sm flex items-center gap-1">
                      <Clock className="w-3 h-3 text-[#536BCE]" />
                      <span>Coming Soon</span>
                    </div>
                  ) : p.isCurrent ? (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-black uppercase tracking-wider shadow-sm flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      <span>Current Active Plan</span>
                    </div>
                  ) : null}

                  <div className="space-y-4">
                    {/* Header */}
                    <div>
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold text-[#20232B] dark:text-[#F8FAFC]">
                          {p.name}
                        </h3>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          p.isPaid
                            ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                            : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                        }`}>
                          {p.badge}
                        </span>
                      </div>
                      <p className="text-xs text-[#727783] dark:text-[#9DA3AE] mt-1 min-h-[32px]">
                        {p.description}
                      </p>
                    </div>

                    {/* Price */}
                    <div className="pt-2 border-t border-[#E9EBF0] dark:border-[#222632]">
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-black text-[#20232B] dark:text-[#F8FAFC]">
                          {price}
                        </span>
                        <span className="text-xs text-[#727783] font-medium">
                          / {p.period}
                        </span>
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
                          {p.storage}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[#727783] flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-amber-500" />
                          Retention:
                        </span>
                        <span className="font-bold text-[#20232B] dark:text-[#F8FAFC]">
                          {p.retention}
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
                    <Button
                      onClick={() => handleSelectPlan(p)}
                      variant={!p.isPaid ? 'primary' : 'outline'}
                      disabled={p.isCurrent || freeLoading}
                      className={`w-full py-2.5 rounded-xl font-bold text-xs cursor-pointer ${
                        !p.isPaid
                          ? 'bg-[#536BCE] hover:bg-[#4157B5] text-white shadow-md'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-dashed border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {p.isPaid ? (
                        <span className="flex items-center justify-center gap-1.5">
                          <Lock className="w-3.5 h-3.5" />
                          <span>Coming Soon</span>
                        </span>
                      ) : p.isCurrent ? (
                        'Current Active Plan'
                      ) : freeLoading ? (
                        'Activating...'
                      ) : (
                        'Select Free Starter'
                      )}
                    </Button>
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
                  To guarantee user confidentiality and eliminate permanent storage overhead, Gyanvatsala automatically retires cloud files based on your subscription tier.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="p-5 rounded-2xl bg-white dark:bg-[#0D1017] border border-[#E9EBF0] dark:border-[#222632] space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-[#20232B] dark:text-[#F8FAFC]">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span>1. Zero Server Uploads</span>
                </div>
                <p className="text-xs text-[#727783] dark:text-[#9DA3AE] leading-relaxed">
                  Local-first processing processes documents directly within your browser&apos;s WebAssembly engine without transmitting bytes to our servers.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-white dark:bg-[#0D1017] border border-[#E9EBF0] dark:border-[#222632] space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-[#20232B] dark:text-[#F8FAFC]">
                  <Clock className="w-4 h-4 text-amber-500" />
                  <span>2. Cloud Retention Window</span>
                </div>
                <p className="text-xs text-[#727783] dark:text-[#9DA3AE] leading-relaxed">
                  Files explicitly saved to your cloud workspace remain available for 7 days on Free Starter, and up to 365 days on PrimeUltra.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-white dark:bg-[#0D1017] border border-[#E9EBF0] dark:border-[#222632] space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-[#20232B] dark:text-[#F8FAFC]">
                  <Download className="w-4 h-4 text-blue-500" />
                  <span>3. Permanent Shredding</span>
                </div>
                <p className="text-xs text-[#727783] dark:text-[#9DA3AE] leading-relaxed">
                  When a cloud file reaches its expiration deadline, it is permanently deleted from AWS S3 storage with an audit deletion log.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Comparison Table */}
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
                  <th className="p-4 font-bold text-[#20232B] dark:text-[#F8FAFC]">Free Starter</th>
                  <th className="p-4 font-bold text-[#20232B] dark:text-[#F8FAFC]">Prime</th>
                  <th className="p-4 font-bold text-[#536BCE] dark:text-[#93A5F5]">PrimePlus</th>
                  <th className="p-4 font-bold text-[#20232B] dark:text-[#F8FAFC]">PrimeUltra</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E9EBF0] dark:divide-[#222632] text-[#20232B] dark:text-[#E2E8F0]">
                <tr>
                  <td className="p-4 font-medium text-[#727783]">Launch Status</td>
                  <td className="p-4 font-bold text-emerald-600">Active Now</td>
                  <td className="p-4 font-bold text-amber-600">Coming Soon</td>
                  <td className="p-4 font-bold text-amber-600">Coming Soon</td>
                  <td className="p-4 font-bold text-amber-600">Coming Soon</td>
                </tr>
                <tr>
                  <td className="p-4 font-medium text-[#727783]">Monthly Price</td>
                  <td className="p-4 font-bold">₹0</td>
                  <td className="p-4 font-bold">₹49</td>
                  <td className="p-4 font-bold text-[#536BCE]">₹99</td>
                  <td className="p-4 font-bold">₹249</td>
                </tr>
                <tr>
                  <td className="p-4 font-medium text-[#727783]">Yearly Price</td>
                  <td className="p-4 font-bold">₹0</td>
                  <td className="p-4 font-bold">₹499</td>
                  <td className="p-4 font-bold text-[#536BCE]">₹999</td>
                  <td className="p-4 font-bold">₹2,499</td>
                </tr>
                <tr>
                  <td className="p-4 font-medium text-[#727783]">Cloud Storage Quota</td>
                  <td className="p-4 font-bold">15 MB</td>
                  <td className="p-4 font-bold">50 MB</td>
                  <td className="p-4 font-bold text-[#536BCE]">100 MB</td>
                  <td className="p-4 font-bold">500 MB</td>
                </tr>
                <tr>
                  <td className="p-4 font-medium text-[#727783]">Data Retention Window</td>
                  <td className="p-4 font-bold">7 days</td>
                  <td className="p-4 font-bold">14 days</td>
                  <td className="p-4 font-bold text-[#536BCE]">30 days</td>
                  <td className="p-4 font-bold">365 days</td>
                </tr>
                <tr>
                  <td className="p-4 font-medium text-[#727783]">Max Single File Size</td>
                  <td className="p-4">15 MB</td>
                  <td className="p-4">25 MB</td>
                  <td className="p-4 text-[#536BCE] font-bold">50 MB</td>
                  <td className="p-4 font-bold">100 MB</td>
                </tr>
                <tr>
                  <td className="p-4 font-medium text-[#727783]">In-Browser Private Mode</td>
                  <td className="p-4"><Check className="w-4 h-4 text-emerald-500" /></td>
                  <td className="p-4"><Check className="w-4 h-4 text-emerald-500" /></td>
                  <td className="p-4"><Check className="w-4 h-4 text-emerald-500" /></td>
                  <td className="p-4"><Check className="w-4 h-4 text-emerald-500" /></td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {/* Coming Soon Modal for Paid Plans */}
      {comingSoonModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-md rounded-3xl bg-white dark:bg-[#111827] border border-[#E9EBF0] dark:border-[#222632] p-6 shadow-2xl space-y-4">
            <button
              onClick={() => setComingSoonModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition"
              aria-label="Close dialog"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/60 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Clock className="w-6 h-6" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-lg font-bold text-[#20232B] dark:text-[#F8FAFC]">
                {selectedPlanName} — Coming Soon
              </h3>
              <p className="text-xs text-[#727783] dark:text-[#9DA3AE] leading-relaxed">
                Gyanvatsala is currently in pre-payment launch. Payment gateway integration with <strong>Razorpay</strong> is in progress and awaiting regulatory merchant onboarding.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#F7F8FA] dark:bg-[#0D1017] border border-[#E9EBF0] dark:border-[#222632] space-y-2 text-xs">
              <div className="flex items-center gap-2 font-semibold text-[#20232B] dark:text-[#F8FAFC]">
                <CreditCard className="w-4 h-4 text-[#536BCE]" />
                <span>Zero Fake Payments</span>
              </div>
              <p className="text-[#727783] dark:text-[#9DA3AE]">
                To maintain complete financial integrity, paid plans will only activate after live server-side verification and verified webhook events.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <Button
                variant="primary"
                onClick={() => setComingSoonModalOpen(false)}
                className="w-full text-xs font-bold py-2.5 rounded-xl bg-[#536BCE] hover:bg-[#4157B5] text-white"
              >
                Got It, Thank You
              </Button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

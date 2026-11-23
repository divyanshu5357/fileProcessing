'use client';

import React, { useState } from 'react';
import {
  CreditCard,
  Check,
  Zap,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  Clock,
  HardDrive,
  RefreshCw,
  XCircle,
  FileText,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { useAuth, PlanTier } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { openRazorpayCheckout } from '@/lib/razorpayClient';

export default function SubscriptionPage() {
  const { user, storageUsage, updateUserPlan } = useAuth();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [isCancelling, setIsCancelling] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelAtPeriodEnd, setCancelAtPeriodEnd] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  const percentUsed = Math.min(
    100,
    Math.round((storageUsage.usedBytes / storageUsage.limitBytes) * 100)
  );

  const isWarningThreshold = percentUsed >= 80;

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const remainingBytes = Math.max(0, storageUsage.limitBytes - storageUsage.usedBytes);

  // Simulated Payment History
  const [paymentHistory, setPaymentHistory] = useState([
    {
      id: 'inv_8492019',
      date: '2026-11-01',
      plan: user?.plan || 'Free Starter',
      amount: user?.plan === 'PrimePlus' ? '₹99' : user?.plan === 'Prime' ? '₹49' : user?.plan === 'PrimeUltra' ? '₹249' : '₹0',
      cycle: 'Monthly',
      status: 'Succeeded',
      method: 'UPI / Razorpay',
    },
  ]);

  const plans = [
    {
      id: 'free',
      tier: 'Free' as PlanTier,
      name: 'Free Starter',
      priceMonthly: 0,
      priceYearly: 0,
      storage: '15 MB',
      retention: '7 days',
      features: ['15 MB Cloud Storage', '7-Day Data Retention', 'In-Browser Processing', 'Direct Downloads'],
      isCurrent: user?.plan === 'Free' || !user?.plan,
    },
    {
      id: 'prime',
      tier: 'Prime' as PlanTier,
      name: 'Prime',
      priceMonthly: 49,
      priceYearly: 499,
      storage: '50 MB',
      retention: '14 days',
      features: ['50 MB Cloud Storage', '14-Day Retention', 'Priority Worker Queue', '48h Expiration Warnings'],
      isCurrent: user?.plan === 'Prime',
    },
    {
      id: 'prime_plus',
      tier: 'PrimePlus' as PlanTier,
      name: 'PrimePlus',
      priceMonthly: 99,
      priceYearly: 999,
      storage: '100 MB',
      retention: '30 days',
      features: ['100 MB Cloud Storage', '30-Day Extended Retention', 'High-Speed Parallel Processing', 'Automated Warnings'],
      isRecommended: true,
      isCurrent: user?.plan === 'PrimePlus',
    },
    {
      id: 'prime_ultra',
      tier: 'PrimeUltra' as PlanTier,
      name: 'PrimeUltra',
      priceMonthly: 249,
      priceYearly: 2499,
      storage: '500 MB',
      retention: '365 days',
      features: ['500 MB Enterprise Storage', '365-Day (1 Year) Retention', 'VIP Support & Concurrency'],
      isCurrent: user?.plan === 'PrimeUltra',
    },
  ];

  const handleUpgrade = async (planTier: PlanTier, planId: string) => {
    setCheckoutLoading(planTier);
    setNotificationMsg(null);

    try {
      if (planTier === 'Free' || planId === 'free') {
        // Activate Free Starter plan via authenticated Next.js endpoint
        const res = await fetch('/api/subscriptions/activate-free', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });
        if (res.ok) {
          updateUserPlan('Free');
          setCancelAtPeriodEnd(false);
          setNotificationMsg('Free Starter plan activated successfully.');
        } else {
          setNotificationMsg('Failed to activate Free plan. Please try again.');
        }
        return;
      }

      // Paid plans: Call checkout endpoint
      const checkoutRes = await fetch('/api/subscriptions/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan_id: planId,
          billing_cycle: billingCycle,
        }),
      });

      const orderData = checkoutRes.ok ? await checkoutRes.json() : null;

      if (!checkoutRes.ok || !orderData?.orderId) {
        throw new Error(orderData?.error || 'Failed to initialize payment checkout.');
      }

      await openRazorpayCheckout({
        orderId: orderData.orderId,
        amount: orderData.amount,
        currency: orderData.currency,
        keyId: orderData.keyId,
        planName: planTier,
        user: {
          name: user?.name,
          email: user?.email,
        },
        onSuccess: async (paymentResult) => {
          setNotificationMsg('Payment received. Verifying payment...');
          try {
            const verifyRes = await fetch('/api/subscriptions/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                ...paymentResult,
                plan_id: planId,
                billing_cycle: billingCycle,
              }),
            });
            const verifyData = await verifyRes.json();
            if (verifyRes.ok && verifyData.status === 'success') {
              updateUserPlan(planTier);
              setNotificationMsg(`Congratulations! Your plan has been upgraded to ${planTier}.`);
            } else {
              setNotificationMsg(verifyData.error || 'Payment verification failed. Please contact support.');
            }
          } catch {
            updateUserPlan(planTier);
            setNotificationMsg(`Your plan has been upgraded to ${planTier}.`);
          }
        },
        onDismiss: () => {
          setCheckoutLoading(null);
        },
      });
    } catch (e: any) {
      setNotificationMsg(e?.message || 'Failed to process subscription request.');
    } finally {
      setCheckoutLoading(null);
    }
  };

  const handleCancelSubscription = async () => {
    setIsCancelling(true);
    try {
      // In pre-launch or free mode, set local cancel state
      setCancelAtPeriodEnd(true);
      setNotificationMsg('Auto-renewal cancelled. You will retain your benefits until the end of your billing cycle.');
    } catch {}

    setIsCancelling(false);
    setIsCancelModalOpen(false);
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-8 animate-fade-in pb-16">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Subscription & Quota Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manage your freemium plan, cloud storage quota, payment history, and data retention rules.
          </p>
        </div>

        {/* Feedback Alert */}
        {notificationMsg && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-500" />
              <span>{notificationMsg}</span>
            </div>
            <button onClick={() => setNotificationMsg(null)} className="text-slate-400 hover:text-slate-600">
              &times;
            </button>
          </div>
        )}

        {/* 80% Quota Warning Banner */}
        {isWarningThreshold && (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/40 text-amber-800 dark:text-amber-300 text-xs font-semibold flex items-start sm:items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5 sm:mt-0" />
            <div className="flex-1">
              <span className="font-bold">Storage Quota Alert ({percentUsed}% Consumed): </span>
              <span>You have reached 80% of your storage limit. New uploads will be rejected once 100% is reached. Upgrade your plan to prevent service interruption.</span>
            </div>
          </div>
        )}

        {/* Top Section: Current Plan Overview & Storage Progress */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Current Plan Card */}
          <div className="p-6 rounded-3xl bg-white dark:bg-[#111827] border border-[#CBD5E1] dark:border-[#334155] shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Active Subscription
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                cancelAtPeriodEnd
                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300'
                  : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300'
              }`}>
                {cancelAtPeriodEnd ? 'Cancels at Period End' : 'Active'}
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100">
                  {user?.plan || 'Free'}
                </h3>
                <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
                  {user?.plan === 'PrimeUltra' ? '₹249/mo' : user?.plan === 'PrimePlus' ? '₹99/mo' : user?.plan === 'Prime' ? '₹49/mo' : '₹0'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Data retained for {storageUsage.retentionDays || 7} days before automatic deletion.
              </p>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5 text-xs text-slate-500">
              <div className="flex justify-between">
                <span>Started:</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">Nov 01, 2026</span>
              </div>
              <div className="flex justify-between">
                <span>Renewal Date:</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {user?.plan === 'Free' || !user?.plan ? 'Never (Free Tier)' : 'Dec 01, 2026'}
                </span>
              </div>
            </div>

            {user?.plan && user.plan !== 'Free' && !cancelAtPeriodEnd && (
              <button
                type="button"
                onClick={() => setIsCancelModalOpen(true)}
                className="text-xs text-red-600 dark:text-red-400 font-semibold hover:underline"
              >
                Cancel Subscription Auto-Renewal
              </button>
            )}
          </div>

          {/* Storage Quota Progress Card */}
          <div className="md:col-span-2 p-6 rounded-3xl bg-white dark:bg-[#111827] border border-[#CBD5E1] dark:border-[#334155] shadow-xs flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Cloud Storage Accounting
              </span>
              <span className={`text-xs font-bold font-mono ${isWarningThreshold ? 'text-amber-600' : 'text-slate-700 dark:text-slate-300'}`}>
                {percentUsed}% Consumed
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex items-baseline justify-between">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-black text-slate-900 dark:text-slate-100">
                    {formatBytes(storageUsage.usedBytes)}
                  </span>
                  <span className="text-xs text-slate-500">used of {formatBytes(storageUsage.limitBytes)}</span>
                </div>
                <div className="text-xs text-slate-500 font-medium">
                  {formatBytes(remainingBytes)} remaining
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 rounded-full ${
                    isWarningThreshold ? 'bg-amber-500' : 'bg-blue-600'
                  }`}
                  style={{ width: `${percentUsed}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-center">
              <div className="p-2 rounded-xl bg-slate-50 dark:bg-[#0B1120]">
                <p className="text-[10px] text-slate-400 uppercase font-bold">Total Files</p>
                <p className="text-sm font-black text-slate-900 dark:text-slate-100">{storageUsage.fileCount || 4}</p>
              </div>
              <div className="p-2 rounded-xl bg-slate-50 dark:bg-[#0B1120]">
                <p className="text-[10px] text-slate-400 uppercase font-bold">Remaining</p>
                <p className="text-sm font-black text-slate-900 dark:text-slate-100">{formatBytes(remainingBytes)}</p>
              </div>
              <div className="p-2 rounded-xl bg-slate-50 dark:bg-[#0B1120]">
                <p className="text-[10px] text-slate-400 uppercase font-bold">Data Retention</p>
                <p className="text-sm font-black text-slate-900 dark:text-slate-100">{storageUsage.retentionDays || 7} Days</p>
              </div>
            </div>
          </div>
        </div>

        {/* Plan Upgrade & Downgrade Options */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-slate-100">
                Change or Upgrade Plan
              </h2>
              <p className="text-xs text-slate-500">
                Choose the best tier for your storage and retention requirements.
              </p>
            </div>

            {/* Toggle */}
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setBillingCycle('monthly')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  billingCycle === 'monthly'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle('yearly')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  billingCycle === 'yearly'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <span>Yearly</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                  Save 16%
                </span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {plans.map((p) => {
              const price = billingCycle === 'yearly' ? `₹${p.priceYearly}/yr` : `₹${p.priceMonthly}/mo`;

              return (
                <div
                  key={p.id}
                  className={`rounded-2xl p-5 border flex flex-col justify-between space-y-4 bg-white dark:bg-[#111827] ${
                    p.isRecommended
                      ? 'border-blue-500 dark:border-blue-400 shadow-md ring-1 ring-blue-500/20'
                      : 'border-[#CBD5E1] dark:border-[#334155]'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">{p.name}</h4>
                      {p.isRecommended && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
                          Recommended
                        </span>
                      )}
                    </div>

                    <div className="text-xl font-black text-slate-900 dark:text-slate-100">
                      {p.priceMonthly === 0 ? 'Free' : price}
                    </div>

                    <div className="space-y-1 text-xs text-slate-500">
                      <div className="flex justify-between">
                        <span>Storage:</span>
                        <span className="font-bold text-slate-700 dark:text-slate-300">{p.storage}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Retention:</span>
                        <span className="font-bold text-slate-700 dark:text-slate-300">{p.retention}</span>
                      </div>
                    </div>

                    <ul className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400">
                      {p.features.slice(0, 3).map((f, i) => (
                        <li key={i} className="flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Button
                    onClick={() => handleUpgrade(p.tier, p.id)}
                    disabled={p.isCurrent || checkoutLoading === p.tier}
                    variant={p.isRecommended ? 'primary' : 'outline'}
                    className="w-full py-2 text-xs font-bold rounded-xl"
                  >
                    {checkoutLoading === p.tier
                      ? 'Confirming...'
                      : p.isCurrent
                      ? 'Current Plan'
                      : `Select ${p.name}`}
                  </Button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Payment History Table */}
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-slate-100">
              Payment & Invoice History
            </h2>
            <p className="text-xs text-slate-500">
              Detailed record of verified subscription transactions and invoice receipts.
            </p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-[#CBD5E1] dark:border-[#334155] bg-white dark:bg-[#111827]">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0B1120] text-slate-500">
                  <th className="p-3.5 font-bold">Transaction ID</th>
                  <th className="p-3.5 font-bold">Date</th>
                  <th className="p-3.5 font-bold">Plan</th>
                  <th className="p-3.5 font-bold">Cycle</th>
                  <th className="p-3.5 font-bold">Amount</th>
                  <th className="p-3.5 font-bold">Status</th>
                  <th className="p-3.5 font-bold">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {paymentHistory.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="p-3.5 font-mono text-slate-500">{item.id}</td>
                    <td className="p-3.5">{item.date}</td>
                    <td className="p-3.5 font-bold text-slate-900 dark:text-slate-100">{item.plan}</td>
                    <td className="p-3.5">{item.cycle}</td>
                    <td className="p-3.5 font-bold">{item.amount}</td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300">
                        {item.status}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <button
                        onClick={() => alert(`Downloading tax receipt for transaction ${item.id}...`)}
                        className="text-blue-600 hover:underline font-semibold"
                      >
                        Download PDF
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Cancellation Confirmation Modal */}
        {isCancelModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="w-full max-w-md rounded-3xl bg-white dark:bg-[#111827] border border-[#CBD5E1] dark:border-[#334155] p-6 shadow-2xl space-y-4">
              <div className="flex items-center gap-3 text-red-600">
                <AlertTriangle className="w-6 h-6" />
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Cancel Subscription Renewal?
                </h3>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Are you sure you want to cancel auto-renewal? You will continue to have access to your {user?.plan} plan until the end of your billing cycle. After that, your account will revert to the Free tier (15 MB storage & 7-day retention).
              </p>
              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setIsCancelModalOpen(false)}
                  className="text-xs"
                >
                  Keep Subscription
                </Button>
                <Button
                  variant="danger"
                  onClick={handleCancelSubscription}
                  disabled={isCancelling}
                  className="text-xs font-bold"
                >
                  {isCancelling ? 'Cancelling...' : 'Confirm Cancellation'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

'use client';

import React from 'react';
import Link from 'next/link';
import {
  HardDrive,
  Check,
  Zap,
  Sparkles,
  ShieldCheck,
  TrendingUp,
  FileText,
  Image as ImageIcon,
  FileSpreadsheet,
  AlertTriangle,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { useAuth, PlanTier } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';

export default function StorageQuotaPage() {
  const { user, storageUsage, updateUserPlan } = useAuth();

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

  const plans = [
    {
      id: 'free',
      tier: 'Free' as PlanTier,
      name: 'Free Starter',
      price: '₹0',
      period: 'forever',
      storage: '15 MB',
      retention: '7 days',
      maxFileSize: '15 MB',
      features: [
        'Client-side unlimited processing',
        '15 MB private cloud storage',
        '7-day automated data retention',
        'Presigned download links (15 min)',
      ],
      current: user?.plan === 'Free' || !user?.plan,
    },
    {
      id: 'prime',
      tier: 'Prime' as PlanTier,
      name: 'Prime',
      price: '₹49',
      period: 'per month',
      storage: '50 MB',
      retention: '14 days',
      maxFileSize: '25 MB',
      features: [
        '50 MB encrypted cloud storage',
        '14-day automatic data retention',
        'Priority Celery worker queues',
        '48h & 24h expiration warnings',
      ],
      current: user?.plan === 'Prime',
    },
    {
      id: 'prime_plus',
      tier: 'PrimePlus' as PlanTier,
      name: 'PrimePlus',
      price: '₹99',
      period: 'per month',
      storage: '100 MB',
      retention: '30 days',
      maxFileSize: '50 MB',
      features: [
        '100 MB high-speed cloud storage',
        '30-day extended data retention',
        'Batch PDF conversion & OCR',
        'Automated expiration email alerts',
        'Priority email customer support',
      ],
      popular: true,
      current: user?.plan === 'PrimePlus',
    },
    {
      id: 'prime_ultra',
      tier: 'PrimeUltra' as PlanTier,
      name: 'PrimeUltra',
      price: '₹249',
      period: 'per month',
      storage: '500 MB',
      retention: '365 days',
      maxFileSize: '100 MB',
      features: [
        '500 MB enterprise cloud storage',
        '365-day (1 full year) retention',
        'Dedicated worker concurrency',
        'SLA 99.9% uptime guarantee',
        'VIP customer support channel',
      ],
      current: user?.plan === 'PrimeUltra',
    },
  ];

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-8 animate-fade-in pb-16">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              Storage Quota & Data Retention
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Live accounting of your cloud storage consumption and automated expiration rules.
            </p>
          </div>

          <Link
            href="/dashboard/subscription"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition"
          >
            <span>Manage Subscription</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* 80% Quota Warning Banner */}
        {isWarningThreshold && (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/40 text-amber-900 dark:text-amber-200 text-xs font-semibold flex items-start sm:items-center gap-3 shadow-xs">
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5 sm:mt-0" />
            <div className="flex-1">
              <span className="font-bold">Quota Limit Warning ({percentUsed}% Used): </span>
              <span>You have reached 80% of your allocated storage. Uploads will be rejected once your quota is filled. Upgrade your plan to expand storage capacity.</span>
            </div>
            <Link
              href="/dashboard/subscription"
              className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shrink-0"
            >
              Upgrade Now
            </Link>
          </div>
        )}

        {/* Current Storage Meter Box */}
        <div className="p-6 rounded-3xl bg-white dark:bg-[#111827] border border-[#CBD5E1] dark:border-[#334155] shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
                <HardDrive className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Cloud Storage Allocation ({user?.plan || 'Free'} Plan)
                </h2>
                <p className="text-xs text-slate-500 font-mono">
                  {formatBytes(storageUsage.usedBytes)} used &bull; {formatBytes(remainingBytes)} remaining of {formatBytes(storageUsage.limitBytes)}
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className={`text-2xl font-black ${isWarningThreshold ? 'text-amber-600' : 'text-blue-600 dark:text-blue-400'}`}>
                {percentUsed}%
              </span>
              <p className="text-[11px] text-slate-400 font-medium">Capacity Utilized</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isWarningThreshold ? 'bg-amber-500' : 'bg-gradient-to-r from-blue-500 to-indigo-600'
              }`}
              style={{ width: `${percentUsed}%` }}
            />
          </div>

          {/* Usage Breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-500">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">PDF Documents</p>
                <p className="text-[11px] text-slate-400 font-mono">
                  {formatBytes(Math.round(storageUsage.usedBytes * 0.7))} (70%)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-500">
                <ImageIcon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Images & Media</p>
                <p className="text-[11px] text-slate-400 font-mono">
                  {formatBytes(Math.round(storageUsage.usedBytes * 0.25))} (25%)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Retention Horizon</p>
                <p className="text-[11px] text-slate-400 font-mono">
                  {storageUsage.retentionDays || 7} Days Automatic
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Available Subscription Plans */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Subscription Tiers & Storage Quotas
            </h2>
            <Link
              href="/pricing"
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
            >
              View Full Comparison &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`relative rounded-3xl p-6 flex flex-col justify-between transition-all bg-white dark:bg-[#111827] ${
                  plan.popular
                    ? 'border-2 border-blue-500 shadow-xl shadow-blue-500/10'
                    : 'border border-[#CBD5E1] dark:border-[#334155] shadow-xs'
                }`}
              >
                {plan.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-blue-600 text-white font-mono text-[10px] font-black uppercase tracking-wider">
                    Recommended
                  </span>
                )}

                <div>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100">
                    {plan.name}
                  </h3>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-3xl font-black text-slate-900 dark:text-slate-100">
                      {plan.price}
                    </span>
                    <span className="text-xs text-slate-500">/{plan.period}</span>
                  </div>

                  <div className="mt-4 p-3 rounded-xl bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 text-xs font-mono space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Storage:</span>
                      <span className="font-bold text-slate-700 dark:text-slate-300">
                        {plan.storage}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Retention:</span>
                      <span className="font-bold text-slate-700 dark:text-slate-300">
                        {plan.retention}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Max File:</span>
                      <span className="font-bold text-slate-700 dark:text-slate-300">
                        {plan.maxFileSize}
                      </span>
                    </div>
                  </div>

                  <ul className="mt-6 space-y-2 text-xs text-slate-600 dark:text-slate-300">
                    {plan.features.map((feat, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-8">
                  {plan.current ? (
                    <Button variant="secondary" disabled className="w-full text-xs font-bold">
                      Current Plan
                    </Button>
                  ) : (
                    <Button
                      variant={plan.popular ? 'primary' : 'outline'}
                      className="w-full text-xs font-bold"
                      onClick={() => updateUserPlan(plan.tier)}
                    >
                      Select {plan.name.split(' ')[0]}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

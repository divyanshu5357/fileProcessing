'use client';

import React from 'react';
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
} from 'lucide-react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';

export default function StorageQuotaPage() {
  const { user, storageUsage } = useAuth();

  const percentUsed = Math.min(
    100,
    Math.round((storageUsage.usedBytes / storageUsage.limitBytes) * 100)
  );

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const plans = [
    {
      id: 'free',
      name: 'Free Starter',
      price: '$0',
      period: 'forever',
      storage: '500 MB',
      maxFileSize: '50 MB',
      conversions: '100 / month',
      features: [
        'Client-side unlimited processing',
        '500 MB private AWS S3 storage',
        'Standard Celery background queue',
        'Presigned download links (15 min)',
      ],
      current: user?.plan === 'Free' || !user?.plan,
    },
    {
      id: 'pro',
      name: 'Pro Architect',
      price: '$19',
      period: 'per month',
      storage: '25 GB',
      maxFileSize: '1 GB',
      conversions: '2,500 / month',
      features: [
        '25 GB encrypted S3 storage',
        'Direct browser multipart uploads',
        'High-priority Celery queues',
        'Batch PDF conversion & OCR',
        'Multi-user workspace sharing',
      ],
      popular: true,
      current: user?.plan === 'Pro',
    },
    {
      id: 'business',
      name: 'Enterprise Scale',
      price: '$79',
      period: 'per month',
      storage: '100 GB',
      maxFileSize: '5 GB',
      conversions: 'Unlimited',
      features: [
        '100 GB dedicated S3 bucket',
        'Custom Celery worker concurrency',
        'Full document OCR text injection',
        'SLA 99.99% uptime guarantee',
        'Dedicated Neon connection pool',
      ],
      current: user?.plan === 'Business',
    },
  ];

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Cloud Storage & Quota Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time accounting of your Amazon S3 storage and Celery processing allotment.
          </p>
        </div>

        {/* Current Storage Meter Box */}
        <div className="p-6 rounded-3xl bg-white dark:bg-[#111827] border border-[#CBD5E1] dark:border-[#334155] shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
                <HardDrive className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Storage Allocation
                </h2>
                <p className="text-xs text-slate-500 font-mono">
                  {formatBytes(storageUsage.usedBytes)} used of {formatBytes(storageUsage.limitBytes)}
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-2xl font-black text-blue-600 dark:text-blue-400">
                {percentUsed}%
              </span>
              <p className="text-[11px] text-slate-400 font-medium">Capacity Utilized</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-linear-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-500"
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
                <p className="text-[11px] text-slate-400 font-mono">112 MB (78%)</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-500">
                <ImageIcon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Images & WebP</p>
                <p className="text-[11px] text-slate-400 font-mono">24 MB (17%)</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Spreadsheets & Other</p>
                <p className="text-[11px] text-slate-400 font-mono">6 MB (5%)</p>
              </div>
            </div>
          </div>
        </div>

        {/* Subscription Plans */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            Available SaaS Subscription Plans
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`relative rounded-3xl p-6 flex flex-col justify-between transition-all ${
                  plan.popular
                    ? 'border-2 border-blue-500 bg-white dark:bg-[#111827] shadow-xl shadow-blue-500/10'
                    : 'border border-[#CBD5E1] dark:border-[#334155] bg-white dark:bg-[#111827] shadow-xs'
                }`}
              >
                {plan.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-blue-600 text-white font-mono text-[10px] font-black uppercase tracking-wider">
                    Most Popular
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
                      <span className="text-slate-400">S3 Storage:</span>
                      <span className="font-bold text-slate-700 dark:text-slate-300">
                        {plan.storage}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Max File:</span>
                      <span className="font-bold text-slate-700 dark:text-slate-300">
                        {plan.maxFileSize}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Conversions:</span>
                      <span className="font-bold text-slate-700 dark:text-slate-300">
                        {plan.conversions}
                      </span>
                    </div>
                  </div>

                  <ul className="mt-6 space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
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
                      variant={plan.popular ? 'primary' : 'secondary'}
                      className="w-full text-xs font-bold"
                      onClick={() => alert(`Upgrading account subscription to ${plan.name}`)}
                    >
                      Upgrade to {plan.name.split(' ')[0]}
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

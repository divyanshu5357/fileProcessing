'use client';

import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sliders,
  ShieldCheck,
  CreditCard,
  Save,
  Sparkles,
  Power,
  Lock,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

export interface AdminPlanItem {
  id: string;
  slug: string;
  tier: 'Free' | 'Prime' | 'PrimePlus' | 'PrimeUltra';
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

export interface AdminControlsPayload {
  siteSettings: {
    paymentsEnabled: boolean;
    maintenanceMode: boolean;
    announcementBanner: string;
    updatedAt: string | null;
  };
  plans: AdminPlanItem[];
  quotaPolicy: {
    policyKey: string;
    max6hCount: number;
    max24hCount: number;
    max6hBytes: number;
    window6hSeconds: number;
    window24hSeconds: number;
    simpleProducts: string[];
  };
  toolCatalog: Array<{
    id: string;
    title: string;
    category: string;
  }>;
  usageAnalytics?: {
    events6h: number;
    events24h: number;
    events7d: number;
    bytes24h: number;
    uniqueSubjects24h: number;
    totalUsers: number;
    topTools: Array<{ productId: string; count: number; totalBytes: number }>;
  };
}

interface Props {
  controlsData: AdminControlsPayload | null;
  onUpdated: () => void;
}

export function AdminControlsPanel({ controlsData, onUpdated }: Props) {
  if (!controlsData) {
    return (
      <div className="p-12 rounded-3xl bg-white dark:bg-[#111622] border border-[#E9EBF0] dark:border-[#222632] text-center space-y-2">
        <Loader2 className="w-6 h-6 animate-spin text-[#536BCE] mx-auto" />
        <p className="text-xs text-[#727783]">Loading live website controls...</p>
      </div>
    );
  }

  const syncKey = JSON.stringify({
    updatedAt: controlsData.siteSettings?.updatedAt,
    policy: controlsData.quotaPolicy,
    plans: controlsData.plans,
  });

  return <AdminControlsForm key={syncKey} controlsData={controlsData} onUpdated={onUpdated} />;
}

function AdminControlsForm({
  controlsData,
  onUpdated,
}: {
  controlsData: AdminControlsPayload;
  onUpdated: () => void;
}) {
  const [paymentsEnabled, setPaymentsEnabled] = useState(() =>
    Boolean(controlsData.siteSettings?.paymentsEnabled)
  );
  const [maintenanceMode, setMaintenanceMode] = useState(() =>
    Boolean(controlsData.siteSettings?.maintenanceMode)
  );
  const [announcementBanner, setAnnouncementBanner] = useState(
    () => controlsData.siteSettings?.announcementBanner || ''
  );

  const [max6hCount, setMax6hCount] = useState(() => controlsData.quotaPolicy?.max6hCount || 4);
  const [max24hCount, setMax24hCount] = useState(() => controlsData.quotaPolicy?.max24hCount || 9);
  const [max6hMb, setMax6hMb] = useState(() =>
    Math.max(1, Math.round((controlsData.quotaPolicy?.max6hBytes || 15728640) / (1024 * 1024)))
  );
  const [window6hHours, setWindow6hHours] = useState(() =>
    Math.max(1, Math.round((controlsData.quotaPolicy?.window6hSeconds || 21600) / 3600))
  );
  const [simpleProducts, setSimpleProducts] = useState<string[]>(
    () => controlsData.quotaPolicy?.simpleProducts || []
  );

  const [editablePlans, setEditablePlans] = useState<AdminPlanItem[]>(
    () => controlsData.plans || []
  );
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const callControlsApi = async (key: string, payload: Record<string, unknown>, okText: string) => {
    setSavingKey(key);
    setStatusMessage(null);
    try {
      const res = await fetch('/api/admin/controls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || 'Request failed');
      }
      setStatusMessage({ type: 'success', text: okText });
      onUpdated();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save settings.';
      setStatusMessage({ type: 'error', text: message });
    } finally {
      setSavingKey(null);
    }
  };

  const handleToggleSimpleTool = (toolId: string) => {
    setSimpleProducts((prev) =>
      prev.includes(toolId) ? prev.filter((id) => id !== toolId) : [...prev, toolId]
    );
  };

  const updatePlanDraft = (planId: string, patch: Partial<AdminPlanItem>) => {
    setEditablePlans((prev) =>
      prev.map((p) => (p.id === planId ? { ...p, ...patch } : p))
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {statusMessage && (
        <div
          className={`p-4 rounded-2xl border text-xs font-semibold flex items-center gap-2.5 ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/60 text-emerald-700 dark:text-emerald-300'
              : 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* SECTION 1: Payment Mode & Site Status */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#111622] border border-[#E9EBF0] dark:border-[#222632] space-y-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E9EBF0] dark:border-[#222632] pb-4">
          <div className="space-y-1">
            <h2 className="text-base font-bold text-[#20232B] dark:text-[#F8FAFC] flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-[#536BCE]" />
              <span>Paid Plans & Payment Mode Control</span>
            </h2>
            <p className="text-xs text-[#727783] dark:text-[#9DA3AE]">
              Switch Pricing & Download Upgrade modals between Coming Soon and Live Active checkout across the entire website.
            </p>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold shrink-0 ${
              paymentsEnabled
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
            }`}
          >
            {paymentsEnabled ? 'Live Active Mode' : 'Coming Soon Mode'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-[#F7F8FA] dark:bg-[#0D1017] border border-[#E9EBF0] dark:border-[#222632] flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <p className="text-xs font-bold text-[#20232B] dark:text-[#F8FAFC]">
                Enable Paid Plan Upgrades
              </p>
              <p className="text-[11px] text-[#727783] dark:text-[#9DA3AE]">
                When OFF, all paid plans show Coming Soon. When ON, users can upgrade immediately.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setPaymentsEnabled((v) => !v)}
              className={`w-12 h-7 rounded-full transition-colors p-1 cursor-pointer shrink-0 ${
                paymentsEnabled ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
              }`}
              aria-label="Toggle live paid plans"
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-xs transition-transform ${
                  paymentsEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="p-4 rounded-2xl bg-[#F7F8FA] dark:bg-[#0D1017] border border-[#E9EBF0] dark:border-[#222632] flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <p className="text-xs font-bold text-[#20232B] dark:text-[#F8FAFC]">
                Maintenance Mode Notice
              </p>
              <p className="text-[11px] text-[#727783] dark:text-[#9DA3AE]">
                Display a global announcement or pause banner for platform maintenance.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setMaintenanceMode((v) => !v)}
              className={`w-12 h-7 rounded-full transition-colors p-1 cursor-pointer shrink-0 ${
                maintenanceMode ? 'bg-rose-600' : 'bg-slate-300 dark:bg-slate-700'
              }`}
              aria-label="Toggle maintenance mode"
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-xs transition-transform ${
                  maintenanceMode ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3">
          <div className="flex-1 space-y-1">
            <label className="text-xs font-semibold text-[#727783] dark:text-[#9DA3AE]">
              Pricing / Website Announcement Banner (Optional)
            </label>
            <input
              type="text"
              value={announcementBanner}
              onChange={(e) => setAnnouncementBanner(e.target.value)}
              placeholder="e.g., Festive Launch Offer: Instant account upgrades now live."
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E9EBF0] dark:border-[#222632] bg-[#F7F8FA] dark:bg-[#0D1017] text-xs"
            />
          </div>
          <Button
            type="button"
            variant="primary"
            disabled={savingKey === 'site_settings'}
            onClick={() =>
              callControlsApi(
                'site_settings',
                {
                  action: 'update_site_settings',
                  paymentsEnabled,
                  maintenanceMode,
                  announcementBanner,
                },
                'Payment availability & site settings saved.'
              )
            }
            className="text-xs font-bold px-5 py-2.5 flex items-center gap-2 shrink-0"
          >
            {savingKey === 'site_settings' ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Power className="w-3.5 h-3.5" />
            )}
            <span>Save Payment Mode</span>
          </Button>
        </div>
      </div>

      {/* SECTION 2: Server-Signed Free Quota Limits */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#111622] border border-[#E9EBF0] dark:border-[#222632] space-y-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E9EBF0] dark:border-[#222632] pb-4">
          <div className="space-y-1">
            <h2 className="text-base font-bold text-[#20232B] dark:text-[#F8FAFC] flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Export Quota & Fair-Use Limit Controls (HMAC Signed)</span>
            </h2>
            <p className="text-xs text-[#727783] dark:text-[#9DA3AE]">
              Enforced silently on server exports. Free users can process up to the cumulative MB and task cap within the refresh window.
            </p>
          </div>
          <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-600 dark:text-emerald-400">
            <Lock className="w-3 h-3" />
            Tamper-Protected
          </span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-[#727783]">Window Task Limit</label>
            <input
              type="number"
              min={1}
              max={500}
              value={max6hCount}
              onChange={(e) => setMax6hCount(Number(e.target.value) || 1)}
              className="w-full px-3 py-2 rounded-xl border border-[#E9EBF0] dark:border-[#222632] bg-[#F7F8FA] dark:bg-[#0D1017] text-sm font-bold"
            />
            <span className="text-[10px] text-[#727783]">Tasks per refresh cycle</span>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-[#727783]">Daily 24h Cap</label>
            <input
              type="number"
              min={1}
              max={2000}
              value={max24hCount}
              onChange={(e) => setMax24hCount(Number(e.target.value) || 1)}
              className="w-full px-3 py-2 rounded-xl border border-[#E9EBF0] dark:border-[#222632] bg-[#F7F8FA] dark:bg-[#0D1017] text-sm font-bold"
            />
            <span className="text-[10px] text-[#727783]">Max tasks per 24 hours</span>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-[#727783]">Cumulative Space (MB)</label>
            <input
              type="number"
              min={1}
              max={2048}
              value={max6hMb}
              onChange={(e) => setMax6hMb(Number(e.target.value) || 1)}
              className="w-full px-3 py-2 rounded-xl border border-[#E9EBF0] dark:border-[#222632] bg-[#F7F8FA] dark:bg-[#0D1017] text-sm font-bold"
            />
            <span className="text-[10px] text-[#727783]">Total MB pooled across files</span>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-[#727783]">Refresh Hours</label>
            <input
              type="number"
              min={1}
              max={168}
              value={window6hHours}
              onChange={(e) => setWindow6hHours(Number(e.target.value) || 1)}
              className="w-full px-3 py-2 rounded-xl border border-[#E9EBF0] dark:border-[#222632] bg-[#F7F8FA] dark:bg-[#0D1017] text-sm font-bold"
            />
            <span className="text-[10px] text-[#727783]">Cooldown reset interval</span>
          </div>
        </div>

        <div className="space-y-2.5 pt-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-[#20232B] dark:text-[#F8FAFC]">
              Unlimited Simple Tools vs Metered Heavy Tools
            </p>
            <span className="text-[11px] text-[#727783]">
              Highlighted = Unlimited Free | Unselected = Metered Quota
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {(controlsData.toolCatalog || []).map((tool) => {
              const isSimple = simpleProducts.includes(tool.id.toLowerCase());
              return (
                <button
                  key={tool.id}
                  type="button"
                  onClick={() => handleToggleSimpleTool(tool.id.toLowerCase())}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                    isSimple
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                      : 'bg-[#F7F8FA] dark:bg-[#0D1017] border-[#E9EBF0] dark:border-[#222632] text-[#727783] dark:text-[#9DA3AE] hover:border-amber-400'
                  }`}
                >
                  {tool.title} {isSimple ? '(Unlimited)' : '(Metered)'}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button
            type="button"
            variant="primary"
            disabled={savingKey === 'quota_policy'}
            onClick={() =>
              callControlsApi(
                'quota_policy',
                {
                  action: 'update_quota_policy',
                  max6hCount,
                  max24hCount,
                  max6hMb,
                  window6hHours,
                  simpleProducts,
                },
                'Signed quota policy updated across all routes.'
              )
            }
            className="text-xs font-bold px-5 py-2.5 flex items-center gap-2"
          >
            {savingKey === 'quota_policy' ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            <span>Save & Sign Quota Policy</span>
          </Button>
        </div>
      </div>

      {/* SECTION 3: Subscription Plan Tiers & Limits */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#111622] border border-[#E9EBF0] dark:border-[#222632] space-y-5 shadow-xs">
        <div className="space-y-1 border-b border-[#E9EBF0] dark:border-[#222632] pb-4">
          <h2 className="text-base font-bold text-[#20232B] dark:text-[#F8FAFC] flex items-center gap-2">
            <Sliders className="w-4 h-4 text-[#536BCE]" />
            <span>Subscription Plan Pricing & Storage Limits</span>
          </h2>
          <p className="text-xs text-[#727783] dark:text-[#9DA3AE]">
            Changes immediately update Pricing tables, checkout billing amounts, and user tier quotas.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {editablePlans.map((plan) => {
            const storageMb = Math.round((plan.storageLimitBytes || 0) / (1024 * 1024));
            const maxFileMb = Math.round((plan.maxFileSizeBytes || 0) / (1024 * 1024));
            return (
              <div
                key={plan.id}
                className="p-5 rounded-2xl bg-[#F7F8FA] dark:bg-[#0D1017] border border-[#E9EBF0] dark:border-[#222632] space-y-4"
              >
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-black text-[#20232B] dark:text-[#F8FAFC]">
                      {plan.name}
                    </h3>
                    <span className="text-[10px] font-mono text-[#727783]">Tier ID: {plan.id}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        updatePlanDraft(plan.id, { isRecommended: !plan.isRecommended })
                      }
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border cursor-pointer ${
                        plan.isRecommended
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-white dark:bg-[#111622] text-[#727783] border-[#E9EBF0] dark:border-[#222632]'
                      }`}
                    >
                      <Sparkles className="w-3 h-3 inline mr-1" />
                      {plan.isRecommended ? 'Featured' : 'Feature'}
                    </button>
                    {plan.id !== 'free' && (
                      <button
                        type="button"
                        onClick={() => updatePlanDraft(plan.id, { isActive: !plan.isActive })}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer ${
                          plan.isActive
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
                            : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                        }`}
                      >
                        {plan.isActive ? 'Visible' : 'Hidden'}
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-[#727783]">Monthly (₹)</label>
                    <input
                      type="number"
                      min={0}
                      disabled={plan.id === 'free'}
                      value={plan.priceMonthlyInr}
                      onChange={(e) =>
                        updatePlanDraft(plan.id, {
                          priceMonthlyInr: Math.max(0, Number(e.target.value) || 0),
                        })
                      }
                      className="w-full px-2.5 py-1.5 rounded-xl border border-[#E9EBF0] dark:border-[#222632] bg-white dark:bg-[#111622] font-bold disabled:opacity-50"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-[#727783]">Yearly (₹)</label>
                    <input
                      type="number"
                      min={0}
                      disabled={plan.id === 'free'}
                      value={plan.priceYearlyInr}
                      onChange={(e) =>
                        updatePlanDraft(plan.id, {
                          priceYearlyInr: Math.max(0, Number(e.target.value) || 0),
                        })
                      }
                      className="w-full px-2.5 py-1.5 rounded-xl border border-[#E9EBF0] dark:border-[#222632] bg-white dark:bg-[#111622] font-bold disabled:opacity-50"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-[#727783]">Storage (MB)</label>
                    <input
                      type="number"
                      min={1}
                      value={storageMb}
                      onChange={(e) =>
                        updatePlanDraft(plan.id, {
                          storageLimitBytes: Math.max(1, Number(e.target.value) || 1) * 1024 * 1024,
                        })
                      }
                      className="w-full px-2.5 py-1.5 rounded-xl border border-[#E9EBF0] dark:border-[#222632] bg-white dark:bg-[#111622] font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-[#727783]">Retention (Days)</label>
                    <input
                      type="number"
                      min={1}
                      max={3650}
                      value={plan.retentionDays}
                      onChange={(e) =>
                        updatePlanDraft(plan.id, {
                          retentionDays: Math.max(1, Number(e.target.value) || 1),
                        })
                      }
                      className="w-full px-2.5 py-1.5 rounded-xl border border-[#E9EBF0] dark:border-[#222632] bg-white dark:bg-[#111622] font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-[#727783]">Max File (MB)</label>
                    <input
                      type="number"
                      min={1}
                      value={maxFileMb}
                      onChange={(e) =>
                        updatePlanDraft(plan.id, {
                          maxFileSizeBytes: Math.max(1, Number(e.target.value) || 1) * 1024 * 1024,
                        })
                      }
                      className="w-full px-2.5 py-1.5 rounded-xl border border-[#E9EBF0] dark:border-[#222632] bg-white dark:bg-[#111622] font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-[#727783]">Badge</label>
                    <input
                      type="text"
                      value={plan.badge}
                      onChange={(e) => updatePlanDraft(plan.id, { badge: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded-xl border border-[#E9EBF0] dark:border-[#222632] bg-white dark:bg-[#111622]"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={savingKey === `plan_${plan.id}`}
                    onClick={() =>
                      callControlsApi(
                        `plan_${plan.id}`,
                        {
                          action: 'update_plan',
                          id: plan.id,
                          name: plan.name,
                          badge: plan.badge,
                          description: plan.description,
                          priceMonthlyInr: plan.priceMonthlyInr,
                          priceYearlyInr: plan.priceYearlyInr,
                          storageLimitMb: Math.max(1, Math.round(plan.storageLimitBytes / (1024 * 1024))),
                          retentionDays: plan.retentionDays,
                          maxFileSizeMb: Math.max(1, Math.round(plan.maxFileSizeBytes / (1024 * 1024))),
                          isRecommended: plan.isRecommended,
                          isActive: plan.isActive,
                        },
                        `Saved ${plan.name} plan settings.`
                      )
                    }
                    className="text-xs font-bold px-4 py-2 flex items-center gap-1.5"
                  >
                    {savingKey === `plan_${plan.id}` ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Save className="w-3.5 h-3.5" />
                    )}
                    <span>Save {plan.name}</span>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

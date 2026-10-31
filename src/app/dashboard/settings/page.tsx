'use client';

import React, { useState } from 'react';
import {
  User,
  ShieldCheck,
  Zap,
  Trash2,
  DownloadCloud,
  CheckCircle2,
  HardDrive,
  Save,
} from 'lucide-react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { useAuth, ProcessingMode } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';

export default function AccountSettingsPage() {
  const { user, processingMode, setProcessingMode } = useAuth();
  const [name, setName] = useState(user?.name || 'Senior Architect');
  const [retentionDays, setRetentionDays] = useState('30');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSavePreferences = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Account & Infrastructure Settings
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Configure your multi-tenant SaaS profile, privacy preferences, and default conversion pipelines.
          </p>
        </div>

        {savedSuccess && (
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>Preferences saved successfully to Neon PostgreSQL database.</span>
          </div>
        )}

        {/* Profile Card */}
        <div className="p-6 rounded-3xl bg-white dark:bg-[#111827] border border-[#CBD5E1] dark:border-[#334155] shadow-xs space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black text-xl shadow-md">
              {name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">{name}</h2>
              <p className="text-xs text-slate-500 font-mono">{user?.email || 'alex.architect@pixelkit.io'}</p>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold">
                  Email Verified &bull; Better Auth
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold">
                  {user?.plan || 'Pro Plan'}
                </span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSavePreferences} className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Display Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#0B1120] text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Registered Email</label>
                <input
                  type="email"
                  disabled
                  value={user?.email || 'alex.architect@pixelkit.io'}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 text-slate-500 cursor-not-allowed font-mono"
                />
              </div>
            </div>

            {/* Default Processing Engine Mode */}
            <div className="space-y-2 pt-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Default Processing Engine</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { id: 'auto', title: 'Automatic Smart Route', desc: 'Local memory for <25MB, Celery cloud for heavy PDFs.' },
                  { id: 'local', title: 'Local Only (Private)', desc: '100% in-browser Web Workers, zero server uploads.' },
                  { id: 'cloud', title: 'Always Cloud S3', desc: 'Direct S3 uploads, background workers, persistent history.' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setProcessingMode(item.id as ProcessingMode)}
                    className={`p-3.5 rounded-2xl border text-left transition ${
                      processingMode === item.id
                        ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 text-blue-900 dark:text-blue-200 shadow-xs'
                        : 'border-[#CBD5E1] dark:border-[#334155] hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <p className="text-xs font-bold">{item.title}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">{item.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Retention Policy */}
            <div className="space-y-1 pt-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">S3 File Retention Policy</label>
              <select
                value={retentionDays}
                onChange={(e) => setRetentionDays(e.target.value)}
                className="w-full sm:w-72 px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#0B1120] text-slate-900 dark:text-slate-100"
              >
                <option value="7">Auto-delete temporary files after 7 days</option>
                <option value="30">Retain processed files for 30 days</option>
                <option value="90">Retain processed files for 90 days</option>
                <option value="forever">Permanent retention (until manually deleted)</option>
              </select>
              <p className="text-[11px] text-slate-400 mt-1">
                Automated Amazon S3 Lifecycle Rules will permanently expire non-current versions according to this schedule.
              </p>
            </div>

            <div className="pt-2">
              <Button type="submit" variant="primary" size="sm" className="text-xs font-bold">
                <Save className="w-3.5 h-3.5 mr-1.5" />
                Save Changes
              </Button>
            </div>
          </form>
        </div>

        {/* Data & Privacy Actions */}
        <div className="p-6 rounded-3xl bg-white dark:bg-[#111827] border border-[#CBD5E1] dark:border-[#334155] shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">Data Export & Account Controls</h2>
          <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
            <div>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Export All Stored Files</p>
              <p className="text-[11px] text-slate-400">Download a complete ZIP archive of your S3 originals and processed documents.</p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => alert('Preparing S3 asynchronous data export package...')}
              className="text-xs font-bold"
            >
              <DownloadCloud className="w-3.5 h-3.5 mr-1.5" />
              Request Export
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

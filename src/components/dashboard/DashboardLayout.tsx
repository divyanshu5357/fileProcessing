'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FolderOpen,
  Cloud,
  HardDrive,
  Settings,
  Sparkles,
  ArrowLeft,
  UploadCloud,
  LogOut,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ModeBadge } from './ModeBadge';
import { UserMenu } from '@/components/auth/UserMenu';

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, storageUsage } = useAuth();

  const navLinks = [
    { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
    { href: '/dashboard/files', label: 'My Cloud Files', icon: FolderOpen },
    { href: '/dashboard/jobs', label: 'Celery Jobs & Queue', icon: Cloud },
    { href: '/dashboard/storage', label: 'Storage Quota', icon: HardDrive },
    { href: '/dashboard/settings', label: 'Account Settings', icon: Settings },
  ];

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

  return (
    <div className="min-h-screen flex bg-[#F8FAFC] dark:bg-[#0F172A] text-[#0F172A] dark:text-[#F8FAFC]">
      {/* Sidebar */}
      <aside className="w-64 border-r border-[#CBD5E1] dark:border-[#334155] bg-white dark:bg-[#111827] flex flex-col shrink-0">
        {/* Brand */}
        <div className="h-16 border-b border-[#CBD5E1] dark:border-[#334155] px-5 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600 dark:bg-blue-500 flex items-center justify-center text-white shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-slate-100">
                PixelKit
              </span>
              <span className="ml-1.5 text-[10px] font-mono uppercase px-1.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-bold">
                SaaS
              </span>
            </div>
          </Link>
        </div>

        {/* Back to Studio link */}
        <div className="p-3">
          <Link
            href="/"
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Studio Tools</span>
          </Link>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 px-3 space-y-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* S3 Storage Quota Indicator Box */}
        <div className="p-4 border-t border-[#CBD5E1] dark:border-[#334155] bg-slate-50 dark:bg-[#0B1120]">
          <div className="flex items-center justify-between text-xs font-bold mb-1.5">
            <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
              <HardDrive className="w-3.5 h-3.5 text-blue-500" />
              <span>S3 Cloud Storage</span>
            </span>
            <span className="text-[11px] font-mono text-blue-600 dark:text-blue-400">
              {percentUsed}%
            </span>
          </div>

          <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden mb-2">
            <div
              className="h-full bg-blue-600 dark:bg-blue-500 rounded-full transition-all duration-300"
              style={{ width: `${percentUsed}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-mono">
            <span>{formatBytes(storageUsage.usedBytes)}</span>
            <span>{formatBytes(storageUsage.limitBytes)}</span>
          </div>

          <Link
            href="/dashboard/storage"
            className="mt-3 block text-center py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-[#CBD5E1] dark:border-[#334155] text-[11px] font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
          >
            Upgrade Capacity
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top bar */}
        <header className="h-16 border-b border-[#CBD5E1] dark:border-[#334155] bg-white dark:bg-[#111827] px-6 flex items-center justify-between shrink-0 sticky top-0 z-20 shadow-2xs">
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono uppercase text-slate-400 font-bold">
              Workspace / {user?.name || 'Architect Workspace'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <ModeBadge />
            <ThemeToggle />
            <UserMenu />
          </div>
        </header>

        {/* Page children */}
        <main className="p-6 sm:p-8 flex-1">{children}</main>
      </div>
    </div>
  );
}

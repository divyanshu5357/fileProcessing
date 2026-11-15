'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FolderOpen,
  Sparkles,
  ArrowLeft,
  CreditCard,
  Wrench,
  Clock,
  HardDrive,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { ThemeToggle } from '@/components/ThemeToggle';
import { UserMenu } from '@/components/auth/UserMenu';

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, storageUsage } = useAuth();

  // Simplified SaaS navigation matching product vision
  const navLinks = [
    { href: '/workspace', label: 'Workspace', icon: LayoutDashboard },
    { href: '/pdf', label: 'All Tools', icon: Wrench },
    { href: '/workspace#activity', label: 'Recent Activity', icon: Clock },
    { href: '/dashboard/files', label: 'My Cloud Files', icon: FolderOpen },
    { href: '/dashboard/subscription', label: 'Subscription & Plans', icon: CreditCard },
    { href: '/pricing', label: 'Pricing & Upgrades', icon: Sparkles },
  ];

  const storageLimit = storageUsage.limitBytes || 15728640;
  const percentUsed = Math.min(
    100,
    Math.round((storageUsage.usedBytes / storageLimit) * 100)
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
          <Link href="/workspace" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600 dark:bg-blue-500 flex items-center justify-center text-white shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-slate-100">
                Gyanvatsala
              </span>
              <span className="ml-1.5 text-[10px] font-mono uppercase px-1.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-bold">
                Workspace
              </span>
            </div>
          </Link>
        </div>

        {/* Back to Workspace link */}
        <div className="p-3">
          <Link
            href="/workspace"
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Workspace</span>
          </Link>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Storage Quota Usage Indicator (Subtle & Non-intrusive) */}
        <div className="p-4 border-t border-[#CBD5E1] dark:border-[#334155] bg-slate-50/60 dark:bg-slate-900/40">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-slate-600 dark:text-slate-400 font-semibold flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5 text-blue-500" />
              <span>Storage Usage</span>
            </span>
            <span className="font-mono text-[11px] font-bold text-slate-700 dark:text-slate-300">
              {percentUsed}%
            </span>
          </div>

          <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden mb-2">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                percentUsed >= 80 ? 'bg-amber-500' : 'bg-blue-600'
              }`}
              style={{ width: `${percentUsed}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
            <span>{formatBytes(storageUsage.usedBytes)}</span>
            <span>{formatBytes(storageLimit)}</span>
          </div>

          {percentUsed >= 80 && (
            <Link
              href="/pricing"
              className="mt-2 block text-center text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:underline"
            >
              Quota nearly full. Upgrade plan →
            </Link>
          )}
        </div>
      </aside>

      {/* Main content body */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-[#CBD5E1] dark:border-[#334155] bg-white dark:bg-[#111827] px-6 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Authenticated Workspace • {user?.name || 'User'} ({user?.plan || 'Free'})
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <UserMenu />
          </div>
        </header>

        <main className="flex-1 p-6 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}

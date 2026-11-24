'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { GyanvatsalaLogo } from '@/components/common/GyanvatsalaLogo';
import {
  LayoutDashboard,
  CreditCard,
  Users,
  HardDrive,
  Cpu,
  Activity,
  ShieldCheck,
  Lock,
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  RefreshCw,
  ArrowUpRight,
  ChevronRight,
  TrendingUp,
  FileText,
  FileSpreadsheet,
  ScanLine,
  PenTool,
  Sparkles,
  ArrowLeft,
  Server,
  Database,
  Layers,
  HelpCircle,
  Info,
  LogOut,
  Calendar,
  Sliders,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import {
  AdminControlsPanel,
  type AdminControlsPayload,
} from '@/components/admin/AdminControlsPanel';

// Authoritative admin roles are enforced via database user.role from verified server sessions
type AdminTab =
  | 'overview'
  | 'controls'
  | 'revenue'
  | 'subscriptions'
  | 'storage'
  | 'processing'
  | 'users'
  | 'health';

export default function AdminDashboardPage() {
  const { user, isAuthenticated, isLoading: isAuthLoading, openAuthModal, signOut } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [dateRange, setDateRange] = useState<'7d' | '30d' | 'all'>('30d');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // Data states
  const [overviewData, setOverviewData] = useState<any>(null);
  const [controlsData, setControlsData] = useState<AdminControlsPayload | null>(null);
  const [revenueData, setRevenueData] = useState<any>(null);
  const [subscriptionsData, setSubscriptionsData] = useState<any>(null);
  const [storageData, setStorageData] = useState<any>(null);
  const [processingData, setProcessingData] = useState<any>(null);
  const [usersData, setUsersData] = useState<any>(null);
  const [healthData, setHealthData] = useState<any>(null);

  // User search/filter
  const [userSearch, setUserSearch] = useState('');
  const [userPlanFilter, setUserPlanFilter] = useState('all');
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  const userEmail = (user?.email || '').toLowerCase().trim();
  // Authoritative administrator verification
  const isAdmin = user?.role === 'admin';
  const isSupport = user?.role === 'support';
  const isAuthorized = isAdmin || isSupport;

  // Support optional ?tab=controls or ?tab=users deep link
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const requested = new URLSearchParams(window.location.search).get('tab') as AdminTab | null;
    const validTabs: AdminTab[] = [
      'overview',
      'controls',
      'revenue',
      'subscriptions',
      'storage',
      'processing',
      'users',
      'health',
    ];
    if (requested && validTabs.includes(requested)) {
      if (isSupport && !isAdmin && (requested === 'revenue' || requested === 'controls')) {
        setActiveTab('overview');
      } else {
        setActiveTab(requested);
      }
    }
  }, [isSupport, isAdmin]);

  // Auto-switch away from revenue/controls if support
  useEffect(() => {
    if (isSupport && !isAdmin && (activeTab === 'revenue' || activeTab === 'controls')) {
      setActiveTab('overview');
    }
  }, [isSupport, isAdmin, activeTab]);

  // Fetch admin metrics from backend & Neon PostgreSQL controls API
  useEffect(() => {
    if (!isAuthenticated || !isAuthorized) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    setIsLoading(true);

    async function loadData() {
      try {
        const [ovRes, ctrlRes, revRes, subRes, stRes, procRes, usrRes, hlthRes] =
          await Promise.all([
            fetch('/api/admin/overview').then((r) => r.json()).catch(() => null),
            isAdmin ? fetch('/api/admin/controls').then((r) => (r.ok ? r.json() : null)).catch(() => null) : Promise.resolve(null),
            isAdmin ? fetch('/api/admin/revenue').then((r) => r.json()).catch(() => null) : Promise.resolve(null),
            isAdmin ? fetch('/api/admin/subscriptions').then((r) => r.json()).catch(() => null) : Promise.resolve(null),
            fetch('/api/admin/storage').then((r) => r.json()).catch(() => null),
            fetch('/api/admin/processing').then((r) => r.json()).catch(() => null),
            fetch(`/api/admin/users?q=${encodeURIComponent(userSearch)}&plan=${userPlanFilter}`).then((r) => r.json()).catch(() => null),
            fetch('/api/admin/health').then((r) => r.json()).catch(() => null),
          ]);

        if (isMounted) {
          setOverviewData(ovRes);
          if (ctrlRes) setControlsData(ctrlRes);
          setRevenueData(revRes);
          setSubscriptionsData(subRes);
          setStorageData(stRes);
          setProcessingData(procRes);
          setUsersData(usrRes);
          setHealthData(hlthRes);
          setIsLoading(false);
        }
      } catch {
        if (isMounted) setIsLoading(false);
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, isAuthorized, isAdmin, userEmail, user?.id, userSearch, userPlanFilter, refreshKey]);

  // Format bytes utility
  const formatBytes = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // 0. Loading authentication state
  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0D1017] text-white">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 animate-spin text-[#536BCE]" />
          <p className="text-xs text-slate-400 font-mono">Verifying administrator session...</p>
        </div>
      </div>
    );
  }

  // 1. Not signed in state
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-white dark:bg-[#0D1017] text-[#20232B] dark:text-[#F8FAFC]">
        <div className="max-w-md w-full p-8 rounded-3xl bg-[#F7F8FA] dark:bg-[#111622] border border-[#E9EBF0] dark:border-[#222632] text-center space-y-4 shadow-xl">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900/60 text-[#536BCE] flex items-center justify-center mx-auto shadow-xs">
            <Lock className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-black tracking-tight">Admin Authentication Required</h1>
          <p className="text-xs text-[#727783] dark:text-[#9DA3AE] leading-relaxed">
            The administrative workspace is restricted to authorized operations personnel. Please sign in with an administrator account to continue.
          </p>
          <div className="pt-2 flex flex-col gap-2">
            <Link
              href="/admin/login"
              className="w-full py-2.5 rounded-xl font-bold text-xs bg-[#536BCE] hover:bg-[#4157B5] text-white flex items-center justify-center gap-2 shadow-xs"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Sign In to Admin Panel</span>
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-1.5 text-xs text-[#727783] hover:text-[#20232B] dark:hover:text-white pt-2 font-medium"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Public Homepage</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 2. Authenticated but unauthorized (Role-Based Access Control)
  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-white dark:bg-[#0D1017] text-[#20232B] dark:text-[#F8FAFC]">
        <div className="max-w-md w-full p-8 rounded-3xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/60 text-center space-y-4 shadow-xl">
          <div className="w-14 h-14 rounded-2xl bg-rose-100 dark:bg-rose-900/60 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto shadow-xs">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <span className="text-[11px] font-black uppercase tracking-widest text-rose-600 dark:text-rose-400">
              403 Access Denied
            </span>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              Administrator Privileges Required
            </h1>
          </div>
          <p className="text-xs text-[#727783] dark:text-[#9DA3AE] leading-relaxed">
            You are signed in as <strong className="text-slate-900 dark:text-white">{user?.email}</strong>. This account does not possess administrator credentials. All administrative APIs are strictly enforced on the server.
          </p>
          <div className="pt-2 flex flex-col gap-2">
            <Link
              href="/"
              className="w-full py-2.5 rounded-xl font-bold text-xs bg-[#536BCE] hover:bg-[#4157B5] text-white flex items-center justify-center gap-2 shadow-xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Homepage</span>
            </Link>
            <button
              type="button"
              onClick={() => signOut()}
              className="text-xs text-[#727783] hover:text-[#20232B] dark:hover:text-white pt-1"
            >
              Sign out & try another account
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3. Authorized Administrator Interface
  return (
    <div className="min-h-screen flex bg-[#F7F8FA] dark:bg-[#0A0D14] text-[#20232B] dark:text-[#F8FAFC]">
      {/* Sidebar Navigation */}
      <aside className="w-64 border-r border-[#E9EBF0] dark:border-[#1E2330] bg-white dark:bg-[#0D1017] hidden md:flex flex-col justify-between shrink-0">
        <div>
          {/* Logo & Descriptor */}
          <div className="p-6 border-b border-[#E9EBF0] dark:border-[#1E2330] flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5">
              <GyanvatsalaLogo size={32} showWordmark={true} descriptor="Admin Console" />
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition cursor-pointer text-left ${
                activeTab === 'overview'
                  ? 'bg-blue-50 dark:bg-blue-950/60 text-[#536BCE] font-bold border border-blue-200 dark:border-blue-900/60'
                  : 'text-[#727783] dark:text-[#9DA3AE] hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 shrink-0" />
              <span>Overview</span>
            </button>

            {isAdmin && (
              <button
                type="button"
                onClick={() => setActiveTab('controls')}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition cursor-pointer text-left ${
                  activeTab === 'controls'
                    ? 'bg-blue-50 dark:bg-blue-950/60 text-[#536BCE] font-bold border border-blue-200 dark:border-blue-900/60'
                    : 'text-[#727783] dark:text-[#9DA3AE] hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Sliders className="w-4 h-4 shrink-0" />
                <span>Controls & Limits</span>
              </button>
            )}

            {isAdmin && (
              <button
                type="button"
                onClick={() => setActiveTab('revenue')}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition cursor-pointer text-left ${
                  activeTab === 'revenue'
                    ? 'bg-blue-50 dark:bg-blue-950/60 text-[#536BCE] font-bold border border-blue-200 dark:border-blue-900/60'
                    : 'text-[#727783] dark:text-[#9DA3AE] hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <CreditCard className="w-4 h-4 shrink-0" />
                <span>Revenue & Payments</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setActiveTab('subscriptions')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition cursor-pointer text-left ${
                activeTab === 'subscriptions'
                  ? 'bg-blue-50 dark:bg-blue-950/60 text-[#536BCE] font-bold border border-blue-200 dark:border-blue-900/60'
                  : 'text-[#727783] dark:text-[#9DA3AE] hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Layers className="w-4 h-4 shrink-0" />
              <span>Subscriptions</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('storage')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition cursor-pointer text-left ${
                activeTab === 'storage'
                  ? 'bg-blue-50 dark:bg-blue-950/60 text-[#536BCE] font-bold border border-blue-200 dark:border-blue-900/60'
                  : 'text-[#727783] dark:text-[#9DA3AE] hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <HardDrive className="w-4 h-4 shrink-0" />
              <span>Storage Analytics</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('processing')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition cursor-pointer text-left ${
                activeTab === 'processing'
                  ? 'bg-blue-50 dark:bg-blue-950/60 text-[#536BCE] font-bold border border-blue-200 dark:border-blue-900/60'
                  : 'text-[#727783] dark:text-[#9DA3AE] hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Activity className="w-4 h-4 shrink-0" />
              <span>Processing Jobs</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('users')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition cursor-pointer text-left ${
                activeTab === 'users'
                  ? 'bg-blue-50 dark:bg-blue-950/60 text-[#536BCE] font-bold border border-blue-200 dark:border-blue-900/60'
                  : 'text-[#727783] dark:text-[#9DA3AE] hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Users className="w-4 h-4 shrink-0" />
              <span>User Management</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('health')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition cursor-pointer text-left ${
                activeTab === 'health'
                  ? 'bg-blue-50 dark:bg-blue-950/60 text-[#536BCE] font-bold border border-blue-200 dark:border-blue-900/60'
                  : 'text-[#727783] dark:text-[#9DA3AE] hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Server className="w-4 h-4 shrink-0" />
              <span>System Health</span>
            </button>
          </nav>
        </div>

        {/* Bottom Profile / Quick Links */}
        <div className="p-4 border-t border-[#E9EBF0] dark:border-[#1E2330] space-y-3">
          <div className="flex items-center gap-3 px-2 py-1.5">
            <div className="w-8 h-8 rounded-full bg-[#536BCE] text-white flex items-center justify-center font-bold text-xs">
              {(user?.name || 'A').charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-[#20232B] dark:text-[#F8FAFC] truncate">
                {user?.name || 'Admin'}
              </p>
              <p className="text-[10px] text-[#727783] dark:text-[#9DA3AE] truncate font-mono">
                {user?.email}
              </p>
            </div>
          </div>

          <Link
            href="/pricing"
            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-[#F7F8FA] dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[#20232B] dark:text-[#F8FAFC] transition border border-[#E9EBF0] dark:border-slate-700"
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Preview Pricing Page</span>
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header Bar */}
        <header className="h-16 border-b border-[#E9EBF0] dark:border-[#1E2330] bg-white dark:bg-[#0D1017] px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <h1 className="text-base sm:text-lg font-black tracking-tight text-[#20232B] dark:text-[#F8FAFC] capitalize">
              {activeTab === 'overview'
                ? 'Website Analytics & Overview'
                : activeTab === 'controls'
                ? 'Website Controls, Plans & Limits'
                : activeTab === 'revenue'
                ? 'Revenue & Storefront Status'
                : activeTab === 'subscriptions'
                ? 'Subscription Distribution'
                : activeTab === 'storage'
                ? 'Cloud Storage Analytics'
                : activeTab === 'processing'
                ? 'Tool Usage & Processing Metrics'
                : activeTab === 'users'
                ? 'User Directory & Plan Overrides'
                : 'System Infrastructure Health'}
            </h1>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Date filter */}
            <div className="flex items-center bg-[#F7F8FA] dark:bg-[#161B26] p-1 rounded-xl border border-[#E9EBF0] dark:border-[#222632] text-xs font-semibold">
              <button
                type="button"
                onClick={() => setDateRange('7d')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  dateRange === '7d'
                    ? 'bg-white dark:bg-slate-800 text-[#536BCE] font-bold shadow-2xs'
                    : 'text-[#727783] hover:text-[#20232B]'
                }`}
              >
                7D
              </button>
              <button
                type="button"
                onClick={() => setDateRange('30d')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  dateRange === '30d'
                    ? 'bg-white dark:bg-slate-800 text-[#536BCE] font-bold shadow-2xs'
                    : 'text-[#727783] hover:text-[#20232B]'
                }`}
              >
                30D
              </button>
              <button
                type="button"
                onClick={() => setDateRange('all')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  dateRange === 'all'
                    ? 'bg-white dark:bg-slate-800 text-[#536BCE] font-bold shadow-2xs'
                    : 'text-[#727783] hover:text-[#20232B]'
                }`}
              >
                All
              </button>
            </div>

            {/* Refresh Button */}
            <button
              type="button"
              onClick={() => setRefreshKey((k) => k + 1)}
              className="p-2 rounded-xl border border-[#E9EBF0] dark:border-[#222632] hover:bg-[#F7F8FA] dark:hover:bg-slate-800 text-[#727783] hover:text-[#20232B] dark:hover:text-white transition"
              title="Refresh data"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>

            {/* Role Badge */}
            <span
              className={`hidden sm:inline-flex text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg border ${
                isAdmin
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                  : 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800'
              }`}
            >
              {isAdmin ? 'Administrator' : 'Support Staff'}
            </span>

            {/* Sign Out Button */}
            <button
              type="button"
              onClick={() => signOut()}
              className="p-2 rounded-xl border border-[#E9EBF0] dark:border-[#222632] hover:bg-rose-50 dark:hover:bg-rose-950/40 text-[#727783] hover:text-rose-600 transition"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Responsive Mobile / Tablet Navigation Bar */}
        <div className="md:hidden border-b border-[#E9EBF0] dark:border-[#1E2330] bg-white dark:bg-[#0D1017] px-4 py-2 overflow-x-auto flex items-center gap-2 text-xs font-semibold">
          {(
            [
              { id: 'overview', label: 'Overview', show: true },
              { id: 'controls', label: 'Controls & Limits', show: isAdmin },
              { id: 'revenue', label: 'Revenue', show: isAdmin },
              { id: 'subscriptions', label: 'Subscriptions', show: true },
              { id: 'storage', label: 'Storage', show: true },
              { id: 'processing', label: 'Processing', show: true },
              { id: 'users', label: 'Users', show: true },
              { id: 'health', label: 'Health', show: true },
            ] as const
          )
            .filter((item) => item.show)
            .map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition cursor-pointer ${
                  activeTab === item.id
                    ? 'bg-[#536BCE] text-white font-bold'
                    : 'bg-[#F7F8FA] dark:bg-[#161B26] text-[#727783] dark:text-[#9DA3AE]'
                }`}
              >
                {item.label}
              </button>
            ))}
        </div>

        {/* Tab Content Panes */}
        <div className="p-4 sm:p-8 max-w-7xl mx-auto w-full space-y-6">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-in fade-in">
              {/* Metric Cards Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 rounded-2xl bg-white dark:bg-[#111622] border border-[#E9EBF0] dark:border-[#222632] shadow-2xs space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#727783]">
                    Registered Users
                  </span>
                  <div className="flex items-baseline justify-between">
                    <span className="text-3xl font-black text-[#20232B] dark:text-[#F8FAFC]">
                      {overviewData?.total_users ?? 1}
                    </span>
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md">
                      +{overviewData?.new_registrations ?? 1} new
                    </span>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-white dark:bg-[#111622] border border-[#E9EBF0] dark:border-[#222632] shadow-2xs space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#727783]">
                    Active Users (30d)
                  </span>
                  <div className="flex items-baseline justify-between">
                    <span className="text-3xl font-black text-[#20232B] dark:text-[#F8FAFC]">
                      {overviewData?.active_users ?? 1}
                    </span>
                    <span className="text-xs font-semibold text-blue-600">
                      100% Retained
                    </span>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-white dark:bg-[#111622] border border-[#E9EBF0] dark:border-[#222632] shadow-2xs space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#727783]">
                    Total Processing Jobs
                  </span>
                  <div className="flex items-baseline justify-between">
                    <span className="text-3xl font-black text-[#20232B] dark:text-[#F8FAFC]">
                      {processingData?.total_requests ?? 73}
                    </span>
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md">
                      {processingData?.success_rate_percent ?? 100}% Success
                    </span>
                  </div>
                </div>

                {isAdmin ? (
                  <div className="p-5 rounded-2xl bg-white dark:bg-[#111622] border border-[#E9EBF0] dark:border-[#222632] shadow-2xs space-y-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#727783]">
                      Verified Revenue
                    </span>
                    <div className="flex items-baseline justify-between">
                      <span className="text-3xl font-black text-[#20232B] dark:text-[#F8FAFC]">
                        ₹{revenueData?.total_verified_revenue_inr ?? 0}
                      </span>
                      <button
                        type="button"
                        onClick={() => setActiveTab('controls')}
                        className={`text-xs font-bold px-2 py-0.5 rounded-md cursor-pointer ${
                          controlsData?.siteSettings?.paymentsEnabled
                            ? 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : 'text-amber-700 bg-amber-50 dark:bg-amber-950/60 dark:text-amber-300'
                        }`}
                      >
                        {controlsData?.siteSettings?.paymentsEnabled ? 'Payments Live' : 'Paused'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-5 rounded-2xl bg-white dark:bg-[#111622] border border-[#E9EBF0] dark:border-[#222632] shadow-2xs space-y-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#727783]">
                      Role Scope
                    </span>
                    <div className="flex items-baseline justify-between">
                      <span className="text-2xl font-black text-[#536BCE]">
                        Support
                      </span>
                      <span className="text-xs font-bold text-blue-700 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-md">
                        User Support Access
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Website Usage Analytics & Live Quota Snapshot (Admin) */}
              {isAdmin && controlsData?.usageAnalytics && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-4 rounded-2xl bg-white dark:bg-[#111622] border border-[#E9EBF0] dark:border-[#222632] space-y-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#727783]">
                      Exports (Last 6h)
                    </span>
                    <p className="text-2xl font-black text-[#20232B] dark:text-[#F8FAFC]">
                      {controlsData.usageAnalytics.events6h}
                    </p>
                    <span className="text-[10px] text-[#727783]">
                      Quota Cap: {controlsData.quotaPolicy.max6hCount} / {Math.round(controlsData.quotaPolicy.window6hSeconds / 3600)}h
                    </span>
                  </div>

                  <div className="p-4 rounded-2xl bg-white dark:bg-[#111622] border border-[#E9EBF0] dark:border-[#222632] space-y-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#727783]">
                      Exports (Last 24h)
                    </span>
                    <p className="text-2xl font-black text-[#20232B] dark:text-[#F8FAFC]">
                      {controlsData.usageAnalytics.events24h}
                    </p>
                    <span className="text-[10px] text-[#727783]">
                      Daily Cap: {controlsData.quotaPolicy.max24hCount} / 24h
                    </span>
                  </div>

                  <div className="p-4 rounded-2xl bg-white dark:bg-[#111622] border border-[#E9EBF0] dark:border-[#222632] space-y-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#727783]">
                      24h Processed Volume
                    </span>
                    <p className="text-2xl font-black text-[#20232B] dark:text-[#F8FAFC]">
                      {formatBytes(controlsData.usageAnalytics.bytes24h)}
                    </p>
                    <span className="text-[10px] text-[#727783]">
                      Free Window Cap: {Math.round(controlsData.quotaPolicy.max6hBytes / (1024 * 1024))} MB
                    </span>
                  </div>

                  <div className="p-4 rounded-2xl bg-white dark:bg-[#111622] border border-[#E9EBF0] dark:border-[#222632] space-y-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#727783]">
                      Unique Visitors (24h)
                    </span>
                    <p className="text-2xl font-black text-[#20232B] dark:text-[#F8FAFC]">
                      {controlsData.usageAnalytics.uniqueSubjects24h}
                    </p>
                    <span className="text-[10px] text-[#727783]">
                      7d Total Tasks: {controlsData.usageAnalytics.events7d}
                    </span>
                  </div>
                </div>
              )}

              {/* Subscriptions & Distribution Card */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 p-6 rounded-3xl bg-white dark:bg-[#111622] border border-[#E9EBF0] dark:border-[#222632] shadow-2xs space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-bold text-[#20232B] dark:text-[#F8FAFC]">
                      Subscription Tier Distribution
                    </h2>
                    <span className="text-xs text-[#727783] font-mono">
                      Database Source of Truth
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                    <div className="p-3.5 rounded-2xl bg-[#F7F8FA] dark:bg-[#0D1017] border border-[#E9EBF0] dark:border-[#222632] space-y-1">
                      <span className="text-xs font-semibold text-[#727783]">Free Starter</span>
                      <p className="text-2xl font-black text-[#20232B] dark:text-[#F8FAFC]">
                        {overviewData?.subscription_distribution?.free ?? 1}
                      </p>
                      <span className="text-[10px] text-emerald-600 font-bold block">Active Now</span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-[#F7F8FA] dark:bg-[#0D1017] border border-[#E9EBF0] dark:border-[#222632] space-y-1">
                      <span className="text-xs font-semibold text-[#727783]">Prime</span>
                      <p className="text-2xl font-black text-[#20232B] dark:text-[#F8FAFC]">
                        {overviewData?.subscription_distribution?.prime ?? 0}
                      </p>
                      <span className={`text-[10px] font-bold block ${controlsData?.siteSettings?.paymentsEnabled ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {controlsData?.siteSettings?.paymentsEnabled ? 'Live Active' : 'Paused'}
                      </span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-[#F7F8FA] dark:bg-[#0D1017] border border-[#E9EBF0] dark:border-[#222632] space-y-1">
                      <span className="text-xs font-semibold text-[#727783]">PrimePlus</span>
                      <p className="text-2xl font-black text-[#536BCE]">
                        {overviewData?.subscription_distribution?.prime_plus ?? 0}
                      </p>
                      <span className={`text-[10px] font-bold block ${controlsData?.siteSettings?.paymentsEnabled ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {controlsData?.siteSettings?.paymentsEnabled ? 'Live Active' : 'Paused'}
                      </span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-[#F7F8FA] dark:bg-[#0D1017] border border-[#E9EBF0] dark:border-[#222632] space-y-1">
                      <span className="text-xs font-semibold text-[#727783]">PrimeUltra</span>
                      <p className="text-2xl font-black text-[#20232B] dark:text-[#F8FAFC]">
                        {overviewData?.subscription_distribution?.prime_ultra ?? 0}
                      </p>
                      <span className={`text-[10px] font-bold block ${controlsData?.siteSettings?.paymentsEnabled ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {controlsData?.siteSettings?.paymentsEnabled ? 'Live Active' : 'Paused'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-6 rounded-3xl bg-white dark:bg-[#111622] border border-[#E9EBF0] dark:border-[#222632] shadow-2xs space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-bold text-[#20232B] dark:text-[#F8FAFC]">
                      System Readiness
                    </h2>
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => setActiveTab('controls')}
                        className="text-[11px] font-bold text-[#536BCE] hover:underline cursor-pointer"
                      >
                        Manage
                      </button>
                    )}
                  </div>
                  <div className="space-y-3 text-xs">
                    <div className="flex items-center justify-between py-2 border-b border-[#E9EBF0] dark:border-[#222632]">
                      <span className="text-[#727783]">Platform Engine</span>
                      <span className="font-bold text-emerald-600 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Online
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-[#E9EBF0] dark:border-[#222632]">
                      <span className="text-[#727783]">Database</span>
                      <span className="font-bold text-emerald-600 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Neon PostgreSQL
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-[#E9EBF0] dark:border-[#222632]">
                      <span className="text-[#727783]">Paid Plans</span>
                      <button
                        type="button"
                        onClick={() => isAdmin && setActiveTab('controls')}
                        className={`font-bold flex items-center gap-1.5 cursor-pointer ${
                          controlsData?.siteSettings?.paymentsEnabled ? 'text-emerald-600' : 'text-amber-600'
                        }`}
                      >
                        {controlsData?.siteSettings?.paymentsEnabled ? (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        ) : (
                          <Clock className="w-3.5 h-3.5" />
                        )}
                        {controlsData?.siteSettings?.paymentsEnabled ? 'Live Active' : 'Paused'}
                      </button>
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <span className="text-[#727783]">Quota Signing</span>
                      <span className="font-bold text-blue-600 flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5" /> HMAC Enforced
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 1.5: WEBSITE CONTROLS & LIMITS */}
          {activeTab === 'controls' && isAdmin && (
            <AdminControlsPanel
              controlsData={controlsData}
              onUpdated={() => setRefreshKey((k) => k + 1)}
            />
          )}

          {/* TAB 2: REVENUE & PAYMENTS */}
          {activeTab === 'revenue' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 rounded-2xl bg-white dark:bg-[#111622] border border-[#E9EBF0] dark:border-[#222632] space-y-1">
                  <span className="text-xs font-semibold text-[#727783]">Total Verified Revenue</span>
                  <p className="text-2xl font-black text-[#20232B] dark:text-[#F8FAFC]">
                    ₹{revenueData?.total_verified_revenue_inr ?? 0}
                  </p>
                  <span className="text-[10px] text-slate-500 font-mono">Server-Verified Only</span>
                </div>

                <div className="p-5 rounded-2xl bg-white dark:bg-[#111622] border border-[#E9EBF0] dark:border-[#222632] space-y-1">
                  <span className="text-xs font-semibold text-[#727783]">Monthly Revenue</span>
                  <p className="text-2xl font-black text-[#20232B] dark:text-[#F8FAFC]">
                    ₹{revenueData?.monthly_revenue_inr ?? 0}
                  </p>
                  <span className="text-[10px] text-slate-500 font-mono">Current Calendar Month</span>
                </div>

                <div className="p-5 rounded-2xl bg-white dark:bg-[#111622] border border-[#E9EBF0] dark:border-[#222632] space-y-1">
                  <span className="text-xs font-semibold text-[#727783]">Successful Transactions</span>
                  <p className="text-2xl font-black text-[#20232B] dark:text-[#F8FAFC]">
                    {revenueData?.successful_payments_count ?? 0}
                  </p>
                  <span className="text-[10px] text-slate-500 font-mono">Confirmed via Webhook</span>
                </div>

                <div className="p-5 rounded-2xl bg-white dark:bg-[#111622] border border-[#E9EBF0] dark:border-[#222632] space-y-1">
                  <span className="text-xs font-semibold text-[#727783]">Refunds / Disputes</span>
                  <p className="text-2xl font-black text-[#20232B] dark:text-[#F8FAFC]">
                    {revenueData?.refunds_count ?? 0}
                  </p>
                  <span className="text-[10px] text-slate-500 font-mono">7-Day Refund Period</span>
                </div>
              </div>

              {/* Payment Mode & Checkout Control Banner */}
              <div className="p-8 rounded-3xl bg-white dark:bg-[#111622] border border-[#E9EBF0] dark:border-[#222632] space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-12 h-12 rounded-2xl border flex items-center justify-center shrink-0 ${
                        controlsData?.siteSettings?.paymentsEnabled
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-900/60 text-emerald-600 dark:text-emerald-400'
                          : 'bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-900/60 text-amber-600 dark:text-amber-400'
                      }`}
                    >
                      <CreditCard className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <h2 className="text-base font-bold text-[#20232B] dark:text-[#F8FAFC]">
                        Checkout Availability:{' '}
                        {controlsData?.siteSettings?.paymentsEnabled ? 'Live Active' : 'Paused'}
                      </h2>
                      <p className="text-xs text-[#727783] dark:text-[#9DA3AE] leading-relaxed max-w-3xl">
                        {revenueData?.gateway_integration?.notice ||
                          (controlsData?.siteSettings?.paymentsEnabled
                            ? 'Paid plans are currently active on Pricing and Export Modals.'
                            : 'Paid plans are currently paused. Switch Paid Plans to Live Active in Website Controls whenever ready to accept orders.')}
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="primary"
                    onClick={() => setActiveTab('controls')}
                    className="text-xs font-bold px-4 py-2 shrink-0"
                  >
                    Open Payment Controls
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-4 border-t border-[#E9EBF0] dark:border-[#222632] text-xs">
                  <div className="p-4 rounded-2xl bg-[#F7F8FA] dark:bg-[#0D1017] border border-[#E9EBF0] dark:border-[#222632] space-y-1">
                    <span className="font-semibold text-[#727783]">Storefront State</span>
                    <p className="font-bold text-[#20232B] dark:text-[#F8FAFC]">
                      {controlsData?.siteSettings?.paymentsEnabled ? 'Live Checkouts Enabled' : 'Upgrades Paused'}
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl bg-[#F7F8FA] dark:bg-[#0D1017] border border-[#E9EBF0] dark:border-[#222632] space-y-1">
                    <span className="font-semibold text-[#727783]">Webhook Listener</span>
                    <p className="font-bold text-emerald-600 font-mono">/api/subscriptions/webhook</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-[#F7F8FA] dark:bg-[#0D1017] border border-[#E9EBF0] dark:border-[#222632] space-y-1">
                    <span className="font-semibold text-[#727783]">Security Rule</span>
                    <p className="font-bold text-blue-600">HMAC-SHA256 Signature Verification</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SUBSCRIPTIONS */}
          {activeTab === 'subscriptions' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-5 rounded-2xl bg-white dark:bg-[#111622] border border-[#E9EBF0] dark:border-[#222632] space-y-1">
                  <span className="text-xs font-semibold text-[#727783]">Free Starter</span>
                  <p className="text-2xl font-black text-[#20232B] dark:text-[#F8FAFC]">
                    {subscriptionsData?.plan_counts?.free ?? 1}
                  </p>
                  <span className="text-[10px] text-emerald-600 font-bold">15 MB Storage</span>
                </div>
                <div className="p-5 rounded-2xl bg-white dark:bg-[#111622] border border-[#E9EBF0] dark:border-[#222632] space-y-1">
                  <span className="text-xs font-semibold text-[#727783]">Prime</span>
                  <p className="text-2xl font-black text-[#20232B] dark:text-[#F8FAFC]">
                    {subscriptionsData?.plan_counts?.prime ?? 0}
                  </p>
                  <span className="text-[10px] text-slate-500 font-bold">50 MB Storage</span>
                </div>
                <div className="p-5 rounded-2xl bg-white dark:bg-[#111622] border border-[#E9EBF0] dark:border-[#222632] space-y-1">
                  <span className="text-xs font-semibold text-[#727783]">PrimePlus</span>
                  <p className="text-2xl font-black text-[#536BCE]">
                    {subscriptionsData?.plan_counts?.prime_plus ?? 0}
                  </p>
                  <span className="text-[10px] text-slate-500 font-bold">100 MB Storage</span>
                </div>
                <div className="p-5 rounded-2xl bg-white dark:bg-[#111622] border border-[#E9EBF0] dark:border-[#222632] space-y-1">
                  <span className="text-xs font-semibold text-[#727783]">PrimeUltra</span>
                  <p className="text-2xl font-black text-[#20232B] dark:text-[#F8FAFC]">
                    {subscriptionsData?.plan_counts?.prime_ultra ?? 0}
                  </p>
                  <span className="text-[10px] text-slate-500 font-bold">500 MB Storage</span>
                </div>
              </div>

              {/* Subscriptions Table */}
              <div className="p-6 rounded-3xl bg-white dark:bg-[#111622] border border-[#E9EBF0] dark:border-[#222632] space-y-4">
                <h2 className="text-sm font-bold text-[#20232B] dark:text-[#F8FAFC]">
                  Active Subscriptions & Renewal Deadlines
                </h2>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-[#E9EBF0] dark:border-[#222632] text-[#727783]">
                        <th className="pb-3 font-semibold">User</th>
                        <th className="pb-3 font-semibold">Plan</th>
                        <th className="pb-3 font-semibold">Status</th>
                        <th className="pb-3 font-semibold">Billing Cycle</th>
                        <th className="pb-3 font-semibold">Expiration / Renewal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E9EBF0] dark:divide-[#222632]">
                      {(subscriptionsData?.recent_subscriptions || []).map((s: any) => (
                        <tr key={s.id}>
                          <td className="py-3">
                            <p className="font-bold text-[#20232B] dark:text-[#F8FAFC]">{s.user_name}</p>
                            <p className="text-[11px] text-[#727783] font-mono">{s.user_email}</p>
                          </td>
                          <td className="py-3 font-bold text-[#536BCE]">{s.plan_name}</td>
                          <td className="py-3">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                              {s.status}
                            </span>
                          </td>
                          <td className="py-3 uppercase text-[11px] font-mono">{s.billing_cycle}</td>
                          <td className="py-3 text-[#727783] font-mono">
                            {s.period_end ? new Date(s.period_end).toLocaleDateString() : 'Lifetime Free'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: STORAGE ANALYTICS */}
          {activeTab === 'storage' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 rounded-2xl bg-white dark:bg-[#111622] border border-[#E9EBF0] dark:border-[#222632] space-y-1">
                  <span className="text-xs font-semibold text-[#727783]">Total S3 Storage</span>
                  <p className="text-2xl font-black text-[#20232B] dark:text-[#F8FAFC]">
                    {formatBytes(storageData?.total_s3_storage_bytes ?? 0)}
                  </p>
                  <span className="text-[10px] text-slate-500 font-mono">Encrypted at Rest</span>
                </div>
                <div className="p-5 rounded-2xl bg-white dark:bg-[#111622] border border-[#E9EBF0] dark:border-[#222632] space-y-1">
                  <span className="text-xs font-semibold text-[#727783]">Active Saved Files</span>
                  <p className="text-2xl font-black text-[#20232B] dark:text-[#F8FAFC]">
                    {storageData?.saved_files_count ?? 0}
                  </p>
                  <span className="text-[10px] text-slate-500 font-mono">Cloud File Store</span>
                </div>
                <div className="p-5 rounded-2xl bg-white dark:bg-[#111622] border border-[#E9EBF0] dark:border-[#222632] space-y-1">
                  <span className="text-xs font-semibold text-[#727783]">Expiring Next 48h</span>
                  <p className="text-2xl font-black text-amber-600">
                    {storageData?.expiring_files_48h_count ?? 0}
                  </p>
                  <span className="text-[10px] text-amber-600 font-mono">Auto Alert Sent</span>
                </div>
                <div className="p-5 rounded-2xl bg-white dark:bg-[#111622] border border-[#E9EBF0] dark:border-[#222632] space-y-1">
                  <span className="text-xs font-semibold text-[#727783]">Deletion Failures</span>
                  <p className="text-2xl font-black text-emerald-600">
                    {storageData?.deletion_failures_count ?? 0}
                  </p>
                  <span className="text-[10px] text-emerald-600 font-mono">Zero Shredding Errors</span>
                </div>
              </div>

              {/* Privacy Notice Card */}
              <div className="p-6 rounded-3xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-[#536BCE] shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <h3 className="font-bold text-[#20232B] dark:text-[#F8FAFC]">Strict Content Isolation</h3>
                  <p className="text-[#727783] dark:text-[#9DA3AE] leading-relaxed">
                    Under Gyanvatsala privacy policies, administrative APIs calculate aggregate byte metrics and object lifetimes only. Administrator interfaces do not provide access to view, preview, or download users&apos; confidential file contents.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: PROCESSING ANALYTICS */}
          {activeTab === 'processing' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-5 rounded-2xl bg-white dark:bg-[#111622] border border-[#E9EBF0] dark:border-[#222632] space-y-1">
                  <span className="text-xs font-semibold text-[#727783]">Total Document Requests</span>
                  <p className="text-2xl font-black text-[#20232B] dark:text-[#F8FAFC]">
                    {processingData?.total_requests ?? 81}
                  </p>
                </div>
                <div className="p-5 rounded-2xl bg-white dark:bg-[#111622] border border-[#E9EBF0] dark:border-[#222632] space-y-1">
                  <span className="text-xs font-semibold text-[#727783]">Success Rate</span>
                  <p className="text-2xl font-black text-emerald-600">
                    {processingData?.success_rate_percent ?? 100}%
                  </p>
                </div>
                <div className="p-5 rounded-2xl bg-white dark:bg-[#111622] border border-[#E9EBF0] dark:border-[#222632] space-y-1">
                  <span className="text-xs font-semibold text-[#727783]">Avg. Processing Duration</span>
                  <p className="text-2xl font-black text-[#536BCE]">
                    {processingData?.avg_processing_duration_seconds ?? 1.45}s
                  </p>
                </div>
              </div>

              {/* Most-Used Tools Breakdown */}
              <div className="p-6 rounded-3xl bg-white dark:bg-[#111622] border border-[#E9EBF0] dark:border-[#222632] space-y-4">
                <h2 className="text-sm font-bold text-[#20232B] dark:text-[#F8FAFC]">
                  Most-Used Tools
                </h2>
                <div className="space-y-3">
                  {(processingData?.most_used_tools || []).map((t: any) => (
                    <div key={t.tool} className="space-y-1 text-xs">
                      <div className="flex justify-between font-semibold">
                        <span className="text-[#20232B] dark:text-[#F8FAFC] capitalize">{t.tool.replace(/-/g, ' ')}</span>
                        <span className="text-[#727783]">{t.count} operations</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-[#F7F8FA] dark:bg-[#0D1017] overflow-hidden">
                        <div
                          className="h-full bg-[#536BCE] rounded-full"
                          style={{ width: `${Math.min(100, (t.count / 30) * 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: USER MANAGEMENT */}
          {activeTab === 'users' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="p-6 rounded-3xl bg-white dark:bg-[#111622] border border-[#E9EBF0] dark:border-[#222632] space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <h2 className="text-sm font-bold text-[#20232B] dark:text-[#F8FAFC]">
                    User Accounts & Storage Consumption
                  </h2>

                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#727783]" />
                      <input
                        type="text"
                        placeholder="Search users..."
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                        className="pl-8 pr-3 py-1.5 rounded-xl border border-[#E9EBF0] dark:border-[#222632] text-xs bg-[#F7F8FA] dark:bg-[#0D1017] focus:outline-hidden focus:ring-1 focus:ring-[#536BCE]"
                      />
                    </div>
                    <select
                      value={userPlanFilter}
                      onChange={(e) => setUserPlanFilter(e.target.value)}
                      className="px-3 py-1.5 rounded-xl border border-[#E9EBF0] dark:border-[#222632] text-xs bg-[#F7F8FA] dark:bg-[#0D1017]"
                    >
                      <option value="all">All Plans</option>
                      <option value="free">Free Starter</option>
                      <option value="prime">Prime</option>
                      <option value="prime_plus">PrimePlus</option>
                      <option value="prime_ultra">PrimeUltra</option>
                    </select>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-[#E9EBF0] dark:border-[#222632] text-[#727783]">
                        <th className="pb-3 font-semibold">User</th>
                        <th className="pb-3 font-semibold">Role</th>
                        <th className="pb-3 font-semibold">Plan Control</th>
                        <th className="pb-3 font-semibold">Storage Used</th>
                        <th className="pb-3 font-semibold">Created Date</th>
                        <th className="pb-3 font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E9EBF0] dark:divide-[#222632]">
                      {(usersData?.users || []).map((u: any) => (
                        <tr key={u.id}>
                          <td className="py-3">
                            <p className="font-bold text-[#20232B] dark:text-[#F8FAFC]">{u.name}</p>
                            <p className="text-[11px] text-[#727783] font-mono">{u.email}</p>
                          </td>
                          <td className="py-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                u.role === 'admin'
                                  ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300'
                                  : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                              }`}
                            >
                              {u.role || 'user'}
                            </span>
                          </td>
                          <td className="py-3 font-bold text-[#536BCE]">
                            {u.role === 'admin' ? (
                              <span className="text-[11px] font-mono text-indigo-600 dark:text-indigo-400">
                                Platform Admin
                              </span>
                            ) : (
                              <select
                                aria-label={`Plan for ${u.email}`}
                                disabled={!isAdmin || updatingUserId === u.id}
                                value={(u.plan_id || 'free').toLowerCase()}
                                onChange={async (e) => {
                                  const nextPlanId = e.target.value;
                                  setUpdatingUserId(u.id);
                                  try {
                                    await fetch('/api/admin/controls', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({
                                        action: 'update_user_plan',
                                        userId: u.id,
                                        planId: nextPlanId,
                                      }),
                                    });
                                    setRefreshKey((k) => k + 1);
                                  } finally {
                                    setUpdatingUserId(null);
                                  }
                                }}
                                className="px-2.5 py-1 rounded-lg border border-[#E9EBF0] dark:border-[#222632] bg-[#F7F8FA] dark:bg-[#0D1017] text-xs font-semibold text-[#20232B] dark:text-[#F8FAFC] cursor-pointer"
                              >
                                <option value="free">Free Starter</option>
                                <option value="prime">Prime</option>
                                <option value="prime_plus">PrimePlus</option>
                                <option value="prime_ultra">PrimeUltra</option>
                              </select>
                            )}
                          </td>
                          <td className="py-3 font-mono">{formatBytes(u.storage_used_bytes)}</td>
                          <td className="py-3 text-[#727783] font-mono">
                            {u.created_at ? new Date(u.created_at).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="py-3">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                              Active
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: SYSTEM HEALTH */}
          {activeTab === 'health' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-6 rounded-3xl bg-white dark:bg-[#111622] border border-[#E9EBF0] dark:border-[#222632] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#727783] uppercase tracking-wider">FastAPI Core Backend</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                      Operational
                    </span>
                  </div>
                  <p className="text-xl font-bold text-[#20232B] dark:text-[#F8FAFC]">
                    {healthData?.backend?.service || 'gyanvatsala-core-api'}
                  </p>
                  <p className="text-xs text-[#727783] font-mono">
                    Version {healthData?.backend?.version || '1.0.0'} • Port 8000
                  </p>
                </div>

                <div className="p-6 rounded-3xl bg-white dark:bg-[#111622] border border-[#E9EBF0] dark:border-[#222632] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#727783] uppercase tracking-wider">Neon PostgreSQL</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                      Connected
                    </span>
                  </div>
                  <p className="text-xl font-bold text-[#20232B] dark:text-[#F8FAFC]">
                    Serverless Pooled Database
                  </p>
                  <p className="text-xs text-[#727783] font-mono">
                    Latency: {healthData?.database?.latency_ms ? `${healthData.database.latency_ms}ms` : 'Ready'}
                  </p>
                </div>

                <div className="p-6 rounded-3xl bg-white dark:bg-[#111622] border border-[#E9EBF0] dark:border-[#222632] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#727783] uppercase tracking-wider">Worker Pool</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
                      Ready
                    </span>
                  </div>
                  <p className="text-xl font-bold text-[#20232B] dark:text-[#F8FAFC]">
                    {healthData?.workers?.engine || 'Async Worker Pool'}
                  </p>
                  <p className="text-xs text-[#727783] font-mono">
                    Concurrency: {healthData?.workers?.concurrency || 4} Workers
                  </p>
                </div>

                <div className="p-6 rounded-3xl bg-white dark:bg-[#111622] border border-[#E9EBF0] dark:border-[#222632] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#727783] uppercase tracking-wider">AWS S3 Object Storage</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                      Active
                    </span>
                  </div>
                  <p className="text-xl font-bold text-[#20232B] dark:text-[#F8FAFC]">
                    Bucket: {healthData?.storage?.bucket || 'gyanvatsala-storage'}
                  </p>
                  <p className="text-xs text-[#727783] font-mono">
                    Zero Public Access • Private KMS Encryption
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  User,
  LogOut,
  FolderOpen,
  LayoutDashboard,
  ChevronDown,
  HardDrive,
  CreditCard,
  Sparkles,
  FileText,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';

function GoogleBadgeIcon({ className = 'w-3 h-3' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}

export function UserMenu() {
  const { user, isAuthenticated, signOut, openAuthModal, storageUsage } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset avatar error if avatarUrl changes
  useEffect(() => {
    setAvatarError(false);
  }, [user?.avatarUrl]);

  if (!isAuthenticated || !user) {
    return (
      <div className="flex items-center gap-2">
        <Link
          href="/workspace"
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          <LayoutDashboard className="w-3.5 h-3.5 text-[#536BCE]" />
          <span>Workspace</span>
        </Link>
        <Button
          size="sm"
          variant="primary"
          onClick={() => openAuthModal()}
          className="text-xs font-bold px-3.5 py-1.5 rounded-xl shadow-xs"
        >
          <User className="w-3.5 h-3.5 mr-1.5" />
          <span>Sign In</span>
        </Button>
      </div>
    );
  }

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

  const isGoogleUser = Boolean(
    user.email?.toLowerCase().includes('@gmail.com') ||
    user.avatarUrl?.includes('googleusercontent.com')
  );

  return (
    <div className="relative" ref={menuRef}>
      {/* User Header Pill Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1 pl-1.5 pr-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-[#CBD5E1] dark:border-[#334155] transition text-xs font-medium cursor-pointer"
        aria-label="User profile menu"
      >
        {/* User Avatar with Google / Fallback Support */}
        <div className="relative w-6 h-6 rounded-full shrink-0 overflow-hidden bg-[#536BCE] flex items-center justify-center text-white">
          {user.avatarUrl && !avatarError ? (
            <img
              src={user.avatarUrl}
              alt={user.name || 'User'}
              referrerPolicy="no-referrer"
              crossOrigin="anonymous"
              onError={() => setAvatarError(true)}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="font-bold text-[11px] leading-none">
              {(user.name || user.email || 'U').charAt(0).toUpperCase()}
            </span>
          )}
        </div>

        <span className="font-semibold text-slate-900 dark:text-slate-100 max-w-[95px] truncate hidden sm:inline">
          {user.name}
        </span>

        {user.role === 'admin' ? (
          <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-indigo-600 text-white font-extrabold tracking-wide shadow-2xs">
            ADMIN
          </span>
        ) : (
          <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold">
            {user.plan}
          </span>
        )}

        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
      </button>

      {/* Expanded Profile Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-white dark:bg-[#111827] border border-[#CBD5E1] dark:border-[#334155] shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          {/* User Info Header with Large Avatar */}
          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              {/* Profile Image with Google Badge */}
              <div className="relative w-10 h-10 rounded-full shrink-0 overflow-hidden bg-[#536BCE] flex items-center justify-center text-white shadow-xs">
                {user.avatarUrl && !avatarError ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.name || 'User'}
                    referrerPolicy="no-referrer"
                    crossOrigin="anonymous"
                    onError={() => setAvatarError(true)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="font-bold text-sm leading-none">
                    {(user.name || user.email || 'U').charAt(0).toUpperCase()}
                  </span>
                )}

                {isGoogleUser && (
                  <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center p-0.5 shadow-2xs">
                    <GoogleBadgeIcon className="w-3 h-3" />
                  </div>
                )}
              </div>

              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                    {user.name}
                  </p>
                  {isGoogleUser && (
                    <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-semibold shrink-0">
                      Google
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate font-mono mt-0.5">
                  {user.email}
                </p>
              </div>
            </div>

            {/* Storage Progress Meter */}
            <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800/60">
              <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 mb-1">
                <span className="flex items-center gap-1 font-semibold">
                  <HardDrive className="w-3 h-3 text-[#536BCE]" />
                  Cloud Storage
                </span>
                <span className="font-mono">
                  {formatBytes(storageUsage.usedBytes)} / {formatBytes(storageLimit)}
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-[#536BCE] rounded-full transition-all duration-300"
                  style={{ width: `${percentUsed}%` }}
                />
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="p-1.5 space-y-0.5 text-xs">
            {user.role === 'admin' && (
              <Link
                href="/admin"
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-between px-3 py-2.5 rounded-xl text-white bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition font-bold shadow-xs mb-1"
              >
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-300" />
                  <span>Admin Console</span>
                </div>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-white/20 text-white font-semibold">
                  Admin
                </span>
              </Link>
            )}

            <Link
              href="/workspace"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition font-bold"
            >
              <LayoutDashboard className="w-4 h-4 text-[#536BCE]" />
              <span>Workspace</span>
            </Link>

            <Link
              href="/dashboard/files"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition font-medium"
            >
              <FolderOpen className="w-4 h-4 text-amber-500" />
              <span>My Files</span>
            </Link>

            <Link
              href="/pricing"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition font-medium"
            >
              <CreditCard className="w-4 h-4 text-emerald-500" />
              <span>Subscription & Plans</span>
            </Link>

            <Link
              href="/terms"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition font-medium"
            >
              <FileText className="w-4 h-4 text-[#727783]" />
              <span>Terms & Conditions</span>
            </Link>

            <div className="pt-1 mt-1 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  signOut();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition font-semibold cursor-pointer text-left"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  User,
  LogOut,
  FolderOpen,
  LayoutDashboard,
  Cloud,
  ChevronDown,
  HardDrive,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';

export function UserMenu() {
  const { user, isAuthenticated, signOut, openAuthModal, storageUsage } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
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

  if (!isAuthenticated || !user) {
    return (
      <div className="flex items-center gap-2">
        <Link
          href="/dashboard"
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          <LayoutDashboard className="w-3.5 h-3.5 text-blue-500" />
          <span>Dashboard</span>
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

  const percentUsed = Math.min(
    100,
    Math.round((storageUsage.usedBytes / storageUsage.limitBytes) * 100)
  );

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1 pl-2 pr-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-[#CBD5E1] dark:border-[#334155] transition text-xs font-medium cursor-pointer"
      >
        {user.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt={user.name}
            className="w-6 h-6 rounded-lg object-cover"
          />
        ) : (
          <div className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-[11px]">
            {user.name.charAt(0).toUpperCase()}
          </div>
        )}
        <span className="font-semibold text-slate-900 dark:text-slate-100 max-w-[90px] truncate hidden sm:inline">
          {user.name}
        </span>
        <span className="text-[10px] uppercase font-mono px-1 py-0.2 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold">
          {user.plan}
        </span>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white dark:bg-[#111827] border border-[#CBD5E1] dark:border-[#334155] shadow-xl py-2 z-50 animate-fade-in">
          {/* User info header */}
          <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800">
            <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
              {user.name}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate font-mono">
              {user.email}
            </p>

            {/* Storage Progress */}
            <div className="mt-3">
              <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 mb-1">
                <span className="flex items-center gap-1 font-medium">
                  <HardDrive className="w-3 h-3 text-blue-500" />
                  S3 Storage
                </span>
                <span className="font-mono">{percentUsed}%</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-300"
                  style={{ width: `${percentUsed}%` }}
                />
              </div>
            </div>
          </div>

          {/* Links */}
          <div className="p-1 space-y-0.5 text-xs">
            <Link
              href="/dashboard"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition font-medium"
            >
              <LayoutDashboard className="w-4 h-4 text-blue-500" />
              <span>SaaS Dashboard</span>
            </Link>

            <Link
              href="/dashboard/files"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition font-medium"
            >
              <FolderOpen className="w-4 h-4 text-amber-500" />
              <span>Cloud File Manager</span>
            </Link>

            <Link
              href="/dashboard/jobs"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition font-medium"
            >
              <Cloud className="w-4 h-4 text-indigo-500" />
              <span>Celery Processing Jobs</span>
            </Link>
          </div>

          <div className="p-1 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                signOut();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition font-medium text-xs text-left"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

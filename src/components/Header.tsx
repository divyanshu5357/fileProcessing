'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import {
  ChevronDown,
  FileText,
  ScanLine,
  Image as ImageIcon,
  PenTool,
  ArrowRight,
  Menu,
  X,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { GyanvatsalaLogo } from './common/GyanvatsalaLogo';
import { ThemeToggle } from './ThemeToggle';
import { UserMenu } from './auth/UserMenu';
import { useAuth } from '@/context/AuthContext';

interface HeaderProps {
  activeCategory?: string;
  onSelectCategory?: (category: any) => void;
  onAddImages?: (files: File[]) => void;
  onClearWorkspace?: () => void;
  onOpenShortcuts?: () => void;
  onOpenPrivacyInfo?: () => void;
  queueLength?: number;
}

export function Header({
  onOpenPrivacyInfo,
  onOpenShortcuts,
}: HeaderProps = {}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, openAuthModal } = useAuth();

  const [isScrolled, setIsScrolled] = useState(false);
  const [productsOpen, setProductsOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Detect scroll to add slight elevation and border
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 15);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdown on click outside or escape key
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProductsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setProductsOpen(false);
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setProductsOpen(false);
  }, [pathname]);

  const productItems = [
    {
      title: 'Document Studio',
      description: 'Edit, convert, compress and organize your documents.',
      href: '/pdf',
      icon: FileText,
      accent: 'text-[#536BCE] bg-[#EDF0FF] dark:bg-[#536BCE]/20',
    },
    {
      title: 'Scan Studio',
      description: 'Give digital documents the look and feel of a physical scan.',
      href: '/scan-studio',
      icon: ScanLine,
      accent: 'text-[#059669] bg-emerald-50 dark:bg-emerald-950/40',
    },
    {
      title: 'Media Studio',
      description: 'Prepare images for sharing, publishing and everyday work.',
      href: '/image-converter',
      icon: ImageIcon,
      accent: 'text-[#D97706] bg-amber-50 dark:bg-amber-950/40',
    },
    {
      title: 'Canvas Editor',
      description: 'Make changes to your documents with precision and flexibility.',
      href: '/tools/pdf-editor',
      icon: PenTool,
      accent: 'text-[#7C3AED] bg-purple-50 dark:bg-purple-950/40',
    },
  ];

  return (
    <header
      className={`w-full sticky top-0 z-40 transition-all duration-200 ${
        isScrolled
          ? 'bg-white/95 dark:bg-[#0D1017]/95 backdrop-blur-md border-b border-[#E9EBF0] dark:border-[#222632] shadow-xs'
          : 'bg-white dark:bg-[#0D1017] border-b border-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
        {/* ======================================================== */}
        {/* LEFT: GYANVATSALA LOGO & DESCRIPTOR                      */}
        {/* ======================================================== */}
        <Link
          href="/"
          className="flex items-center gap-3 shrink-0 group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#536BCE] rounded-lg"
          aria-label="Gyanvatsala Home"
        >
          <GyanvatsalaLogo size={32} showWordmark={true} descriptor="Your Digital Document Workspace" />
        </Link>

        {/* ======================================================== */}
        {/* CENTER: PRIMARY CLEAN NAVIGATION                         */}
        {/* ======================================================== */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-2">
          {/* Products Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setProductsOpen((prev) => !prev)}
              aria-expanded={productsOpen}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                productsOpen
                  ? 'text-[#536BCE] bg-[#EDF0FF] dark:bg-[#536BCE]/15'
                  : 'text-[#20232B] dark:text-[#F8FAFC] hover:text-[#536BCE] dark:hover:text-[#93A5F5] hover:bg-[#F7F8FA] dark:hover:bg-[#1A2030]'
              }`}
            >
              <span>Products</span>
              <ChevronDown
                className={`w-4 h-4 transition-transform duration-200 ${
                  productsOpen ? 'rotate-180 text-[#536BCE]' : 'text-[#727783]'
                }`}
              />
            </button>

            {/* Dropdown Panel */}
            {productsOpen && (
              <div className="absolute top-full left-0 mt-2 w-80 rounded-2xl bg-white dark:bg-[#151926] border border-[#E9EBF0] dark:border-[#28314A] shadow-xl p-2.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="flex flex-col gap-1">
                  {productItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.title}
                        href={item.href}
                        onClick={() => setProductsOpen(false)}
                        className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-[#F7F8FA] dark:hover:bg-[#1D2335] transition group text-left"
                      >
                        <div
                          className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${item.accent}`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-[#20232B] dark:text-[#F8FAFC] group-hover:text-[#536BCE] transition">
                            {item.title}
                          </span>
                          <span className="text-xs text-[#727783] dark:text-[#9DA3AE] line-clamp-1 mt-0.5">
                            {item.description}
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>

                <div className="mt-2 pt-2 border-t border-[#E9EBF0] dark:border-[#28314A] px-2 py-1 flex items-center justify-between text-xs text-[#727783]">
                  <span>All tools run locally</span>
                  <Link
                    href="/workspace"
                    onClick={() => setProductsOpen(false)}
                    className="font-semibold text-[#536BCE] hover:underline"
                  >
                    Open Workspace →
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Explore Tools */}
          <Link
            href="/pdf"
            className="px-3 py-2 rounded-lg text-sm font-medium text-[#20232B] dark:text-[#F8FAFC] hover:text-[#536BCE] dark:hover:text-[#93A5F5] hover:bg-[#F7F8FA] dark:hover:bg-[#1A2030] transition-colors"
          >
            Explore Tools
          </Link>

          {/* How It Works */}
          <Link
            href="/#how-it-works"
            className="px-3 py-2 rounded-lg text-sm font-medium text-[#20232B] dark:text-[#F8FAFC] hover:text-[#536BCE] dark:hover:text-[#93A5F5] hover:bg-[#F7F8FA] dark:hover:bg-[#1A2030] transition-colors"
          >
            How It Works
          </Link>

          {/* Pricing */}
          <Link
            href="/pricing"
            className="px-3 py-2 rounded-lg text-sm font-medium text-[#20232B] dark:text-[#F8FAFC] hover:text-[#536BCE] dark:hover:text-[#93A5F5] hover:bg-[#F7F8FA] dark:hover:bg-[#1A2030] transition-colors"
          >
            Pricing
          </Link>

          {/* Admin Console Link for Sole Administrator */}
          {user?.role === 'admin' && (
            <Link
              href="/admin"
              className="px-3 py-2 rounded-lg text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors flex items-center gap-1.5"
            >
              <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Admin Console</span>
            </Link>
          )}
        </nav>

        {/* ======================================================== */}
        {/* RIGHT: THEME TOGGLE, SIGN IN & GET STARTED               */}
        {/* ======================================================== */}
        <div className="hidden sm:flex items-center gap-3">
          <ThemeToggle />

          {isAuthenticated ? (
            <UserMenu />
          ) : (
            <button
              type="button"
              onClick={() => openAuthModal()}
              className="text-sm font-medium text-[#20232B] dark:text-[#F8FAFC] hover:text-[#536BCE] dark:hover:text-[#93A5F5] px-3 py-2 rounded-lg hover:bg-[#F7F8FA] dark:hover:bg-[#1A2030] transition cursor-pointer"
            >
              Sign In
            </button>
          )}

          <Link
            href="/workspace"
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[#20232B] dark:bg-[#536BCE] hover:bg-[#343A46] dark:hover:bg-[#4157B5] text-white text-sm font-medium transition shadow-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-[#536BCE]"
          >
            <span>Get Started</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Mobile menu trigger */}
        <div className="flex sm:hidden items-center gap-2">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="p-2 rounded-lg text-[#20232B] dark:text-[#F8FAFC] hover:bg-[#F7F8FA] dark:hover:bg-[#1A2030]"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* RESPONSIVE MOBILE MENU DRAWER                            */}
      {/* ======================================================== */}
      {mobileMenuOpen && (
        <div className="sm:hidden border-t border-[#E9EBF0] dark:border-[#222632] bg-white dark:bg-[#0D1017] px-4 pt-3 pb-6 flex flex-col gap-4 shadow-lg animate-in slide-in-from-top-2 duration-150">
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-semibold text-[#727783] uppercase tracking-wider px-2 pt-2">
              Products
            </span>
            {productItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.title}
                  href={item.href}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#F7F8FA] dark:hover:bg-[#1A2030] text-sm font-medium text-[#20232B] dark:text-[#F8FAFC]"
                >
                  <Icon className="w-4 h-4 text-[#536BCE]" />
                  <span>{item.title}</span>
                </Link>
              );
            })}
          </div>

          <div className="border-t border-[#E9EBF0] dark:border-[#222632] pt-2 flex flex-col gap-1">
            <Link
              href="/pdf"
              className="p-2 rounded-lg text-sm font-medium text-[#20232B] dark:text-[#F8FAFC] hover:bg-[#F7F8FA] dark:hover:bg-[#1A2030]"
            >
              Explore Tools
            </Link>
            <Link
              href="/#how-it-works"
              className="p-2 rounded-lg text-sm font-medium text-[#20232B] dark:text-[#F8FAFC] hover:bg-[#F7F8FA] dark:hover:bg-[#1A2030]"
            >
              How It Works
            </Link>
            <Link
              href="/pricing"
              className="p-2 rounded-lg text-sm font-medium text-[#20232B] dark:text-[#F8FAFC] hover:bg-[#F7F8FA] dark:hover:bg-[#1A2030]"
            >
              Pricing
            </Link>
            {user?.role === 'admin' && (
              <Link
                href="/admin"
                className="p-2 rounded-lg text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 flex items-center gap-2"
              >
                <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Admin Console</span>
              </Link>
            )}
          </div>

          <div className="border-t border-[#E9EBF0] dark:border-[#222632] pt-3 flex flex-col gap-2">
            {!isAuthenticated && (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  openAuthModal();
                }}
                className="w-full text-center py-2.5 rounded-xl border border-[#E9EBF0] dark:border-[#28314A] text-sm font-medium text-[#20232B] dark:text-[#F8FAFC]"
              >
                Sign In
              </button>
            )}
            <Link
              href="/workspace"
              className="w-full text-center py-2.5 rounded-xl bg-[#536BCE] text-white text-sm font-medium shadow-xs"
            >
              Enter Workspace
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

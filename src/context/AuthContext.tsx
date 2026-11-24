'use client';

import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { authClient } from '@/lib/auth-client';
import { fileManagerService, CloudFile } from '@/lib/fileManagerService';

export type ProcessingMode = 'local' | 'cloud' | 'auto';
export type PlanTier = 'Free' | 'Prime' | 'PrimePlus' | 'PrimeUltra' | 'Pro' | 'Business';

export interface StorageQuota {
  usedBytes: number;
  limitBytes: number;
  remainingBytes: number;
  percentageUsed: number;
  isWarningThreshold: boolean;
  fileCount: number;
  plan: PlanTier;
  retentionDays: number;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  plan: PlanTier;
  role?: 'admin' | 'support' | 'user';
}

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  processingMode: ProcessingMode;
  storageUsage: StorageQuota;
  isAuthModalOpen: boolean;
  authModalInitialEmail?: string;
  setProcessingMode: (mode: ProcessingMode) => void;
  openAuthModal: (email?: string) => void;
  closeAuthModal: () => void;
  signInWithGoogle: (callbackURL?: string) => Promise<void>;
  signInWithPassword: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  sendEmailOtp: (email: string) => Promise<{ success: boolean; message?: string; retryAfter?: number }>;
  verifyEmailOtp: (email: string, otp: string) => Promise<{ success: boolean; message?: string }>;
  signOut: () => Promise<void>;
  refreshStorageUsage: () => Promise<void>;
  updateUserPlan: (newPlan: PlanTier) => void;
}

// Default Free Tier for new accounts (0 bytes used)
const defaultStorageUsage: StorageQuota = {
  usedBytes: 0,
  limitBytes: 15728640, // 15 MB
  remainingBytes: 15728640,
  percentageUsed: 0,
  isWarningThreshold: false,
  fileCount: 0,
  plan: 'Free',
  retentionDays: 7,
};

const defaultContext: AuthContextType = {
  user: null,
  isLoading: true,
  isAuthenticated: false,
  processingMode: 'auto',
  storageUsage: defaultStorageUsage,
  isAuthModalOpen: false,
  setProcessingMode: () => {},
  openAuthModal: () => {},
  closeAuthModal: () => {},
  signInWithGoogle: async (callbackURL?: string) => {},
  signInWithPassword: async () => ({ success: false }),
  sendEmailOtp: async () => ({ success: false }),
  verifyEmailOtp: async () => ({ success: false }),
  signOut: async () => {},
  refreshStorageUsage: async () => {},
  updateUserPlan: () => {},
};

const AuthContext = createContext<AuthContextType>(defaultContext);

const LOCAL_STORAGE_USER_KEY = 'gyanvatsala_saas_user';
const LEGACY_STORAGE_USER_KEY = 'pixelkit_saas_user';
const LOCAL_STORAGE_MODE_KEY = 'gyanvatsala_saas_mode';
const LEGACY_STORAGE_MODE_KEY = 'pixelkit_saas_mode';
const LOCAL_STORAGE_STORAGE_KEY = 'gyanvatsala_saas_storage';
const LEGACY_STORAGE_STORAGE_KEY = 'pixelkit_saas_storage';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [processingMode, setProcessingModeState] = useState<ProcessingMode>('auto');
  const [storageUsage, setStorageUsage] = useState<StorageQuota>(defaultStorageUsage);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalInitialEmail, setAuthModalInitialEmail] = useState<string | undefined>(undefined);
  const hasInitializedRef = useRef(false);

  // Restore stored session and mode on mount
  useEffect(() => {
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;

    const initAuth = async () => {
      try {
        const savedMode = (localStorage.getItem(LOCAL_STORAGE_MODE_KEY) || localStorage.getItem(LEGACY_STORAGE_MODE_KEY)) as ProcessingMode | null;
        if (savedMode && ['local', 'cloud', 'auto'].includes(savedMode)) {
          setProcessingModeState(savedMode);
        }

        // Purge any legacy dummy user accounts
        const savedUser = localStorage.getItem(LOCAL_STORAGE_USER_KEY) || localStorage.getItem(LEGACY_STORAGE_USER_KEY);
        if (savedUser) {
          try {
            const parsed = JSON.parse(savedUser);
            if (parsed?.email?.includes('pixelkit.io') || parsed?.name === 'Alex Developer') {
              localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
              localStorage.removeItem(LEGACY_STORAGE_USER_KEY);
              localStorage.removeItem(LOCAL_STORAGE_STORAGE_KEY);
              localStorage.removeItem(LEGACY_STORAGE_STORAGE_KEY);
              setUser(null);
            } else {
              // Non-admin default until authoritative server verification completes
              setUser({ ...parsed, role: parsed.role === 'admin' ? 'user' : (parsed.role || 'user') });
            }
          } catch (parseErr) {
            console.debug('Error parsing saved user from localStorage', parseErr);
          }
        }

        // 1. Authoritative server-verified session sync via /api/auth/me
        try {
          const meRes = await fetch('/api/auth/me');
          if (meRes.ok) {
            const meData = await meRes.json();
            if (meData?.authenticated && meData?.user) {
              const u = meData.user;
              const verifiedUser: UserProfile = {
                id: u.id,
                name: u.name || u.email?.split('@')[0] || 'User',
                email: u.email,
                avatarUrl: u.avatarUrl || undefined,
                plan: u.plan || 'Free',
                role: u.role || 'user',
              };
              setUser(verifiedUser);
              localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(verifiedUser));
            }
          }
        } catch (meErr) {
          console.debug('Failed to fetch /api/auth/me', meErr);
        }

        // 2. Also sync with Better Auth client session
        try {
          const sessionRes = await authClient.getSession();
          if (sessionRes?.data?.user) {
            const u = sessionRes.data.user;
            const serverRole = (u as any).role || 'user';
            const realUser: UserProfile = {
              id: u.id,
              name: u.name || u.email?.split('@')[0] || 'User',
              email: u.email,
              avatarUrl: u.image || undefined,
              plan: (u as any).plan || 'Free',
              role: serverRole,
            };
            setUser(realUser);
            localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(realUser));
          }
        } catch (sessErr) {
          console.debug('No active Better Auth session', sessErr);
        }

        const savedStorage = localStorage.getItem(LOCAL_STORAGE_STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_STORAGE_KEY);
        if (savedStorage) {
          setStorageUsage(JSON.parse(savedStorage));
        }
      } catch (e) {
        console.warn('Failed to parse local auth state', e);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const setProcessingMode = useCallback((mode: ProcessingMode) => {
    setProcessingModeState(mode);
    try {
      localStorage.setItem(LOCAL_STORAGE_MODE_KEY, mode);
    } catch {}
  }, []);

  const openAuthModal = useCallback((email?: string) => {
    setAuthModalInitialEmail(email);
    setIsAuthModalOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setIsAuthModalOpen(false);
    setAuthModalInitialEmail(undefined);
  }, []);

  const signInWithGoogle = useCallback(async (callbackURL: string = '/workspace') => {
    setIsLoading(true);
    try {
      // Official Better Auth social login with Google OAuth
      const res = await authClient.signIn.social({
        provider: 'google',
        callbackURL,
      });
      if (res?.data?.url) {
        window.location.href = res.data.url;
        return;
      }
    } catch (e) {
      console.error('Better Auth Google Sign In error:', e);
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const sendEmailOtp = useCallback(async (email: string) => {
    try {
      const response = await fetch('/api/auth/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.toLowerCase().trim(),
          type: 'sign-in',
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data?.success) {
        return {
          success: false,
          message: data?.message || 'Failed to dispatch verification code. Please check your email.',
          retryAfter: data?.retryAfter,
        };
      }

      return {
        success: true,
        message: data?.message || 'Verification code sent to your email.',
      };
    } catch (err: any) {
      return {
        success: false,
        message: err?.message || 'Authentication service error. Try again shortly.',
      };
    }
  }, []);

  const signInWithPassword = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    const uEmail = email.toLowerCase().trim();

    try {
      const res = await fetch('/api/auth/sign-in-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: uEmail, password }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setIsLoading(false);
        return { success: false, message: data.error || 'Invalid email or password.' };
      }

      if (data.user) {
        const profile: UserProfile = {
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          avatarUrl: data.user.avatarUrl,
          plan: (data.user.plan as PlanTier) || 'Free',
          role: data.user.role || 'user',
        };
        setUser(profile);
        localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(profile));
        setIsLoading(false);
        closeAuthModal();
        return { success: true };
      }
    } catch (err: any) {
      setIsLoading(false);
      return { success: false, message: err?.message || 'Sign in failed. Please try again.' };
    }

    setIsLoading(false);
    return { success: false, message: 'Sign in failed.' };
  }, [closeAuthModal]);

  const verifyEmailOtp = useCallback(async (email: string, otp: string) => {
    setIsLoading(true);
    const uEmail = email.toLowerCase().trim();

    // Support test account via OTP bypass
    if (uEmail === 'test@gyanvatsala.in') {
      const pwRes = await signInWithPassword('test@gyanvatsala.in', 'TestAccount@2026');
      setIsLoading(false);
      return pwRes;
    }

    try {
      // Official Better Auth sign-in with email OTP
      let res: any = null;
      if (typeof (authClient.signIn as any).emailOtp === 'function') {
        res = await (authClient.signIn as any).emailOtp({
          email: uEmail,
          otp: otp.trim(),
        });
      } else if (typeof (authClient.signIn as any).emailOTP === 'function') {
        res = await (authClient.signIn as any).emailOTP({
          email: uEmail,
          otp: otp.trim(),
        });
      } else {
        res = await (authClient as any).emailOTP?.verifyEmail({
          email: uEmail,
          otp: otp.trim(),
        });
      }

      if (res?.error) {
        setIsLoading(false);
        return {
          success: false,
          message: res.error.message || 'Invalid or expired verification code.',
        };
      }

      if (res?.data?.user) {
        const u = res.data.user;
        const resEmail = (u.email || uEmail).toLowerCase().trim();
        const role = ((u as any).role || 'user');
        const profile: UserProfile = {
          id: u.id,
          name: u.name || email.split('@')[0],
          email: u.email || email,
          avatarUrl: u.image,
          plan: 'Free',
          role,
        };
        setUser(profile);
        localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(profile));
        setIsLoading(false);
        closeAuthModal();
        return { success: true };
      }
    } catch (e: any) {
      setIsLoading(false);
      return {
        success: false,
        message: e?.message || 'Verification failed. Please check the code and try again.',
      };
    }

    setIsLoading(false);
    return {
      success: false,
      message: 'Invalid or expired verification code.',
    };
  }, [closeAuthModal]);

  const signOut = useCallback(async () => {
    try {
      await authClient.signOut();
    } catch {}
    setUser(null);
    setStorageUsage(defaultStorageUsage);
    try {
      localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
      localStorage.removeItem(LEGACY_STORAGE_USER_KEY);
      localStorage.removeItem(LOCAL_STORAGE_STORAGE_KEY);
      localStorage.removeItem(LEGACY_STORAGE_STORAGE_KEY);
      localStorage.removeItem('gyanvatsala_saas_cloud_files');
      localStorage.removeItem('gyanvatsala_saas_cloud_jobs');
      localStorage.removeItem('gyanvatsala_saas_cloud_folders');
      localStorage.removeItem('pixelkit_saas_cloud_files');
      localStorage.removeItem('pixelkit_saas_cloud_jobs');
      localStorage.removeItem('pixelkit_saas_cloud_folders');
    } catch {}
  }, []);

  const updateUserPlan = useCallback((newPlan: PlanTier) => {
    setUser((currentUser) => {
      if (!currentUser) return null;
      const updated = { ...currentUser, plan: newPlan };
      try {
        localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });

    // Update storage limits
    setStorageUsage((currentUsage) => {
      let limit = 15728640;
      let retention = 7;
      if (newPlan === 'Prime') {
        limit = 52428800; // 50 MB
        retention = 14;
      } else if (newPlan === 'PrimePlus') {
        limit = 104857600; // 100 MB
        retention = 30;
      } else if (newPlan === 'PrimeUltra') {
        limit = 524288000; // 500 MB
        retention = 365;
      }

      const remaining = Math.max(0, limit - currentUsage.usedBytes);
      const pct = Math.round((currentUsage.usedBytes / limit) * 100);
      const updatedQuota: StorageQuota = {
        ...currentUsage,
        limitBytes: limit,
        remainingBytes: remaining,
        percentageUsed: pct,
        isWarningThreshold: pct >= 80,
        plan: newPlan,
        retentionDays: retention,
      };
      try {
        localStorage.setItem(LOCAL_STORAGE_STORAGE_KEY, JSON.stringify(updatedQuota));
      } catch {}
      return updatedQuota;
    });
  }, []);

  const refreshStorageUsage = useCallback(async () => {
    try {
      const files = fileManagerService.getFiles();
      const totalBytes = files.reduce((acc: number, f: CloudFile) => acc + (f.fileSize || 0), 0);
      setStorageUsage((currentUsage) => {
        const limit = currentUsage.limitBytes || 15728640;
        const remaining = Math.max(0, limit - totalBytes);
        const pct = Math.min(100, Math.round((totalBytes / limit) * 100));
        const quota: StorageQuota = {
          usedBytes: totalBytes,
          limitBytes: limit,
          remainingBytes: remaining,
          percentageUsed: pct,
          isWarningThreshold: pct >= 80,
          fileCount: files.length,
          plan: currentUsage.plan || 'Free',
          retentionDays: currentUsage.retentionDays || 7,
        };
        try {
          localStorage.setItem(LOCAL_STORAGE_STORAGE_KEY, JSON.stringify(quota));
        } catch {}
        return quota;
      });
    } catch (e) {
      console.warn('Storage refresh error:', e);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        processingMode,
        storageUsage,
        isAuthModalOpen,
        authModalInitialEmail,
        setProcessingMode,
        openAuthModal,
        closeAuthModal,
        signInWithGoogle,
        signInWithPassword,
        sendEmailOtp,
        verifyEmailOtp,
        signOut,
        refreshStorageUsage,
        updateUserPlan,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

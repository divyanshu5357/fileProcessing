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
const SESSION_MAX_AGE_MS = 2 * 60 * 60 * 1000; // 2 hours strict session limit
const SESSION_IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes inactivity limit
const SESSION_START_KEY = 'gyanvatsala_session_start';
const LAST_ACTIVE_KEY = 'gyanvatsala_last_active';

const purgeLocalStorage = () => {
  try {
    localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
    localStorage.removeItem(LEGACY_STORAGE_USER_KEY);
    localStorage.removeItem(LOCAL_STORAGE_STORAGE_KEY);
    localStorage.removeItem(LEGACY_STORAGE_STORAGE_KEY);
    localStorage.removeItem(SESSION_START_KEY);
    localStorage.removeItem(LAST_ACTIVE_KEY);
    localStorage.removeItem('gyanvatsala_saas_cloud_files');
    localStorage.removeItem('gyanvatsala_saas_cloud_jobs');
    localStorage.removeItem('gyanvatsala_saas_cloud_folders');
    localStorage.removeItem('pixelkit_saas_cloud_files');
    localStorage.removeItem('pixelkit_saas_cloud_jobs');
    localStorage.removeItem('pixelkit_saas_cloud_folders');
  } catch {}
};

const isStaleOrTestAccount = (u: any): boolean => {
  if (!u) return true;
  const email = (u.email || '').toLowerCase().trim();
  const name = (u.name || '').toLowerCase().trim();
  return (
    email.includes('pixelkit.io') ||
    email.includes('test@gyanvatsala.in') ||
    name.includes('alex developer') ||
    name.includes('razorpay reviewer') ||
    name.includes('reviewer')
  );
};

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

        // Check if session has expired (2-hr max lifespan or 30-min idle)
        const sessionStart = parseInt(localStorage.getItem(SESSION_START_KEY) || '0', 10);
        const lastActive = parseInt(localStorage.getItem(LAST_ACTIVE_KEY) || '0', 10);
        const now = Date.now();
        const isExpired =
          (sessionStart > 0 && now - sessionStart > SESSION_MAX_AGE_MS) ||
          (lastActive > 0 && now - lastActive > SESSION_IDLE_TIMEOUT_MS);

        // Purge any legacy dummy / test accounts or expired sessions
        const savedUser = localStorage.getItem(LOCAL_STORAGE_USER_KEY) || localStorage.getItem(LEGACY_STORAGE_USER_KEY);
        if (savedUser) {
          try {
            const parsed = JSON.parse(savedUser);
            if (isStaleOrTestAccount(parsed) || isExpired) {
              purgeLocalStorage();
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
            if (meData?.authenticated && meData?.user && !isStaleOrTestAccount(meData.user) && !isExpired) {
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
              if (!localStorage.getItem(SESSION_START_KEY)) {
                localStorage.setItem(SESSION_START_KEY, Date.now().toString());
              }
              localStorage.setItem(LAST_ACTIVE_KEY, Date.now().toString());
            } else {
              // Server says unauthenticated or account is stale/expired -> wipe state
              setUser(null);
              purgeLocalStorage();
            }
          } else {
            setUser((prev) => {
              if (isStaleOrTestAccount(prev)) {
                purgeLocalStorage();
                return null;
              }
              return prev;
            });
          }
        } catch (meErr) {
          console.debug('Failed to fetch /api/auth/me', meErr);
        }

        // 2. Also sync with Better Auth client session
        try {
          const sessionRes = await authClient.getSession();
          if (sessionRes?.data?.user) {
            if (isStaleOrTestAccount(sessionRes.data.user) || isExpired) {
              await authClient.signOut().catch(() => {});
              setUser(null);
              purgeLocalStorage();
            } else {
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

  const verifyEmailOtp = useCallback(async (email: string, otp: string) => {
    setIsLoading(true);
    const uEmail = email.toLowerCase().trim();

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
        localStorage.setItem(SESSION_START_KEY, Date.now().toString());
        localStorage.setItem(LAST_ACTIVE_KEY, Date.now().toString());
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
    purgeLocalStorage();
  }, []);

  // Inactivity (30 min) & Session Lifespan (2 hr) Auto Logout Monitor
  useEffect(() => {
    if (!user) return;

    if (!localStorage.getItem(SESSION_START_KEY)) {
      localStorage.setItem(SESSION_START_KEY, Date.now().toString());
    }
    localStorage.setItem(LAST_ACTIVE_KEY, Date.now().toString());

    let lastThrottle = Date.now();
    const recordActivity = () => {
      const now = Date.now();
      if (now - lastThrottle > 10000) {
        lastThrottle = now;
        try {
          localStorage.setItem(LAST_ACTIVE_KEY, now.toString());
        } catch {}
      }
    };

    const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart', 'mousemove'];
    activityEvents.forEach((evt) => {
      window.addEventListener(evt, recordActivity, { passive: true });
    });

    const intervalId = setInterval(() => {
      const now = Date.now();
      const start = parseInt(localStorage.getItem(SESSION_START_KEY) || '0', 10);
      const last = parseInt(localStorage.getItem(LAST_ACTIVE_KEY) || '0', 10);

      // Check 2-hour absolute session duration limit
      if (start && now - start >= SESSION_MAX_AGE_MS) {
        console.warn('[Auth] Session reached 2-hour maximum lifespan. Automatically logging out.');
        signOut();
        return;
      }

      // Check 30-minute idle inactivity timeout
      if (last && now - last >= SESSION_IDLE_TIMEOUT_MS) {
        console.warn('[Auth] Session inactive for >30 minutes. Automatically logging out.');
        signOut();
        return;
      }
    }, 15000);

    return () => {
      activityEvents.forEach((evt) => {
        window.removeEventListener(evt, recordActivity);
      });
      clearInterval(intervalId);
    };
  }, [user, signOut]);

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

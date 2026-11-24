'use client';

import { useState, useCallback, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getMemoryProfile, MemoryProfile } from '@/lib/memoryProfile';
import { GUEST_LIMIT_6_HOURS, isUnlimitedSimpleProduct } from '@/lib/guestQuota';
import { requestDownloadAllowance, DownloadAllowanceResult } from '@/lib/downloadQuotaClient';

export interface GuestQuotaState {
  isGuest: boolean;
  unlimited: boolean;
  limit: number;
  allowed: boolean;
  memoryProfile: MemoryProfile;
  loading: boolean;
  consumeDownloadQuota: (fileSizeBytes?: number) => Promise<DownloadAllowanceResult>;
  consumeUse: () => Promise<boolean>;
  refreshQuota: () => Promise<void>;
}

const PAID_TIERS = new Set(['prime', 'primeplus', 'prime_plus', 'primeultra', 'prime_ultra']);

/**
 * Provides tiered file-size/RAM defaults without rendering any limit or IP details in the UI.
 * Backend enforces 4 downloads per 6 hours (files under 15 MB) and 9 downloads per day silently.
 */
export function useGuestProductQuota(productId: string): GuestQuotaState {
  const { user, isAuthenticated } = useAuth();
  const isSimpleTool = isUnlimitedSimpleProduct(productId);
  const isPaidOrAdmin =
    isSimpleTool ||
    (Boolean(isAuthenticated) &&
      (user?.role === 'admin' ||
        PAID_TIERS.has((user?.plan || '').toLowerCase().replace(/\s+/g, ''))));

  const isGuest = !isPaidOrAdmin;
  const fallbackMemory = useMemo(
    () =>
      isSimpleTool
        ? getMemoryProfile('PrimePlus', true)
        : getMemoryProfile(user?.plan, isAuthenticated),
    [isSimpleTool, user?.plan, isAuthenticated]
  );

  const [allowed, setAllowed] = useState(true);
  const [serverProfile, setServerProfile] = useState<MemoryProfile | null>(null);
  const [loading, setLoading] = useState(false);

  const refreshQuota = useCallback(async () => {
    if (isPaidOrAdmin) {
      setAllowed(true);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`/api/usage/guest?productId=${encodeURIComponent(productId)}`, {
        cache: 'no-store',
      });
      if (res.ok) {
        const data = await res.json();
        setAllowed(Boolean(data.allowed));
        if (data.memoryProfile) setServerProfile(data.memoryProfile);
      }
    } catch {
      // keep silent defaults
    } finally {
      setLoading(false);
    }
  }, [productId, isPaidOrAdmin]);

  const consumeDownloadQuota = useCallback(
    async (fileSizeBytes: number = 0): Promise<DownloadAllowanceResult> => {
      if (isPaidOrAdmin) {
        return { allowed: true, unlimited: true };
      }
      const res = await requestDownloadAllowance(productId, fileSizeBytes);
      setAllowed(res.allowed);
      return res;
    },
    [isPaidOrAdmin, productId]
  );

  const consumeUse = useCallback(async (): Promise<boolean> => {
    const res = await consumeDownloadQuota(0);
    return res.allowed;
  }, [consumeDownloadQuota]);

  return {
    isGuest,
    unlimited: isPaidOrAdmin,
    limit: GUEST_LIMIT_6_HOURS,
    allowed: isPaidOrAdmin ? true : allowed,
    memoryProfile: isPaidOrAdmin ? fallbackMemory : serverProfile || fallbackMemory,
    loading,
    consumeDownloadQuota,
    consumeUse,
    refreshQuota,
  };
}

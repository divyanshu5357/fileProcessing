'use client';

import { useState, useCallback, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getMemoryProfile, MemoryProfile } from '@/lib/memoryProfile';
import { requestDownloadAllowance, DownloadAllowanceResult } from '@/lib/downloadQuotaClient';

export interface GuestQuotaState {
  isGuest: boolean;
  unlimited: boolean;
  allowed: boolean;
  memoryProfile: MemoryProfile;
  loading: boolean;
  consumeDownloadQuota: (fileSizeBytes?: number) => Promise<DownloadAllowanceResult>;
  consumeUse: () => Promise<boolean>;
  refreshQuota: () => Promise<void>;
}

const PAID_TIERS = new Set(['prime', 'primeplus', 'prime_plus', 'primeultra', 'prime_ultra']);

/**
 * Queries server-enforced allowance without bundling hardcoded quota limits into client JS.
 */
export function useGuestProductQuota(productId: string): GuestQuotaState {
  const { user, isAuthenticated } = useAuth();
  const isPaidOrAdmin =
    Boolean(isAuthenticated) &&
    (user?.role === 'admin' ||
      PAID_TIERS.has((user?.plan || '').toLowerCase().replace(/\s+/g, '')));

  const isGuest = !isPaidOrAdmin;
  const fallbackMemory = useMemo(
    () => getMemoryProfile(user?.plan, isAuthenticated),
    [user?.plan, isAuthenticated]
  );

  const [allowed, setAllowed] = useState(true);
  const [serverUnlimited, setServerUnlimited] = useState(false);
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
        credentials: 'same-origin',
      });
      if (res.ok) {
        const data = await res.json();
        setAllowed(Boolean(data.allowed));
        if (typeof data.unlimited === 'boolean') setServerUnlimited(data.unlimited);
        if (data.memoryProfile) setServerProfile(data.memoryProfile);
      }
    } catch {
      // keep clean defaults
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
      if (typeof res.unlimited === 'boolean') setServerUnlimited(res.unlimited);
      return res;
    },
    [isPaidOrAdmin, productId]
  );

  const consumeUse = useCallback(async (): Promise<boolean> => {
    const res = await consumeDownloadQuota(0);
    return res.allowed;
  }, [consumeDownloadQuota]);

  return {
    isGuest: isGuest && !serverUnlimited,
    unlimited: isPaidOrAdmin || serverUnlimited,
    allowed: isPaidOrAdmin || serverUnlimited ? true : allowed,
    memoryProfile: isPaidOrAdmin ? fallbackMemory : serverProfile || fallbackMemory,
    loading,
    consumeDownloadQuota,
    consumeUse,
    refreshQuota,
  };
}

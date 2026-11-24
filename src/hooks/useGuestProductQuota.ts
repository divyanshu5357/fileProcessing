'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getMemoryProfile, MemoryProfile } from '@/lib/memoryProfile';
import { GUEST_MAX_USES_PER_PRODUCT } from '@/lib/guestQuota';

export interface GuestQuotaState {
  isGuest: boolean;
  unlimited: boolean;
  used: number;
  limit: number;
  remaining: number;
  allowed: boolean;
  ipMasked: string | null;
  memoryProfile: MemoryProfile;
  loading: boolean;
  consumeUse: () => Promise<boolean>;
  refreshQuota: () => Promise<void>;
}

/**
 * Tracks per-product IP usage when user is not signed in (max 4 edits/uses),
 * and exposes tiered browser memory budgets for Guest and Free users.
 */
export function useGuestProductQuota(productId: string): GuestQuotaState {
  const { user, isAuthenticated, openAuthModal } = useAuth();
  const isGuest = !isAuthenticated;
  const fallbackMemory = getMemoryProfile(user?.plan, isAuthenticated);

  const [used, setUsed] = useState(0);
  const [limit, setLimit] = useState(GUEST_MAX_USES_PER_PRODUCT);
  const [remaining, setRemaining] = useState(GUEST_MAX_USES_PER_PRODUCT);
  const [allowed, setAllowed] = useState(true);
  const [ipMasked, setIpMasked] = useState<string | null>(null);
  const [memoryProfile, setMemoryProfile] = useState<MemoryProfile>(fallbackMemory);
  const [loading, setLoading] = useState(true);

  const refreshQuota = useCallback(async () => {
    setMemoryProfile(getMemoryProfile(user?.plan, isAuthenticated));
    if (isAuthenticated) {
      setUsed(0);
      setRemaining(GUEST_MAX_USES_PER_PRODUCT);
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
        setUsed(data.used ?? 0);
        setLimit(data.limit ?? GUEST_MAX_USES_PER_PRODUCT);
        setRemaining(data.remaining ?? GUEST_MAX_USES_PER_PRODUCT);
        setAllowed(Boolean(data.allowed));
        setIpMasked(data.ipMasked || null);
        if (data.memoryProfile) setMemoryProfile(data.memoryProfile);
      }
    } catch {
      // keep safe defaults
    } finally {
      setLoading(false);
    }
  }, [productId, isAuthenticated, user?.plan]);

  useEffect(() => {
    if (isAuthenticated) return;
    let cancelled = false;

    fetch(`/api/usage/guest?productId=${encodeURIComponent(productId)}`, {
      cache: 'no-store',
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data) return;
        setUsed(data.used ?? 0);
        setLimit(data.limit ?? GUEST_MAX_USES_PER_PRODUCT);
        setRemaining(data.remaining ?? GUEST_MAX_USES_PER_PRODUCT);
        setAllowed(Boolean(data.allowed));
        setIpMasked(data.ipMasked || null);
        if (data.memoryProfile) setMemoryProfile(data.memoryProfile);
      })
      .catch(() => {
        // keep safe defaults
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [productId, isAuthenticated]);

  const consumeUse = useCallback(async (): Promise<boolean> => {
    if (isAuthenticated) return true;

    try {
      const res = await fetch('/api/usage/guest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId }),
      });
      const data = await res.json().catch(() => ({}));

      if (typeof data.used === 'number') setUsed(data.used);
      if (typeof data.limit === 'number') setLimit(data.limit);
      if (typeof data.remaining === 'number') setRemaining(data.remaining);
      if (data.ipMasked) setIpMasked(data.ipMasked);

      if (!res.ok || data.allowed === false) {
        setAllowed(false);
        setRemaining(0);
        openAuthModal(
          undefined,
          data.message ||
            `Guest IP trial limit reached (${limit}/${limit} edits). Sign in free for unlimited access.`
        );
        return false;
      }

      setAllowed(data.remaining > 0 || Boolean(data.unlimited));
      return true;
    } catch {
      return true;
    }
  }, [isAuthenticated, productId, limit, openAuthModal]);

  return {
    isGuest,
    unlimited: isAuthenticated,
    used: isAuthenticated ? 0 : used,
    limit,
    remaining: isAuthenticated ? limit : remaining,
    allowed: isAuthenticated ? true : allowed,
    ipMasked,
    memoryProfile: isAuthenticated ? fallbackMemory : memoryProfile,
    loading: isAuthenticated ? false : loading,
    consumeUse,
    refreshQuota,
  };
}

'use client';

import { GuestQuotaState } from '@/hooks/useGuestProductQuota';

interface GuestQuotaBannerProps {
  quota: GuestQuotaState;
  productName: string;
}

/**
 * Limits and backend IP accounting stay invisible on the UI.
 * Only features are shown until a user exceeds allowance on download.
 */
export function GuestQuotaBanner(props: GuestQuotaBannerProps) {
  void props;
  return null;
}

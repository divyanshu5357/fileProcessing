export interface DownloadAllowanceResult {
  allowed: boolean;
  unlimited?: boolean;
  exportTicket?: string;
  reason?: 'window_6h' | 'daily_limit' | 'space_6h' | 'file_size' | 'verification_failed';
  retryAfterSeconds?: number;
  waitLabel?: string;
  message?: string;
}

/**
 * Checks and records a download action via the signed server endpoint.
 * Fails closed on tampered/blocked network responses so blocking API calls cannot bypass limits.
 */
export async function requestDownloadAllowance(
  productId: string,
  fileSizeBytes: number = 0
): Promise<DownloadAllowanceResult> {
  try {
    const res = await fetch('/api/usage/guest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({
        productId,
        fileSizeBytes: Math.max(0, Math.round(fileSizeBytes)),
      }),
    });

    const data = await res.json().catch(() => null);
    if (!res.ok || !data || data.allowed !== true || typeof data.exportTicket !== 'string') {
      return {
        allowed: false,
        reason: data?.reason || (res.ok ? 'verification_failed' : 'window_6h'),
        retryAfterSeconds: Number(data?.retryAfterSeconds || 21600),
        waitLabel: data?.waitLabel || '6h',
        message:
          data?.message ||
          'Download limit exceeded. Please wait for the 6-hour refresh or upgrade to Premium to download this file now.',
      };
    }

    return {
      allowed: true,
      unlimited: Boolean(data.unlimited),
      exportTicket: data.exportTicket,
    };
  } catch {
    // Fail closed if request is blocked in DevTools / network filter
    return {
      allowed: false,
      reason: 'verification_failed',
      retryAfterSeconds: 21600,
      waitLabel: '6h',
      message:
        'Could not verify download allowance. Please allow site requests or upgrade to Premium to download.',
    };
  }
}

export interface DownloadAllowanceResult {
  allowed: boolean;
  unlimited?: boolean;
  reason?: 'window_6h' | 'daily_limit' | 'space_6h' | 'file_size';
  retryAfterSeconds?: number;
  waitLabel?: string;
  remainingSpaceBytes?: number;
  message?: string;
}

/**
 * Checks and records a download action quietly with the backend quota service.
 * Simple lightweight tasks return allowed: true immediately; heavy tasks check the
 * cumulative 15 MB / 4-file 6-hour allowance and 9-daily ceiling.
 */
export async function requestDownloadAllowance(
  productId: string,
  fileSizeBytes: number = 0
): Promise<DownloadAllowanceResult> {
  try {
    const res = await fetch('/api/usage/guest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId,
        fileSizeBytes: Math.max(0, Math.round(fileSizeBytes)),
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.allowed === false) {
      return {
        allowed: false,
        reason: data.reason || 'window_6h',
        retryAfterSeconds: Number(data.retryAfterSeconds || 21600),
        waitLabel: data.waitLabel || '6h',
        remainingSpaceBytes: data.remainingSpaceBytes,
        message:
          data.message ||
          'Download limit exceeded. Please wait for the 6-hour refresh or upgrade to Premium to download this file now.',
      };
    }

    return {
      allowed: true,
      unlimited: Boolean(data.unlimited),
    };
  } catch {
    return { allowed: true };
  }
}

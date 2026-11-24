export interface MemoryProfile {
  tier: 'guest' | 'free' | 'paid';
  label: string;
  maxCanvasDpr: number;
  scanRenderScale: number;
  assemblerThumbScale: number;
  maxUndoHistory: number;
  maxFileSizeMb: number;
  maxBatchFiles: number;
  exportDpi: number;
}

/**
 * Returns tiered browser RAM & canvas resolution budgets.
 * Guests (unsigned) and Free-tier users receive low-memory bounds to keep RAM minimal.
 */
export function getMemoryProfile(
  plan?: string | null,
  isAuthenticated?: boolean
): MemoryProfile {
  if (!isAuthenticated) {
    return {
      tier: 'guest',
      label: 'Guest Eco Memory',
      maxCanvasDpr: 1.25,
      scanRenderScale: 1.25,
      assemblerThumbScale: 0.22,
      maxUndoHistory: 8,
      maxFileSizeMb: 15,
      maxBatchFiles: 3,
      exportDpi: 120,
    };
  }

  const normalized = (plan || 'Free').toLowerCase();
  if (normalized === 'free') {
    return {
      tier: 'free',
      label: 'Free Eco Memory',
      maxCanvasDpr: 1.5,
      scanRenderScale: 1.5,
      assemblerThumbScale: 0.28,
      maxUndoHistory: 12,
      maxFileSizeMb: 15,
      maxBatchFiles: 5,
      exportDpi: 150,
    };
  }

  return {
    tier: 'paid',
    label: 'Pro High-Memory',
    maxCanvasDpr: 2.0,
    scanRenderScale: 2.0,
    assemblerThumbScale: 0.35,
    maxUndoHistory: 35,
    maxFileSizeMb: 100,
    maxBatchFiles: 25,
    exportDpi: 200,
  };
}

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
 * Guests and Free-tier users stay within 15 MB low-memory bounds cleanly without exposing badges on UI.
 */
export function getMemoryProfile(
  plan?: string | null,
  isAuthenticated?: boolean
): MemoryProfile {
  if (!isAuthenticated) {
    return {
      tier: 'guest',
      label: 'Standard Mode',
      maxCanvasDpr: 1.25,
      scanRenderScale: 1.25,
      assemblerThumbScale: 0.22,
      maxUndoHistory: 8,
      maxFileSizeMb: 15,
      maxBatchFiles: 4,
      exportDpi: 120,
    };
  }

  const normalized = (plan || 'Free').toLowerCase().replace(/\s+/g, '');
  if (normalized === 'free') {
    return {
      tier: 'free',
      label: 'Standard Mode',
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
    label: 'Premium Workspace',
    maxCanvasDpr: 2.0,
    scanRenderScale: 2.0,
    assemblerThumbScale: 0.35,
    maxUndoHistory: 35,
    maxFileSizeMb: 100,
    maxBatchFiles: 25,
    exportDpi: 200,
  };
}

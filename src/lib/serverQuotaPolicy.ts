import crypto from 'node:crypto';
import { pool } from '@/lib/auth';

export interface ServerQuotaPolicy {
  policyKey: string;
  max6hCount: number;
  max24hCount: number;
  max6hBytes: number;
  window6hSeconds: number;
  window24hSeconds: number;
  simpleProducts: string[];
}

function getSigningSecret(): string {
  return (
    process.env.QUOTA_HMAC_SECRET ||
    process.env.BETTER_AUTH_SECRET ||
    process.env.AUTH_SECRET ||
    process.env.DATABASE_URL ||
    crypto.createHash('sha256').update(process.cwd()).digest('hex')
  );
}

function parsePositiveInt(val: string | undefined, fallback: number): number {
  if (!val) return fallback;
  const parsed = Number.parseInt(val, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function getConfiguredBaselinePolicy(): ServerQuotaPolicy {
  // Configurable via server environment variables and seeded/signed in Postgres `quota_policies`
  const max6hCount = parsePositiveInt(process.env.QUOTA_6H_COUNT, 4);
  const max24hCount = parsePositiveInt(process.env.QUOTA_24H_COUNT, 9);
  const max6hBytes = parsePositiveInt(process.env.QUOTA_6H_BYTES, 15 * 1024 * 1024);
  const window6hSeconds = parsePositiveInt(process.env.QUOTA_6H_WINDOW_SEC, 6 * 60 * 60);
  const window24hSeconds = parsePositiveInt(process.env.QUOTA_24H_WINDOW_SEC, 24 * 60 * 60);

  const envSimple = process.env.QUOTA_SIMPLE_PRODUCTS
    ? process.env.QUOTA_SIMPLE_PRODUCTS.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean)
    : [
        'jpg-to-pdf',
        'pdf-to-jpg',
        'extract-images',
        'compress-image',
        'image-tools',
        'image-converter',
        'pdf-to-text',
        'rotate-pdf',
        'delete-pdf-pages',
        'split-pdf',
        'merge-pdf',
        'page-numbers',
      ];

  return {
    policyKey: 'default',
    max6hCount,
    max24hCount,
    max6hBytes,
    window6hSeconds,
    window24hSeconds,
    simpleProducts: envSimple,
  };
}

function signPolicy(p: ServerQuotaPolicy): string {
  const canonical = JSON.stringify({
    policyKey: p.policyKey,
    max6hCount: p.max6hCount,
    max24hCount: p.max24hCount,
    max6hBytes: p.max6hBytes,
    window6hSeconds: p.window6hSeconds,
    window24hSeconds: p.window24hSeconds,
    simpleProducts: [...p.simpleProducts].sort(),
  });
  return crypto.createHmac('sha256', getSigningSecret()).update(canonical).digest('hex');
}

function verifySignatureEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Loads quota policy dynamically from the signed PostgreSQL `quota_policies` table.
 * Seeds a cryptographically signed default policy row on first boot and rejects unauthenticated tampering.
 */
export async function loadSignedQuotaPolicy(): Promise<ServerQuotaPolicy> {
  const baseline = getConfiguredBaselinePolicy();
  if (!pool) return baseline;

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS quota_policies (
        policy_key VARCHAR(64) PRIMARY KEY,
        max_6h_count INTEGER NOT NULL,
        max_24h_count INTEGER NOT NULL,
        max_6h_bytes BIGINT NOT NULL,
        window_6h_seconds INTEGER NOT NULL,
        window_24h_seconds INTEGER NOT NULL,
        simple_products JSONB NOT NULL,
        signature VARCHAR(128) NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `);

    const existing = await pool.query(
      `SELECT policy_key, max_6h_count, max_24h_count, max_6h_bytes, window_6h_seconds, window_24h_seconds, simple_products, signature
       FROM quota_policies
       WHERE policy_key = 'default'
       LIMIT 1`
    );

    if (existing.rows.length > 0) {
      const row = existing.rows[0];
      const loaded: ServerQuotaPolicy = {
        policyKey: String(row.policy_key),
        max6hCount: Number(row.max_6h_count),
        max24hCount: Number(row.max_24h_count),
        max6hBytes: Number(row.max_6h_bytes),
        window6hSeconds: Number(row.window_6h_seconds),
        window24hSeconds: Number(row.window_24h_seconds),
        simpleProducts: Array.isArray(row.simple_products)
          ? row.simple_products.map((x: unknown) => String(x).toLowerCase())
          : [],
      };
      const expectedSig = signPolicy(loaded);
      if (typeof row.signature === 'string' && verifySignatureEqual(row.signature, expectedSig)) {
        return loaded;
      }

      // Fail closed if database row was altered without the server HMAC key
      return {
        ...baseline,
        max6hCount: 0,
        max24hCount: 0,
        max6hBytes: 0,
        simpleProducts: [],
      };
    }

    const sig = signPolicy(baseline);
    await pool.query(
      `INSERT INTO quota_policies
         (policy_key, max_6h_count, max_24h_count, max_6h_bytes, window_6h_seconds, window_24h_seconds, simple_products, signature)
       VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8)
       ON CONFLICT (policy_key) DO NOTHING`,
      [
        baseline.policyKey,
        baseline.max6hCount,
        baseline.max24hCount,
        baseline.max6hBytes,
        baseline.window6hSeconds,
        baseline.window24hSeconds,
        JSON.stringify(baseline.simpleProducts),
        sig,
      ]
    );
  } catch (err) {
    console.warn('[quota-policy] Using verified server fallback policy:', err);
  }

  return baseline;
}

export function isValidProductSlug(productId: string): boolean {
  return /^[a-z0-9-]{2,64}$/.test(productId);
}

export function formatWaitDuration(seconds: number): string {
  const totalMinutes = Math.max(1, Math.ceil(seconds / 60));
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  if (hours > 0 && mins > 0) return `${hours}h ${mins}m`;
  if (hours > 0) return `${hours}h`;
  return `${mins}m`;
}

export const QUOTA_COOKIE_NAME = '_gv_qsid';

export function verifyOrMintQuotaSid(rawCookieValue: string | undefined): {
  sid: string;
  cookieHeaderValue: string;
  isNew: boolean;
} {
  if (rawCookieValue) {
    const dotIdx = rawCookieValue.indexOf('.');
    if (dotIdx > 0) {
      const sid = rawCookieValue.slice(0, dotIdx);
      const sig = rawCookieValue.slice(dotIdx + 1);
      if (/^[a-zA-Z0-9-]{16,64}$/.test(sid)) {
        const expected = crypto
          .createHmac('sha256', getSigningSecret())
          .update(`qsid:${sid}`)
          .digest('hex')
          .slice(0, 32);
        if (verifySignatureEqual(sig, expected)) {
          return { sid, cookieHeaderValue: rawCookieValue, isNew: false };
        }
      }
    }
  }

  const freshSid = crypto.randomUUID();
  const sig = crypto
    .createHmac('sha256', getSigningSecret())
    .update(`qsid:${freshSid}`)
    .digest('hex')
    .slice(0, 32);
  return {
    sid: freshSid,
    cookieHeaderValue: `${freshSid}.${sig}`,
    isNew: true,
  };
}

export function signExportTicket(productId: string, subjectKey: string): string {
  const ts = Date.now().toString(36);
  const payload = `${productId}:${subjectKey}:${ts}`;
  const mac = crypto
    .createHmac('sha256', getSigningSecret())
    .update(payload)
    .digest('hex')
    .slice(0, 24);
  return `${ts}.${mac}`;
}

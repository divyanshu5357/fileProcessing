import { NextRequest, NextResponse } from 'next/server';
import { auth, pool } from '@/lib/auth';
import { extractClientIp, normalizeIp } from '@/lib/ipUtils';
import { getMemoryProfile } from '@/lib/memoryProfile';
import {
  loadSignedQuotaPolicy,
  isValidProductSlug,
  formatWaitDuration,
  QUOTA_COOKIE_NAME,
  verifyOrMintQuotaSid,
  signExportTicket,
  ServerQuotaPolicy,
} from '@/lib/serverQuotaPolicy';

interface UsageEventEntry {
  gid: string;
  ts: number;
  bytes: number;
}

// Fallback store ONLY if DB pool is unavailable
const fallbackEventStore = new Map<string, UsageEventEntry[]>();

const PAID_PLANS = new Set(['prime', 'prime_plus', 'primeplus', 'prime_ultra', 'primeultra']);

function attachQuotaCookie(
  res: NextResponse,
  cookieHeaderValue: string,
  shouldSet: boolean
): NextResponse {
  if (shouldSet) {
    res.cookies.set(QUOTA_COOKIE_NAME, cookieHeaderValue, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    });
  }
  return res;
}

async function resolveSessionContext(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (session?.user) {
      const sessionUser = session.user as { id: string; plan?: string; role?: string };
      let plan = sessionUser.plan || 'Free';
      let role = sessionUser.role || 'user';
      if (pool) {
        try {
          const userRes = await pool.query(
            `SELECT role FROM public."user" WHERE id = $1 LIMIT 1`,
            [session.user.id]
          );
          if (userRes.rows[0]?.role) role = userRes.rows[0].role;

          const subRes = await pool.query(
            `SELECT plan_name FROM public.subscriptions WHERE user_id = $1 AND subscription_status = 'active' LIMIT 1`,
            [session.user.id]
          );
          if (subRes.rows[0]?.plan_name) plan = subRes.rows[0].plan_name;
        } catch {}
      }

      const normalizedPlan = plan.toLowerCase().replace(/\s+/g, '');
      const isUnlimited = role === 'admin' || PAID_PLANS.has(normalizedPlan);
      return {
        authenticated: true,
        userId: session.user.id,
        plan,
        isUnlimited,
      };
    }
  } catch {}
  return { authenticated: false, userId: null, plan: 'Free', isUnlimited: false };
}

async function ensureUsageEventsTable() {
  if (!pool) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS download_usage_events (
      id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
      event_group_id VARCHAR(64) NOT NULL DEFAULT '',
      subject_key VARCHAR(160) NOT NULL,
      ip_address VARCHAR(128) NOT NULL,
      product_id VARCHAR(64) NOT NULL,
      file_size_bytes BIGINT NOT NULL DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    );
    ALTER TABLE download_usage_events
      ADD COLUMN IF NOT EXISTS event_group_id VARCHAR(64) NOT NULL DEFAULT '';
    CREATE INDEX IF NOT EXISTS idx_download_usage_subject_created
      ON download_usage_events (subject_key, created_at DESC);
  `);
}

interface QuotaCheckOutcome {
  allowed: boolean;
  reason?: 'window_6h' | 'daily_limit' | 'space_6h' | 'file_size';
  retryAfterSeconds?: number;
  waitLabel?: string;
  refreshAtIso?: string;
}

async function checkAndRecordAtomic(
  subjectKeys: string[],
  normalizedIp: string,
  productId: string,
  fileSizeBytes: number,
  policy: ServerQuotaPolicy,
  recordOnSuccess: boolean
): Promise<QuotaCheckOutcome> {
  const now = Date.now();
  const safeBytes = Math.max(0, Math.round(fileSizeBytes));
  const sortedKeys = [...new Set(subjectKeys)].sort();

  if (pool) {
    await ensureUsageEventsTable();
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      // Advisory transaction locks in consistent sorted order serialize concurrent requests across IP + Cookie + User
      for (const lockKey of sortedKeys) {
        await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [lockKey]);
      }

      await client.query(
        `DELETE FROM download_usage_events
         WHERE subject_key = ANY($1::text[])
           AND created_at < NOW() - ($2 * INTERVAL '1 second')`,
        [sortedKeys, policy.window24hSeconds]
      );

      const res = await client.query(
        `WITH deduped AS (
           SELECT DISTINCT ON (COALESCE(NULLIF(event_group_id, ''), id))
             COALESCE(NULLIF(event_group_id, ''), id) AS gid,
             file_size_bytes,
             created_at
           FROM download_usage_events
           WHERE subject_key = ANY($1::text[])
         )
         SELECT
           COUNT(*) FILTER (WHERE created_at >= NOW() - ($2 * INTERVAL '1 second'))::int AS used_6h,
           COUNT(*) FILTER (WHERE created_at >= NOW() - ($3 * INTERVAL '1 second'))::int AS used_24h,
           COALESCE(SUM(file_size_bytes) FILTER (WHERE created_at >= NOW() - ($2 * INTERVAL '1 second')), 0)::bigint AS bytes_6h,
           MIN(created_at) FILTER (WHERE created_at >= NOW() - ($2 * INTERVAL '1 second')) AS oldest_6h,
           MIN(created_at) FILTER (WHERE created_at >= NOW() - ($3 * INTERVAL '1 second')) AS oldest_24h
         FROM deduped`,
        [sortedKeys, policy.window6hSeconds, policy.window24hSeconds]
      );

      const row = res.rows[0] || {};
      const used6h = Number(row.used_6h || 0);
      const used24h = Number(row.used_24h || 0);
      const bytes6h = Number(row.bytes_6h || 0);
      const oldest6hMs = row.oldest_6h ? new Date(row.oldest_6h).getTime() : null;
      const oldest24hMs = row.oldest_24h ? new Date(row.oldest_24h).getTime() : null;

      if (used24h >= policy.max24hCount) {
        await client.query('ROLLBACK');
        const refreshAtMs = (oldest24hMs || now) + policy.window24hSeconds * 1000;
        const retryAfterSeconds = Math.max(60, Math.ceil((refreshAtMs - now) / 1000));
        return {
          allowed: false,
          reason: 'daily_limit',
          retryAfterSeconds,
          waitLabel: formatWaitDuration(retryAfterSeconds),
          refreshAtIso: new Date(refreshAtMs).toISOString(),
        };
      }

      if (used6h >= policy.max6hCount) {
        await client.query('ROLLBACK');
        const refreshAtMs = (oldest6hMs || now) + policy.window6hSeconds * 1000;
        const retryAfterSeconds = Math.max(60, Math.ceil((refreshAtMs - now) / 1000));
        return {
          allowed: false,
          reason: 'window_6h',
          retryAfterSeconds,
          waitLabel: formatWaitDuration(retryAfterSeconds),
          refreshAtIso: new Date(refreshAtMs).toISOString(),
        };
      }

      if (bytes6h + safeBytes > policy.max6hBytes) {
        await client.query('ROLLBACK');
        const refreshAtMs = (oldest6hMs || now) + policy.window6hSeconds * 1000;
        const retryAfterSeconds = Math.max(60, Math.ceil((refreshAtMs - now) / 1000));
        return {
          allowed: false,
          reason: bytes6h === 0 ? 'file_size' : 'space_6h',
          retryAfterSeconds,
          waitLabel: formatWaitDuration(retryAfterSeconds),
          refreshAtIso: new Date(refreshAtMs).toISOString(),
        };
      }

      if (recordOnSuccess) {
        const eventGroupId = crypto.randomUUID();
        for (const key of sortedKeys) {
          await client.query(
            `INSERT INTO download_usage_events (id, event_group_id, subject_key, ip_address, product_id, file_size_bytes, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
            [crypto.randomUUID(), eventGroupId, key, normalizedIp, productId, safeBytes]
          );
        }
      }

      await client.query('COMMIT');
      return { allowed: true };
    } catch (err) {
      await client.query('ROLLBACK').catch(() => {});
      throw err;
    } finally {
      client.release();
    }
  }

  // Fallback in-memory check ONLY when no Postgres pool exists
  const cutoff24h = now - policy.window24hSeconds * 1000;
  const cutoff6h = now - policy.window6hSeconds * 1000;
  const seen = new Map<string, UsageEventEntry>();
  for (const key of sortedKeys) {
    const existing = (fallbackEventStore.get(key) || []).filter((e) => e.ts >= cutoff24h);
    fallbackEventStore.set(key, existing);
    for (const e of existing) seen.set(e.gid, e);
  }
  const allEvents = Array.from(seen.values()).sort((a, b) => a.ts - b.ts);
  const in6h = allEvents.filter((e) => e.ts >= cutoff6h);
  const bytes6h = in6h.reduce((sum, e) => sum + e.bytes, 0);

  if (allEvents.length >= policy.max24hCount) {
    const refreshAtMs = (allEvents[0]?.ts || now) + policy.window24hSeconds * 1000;
    const retryAfterSeconds = Math.max(60, Math.ceil((refreshAtMs - now) / 1000));
    return {
      allowed: false,
      reason: 'daily_limit',
      retryAfterSeconds,
      waitLabel: formatWaitDuration(retryAfterSeconds),
      refreshAtIso: new Date(refreshAtMs).toISOString(),
    };
  }
  if (in6h.length >= policy.max6hCount) {
    const refreshAtMs = (in6h[0]?.ts || now) + policy.window6hSeconds * 1000;
    const retryAfterSeconds = Math.max(60, Math.ceil((refreshAtMs - now) / 1000));
    return {
      allowed: false,
      reason: 'window_6h',
      retryAfterSeconds,
      waitLabel: formatWaitDuration(retryAfterSeconds),
      refreshAtIso: new Date(refreshAtMs).toISOString(),
    };
  }
  if (bytes6h + safeBytes > policy.max6hBytes) {
    const refreshAtMs = (in6h[0]?.ts || now) + policy.window6hSeconds * 1000;
    const retryAfterSeconds = Math.max(60, Math.ceil((refreshAtMs - now) / 1000));
    return {
      allowed: false,
      reason: bytes6h === 0 ? 'file_size' : 'space_6h',
      retryAfterSeconds,
      waitLabel: formatWaitDuration(retryAfterSeconds),
      refreshAtIso: new Date(refreshAtMs).toISOString(),
    };
  }

  if (recordOnSuccess) {
    const entry: UsageEventEntry = { gid: crypto.randomUUID(), ts: now, bytes: safeBytes };
    for (const key of sortedKeys) {
      const existing = fallbackEventStore.get(key) || [];
      existing.push(entry);
      fallbackEventStore.set(key, existing);
    }
  }
  return { allowed: true };
}

export async function GET(req: NextRequest) {
  const productId = (req.nextUrl.searchParams.get('productId') || 'pdf-editor')
    .trim()
    .toLowerCase();
  const ipInfo = extractClientIp(req);
  const normalizedIp = normalizeIp(ipInfo.ip) || 'unknown';
  const cookie = verifyOrMintQuotaSid(req.cookies.get(QUOTA_COOKIE_NAME)?.value);
  const policy = await loadSignedQuotaPolicy();
  const sessionCtx = await resolveSessionContext(req);

  const isSimpleTool = policy.simpleProducts.includes(productId);
  const memoryProfile = isSimpleTool
    ? getMemoryProfile('PrimePlus', true)
    : getMemoryProfile(sessionCtx.plan, sessionCtx.authenticated);

  if (sessionCtx.isUnlimited || isSimpleTool) {
    return attachQuotaCookie(
      NextResponse.json({
        authenticated: sessionCtx.authenticated,
        unlimited: true,
        allowed: true,
        memoryProfile,
      }),
      cookie.cookieHeaderValue,
      cookie.isNew
    );
  }

  const subjectKeys = [`ip:${normalizedIp}`, `sid:${cookie.sid}`];
  if (sessionCtx.userId) subjectKeys.push(`user:${sessionCtx.userId}`);

  const check = await checkAndRecordAtomic(
    subjectKeys,
    normalizedIp,
    productId,
    0,
    policy,
    false
  );

  // Notice: Wait numbers, counts, and IP details are never returned proactively in GET
  return attachQuotaCookie(
    NextResponse.json({
      authenticated: sessionCtx.authenticated,
      unlimited: false,
      allowed: check.allowed,
      memoryProfile,
    }),
    cookie.cookieHeaderValue,
    cookie.isNew
  );
}

export async function POST(req: NextRequest) {
  const ipInfo = extractClientIp(req);
  const normalizedIp = normalizeIp(ipInfo.ip) || 'unknown';
  const cookie = verifyOrMintQuotaSid(req.cookies.get(QUOTA_COOKIE_NAME)?.value);
  const body = await req.json().catch(() => ({}));
  const productId = (
    typeof body?.productId === 'string' ? body.productId : 'pdf-editor'
  )
    .trim()
    .toLowerCase();
  const fileSizeBytes = Math.max(0, Number(body?.fileSizeBytes || 0));

  if (!isValidProductSlug(productId)) {
    return NextResponse.json({ error: 'Invalid tool request.' }, { status: 400 });
  }

  const policy = await loadSignedQuotaPolicy();
  const sessionCtx = await resolveSessionContext(req);
  const isSimpleTool = policy.simpleProducts.includes(productId);
  const memoryProfile = isSimpleTool
    ? getMemoryProfile('PrimePlus', true)
    : getMemoryProfile(sessionCtx.plan, sessionCtx.authenticated);

  if (sessionCtx.isUnlimited || isSimpleTool) {
    return attachQuotaCookie(
      NextResponse.json({
        authenticated: sessionCtx.authenticated,
        unlimited: true,
        allowed: true,
        exportTicket: signExportTicket(productId, `ok:${cookie.sid}`),
        memoryProfile,
      }),
      cookie.cookieHeaderValue,
      cookie.isNew
    );
  }

  const subjectKeys = [`ip:${normalizedIp}`, `sid:${cookie.sid}`];
  if (sessionCtx.userId) subjectKeys.push(`user:${sessionCtx.userId}`);

  const check = await checkAndRecordAtomic(
    subjectKeys,
    normalizedIp,
    productId,
    fileSizeBytes,
    policy,
    true
  );

  if (!check.allowed) {
    return attachQuotaCookie(
      NextResponse.json(
        {
          authenticated: sessionCtx.authenticated,
          unlimited: false,
          allowed: false,
          reason: check.reason || 'window_6h',
          requiresUpgrade: true,
          retryAfterSeconds: check.retryAfterSeconds,
          waitLabel: check.waitLabel,
          refreshAtIso: check.refreshAtIso,
          message:
            check.reason === 'file_size'
              ? 'This file exceeds the standard allowance. Upgrade to Premium to download immediately.'
              : check.reason === 'daily_limit'
              ? `Daily download limit exceeded. Please wait ${check.waitLabel} for refresh or upgrade to Premium to download now.`
              : `Download limit exceeded. Please wait ${check.waitLabel} for the 6-hour refresh or upgrade to Premium to download your edited file immediately.`,
        },
        { status: 403 }
      ),
      cookie.cookieHeaderValue,
      cookie.isNew
    );
  }

  return attachQuotaCookie(
    NextResponse.json({
      authenticated: sessionCtx.authenticated,
      unlimited: false,
      allowed: true,
      exportTicket: signExportTicket(productId, `ip:${normalizedIp}`),
      memoryProfile,
    }),
    cookie.cookieHeaderValue,
    cookie.isNew
  );
}

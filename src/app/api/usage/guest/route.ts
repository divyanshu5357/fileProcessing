import { NextRequest, NextResponse } from 'next/server';
import { auth, pool } from '@/lib/auth';
import { extractClientIp, maskIp, normalizeIp } from '@/lib/ipUtils';
import { GUEST_MAX_USES_PER_PRODUCT, getProductMeta } from '@/lib/guestQuota';
import { getMemoryProfile } from '@/lib/memoryProfile';

// Process fallback map ONLY if DB pool is unavailable
const fallbackMemoryGuestUsage = new Map<string, number>();

async function ensureGuestUsageTable() {
  if (!pool) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS guest_ip_usage (
      id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
      ip_address VARCHAR(128) NOT NULL,
      product_id VARCHAR(64) NOT NULL,
      usage_count INTEGER NOT NULL DEFAULT 0,
      last_user_agent TEXT,
      first_used_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      last_used_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      UNIQUE(ip_address, product_id)
    );
  `);
}

async function resolveSessionContext(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (session?.user) {
      const sessionUser = session.user as { id: string; plan?: string };
      let plan = sessionUser.plan || 'Free';
      if (pool) {
        try {
          const subRes = await pool.query(
            `SELECT plan_name FROM public.subscriptions WHERE user_id = $1 AND subscription_status = 'active' LIMIT 1`,
            [session.user.id]
          );
          if (subRes.rows[0]?.plan_name) plan = subRes.rows[0].plan_name;
        } catch {}
      }
      return { authenticated: true, userId: session.user.id, plan };
    }
  } catch {}
  return { authenticated: false, userId: null, plan: 'Guest' };
}

export async function GET(req: NextRequest) {
  const productId = (req.nextUrl.searchParams.get('productId') || 'pdf-editor').trim();
  const meta = getProductMeta(productId);
  const ipInfo = extractClientIp(req);
  const normalizedIp = normalizeIp(ipInfo.ip) || 'unknown';
  const sessionCtx = await resolveSessionContext(req);
  const memoryProfile = getMemoryProfile(sessionCtx.plan, sessionCtx.authenticated);

  if (sessionCtx.authenticated) {
    return NextResponse.json({
      authenticated: true,
      unlimited: true,
      allowed: true,
      productId,
      productName: meta.name,
      used: 0,
      limit: null,
      remaining: null,
      ipMasked: maskIp(ipInfo.ip),
      memoryProfile,
    });
  }

  let used = 0;
  if (pool) {
    try {
      const res = await pool.query(
        `SELECT usage_count FROM guest_ip_usage WHERE ip_address = $1 AND product_id = $2 LIMIT 1`,
        [normalizedIp, productId]
      );
      used = Number(res.rows[0]?.usage_count || 0);
    } catch {
      try {
        await ensureGuestUsageTable();
      } catch {}
      used = fallbackMemoryGuestUsage.get(`${normalizedIp}:${productId}`) || 0;
    }
  } else {
    used = fallbackMemoryGuestUsage.get(`${normalizedIp}:${productId}`) || 0;
  }

  const limit = meta.limit || GUEST_MAX_USES_PER_PRODUCT;
  const remaining = Math.max(0, limit - used);

  return NextResponse.json({
    authenticated: false,
    unlimited: false,
    allowed: used < limit,
    productId,
    productName: meta.name,
    used,
    limit,
    remaining,
    ipMasked: maskIp(ipInfo.ip),
    memoryProfile,
  });
}

export async function POST(req: NextRequest) {
  const ipInfo = extractClientIp(req);
  const normalizedIp = normalizeIp(ipInfo.ip) || 'unknown';
  const userAgent = req.headers.get('user-agent') || '';
  const body = await req.json().catch(() => ({}));
  const productId = (typeof body?.productId === 'string' ? body.productId : 'pdf-editor').trim();
  const meta = getProductMeta(productId);
  const limit = meta.limit || GUEST_MAX_USES_PER_PRODUCT;

  const sessionCtx = await resolveSessionContext(req);
  const memoryProfile = getMemoryProfile(sessionCtx.plan, sessionCtx.authenticated);

  // Signed-in users have unlimited access
  if (sessionCtx.authenticated) {
    return NextResponse.json({
      authenticated: true,
      unlimited: true,
      allowed: true,
      productId,
      productName: meta.name,
      used: 0,
      limit: null,
      remaining: null,
      ipMasked: maskIp(ipInfo.ip),
      memoryProfile,
    });
  }

  let used = 0;
  let allowed = false;

  if (pool) {
    try {
      const upsertRes = await pool.query(
        `INSERT INTO guest_ip_usage (ip_address, product_id, usage_count, last_user_agent, first_used_at, last_used_at)
         VALUES ($1, $2, 1, $3, NOW(), NOW())
         ON CONFLICT (ip_address, product_id)
         DO UPDATE SET
           usage_count = guest_ip_usage.usage_count + 1,
           last_user_agent = EXCLUDED.last_user_agent,
           last_used_at = NOW()
         WHERE guest_ip_usage.usage_count < $4
         RETURNING usage_count`,
        [normalizedIp, productId, userAgent, limit]
      );

      if (upsertRes.rows.length > 0) {
        used = Number(upsertRes.rows[0].usage_count);
        allowed = true;
      } else {
        const curRes = await pool.query(
          `SELECT usage_count FROM guest_ip_usage WHERE ip_address = $1 AND product_id = $2 LIMIT 1`,
          [normalizedIp, productId]
        );
        used = Number(curRes.rows[0]?.usage_count ?? limit);
        allowed = false;
      }
    } catch {
      try {
        await ensureGuestUsageTable();
      } catch {}
      const key = `${normalizedIp}:${productId}`;
      const cur = fallbackMemoryGuestUsage.get(key) || 0;
      if (cur < limit) {
        used = cur + 1;
        fallbackMemoryGuestUsage.set(key, used);
        allowed = true;
      } else {
        used = cur;
        allowed = false;
      }
    }
  } else {
    const key = `${normalizedIp}:${productId}`;
    const cur = fallbackMemoryGuestUsage.get(key) || 0;
    if (cur < limit) {
      used = cur + 1;
      fallbackMemoryGuestUsage.set(key, used);
      allowed = true;
    } else {
      used = cur;
      allowed = false;
    }
  }

  const remaining = Math.max(0, limit - used);
  if (!allowed) {
    return NextResponse.json(
      {
        authenticated: false,
        unlimited: false,
        allowed: false,
        productId,
        productName: meta.name,
        used,
        limit,
        remaining: 0,
        ipMasked: maskIp(ipInfo.ip),
        memoryProfile,
        message: `Guest trial limit reached (${limit}/${limit} uses for ${meta.name} from your IP). Sign in free for unlimited access.`,
      },
      { status: 403 }
    );
  }

  return NextResponse.json({
    authenticated: false,
    unlimited: false,
    allowed: true,
    productId,
    productName: meta.name,
    used,
    limit,
    remaining,
    ipMasked: maskIp(ipInfo.ip),
    memoryProfile,
  });
}

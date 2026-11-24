import { NextRequest, NextResponse } from 'next/server';
import { auth, pool } from '@/lib/auth';
import { verifyIsSoleAdmin } from '@/lib/adminSecurity';
import {
  loadSignedQuotaPolicy,
  updateSignedQuotaPolicy,
} from '@/lib/serverQuotaPolicy';
import {
  getPlanByIdOrSlug,
  getSiteSettings,
  getSubscriptionPlans,
  updateSiteSettings,
  upsertSubscriptionPlan,
} from '@/lib/siteConfigServer';
import { CENTRAL_TOOL_REGISTRY } from '@/lib/toolRegistry';

export const dynamic = 'force-dynamic';

async function requireSoleAdmin(req: NextRequest) {
  let session: Awaited<ReturnType<typeof auth.api.getSession>> = null;
  try {
    session = await auth.api.getSession({ headers: req.headers });
  } catch {
    return {
      ok: false as const,
      response: NextResponse.json({ error: 'Unauthorized: Invalid session.' }, { status: 401 }),
    };
  }

  if (!session?.user?.id || !session.user.email) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: 'Unauthorized: Please sign in as Administrator.' }, { status: 401 }),
    };
  }

  const isVerifiedAdmin =
    Boolean(session.user.emailVerified) &&
    (await verifyIsSoleAdmin({
      id: session.user.id,
      email: session.user.email,
    }));

  if (!isVerifiedAdmin) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { error: 'Forbidden: Administrator access required.' },
        { status: 403 }
      ),
    };
  }

  return {
    ok: true as const,
    user: session.user,
  };
}

async function queryScalar(sql: string, params: unknown[] = []): Promise<number> {
  if (!pool) return 0;
  try {
    const res = await pool.query(sql, params);
    const val = res.rows[0] ? Object.values(res.rows[0])[0] : 0;
    return Number(val) || 0;
  } catch {
    return 0;
  }
}

export async function GET(req: NextRequest) {
  const adminCheck = await requireSoleAdmin(req);
  if (!adminCheck.ok) return adminCheck.response;

  try {
    const [siteSettings, plans, quotaPolicy] = await Promise.all([
      getSiteSettings(),
      getSubscriptionPlans({ includeInactive: true }),
      loadSignedQuotaPolicy(),
    ]);

    const [events6h, events24h, events7d, bytes24h, uniqueSubjects24h, totalUsers] =
      await Promise.all([
        queryScalar(
          `SELECT COUNT(*)::int FROM download_usage_events WHERE created_at >= NOW() - INTERVAL '6 hours'`
        ),
        queryScalar(
          `SELECT COUNT(*)::int FROM download_usage_events WHERE created_at >= NOW() - INTERVAL '24 hours'`
        ),
        queryScalar(
          `SELECT COUNT(*)::int FROM download_usage_events WHERE created_at >= NOW() - INTERVAL '7 days'`
        ),
        queryScalar(
          `SELECT COALESCE(SUM(file_bytes), 0)::bigint FROM download_usage_events WHERE created_at >= NOW() - INTERVAL '24 hours'`
        ),
        queryScalar(
          `SELECT COUNT(DISTINCT subject_key)::int FROM download_usage_events WHERE created_at >= NOW() - INTERVAL '24 hours'`
        ),
        queryScalar(`SELECT COUNT(*)::int FROM public."user"`),
      ]);

    let topTools: Array<{ productId: string; count: number; totalBytes: number }> = [];
    if (pool) {
      try {
        const toolRes = await pool.query(
          `SELECT product_id, COUNT(*)::int AS cnt, COALESCE(SUM(file_bytes), 0)::bigint AS bytes
           FROM download_usage_events
           WHERE created_at >= NOW() - INTERVAL '30 days'
           GROUP BY product_id
           ORDER BY cnt DESC
           LIMIT 20`
        );
        topTools = toolRes.rows.map((r) => ({
          productId: String(r.product_id),
          count: Number(r.cnt) || 0,
          totalBytes: Number(r.bytes) || 0,
        }));
      } catch {
        topTools = [];
      }
    }

    const toolCatalog = CENTRAL_TOOL_REGISTRY.map((t) => ({
      id: t.id,
      title: t.name,
      category: t.category,
    }));

    return NextResponse.json(
      {
        siteSettings,
        plans,
        quotaPolicy,
        toolCatalog,
        usageAnalytics: {
          events6h,
          events24h,
          events7d,
          bytes24h,
          uniqueSubjects24h,
          totalUsers,
          topTools,
        },
      },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to load admin controls.';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const adminCheck = await requireSoleAdmin(req);
  if (!adminCheck.ok) return adminCheck.response;

  try {
    const body = await req.json();
    const action = String(body?.action || '');

    if (action === 'update_site_settings') {
      const siteSettings = await updateSiteSettings({
        paymentsEnabled:
          typeof body.paymentsEnabled === 'boolean' ? body.paymentsEnabled : undefined,
        maintenanceMode:
          typeof body.maintenanceMode === 'boolean' ? body.maintenanceMode : undefined,
        announcementBanner:
          typeof body.announcementBanner === 'string' ? body.announcementBanner : undefined,
      });

      return NextResponse.json({ status: 'ok', siteSettings });
    }

    if (action === 'update_quota_policy') {
      const max6hMb = Number(body.max6hMb);
      const max6hBytes =
        typeof body.max6hBytes === 'number'
          ? body.max6hBytes
          : Number.isFinite(max6hMb) && max6hMb >= 1
            ? Math.round(max6hMb * 1024 * 1024)
            : undefined;

      const window6hHours = Number(body.window6hHours);
      const window6hSeconds =
        typeof body.window6hSeconds === 'number'
          ? body.window6hSeconds
          : Number.isFinite(window6hHours) && window6hHours >= 1
            ? Math.round(window6hHours * 3600)
            : undefined;

      const window24hHours = Number(body.window24hHours);
      const window24hSeconds =
        typeof body.window24hSeconds === 'number'
          ? body.window24hSeconds
          : Number.isFinite(window24hHours) && window24hHours >= 1
            ? Math.round(window24hHours * 3600)
            : undefined;

      const quotaPolicy = await updateSignedQuotaPolicy({
        max6hCount: typeof body.max6hCount === 'number' ? body.max6hCount : undefined,
        max24hCount: typeof body.max24hCount === 'number' ? body.max24hCount : undefined,
        max6hBytes,
        window6hSeconds,
        window24hSeconds,
        simpleProducts: Array.isArray(body.simpleProducts) ? body.simpleProducts : undefined,
      });

      return NextResponse.json({ status: 'ok', quotaPolicy });
    }

    if (action === 'update_plan') {
      const planId = String(body.id || '').trim();
      if (!planId) {
        return NextResponse.json({ error: 'Plan id is required.' }, { status: 400 });
      }

      const storageMb = Number(body.storageLimitMb);
      const storageLimitBytes =
        typeof body.storageLimitBytes === 'number'
          ? body.storageLimitBytes
          : Number.isFinite(storageMb) && storageMb >= 1
            ? Math.round(storageMb * 1024 * 1024)
            : undefined;

      const maxFileMb = Number(body.maxFileSizeMb);
      const maxFileSizeBytes =
        typeof body.maxFileSizeBytes === 'number'
          ? body.maxFileSizeBytes
          : Number.isFinite(maxFileMb) && maxFileMb >= 1
            ? Math.round(maxFileMb * 1024 * 1024)
            : undefined;

      const updatedPlan = await upsertSubscriptionPlan({
        id: planId,
        name: typeof body.name === 'string' ? body.name : undefined,
        badge: typeof body.badge === 'string' ? body.badge : undefined,
        description: typeof body.description === 'string' ? body.description : undefined,
        priceMonthlyInr:
          typeof body.priceMonthlyInr === 'number' ? body.priceMonthlyInr : undefined,
        priceYearlyInr:
          typeof body.priceYearlyInr === 'number' ? body.priceYearlyInr : undefined,
        storageLimitBytes,
        retentionDays: typeof body.retentionDays === 'number' ? body.retentionDays : undefined,
        maxFileSizeBytes,
        features: Array.isArray(body.features) ? body.features : undefined,
        isRecommended:
          typeof body.isRecommended === 'boolean' ? body.isRecommended : undefined,
        isActive: typeof body.isActive === 'boolean' ? body.isActive : undefined,
      });

      const plans = await getSubscriptionPlans({ includeInactive: true });
      return NextResponse.json({ status: 'ok', plan: updatedPlan, plans });
    }

    if (action === 'update_user_plan') {
      if (!pool) {
        return NextResponse.json({ error: 'Database unavailable.' }, { status: 503 });
      }
      const targetUserId = String(body.userId || '').trim();
      const rawPlanId = String(body.planId || 'free').trim();
      if (!targetUserId) {
        return NextResponse.json({ error: 'Target userId is required.' }, { status: 400 });
      }

      const plan = await getPlanByIdOrSlug(rawPlanId);
      if (!plan) {
        return NextResponse.json({ error: `Unknown plan: ${rawPlanId}` }, { status: 400 });
      }

      await pool.query(
        `INSERT INTO subscriptions (
          user_id, plan_id, plan_name, storage_limit, file_size_limit,
          subscription_status, billing_cycle, current_period_start, current_period_end, cancel_at_period_end
        ) VALUES (
          $1, $2, $3, $4, $5, 'active', 'monthly', NOW(), NOW() + INTERVAL '30 days', FALSE
        )
        ON CONFLICT (user_id) DO UPDATE SET
          plan_id = EXCLUDED.plan_id,
          plan_name = EXCLUDED.plan_name,
          storage_limit = EXCLUDED.storage_limit,
          file_size_limit = EXCLUDED.file_size_limit,
          subscription_status = 'active',
          updated_at = NOW()`,
        [targetUserId, plan.id, plan.tier, plan.storageLimitBytes, plan.maxFileSizeBytes]
      );

      return NextResponse.json({ status: 'ok', userId: targetUserId, plan: plan.tier });
    }

    return NextResponse.json({ error: `Unsupported action: ${action}` }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to save admin changes.';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

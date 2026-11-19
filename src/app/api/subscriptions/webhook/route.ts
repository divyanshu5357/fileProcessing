import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { Pool } from 'pg';

const databaseUrl = process.env.DATABASE_URL;
const pool = databaseUrl
  ? new Pool({
      connectionString: databaseUrl,
      ssl: { rejectUnauthorized: false },
    })
  : null;

function timingSafeSecretCheck(provided: string, expected: string): boolean {
  if (!provided || !expected) return false;
  try {
    const pBuf = Buffer.from(provided);
    const eBuf = Buffer.from(expected);
    if (pBuf.length !== eBuf.length) return false;
    return crypto.timingSafeEqual(pBuf, eBuf);
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  const secretHeader = req.headers.get('x-webhook-secret') || '';
  const configuredSecret = process.env.WEBHOOK_SECRET;

  if (!configuredSecret) {
    console.error('[CRITICAL SECURITY] WEBHOOK_SECRET is not configured on the server.');
    return NextResponse.json({ error: 'Webhook service misconfigured' }, { status: 500 });
  }

  // Strict constant-time verification against server WEBHOOK_SECRET only
  if (!timingSafeSecretCheck(secretHeader, configuredSecret)) {
    return NextResponse.json({ error: 'Unauthorized webhook request' }, { status: 401 });
  }

  try {
    const payload = await req.json();
    const { event, transaction_id, user_id, plan_id, amount_inr, billing_cycle = 'monthly' } = payload;

    // Strict input validation
    if (!transaction_id || typeof transaction_id !== 'string') {
      return NextResponse.json({ error: 'Invalid transaction_id' }, { status: 400 });
    }
    if (!user_id || typeof user_id !== 'string') {
      return NextResponse.json({ error: 'Invalid user_id' }, { status: 400 });
    }
    if (!plan_id || typeof plan_id !== 'string') {
      return NextResponse.json({ error: 'Invalid plan_id' }, { status: 400 });
    }
    if (typeof amount_inr !== 'number' || amount_inr < 0) {
      return NextResponse.json({ error: 'Invalid amount_inr' }, { status: 400 });
    }

    if (event !== 'payment.succeeded') {
      return NextResponse.json({ status: 'ignored', event });
    }

    if (!pool) {
      return NextResponse.json({ status: 'subscription_activated', note: 'No DB configured' });
    }

    // 1. Fetch Plan details from Neon
    const planRes = await pool.query('SELECT * FROM plans WHERE id = $1 AND is_active = true', [plan_id]);
    if (planRes.rows.length === 0) {
      return NextResponse.json({ error: `Plan ${plan_id} not found or inactive` }, { status: 404 });
    }
    const plan = planRes.rows[0];

    const periodDays = billing_cycle === 'yearly' ? 365 : 30;

    // 2. Upsert Subscription in Neon
    const subRes = await pool.query(
      `INSERT INTO subscriptions (
        user_id, plan_id, plan_name, storage_limit, file_size_limit,
        subscription_status, billing_cycle, current_period_start, current_period_end, cancel_at_period_end
      ) VALUES (
        $1, $2, $3, $4, $5, 'active', $6, NOW(), NOW() + ($7 || ' days')::interval, FALSE
      )
      ON CONFLICT (user_id) DO UPDATE SET
        plan_id = EXCLUDED.plan_id,
        plan_name = EXCLUDED.plan_name,
        storage_limit = EXCLUDED.storage_limit,
        file_size_limit = EXCLUDED.file_size_limit,
        subscription_status = 'active',
        billing_cycle = EXCLUDED.billing_cycle,
        current_period_start = NOW(),
        current_period_end = NOW() + ($7 || ' days')::interval,
        cancel_at_period_end = FALSE,
        updated_at = NOW()
      RETURNING id`,
      [user_id, plan.id, plan.name, plan.storage_limit_bytes, plan.max_file_size_bytes, billing_cycle, periodDays]
    );

    const subscriptionId = subRes.rows[0]?.id;

    // 3. Record Payment
    await pool.query(
      `INSERT INTO payments (
        user_id, subscription_id, plan_id, amount_inr, billing_cycle, payment_method, transaction_id, status
      ) VALUES ($1, $2, $3, $4, $5, 'UPI / Verified Webhook', $6, 'succeeded')
      ON CONFLICT (transaction_id) DO NOTHING`,
      [user_id, subscriptionId, plan.id, amount_inr, billing_cycle, transaction_id]
    );

    return NextResponse.json({
      status: 'subscription_activated',
      user_id,
      plan_name: plan.name,
      storage_limit_bytes: plan.storage_limit_bytes,
      retention_days: plan.retention_days,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal webhook error' }, { status: 500 });
  }
}

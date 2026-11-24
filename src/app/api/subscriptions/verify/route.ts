import { NextRequest, NextResponse } from 'next/server';
import { auth, pool } from '@/lib/auth';
import { RAZORPAY_PLANS, verifyRazorpaySignature } from '@/lib/razorpay';
import { createInternalAssertion } from '@/lib/internalAuth';

const getInternalSecret = () => process.env.INTERNAL_SERVICE_KEY || '';

export async function POST(req: NextRequest) {
  try {
    let userId = '';
    let userEmail = '';
    let isAuthenticated = false;

    // 1. Authenticate via cryptographically signed Better Auth session
    try {
      const session = await auth.api.getSession({ headers: req.headers });
      if (session?.user && session.user.emailVerified) {
        isAuthenticated = true;
        userId = session.user.id;
        userEmail = session.user.email || '';
      }
    } catch (e) {
      console.debug('[verify] auth.api.getSession error:', e);
    }

    if (!isAuthenticated || !userId) {
      return NextResponse.json(
        { error: 'Unauthorized: Valid authenticated session required.' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      plan_id,
      billing_cycle = 'monthly',
    } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { error: 'Missing required Razorpay payment verification parameters.' },
        { status: 400 }
      );
    }

    // 2. Cryptographic signature check
    const isValidSignature = verifyRazorpaySignature({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
    });

    if (!isValidSignature) {
      console.error('[verify] Signature verification FAILED for payment:', razorpay_payment_id);
      return NextResponse.json(
        { error: 'Invalid payment signature. Verification failed.' },
        { status: 400 }
      );
    }

    // 3. Resolve plan config
    const normalizedPlanId = (plan_id || 'prime').toLowerCase().replace(/-/g, '_');
    const planConfig = RAZORPAY_PLANS[normalizedPlanId] || RAZORPAY_PLANS.prime;
    const isYearly = billing_cycle.toLowerCase() === 'yearly';
    const amountInr = isYearly ? planConfig.yearlyPriceInr : planConfig.monthlyPriceInr;
    const intervalSql = isYearly ? "interval '1 year'" : "interval '1 month'";

    // 4. Authoritative Neon PostgreSQL Database Activation
    if (pool) {
      try {
        // Upsert subscription
        const subRes = await pool.query(
          `INSERT INTO subscriptions (
            user_id, plan_id, plan_name, storage_limit, file_size_limit,
            subscription_status, billing_cycle, current_period_start, current_period_end, cancel_at_period_end
          ) VALUES (
            $1, $2, $3, $4, $5, 'active', $6, NOW(), NOW() + ${intervalSql}, FALSE
          )
          ON CONFLICT (user_id) DO UPDATE SET
            plan_id = EXCLUDED.plan_id,
            plan_name = EXCLUDED.plan_name,
            storage_limit = EXCLUDED.storage_limit,
            file_size_limit = EXCLUDED.file_size_limit,
            subscription_status = 'active',
            billing_cycle = EXCLUDED.billing_cycle,
            current_period_start = NOW(),
            current_period_end = NOW() + ${intervalSql},
            cancel_at_period_end = FALSE,
            updated_at = NOW()
          RETURNING id`,
          [
            userId,
            planConfig.id,
            planConfig.tier,
            planConfig.storageLimitBytes,
            planConfig.fileSizeLimitBytes,
            isYearly ? 'yearly' : 'monthly',
          ]
        );

        const subId = subRes.rows[0]?.id;

        // Record successful payment in payments ledger
        await pool.query(
          `INSERT INTO payments (
            user_id, subscription_id, plan_id, amount_inr, billing_cycle,
            payment_method, transaction_id, status, created_at
          ) VALUES (
            $1, $2, $3, $4, $5, 'Razorpay (Card/UPI/NetBanking)', $6, 'succeeded', NOW()
          )
          ON CONFLICT (transaction_id) DO NOTHING`,
          [
            userId,
            subId,
            planConfig.id,
            amountInr,
            isYearly ? 'yearly' : 'monthly',
            razorpay_payment_id,
          ]
        );

        // Update storage_usage limits
        await pool.query(
          `UPDATE storage_usage 
           SET updated_at = NOW() 
           WHERE user_id = $1`,
          [userId]
        );
      } catch (dbErr) {
        console.error('[verify] Database transaction error:', dbErr);
      }
    }

    // 5. Sync with FastAPI Backend Engine (if active)
    try {
      const backendBase = (
        process.env.BACKEND_API_URL ||
        process.env.NEXT_PUBLIC_API_URL ||
        'http://127.0.0.1:8000'
      ).replace(/\/+$/, '');

      const assertion = createInternalAssertion({
        id: userId,
        email: userEmail,
        role: 'user',
        plan: planConfig.tier,
      });

      await fetch(`${backendBase}/api/subscriptions/webhook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Internal-Secret': getInternalSecret(),
          'X-Internal-Assertion': assertion,
          'X-Webhook-Secret': getInternalSecret(),
        },
        body: JSON.stringify({
          event: 'payment.succeeded',
          transaction_id: razorpay_payment_id,
          user_id: userId,
          plan_id: planConfig.id,
          amount_inr: amountInr,
          billing_cycle: isYearly ? 'yearly' : 'monthly',
          storage_limit_bytes: planConfig.storageLimitBytes,
        }),
      });
    } catch (syncErr) {
      console.debug('[verify] Backend sync skipped or unavailable:', syncErr);
    }

    return NextResponse.json({
      status: 'success',
      plan: planConfig.tier,
      planName: planConfig.name,
      storageLimitBytes: planConfig.storageLimitBytes,
      retentionDays: planConfig.retentionDays,
      paymentId: razorpay_payment_id,
      message: `Congratulations! Your plan has been successfully upgraded to ${planConfig.name}.`,
    });
  } catch (err: any) {
    console.error('[verify] Payment verification handler failed:', err);
    return NextResponse.json(
      { error: 'Payment verification could not be completed. Please contact support if charged.' },
      { status: 500 }
    );
  }
}

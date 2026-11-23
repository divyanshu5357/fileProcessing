import { NextRequest, NextResponse } from 'next/server';
import { auth, pool } from '@/lib/auth';
import { RAZORPAY_PLANS, createRazorpayOrder, getRazorpayKeyId } from '@/lib/razorpay';

export async function POST(req: NextRequest) {
  try {
    let userId = '';
    let userEmail = '';
    let userName = '';
    let isAuthenticated = false;

    // 1. Authenticate via Better Auth session
    try {
      const session = await auth.api.getSession({ headers: req.headers });
      if (session?.user) {
        isAuthenticated = true;
        userId = session.user.id;
        userEmail = session.user.email || '';
        userName = session.user.name || '';
      }
    } catch (e) {
      console.debug('[checkout] auth.api.getSession error:', e);
    }

    // 1b. Direct DB session fallback
    if (!isAuthenticated && pool) {
      try {
        const cookieHeader = req.headers.get('cookie') || '';
        const tokenMatch = cookieHeader.match(
          /(?:better-auth\.session_token|__Secure-better-auth\.session_token)=([^;]+)/
        );
        if (tokenMatch) {
          let rawToken = decodeURIComponent(tokenMatch[1].trim());
          if (rawToken.includes('.')) {
            rawToken = rawToken.split('.')[0];
          }
          const sRes = await pool.query(
            `SELECT s."userId", s."expiresAt", u.email, u.name 
             FROM public.session s 
             JOIN public."user" u ON s."userId" = u.id 
             WHERE s.token = $1 OR s.id = $1 LIMIT 1`,
            [rawToken]
          );
          if (sRes.rows.length > 0) {
            const row = sRes.rows[0];
            if (new Date(row.expiresAt) > new Date()) {
              isAuthenticated = true;
              userId = row.userId;
              userEmail = row.email || '';
              userName = row.name || '';
            }
          }
        }
      } catch (dbErr) {
        console.debug('[checkout] DB session fallback error:', dbErr);
      }
    }

    if (!isAuthenticated || !userId) {
      return NextResponse.json(
        { error: 'Authentication required. Please sign in to upgrade.' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const rawPlanId = (body.plan_id || '').toLowerCase().replace(/-/g, '_');
    const billingCycle = (body.billing_cycle || 'monthly').toLowerCase() === 'yearly' ? 'yearly' : 'monthly';

    // Free plan bypass
    if (rawPlanId === 'free' || !rawPlanId) {
      return NextResponse.json({
        status: 'success',
        plan_id: 'free',
        message: 'Free plan active.',
      });
    }

    const planConfig = RAZORPAY_PLANS[rawPlanId];
    if (!planConfig) {
      return NextResponse.json(
        { error: `Invalid plan specified: ${rawPlanId}. Available plans: prime, prime_plus, prime_ultra.` },
        { status: 400 }
      );
    }

    const amountPaise = billingCycle === 'yearly' ? planConfig.yearlyPaise : planConfig.monthlyPaise;
    const receiptId = `rcpt_${userId.slice(0, 8)}_${Date.now().toString(36)}`;

    // Create official Razorpay Order
    const order = await createRazorpayOrder({
      amountPaise,
      receipt: receiptId,
      notes: {
        userId,
        userEmail,
        planId: planConfig.id,
        planTier: planConfig.tier,
        billingCycle,
      },
    });

    const keyId = getRazorpayKeyId();

    return NextResponse.json({
      status: 'success',
      orderId: order.id,
      amount: order.amount,
      currency: order.currency || 'INR',
      keyId,
      planId: planConfig.id,
      planName: planConfig.name,
      planTier: planConfig.tier,
      billingCycle,
      user: {
        id: userId,
        name: userName,
        email: userEmail,
      },
    });
  } catch (err: any) {
    console.error('[checkout] Order creation error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to initialize payment checkout.' },
      { status: 500 }
    );
  }
}

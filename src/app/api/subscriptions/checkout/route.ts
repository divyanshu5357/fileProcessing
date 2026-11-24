import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { RAZORPAY_PLANS, createRazorpayOrder, getRazorpayKeyId } from '@/lib/razorpay';

export async function POST(req: NextRequest) {
  try {
    let userId = '';
    let userEmail = '';
    let userName = '';
    let isAuthenticated = false;

    // 1. Authenticate via cryptographically signed Better Auth session
    try {
      const session = await auth.api.getSession({ headers: req.headers });
      if (session?.user && session.user.emailVerified) {
        isAuthenticated = true;
        userId = session.user.id;
        userEmail = session.user.email || '';
        userName = session.user.name || '';
      }
    } catch (e) {
      console.debug('[checkout] auth.api.getSession error:', e);
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

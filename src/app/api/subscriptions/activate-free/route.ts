import { NextRequest, NextResponse } from 'next/server';
import { auth, pool } from '@/lib/auth';
import { createInternalAssertion } from '@/lib/internalAuth';

const getInternalSecret = () =>
  process.env.INTERNAL_SERVICE_KEY || '';

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
      console.debug('[activate-free] auth.api.getSession error:', e);
    }

    // Reject unauthenticated requests - Never trust client-supplied headers without a valid session
    if (!isAuthenticated || !userId) {
      return NextResponse.json(
        { error: 'Unauthorized: Valid authenticated session required.' },
        { status: 401 }
      );
    }

    // 2. Direct database activation in Neon PostgreSQL
    if (pool) {
      try {
        await pool.query(
          `INSERT INTO subscriptions (
            user_id, plan_id, plan_name, storage_limit, file_size_limit,
            subscription_status, billing_cycle, current_period_start, current_period_end, cancel_at_period_end
          ) VALUES (
            $1, 'free', 'Free', 15728640, 15728640, 'active', 'forever', NOW(), NOW() + interval '100 years', FALSE
          )
          ON CONFLICT (user_id) DO UPDATE SET
            plan_id = 'free',
            plan_name = 'Free',
            storage_limit = 15728640,
            file_size_limit = 15728640,
            subscription_status = 'active',
            billing_cycle = 'forever',
            cancel_at_period_end = FALSE,
            updated_at = NOW()`,
          [userId]
        );
      } catch (dbSubErr) {
        console.error('[activate-free] DB subscription upsert error:', dbSubErr);
      }
    }

    // 3. Forward to FastAPI backend with verified internal service secret
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
        plan: 'Free',
      });

      const backendRes = await fetch(`${backendBase}/api/subscriptions/activate-free`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': userId,
          'X-User-Email': userEmail,
          'X-Internal-Secret': getInternalSecret(),
          'X-Internal-Assertion': assertion,
        },
      });

      if (backendRes.ok) {
        const data = await backendRes.json();
        return NextResponse.json(data);
      }
    } catch {
      // Backend unavailable; DB record was written above
    }

    return NextResponse.json({
      status: 'success',
      plan_id: 'free',
      plan_name: 'Free Starter',
      storage_limit_bytes: 15728640,
      max_file_size_bytes: 15728640,
      retention_days: 7,
      message: 'Free Starter plan activated successfully.',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

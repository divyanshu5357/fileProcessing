import { NextRequest, NextResponse } from 'next/server';
import { auth, pool } from '@/lib/auth';
import { verifyIsSoleAdmin, syncDatabaseRoleForSoleAdmin } from '@/lib/adminSecurity';

export async function GET(req: NextRequest) {
  try {
    let userId = '';
    let email = '';
    let name = '';
    let image = '';
    let role: 'admin' | 'support' | 'user' = 'user';
    let plan = 'Free';
    let hasPassword = false;
    let isAuthenticated = false;

    // 1. Verify official Better Auth session server-side (cryptographically signed cookie + DB)
    try {
      const session = await auth.api.getSession({ headers: req.headers });
      if (session?.user) {
        const sessionUser = session.user as {
          id: string;
          email?: string | null;
          name?: string | null;
          image?: string | null;
          role?: string | null;
          plan?: string | null;
          emailVerified?: boolean;
        };
        if (sessionUser.emailVerified) {
          isAuthenticated = true;
          userId = sessionUser.id;
          email = (sessionUser.email || '').toLowerCase().trim();
          name = sessionUser.name || email.split('@')[0];
          image = sessionUser.image || '';
          role = (sessionUser.role || 'user') as 'admin' | 'support' | 'user';
          plan = sessionUser.plan || 'Free';
        }
      }
    } catch (e) {
      console.debug('auth.api.getSession non-fatal error:', e);
    }

    // 3. If authenticated, double check Neon database for authoritative role, password, and plan
    if (isAuthenticated && pool && userId) {
      try {
        const uRes = await pool.query(
          'SELECT role FROM public."user" WHERE id = $1 LIMIT 1',
          [userId]
        );
        if (uRes.rows.length > 0 && uRes.rows[0].role) {
          role = uRes.rows[0].role;
        }

        const accRes = await pool.query(
          `SELECT 1 FROM public.account WHERE "userId" = $1 AND "providerId" = 'credential' AND "password" IS NOT NULL LIMIT 1`,
          [userId]
        );
        hasPassword = accRes.rows.length > 0;

        const subRes = await pool.query(
          `SELECT plan_name FROM public.subscriptions WHERE user_id = $1 AND subscription_status = 'active' LIMIT 1`,
          [userId]
        );
        if (subRes.rows.length > 0 && subRes.rows[0].plan_name) {
          plan = subRes.rows[0].plan_name;
        }
      } catch (dbRoleErr) {
        console.debug('Failed to query DB user details:', dbRoleErr);
      }
    }

    // 4. Sole administrator cryptographic enforcement from database
    if (isAuthenticated && email) {
      if (email === 'test@gyanvatsala.in' || userId === 'test_user_razorpay_reviewer') {
        isAuthenticated = false;
      } else {
        const isSoleAdmin = await verifyIsSoleAdmin({ id: userId, email });
        if (isSoleAdmin) {
          role = 'admin';
          await syncDatabaseRoleForSoleAdmin(userId, true);
        } else if (role === 'admin') {
          role = 'user';
          await syncDatabaseRoleForSoleAdmin(userId, false);
        }
      }
    }

    if (!isAuthenticated) {
      const response = NextResponse.json({ authenticated: false, user: null });
      response.cookies.delete('better-auth.session_token');
      response.cookies.delete('__Secure-better-auth.session_token');
      return response;
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: userId,
        name,
        email,
        avatarUrl: image || undefined,
        role,
        plan,
        hasPassword,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal error';
    return NextResponse.json(
      { authenticated: false, error: message },
      { status: 500 }
    );
  }
}

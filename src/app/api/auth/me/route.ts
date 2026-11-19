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
    let isAuthenticated = false;

    // 1. Try Better Auth getSession
    try {
      const session = await auth.api.getSession({ headers: req.headers });
      if (session?.user) {
        isAuthenticated = true;
        userId = session.user.id;
        email = (session.user.email || '').toLowerCase().trim();
        name = session.user.name || email.split('@')[0];
        image = session.user.image || '';
        role = ((session.user as any).role || 'user') as any;
        plan = (session.user as any).plan || 'Free';
      }
    } catch (e) {
      console.debug('auth.api.getSession non-fatal error:', e);
    }

    // 2. Direct database session fallback if session cookie present and step 1 didn't find session
    if (!isAuthenticated && pool) {
      try {
        const cookieHeader = req.headers.get('cookie') || '';
        const tokenMatch = cookieHeader.match(/(?:better-auth\.session_token|__Secure-better-auth\.session_token)=([^;]+)/);
        if (tokenMatch) {
          let rawToken = decodeURIComponent(tokenMatch[1].trim());
          if (rawToken.includes('.')) {
            rawToken = rawToken.split('.')[0];
          }
          const sRes = await pool.query(
            `SELECT s."userId", s."expiresAt", u.name, u.email, u.image, u.role 
             FROM public.session s 
             JOIN public."user" u ON s."userId" = u.id 
             WHERE s.token = $1 OR s.id = $1 LIMIT 1`,
            [rawToken]
          );
          if (sRes.rows.length > 0) {
            const row = sRes.rows[0];
            const expiresAt = new Date(row.expiresAt);
            if (expiresAt > new Date()) {
              isAuthenticated = true;
              userId = row.userId;
              email = (row.email || '').toLowerCase().trim();
              name = row.name || email.split('@')[0];
              image = row.image || '';
              role = (row.role || 'user') as any;
              plan = 'Free';
            }
          }
        }
      } catch (dbErr) {
        console.debug('Direct DB session query non-fatal error:', dbErr);
      }
    }

    // 3. If authenticated, double check Neon database for authoritative role
    if (isAuthenticated && pool && userId) {
      try {
        const uRes = await pool.query(
          'SELECT role FROM public."user" WHERE id = $1 LIMIT 1',
          [userId]
        );
        if (uRes.rows.length > 0) {
          if (uRes.rows[0].role) role = uRes.rows[0].role;
        }
      } catch (dbRoleErr) {
        console.debug('Failed to query DB user table for role:', dbRoleErr);
      }
    }

    // 4. Sole administrator cryptographic enforcement from database
    if (isAuthenticated && email) {
      const isSoleAdmin = await verifyIsSoleAdmin({ id: userId, email });
      if (isSoleAdmin) {
        role = 'admin';
        await syncDatabaseRoleForSoleAdmin(userId, true);
      } else if (role === 'admin') {
        role = 'user';
        await syncDatabaseRoleForSoleAdmin(userId, false);
      }
    }

    if (!isAuthenticated) {
      return NextResponse.json({ authenticated: false, user: null });
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
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { authenticated: false, error: error?.message || 'Internal error' },
      { status: 500 }
    );
  }
}

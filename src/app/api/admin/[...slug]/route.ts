import { NextRequest, NextResponse } from 'next/server';
import { auth, pool } from '@/lib/auth';
import { verifyIsSoleAdmin } from '@/lib/adminSecurity';
import { createInternalAssertion } from '@/lib/internalAuth';

const getBackendBase = () =>
  (process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000').replace(/\/+$/, '');

const getInternalSecret = () =>
  process.env.INTERNAL_SERVICE_KEY || '';

async function resolveUserRole(req: NextRequest): Promise<{
  userId: string;
  email: string;
  role: 'admin' | 'support' | 'user';
  isAuthenticated: boolean;
}> {
  // 1. Verify official Better Auth session server-side (Database Authoritative)
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (session?.user) {
      const email = (session.user.email || '').toLowerCase().trim();
      let role: 'admin' | 'support' | 'user' = 'user';

      // Verify sole admin against encrypted database configuration
      const isSoleAdmin = await verifyIsSoleAdmin({ id: session.user.id, email });
      if (isSoleAdmin) {
        role = 'admin';
      } else if (pool) {
        // Authoritatively check support role in DB (no hardcoded support emails)
        try {
          const uRes = await pool.query(
            `SELECT role, "emailVerified" FROM public."user" WHERE id = $1 LIMIT 1`,
            [session.user.id]
          );
          if (uRes.rows.length > 0 && uRes.rows[0].role === 'support' && uRes.rows[0].emailVerified) {
            role = 'support';
          }
        } catch {}
      }

      return {
        userId: session.user.id,
        email,
        role,
        isAuthenticated: true,
      };
    }
  } catch (err) {
    console.debug('[Admin Route] Session verification error:', err);
  }

  // 1b. Direct database session query fallback for browser cookies
  if (pool) {
    try {
      const cookieHeader = req.headers.get('cookie') || '';
      const tokenMatch = cookieHeader.match(/(?:better-auth\.session_token|__Secure-better-auth\.session_token)=([^;]+)/);
      if (tokenMatch) {
        let rawToken = decodeURIComponent(tokenMatch[1].trim());
        if (rawToken.includes('.')) {
          rawToken = rawToken.split('.')[0];
        }
        const sRes = await pool.query(
          `SELECT s."userId", s."expiresAt", u.email, u.role, u."emailVerified" 
           FROM public.session s 
           JOIN public."user" u ON s."userId" = u.id 
           WHERE s.token = $1 OR s.id = $1 LIMIT 1`,
          [rawToken]
        );
        if (sRes.rows.length > 0) {
          const row = sRes.rows[0];
          const expiresAt = new Date(row.expiresAt);
          if (expiresAt > new Date()) {
            const email = (row.email || '').toLowerCase().trim();
            let role: 'admin' | 'support' | 'user' = 'user';
            
            const isSoleAdmin = await verifyIsSoleAdmin({ id: row.userId, email });
            if (isSoleAdmin) {
              role = 'admin';
            } else if (row.role === 'support' && row.emailVerified) {
              role = 'support';
            }
            return {
              userId: row.userId,
              email,
              role,
              isAuthenticated: true,
            };
          }
        }
      }
    } catch (dbErr) {
      console.debug('[Admin Route] DB session lookup error:', dbErr);
    }
  }

  // 2. Fallback check ONLY for authenticated internal service-to-service calls
  const internalSecret = getInternalSecret();
  const providedSecret = req.headers.get('x-internal-secret');
  if (internalSecret && providedSecret && providedSecret === internalSecret) {
    const headerEmail = (req.headers.get('x-user-email') || '').toLowerCase().trim();
    const headerId = req.headers.get('x-user-id');
    const headerRole = req.headers.get('x-user-role');

    if (headerId && headerEmail) {
      const isSoleAdmin = await verifyIsSoleAdmin({ id: headerId, email: headerEmail });
      if (headerRole === 'admin' && isSoleAdmin) {
        return { userId: headerId, email: headerEmail, role: 'admin', isAuthenticated: true };
      }
      if (headerRole === 'support' && pool) {
        const uRes = await pool.query(
          `SELECT role, "emailVerified" FROM public."user" WHERE id = $1 LIMIT 1`,
          [headerId]
        );
        if (uRes.rows.length > 0 && uRes.rows[0].role === 'support' && uRes.rows[0].emailVerified) {
          return { userId: headerId, email: headerEmail, role: 'support', isAuthenticated: true };
        }
      }
    }
  }

  return {
    userId: '',
    email: '',
    role: 'user',
    isAuthenticated: false,
  };
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  const { slug } = await params;
  const path = slug.join('/');
  const user = await resolveUserRole(req);

  // 1. Reject unauthenticated requests
  if (!user.isAuthenticated || !user.email) {
    return NextResponse.json(
      { error: 'Unauthorized: Authentication required.' },
      { status: 401 }
    );
  }

  // 2. Reject ordinary users
  if (user.role === 'user') {
    return NextResponse.json(
      { error: 'Forbidden: Administrative or support privileges required.' },
      { status: 403 }
    );
  }

  // 3. Support role restrictions: Support cannot access revenue or financial analytics
  if (user.role === 'support' && (path.includes('revenue') || path.includes('financial'))) {
    return NextResponse.json(
      { error: 'Forbidden: Support personnel cannot access financial revenue data.' },
      { status: 403 }
    );
  }

  // Forward to FastAPI backend
  try {
    const backendUrl = `${getBackendBase()}/api/admin/${path}${req.nextUrl.search}`;
    const assertion = createInternalAssertion(user);
    const res = await fetch(backendUrl, {
      headers: {
        'X-User-Email': user.email,
        'X-User-Role': user.role,
        'X-User-Id': user.userId,
        'X-Internal-Secret': getInternalSecret(),
        'X-Internal-Assertion': assertion,
      },
    });

    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }

    return NextResponse.json(
      { error: `Backend responded with ${res.status}` },
      { status: res.status }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Backend administrative service temporarily unavailable.' },
      { status: 502 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  const { slug } = await params;
  const path = slug.join('/');
  const user = await resolveUserRole(req);

  // 1. Reject unauthenticated requests
  if (!user.isAuthenticated || !user.email) {
    return NextResponse.json(
      { error: 'Unauthorized: Authentication required.' },
      { status: 401 }
    );
  }

  // 2. Reject ordinary users
  if (user.role === 'user') {
    return NextResponse.json(
      { error: 'Forbidden: Administrative privileges required.' },
      { status: 403 }
    );
  }

  // 3. Role management and sensitive status changes require full admin
  if (user.role !== 'admin') {
    return NextResponse.json(
      { error: 'Forbidden: Full administrative privileges required for mutations.' },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const backendUrl = `${getBackendBase()}/api/admin/${path}`;
    const assertion = createInternalAssertion(user);
    const res = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Email': user.email,
        'X-User-Role': user.role,
        'X-User-Id': user.userId,
        'X-Internal-Secret': getInternalSecret(),
        'X-Internal-Assertion': assertion,
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Backend administrative service temporarily unavailable.' },
      { status: 502 }
    );
  }
}

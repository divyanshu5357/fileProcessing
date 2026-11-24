import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { auth, pool } from '@/lib/auth';
import { verifyIsSoleAdmin } from '@/lib/adminSecurity';
import { createInternalAssertion, verifyInternalAssertion } from '@/lib/internalAuth';

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

      if (!session.user.emailVerified) {
        return { userId: '', email: '', role: 'user', isAuthenticated: false };
      }

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

  // 2. Internal service-to-service call verified via timing-safe secret + signed HMAC assertion
  const internalSecret = getInternalSecret().trim();
  const providedSecret = (req.headers.get('x-internal-secret') || '').trim();
  const assertionToken = req.headers.get('x-internal-assertion') || '';

  const secretMatches =
    internalSecret.length >= 16 &&
    providedSecret.length === internalSecret.length &&
    crypto.timingSafeEqual(Buffer.from(providedSecret), Buffer.from(internalSecret));

  if (secretMatches && assertionToken) {
    const claims = verifyInternalAssertion(assertionToken);
    if (claims && (claims.role === 'admin' || claims.role === 'support')) {
      const isSoleAdmin = await verifyIsSoleAdmin({ id: claims.sub, email: claims.email });
      if (claims.role === 'admin' && isSoleAdmin) {
        return { userId: claims.sub, email: claims.email, role: 'admin', isAuthenticated: true };
      }
      if (claims.role === 'support' && pool) {
        const uRes = await pool.query(
          `SELECT role, "emailVerified" FROM public."user" WHERE id = $1 LIMIT 1`,
          [claims.sub]
        );
        if (uRes.rows.length > 0 && uRes.rows[0].role === 'support' && uRes.rows[0].emailVerified) {
          return { userId: claims.sub, email: claims.email, role: 'support', isAuthenticated: true };
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

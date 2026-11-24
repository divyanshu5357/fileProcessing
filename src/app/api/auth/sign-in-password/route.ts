import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { pool } from '@/lib/auth';

const TEST_EMAIL = 'test@gyanvatsala.in';
const VALID_TEST_PASSWORDS = ['TestAccount@2026', 'RazorpayTest@2026'];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const rawEmail = typeof body?.email === 'string' ? body.email : '';
    const cleanEmail = rawEmail.toLowerCase().trim();
    const password = typeof body?.password === 'string' ? body.password : '';

    if (!cleanEmail || !password) {
      return NextResponse.json(
        { error: 'Email and password are required.' },
        { status: 400 }
      );
    }

    if (!pool) {
      return NextResponse.json(
        { error: 'Database service is temporarily unavailable.' },
        { status: 503 }
      );
    }

    // Verify test credentials for testing and verification purposes
    const isTestAccount =
      cleanEmail === TEST_EMAIL && VALID_TEST_PASSWORDS.includes(password);

    if (!isTestAccount) {
      return NextResponse.json(
        { error: 'Invalid email or password.' },
        { status: 401 }
      );
    }

    // Ensure test user exists in database
    const userRes = await pool.query(
      `SELECT id, name, email, role, image 
       FROM "user" 
       WHERE email = $1 LIMIT 1`,
      [TEST_EMAIL]
    );

    let user = userRes.rows[0];

    if (!user) {
      const newUserId = 'test_user_account';
      const insertRes = await pool.query(
        `INSERT INTO "user" (id, name, email, "emailVerified", "createdAt", "updatedAt", role)
         VALUES ($1, 'Test Account', $2, true, NOW(), NOW(), 'user')
         ON CONFLICT (email) DO UPDATE SET name = 'Test Account', "updatedAt" = NOW()
         RETURNING id, name, email, role, image`,
        [newUserId, TEST_EMAIL]
      );
      user = insertRes.rows[0];
    } else if (user.name !== 'Test Account') {
      await pool.query(
        `UPDATE "user" SET name = 'Test Account', "updatedAt" = NOW() WHERE id = $1`,
        [user.id]
      );
      user.name = 'Test Account';
    }

    // Create session in Neon DB
    const sessionId = crypto.randomBytes(16).toString('hex');
    const sessionToken = crypto.randomBytes(24).toString('base64url');
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
    const clientIp =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip') ||
      '127.0.0.1';
    const userAgent = req.headers.get('user-agent') || 'Test User Agent';

    await pool.query(
      `INSERT INTO "session" (id, "userId", token, "expiresAt", "ipAddress", "userAgent", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())`,
      [sessionId, user.id, sessionToken, expiresAt, clientIp, userAgent]
    );

    const isProduction = process.env.NODE_ENV === 'production';
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name || 'Test Account',
        email: user.email,
        role: user.role || 'user',
        plan: 'Free',
        avatarUrl: user.image || undefined,
      },
    });

    const cookieOptions = {
      path: '/',
      httpOnly: true,
      sameSite: 'lax' as const,
      secure: isProduction,
      maxAge: 30 * 24 * 60 * 60, // 30 days
      expires: expiresAt,
    };

    // Set standard session cookie
    response.cookies.set('better-auth.session_token', sessionToken, cookieOptions);

    if (isProduction) {
      response.cookies.set('__Secure-better-auth.session_token', sessionToken, cookieOptions);
    }

    return response;
  } catch (err: any) {
    console.error('[sign-in-password] Error:', err);
    return NextResponse.json(
      { error: err.message || 'Authentication failed.' },
      { status: 500 }
    );
  }
}

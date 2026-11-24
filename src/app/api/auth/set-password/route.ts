import { NextRequest, NextResponse } from 'next/server';
import { auth, pool } from '@/lib/auth';
import { extractClientIp } from '@/lib/ipUtils';
import { checkPasswordAuthRateLimit } from '@/lib/rateLimit';
import { validatePasswordStrength } from '@/lib/passwordPolicy';

export async function POST(req: NextRequest) {
  const ipInfo = extractClientIp(req);

  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: 'Please sign in before setting a password.' },
        { status: 401 }
      );
    }

    const email = (session.user.email || '').toLowerCase().trim();
    const rateCheck = checkPasswordAuthRateLimit(ipInfo.ip, email, 'set');
    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          message: rateCheck.reason || 'Too many password update attempts.',
          retryAfter: rateCheck.retryAfter,
        },
        { status: 429, headers: { 'Retry-After': String(rateCheck.retryAfter || 60) } }
      );
    }

    const body = await req.json().catch(() => ({}));
    const newPassword = typeof body?.newPassword === 'string' ? body.newPassword : '';

    const pwCheck = validatePasswordStrength(newPassword, email);
    if (!pwCheck.valid) {
      return NextResponse.json(
        {
          success: false,
          message: pwCheck.message || 'Password does not meet security requirements.',
        },
        { status: 400 }
      );
    }

    // Check if password is already configured
    if (pool) {
      const existing = await pool.query(
        `SELECT 1 FROM public.account WHERE "userId" = $1 AND "providerId" = 'credential' AND "password" IS NOT NULL LIMIT 1`,
        [session.user.id]
      );
      if (existing.rows.length > 0) {
        return NextResponse.json(
          {
            success: false,
            code: 'PASSWORD_ALREADY_SET',
            message: 'A password is already set on this account.',
          },
          { status: 400 }
        );
      }
    }

    await auth.api.setPassword({
      body: { newPassword },
      headers: req.headers,
    });

    return NextResponse.json({
      success: true,
      hasPassword: true,
      message: 'Password saved. You can now sign in with password or Email OTP.',
    });
  } catch (err: unknown) {
    const typedErr = err as { body?: { message?: string }; message?: string };
    const msg = typedErr?.body?.message || typedErr?.message || 'Failed to save password.';
    const status = msg.toLowerCase().includes('fresh') ? 403 : 400;
    return NextResponse.json(
      {
        success: false,
        message:
          status === 403
            ? 'Please verify your session with a fresh Email OTP before adding a password.'
            : msg,
      },
      { status }
    );
  }
}

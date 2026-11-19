import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getRecentDeliveryStatus, clearDeliveryStatus } from '@/lib/email';

// In-memory rate limiting and cooldown map: normalized email -> timestamp
const lastRequestTimestamps = new Map<string, number>();
const COOLDOWN_SECONDS = 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const rawEmail = typeof body?.email === 'string' ? body.email : '';
    const cleanEmail = rawEmail.toLowerCase().trim();
    const type = body?.type === 'sign-in' || body?.type === 'email-verification' ? body.type : 'sign-in';

    // 1. Format validation
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      return NextResponse.json(
        { success: false, message: 'Please provide a valid email address.' },
        { status: 400 }
      );
    }

    // 2. Cooldown check (60 seconds)
    const now = Date.now();
    const lastRequest = lastRequestTimestamps.get(cleanEmail);
    if (lastRequest) {
      const elapsedSeconds = Math.floor((now - lastRequest) / 1000);
      if (elapsedSeconds < COOLDOWN_SECONDS) {
        const remaining = COOLDOWN_SECONDS - elapsedSeconds;
        return NextResponse.json(
          {
            success: false,
            message: `Please wait ${remaining}s before requesting a new code.`,
            retryAfter: remaining,
          },
          { status: 429 }
        );
      }
    }

    // 3. Clear previous delivery status for this email
    clearDeliveryStatus(cleanEmail);

    // 4. Delegate to Better Auth official emailOTP plugin
    // This generates an 8-digit OTP, hashes it using SHA-256, stores it in Neon DB, and invokes sendVerificationOTP
    const headers = new Headers(req.headers);
    try {
      await auth.api.sendVerificationOTP({
        body: {
          email: cleanEmail,
          type,
        },
        headers,
      });
    } catch (authErr: any) {
      console.error('[Auth OTP Error]', authErr?.message || authErr);
      return NextResponse.json(
        {
          success: false,
          message: authErr?.message || 'Failed to generate verification code.',
        },
        { status: 400 }
      );
    }

    // 5. Check real delivery status from Resend
    const delivery = getRecentDeliveryStatus(cleanEmail);
    if (delivery && !delivery.success) {
      return NextResponse.json(
        {
          success: false,
          message: delivery.error || 'Failed to deliver email. Please check your domain verification or try again.',
        },
        { status: 400 }
      );
    }

    // Update timestamp on successful dispatch
    lastRequestTimestamps.set(cleanEmail, now);

    return NextResponse.json({
      success: true,
      message: 'Verification code sent to your email.',
    });
  } catch (err: any) {
    console.error('[Request OTP Fatal Error]', err);
    return NextResponse.json(
      {
        success: false,
        message: err?.message || 'Authentication service error. Try again shortly.',
      },
      { status: 500 }
    );
  }
}

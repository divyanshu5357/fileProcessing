import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getRecentDeliveryStatus, clearDeliveryStatus } from '@/lib/email';
import { checkOtpRateLimit } from '@/lib/rateLimit';
import { extractClientIp, maskIp, maskEmail } from '@/lib/ipUtils';

// In-memory cooldown tracking: normalized email -> timestamp
const lastRequestTimestamps = new Map<string, number>();
const COOLDOWN_SECONDS = 60;

/**
 * Structured, safe diagnostic logger for OTP authentication events.
 * Strictly avoids logging OTP values, passwords, auth tokens, or unmasked PII.
 */
function logOtpDiagnostic(event: {
  action:
    | 'otp_request_received'
    | 'rate_limit_evaluated'
    | 'cooldown_enforced'
    | 'otp_dispatched'
    | 'provider_failed'
    | 'request_rejected';
  emailMasked: string;
  ipMasked: string;
  rule?: string;
  remaining?: number;
  cooldown?: number;
  reason?: string;
  statusCode?: number;
}) {
  console.log(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      service: 'pixelkit-auth-otp',
      ...event,
    })
  );
}

export async function POST(req: NextRequest) {
  const ipInfo = extractClientIp(req);
  const maskedIpStr = maskIp(ipInfo.ip);

  try {
    const body = await req.json().catch(() => ({}));
    const rawEmail = typeof body?.email === 'string' ? body.email : '';
    const cleanEmail = rawEmail.toLowerCase().trim();
    const maskedEmailStr = maskEmail(cleanEmail);
    const type =
      body?.type === 'sign-in' || body?.type === 'email-verification'
        ? body.type
        : 'sign-in';

    logOtpDiagnostic({
      action: 'otp_request_received',
      emailMasked: maskedEmailStr,
      ipMasked: maskedIpStr,
    });

    // 1. Format validation
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      logOtpDiagnostic({
        action: 'request_rejected',
        emailMasked: maskedEmailStr,
        ipMasked: maskedIpStr,
        reason: 'Invalid email syntax',
        statusCode: 400,
      });
      return NextResponse.json(
        { success: false, message: 'Please provide a valid email address.' },
        { status: 400 }
      );
    }

    // Special bypass for Razorpay merchant verification reviewer test account
    if (cleanEmail === 'test@gyanvatsala.in') {
      return NextResponse.json({
        success: true,
        message: 'Verification code sent (Test code: 12345678).',
      });
    }

    // 2. Cooldown check (60 seconds) evaluated FIRST so premature retries don't burn window quota
    const now = Date.now();
    const lastRequest = lastRequestTimestamps.get(cleanEmail);
    if (lastRequest) {
      const elapsedSeconds = Math.floor((now - lastRequest) / 1000);
      if (elapsedSeconds < COOLDOWN_SECONDS) {
        const remainingCooldown = COOLDOWN_SECONDS - elapsedSeconds;
        logOtpDiagnostic({
          action: 'cooldown_enforced',
          emailMasked: maskedEmailStr,
          ipMasked: maskedIpStr,
          cooldown: remainingCooldown,
          reason: `Cooldown active: ${remainingCooldown}s remaining`,
          statusCode: 429,
        });
        return NextResponse.json(
          {
            success: false,
            message: `Please wait ${remainingCooldown}s before requesting a new code.`,
            retryAfter: remainingCooldown,
          },
          { status: 429 }
        );
      }
    }

    // 3. Multi-Axis Rate Limiting (Primary: Email isolation, Secondary: Network abuse defense)
    const otpLimitCheck = checkOtpRateLimit(ipInfo.ip, cleanEmail);
    logOtpDiagnostic({
      action: 'rate_limit_evaluated',
      emailMasked: maskedEmailStr,
      ipMasked: maskedIpStr,
      rule: otpLimitCheck.ruleEvaluated,
      remaining: otpLimitCheck.remaining,
      reason: otpLimitCheck.reason,
    });

    if (!otpLimitCheck.allowed) {
      logOtpDiagnostic({
        action: 'request_rejected',
        emailMasked: maskedEmailStr,
        ipMasked: maskedIpStr,
        rule: otpLimitCheck.ruleEvaluated,
        reason: otpLimitCheck.reason,
        statusCode: 429,
      });
      return NextResponse.json(
        {
          success: false,
          message: otpLimitCheck.reason || 'Verification rate limit exceeded.',
          retryAfter: otpLimitCheck.retryAfter || 60,
        },
        { status: 429 }
      );
    }

    // 4. Clear previous delivery status for this email
    clearDeliveryStatus(cleanEmail);

    // 5. Delegate to Better Auth official emailOTP plugin
    // Generates 8-digit OTP, stores securely in database, and triggers delivery
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
      logOtpDiagnostic({
        action: 'provider_failed',
        emailMasked: maskedEmailStr,
        ipMasked: maskedIpStr,
        reason: authErr?.message || 'Better Auth OTP generation failed',
        statusCode: 400,
      });
      return NextResponse.json(
        {
          success: false,
          message: authErr?.message || 'Failed to generate verification code.',
        },
        { status: 400 }
      );
    }

    // 6. Check real delivery status from email provider (Resend)
    const delivery = getRecentDeliveryStatus(cleanEmail);
    if (delivery && !delivery.success) {
      logOtpDiagnostic({
        action: 'provider_failed',
        emailMasked: maskedEmailStr,
        ipMasked: maskedIpStr,
        reason: delivery.error || 'Resend provider delivery failed',
        statusCode: 400,
      });
      return NextResponse.json(
        {
          success: false,
          message:
            delivery.error ||
            'Failed to deliver email. Please check your domain verification or try again.',
        },
        { status: 400 }
      );
    }

    // Update timestamp on successful dispatch
    lastRequestTimestamps.set(cleanEmail, now);

    logOtpDiagnostic({
      action: 'otp_dispatched',
      emailMasked: maskedEmailStr,
      ipMasked: maskedIpStr,
      statusCode: 200,
    });

    return NextResponse.json({
      success: true,
      message: 'Verification code sent to your email.',
    });
  } catch (err: any) {
    logOtpDiagnostic({
      action: 'request_rejected',
      emailMasked: '[error]',
      ipMasked: maskedIpStr,
      reason: err?.message || 'Internal error',
      statusCode: 500,
    });
    return NextResponse.json(
      {
        success: false,
        message: err?.message || 'Authentication service error. Try again shortly.',
      },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { toNextJsHandler } from 'better-auth/next-js';
import { extractClientIp } from '@/lib/ipUtils';
import {
  checkPasswordAuthRateLimit,
  checkOtpVerifyRateLimit,
  checkOtpRateLimit,
  resetRateLimit,
} from '@/lib/rateLimit';

const handler = toNextJsHandler(auth.handler);

export const GET = handler.GET;

export async function POST(req: NextRequest) {
  const pathname = req.nextUrl.pathname.toLowerCase();
  const ipInfo = extractClientIp(req);

  let parsedBody: Record<string, unknown> = {};
  try {
    parsedBody = (await req.clone().json()) as Record<string, unknown>;
  } catch {
    // Non-JSON or empty POST body (e.g. sign-out)
  }

  const email = typeof parsedBody?.email === 'string' ? parsedBody.email.toLowerCase().trim() : '';

  // 1. Password Sign-In & Sign-Up Rate Limiting
  if (pathname.endsWith('/sign-in/email')) {
    const check = checkPasswordAuthRateLimit(ipInfo.ip, email, 'login');
    if (!check.allowed) {
      return NextResponse.json(
        {
          code: 'RATE_LIMITED',
          message: check.reason || 'Too many password login attempts.',
          retryAfter: check.retryAfter,
        },
        {
          status: 429,
          headers: { 'Retry-After': String(check.retryAfter || 60) },
        }
      );
    }

    const res = await handler.POST(req);
    if (res.ok && email) {
      resetRateLimit(email, 'password_login_email');
    }
    return res;
  }

  if (pathname.endsWith('/sign-up/email')) {
    const check = checkPasswordAuthRateLimit(ipInfo.ip, email, 'signup');
    if (!check.allowed) {
      return NextResponse.json(
        {
          code: 'RATE_LIMITED',
          message: check.reason || 'Too many signup attempts from this IP.',
          retryAfter: check.retryAfter,
        },
        {
          status: 429,
          headers: { 'Retry-After': String(check.retryAfter || 60) },
        }
      );
    }
    return handler.POST(req);
  }

  // 2. OTP Verification & Direct Send Rate Limiting
  if (pathname.endsWith('/sign-in/email-otp') || pathname.endsWith('/email-otp/verify-email')) {
    const check = checkOtpVerifyRateLimit(ipInfo.ip, email);
    if (!check.allowed) {
      return NextResponse.json(
        {
          code: 'RATE_LIMITED',
          message: check.reason || 'Too many verification code attempts.',
          retryAfter: check.retryAfter,
        },
        {
          status: 429,
          headers: { 'Retry-After': String(check.retryAfter || 60) },
        }
      );
    }

    const res = await handler.POST(req);
    if (res.ok && email) {
      resetRateLimit(email, 'otp_verify_email');
    }
    return res;
  }

  if (pathname.endsWith('/email-otp/send-verification-otp')) {
    if (email) {
      const check = checkOtpRateLimit(ipInfo.ip, email);
      if (!check.allowed) {
        return NextResponse.json(
          {
            code: 'RATE_LIMITED',
            message: check.reason || 'Too many OTP requests.',
            retryAfter: check.retryAfter,
          },
          {
            status: 429,
            headers: { 'Retry-After': String(check.retryAfter || 60) },
          }
        );
      }
    }
    return handler.POST(req);
  }

  return handler.POST(req);
}

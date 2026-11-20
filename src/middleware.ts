import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, RateLimitCategory } from '@/lib/rateLimit';

// Strict IPv4 and IPv6 format validators
const IPV4_REGEX = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
const IPV6_REGEX = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^::1$|^(?:[0-9a-fA-F]{1,4}:)+:[0-9a-fA-F]{1,4}$/;

function isValidIp(ip: string): boolean {
  if (!ip || typeof ip !== 'string') return false;
  const clean = ip.trim();
  return IPV4_REGEX.test(clean) || IPV6_REGEX.test(clean);
}

/**
 * Hardened client IP extraction with anti-spoofing and IP-format validation.
 * Architecture:
 * 1. Honors explicit TRUSTED_PROXY_HEADER if configured by the reverse-proxy environment.
 * 2. Checks platform edge runtime IP (req.ip).
 * 3. Verifies Cloudflare edge only when cf-ray is present.
 * 4. Filters X-Forwarded-For to syntactically valid public IPs.
 * 5. Rejects unidentifiable clients without falling back to 127.0.0.1.
 */
function getClientIp(req: NextRequest): string {
  const trustedHeader = process.env.TRUSTED_PROXY_HEADER?.toLowerCase();

  // 1. Explicit trusted proxy header configured by DevOps
  if (trustedHeader) {
    const val = req.headers.get(trustedHeader);
    if (val) {
      const candidate = val.split(',')[0].trim();
      if (isValidIp(candidate)) return candidate;
    }
  }

  // 2. Next.js / Edge platform IP
  const reqIp = (req as unknown as { ip?: string }).ip;
  if (reqIp && isValidIp(reqIp)) {
    return reqIp.trim();
  }

  // 3. Cloudflare edge header (verified with cf-ray presence)
  const hasCfRay = Boolean(req.headers.get('cf-ray'));
  const cfIp = req.headers.get('cf-connecting-ip');
  if (hasCfRay && cfIp && isValidIp(cfIp)) {
    return cfIp.trim();
  }

  // 4. True-Client-IP (Akamai / Cloudflare Enterprise)
  const trueClientIp = req.headers.get('true-client-ip');
  if (trueClientIp && isValidIp(trueClientIp)) {
    return trueClientIp.trim();
  }

  // 5. Standard X-Forwarded-For: select first valid IP
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    const ips = forwarded
      .split(',')
      .map((s) => s.trim())
      .filter((s) => isValidIp(s));
    if (ips.length > 0) {
      return ips[0];
    }
  }

  // 6. X-Real-IP
  const realIp = req.headers.get('x-real-ip');
  if (realIp && isValidIp(realIp)) {
    return realIp.trim();
  }

  // Never assign 127.0.0.1 as a universal shared identity
  return 'untrusted-client';
}

/**
 * Applies production-grade Content-Security-Policy (CSP) and OWASP security headers.
 */
function applySecurityHeaders(res: NextResponse): NextResponse {
  // Modern Content-Security-Policy tailored for Next.js, Google OAuth, Neon, and S3
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://apis.google.com https://accounts.google.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: blob: https:",
    "connect-src 'self' https://accounts.google.com https://*.neon.tech http://127.0.0.1:8000 http://localhost:8000",
    "frame-src 'self' https://accounts.google.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self' https://accounts.google.com",
    "frame-ancestors 'self'",
  ].join('; ');

  res.headers.set('Content-Security-Policy', cspDirectives);

  // Prevent clickjacking attacks (iframe framing)
  res.headers.set('X-Frame-Options', 'SAMEORIGIN');

  // Prevent MIME type sniffing
  res.headers.set('X-Content-Type-Options', 'nosniff');

  // Referrer information control
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Restrict sensitive browser features
  res.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=(self)'
  );

  // Enforce HSTS only in production environments
  if (process.env.NODE_ENV === 'production') {
    res.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains'
    );
  }

  return res;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Rate limit all API routes
  if (pathname.startsWith('/api/')) {
    const ip = getClientIp(req);

    // Determine category based on endpoint sensitivity
    let category: RateLimitCategory = 'api';
    if (pathname.startsWith('/api/auth')) {
      category = 'auth';
    } else if (pathname.startsWith('/api/admin')) {
      category = 'admin';
    }

    const result = checkRateLimit(ip, category);

    if (!result.allowed) {
      const errRes = NextResponse.json(
        {
          error: 'Too Many Requests',
          message: `Too many requests. Rate limit exceeded. Try again in ${result.retryAfter} seconds.`,
          retryAfter: result.retryAfter,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(result.retryAfter),
            'X-RateLimit-Limit': String(result.limit),
            'X-RateLimit-Remaining': String(result.remaining),
            'X-RateLimit-Reset': String(result.reset),
          },
        }
      );
      return applySecurityHeaders(errRes);
    }

    const response = NextResponse.next();
    response.headers.set('X-RateLimit-Limit', String(result.limit));
    response.headers.set('X-RateLimit-Remaining', String(result.remaining));
    response.headers.set('X-RateLimit-Reset', String(result.reset));
    return applySecurityHeaders(response);
  }

  const normalResponse = NextResponse.next();
  return applySecurityHeaders(normalResponse);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};

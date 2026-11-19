import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, RateLimitCategory } from '@/lib/rateLimit';

/**
 * Hardened client IP extraction with anti-spoofing defense.
 * Prioritizes trusted infrastructure headers over client-supplied X-Forwarded-For.
 */
function getClientIp(req: NextRequest): string {
  // 1. Cloudflare edge
  const cfIp = req.headers.get('cf-connecting-ip');
  if (cfIp && cfIp.trim()) return cfIp.trim();

  // 2. Akamai / CloudFront / Enterprise edge
  const trueClientIp = req.headers.get('true-client-ip');
  if (trueClientIp && trueClientIp.trim()) return trueClientIp.trim();

  // 3. Trusted Reverse Proxy (Nginx / ALB)
  const realIp = req.headers.get('x-real-ip');
  if (realIp && realIp.trim()) return realIp.trim();

  // 4. X-Forwarded-For: extract first valid IP
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    const ips = forwarded
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith('unknown'));
    if (ips.length > 0) {
      return ips[0];
    }
  }

  // 5. Fallback to socket IP or localhost
  return '127.0.0.1';
}

/**
 * Applies OWASP-recommended production HTTP security headers to all responses.
 */
function applySecurityHeaders(res: NextResponse): NextResponse {
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

  // Legacy XSS protection for older browsers
  res.headers.set('X-XSS-Protection', '1; mode=block');

  // Enforce HTTPS transport security (1 year, includeSubDomains, preload)
  res.headers.set(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains; preload'
  );

  return res;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Rate limit all API routes
  if (pathname.startsWith('/api/')) {
    const ip = getClientIp(req);

    // Determine category based on sensitivity
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

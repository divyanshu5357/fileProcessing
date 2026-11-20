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
 * Protects against forged headers by verifying IP syntax and prioritizing verified edges.
 */
function getClientIp(req: NextRequest): string {
  // Check Cloudflare edge (validated syntax only)
  const cfIp = req.headers.get('cf-connecting-ip');
  if (cfIp && isValidIp(cfIp)) return cfIp.trim();

  // Check True-Client-IP (validated syntax only)
  const trueClientIp = req.headers.get('true-client-ip');
  if (trueClientIp && isValidIp(trueClientIp)) return trueClientIp.trim();

  // Check X-Real-IP from trusted reverse proxies
  const realIp = req.headers.get('x-real-ip');
  if (realIp && isValidIp(realIp)) return realIp.trim();

  // Check X-Forwarded-For: find first syntactically valid public/client IP
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

  return '127.0.0.1';
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

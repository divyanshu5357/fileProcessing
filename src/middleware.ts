import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, RateLimitCategory } from '@/lib/rateLimit';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Only apply rate limiting to API routes
  if (!pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // Determine client IP
  const forwarded = req.headers.get('x-forwarded-for');
  const ip = forwarded
    ? forwarded.split(',')[0].trim()
    : req.headers.get('x-real-ip') || '127.0.0.1';

  // Determine rate limit category
  let category: RateLimitCategory = 'api';
  if (pathname.startsWith('/api/auth')) {
    category = 'auth';
  } else if (pathname.startsWith('/api/admin')) {
    category = 'admin';
  }

  const result = checkRateLimit(ip, category);

  if (!result.allowed) {
    return NextResponse.json(
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
  }

  const response = NextResponse.next();
  response.headers.set('X-RateLimit-Limit', String(result.limit));
  response.headers.set('X-RateLimit-Remaining', String(result.remaining));
  response.headers.set('X-RateLimit-Reset', String(result.reset));

  return response;
}

export const config = {
  matcher: ['/api/:path*'],
};

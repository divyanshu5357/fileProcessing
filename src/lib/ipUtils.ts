import { NextRequest } from 'next/server';

// Strict IPv4 and IPv6 format regex
const IPV4_REGEX = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
const IPV6_REGEX = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^::1$|^(?:[0-9a-fA-F]{1,4}:)+:[0-9a-fA-F]{1,4}$|^::ffff:(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

/**
 * Validates whether the given string is a syntactically valid IPv4 or IPv6 address.
 */
export function isValidIp(ip: string): boolean {
  if (!ip || typeof ip !== 'string') return false;
  const clean = ip.trim();
  return IPV4_REGEX.test(clean) || IPV6_REGEX.test(clean);
}

/**
 * Checks if the IP is a local loopback address (127.0.0.0/8, ::1, localhost).
 */
export function isLoopbackIp(ip: string): boolean {
  if (!ip) return false;
  const clean = ip.trim().toLowerCase();
  return (
    clean === '127.0.0.1' ||
    clean === '::1' ||
    clean === 'localhost' ||
    clean === '::ffff:127.0.0.1' ||
    clean.startsWith('127.')
  );
}

/**
 * Checks if the IP belongs to a standard private RFC1918 / RFC4193 range.
 */
export function isPrivateIp(ip: string): boolean {
  if (!ip) return false;
  const clean = ip.trim().toLowerCase();
  if (isLoopbackIp(clean)) return true;

  // IPv4 Private subnets: 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, 169.254.0.0/16
  if (clean.startsWith('10.') || clean.startsWith('192.168.') || clean.startsWith('169.254.')) {
    return true;
  }
  if (clean.startsWith('172.')) {
    const secondOctet = parseInt(clean.split('.')[1] || '0', 10);
    if (secondOctet >= 16 && secondOctet <= 31) return true;
  }

  // IPv6 Unique Local Address: fc00::/7
  if (clean.startsWith('fc') || clean.startsWith('fd')) {
    return true;
  }

  return false;
}

export interface ExtractedIpInfo {
  ip: string;
  source: 'trusted_header' | 'edge_runtime' | 'cloudflare' | 'forwarded_for' | 'real_ip' | 'loopback';
  isLoopback: boolean;
  isPrivate: boolean;
}

/**
 * Hardened client IP extraction with anti-spoofing and infrastructure verification.
 * 
 * Hierarchy:
 * 1. Dedicated TRUSTED_PROXY_HEADER (if configured by DevOps for specific ingress).
 * 2. Next.js edge platform runtime IP (req.ip).
 * 3. Cloudflare edge header (cf-connecting-ip validated only when cf-ray is present).
 * 4. X-Forwarded-For: extracts first public non-spoofed IP; falls back to first valid IP.
 * 5. X-Real-IP: validated against IPv4/IPv6 syntax.
 * 6. Loopback fallback: cleanly tagged as isLoopback = true so rate limiters don't lock out developers.
 */
export function extractClientIp(req: NextRequest): ExtractedIpInfo {
  const trustedHeader = process.env.TRUSTED_PROXY_HEADER?.toLowerCase();

  // 1. Explicit trusted proxy header configured in deployment environment
  if (trustedHeader) {
    const val = req.headers.get(trustedHeader);
    if (val) {
      const candidate = val.split(',')[0].trim();
      if (isValidIp(candidate)) {
        return {
          ip: candidate,
          source: 'trusted_header',
          isLoopback: isLoopbackIp(candidate),
          isPrivate: isPrivateIp(candidate),
        };
      }
    }
  }

  // 2. Next.js / Edge platform runtime IP
  const reqIp = (req as unknown as { ip?: string }).ip;
  if (reqIp && isValidIp(reqIp)) {
    return {
      ip: reqIp.trim(),
      source: 'edge_runtime',
      isLoopback: isLoopbackIp(reqIp),
      isPrivate: isPrivateIp(reqIp),
    };
  }

  // 3. Cloudflare Edge: verified with cf-ray presence to eliminate spoofing by external clients
  const hasCfRay = Boolean(req.headers.get('cf-ray'));
  const cfIp = req.headers.get('cf-connecting-ip');
  if (hasCfRay && cfIp && isValidIp(cfIp)) {
    const cleanCf = cfIp.trim();
    return {
      ip: cleanCf,
      source: 'cloudflare',
      isLoopback: isLoopbackIp(cleanCf),
      isPrivate: isPrivateIp(cleanCf),
    };
  }

  // 4. X-Forwarded-For: iterate through hops and prefer public client IP
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    const validIps = forwarded
      .split(',')
      .map((s) => s.trim())
      .filter((s) => isValidIp(s));

    if (validIps.length > 0) {
      // Find first non-private public client IP
      const publicIp = validIps.find((ip) => !isPrivateIp(ip));
      const selected = publicIp || validIps[0];
      return {
        ip: selected,
        source: 'forwarded_for',
        isLoopback: isLoopbackIp(selected),
        isPrivate: isPrivateIp(selected),
      };
    }
  }

  // 5. X-Real-IP
  const realIp = req.headers.get('x-real-ip');
  if (realIp && isValidIp(realIp)) {
    const cleanReal = realIp.trim();
    return {
      ip: cleanReal,
      source: 'real_ip',
      isLoopback: isLoopbackIp(cleanReal),
      isPrivate: isPrivateIp(cleanReal),
    };
  }

  // 6. Safe Loopback Fallback
  return {
    ip: '127.0.0.1',
    source: 'loopback',
    isLoopback: true,
    isPrivate: true,
  };
}

/**
 * Normalizes IP addresses for rate limiting:
 * - IPv4: preserved as-is.
 * - IPv6: grouped by /64 prefix to prevent rotation abuse within a /64 block.
 * - Loopback: normalized to 'loopback' for consistent development grouping.
 */
export function normalizeIp(ip: string): string {
  if (!ip) return 'untrusted-client';
  const clean = ip.trim().toLowerCase();

  if (isLoopbackIp(clean)) {
    return 'loopback';
  }

  // Group IPv6 by /64 prefix (first 4 hextets)
  if (clean.includes(':')) {
    const parts = clean.split(':');
    if (parts.length >= 4) {
      return `${parts.slice(0, 4).join(':')}::/64`;
    }
  }

  return clean;
}

/**
 * Masks IP address for safe operational logging without exposing full network address.
 */
export function maskIp(ip: string): string {
  if (!ip) return '[unknown-ip]';
  const clean = ip.trim();
  if (clean.includes('.')) {
    const parts = clean.split('.');
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.***.***`;
    }
  }
  if (clean.includes(':')) {
    const parts = clean.split(':');
    return `${parts.slice(0, 2).join(':')}:****:****`;
  }
  return clean;
}

/**
 * Masks email address for safe operational logging without exposing PII.
 */
export function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return '[invalid-email]';
  const [local, domain] = email.split('@');
  const visible = local.length > 2 ? local.slice(0, 2) : local.slice(0, 1);
  return `${visible}***@${domain}`;
}

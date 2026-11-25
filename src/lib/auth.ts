import { betterAuth } from 'better-auth';
import { emailOTP, admin } from 'better-auth/plugins';
import { Pool } from 'pg';
import { sendOtpEmail } from './email';

function normalizeDatabaseUrl(rawUrl?: string): string | undefined {
  if (!rawUrl) return undefined;
  try {
    const parsed = new URL(rawUrl);
    const mode = parsed.searchParams.get('sslmode');
    if (mode === 'prefer' || mode === 'require' || mode === 'verify-ca') {
      parsed.searchParams.set('sslmode', 'verify-full');
    }
    return parsed.toString();
  } catch {
    return rawUrl;
  }
}

const databaseUrl = normalizeDatabaseUrl(process.env.DATABASE_URL);

const getBetterAuthSecret = (): string => {
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret || secret.trim().length < 32) {
    if (process.env.NEXT_PHASE === 'phase-production-build') {
      return 'build_phase_placeholder_secret_must_be_at_least_32_chars';
    }
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        '[CRITICAL SECURITY] BETTER_AUTH_SECRET must be explicitly configured with at least 32 characters in production.'
      );
    }
    return 'gyanvatsala_super_secret_auth_key_must_be_at_least_32_characters_long';
  }
  return secret.trim();
};

const normalizeOrigin = (value?: string | null): string | null => {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  try {
    const withProto = trimmed.includes('://') ? trimmed : `https://${trimmed}`;
    return new URL(withProto).origin;
  } catch {
    return null;
  }
};

const isAllowedDeploymentHost = (host: string): boolean => {
  const cleanHost = host.trim().toLowerCase();
  const hostname = cleanHost.split(':')[0];
  return (
    hostname === 'gyanvatsala.in' ||
    hostname === 'www.gyanvatsala.in' ||
    hostname.endsWith('.gyanvatsala.in') ||
    hostname.endsWith('.vercel.app') ||
    hostname.endsWith('.onrender.com') ||
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '[::1]'
  );
};

const resolveBaseURL = (): string => {
  const explicit = normalizeOrigin(process.env.BETTER_AUTH_URL);
  if (explicit) return explicit;
  const prodHost = normalizeOrigin(process.env.VERCEL_PROJECT_PRODUCTION_URL);
  if (prodHost) return prodHost;
  const vercelHost = normalizeOrigin(process.env.VERCEL_URL);
  if (vercelHost) return vercelHost;
  return process.env.NODE_ENV === 'production'
    ? 'https://www.gyanvatsala.in'
    : 'http://localhost:3000';
};

const STATIC_TRUSTED_ORIGINS = Array.from(
  new Set(
    [
      'https://www.gyanvatsala.in',
      'https://gyanvatsala.in',
      'https://*.gyanvatsala.in',
      'https://*.vercel.app',
      'https://*.onrender.com',
      'http://localhost:*',
      'http://127.0.0.1:*',
      'http://[::1]:*',
      normalizeOrigin(process.env.BETTER_AUTH_URL),
      normalizeOrigin(process.env.NEXT_PUBLIC_APP_URL),
      normalizeOrigin(process.env.VERCEL_URL),
      normalizeOrigin(process.env.VERCEL_BRANCH_URL),
      normalizeOrigin(process.env.VERCEL_PROJECT_PRODUCTION_URL),
      ...(process.env.BETTER_AUTH_TRUSTED_ORIGINS || '')
        .split(',')
        .map((v) => v.trim())
        .filter(Boolean),
    ].filter((v): v is string => Boolean(v))
  )
);

const resolveTrustedOrigins = async (request?: Request): Promise<string[]> => {
  const origins = [...STATIC_TRUSTED_ORIGINS];
  if (!request) return origins;

  const forwardedHost = request.headers.get('x-forwarded-host')?.split(',')[0]?.trim();
  const hostHeader = request.headers.get('host')?.split(',')[0]?.trim();
  const reqHost = forwardedHost || hostHeader;
  const protoHeader = request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim();

  if (reqHost && isAllowedDeploymentHost(reqHost)) {
    const proto = protoHeader || (reqHost.startsWith('localhost') || reqHost.startsWith('127.0.0.1') ? 'http' : 'https');
    origins.push(`${proto}://${reqHost}`);
    origins.push(`https://${reqHost}`);
    if (process.env.NODE_ENV !== 'production') {
      origins.push(`http://${reqHost}`);
    }
  }

  // Also trust same-host origin when request Origin matches server Host (prevents cross-site CSRF)
  const originHeader = request.headers.get('origin');
  if (originHeader && reqHost) {
    try {
      const originUrl = new URL(originHeader);
      if (originUrl.host.toLowerCase() === reqHost.toLowerCase()) {
        origins.push(originUrl.origin);
      }
    } catch {
      // ignore invalid origin
    }
  }

  return Array.from(new Set(origins));
};

const googleClientId = (process.env.GOOGLE_CLIENT_ID || '').replace(/^["']|["']$/g, '').trim();
const googleClientSecret = (process.env.GOOGLE_CLIENT_SECRET || '').replace(/^["']|["']$/g, '').trim();

export const pool = databaseUrl
  ? new Pool({
      connectionString: databaseUrl,
      max: 10,
      ssl:
        databaseUrl.includes('localhost') || databaseUrl.includes('127.0.0.1')
          ? false
          : undefined,
    })
  : null;

export const auth = betterAuth({
  appName: 'Gyanvatsala Workspace',
  baseURL: resolveBaseURL(),
  trustedOrigins: resolveTrustedOrigins,
  secret: getBetterAuthSecret(),
  database: pool || undefined,
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    autoSignIn: false,
    requireEmailVerification: true,
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    expiresIn: 300,
  },
  rateLimit: {
    enabled: true,
    window: 60,
    max: 30,
    customRules: {
      '/sign-in/email': { window: 900, max: 10 },
      '/sign-up/email': { window: 3600, max: 5 },
      '/sign-in/email-otp': { window: 300, max: 5 },
      '/email-otp/*': { window: 300, max: 10 },
    },
  },
  session: {
    expiresIn: 60 * 60 * 2, // 2 hours strict session limit
    updateAge: 60 * 30, // 30 minutes
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes
    },
  },
  advanced: {
    useSecureCookies: process.env.NODE_ENV === 'production',
    trustedProxyHeaders: true,
  },
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ['google'],
    },
  },
  socialProviders: {
    google: {
      clientId: googleClientId,
      clientSecret: googleClientSecret,
    },
  },
  plugins: [
    admin({
      defaultRole: 'user',
      adminRole: 'admin',
    }),
    emailOTP({
      otpLength: 4,
      expiresIn: 300, // 5 minutes
      allowedAttempts: 5,
      storeOTP: 'hashed',
      resendStrategy: 'rotate',
      overrideDefaultEmailVerification: true,
      rateLimit: {
        window: 60,
        max: 3,
      },
      async sendVerificationOTP({ email, otp, type }) {
        await sendOtpEmail(email, otp, type);
      },
    }),
  ],
});

export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;

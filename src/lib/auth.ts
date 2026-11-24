import { betterAuth } from 'better-auth';
import { emailOTP, admin } from 'better-auth/plugins';
import { Pool } from 'pg';
import { sendOtpEmail } from './email';

const databaseUrl = process.env.DATABASE_URL;

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

const googleClientId = (process.env.GOOGLE_CLIENT_ID || '').replace(/^["']|["']$/g, '').trim();
const googleClientSecret = (process.env.GOOGLE_CLIENT_SECRET || '').replace(/^["']|["']$/g, '').trim();

export const pool = databaseUrl
  ? new Pool({
      connectionString: databaseUrl,
      max: 10,
      ssl:
        databaseUrl.includes('localhost') || databaseUrl.includes('127.0.0.1')
          ? false
          : { rejectUnauthorized: process.env.NODE_ENV === 'production' },
    })
  : null;

export const auth = betterAuth({
  appName: 'Gyanvatsala Workspace',
  baseURL: process.env.BETTER_AUTH_URL || 'https://www.gyanvatsala.in',
  trustedOrigins: [
    'https://www.gyanvatsala.in',
    'https://gyanvatsala.in',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
  ],
  secret: getBetterAuthSecret(),
  database: pool || undefined,
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

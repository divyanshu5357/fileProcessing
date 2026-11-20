import crypto from 'crypto';

export interface InternalIdentityClaims {
  sub: string; // User ID
  email: string; // User Email
  role: 'admin' | 'support' | 'user';
  plan: string;
  aud: 'pixelkit-backend';
  iss: 'pixelkit-bff';
  iat: number; // Issued at (Unix epoch seconds)
  exp: number; // Expires at (Unix epoch seconds)
  jti: string; // Unique cryptographic nonce
}

const getInternalKey = (): string => {
  return (
    process.env.INTERNAL_SERVICE_KEY ||
    process.env.BETTER_AUTH_SECRET ||
    'gyanvatsala_super_secret_auth_key_must_be_at_least_32_characters_long'
  );
};

/**
 * Creates a cryptographically signed, short-lived (60s) identity assertion token.
 * Prevents header spoofing: FastAPI verifies this token before trusting any user or admin claims.
 */
export function createInternalAssertion(user: {
  id?: string;
  userId?: string;
  email: string;
  role: 'admin' | 'support' | 'user';
  plan?: string;
}): string {
  const secret = getInternalKey();
  const now = Math.floor(Date.now() / 1000);
  const uid = user.id || user.userId || '';

  const claims: InternalIdentityClaims = {
    sub: uid,
    email: user.email.toLowerCase().trim(),
    role: user.role,
    plan: user.plan || 'Free',
    aud: 'pixelkit-backend',
    iss: 'pixelkit-bff',
    iat: now,
    exp: now + 60, // Strictly valid for 60 seconds
    jti: crypto.randomUUID(),
  };

  const payloadB64 = Buffer.from(JSON.stringify(claims)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', secret)
    .update(payloadB64)
    .digest('hex');

  return `${payloadB64}.${signature}`;
}

/**
 * Verifies an internal identity assertion on the Node.js side (for testing and validation).
 */
export function verifyInternalAssertion(
  token: string
): InternalIdentityClaims | null {
  if (!token || !token.includes('.')) return null;

  const [payloadB64, signature] = token.split('.');
  const secret = getInternalKey();

  const expectedSig = crypto
    .createHmac('sha256', secret)
    .update(payloadB64)
    .digest('hex');

  const sigBuf = Buffer.from(signature, 'hex');
  const expBuf = Buffer.from(expectedSig, 'hex');

  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }

  try {
    const claims = JSON.parse(
      Buffer.from(payloadB64, 'base64url').toString('utf8')
    ) as InternalIdentityClaims;
    const now = Math.floor(Date.now() / 1000);

    if (claims.exp < now) return null;
    if (claims.iat > now + 10) return null;
    if (claims.aud !== 'pixelkit-backend' || claims.iss !== 'pixelkit-bff') return null;

    return claims;
  } catch {
    return null;
  }
}

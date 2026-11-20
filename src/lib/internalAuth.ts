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

/**
 * Retrieves the dedicated INTERNAL_SERVICE_KEY for inter-service assertions.
 * Strictly fails closed if the key is missing or shorter than 16 characters.
 */
const getInternalKey = (): string => {
  const key = process.env.INTERNAL_SERVICE_KEY;
  if (!key || key.trim().length < 16) {
    throw new Error(
      '[CRITICAL SECURITY] INTERNAL_SERVICE_KEY environment variable is missing or insecure. Inter-service calls cannot proceed.'
    );
  }
  return key.trim();
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
  const uid = (user.id || user.userId || '').trim();

  if (!uid || !user.email) {
    throw new Error('[SECURITY] Cannot generate internal assertion without valid user ID and email.');
  }

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
 * Verifies an internal identity assertion on the Node.js side (for testing and gateway validation).
 */
export function verifyInternalAssertion(
  token: string
): InternalIdentityClaims | null {
  if (!token || !token.includes('.')) return null;

  try {
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

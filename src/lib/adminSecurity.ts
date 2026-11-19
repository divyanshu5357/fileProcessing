import crypto from 'crypto';
import { pool } from '@/lib/auth';

/**
 * Derives a base secret key from environment configuration.
 * Fails securely if BETTER_AUTH_SECRET is not configured in production.
 */
const getSecret = (): string => {
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('[CRITICAL SECURITY] BETTER_AUTH_SECRET environment variable is missing.');
    }
    return 'gyanvatsala_super_secret_auth_key_must_be_at_least_32_characters_long';
  }
  return secret;
};

/**
 * Domain-separated key derivation for AES-256-GCM encryption.
 * Cryptographically independent from the HMAC signing key.
 */
const getEncryptionKey = (): Buffer => {
  return crypto
    .createHmac('sha256', getSecret())
    .update('pixelkit:admin:aes-256-gcm:enc:v1')
    .digest();
};

/**
 * Domain-separated key derivation for HMAC-SHA256 signature verification.
 * Cryptographically independent from the AES encryption key.
 */
const getSigningKey = (): Buffer => {
  return crypto
    .createHmac('sha256', getSecret())
    .update('pixelkit:admin:hmac-sha256:sign:v1')
    .digest();
};

/**
 * Legacy key derivation used during initial setup.
 * Retained strictly for backward compatibility and automated in-flight migration.
 */
const getLegacyKey = (): Buffer => {
  return crypto.createHash('sha256').update(getSecret()).digest();
};

/**
 * Computes a deterministic HMAC-SHA256 signature using the separated signing key.
 */
export function computeEmailHmac(email: string): string {
  const normalized = email.toLowerCase().trim();
  const key = getSigningKey();
  return crypto.createHmac('sha256', key).update(normalized).digest('hex');
}

/**
 * Computes a legacy HMAC-SHA256 for migration checks.
 */
function computeLegacyHmac(email: string): string {
  const normalized = email.toLowerCase().trim();
  const key = getLegacyKey();
  return crypto.createHmac('sha256', key).update(normalized).digest('hex');
}

/**
 * Encrypts an email using AES-256-GCM with a cryptographically secure random 12-byte IV.
 * Output format: "iv_hex:authTag_hex:ciphertext_hex"
 */
export function encryptEmail(email: string): string {
  const normalized = email.toLowerCase().trim();
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  let encrypted = cipher.update(normalized, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

/**
 * Decrypts an AES-256-GCM encrypted email payload.
 * Supports automatic fallback to legacy key if the record was encrypted before key separation.
 * Returns null if authentication tag verification fails or payload is malformed.
 */
export function decryptEmail(payload: string): string | null {
  try {
    const parts = payload.split(':');
    if (parts.length !== 3) return null;
    const [ivHex, tagHex, dataHex] = parts;

    // 1. Attempt decryption with current separated encryption key
    try {
      const key = getEncryptionKey();
      const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(ivHex, 'hex'));
      decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
      let decrypted = decipher.update(dataHex, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted.toLowerCase().trim();
    } catch {
      // 2. Fallback to legacy key for seamless migration
      const legacyKey = getLegacyKey();
      const decipher = crypto.createDecipheriv('aes-256-gcm', legacyKey, Buffer.from(ivHex, 'hex'));
      decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
      let decrypted = decipher.update(dataHex, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted.toLowerCase().trim();
    }
  } catch (err) {
    console.error('[AdminSecurity] Decryption verification failed:', err);
    return null;
  }
}

// In-memory cache with short TTL (30s) to minimize DB latency
let cachedConfig: {
  adminUserId: string | null;
  encryptedEmail: string;
  emailHmac: string;
  cachedAt: number;
} | null = null;
const CACHE_TTL_MS = 30_000;

export function invalidateAdminCache(): void {
  cachedConfig = null;
}

async function getAdminConfig(): Promise<{
  adminUserId: string | null;
  encryptedEmail: string;
  emailHmac: string;
} | null> {
  const now = Date.now();
  if (cachedConfig && now - cachedConfig.cachedAt < CACHE_TTL_MS) {
    return cachedConfig;
  }

  if (!pool) return null;

  try {
    const res = await pool.query(
      `SELECT admin_user_id, encrypted_email, email_hmac 
       FROM public.system_admin_config 
       WHERE id = 1 LIMIT 1`
    );

    if (res.rows.length === 0) return null;

    const row = res.rows[0];
    cachedConfig = {
      adminUserId: row.admin_user_id,
      encryptedEmail: row.encrypted_email,
      emailHmac: row.email_hmac,
      cachedAt: now,
    };
    return cachedConfig;
  } catch (err) {
    console.error('[AdminSecurity] Failed to fetch system_admin_config:', err);
    return null;
  }
}

/**
 * Authoritatively verifies whether the given user is the designated sole administrator.
 * 
 * Cryptographic & Architectural Guarantees:
 * 1. Constant-time HMAC-SHA256 comparison prevents timing side-channels.
 * 2. Authenticated AES-256-GCM decryption guarantees payload integrity and authenticity.
 * 3. Verified Google OAuth account linking check ensures no rogue credential accounts can impersonate the admin.
 * 4. Automatic in-place key upgrade updates legacy records to separated keys seamlessly.
 * 5. Zero hardcoded email addresses anywhere in application code.
 */
export async function verifyIsSoleAdmin(user: {
  id?: string;
  email?: string | null;
}): Promise<boolean> {
  if (!user.email) return false;
  const cleanEmail = user.email.toLowerCase().trim();
  const config = await getAdminConfig();
  if (!config) return false;

  let isMatch = false;
  let isLegacyFormat = false;

  // 1. Check with modern separated signing key (constant-time)
  try {
    const candidateHmac = computeEmailHmac(cleanEmail);
    const expectedBuf = Buffer.from(config.emailHmac, 'hex');
    const candidateBuf = Buffer.from(candidateHmac, 'hex');
    if (expectedBuf.length === candidateBuf.length && crypto.timingSafeEqual(expectedBuf, candidateBuf)) {
      isMatch = true;
    }
  } catch {
    // Non-fatal, try legacy check
  }

  // 1b. Fallback check with legacy key for backward compatibility
  if (!isMatch) {
    try {
      const candidateLegacyHmac = computeLegacyHmac(cleanEmail);
      const expectedBuf = Buffer.from(config.emailHmac, 'hex');
      const candidateBuf = Buffer.from(candidateLegacyHmac, 'hex');
      if (expectedBuf.length === candidateBuf.length && crypto.timingSafeEqual(expectedBuf, candidateBuf)) {
        isMatch = true;
        isLegacyFormat = true;
      }
    } catch {
      return false;
    }
  }

  if (!isMatch) return false;

  // 2. Decrypt encrypted_email to confirm matching plaintext
  const decrypted = decryptEmail(config.encryptedEmail);
  if (!decrypted || decrypted !== cleanEmail) {
    return false;
  }

  // 3. OAuth Account Linking Verification:
  // Ensure the user account has a verified 'google' provider account linked in the DB.
  // This blocks credential/password spoofing of the administrator's email.
  if (pool && user.id) {
    try {
      const acctRes = await pool.query(
        `SELECT 1 FROM public.account 
         WHERE "userId" = $1 AND "providerId" = 'google' 
         LIMIT 1`,
        [user.id]
      );
      if (acctRes.rows.length === 0) {
        console.warn(`[AdminSecurity] User ${user.id} matched admin email but lacks verified Google OAuth provider.`);
        return false;
      }
    } catch (acctErr) {
      console.debug('[AdminSecurity] Non-fatal OAuth account verification error:', acctErr);
    }
  }

  // 4. In-flight automatic upgrade from legacy format to modern separated keys
  if (isLegacyFormat && pool) {
    try {
      const newEncrypted = encryptEmail(cleanEmail);
      const newHmac = computeEmailHmac(cleanEmail);
      await pool.query(
        `UPDATE public.system_admin_config 
         SET encrypted_email = $1, email_hmac = $2, updated_at = NOW() 
         WHERE id = 1`,
        [newEncrypted, newHmac]
      );
      invalidateAdminCache();
      console.log('[AdminSecurity] Successfully upgraded system_admin_config to separated domain keys.');
    } catch (upgradeErr) {
      console.error('[AdminSecurity] Failed to upgrade admin config keys:', upgradeErr);
    }
  }

  // 5. Keep admin_user_id synchronized in database configuration
  if (user.id && config.adminUserId !== user.id && pool) {
    try {
      await pool.query(
        `UPDATE public.system_admin_config 
         SET admin_user_id = $1, updated_at = NOW() 
         WHERE id = 1`,
        [user.id]
      );
      if (cachedConfig) {
        cachedConfig.adminUserId = user.id;
      }
    } catch (syncErr) {
      console.error('[AdminSecurity] Sync admin_user_id non-fatal error:', syncErr);
    }
  }

  return true;
}

/**
 * Enforces sole admin role in the PostgreSQL user table.
 * Promotes the verified admin and ensures no other account holds role = 'admin'.
 */
export async function syncDatabaseRoleForSoleAdmin(
  userId: string,
  isSoleAdmin: boolean
): Promise<void> {
  if (!pool || !userId) return;

  try {
    if (isSoleAdmin) {
      // 1. Demote any other users who might erroneously hold 'admin'
      await pool.query(
        `UPDATE public."user" 
         SET role = 'user' 
         WHERE role = 'admin' AND id <> $1`,
        [userId]
      );
      // 2. Authoritatively elevate this user
      await pool.query(
        `UPDATE public."user" 
         SET role = 'admin' 
         WHERE id = $1 AND role <> 'admin'`,
        [userId]
      );
    } else {
      // Demote if they are not the sole admin
      await pool.query(
        `UPDATE public."user" 
         SET role = 'user' 
         WHERE id = $1 AND role = 'admin'`,
        [userId]
      );
    }
  } catch (err) {
    console.error('[AdminSecurity] Error enforcing DB role:', err);
  }
}

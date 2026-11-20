import crypto from 'crypto';
import { pool } from '@/lib/auth';

/**
 * Retrieves the cryptographic master secret for administrative operations.
 * Strictly requires ADMIN_MASTER_SECRET or BETTER_AUTH_SECRET to be configured.
 * Fails closed in all environments if no valid secret is present.
 */
const getSecret = (): string => {
  const secret = process.env.ADMIN_MASTER_SECRET || process.env.BETTER_AUTH_SECRET;
  if (!secret || secret.trim().length < 32) {
    throw new Error(
      '[CRITICAL SECURITY] ADMIN_MASTER_SECRET or BETTER_AUTH_SECRET must be configured with at least 32 characters.'
    );
  }
  return secret.trim();
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
  if (!email || typeof email !== 'string') return '';
  const normalized = email.toLowerCase().trim();
  const key = getSigningKey();
  return crypto.createHmac('sha256', key).update(normalized).digest('hex');
}

/**
 * Computes a legacy HMAC-SHA256 for migration checks.
 */
function computeLegacyHmac(email: string): string {
  if (!email || typeof email !== 'string') return '';
  const normalized = email.toLowerCase().trim();
  const key = getLegacyKey();
  return crypto.createHmac('sha256', key).update(normalized).digest('hex');
}

/**
 * Validates encrypted payload format, IV length, auth tag length, and hexadecimal encoding.
 * Supports:
 * - Versioned format: "v1:<iv_hex>:<authTag_hex>:<ciphertext_hex>"
 * - Legacy format: "<iv_hex>:<authTag_hex>:<ciphertext_hex>"
 */
export function isValidEncryptedPayload(payload: string): boolean {
  if (!payload || typeof payload !== 'string') return false;
  const parts = payload.split(':');

  // Modern v1 format
  if (parts.length === 4 && parts[0] === 'v1') {
    const [, ivHex, tagHex, dataHex] = parts;
    return (
      /^[0-9a-fA-F]{24}$/.test(ivHex) && // 12-byte IV = 24 hex characters
      /^[0-9a-fA-F]{32}$/.test(tagHex) && // 16-byte GCM Tag = 32 hex characters
      /^[0-9a-fA-F]+$/.test(dataHex) &&
      dataHex.length % 2 === 0
    );
  }

  // Legacy format
  if (parts.length === 3) {
    const [ivHex, tagHex, dataHex] = parts;
    return (
      /^[0-9a-fA-F]{24}$/.test(ivHex) &&
      /^[0-9a-fA-F]{32}$/.test(tagHex) &&
      /^[0-9a-fA-F]+$/.test(dataHex) &&
      dataHex.length % 2 === 0
    );
  }

  return false;
}

/**
 * Encrypts an email using AES-256-GCM with a cryptographically secure random 12-byte IV.
 * Explicitly versioned output format: "v1:iv_hex:authTag_hex:ciphertext_hex"
 */
export function encryptEmail(email: string): string {
  const normalized = email.toLowerCase().trim();
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(12); // Standard 96-bit IV for AES-GCM
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  let encrypted = cipher.update(normalized, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  return `v1:${iv.toString('hex')}:${authTag}:${encrypted}`;
}

/**
 * Decrypts an AES-256-GCM encrypted email payload.
 * Validates payload format, lengths, and hexadecimal encoding before processing.
 * Supports backward-compatible migration for legacy payloads.
 * Returns null if authentication tag verification fails or payload is malformed.
 */
export function decryptEmail(payload: string): string | null {
  if (!isValidEncryptedPayload(payload)) {
    return null;
  }

  try {
    const parts = payload.split(':');
    const isV1 = parts.length === 4 && parts[0] === 'v1';
    const ivHex = isV1 ? parts[1] : parts[0];
    const tagHex = isV1 ? parts[2] : parts[1];
    const dataHex = isV1 ? parts[3] : parts[2];

    // 1. Attempt decryption with current separated encryption key
    try {
      const key = getEncryptionKey();
      const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(ivHex, 'hex'));
      decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
      let decrypted = decipher.update(dataHex, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted.toLowerCase().trim();
    } catch {
      // 2. Fallback to legacy key only for non-v1 records
      if (!isV1) {
        const legacyKey = getLegacyKey();
        const decipher = crypto.createDecipheriv('aes-256-gcm', legacyKey, Buffer.from(ivHex, 'hex'));
        decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
        let decrypted = decipher.update(dataHex, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted.toLowerCase().trim();
      }
      return null;
    }
  } catch (err) {
    return null;
  }
}

// In-memory cache with short TTL (15s) to minimize DB latency while enabling fast revocation
let cachedConfig: {
  adminUserId: string | null;
  encryptedEmail: string;
  emailHmac: string;
  cachedAt: number;
} | null = null;
const CACHE_TTL_MS = 15_000;

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
    console.error('[AdminSecurity] Failed to fetch system_admin_config from DB:', err);
    return null;
  }
}

/**
 * Authoritatively verifies whether the given user is the designated sole administrator.
 * 
 * Cryptographic & Architectural Guarantees:
 * 1. Fails closed if user context (id or email) is missing or malformed.
 * 2. Fails closed if the database connection or pool is unavailable.
 * 3. Constant-time HMAC-SHA256 comparison prevents timing side-channels.
 * 4. Authenticated AES-256-GCM decryption guarantees payload integrity and authenticity.
 * 5. Strict Better Auth DB check: verifies emailVerified = true in public."user".
 * 6. Strict Google OAuth check: queries public.account for providerId = 'google'.
 * 7. Never skips OAuth check; failure of account query immediately rejects admin access.
 * 8. Protects admin_user_id: normal login CANNOT rebind or overwrite the administrator user ID.
 * 9. Explicit cryptographic versioning and format validation.
 */
export async function verifyIsSoleAdmin(user: {
  id?: string | null;
  email?: string | null;
}): Promise<boolean> {
  // 1. Fail closed on missing/invalid user ID or email
  if (!user || !user.id || typeof user.id !== 'string' || !user.id.trim() ||
      !user.email || typeof user.email !== 'string' || !user.email.trim()) {
    return false;
  }

  const cleanUserId = user.id.trim();
  const cleanEmail = user.email.toLowerCase().trim();

  // 2. Fail closed if database pool is unavailable
  if (!pool) {
    console.error('[AdminSecurity] Database pool is unavailable; failing closed.');
    return false;
  }

  // 3. Fetch admin configuration from DB (fails closed if table is empty or error)
  const config = await getAdminConfig();
  if (!config) {
    return false;
  }

  // 4. Verify existing admin_user_id binding before granting privileges!
  // Prevents normal login requests from rewriting or hijacking the administrator identity.
  if (config.adminUserId && config.adminUserId !== cleanUserId) {
    console.warn(
      `[AdminSecurity] User ID binding mismatch: candidate ${cleanUserId} !== bound admin ${config.adminUserId}`
    );
    return false;
  }

  // 5. Constant-time HMAC comparison
  let isMatch = false;
  let isLegacyFormat = false;

  try {
    const candidateHmac = computeEmailHmac(cleanEmail);
    const expectedBuf = Buffer.from(config.emailHmac, 'hex');
    const candidateBuf = Buffer.from(candidateHmac, 'hex');
    if (expectedBuf.length === candidateBuf.length && crypto.timingSafeEqual(expectedBuf, candidateBuf)) {
      isMatch = true;
    }
  } catch {
    // Non-fatal, check legacy HMAC
  }

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

  // 6. Decrypt encrypted_email to confirm matching plaintext
  const decrypted = decryptEmail(config.encryptedEmail);
  if (!decrypted || decrypted !== cleanEmail) {
    return false;
  }

  // 7. Verify email ownership and trusted email verification status using Better Auth DB schema
  try {
    const userRes = await pool.query(
      `SELECT "emailVerified", email, role FROM public."user" WHERE id = $1 LIMIT 1`,
      [cleanUserId]
    );
    if (userRes.rows.length === 0) {
      console.warn(`[AdminSecurity] User record ${cleanUserId} not found in database.`);
      return false;
    }
    const dbUser = userRes.rows[0];
    if (!dbUser.emailVerified) {
      console.warn(`[AdminSecurity] User ${cleanUserId} email is unverified; rejecting admin access.`);
      return false;
    }
    if ((dbUser.email || '').toLowerCase().trim() !== cleanEmail) {
      console.warn(`[AdminSecurity] DB user email mismatch for ID ${cleanUserId}.`);
      return false;
    }
  } catch (userErr) {
    console.error('[AdminSecurity] Failed to verify user record in DB; failing closed:', userErr);
    return false;
  }

  // 8. Strict Google OAuth Provider Verification:
  // Must verify that the Google account is linked to the correct Better Auth user.
  // Fails closed if the database query fails or if no linked account is found.
  try {
    const acctRes = await pool.query(
      `SELECT 1 FROM public.account 
       WHERE "userId" = $1 AND "providerId" = 'google' 
       LIMIT 1`,
      [cleanUserId]
    );
    if (acctRes.rows.length === 0) {
      console.warn(`[AdminSecurity] User ${cleanUserId} lacks verified Google OAuth provider.`);
      return false;
    }
  } catch (acctErr) {
    console.error('[AdminSecurity] OAuth account verification query failed; failing closed:', acctErr);
    return false;
  }

  // 9. Initial binding if admin_user_id was previously unassigned (first bootstrap only)
  if (!config.adminUserId) {
    try {
      await pool.query(
        `UPDATE public.system_admin_config 
         SET admin_user_id = $1, updated_at = NOW() 
         WHERE id = 1 AND admin_user_id IS NULL`,
        [cleanUserId]
      );
      invalidateAdminCache();
      console.log(`[AdminSecurity] Bound initial admin_user_id to ${cleanUserId}.`);
    } catch (bindErr) {
      console.error('[AdminSecurity] Failed to bind initial admin_user_id:', bindErr);
    }
  }

  // 10. In-flight automatic upgrade from legacy format to modern versioned v1 separated keys
  if ((isLegacyFormat || !config.encryptedEmail.startsWith('v1:')) && pool) {
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
      console.log('[AdminSecurity] Successfully upgraded system_admin_config to v1 separated keys.');
    } catch (upgradeErr) {
      console.error('[AdminSecurity] Failed to upgrade admin config keys:', upgradeErr);
    }
  }

  return true;
}

/**
 * Enforces sole admin role in the PostgreSQL user table using an explicit transaction.
 * Authoritatively promotes the verified admin and demotes any other accounts holding role = 'admin'.
 */
export async function syncDatabaseRoleForSoleAdmin(
  userId: string,
  isSoleAdmin: boolean
): Promise<void> {
  if (!pool || !userId) return;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    if (isSoleAdmin) {
      // 1. Demote any other users who might erroneously hold 'admin'
      await client.query(
        `UPDATE public."user" 
         SET role = 'user' 
         WHERE role = 'admin' AND id <> $1`,
        [userId]
      );
      // 2. Authoritatively elevate this user
      await client.query(
        `UPDATE public."user" 
         SET role = 'admin' 
         WHERE id = $1 AND role <> 'admin'`,
        [userId]
      );
    } else {
      // Demote if they are not the sole admin
      await client.query(
        `UPDATE public."user" 
         SET role = 'user' 
         WHERE id = $1 AND role = 'admin'`,
        [userId]
      );
    }

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[AdminSecurity] Transactional role sync failed:', err);
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Explicit, protected administrator reassignment operation.
 * Requires verification of the cryptographic master secret and explicit invocation.
 * Ordinary user logins can NEVER trigger this operation.
 */
export async function reassignSoleAdminUserId(params: {
  newAdminUserId: string;
  adminEmail: string;
  masterSecret: string;
}): Promise<{ success: boolean; message: string }> {
  if (!pool) return { success: false, message: 'Database pool unavailable.' };

  const configuredSecret = getSecret();
  const providedBuf = Buffer.from(params.masterSecret || '');
  const configBuf = Buffer.from(configuredSecret);

  if (providedBuf.length !== configBuf.length || !crypto.timingSafeEqual(providedBuf, configBuf)) {
    return { success: false, message: 'Invalid administrative master secret.' };
  }

  const cleanEmail = params.adminEmail.toLowerCase().trim();
  const cleanNewId = params.newAdminUserId.trim();

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Verify target user exists and has emailVerified = true
    const uRes = await client.query(
      `SELECT "emailVerified", email FROM public."user" WHERE id = $1 LIMIT 1`,
      [cleanNewId]
    );
    if (uRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return { success: false, message: 'Target user record not found.' };
    }
    if (!uRes.rows[0].emailVerified) {
      await client.query('ROLLBACK');
      return { success: false, message: 'Target user email is not verified.' };
    }

    // Update system_admin_config
    const newEncrypted = encryptEmail(cleanEmail);
    const newHmac = computeEmailHmac(cleanEmail);

    await client.query(
      `UPDATE public.system_admin_config 
       SET admin_user_id = $1, encrypted_email = $2, email_hmac = $3, updated_at = NOW() 
       WHERE id = 1`,
      [cleanNewId, newEncrypted, newHmac]
    );

    await client.query('COMMIT');
    invalidateAdminCache();
    return { success: true, message: `Sole administrator successfully reassigned to ${cleanNewId}.` };
  } catch (err: any) {
    await client.query('ROLLBACK');
    return { success: false, message: err?.message || 'Database error during reassignment.' };
  } finally {
    client.release();
  }
}

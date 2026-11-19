import crypto from 'crypto';
import { pool } from '@/lib/auth';

// Derive a 32-byte AES key securely from BETTER_AUTH_SECRET
const getMasterKey = (): Buffer => {
  const secret =
    process.env.BETTER_AUTH_SECRET ||
    'gyanvatsala_super_secret_auth_key_must_be_at_least_32_characters_long';
  return crypto.createHash('sha256').update(secret).digest();
};

/**
 * Computes a deterministic HMAC-SHA256 signature for constant-time email comparison.
 */
export function computeEmailHmac(email: string): string {
  const normalized = email.toLowerCase().trim();
  const key = getMasterKey();
  return crypto.createHmac('sha256', key).update(normalized).digest('hex');
}

/**
 * Encrypts an email using AES-256-GCM.
 * Output format: "iv_hex:authTag_hex:ciphertext_hex"
 */
export function encryptEmail(email: string): string {
  const normalized = email.toLowerCase().trim();
  const key = getMasterKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  let encrypted = cipher.update(normalized, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

/**
 * Decrypts an AES-256-GCM encrypted email payload.
 */
export function decryptEmail(payload: string): string | null {
  try {
    const parts = payload.split(':');
    if (parts.length !== 3) return null;
    const [ivHex, tagHex, dataHex] = parts;
    const key = getMasterKey();
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(ivHex, 'hex'));
    decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
    let decrypted = decipher.update(dataHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted.toLowerCase().trim();
  } catch (err) {
    console.error('[AdminSecurity] Decryption error:', err);
    return null;
  }
}

// In-memory cache with short TTL (30s) to keep latency near zero while reflecting changes quickly
let cachedConfig: {
  adminUserId: string | null;
  encryptedEmail: string;
  emailHmac: string;
  cachedAt: number;
} | null = null;
const CACHE_TTL_MS = 30_000;

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
 * Validates cryptographically against the encrypted database configuration.
 * Zero hardcoded email addresses anywhere in application code.
 */
export async function verifyIsSoleAdmin(user: {
  id?: string;
  email?: string | null;
}): Promise<boolean> {
  if (!user.email) return false;
  const cleanEmail = user.email.toLowerCase().trim();
  const candidateHmac = computeEmailHmac(cleanEmail);

  const config = await getAdminConfig();
  if (!config) return false;

  // 1. Constant-time HMAC match
  try {
    const expectedBuf = Buffer.from(config.emailHmac, 'hex');
    const candidateBuf = Buffer.from(candidateHmac, 'hex');
    if (expectedBuf.length !== candidateBuf.length) return false;
    if (!crypto.timingSafeEqual(expectedBuf, candidateBuf)) return false;
  } catch {
    return false;
  }

  // 2. Decrypt encrypted_email to confirm matching plaintext
  const decrypted = decryptEmail(config.encryptedEmail);
  if (!decrypted || decrypted !== cleanEmail) {
    return false;
  }

  // 3. Keep admin_user_id in sync if user ID changed or was unlinked
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

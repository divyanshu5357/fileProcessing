import { pool } from '@/lib/auth';
import { RAZORPAY_PLANS } from '@/lib/razorpay';

export interface SiteSettings {
  settingKey: string;
  paymentsEnabled: boolean;
  maintenanceMode: boolean;
  announcementBanner: string;
  updatedAt: string | null;
}

export interface SubscriptionPlanRecord {
  id: string;
  slug: string;
  tier: 'Free' | 'Prime' | 'PrimePlus' | 'PrimeUltra';
  name: string;
  badge: string;
  description: string;
  priceMonthlyInr: number;
  priceYearlyInr: number;
  storageLimitBytes: number;
  retentionDays: number;
  maxFileSizeBytes: number;
  features: string[];
  isRecommended: boolean;
  isActive: boolean;
  isPaid: boolean;
  sortOrder: number;
}

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  settingKey: 'default',
  paymentsEnabled: false,
  maintenanceMode: false,
  announcementBanner: '',
  updatedAt: null,
};

export const DEFAULT_PLANS: SubscriptionPlanRecord[] = [
  {
    id: 'free',
    slug: 'free',
    tier: 'Free',
    name: 'Free Starter',
    badge: 'Zero Cost',
    description: 'Ideal for everyday document tasks, in-browser privacy, and fast conversions.',
    priceMonthlyInr: 0,
    priceYearlyInr: 0,
    storageLimitBytes: 15 * 1024 * 1024,
    retentionDays: 7,
    maxFileSizeBytes: 15 * 1024 * 1024,
    features: [
      '15 MB Cloud Storage',
      '7-day automatic data retention',
      '100% In-Browser Private Mode (Zero Uploads)',
      'Standard conversion queue',
      'Direct local download before expiry',
      'Full access to all PDF & Image tools',
    ],
    isRecommended: false,
    isActive: true,
    isPaid: false,
    sortOrder: 0,
  },
  {
    id: 'prime',
    slug: 'prime',
    tier: 'Prime',
    name: 'Prime',
    badge: 'Starter Pro',
    description: 'Double retention and storage for active students and freelancers.',
    priceMonthlyInr: RAZORPAY_PLANS.prime.monthlyPriceInr,
    priceYearlyInr: RAZORPAY_PLANS.prime.yearlyPriceInr,
    storageLimitBytes: RAZORPAY_PLANS.prime.storageLimitBytes,
    retentionDays: RAZORPAY_PLANS.prime.retentionDays,
    maxFileSizeBytes: RAZORPAY_PLANS.prime.fileSizeLimitBytes,
    features: [
      '50 MB Cloud Storage',
      '14-day automatic data retention',
      'Priority queue processing',
      '48h & 24h expiration email alerts',
      'Unlimited heavy PDF tool exports',
      'Faster image & PDF compression',
    ],
    isRecommended: false,
    isActive: true,
    isPaid: true,
    sortOrder: 1,
  },
  {
    id: 'prime_plus',
    slug: 'prime_plus',
    tier: 'PrimePlus',
    name: 'PrimePlus',
    badge: 'Most Popular',
    description: '30-day retention and high-speed parallel processing for power users.',
    priceMonthlyInr: RAZORPAY_PLANS.prime_plus.monthlyPriceInr,
    priceYearlyInr: RAZORPAY_PLANS.prime_plus.yearlyPriceInr,
    storageLimitBytes: RAZORPAY_PLANS.prime_plus.storageLimitBytes,
    retentionDays: RAZORPAY_PLANS.prime_plus.retentionDays,
    maxFileSizeBytes: RAZORPAY_PLANS.prime_plus.fileSizeLimitBytes,
    features: [
      '100 MB Cloud Storage',
      '30-day extended data retention',
      'High-speed parallel workers',
      'Batch PDF Assembler & Editor',
      'Automated expiration warnings',
      'Priority email support',
      'Unlimited local exports',
    ],
    isRecommended: true,
    isActive: true,
    isPaid: true,
    sortOrder: 2,
  },
  {
    id: 'prime_ultra',
    slug: 'prime_ultra',
    tier: 'PrimeUltra',
    name: 'PrimeUltra',
    badge: 'Best Value',
    description: 'Long-term 1-year archival and maximum concurrency for professional teams.',
    priceMonthlyInr: RAZORPAY_PLANS.prime_ultra.monthlyPriceInr,
    priceYearlyInr: RAZORPAY_PLANS.prime_ultra.yearlyPriceInr,
    storageLimitBytes: RAZORPAY_PLANS.prime_ultra.storageLimitBytes,
    retentionDays: RAZORPAY_PLANS.prime_ultra.retentionDays,
    maxFileSizeBytes: RAZORPAY_PLANS.prime_ultra.fileSizeLimitBytes,
    features: [
      '500 MB Enterprise Cloud Storage',
      '365-day (1 full year) retention',
      'Unlimited batch conversions',
      'Dedicated worker concurrency',
      'VIP customer support',
      'Advanced data export packages',
    ],
    isRecommended: false,
    isActive: true,
    isPaid: true,
    sortOrder: 3,
  },
];

let schemaReadyPromise: Promise<void> | null = null;

async function ensureSiteConfigTables(): Promise<void> {
  if (!pool) return;
  if (schemaReadyPromise) {
    return schemaReadyPromise;
  }

  schemaReadyPromise = (async () => {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS site_settings (
        setting_key TEXT PRIMARY KEY,
        payments_enabled BOOLEAN NOT NULL DEFAULT false,
        maintenance_mode BOOLEAN NOT NULL DEFAULT false,
        announcement_banner TEXT NOT NULL DEFAULT '',
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await pool.query(
      `INSERT INTO site_settings (setting_key, payments_enabled, maintenance_mode, announcement_banner)
       VALUES ('default', false, false, '')
       ON CONFLICT (setting_key) DO NOTHING;`
    );

    await pool.query(`
      CREATE TABLE IF NOT EXISTS plans (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        price_monthly_inr INTEGER NOT NULL DEFAULT 0,
        price_yearly_inr INTEGER NOT NULL DEFAULT 0,
        storage_limit_bytes BIGINT NOT NULL DEFAULT 15728640,
        retention_days INTEGER NOT NULL DEFAULT 7,
        max_file_size_bytes BIGINT NOT NULL DEFAULT 15728640,
        features JSONB NOT NULL DEFAULT '[]'::jsonb,
        is_recommended BOOLEAN NOT NULL DEFAULT false,
        is_active BOOLEAN NOT NULL DEFAULT true
      );
    `);

    await pool.query(`ALTER TABLE plans ADD COLUMN IF NOT EXISTS tier TEXT;`);
    await pool.query(`ALTER TABLE plans ADD COLUMN IF NOT EXISTS badge TEXT DEFAULT '';`);
    await pool.query(`ALTER TABLE plans ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '';`);
    await pool.query(`ALTER TABLE plans ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;`);
    await pool.query(`ALTER TABLE plans ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();`);

    for (const plan of DEFAULT_PLANS) {
      await pool.query(
        `INSERT INTO plans (
          id, name, slug, tier, badge, description,
          price_monthly_inr, price_yearly_inr, storage_limit_bytes,
          retention_days, max_file_size_bytes, features,
          is_recommended, is_active, sort_order, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6,
          $7, $8, $9,
          $10, $11, $12::jsonb,
          $13, $14, $15, NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
          tier = COALESCE(NULLIF(plans.tier, ''), EXCLUDED.tier),
          badge = COALESCE(NULLIF(plans.badge, ''), EXCLUDED.badge),
          description = COALESCE(NULLIF(plans.description, ''), EXCLUDED.description),
          sort_order = COALESCE(plans.sort_order, EXCLUDED.sort_order);`,
        [
          plan.id,
          plan.name,
          plan.slug,
          plan.tier,
          plan.badge,
          plan.description,
          plan.priceMonthlyInr,
          plan.priceYearlyInr,
          plan.storageLimitBytes,
          plan.retentionDays,
          plan.maxFileSizeBytes,
          JSON.stringify(plan.features),
          plan.isRecommended,
          plan.isActive,
          plan.sortOrder,
        ]
      );
    }
  })().catch((err) => {
    schemaReadyPromise = null;
    throw err;
  });

  return schemaReadyPromise;
}

function normalizeTier(idOrSlug: string, tier?: string | null): SubscriptionPlanRecord['tier'] {
  if (tier === 'Free' || tier === 'Prime' || tier === 'PrimePlus' || tier === 'PrimeUltra') {
    return tier;
  }
  const key = idOrSlug.toLowerCase().replace(/-/g, '_');
  if (key === 'prime') return 'Prime';
  if (key === 'prime_plus') return 'PrimePlus';
  if (key === 'prime_ultra') return 'PrimeUltra';
  return 'Free';
}

function parsePlanRow(row: Record<string, unknown>): SubscriptionPlanRecord {
  const id = String(row.id || 'free');
  const slug = String(row.slug || id);
  const tier = normalizeTier(id, row.tier as string | undefined);
  const fallback = DEFAULT_PLANS.find((p) => p.id === id) || DEFAULT_PLANS[0];

  let features: string[] = fallback.features;
  if (Array.isArray(row.features)) {
    features = row.features.map((item) => String(item)).filter(Boolean);
  } else if (typeof row.features === 'string') {
    try {
      const parsed = JSON.parse(row.features);
      if (Array.isArray(parsed)) {
        features = parsed.map((item) => String(item)).filter(Boolean);
      }
    } catch {
      features = fallback.features;
    }
  }

  return {
    id,
    slug,
    tier,
    name: String(row.name || fallback.name),
    badge: String(row.badge || fallback.badge || ''),
    description: String(row.description || fallback.description || ''),
    priceMonthlyInr: Number(row.price_monthly_inr ?? fallback.priceMonthlyInr),
    priceYearlyInr: Number(row.price_yearly_inr ?? fallback.priceYearlyInr),
    storageLimitBytes: Number(row.storage_limit_bytes ?? fallback.storageLimitBytes),
    retentionDays: Number(row.retention_days ?? fallback.retentionDays),
    maxFileSizeBytes: Number(row.max_file_size_bytes ?? fallback.maxFileSizeBytes),
    features,
    isRecommended: Boolean(row.is_recommended),
    isActive: row.is_active === undefined ? true : Boolean(row.is_active),
    isPaid: id !== 'free',
    sortOrder: Number(row.sort_order ?? fallback.sortOrder),
  };
}

export async function getSiteSettings(): Promise<SiteSettings> {
  if (!pool) return DEFAULT_SITE_SETTINGS;
  try {
    await ensureSiteConfigTables();
    const res = await pool.query(
      `SELECT setting_key, payments_enabled, maintenance_mode, announcement_banner, updated_at
       FROM site_settings WHERE setting_key = 'default' LIMIT 1`
    );
    const row = res.rows[0];
    if (!row) return DEFAULT_SITE_SETTINGS;
    return {
      settingKey: String(row.setting_key || 'default'),
      paymentsEnabled: Boolean(row.payments_enabled),
      maintenanceMode: Boolean(row.maintenance_mode),
      announcementBanner: String(row.announcement_banner || ''),
      updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : null,
    };
  } catch (err) {
    console.warn('[siteConfigServer] getSiteSettings fallback:', err);
    return DEFAULT_SITE_SETTINGS;
  }
}

export async function updateSiteSettings(input: {
  paymentsEnabled?: boolean;
  maintenanceMode?: boolean;
  announcementBanner?: string;
}): Promise<SiteSettings> {
  if (!pool) {
    throw new Error('Database connection unavailable.');
  }
  await ensureSiteConfigTables();
  const current = await getSiteSettings();
  const paymentsEnabled =
    typeof input.paymentsEnabled === 'boolean' ? input.paymentsEnabled : current.paymentsEnabled;
  const maintenanceMode =
    typeof input.maintenanceMode === 'boolean' ? input.maintenanceMode : current.maintenanceMode;
  const announcementBanner =
    typeof input.announcementBanner === 'string'
      ? input.announcementBanner.slice(0, 300)
      : current.announcementBanner;

  const res = await pool.query(
    `INSERT INTO site_settings (setting_key, payments_enabled, maintenance_mode, announcement_banner, updated_at)
     VALUES ('default', $1, $2, $3, NOW())
     ON CONFLICT (setting_key) DO UPDATE SET
       payments_enabled = EXCLUDED.payments_enabled,
       maintenance_mode = EXCLUDED.maintenance_mode,
       announcement_banner = EXCLUDED.announcement_banner,
       updated_at = NOW()
     RETURNING setting_key, payments_enabled, maintenance_mode, announcement_banner, updated_at`,
    [paymentsEnabled, maintenanceMode, announcementBanner]
  );

  const row = res.rows[0];
  return {
    settingKey: String(row.setting_key || 'default'),
    paymentsEnabled: Boolean(row.payments_enabled),
    maintenanceMode: Boolean(row.maintenance_mode),
    announcementBanner: String(row.announcement_banner || ''),
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : null,
  };
}

export async function getSubscriptionPlans(options?: {
  includeInactive?: boolean;
}): Promise<SubscriptionPlanRecord[]> {
  const includeInactive = Boolean(options?.includeInactive);
  if (!pool) return DEFAULT_PLANS;

  try {
    await ensureSiteConfigTables();
    const whereClause = includeInactive ? '' : 'WHERE is_active = true';
    const res = await pool.query(
      `SELECT id, name, slug, tier, badge, description,
              price_monthly_inr, price_yearly_inr, storage_limit_bytes,
              retention_days, max_file_size_bytes, features,
              is_recommended, is_active, sort_order
       FROM plans ${whereClause}
       ORDER BY sort_order ASC, price_monthly_inr ASC`
    );

    if (!res.rows.length) {
      return DEFAULT_PLANS;
    }

    return res.rows.map((r) => parsePlanRow(r as Record<string, unknown>));
  } catch (err) {
    console.warn('[siteConfigServer] getSubscriptionPlans fallback:', err);
    return DEFAULT_PLANS;
  }
}

export async function getPlanByIdOrSlug(rawPlanId: string): Promise<SubscriptionPlanRecord | null> {
  const normalized = rawPlanId.toLowerCase().replace(/-/g, '_').trim();
  const plans = await getSubscriptionPlans({ includeInactive: true });
  return plans.find((p) => p.id === normalized || p.slug === normalized) || null;
}

export async function upsertSubscriptionPlan(input: {
  id: string;
  name?: string;
  badge?: string;
  description?: string;
  priceMonthlyInr?: number;
  priceYearlyInr?: number;
  storageLimitBytes?: number;
  retentionDays?: number;
  maxFileSizeBytes?: number;
  features?: string[];
  isRecommended?: boolean;
  isActive?: boolean;
}): Promise<SubscriptionPlanRecord> {
  if (!pool) {
    throw new Error('Database connection unavailable.');
  }
  await ensureSiteConfigTables();

  const cleanId = input.id.toLowerCase().replace(/[^a-z0-9_]/g, '').trim();
  const existing = await getPlanByIdOrSlug(cleanId);
  if (!existing) {
    throw new Error(`Unknown plan identifier: ${input.id}`);
  }

  const priceMonthlyInr =
    cleanId === 'free'
      ? 0
      : Math.max(1, Math.round(Number(input.priceMonthlyInr ?? existing.priceMonthlyInr)));
  const priceYearlyInr =
    cleanId === 'free'
      ? 0
      : Math.max(1, Math.round(Number(input.priceYearlyInr ?? existing.priceYearlyInr)));
  const storageLimitBytes = Math.max(
    1024 * 1024,
    Math.round(Number(input.storageLimitBytes ?? existing.storageLimitBytes))
  );
  const retentionDays = Math.max(
    1,
    Math.min(3650, Math.round(Number(input.retentionDays ?? existing.retentionDays)))
  );
  const maxFileSizeBytes = Math.max(
    1024 * 1024,
    Math.round(Number(input.maxFileSizeBytes ?? existing.maxFileSizeBytes))
  );
  const features = Array.isArray(input.features)
    ? input.features.map((f) => String(f).trim()).filter(Boolean)
    : existing.features;

  const res = await pool.query(
    `UPDATE plans SET
      name = $2,
      badge = $3,
      description = $4,
      price_monthly_inr = $5,
      price_yearly_inr = $6,
      storage_limit_bytes = $7,
      retention_days = $8,
      max_file_size_bytes = $9,
      features = $10::jsonb,
      is_recommended = $11,
      is_active = $12,
      updated_at = NOW()
     WHERE id = $1
     RETURNING id, name, slug, tier, badge, description,
               price_monthly_inr, price_yearly_inr, storage_limit_bytes,
               retention_days, max_file_size_bytes, features,
               is_recommended, is_active, sort_order`,
    [
      existing.id,
      (input.name || existing.name).trim(),
      typeof input.badge === 'string' ? input.badge.trim() : existing.badge,
      typeof input.description === 'string' ? input.description.trim() : existing.description,
      priceMonthlyInr,
      priceYearlyInr,
      storageLimitBytes,
      retentionDays,
      maxFileSizeBytes,
      JSON.stringify(features),
      typeof input.isRecommended === 'boolean' ? input.isRecommended : existing.isRecommended,
      cleanId === 'free'
        ? true
        : typeof input.isActive === 'boolean'
          ? input.isActive
          : existing.isActive,
    ]
  );

  return parsePlanRow(res.rows[0] as Record<string, unknown>);
}

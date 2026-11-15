import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const databaseUrl = process.env.DATABASE_URL;
const pool = databaseUrl
  ? new Pool({
      connectionString: databaseUrl,
      ssl: { rejectUnauthorized: false },
    })
  : null;

export async function GET() {
  if (!pool) {
    return NextResponse.json([
      {
        id: 'free',
        name: 'Free',
        slug: 'free',
        price_monthly_inr: 0,
        price_yearly_inr: 0,
        storage_limit_bytes: 15728640,
        retention_days: 7,
        max_file_size_bytes: 15728640,
        is_recommended: false,
        features: ['15 MB Cloud Storage', '7-Day Data Retention', 'In-Browser Privacy Mode'],
      },
      {
        id: 'prime',
        name: 'Prime',
        slug: 'prime',
        price_monthly_inr: 49,
        price_yearly_inr: 499,
        storage_limit_bytes: 52428800,
        retention_days: 14,
        max_file_size_bytes: 26214400,
        is_recommended: false,
        features: ['50 MB Cloud Storage', '14-Day Retention', 'Priority Queue'],
      },
      {
        id: 'prime_plus',
        name: 'PrimePlus',
        slug: 'prime_plus',
        price_monthly_inr: 99,
        price_yearly_inr: 999,
        storage_limit_bytes: 104857600,
        retention_days: 30,
        max_file_size_bytes: 52428800,
        is_recommended: true,
        features: ['100 MB Cloud Storage', '30-Day Extended Retention', 'Parallel Processing'],
      },
      {
        id: 'prime_ultra',
        name: 'PrimeUltra',
        slug: 'prime_ultra',
        price_monthly_inr: 249,
        price_yearly_inr: 2499,
        storage_limit_bytes: 524288000,
        retention_days: 365,
        max_file_size_bytes: 104857600,
        is_recommended: false,
        features: ['500 MB Enterprise Storage', '365-Day Retention', 'VIP Support'],
      },
    ]);
  }

  try {
    const res = await pool.query(
      'SELECT id, name, slug, price_monthly_inr, price_yearly_inr, storage_limit_bytes, retention_days, max_file_size_bytes, features, is_recommended FROM plans WHERE is_active = true ORDER BY price_monthly_inr ASC'
    );
    return NextResponse.json(res.rows);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

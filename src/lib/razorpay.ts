import crypto from 'crypto';

export interface RazorpayPlanConfig {
  id: string;
  tier: 'Prime' | 'PrimePlus' | 'PrimeUltra';
  name: string;
  monthlyPriceInr: number;
  yearlyPriceInr: number;
  monthlyPaise: number;
  yearlyPaise: number;
  storageLimitBytes: number;
  fileSizeLimitBytes: number;
  retentionDays: number;
}

export const RAZORPAY_PLANS: Record<string, RazorpayPlanConfig> = {
  prime: {
    id: 'prime',
    tier: 'Prime',
    name: 'Prime',
    monthlyPriceInr: 49,
    yearlyPriceInr: 499,
    monthlyPaise: 4900,
    yearlyPaise: 49900,
    storageLimitBytes: 52428800, // 50 MB
    fileSizeLimitBytes: 26214400, // 25 MB
    retentionDays: 14,
  },
  prime_plus: {
    id: 'prime_plus',
    tier: 'PrimePlus',
    name: 'PrimePlus',
    monthlyPriceInr: 99,
    yearlyPriceInr: 999,
    monthlyPaise: 9900,
    yearlyPaise: 99900,
    storageLimitBytes: 104857600, // 100 MB
    fileSizeLimitBytes: 52428800, // 50 MB
    retentionDays: 30,
  },
  prime_ultra: {
    id: 'prime_ultra',
    tier: 'PrimeUltra',
    name: 'PrimeUltra',
    monthlyPriceInr: 249,
    yearlyPriceInr: 2499,
    monthlyPaise: 24900,
    yearlyPaise: 249900,
    storageLimitBytes: 524288000, // 500 MB
    fileSizeLimitBytes: 104857600, // 100 MB
    retentionDays: 365,
  },
};

export const getRazorpayKeyId = (): string => {
  return (
    process.env.RAZORPAY_KEY_ID ||
    process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ||
    ''
  ).trim();
};

export const getRazorpayKeySecret = (): string => {
  return (process.env.RAZORPAY_KEY_SECRET || '').trim();
};

/**
 * Creates an official order on Razorpay using their REST API.
 */
export async function createRazorpayOrder({
  amountPaise,
  receipt,
  notes,
}: {
  amountPaise: number;
  receipt: string;
  notes?: Record<string, string>;
}): Promise<{ id: string; amount: number; currency: string }> {
  const keyId = getRazorpayKeyId();
  const keySecret = getRazorpayKeySecret();

  if (!keyId || !keySecret) {
    throw new Error('Razorpay API keys are not configured on the server. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.');
  }

  const authHeader = `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}`;

  const res = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: authHeader,
    },
    body: JSON.stringify({
      amount: amountPaise,
      currency: 'INR',
      receipt: receipt.slice(0, 40),
      notes: notes || {},
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Razorpay Order creation failed: ${errorText}`);
  }

  return await res.json();
}

/**
 * Cryptographically verifies Razorpay payment signature using HMAC-SHA256.
 */
export function verifyRazorpaySignature({
  orderId,
  paymentId,
  signature,
}: {
  orderId: string;
  paymentId: string;
  signature: string;
}): boolean {
  const keySecret = getRazorpayKeySecret();
  if (!keySecret || !orderId || !paymentId || !signature) return false;

  const body = `${orderId}|${paymentId}`;
  const expectedSignature = crypto
    .createHmac('sha256', keySecret)
    .update(body)
    .digest('hex');

  try {
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'utf8'),
      Buffer.from(signature, 'utf8')
    );
  } catch {
    return false;
  }
}

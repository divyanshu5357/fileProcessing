'use client';

/**
 * Loads Razorpay Standard Checkout JS script in the browser.
 */
export function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve(false);
    if ((window as any).Razorpay) return resolve(true);

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export interface RazorpayCheckoutOptions {
  orderId: string;
  amount: number;
  currency: string;
  keyId?: string;
  planName: string;
  user?: {
    name?: string;
    email?: string;
  };
  onSuccess: (paymentResult: {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }) => void;
  onDismiss?: () => void;
}

/**
 * Launches the official Razorpay Checkout popup modal.
 */
export async function openRazorpayCheckout({
  orderId,
  amount,
  currency,
  keyId,
  planName,
  user,
  onSuccess,
  onDismiss,
}: RazorpayCheckoutOptions): Promise<void> {
  const loaded = await loadRazorpayScript();
  if (!loaded) {
    throw new Error('Failed to load Razorpay payment SDK. Please check your internet connection.');
  }

  const options = {
    key: keyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '',
    amount,
    currency,
    name: 'Gyanvatsala Workspace',
    description: `Upgrade to ${planName} Plan`,
    order_id: orderId,
    image: 'https://www.gyanvatsala.in/icon.svg',
    prefill: {
      name: user?.name || '',
      email: user?.email || '',
    },
    theme: {
      color: '#2563EB',
    },
    modal: {
      ondismiss: () => {
        if (onDismiss) onDismiss();
      },
    },
    handler: function (response: {
      razorpay_payment_id: string;
      razorpay_order_id: string;
      razorpay_signature: string;
    }) {
      onSuccess(response);
    },
  };

  const razorpayInstance = new (window as any).Razorpay(options);
  razorpayInstance.open();
}

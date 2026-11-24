import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Simple, Transparent Pricing — Free & Pro Plans | Gyanvatsala',
  description:
    'Explore Gyanvatsala plans. Start completely free with unlimited in-browser private processing and 15 MB cloud storage, or upgrade securely with Razorpay for extended retention and higher quotas.',
  keywords: [
    'Gyanvatsala pricing',
    'document workspace subscription',
    'PDF tools pricing',
    'Razorpay payment plans',
  ],
  alternates: {
    canonical: 'https://www.gyanvatsala.in/pricing',
  },
  openGraph: {
    title: 'Simple, Transparent Pricing — Free & Pro Plans | Gyanvatsala',
    description:
      'Start free or upgrade to Prime, PrimePlus, or PrimeUltra. Instant activation via Razorpay (UPI, Cards, NetBanking).',
    url: 'https://www.gyanvatsala.in/pricing',
    siteName: 'Gyanvatsala',
  },
};

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

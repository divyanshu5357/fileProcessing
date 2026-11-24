import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Simple, Transparent Pricing — Free & Pro Plans | Gyanvatsala',
  description:
    'Explore Gyanvatsala plans. Start completely free with private in-browser PDF and image processing, or upgrade cleanly for expanded cloud quota and extended retention.',
  keywords: [
    'Gyanvatsala pricing',
    'document workspace subscription',
    'PDF tools pricing',
    'cloud storage plans',
  ],
  alternates: {
    canonical: 'https://www.gyanvatsala.in/pricing',
  },
  openGraph: {
    title: 'Simple, Transparent Pricing — Free & Pro Plans | Gyanvatsala',
    description:
      'Start free or upgrade to Prime, PrimePlus, or PrimeUltra for expanded storage and unlimited heavy document tools.',
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

import { NextResponse } from 'next/server';
import { getSiteSettings, getSubscriptionPlans } from '@/lib/siteConfigServer';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [settings, plans] = await Promise.all([
      getSiteSettings(),
      getSubscriptionPlans({ includeInactive: false }),
    ]);

    return NextResponse.json(
      {
        paymentsEnabled: settings.paymentsEnabled,
        maintenanceMode: settings.maintenanceMode,
        announcementBanner: settings.announcementBanner,
        plans,
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to load subscription plans.';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

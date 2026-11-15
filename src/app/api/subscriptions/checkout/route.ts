import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { plan_id } = body;

    // During pre-payment launch, paid plans return coming_soon and strictly disable checkout
    if (plan_id && plan_id !== 'free') {
      return NextResponse.json(
        {
          status: 'coming_soon',
          is_pre_launch: true,
          plan_id,
          message:
            'Paid plans are coming soon. Razorpay payment gateway integration is currently in merchant verification review.',
        },
        { status: 200 }
      );
    }

    // Free plan activation handled via /api/subscriptions/activate-free
    return NextResponse.json({
      status: 'success',
      plan_id: 'free',
      message: 'Free plan active.',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

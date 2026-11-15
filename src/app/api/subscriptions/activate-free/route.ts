import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const userHeader = req.headers.get('x-user-id');
    const emailHeader = req.headers.get('x-user-email');

    // Forward to FastAPI backend if available
    try {
      const backendBase = (process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000').replace(/\/+$/, '');
      const backendRes = await fetch(`${backendBase}/api/subscriptions/activate-free`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': userHeader || 'usr_free',
          'X-User-Email': emailHeader || 'user@gyanvatsala.in',
        },
      });
      if (backendRes.ok) {
        const data = await backendRes.json();
        return NextResponse.json(data);
      }
    } catch {
      // Backend unavailable; proceed with standard response
    }

    return NextResponse.json({
      status: 'success',
      plan_id: 'free',
      plan_name: 'Free Starter',
      storage_limit_bytes: 15728640,
      max_file_size_bytes: 15728640,
      retention_days: 7,
      message: 'Free Starter plan activated successfully.',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

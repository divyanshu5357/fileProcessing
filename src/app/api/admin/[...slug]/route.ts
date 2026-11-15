import { NextRequest, NextResponse } from 'next/server';

const ADMIN_EMAILS = new Set([
  'fileprocess@gyanvatsala.in',
  'abhishek5357kumar@gmail.com',
  'admin@gyanvatsala.in',
  'divyanshu@gyanvatsala.in',
]);

const getBackendBase = () =>
  (process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000').replace(/\/+$/, '');

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  const { slug } = await params;
  const path = slug.join('/');
  const email = (req.headers.get('x-user-email') || '').toLowerCase();

  // Role-based access control check
  if (!email || !ADMIN_EMAILS.has(email)) {
    return NextResponse.json(
      { error: 'Forbidden: Administrative privileges required.' },
      { status: 403 }
    );
  }

  // Forward to FastAPI backend
  try {
    const backendUrl = `${getBackendBase()}/api/admin/${path}${req.nextUrl.search}`;
    const res = await fetch(backendUrl, {
      headers: {
        'X-User-Email': email,
        'X-User-Role': 'admin',
        'X-User-Id': req.headers.get('x-user-id') || 'usr_admin',
      },
    });

    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }

    return NextResponse.json(
      { error: `Backend responded with ${res.status}` },
      { status: res.status }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Backend administrative service temporarily unavailable.' },
      { status: 502 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  const { slug } = await params;
  const path = slug.join('/');
  const email = (req.headers.get('x-user-email') || '').toLowerCase();

  if (!email || !ADMIN_EMAILS.has(email)) {
    return NextResponse.json(
      { error: 'Forbidden: Administrative privileges required.' },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const backendUrl = `${getBackendBase()}/api/admin/${path}`;
    const res = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Email': email,
        'X-User-Role': 'admin',
        'X-User-Id': req.headers.get('x-user-id') || 'usr_admin',
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Backend administrative service temporarily unavailable.' },
      { status: 502 }
    );
  }
}

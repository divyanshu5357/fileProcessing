import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { verifyIsSoleAdmin } from '@/lib/adminSecurity';
import { ALL_PDF_TOOLS } from '@/lib/toolRegistry';
import { SITE_BASE_URL } from '@/lib/seoData';

const INDEXNOW_KEY = 'gvs2026indexnow89f4a2c1';

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user?.id || !session.user.email || !session.user.emailVerified) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isVerified = await verifyIsSoleAdmin({
      id: session.user.id,
      email: session.user.email,
    });
    if (!isVerified) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const urlList = [
      `${SITE_BASE_URL}/`,
      `${SITE_BASE_URL}/tools/pdf-editor`,
      `${SITE_BASE_URL}/tools/image-size-reducer`,
      `${SITE_BASE_URL}/tools/pdf-assembler`,
      `${SITE_BASE_URL}/tools/canvas-editor`,
      `${SITE_BASE_URL}/pdf`,
      `${SITE_BASE_URL}/scan-studio`,
      `${SITE_BASE_URL}/image-converter`,
      `${SITE_BASE_URL}/image-tools`,
      `${SITE_BASE_URL}/workspace`,
      `${SITE_BASE_URL}/pricing`,
      `${SITE_BASE_URL}/about`,
      `${SITE_BASE_URL}/privacy`,
      `${SITE_BASE_URL}/llms.txt`,
      ...ALL_PDF_TOOLS.map((t) => `${SITE_BASE_URL}/pdf/${t.id}`),
    ];

    const res = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({
        host: 'www.gyanvatsala.in',
        key: INDEXNOW_KEY,
        keyLocation: `${SITE_BASE_URL}/${INDEXNOW_KEY}.txt`,
        urlList,
      }),
    });

    const responseText = await res.text().catch(() => '');
    return NextResponse.json(
      {
        status: res.ok ? 'submitted' : 'rejected',
        httpStatus: res.status,
        submittedCount: urlList.length,
        detail: responseText || (res.ok ? 'Accepted by IndexNow' : 'Submission failed'),
      },
      { status: res.ok ? 200 : 502 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'IndexNow request failed.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

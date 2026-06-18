import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { rateLimit } from '@/lib/rate-limit';
import { getAllSettings, setSetting } from '@/lib/settings';
import { resetOpenwaConfig } from '@/lib/openwa';

export async function GET() {
  const session = await auth();
  const isAdmin = (session?.user as unknown as Record<string, unknown> | undefined)?.is_admin;
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const all = await getAllSettings();
  return NextResponse.json({
    openwa_api_url: all.openwa_api_url || process.env.OPENWA_API_URL || 'http://localhost:2785/api',
    openwa_api_key: all.openwa_api_key ? '••••' + all.openwa_api_key.slice(-4) : '',
    openwa_api_key_present: !!all.openwa_api_key || !!process.env.OPENWA_API_KEY,
    openwa_session: all.openwa_session || process.env.OPENWA_SESSION || 'nadur-bot',
    has_db_key: !!all.openwa_api_key,
  });
}

export async function PUT(req: Request) {
  const session = await auth();
  const isAdmin = (session?.user as unknown as Record<string, unknown> | undefined)?.is_admin;
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const ip = req.headers.get('x-forwarded-for') || 'anon';
  const { allowed } = rateLimit(`settings-update:${ip}`, 20, 60000);
  if (!allowed) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  try {
    const body = await req.json();
    const allowedKeys = ['openwa_api_url', 'openwa_api_key', 'openwa_session'];

    for (const [key, value] of Object.entries(body)) {
      if (allowedKeys.includes(key) && typeof value === 'string' && value.trim()) {
        await setSetting(key, value.trim());
      }
    }

    resetOpenwaConfig();

    return NextResponse.json({ success: true, message: 'Settings saved' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to save settings' }, { status: 500 });
  }
}

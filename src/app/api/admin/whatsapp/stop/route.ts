import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { rateLimit } from '@/lib/rate-limit';
import { getSessions, stopSession, clearSessionUuid } from '@/lib/openwa';

export async function POST(req: Request) {
  const session = await auth();
  const isAdmin = (session?.user as unknown as Record<string, unknown> | undefined)?.is_admin;
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const ip = req.headers.get('x-forwarded-for') || 'anon';
  const { allowed } = rateLimit(`whatsapp-stop:${ip}`, 5, 60000);
  if (!allowed) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  try {
    const sessionsRes = await getSessions();
    if (sessionsRes.error) {
      return NextResponse.json({ error: 'Cannot reach OpenWA server.' }, { status: 503 });
    }

    const allSessions = Array.isArray(sessionsRes) ? sessionsRes as any[] : [];
    const sessionName = process.env.OPENWA_SESSION || 'nadur-bot';
    const ourSession = allSessions.find((s: any) => s.name === sessionName);

    if (!ourSession) {
      return NextResponse.json({ message: 'No session to stop.' });
    }

    clearSessionUuid();
    const sessionId = ourSession.id || ourSession.sessionId;
    const result = await stopSession(sessionId);

    if (result.error) {
      return NextResponse.json({ error: result.error, message: 'Failed to stop session.' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Session stopped.' });
  } catch (error) {
    console.error('whatsapp-stop error:', error);
    return NextResponse.json({ error: 'Failed to stop session' }, { status: 500 });
  }
}

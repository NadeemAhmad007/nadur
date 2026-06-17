import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { rateLimit } from '@/lib/rate-limit';
import { getSessions, createSession, startSession, clearSessionUuid } from '@/lib/openwa';

export async function POST(req: Request) {
  const session = await auth();
  const isAdmin = (session?.user as unknown as Record<string, unknown> | undefined)?.is_admin;
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const ip = req.headers.get('x-forwarded-for') || 'anon';
  const { allowed } = rateLimit(`whatsapp-start:${ip}`, 5, 60000);
  if (!allowed) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  try {
    const sessionName = process.env.OPENWA_SESSION || 'nadur-bot';

    const sessionsRes = await getSessions();
    if (sessionsRes.error) {
      return NextResponse.json({ error: 'Cannot reach OpenWA server.' }, { status: 503 });
    }

    const allSessions = Array.isArray(sessionsRes) ? sessionsRes as any[] : [];
    let ourSession = allSessions.find((s: any) => s.name === sessionName);

    if (!ourSession) {
      const created = await createSession(sessionName);
      if (created.error) {
        return NextResponse.json({ error: 'Failed to create session.' }, { status: 500 });
      }
      ourSession = (created as any).data || created;
    }

    clearSessionUuid();
    const sessionId = ourSession.id || ourSession.sessionId;
    const isStarted = ourSession.status === 'started' || ourSession.status === 'qr_ready' || ourSession.status === 'connected' || ourSession.status === 'active';

    if (!isStarted) {
      const result = await startSession(sessionId);
      if (result.error) {
        return NextResponse.json({ error: result.error, message: 'Failed to start session.' }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true, message: 'Session started. Scan the QR code to connect.' });
  } catch (error) {
    console.error('whatsapp-start error:', error);
    return NextResponse.json({ error: 'Failed to start session' }, { status: 500 });
  }
}

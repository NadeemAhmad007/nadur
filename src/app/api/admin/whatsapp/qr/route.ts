import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { rateLimit } from '@/lib/rate-limit';
import { getQR, getSessions, createSession, startSession, clearSessionUuid } from '@/lib/openwa';

export async function GET(req: Request) {
  const session = await auth();
  const isAdmin = (session?.user as unknown as Record<string, unknown> | undefined)?.is_admin;
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const ip = req.headers.get('x-forwarded-for') || 'anon';
  const { allowed } = rateLimit(`whatsapp-qr:${ip}`, 10, 60000);
  if (!allowed) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  try {
    const sessionName = process.env.OPENWA_SESSION || 'nadur-bot';

    const sessionsRes = await getSessions();
    if (sessionsRes.error) {
      return NextResponse.json({ error: sessionsRes.error, message: 'Cannot reach OpenWA server.' }, { status: 503 });
    }

    const allSessions = Array.isArray(sessionsRes) ? sessionsRes as any[] : [];
    let ourSession = allSessions.find((s: any) => s.name === sessionName);

    if (!ourSession) {
      const created = await createSession(sessionName);
      if (created.error) {
        return NextResponse.json({ error: created.error, message: 'Failed to create session.' }, { status: 500 });
      }
      ourSession = (created as any).data || created;
    }

    clearSessionUuid();

    const sessionId = ourSession.id || ourSession.sessionId;
    if (!sessionId) {
      return NextResponse.json({ error: 'No session ID found.' }, { status: 500 });
    }

    const isStarted = ourSession.status === 'started' || ourSession.status === 'qr_ready' || ourSession.status === 'connected' || ourSession.status === 'active';
    if (!isStarted) {
      const started = await startSession(sessionId);
      if (started.error) {
        return NextResponse.json({ error: started.error, message: 'Failed to start session.' }, { status: 500 });
      }
    }

    const qrRes = await getQR();
    if (qrRes.error) {
      return NextResponse.json({ error: qrRes.error, message: 'Failed to get QR code.' }, { status: 500 });
    }

    const qrData = (qrRes as any).qrCode || (qrRes as any).qr || qrRes.data;
    const qrBase64 = typeof qrData === 'string'
      ? (qrData.startsWith('data:') ? qrData : `data:image/png;base64,${qrData}`)
      : null;

    return NextResponse.json({
      qr: qrBase64,
      sessionId,
      sessionName,
    });
  } catch (error) {
    console.error('whatsapp-qr error:', error);
    return NextResponse.json({ error: 'Failed to get QR code' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { rateLimit } from '@/lib/rate-limit';
import { getSessionStatus, getSessions, clearSessionUuid } from '@/lib/openwa';

export async function GET(req: Request) {
  const session = await auth();
  const isAdmin = (session?.user as unknown as Record<string, unknown> | undefined)?.is_admin;
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const ip = req.headers.get('x-forwarded-for') || 'anon';
  const { allowed } = rateLimit(`whatsapp-status:${ip}`, 30, 60000);
  if (!allowed) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  try {
    const sessionsRes = await getSessions();
    if (sessionsRes.error) {
      return NextResponse.json({
        connected: false,
        error: sessionsRes.error,
        message: 'Cannot reach OpenWA server. Is it running?',
      });
    }

    const allSessions = Array.isArray(sessionsRes) ? sessionsRes as any[] : [];
    const sessionName = process.env.OPENWA_SESSION || 'nadur-bot';
    const ourSession = allSessions.find((s: any) => s.name === sessionName);

    if (!ourSession) {
      return NextResponse.json({
        connected: false,
        sessionExists: false,
        sessionName,
        message: 'Session not created yet.',
      });
    }

    clearSessionUuid();
    const statusRes = await getSessionStatus();

    if (statusRes.error) {
      return NextResponse.json({
        connected: false,
        sessionExists: true,
        sessionName,
        sessionId: ourSession.id,
        status: ourSession.status,
        message: 'Session exists but cannot get status.',
      });
    }

    const data = (statusRes.data || statusRes) as Record<string, unknown>;
    const status = (data.status as string) || 'unknown';
    const isConnected = status === 'connected' || status === 'active' || status === 'ready';

    const me = data.me as Record<string, unknown> | undefined;
    return NextResponse.json({
      connected: isConnected,
      sessionExists: true,
      sessionName,
      sessionId: ourSession.id,
      status,
      phone: (data.phone as string) || (me?.id as string) || null,
      pushname: (data.pushname as string) || (me?.name as string) || null,
      message: isConnected ? 'WhatsApp is connected and ready.' : `Session status: ${status}`,
    });
  } catch (error) {
    console.error('whatsapp-status error:', error);
    return NextResponse.json({ error: 'Failed to check status' }, { status: 500 });
  }
}

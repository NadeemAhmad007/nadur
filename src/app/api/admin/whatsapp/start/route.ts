import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { rateLimit } from '@/lib/rate-limit';
import { getSessions, createSession, startSession, deleteSession, clearSessionUuid } from '@/lib/openwa';
import { getOpenwaConfig } from '@/lib/settings';

const ACTIVE_STATUSES = ['started', 'qr_ready', 'ready', 'connected', 'active'];
const FAILED_STATUSES = ['failed'];

export async function POST() {
  const session = await auth();
  const isAdmin = (session?.user as unknown as Record<string, unknown> | undefined)?.is_admin;
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const config = await getOpenwaConfig();
    const sessionName = config.sessionName;

    const sessionsRes = await getSessions();
    if (sessionsRes.error) {
      return NextResponse.json({ error: sessionsRes.error, message: 'Cannot reach OpenWA server.' }, { status: 503 });
    }

    const allSessions = Array.isArray(sessionsRes) ? sessionsRes as any[] : [];
    let ourSession = allSessions.find((s: any) => s.name === sessionName);

    if (ourSession && FAILED_STATUSES.includes(ourSession.status)) {
      await deleteSession(ourSession.id);
      ourSession = null;
    }

    if (!ourSession) {
      const created = await createSession(sessionName);
      if (created.error) {
        return NextResponse.json({ error: created.error, message: 'Failed to create session on OpenWA.' }, { status: 500 });
      }
      ourSession = (created as any).data || created;
    }

    clearSessionUuid();
    const sessionId = ourSession.id || ourSession.sessionId;
    const isReady = ACTIVE_STATUSES.includes(ourSession.status);

    if (!isReady) {
      const result = await startSession(sessionId);
      if (result.error) {
        return NextResponse.json({ error: result.error, message: 'OpenWA rejected session start. Check your API key.' }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true, message: 'Session started. Scan the QR code to connect.' });
  } catch (error: any) {
    console.error('whatsapp-start error:', error);
    return NextResponse.json({ error: error.message || 'Failed to start session' }, { status: 500 });
  }
}

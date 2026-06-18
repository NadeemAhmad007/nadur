import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getSessions, createSession, clearSessionUuid } from '@/lib/openwa';
import { getOpenwaConfig } from '@/lib/settings';

export async function POST() {
  const session = await auth();
  const isAdmin = (session?.user as unknown as Record<string, unknown> | undefined)?.is_admin;
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const config = await getOpenwaConfig();
    const sessionName = config.sessionName;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://nadur-mu.vercel.app';
    const webhookUrl = `${appUrl}/api/whatsapp-webhook`;

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

    return NextResponse.json({
      success: true,
      webhookUrl,
      message: 'Configure this URL as the webhook in your OpenWA session settings.',
      sessionId,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to get webhook URL' }, { status: 500 });
  }
}

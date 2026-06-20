import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { rateLimit } from '@/lib/rate-limit';
import { sendText } from '@/lib/openwa';
import { getClientIp } from '@/lib/ip';

export async function POST(req: Request) {
  const session = await auth();
  const isAdmin = (session?.user as unknown as Record<string, unknown> | undefined)?.is_admin;
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const ip = getClientIp(req);
  const { allowed } = await rateLimit(`whatsapp-test:${ip}`, 5, 60000);
  if (!allowed) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  try {
    const { phone, message } = await req.json();

    if (!phone || !message) {
      return NextResponse.json({ error: 'Phone and message are required' }, { status: 400 });
    }

    const result = await sendText(phone, message);

    if (result.error) {
      return NextResponse.json({ error: result.error, message: 'Failed to send message.' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Test message sent.' });
  } catch (error) {
    console.error('whatsapp-test error:', error);
    return NextResponse.json({ error: 'Failed to send test message' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { db } from '@/db';
import { phoneVerifications } from '@/db/schema';
import { sendOtp } from '@/lib/openwa';
import { hashOtp } from '@/lib/otp';
import { rateLimit } from '@/lib/rate-limit';
import { getClientIp } from '@/lib/ip';

function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const { allowed } = await rateLimit(`send-otp-whatsapp:${ip}`, 3, 60000);
  if (!allowed) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  try {
    const { phone } = await req.json();

    if (!phone || typeof phone !== 'string') {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }

    const otp = generateOtp();

    await db.insert(phoneVerifications).values({
      phone,
      otp: await hashOtp(otp),
      expires_at: new Date(Date.now() + 5 * 60 * 1000),
    });

    const result = await sendOtp(phone, otp);
    if (result.error) {
      console.error(`[send-otp-whatsapp] OpenWA delivery failed for ${phone}: ${result.error}`);
      return NextResponse.json({ error: 'Failed to send OTP via WhatsApp. Try email OTP instead.', useEmail: true }, { status: 502 });
    }

    return NextResponse.json({ sent: true });
  } catch (error) {
    console.error('send-otp-whatsapp error:', error);
    return NextResponse.json({ error: 'Failed to send OTP' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { db } from '@/db';
import { phoneVerifications } from '@/db/schema';
import { sendOtp } from '@/lib/openwa';

function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function POST(req: Request) {
  try {
    const { phone } = await req.json();

    if (!phone) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }

    const otp = generateOtp();

    await db.insert(phoneVerifications).values({
      phone,
      otp,
      expires_at: new Date(Date.now() + 5 * 60 * 1000),
    });

    const result = await sendOtp(phone, otp);
    if (result.error) {
      console.error(`[send-otp-whatsapp] OpenWA delivery failed for ${phone}: ${result.error}`);
      console.log(`[DEV] Fallback — OTP for ${phone}: ${otp}`);
    }

    return NextResponse.json({ sent: true, devOtp: process.env.NODE_ENV === 'development' ? otp : undefined });
  } catch (error) {
    console.error('send-otp-whatsapp error:', error);
    return NextResponse.json({ error: 'Failed to send OTP' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { db } from '@/db';
import { emailVerifications, operators } from '@/db/schema';
import { sendOtpEmail } from '@/lib/resend';
import { hashOtp } from '@/lib/otp';
import { rateLimit } from '@/lib/rate-limit';
import { eq } from 'drizzle-orm';

function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for') || 'anon';
  const { allowed } = rateLimit(`send-otp:${ip}`, 3, 60000);
  if (!allowed) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  try {
    const { email } = await req.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const isBackfilled = email.endsWith('@kashmir360.com');
    if (isBackfilled) {
      const op = await db.query.operators.findFirst({
        where: eq(operators.email, email),
        columns: { id: true },
      });
      if (op) {
        return NextResponse.json({
          error: 'This account uses WhatsApp login. Sign in with your phone number instead.',
          useWhatsapp: true,
        }, { status: 400 });
      }
    }

    const otp = generateOtp();

    await db.insert(emailVerifications).values({
      email,
      otp: await hashOtp(otp),
      expires_at: new Date(Date.now() + 5 * 60 * 1000),
    });

    console.log(`[DEV] OTP for ${email}: ${otp}`);

    await sendOtpEmail(email, otp);

    return NextResponse.json({ sent: true });
  } catch (error) {
    console.error('send-otp error:', error);
    return NextResponse.json({ error: 'Failed to send OTP' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { db } from '@/db';
import { emailVerifications, operators } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { sendOtpEmail } from '@/lib/resend';

function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const otp = generateOtp();

    await db.insert(emailVerifications).values({
      email,
      otp,
      expires_at: new Date(Date.now() + 5 * 60 * 1000),
    });

    console.log(`[DEV] OTP for ${email}: ${otp}`);

    const isBackfilled = email.endsWith('@nadur.com');

    let backfilledOtp: string | null = null;
    if (isBackfilled) {
      const op = await db.query.operators.findFirst({
        where: eq(operators.email, email),
        columns: { id: true },
      });
      if (op) {
        backfilledOtp = otp;
      }
    }

    await sendOtpEmail(email, otp);

    return NextResponse.json({ sent: true, backfilledOtp });
  } catch (error) {
    console.error('send-otp error:', error);
    return NextResponse.json({ error: 'Failed to send OTP' }, { status: 500 });
  }
}

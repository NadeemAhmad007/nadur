import { NextResponse } from 'next/server';
import { db } from '@/db';
import { operators, emailVerifications } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { sendOtpEmail } from '@/lib/resend';

function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function POST(req: Request) {
  try {
    const { phone } = await req.json();

    if (!phone) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }

    const stored = await db.query.operators.findFirst({
      where: eq(operators.whatsapp, phone),
      columns: { email: true },
    });

    if (!stored || !stored.email) {
      return NextResponse.json({ success: false, error: 'No account found with this phone number' });
    }

    const otp = generateOtp();

    await db.insert(emailVerifications).values({
      email: stored.email,
      otp,
      expires_at: new Date(Date.now() + 5 * 60 * 1000),
    });

    console.log(`[DEV] Forgot-email OTP for ${stored.email}: ${otp}`);

    await sendOtpEmail(stored.email, otp);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('lookup-email error:', error);
    return NextResponse.json({ error: 'Lookup failed' }, { status: 500 });
  }
}

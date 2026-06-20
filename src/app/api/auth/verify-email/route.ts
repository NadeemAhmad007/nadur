import { NextResponse } from 'next/server';
import { verifyEmailOtp } from '@/lib/otp';
import { db } from '@/db';
import { operators } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { rateLimit } from '@/lib/rate-limit';
import { getClientIp } from '@/lib/ip';

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const { allowed } = await rateLimit(`verify-email:${ip}`, 5, 60000);
  if (!allowed) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  try {
    const { email, otp, operatorId } = await req.json();

    if (!email || !otp || !operatorId) {
      return NextResponse.json({ error: 'Email, OTP, and operator ID are required' }, { status: 400 });
    }

    const result = await verifyEmailOtp(email, otp);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 401 });
    }

    await db
      .update(operators)
      .set({ email, verified: true })
      .where(eq(operators.id, operatorId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('verify-email error:', error);
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}

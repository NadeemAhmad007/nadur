import { NextResponse } from 'next/server';
import { db } from '@/db';
import { emailVerifications, operators } from '@/db/schema';
import { and, eq, gt } from 'drizzle-orm';

export async function POST(req: Request) {
  try {
    const { email, otp, operatorId } = await req.json();

    if (!email || !otp || !operatorId) {
      return NextResponse.json({ error: 'Email, OTP, and operator ID are required' }, { status: 400 });
    }

    const record = await db.query.emailVerifications.findFirst({
      where: and(
        eq(emailVerifications.email, email),
        eq(emailVerifications.otp, otp),
        eq(emailVerifications.verified, false),
        gt(emailVerifications.expires_at, new Date()),
      ),
      orderBy: (ev, { desc }) => [desc(ev.created_at)],
    });

    if (!record) {
      return NextResponse.json({ error: 'Invalid or expired OTP' }, { status: 401 });
    }

    await db
      .update(emailVerifications)
      .set({ verified: true })
      .where(eq(emailVerifications.id, record.id));

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

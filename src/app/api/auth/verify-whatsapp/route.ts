import { NextResponse } from 'next/server';
import { db } from '@/db';
import { phoneVerifications } from '@/db/schema';
import { and, eq, gt } from 'drizzle-orm';

export async function POST(req: Request) {
  try {
    const { phone, otp } = await req.json();

    if (!phone || !otp) {
      return NextResponse.json({ error: 'Phone and OTP are required' }, { status: 400 });
    }

    const record = await db.query.phoneVerifications.findFirst({
      where: and(
        eq(phoneVerifications.phone, phone),
        eq(phoneVerifications.otp, otp),
        eq(phoneVerifications.verified, false),
        gt(phoneVerifications.expires_at, new Date()),
      ),
      orderBy: (pv, { desc }) => [desc(pv.created_at)],
    });

    if (!record) {
      return NextResponse.json({ error: 'Invalid or expired OTP' }, { status: 401 });
    }

    await db
      .update(phoneVerifications)
      .set({ verified: true })
      .where(eq(phoneVerifications.id, record.id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('verify-whatsapp error:', error);
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}

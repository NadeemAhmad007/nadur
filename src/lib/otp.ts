import { db } from '@/db';
import { emailVerifications, phoneVerifications } from '@/db/schema';
import { and, eq, gt } from 'drizzle-orm';

export async function hashOtp(otp: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(otp);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function verifyEmailOtp(email: string, otp: string) {
  const hashed = await hashOtp(otp);

  const record = await db.query.emailVerifications.findFirst({
    where: and(
      eq(emailVerifications.email, email),
      eq(emailVerifications.verified, false),
      gt(emailVerifications.expires_at, new Date()),
    ),
    orderBy: (ev, { desc }) => [desc(ev.created_at)],
  });

  if (!record) {
    return { success: false as const, error: 'Invalid or expired OTP' };
  }

  const attempts = record.attempts ?? 0;
  if (attempts >= 3) {
    return { success: false as const, error: 'Too many attempts. Request a new OTP.' };
  }

  const isValid = record.otp === hashed;

  if (!isValid) {
    await db
      .update(emailVerifications)
      .set({ attempts: attempts + 1 })
      .where(eq(emailVerifications.id, record.id));
    return { success: false as const, error: 'Invalid or expired OTP' };
  }

  await db
    .update(emailVerifications)
    .set({ verified: true })
    .where(eq(emailVerifications.id, record.id));

  return { success: true as const };
}

export async function verifyPhoneOtp(phone: string, otp: string) {
  const hashed = await hashOtp(otp);

  const record = await db.query.phoneVerifications.findFirst({
    where: and(
      eq(phoneVerifications.phone, phone),
      eq(phoneVerifications.verified, false),
      gt(phoneVerifications.expires_at, new Date()),
    ),
    orderBy: (pv, { desc }) => [desc(pv.created_at)],
  });

  if (!record) {
    return { success: false as const, error: 'Invalid or expired OTP' };
  }

  const attempts = record.attempts ?? 0;
  if (attempts >= 3) {
    return { success: false as const, error: 'Too many attempts. Request a new OTP.' };
  }

  const isValid = record.otp === hashed;

  if (!isValid) {
    await db
      .update(phoneVerifications)
      .set({ attempts: attempts + 1 })
      .where(eq(phoneVerifications.id, record.id));
    return { success: false as const, error: 'Invalid or expired OTP' };
  }

  await db
    .update(phoneVerifications)
    .set({ verified: true })
    .where(eq(phoneVerifications.id, record.id));

  return { success: true as const };
}

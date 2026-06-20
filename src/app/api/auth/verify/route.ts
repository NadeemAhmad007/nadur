import { NextResponse } from 'next/server';
import { verifyEmailOtp } from '@/lib/otp';
import { rateLimit } from '@/lib/rate-limit';
import { db } from '@/db';
import { operators } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getClientIp } from '@/lib/ip';

const adminEmails = (process.env.ADMIN_EMAILS || 'nadeemkolu22@gmail.com').split(',').map(e => e.trim());

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const { allowed } = await rateLimit(`verify-otp:${ip}`, 5, 60000);
  if (!allowed) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  try {
    const { email, otp } = await req.json();

    if (!email || !otp) {
      return NextResponse.json({ error: 'Email and OTP are required' }, { status: 400 });
    }

    const result = await verifyEmailOtp(email, otp);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 401 });
    }

    let is_admin = false;
    let operator_id: string | null = null;

    if (adminEmails.includes(email)) {
      is_admin = true;
    } else {
      const op = await db.query.operators.findFirst({
        where: eq(operators.email, email),
        columns: { id: true },
      });
      if (op) {
        operator_id = op.id;
      } else {
        return NextResponse.json({ error: 'No account found with this email. Please register first.' }, { status: 404 });
      }
    }

    return NextResponse.json({ success: true, is_admin, operator_id });
  } catch (error) {
    console.error('verify-otp error:', error);
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}

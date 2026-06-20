import { NextResponse } from 'next/server';
import { verifyPhoneOtp } from '@/lib/otp';
import { rateLimit } from '@/lib/rate-limit';
import { db } from '@/db';
import { operators } from '@/db/schema';
import { eq } from 'drizzle-orm';

const adminEmails = (process.env.ADMIN_EMAILS || 'nadeemkolu22@gmail.com').split(',').map(e => e.trim());

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for') || 'anon';
  const { allowed } = await rateLimit(`verify-whatsapp:${ip}`, 5, 60000);
  if (!allowed) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  try {
    const { phone, otp } = await req.json();

    if (!phone || !otp) {
      return NextResponse.json({ error: 'Phone and OTP are required' }, { status: 400 });
    }

    const result = await verifyPhoneOtp(phone, otp);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 401 });
    }

    let is_admin = false;
    let operator_id: string | null = null;

    const op = await db.query.operators.findFirst({
      where: eq(operators.whatsapp, phone),
      columns: { id: true, email: true },
    });

    if (op) {
      operator_id = op.id;
      if (op.email && adminEmails.includes(op.email)) {
        is_admin = true;
      }
    } else {
      return NextResponse.json({ error: 'No account found with this phone number. Please register first.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, is_admin, operator_id });
  } catch (error) {
    console.error('verify-whatsapp error:', error);
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}

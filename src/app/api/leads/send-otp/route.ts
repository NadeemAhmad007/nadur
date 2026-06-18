import { NextResponse } from 'next/server';
import { db } from '@/db';
import { operators, phoneVerifications } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { sendOtp } from '@/lib/openwa';
import { hashOtp } from '@/lib/otp';
import { rateLimit } from '@/lib/rate-limit';

function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function validatePhone(phone: string): string | null {
  const digits = phone.replace(/[^0-9]/g, '');
  if (digits.length < 5) return 'Phone number must have at least 5 digits';
  return null;
}

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for') || 'anon';
  const { allowed } = rateLimit(`lead-send-otp:${ip}`, 5, 60000);
  if (!allowed) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  try {
    const { operator_id, visitor_name, visitor_phone } = await req.json();

    if (!operator_id || !visitor_name || !visitor_phone) {
      return NextResponse.json({ error: 'operator_id, visitor_name, and visitor_phone are required' }, { status: 400 });
    }

    const phoneErr = validatePhone(visitor_phone);
    if (phoneErr) {
      return NextResponse.json({ error: phoneErr }, { status: 400 });
    }

    const op = await db.query.operators.findFirst({
      where: eq(operators.id, operator_id),
      columns: { plan: true, lead_month: true, name: true, whatsapp: true },
    });

    if (!op) {
      return NextResponse.json({ error: 'Operator not found' }, { status: 404 });
    }

    if (op.plan !== 'pro') {
      return NextResponse.json({ error: 'OTP verification is only available for pro operators' }, { status: 400 });
    }

    const otp = generateOtp();

    await db.insert(phoneVerifications).values({
      phone: visitor_phone,
      otp: await hashOtp(otp),
      expires_at: new Date(Date.now() + 5 * 60 * 1000),
    });

    const result = await sendOtp(visitor_phone, otp);
    if (result.error) {
      console.error(`[leads/send-otp] OpenWA delivery failed for ${visitor_phone}: ${result.error}`);
      console.log(`[DEV] Fallback — OTP for ${visitor_phone}: ${otp}`);
    }

    return NextResponse.json({ sent: true });
  } catch (error) {
    console.error('leads/send-otp error:', error);
    return NextResponse.json({ error: 'Failed to send OTP' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { db } from '@/db';
import { operators, leads } from '@/db/schema';
import { eq, sql, and, gte } from 'drizzle-orm';
import { verifyPhoneOtp } from '@/lib/otp';
import { notifyLead } from '@/lib/openwa';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for') || 'anon';
  const { allowed } = await rateLimit(`lead-verify-otp:${ip}`, 10, 60000);
  if (!allowed) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  try {
    const { operator_id, visitor_name, visitor_phone, otp } = await req.json();

    if (!operator_id || !visitor_name || !visitor_phone || !otp) {
      return NextResponse.json({ error: 'operator_id, visitor_name, visitor_phone, and otp are required' }, { status: 400 });
    }

    const verified = await verifyPhoneOtp(visitor_phone, otp);
    if (!verified.success) {
      return NextResponse.json({ error: verified.error }, { status: 400 });
    }

    const op = await db.query.operators.findFirst({
      where: eq(operators.id, operator_id),
      columns: { plan: true, lead_month: true, whatsapp: true, name: true },
    });

    if (!op) {
      return NextResponse.json({ error: 'Operator not found' }, { status: 404 });
    }

    if (op.plan !== 'pro') {
      return NextResponse.json({ error: 'OTP verification is only available for pro operators' }, { status: 400 });
    }

    const firstOfMonth = new Date();
    firstOfMonth.setDate(1);
    firstOfMonth.setHours(0, 0, 0, 0);

    const leadsThisMonth = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(leads)
      .where(and(
        eq(leads.operator_id, operator_id),
        gte(leads.created_at, firstOfMonth),
      ));

    const monthCount = Number(leadsThisMonth[0]?.count ?? 0);
    const proLimit = Number(process.env.PRO_MONTHLY_LEADS || 100);

    if (monthCount >= proLimit) {
      return NextResponse.json({ blocked: true }, { status: 200 });
    }

    const session_id = req.headers.get('x-session-id') || crypto.randomUUID();

    await db.insert(leads).values({ operator_id, session_id, source: 'profile', visitor_name, visitor_phone });
    await db.update(operators).set({ lead_month: monthCount + 1 }).where(eq(operators.id, operator_id));

    notifyLead(op.whatsapp, op.name, visitor_name, visitor_phone).catch((err) => {
      console.error(`[leads/verify-otp] Failed to notify operator ${op.name}:`, err);
    });

    const adminNotify = process.env.KASHEER360_ADMIN_WHATSAPP;
    if (adminNotify && adminNotify !== op.whatsapp) {
      notifyLead(adminNotify, op.name, visitor_name, visitor_phone, true).catch((err) => {
        console.error(`[leads/verify-otp] Failed to notify admin:`, err);
      });
    }

    const waUrl = `https://wa.me/${op.whatsapp}?text=${encodeURIComponent(`Hi! I found you on Kasheer360. I'm interested in your services.`)}`;

    return NextResponse.json({ ok: true, whatsapp: op.whatsapp, waUrl });
  } catch (error) {
    console.error('leads/verify-otp error:', error);
    return NextResponse.json({ error: 'Failed to verify OTP' }, { status: 500 });
  }
}

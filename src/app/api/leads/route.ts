import { NextResponse } from 'next/server';
import { db } from '@/db';
import { operators, leads } from '@/db/schema';
import { eq, sql, and, gte } from 'drizzle-orm';
import { notifyLead, sendText } from '@/lib/openwa';
import { auth } from '@/lib/auth';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for') || 'anon';
  const { allowed } = rateLimit(`lead-create:${ip}`, 10, 60000);
  if (!allowed) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  try {
    const { operator_id, source, visitor_name, visitor_phone } = await req.json();

    if (!operator_id) {
      return NextResponse.json({ error: 'operator_id is required' }, { status: 400 });
    }

    if (visitor_phone) {
      const digits = visitor_phone.replace(/[^0-9]/g, '');
      if (digits.length < 5) {
        return NextResponse.json({ error: 'Invalid phone number' }, { status: 400 });
      }
    }

    const session_id = req.headers.get('x-session-id') || crypto.randomUUID();

    const op = await db.query.operators.findFirst({
      where: eq(operators.id, operator_id),
      columns: { plan: true, lead_month: true, whatsapp: true, name: true },
    });

    if (!op) {
      return NextResponse.json({ error: 'Operator not found' }, { status: 404 });
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
    const overflow = op.plan === 'free' && monthCount >= 3;

    await db.insert(leads).values({ operator_id, session_id, source: source || 'profile', visitor_name, visitor_phone });
    await db.update(operators).set({ lead_month: monthCount + 1 }).where(eq(operators.id, operator_id));

    if (overflow) {
      const adminNotify = process.env.KASHMIR360_ADMIN_WHATSAPP;
      if (adminNotify) {
        notifyLead(adminNotify, op.name, visitor_name, visitor_phone, true).catch((err) => {
          console.error(`[leads] Failed to notify admin of overflow:`, err);
        });
      }
      sendText(op.whatsapp, `You've received ${monthCount + 1} enquiries this month! Upgrade to Pro to receive lead details directly. Contact the admin to upgrade.`).catch((err) => {
        console.error(`[leads] Failed to send upsell to operator ${op.name}:`, err);
      });
    } else {
      notifyLead(op.whatsapp, op.name, visitor_name, visitor_phone).catch((err) => {
        console.error(`[leads] Failed to notify operator ${op.name} (${op.whatsapp}):`, err);
      });

      const adminNotify = process.env.KASHMIR360_ADMIN_WHATSAPP;
      if (adminNotify && adminNotify !== op.whatsapp) {
        notifyLead(adminNotify, op.name, visitor_name, visitor_phone, true).catch((err) => {
          console.error(`[leads] Failed to notify admin:`, err);
        });
      }
    }

    return NextResponse.json({ ok: true, overflow });
  } catch (error) {
    console.error('leads POST error:', error);
    return NextResponse.json({ error: 'Failed to submit lead' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const sUser = session.user as unknown as Record<string, unknown>;
  const operatorId = sUser?.operator_id;
  const isAdmin = sUser?.is_admin;

  const { searchParams } = new URL(req.url);
  const operator_id = searchParams.get('operator_id');

  const targetOperatorId = operator_id || (operatorId as string);

  if (!targetOperatorId) {
    return NextResponse.json({ error: 'operator_id required' }, { status: 400 });
  }

  if (!isAdmin && targetOperatorId !== operatorId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const result = await db
      .select({ id: leads.id, created_at: leads.created_at, source: leads.source, visitor_name: leads.visitor_name, visitor_phone: leads.visitor_phone })
      .from(leads)
      .where(eq(leads.operator_id, targetOperatorId))
      .orderBy(leads.created_at)
      .limit(50);

    return NextResponse.json(result);
  } catch (error) {
    console.error('[leads GET]', error);
    return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 });
  }
}

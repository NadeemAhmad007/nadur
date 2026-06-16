import { NextResponse } from 'next/server';
import { db } from '@/db';
import { operators, leads } from '@/db/schema';
import { eq, sql, and, gte } from 'drizzle-orm';
import { notifyLead } from '@/lib/openwa';

export async function POST(req: Request) {
  try {
    const { operator_id, source } = await req.json();
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

    if (op.plan === 'free' && monthCount >= 3) {
      return NextResponse.json({ blocked: true });
    }

    await db.insert(leads).values({ operator_id, session_id, source: source || 'profile' });
    await db.update(operators).set({ lead_month: monthCount + 1 }).where(eq(operators.id, operator_id));

    notifyLead(op.whatsapp, op.name).catch((err) => {
      console.error(`[leads] Failed to notify operator ${op.name} (${op.whatsapp}):`, err);
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('leads POST error:', error);
    return NextResponse.json({ ok: true });
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const operator_id = searchParams.get('operator_id');

  if (!operator_id) {
    return NextResponse.json({ error: 'operator_id required' }, { status: 400 });
  }

  const result = await db
    .select({ id: leads.id, created_at: leads.created_at, source: leads.source })
    .from(leads)
    .where(eq(leads.operator_id, operator_id))
    .orderBy(leads.created_at)
    .limit(50);

  return NextResponse.json(result);
}

import { NextResponse } from 'next/server';
import { db } from '@/db';
import { leads, operators } from '@/db/schema';
import { eq, sql, gte } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { rateLimit } from '@/lib/rate-limit';

export async function GET(req: Request) {
  const session = await auth();
  const sUser = session?.user as unknown as Record<string, unknown> | undefined;
  if (!sUser?.is_admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const ip = req.headers.get('x-forwarded-for') || 'admin-leads';
  const { allowed } = await rateLimit(`admin-leads:${ip}`, 30);
  if (!allowed) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const { searchParams } = new URL(req.url);
  const operator_id = searchParams.get('operator_id');

  if (operator_id) {
    const result = await db
      .select({
        id: leads.id,
        created_at: leads.created_at,
        source: leads.source,
        visitor_name: leads.visitor_name,
        visitor_phone: leads.visitor_phone,
      })
      .from(leads)
      .where(eq(leads.operator_id, operator_id))
      .orderBy(leads.created_at)
      .limit(50);
    return NextResponse.json(result);
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const totalLeads = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(leads);

  const todayLeads = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(leads)
    .where(gte(leads.created_at, today));

  const byOperator = await db
    .select({
      operator_id: leads.operator_id,
      name: operators.name,
      count: sql<number>`COUNT(*)`,
    })
    .from(leads)
    .innerJoin(operators, eq(leads.operator_id, operators.id))
    .groupBy(leads.operator_id, operators.name)
    .orderBy(sql`count desc`);

  return NextResponse.json({
    total: Number(totalLeads[0]?.count ?? 0),
    today: Number(todayLeads[0]?.count ?? 0),
    byOperator,
  });
}

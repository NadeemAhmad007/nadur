import { NextResponse } from 'next/server';
import { db } from '@/db';
import { operators } from '@/db/schema';
import { eq, asc, or, like, and } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { rateLimit } from '@/lib/rate-limit';

export async function GET(req: Request) {
  const session = await auth();
  const sUser = session?.user as unknown as Record<string, unknown> | undefined;
  if (!sUser?.is_admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const ip = req.headers.get('x-forwarded-for') || 'admin-ops';
  const { allowed } = rateLimit(`admin-ops:${ip}`, 30);
  if (!allowed) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const category = searchParams.get('category');
  const plan = searchParams.get('plan');
  const hidden = searchParams.get('hidden');
  const q = searchParams.get('q');

  let query = db.select().from(operators).$dynamic();
  const filters: any[] = [];

  if (status) {
    filters.push(eq(operators.status, status as any));
  }
  if (category) {
    filters.push(eq(operators.category, category as any));
  }
  if (plan) {
    filters.push(eq(operators.plan, plan as any));
  }
  if (hidden === 'true') {
    filters.push(eq(operators.hidden, true));
  } else if (hidden === 'false') {
    filters.push(eq(operators.hidden, false));
  }
  if (q) {
    filters.push(
      or(
        like(operators.name, `%${q}%`),
        like(operators.whatsapp, `%${q}%`),
        like(operators.email, `%${q}%`),
        like(operators.slug, `%${q}%`),
      ),
    );
  }

  if (filters.length > 0) {
    query = query.where(and(...filters));
  }

  const result = await query.orderBy(asc(operators.created_at));
  return NextResponse.json(result);
}

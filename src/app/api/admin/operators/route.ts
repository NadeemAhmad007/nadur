import { NextResponse } from 'next/server';
import { db } from '@/db';
import { operators } from '@/db/schema';
import { eq, asc, or, like, and } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { rateLimit } from '@/lib/rate-limit';
import { getClientIp } from '@/lib/ip';

export async function GET(req: Request) {
  const session = await auth();
  const sUser = session?.user as unknown as Record<string, unknown> | undefined;
  if (!sUser?.is_admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const ip = getClientIp(req);
  const { allowed } = await rateLimit(`admin-ops:${ip}`, 30);
  if (!allowed) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  const status = searchParams.get('status');
  const category = searchParams.get('category');
  const plan = searchParams.get('plan');
  const hidden = searchParams.get('hidden');
  const q = searchParams.get('q');

  let query = db.select({
    id: operators.id,
    created_at: operators.created_at,
    updated_at: operators.updated_at,
    user_id: operators.user_id,
    slug: operators.slug,
    name: operators.name,
    category: operators.category,
    short_desc: operators.short_desc,
    long_desc: operators.long_desc,
    whatsapp: operators.whatsapp,
    email: operators.email,
    pricing_note: operators.pricing_note,
    status: operators.status,
    hidden: operators.hidden,
    verified: operators.verified,
    plan: operators.plan,
    lead_month: operators.lead_month,
    photos: operators.photos,
    tariffs: operators.tariffs,
    houseboat_details: operators.houseboat_details,
    shikara_details: operators.shikara_details,
    artisan_details: operators.artisan_details,
    taxi_details: operators.taxi_details,
    accommodation_details: operators.accommodation_details,
    guide_details: operators.guide_details,
    vendor_details: operators.vendor_details,
    lat: operators.lat,
    lng: operators.lng,
  }).from(operators).$dynamic();
  const filters: any[] = [];

  if (id) {
    filters.push(eq(operators.id, id));
  }
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

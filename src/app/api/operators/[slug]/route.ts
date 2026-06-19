import { NextResponse } from 'next/server';
import { db } from '@/db';
import { operators } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { sendText } from '@/lib/openwa';
import { rateLimit } from '@/lib/rate-limit';

export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const op = await db.query.operators.findFirst({
    where: eq(operators.slug, slug),
    columns: {
      id: true, created_at: true, updated_at: true, user_id: true,
      slug: true, name: true, category: true, short_desc: true,
      long_desc: true, whatsapp: true, email: true, pricing_note: true,
      status: true, hidden: true, verified: true, plan: true,
      lead_month: true, photos: true, tariffs: true,
      houseboat_details: true, shikara_details: true, artisan_details: true, taxi_details: true,
      accommodation_details: true, guide_details: true, vendor_details: true,
      lat: true, lng: true,
    },
  });

  if (!op || (op.status !== 'approved' && op.status !== 'pending')) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json(op);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const ip = req.headers.get('x-forwarded-for') || 'anon';
  const { allowed } = rateLimit(`update-op:${ip}`, 10, 60000);
  if (!allowed) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { slug } = await params;
  const body = await req.json();

  const existing = await db.query.operators.findFirst({
    where: eq(operators.slug, slug),
    columns: { id: true },
  });

  if (!existing) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const sUser = session.user as unknown as Record<string, unknown>;
  const operatorId = sUser?.operator_id;
  const isAdmin = sUser?.is_admin;

  if (operatorId !== existing.id && !isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const updateData: Record<string, unknown> = {};

  if (body.name !== undefined) updateData.name = body.name;
  if (body.short_desc !== undefined) updateData.short_desc = body.short_desc;
  if (body.long_desc !== undefined) updateData.long_desc = body.long_desc;
  if (body.pricing_note !== undefined) updateData.pricing_note = body.pricing_note;
  if (body.whatsapp !== undefined) updateData.whatsapp = body.whatsapp;
  if (body.email !== undefined) updateData.email = body.email;
  if (body.photos !== undefined) {
    updateData.photos = body.photos;
    updateData.status = 'pending';
  }
  if (body.tariffs !== undefined) {
    updateData.tariffs = body.tariffs;
    updateData.status = 'pending';
  }
  if (body.houseboat_details !== undefined) {
    updateData.houseboat_details = body.houseboat_details;
    updateData.status = 'pending';
  }
  if (body.shikara_details !== undefined) {
    updateData.shikara_details = body.shikara_details;
    updateData.status = 'pending';
  }
  if (body.artisan_details !== undefined) {
    updateData.artisan_details = body.artisan_details;
    updateData.status = 'pending';
  }
  if (body.taxi_details !== undefined) {
    updateData.taxi_details = body.taxi_details;
    updateData.status = 'pending';
  }
  if (body.accommodation_details !== undefined) {
    updateData.accommodation_details = body.accommodation_details;
    updateData.status = 'pending';
  }
  if (body.guide_details !== undefined) {
    updateData.guide_details = body.guide_details;
    updateData.status = 'pending';
  }
  if (body.vendor_details !== undefined) {
    updateData.vendor_details = body.vendor_details;
    updateData.status = 'pending';
  }
  if (body.lat !== undefined) {
    updateData.lat = body.lat;
    updateData.status = 'pending';
  }
  if (body.lng !== undefined) {
    updateData.lng = body.lng;
    updateData.status = 'pending';
  }

  const result = await db
    .update(operators)
    .set(updateData)
    .where(eq(operators.slug, slug))
    .returning();

  if (!result.length) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const updatedOp = result[0];
  const adminPhone = process.env.KASHEER360_ADMIN_WHATSAPP;
  if (adminPhone) {
    sendText(
      adminPhone,
      `✏️ Profile Updated on Kasheer360\n\nName: ${updatedOp.name}\nCategory: ${updatedOp.category}\nWhatsApp: ${updatedOp.whatsapp}\nStatus: ${updatedOp.status}\n\nView: https://kasheer360.com/admin/operators/${updatedOp.id}`,
    ).catch((err) => console.error('[operators] Failed to notify admin of edit:', err));
  }

  return NextResponse.json(result[0]);
}

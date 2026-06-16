import { NextResponse } from 'next/server';
import { db } from '@/db';
import { operators } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const op = await db.query.operators.findFirst({
    where: eq(operators.slug, slug),
  });

  if (!op || (op.status !== 'approved' && op.status !== 'pending')) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json(op);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const body = await req.json();

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
  if (body.lat !== undefined) updateData.lat = body.lat;
  if (body.lng !== undefined) updateData.lng = body.lng;

  const result = await db
    .update(operators)
    .set(updateData)
    .where(eq(operators.slug, slug))
    .returning();

  if (!result.length) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json(result[0]);
}

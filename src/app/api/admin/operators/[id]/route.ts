import { NextResponse } from 'next/server';
import { db } from '@/db';
import { operators, leads, favorites } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const sUser = session?.user as unknown as Record<string, unknown> | undefined;
  if (!sUser?.is_admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const ip = req.headers.get('x-forwarded-for') || 'admin-op-action';
  const { allowed } = await rateLimit(`admin-op-action:${ip}`, 20);
  if (!allowed) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const { action } = body;

    if (action === 'delete') {
      await db.delete(leads).where(eq(leads.operator_id, id));
      await db.delete(favorites).where(eq(favorites.operator_id, id));
      const deleted = await db.delete(operators).where(eq(operators.id, id)).returning({ id: operators.id });
      if (!deleted.length) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
      }
      console.log(`[admin] deleted operator ${id}`);
      return NextResponse.json({ deleted: true });
    }

    const updateData: Record<string, unknown> = {};

    switch (action) {
      case 'approve':
        updateData.status = 'approved';
        break;
      case 'reject':
        updateData.status = 'rejected';
        break;
      case 'suspend':
        updateData.status = 'suspended';
        break;
      case 'verify':
        updateData.verified = body.verified;
        break;
      case 'category':
        updateData.category = body.category;
        break;
      case 'change_plan':
        updateData.plan = body.plan;
        break;
      case 'update_email':
        updateData.email = body.email;
        break;
      case 'toggle_hidden':
        updateData.hidden = body.hidden;
        break;
      case 'reset_leads':
        updateData.lead_month = 0;
        break;
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const result = await db
      .update(operators)
      .set(updateData)
      .where(eq(operators.id, id))
      .returning();

    if (!result.length) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    if (action === 'reset_leads') {
      const deleted = await db.delete(leads).where(eq(leads.operator_id, id)).returning({ id: leads.id });
      console.log(`[admin] reset_leads: deleted ${deleted.length} leads for operator ${id}`);
      return NextResponse.json({ ...result[0], deleted_count: deleted.length });
    }

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('[admin] operator action failed:', error);
    return NextResponse.json({ error: 'Action failed' }, { status: 500 });
  }
}

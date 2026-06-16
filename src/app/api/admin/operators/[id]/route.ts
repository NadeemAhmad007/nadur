import { NextResponse } from 'next/server';
import { db } from '@/db';
import { operators } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const { action } = body;

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

  return NextResponse.json(result[0]);
}

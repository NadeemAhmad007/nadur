import { NextResponse } from 'next/server';
import { db } from '@/db';
import { operators } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(req: Request) {
  try {
    const { phone } = await req.json();
    if (!phone) {
      return NextResponse.json({ error: 'Phone is required' }, { status: 400 });
    }
    const existing = await db.query.operators.findFirst({
      where: eq(operators.whatsapp, phone),
      columns: { id: true, name: true, slug: true, status: true },
    });
    return NextResponse.json({ exists: !!existing, operator: existing || null });
  } catch {
    return NextResponse.json({ error: 'Failed to check WhatsApp' }, { status: 500 });
  }
}

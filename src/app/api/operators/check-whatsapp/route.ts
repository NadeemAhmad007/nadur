import { NextResponse } from 'next/server';
import { db } from '@/db';
import { operators } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for') || 'anon';
  const { allowed } = rateLimit(`check-whatsapp:${ip}`, 10, 60000);
  if (!allowed) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

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

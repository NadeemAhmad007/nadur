import { NextResponse } from 'next/server';
import { db } from '@/db';
import { operators } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for') || 'anon';
  const { allowed } = rateLimit(`lookup-email:${ip}`, 5, 60000);
  if (!allowed) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  try {
    const { phone } = await req.json();

    if (!phone || typeof phone !== 'string') {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }

    const stored = await db.query.operators.findFirst({
      where: eq(operators.whatsapp, phone),
      columns: { email: true },
    });

    return NextResponse.json({
      success: true,
      found: !!(stored && stored.email),
    });
  } catch (error) {
    console.error('lookup-email error:', error);
    return NextResponse.json({ error: 'Lookup failed' }, { status: 500 });
  }
}

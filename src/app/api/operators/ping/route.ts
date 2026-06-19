import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { operators } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function PATCH() {
  const session = await auth();
  const sUser = session?.user as unknown as Record<string, unknown> | undefined;
  const operatorId = sUser?.operator_id as string | undefined;

  if (!operatorId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await db.update(operators)
    .set({ last_seen: new Date() })
    .where(eq(operators.id, operatorId));

  return NextResponse.json({ ok: true });
}

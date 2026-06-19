import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { adminMessages, operators } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  const sUser = session?.user as unknown as Record<string, unknown> | undefined;
  const operatorId = sUser?.operator_id as string | undefined;

  if (!operatorId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  await db.update(adminMessages)
    .set({ read_at: new Date() })
    .where(and(
      eq(adminMessages.id, id),
      eq(adminMessages.operator_id, operatorId),
    ));

  return NextResponse.json({ ok: true });
}

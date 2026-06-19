import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { adminMessages } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET() {
  const session = await auth();
  const sUser = session?.user as unknown as Record<string, unknown> | undefined;
  const operatorId = sUser?.operator_id as string | undefined;

  if (!operatorId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const rows = await db.query.adminMessages.findMany({
    where: eq(adminMessages.operator_id, operatorId),
    orderBy: [desc(adminMessages.created_at)],
    limit: 50,
  });

  const unread = rows.filter(m => !m.read_at).length;
  return NextResponse.json({ messages: rows, unread });
}

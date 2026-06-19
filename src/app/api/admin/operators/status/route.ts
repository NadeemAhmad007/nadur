import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { operators } from '@/db/schema';
import { sql } from 'drizzle-orm';

export async function GET() {
  const session = await auth();
  const sUser = session?.user as unknown as Record<string, unknown> | undefined;
  if (!sUser?.is_admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const result = await db.execute(sql`
    SELECT id, last_seen,
      CASE WHEN last_seen IS NULL THEN 'offline'
           WHEN last_seen > NOW() - INTERVAL '5 minutes' THEN 'online'
           WHEN last_seen > NOW() - INTERVAL '1 hour' THEN 'recent'
           ELSE 'offline'
      END as online_status
    FROM operators
  `);

  const rows = result.rows || result;
  const map: Record<string, string> = {};
  for (const r of rows as Array<{id: string; online_status: string}>) {
    map[r.id] = r.online_status;
  }

  return NextResponse.json(map);
}

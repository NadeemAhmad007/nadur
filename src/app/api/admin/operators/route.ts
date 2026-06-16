import { NextResponse } from 'next/server';
import { db } from '@/db';
import { operators } from '@/db/schema';
import { eq, asc } from 'drizzle-orm';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');

  let query = db.select().from(operators).$dynamic();

  if (status) {
    query = query.where(eq(operators.status, status as any));
  }

  const result = await query.orderBy(asc(operators.created_at));
  return NextResponse.json(result);
}

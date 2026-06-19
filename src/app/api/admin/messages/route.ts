import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { adminMessages, operators } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { sendText } from '@/lib/openwa';

export async function GET(req: NextRequest) {
  const session = await auth();
  const sUser = session?.user as unknown as Record<string, unknown> | undefined;
  if (!sUser?.is_admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const operatorId = searchParams.get('operator_id');

  const where = operatorId ? eq(adminMessages.operator_id, operatorId) : undefined;
  const rows = await db.query.adminMessages.findMany({
    where,
    orderBy: [desc(adminMessages.created_at)],
    limit: 100,
  });

  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const sUser = session?.user as unknown as Record<string, unknown> | undefined;
  if (!sUser?.is_admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { operator_id, message } = await req.json();
  if (!operator_id || !message?.trim()) {
    return NextResponse.json({ error: 'operator_id and message are required' }, { status: 400 });
  }

  const op = await db.query.operators.findFirst({
    where: eq(operators.id, operator_id),
    columns: { verified: true, whatsapp: true },
  });

  if (!op) {
    return NextResponse.json({ error: 'Operator not found' }, { status: 404 });
  }

  const row = await db.insert(adminMessages).values({
    operator_id,
    message: message.trim(),
    sent_by: session!.user?.email || 'admin',
  }).returning();

  // Forward message to operator's WhatsApp via OpenWA
  if (op.whatsapp) {
    const waMsg = `📩 *Message from Kashmir360 Admin*\n\n${message.trim()}`;
    sendText(op.whatsapp, waMsg).catch((err) =>
      console.error('[admin/messages] WhatsApp delivery failed:', err)
    );
  }

  return NextResponse.json(row[0], { status: 201 });
}

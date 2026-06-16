import { db } from '@/db';
import { operators } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { OperatorProfile } from '@/components/operator-profile';

export const dynamic = 'force-dynamic';

export default async function OperatorPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const op = await db.query.operators.findFirst({
    where: eq(operators.slug, slug),
  });

  if (!op || (op.status !== 'approved' && op.status !== 'pending')) {
    notFound();
  }

  return <OperatorProfile operator={op} />;
}

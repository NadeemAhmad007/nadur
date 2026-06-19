import { db } from '@/db';
import { operators } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { notFound, redirect } from 'next/navigation';
import { OperatorProfile } from '@/components/operator-profile';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const op = await db.query.operators.findFirst({
    where: eq(operators.slug, slug),
    columns: { name: true, short_desc: true, photos: true },
  });
  return {
    title: op?.name ?? 'Operator',
    description: op?.short_desc ?? 'View profile on Kasheer360',
    openGraph: {
      title: op?.name,
      description: op?.short_desc ?? undefined,
      images: op?.photos?.[0] ? [op.photos[0]] : undefined,
    },
  };
}

export default async function OperatorPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const op = await db.query.operators.findFirst({
    where: eq(operators.slug, slug),
  });

  if (!op) {
    notFound();
  }

  if (op.status === 'suspended') {
    redirect('/suspended');
  }

  if (op.status !== 'approved' && op.status !== 'pending') {
    notFound();
  }

  return <OperatorProfile operator={op} />;
}

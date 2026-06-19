import { db } from '@/db';
import { operators } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { notFound, redirect } from 'next/navigation';
import { OperatorProfile } from '@/components/operator-profile';
import type { Metadata } from 'next';
import type { Operator } from '@/types';

export const dynamic = 'force-dynamic';

const categoryServiceMap: Record<string, string> = {
  houseboat: 'Houseboat Rental',
  shikara: 'Shikara Ride',
  artisan: 'Handicraft Sales',
  guide: 'Tour Guide Service',
  vendor: 'Floating Vendor Service',
  taxi: 'Taxi & Transfers',
  homestay: 'Homestay Accommodation',
  guest_house: 'Guest House Accommodation',
};

function operatorSchema(op: Operator) {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: op.name,
    description: op.short_desc || undefined,
    url: `https://kasheer360.com/o/${op.slug}`,
    image: op.photos?.[0] || undefined,
    telephone: op.whatsapp,
    email: op.email || undefined,
    makesOffer: {
      '@type': 'Offer',
      name: categoryServiceMap[op.category || ''] || 'Kashmir Travel Service',
      offeredBy: { '@type': 'LocalBusiness', name: op.name },
    },
  };
  if (op.verified) {
    schema.aggregateRating = { '@type': 'AggregateRating', ratingValue: '5', bestRating: '5', ratingCount: '1' };
  }
  return schema;
}

function breadcrumbSchema(slug: string, name: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://kasheer360.com' },
      { '@type': 'ListItem', position: 2, name: 'Browse', item: 'https://kasheer360.com/' },
      { '@type': 'ListItem', position: 3, name, item: `https://kasheer360.com/o/${slug}` },
    ],
  };
}

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

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(operatorSchema(op)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema(slug, op.name)) }}
      />
      <OperatorProfile operator={op} />
    </>
  );
}

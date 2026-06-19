import type { MetadataRoute } from 'next';
import { db } from '@/db';
import { operators } from '@/db/schema';
import { eq } from 'drizzle-orm';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://kasheer360.com';

  const allOperators = await db.query.operators.findMany({
    where: eq(operators.hidden, false),
    columns: { slug: true, updated_at: true },
  });

  const operatorEntries: MetadataRoute.Sitemap = allOperators.map((op) => ({
    url: `${baseUrl}/operators/${op.slug}`,
    lastModified: op.updated_at || new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/search`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/join`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    ...operatorEntries,
  ];
}

import { db } from '@/db';
import { operators } from '@/db/schema';
import { eq } from 'drizzle-orm';
import * as fs from 'fs';

async function main() {
  const existing = await db.select({ name: operators.name }).from(operators).where(eq(operators.category, 'houseboat'));
  const existingNames = new Set(existing.map(h => h.name.toLowerCase().trim()));

  const raw = fs.readFileSync('/tmp/houseboats_to_import.json', 'utf-8');
  const all: any[] = JSON.parse(raw);

  const usedSlugs = new Set(existing.map(h =>
    h.name.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_]+/g, '-').replace(/^-+|-+$/g, '').substring(0, 100)
  ));

  let inserted = 0;
  let skipped = 0;

  for (const rec of all) {
    const key = rec.name.toLowerCase().trim();
    if (existingNames.has(key)) {
      skipped++;
      continue;
    }

    let slug = rec.slug;
    while (usedSlugs.has(slug)) {
      slug = rec.slug + '-' + Math.random().toString(36).substring(2, 6);
    }
    usedSlugs.add(slug);

    await db.insert(operators).values({
      ...rec,
      slug,
      whatsapp: rec.whatsapp || '+910000000000',
      name: rec.name || 'Unknown',
    });

    inserted++;
    if (inserted % 50 === 0) console.log(`Progress: ${inserted} inserted (${skipped} skipped)...`);
  }

  console.log(`\nDone! Inserted: ${inserted}, Skipped (already in DB): ${skipped}`);
}

main().catch(console.error);

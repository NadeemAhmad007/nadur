import fs from 'fs';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);
const operators: any[] = JSON.parse(fs.readFileSync('/tmp/taxi_seed.json', 'utf-8'));

async function main() {
  let inserted = 0;
  let skipped = 0;

  for (const op of operators) {
    try {
      await sql`
        INSERT INTO operators (slug, name, category, short_desc, whatsapp, lat, lng, status, hidden, verified, plan, lead_month)
        VALUES (${op.slug}, ${op.name}, ${op.category}, ${op.short_desc}, ${op.whatsapp},
                ${op.lat}, ${op.lng}, ${op.status}, ${op.hidden}, ${op.verified}, ${op.plan}, ${op.lead_month})
        ON CONFLICT (slug) DO NOTHING
      `;
      inserted++;
    } catch (e: any) {
      console.error(`Failed: ${op.name} — ${e.message || e}`);
      skipped++;
    }
  }

  console.log(`Done. Inserted: ${inserted}, Skipped: ${skipped}`);
}

main().catch(console.error);

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './src/db/schema.js';

const sql = neon('postgresql://neondb_owner:npg_aVrZX4e0NwMP@ep-patient-cake-aof26mzr-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require');

const db = drizzle(sql, { schema });

try {
  const result = await db.insert(schema.operators).values({
    name: 'Test Houseboat',
    category: 'houseboat',
    whatsapp: '+919999999999',
    slug: 'test-houseboat-' + Date.now(),
    status: 'pending',
  }).returning();
  console.log('Success:', JSON.stringify(result));
} catch (e) {
  console.error('Error:', e.message);
  console.error('Stack:', e.stack?.substring(0, 1000));
}

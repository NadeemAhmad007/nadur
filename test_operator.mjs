import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './src/db/schema.js';

const sql = neon(process.env.DATABASE_URL || 'postgresql://user:password@localhost/db');

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

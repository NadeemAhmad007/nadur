import { neon } from '@neondatabase/serverless';
import fs from 'fs';
const env = fs.readFileSync('.env', 'utf-8');
const dbUrl = env.split('\n').find(l => l.startsWith('DATABASE_URL=')).slice('DATABASE_URL='.length);
const sql = neon(dbUrl);
await sql`CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at TIMESTAMPTZ DEFAULT NOW())`;
console.log('settings table created');

import { db } from '@/db';
import { settings } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function getSetting(key: string): Promise<string | null> {
  const row = await db.query.settings.findFirst({
    where: eq(settings.key, key),
  });
  return row?.value ?? null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  await db
    .insert(settings)
    .values({ key, value })
    .onConflictDoUpdate({ target: settings.key, set: { value } });
}

export async function deleteSetting(key: string): Promise<void> {
  await db.delete(settings).where(eq(settings.key, key));
}

export async function getAllSettings(): Promise<Record<string, string>> {
  const rows = await db.select().from(settings);
  const map: Record<string, string> = {};
  for (const row of rows) {
    map[row.key] = row.value;
  }
  return map;
}

export async function getOpenwaConfig() {
  const all = await getAllSettings();
  return {
    apiUrl: all.openwa_api_url || process.env.OPENWA_API_URL || 'http://localhost:2785/api',
    apiKey: all.openwa_api_key || process.env.OPENWA_API_KEY || '',
    sessionName: all.openwa_session || process.env.OPENWA_SESSION || 'nadur-bot',
  };
}

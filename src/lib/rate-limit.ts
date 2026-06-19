import { db } from '@/db';
import { rateLimits } from '@/db/schema';
import { eq, lt } from 'drizzle-orm';
import { sql } from 'drizzle-orm';

export async function rateLimit(key: string, max: number, windowMs: number = 60000): Promise<{ allowed: boolean; remaining: number }> {
  const now = new Date();

  await db.delete(rateLimits).where(lt(rateLimits.expires_at, now));

  const existing = await db.query.rateLimits.findFirst({
    where: eq(rateLimits.key, key),
  });

  if (!existing || now > existing.expires_at) {
    const expiresAt = new Date(now.getTime() + windowMs);
    await db.insert(rateLimits).values({ key, count: 1, expires_at: expiresAt }).onConflictDoUpdate({
      target: rateLimits.key,
      set: { count: 1, expires_at: expiresAt },
    });
    return { allowed: true, remaining: max - 1 };
  }

  if (existing.count >= max) {
    return { allowed: false, remaining: 0 };
  }

  await db.update(rateLimits)
    .set({ count: existing.count + 1 })
    .where(eq(rateLimits.key, key));

  return { allowed: true, remaining: max - existing.count - 1 };
}

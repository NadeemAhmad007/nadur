'use client';

const CACHE_KEY = 'pexels_cache';
const CACHE_TTL = 24 * 60 * 60 * 1000;

interface CacheEntry {
  url: string;
  ts: number;
}

export async function fetchCategoryPhoto(category: string, location?: string): Promise<string | null> {
  const cacheKey = `${CACHE_KEY}_${category}_${location || ''}`;
  try {
    const raw = localStorage.getItem(cacheKey);
    if (raw) {
      const entry: CacheEntry = JSON.parse(raw);
      if (Date.now() - entry.ts < CACHE_TTL) return entry.url;
      localStorage.removeItem(cacheKey);
    }
  } catch { }

  try {
    const params = new URLSearchParams({ category });
    if (location) params.set('location', location);
    const res = await fetch(`/api/photos?${params}`, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;
    const { photos } = await res.json();
    const url = photos?.[0]?.url || null;
    if (url) {
      try { localStorage.setItem(cacheKey, JSON.stringify({ url, ts: Date.now() })); } catch { }
    }
    return url;
  } catch { return null; }
}

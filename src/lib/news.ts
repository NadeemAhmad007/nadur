'use client';

export interface NewsItem {
  title: string;
  url: string;
  source: string;
  publishedAt: string;
}

const CACHE_KEY = 'kashmir_news_cache';
const CACHE_TTL = 10 * 60 * 1000;

function getCached(): NewsItem[] | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL) { localStorage.removeItem(CACHE_KEY); return null; }
    return data;
  } catch { return null; }
}

function setCached(data: NewsItem[]) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify({ data, ts: Date.now() })); } catch { }
}

export async function fetchNews(): Promise<NewsItem[]> {
  const cached = getCached();
  if (cached) return cached;

  try {
    const res = await fetch('/api/news', { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return [];
    const { articles } = await res.json();
    if (articles?.length > 0) {
      setCached(articles);
      return articles;
    }
    return [];
  } catch {
    return [];
  }
}

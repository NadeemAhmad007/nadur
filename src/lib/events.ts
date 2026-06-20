'use client';

interface EventItem {
  name: string;
  date: string;
  url: string;
  venue: string;
}

const CACHE_KEY = 'kashmir_events_cache';
const CACHE_TTL = 6 * 60 * 60 * 1000;

function getCached(): EventItem[] | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL) { localStorage.removeItem(CACHE_KEY); return null; }
    return data;
  } catch { return null; }
}

function setCached(data: EventItem[]) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify({ data, ts: Date.now() })); } catch { }
}

export async function fetchEvents(): Promise<EventItem[]> {
  const cached = getCached();
  if (cached) return cached;

  try {
    const res = await fetch('/api/events', { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return [];
    const { events } = await res.json();
    if (events?.length > 0) { setCached(events); return events; }
    return [];
  } catch { return []; }
}

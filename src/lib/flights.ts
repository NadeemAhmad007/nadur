'use client';

interface FlightData {
  count: number;
  flights: any[];
}

const CACHE_KEY = 'sxr_flights_cache';
const CACHE_TTL = 5 * 60 * 1000;

function getCached(): FlightData | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL) { localStorage.removeItem(CACHE_KEY); return null; }
    return data;
  } catch { return null; }
}

function setCached(data: FlightData) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify({ data, ts: Date.now() })); } catch { }
}

export async function fetchFlights(): Promise<FlightData | null> {
  const cached = getCached();
  if (cached) return cached;

  try {
    const res = await fetch('/api/flights', { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const data: FlightData = await res.json();
    if (data.count > 0) setCached(data);
    return data;
  } catch {
    return null;
  }
}

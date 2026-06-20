'use client';

interface Flight {
  icao24: string;
  estDepartureAirport: string | null;
  estArrivalAirport: string;
  firstSeen: number;
  lastSeen: number;
  callSign: string | null;
}

interface FlightData {
  count: number;
  flights: Flight[];
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

  const now = Math.floor(Date.now() / 1000);
  const begin = now - 86400 * 3;

  try {
    const res = await fetch(
      `https://opensky-network.org/api/flights/arrival?airport=VISR&begin=${begin}&end=${now}`,
      { signal: AbortSignal.timeout(8000) },
    );
    if (!res.ok) return null;
    const flights: Flight[] = await res.json();
    const data: FlightData = { count: flights.length, flights };
    if (data.count > 0) setCached(data);
    return data;
  } catch {
    return null;
  }
}

import { NextResponse } from 'next/server';

export async function GET() {
  const now = Math.floor(Date.now() / 1000);
  const begin = now - 86400 * 3;

  try {
    const res = await fetch(
      `https://opensky-network.org/api/flights/arrival?airport=VISR&begin=${begin}&end=${now}`,
      { signal: AbortSignal.timeout(10000) },
    );
    if (!res.ok) return NextResponse.json({ count: 0, flights: [] });
    const flights = await res.json();
    return NextResponse.json({ count: flights.length, flights });
  } catch {
    return NextResponse.json({ count: 0, flights: [] });
  }
}

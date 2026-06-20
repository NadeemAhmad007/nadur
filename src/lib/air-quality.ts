export interface AQIData {
  pm25: number | null;
  aqi: number | null;
  level: string;
  color: string;
  label: string;
}

function calcAQIpm25(pm25: number): number {
  const breakpoints = [
    { lo: 0, hi: 12, aqLo: 0, aqHi: 50 },
    { lo: 12.1, hi: 35.4, aqLo: 51, aqHi: 100 },
    { lo: 35.5, hi: 55.4, aqLo: 101, aqHi: 150 },
    { lo: 55.5, hi: 150.4, aqLo: 151, aqHi: 200 },
    { lo: 150.5, hi: 250.4, aqLo: 201, aqHi: 300 },
    { lo: 250.5, hi: 500, aqLo: 301, aqHi: 500 },
  ];

  for (const bp of breakpoints) {
    if (pm25 >= bp.lo && pm25 <= bp.hi) {
      return Math.round(
        ((bp.aqHi - bp.aqLo) / (bp.hi - bp.lo)) * (pm25 - bp.lo) + bp.aqLo,
      );
    }
  }
  return pm25 > 500 ? 500 : 0;
}

function aqiLevel(aqi: number): { level: string; color: string; label: string } {
  if (aqi <= 50) return { level: 'Good', color: '#22c55e', label: 'Good' };
  if (aqi <= 100) return { level: 'Moderate', color: '#eab308', label: 'Moderate' };
  if (aqi <= 150) return { level: 'Unhealthy for Sensitive Groups', color: '#f97316', label: 'Unhealthy (Sensitive)' };
  if (aqi <= 200) return { level: 'Unhealthy', color: '#ef4444', label: 'Unhealthy' };
  if (aqi <= 300) return { level: 'Very Unhealthy', color: '#7c3aed', label: 'Very Unhealthy' };
  return { level: 'Hazardous', color: '#881337', label: 'Hazardous' };
}

export async function fetchAQI(lat: number, lng: number): Promise<AQIData> {
  const fallback: AQIData = { pm25: null, aqi: null, level: 'Unknown', color: '#6b7280', label: 'No data' };

  try {
    const url = new URL('https://api.openaq.org/v2/latest');
    url.searchParams.set('coordinates', `${lat},${lng}`);
    url.searchParams.set('radius', '25000');
    url.searchParams.set('limit', '1');

    const res = await fetch(url.toString(), {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return fallback;

    const data = await res.json();
    const measurements = data.results?.[0]?.measurements;
    if (!measurements) return fallback;

    const pm25entry = measurements.find(
      (m: any) => m.parameter === 'pm25' && m.value != null,
    );
    if (!pm25entry) return fallback;

    const pm25 = pm25entry.value;
    const aqi = calcAQIpm25(pm25);
    const { level, color, label } = aqiLevel(aqi);

    return { pm25, aqi, level, color, label };
  } catch {
    return fallback;
  }
}

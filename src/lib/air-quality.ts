export interface AQIData {
  eaqi: number | null;
  pm25: number | null;
  pm10: number | null;
  level: string;
  color: string;
  label: string;
}

function eaqiLevel(eaqi: number): { level: string; color: string; label: string } {
  if (eaqi <= 20) return { level: 'Very Low', color: '#22c55e', label: 'Very Low' };
  if (eaqi <= 40) return { level: 'Low', color: '#86efac', label: 'Low' };
  if (eaqi <= 60) return { level: 'Medium', color: '#eab308', label: 'Medium' };
  if (eaqi <= 80) return { level: 'High', color: '#f97316', label: 'High' };
  return { level: 'Very High', color: '#ef4444', label: 'Very High' };
}

export async function fetchAQI(lat: number, lng: number): Promise<AQIData> {
  const fallback: AQIData = { eaqi: null, pm25: null, pm10: null, level: 'Unknown', color: '#6b7280', label: 'No data' };

  try {
    const url = new URL('https://air-quality-api.open-meteo.com/v1/air-quality');
    url.searchParams.set('latitude', String(lat));
    url.searchParams.set('longitude', String(lng));
    url.searchParams.set('current', 'european_aqi,pm2_5,pm10');

    const res = await fetch(url.toString(), { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return fallback;

    const data = await res.json();
    if (!data.current?.european_aqi && !data.current?.pm2_5) return fallback;

    const eaqi = data.current.european_aqi ?? null;
    const pm25 = data.current.pm2_5 ?? null;
    const pm10 = data.current.pm10 ?? null;

    const { level, color, label } = eaqi != null ? eaqiLevel(eaqi) : fallback;

    return { eaqi, pm25, pm10, level, color, label };
  } catch {
    return fallback;
  }
}

'use client';

interface Holiday {
  date: string;
  name: string;
  localName: string;
}

const CACHE_KEY = 'holidays_cache';
const CACHE_TTL = 6 * 60 * 60 * 1000;

function getCached(): Holiday[] | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL) { localStorage.removeItem(CACHE_KEY); return null; }
    return data;
  } catch { return null; }
}

function setCached(data: Holiday[]) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify({ data, ts: Date.now() })); } catch { }
}

const FALLBACK_HOLIDAYS: Holiday[] = [
  { date: '2026-01-26', name: 'Republic Day', localName: 'Republic Day' },
  { date: '2026-02-17', name: 'Maha Shivaratri', localName: 'Maha Shivaratri' },
  { date: '2026-03-21', name: 'Nowruz / Navroz', localName: 'Nowruz' },
  { date: '2026-03-31', name: 'Eid-ul-Fitr', localName: 'Eid-ul-Fitr' },
  { date: '2026-06-06', name: 'Eid-ul-Adha (Bakr-Id)', localName: 'Eid-ul-Adha' },
  { date: '2026-06-27', name: 'Islamic New Year (Muharram)', localName: 'Muharram' },
  { date: '2026-08-15', name: 'Independence Day', localName: 'Independence Day' },
  { date: '2026-09-05', name: 'Eid-e-Milad (Prophet\'s Birthday)', localName: 'Eid-e-Milad' },
  { date: '2026-10-02', name: 'Gandhi Jayanti', localName: 'Gandhi Jayanti' },
  { date: '2026-10-20', name: 'Diwali', localName: 'Diwali' },
  { date: '2026-11-24', name: 'Guru Nanak Jayanti', localName: 'Guru Nanak Jayanti' },
  { date: '2026-12-25', name: 'Christmas', localName: 'Christmas' },
];

export function getUpcomingHoliday(): Holiday | null {
  const cached = getCached();
  const holidays = cached ?? FALLBACK_HOLIDAYS;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcoming = holidays
    .map(h => ({ ...h, dt: new Date(h.date) }))
    .filter(({ dt }) => dt >= today)
    .sort((a, b) => a.dt.getTime() - b.dt.getTime());

  return upcoming.length > 0 ? upcoming[0] : null;
}

export async function fetchHolidays(): Promise<Holiday[]> {
  const cached = getCached();
  if (cached) return cached;

  try {
    const res = await fetch('https://calendarific.com/api/v2/holidays', {
      signal: AbortSignal.timeout(5000),
    });
    if (res.ok) {
      const data = await res.json();
      const holidays: Holiday[] = (data?.response?.holidays ?? []).map((h: any) => ({
        date: h.date.iso,
        name: h.name,
        localName: h.name,
      }));
      if (holidays.length > 0) setCached(holidays);
      return holidays;
    }
  } catch { }

  return FALLBACK_HOLIDAYS;
}

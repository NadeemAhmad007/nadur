let cachedRates: Record<string, number> | null = null;
let lastFetched = 0;
const CACHE_TTL = 3600_000;

export async function getExchangeRates(): Promise<Record<string, number> | null> {
  const now = Date.now();
  if (cachedRates && now - lastFetched < CACHE_TTL) return cachedRates;

  try {
    const res = await fetch('https://api.frankfurter.app/latest?from=INR');
    if (!res.ok) return cachedRates;
    const data = await res.json();
    cachedRates = data.rates;
    lastFetched = now;
    return cachedRates;
  } catch {
    return cachedRates;
  }
}

const FLAGS: Record<string, string> = {
  USD: '$', EUR: '€', GBP: '£', AED: 'د.إ',
};

const LABELS: Record<string, string> = {
  USD: 'USD', EUR: 'EUR', GBP: 'GBP', AED: 'AED',
};

export function formatConverted(inr: number, rates: Record<string, number> | null): { code: string; flag: string; value: string; label: string }[] {
  if (!rates) return [];
  return Object.entries(rates).map(([code, rate]) => ({
    code,
    flag: FLAGS[code] || code,
    value: (inr * rate).toFixed(code === 'AED' ? 1 : 0),
    label: LABELS[code] || code,
  }));
}

export const CURRENCIES = ['USD', 'EUR', 'GBP', 'AED'] as const;

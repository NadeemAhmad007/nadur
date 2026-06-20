const clientCache = new Map<string, string>();

export const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'hi', label: 'हिन्दी', flag: '🇮🇳' },
  { code: 'ur', label: 'اردو', flag: '🇵🇰' },
  { code: 'ar', label: 'العربية', flag: '🇸🇦' },
  { code: 'ks', label: 'कॉशुर', flag: '🇮🇳' },
] as const;

export type LanguageCode = (typeof LANGUAGES)[number]['code'];

export async function translateText(text: string, target: string, source = 'en'): Promise<string> {
  if (target === 'en' || !text.trim()) return text;

  const key = `${source}:${target}:${text}`;
  const cached = clientCache.get(key);
  if (cached) return cached;

  try {
    const res = await fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, target, source }),
    });
    if (!res.ok) return text;
    const data = await res.json();
    if (data.translated) {
      clientCache.set(key, data.translated);
      return data.translated;
    }
    return text;
  } catch {
    return text;
  }
}

export async function translateBatch(
  items: string[],
  target: string,
  source = 'en',
): Promise<string[]> {
  return Promise.all(items.map((t) => translateText(t, target, source)));
}

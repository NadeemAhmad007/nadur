import { NextResponse } from 'next/server';

const LT_URL = process.env.LIBRETRANSLATE_URL || 'http://localhost:5000';
const serverCache = new Map<string, string>();
const MAX_CACHE = 5000;

export async function POST(req: Request) {
  try {
    const { text, target, source = 'en' } = await req.json();

    if (!text || !target) {
      return NextResponse.json({ error: 'text and target are required' }, { status: 400 });
    }

    if (target === source) {
      return NextResponse.json({ translated: text });
    }

    const cacheKey = `${source}:${target}:${text}`;
    const cached = serverCache.get(cacheKey);
    if (cached) {
      return NextResponse.json({ translated: cached });
    }

    const res = await fetch(`${LT_URL}/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: text, source, target, format: 'text' }),
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) {
      console.warn(`[translate] LT returned ${res.status}, falling back to original`);
      return NextResponse.json({ translated: text });
    }

    const data = await res.json();
    const translated = data.translatedText || text;

    if (serverCache.size >= MAX_CACHE) serverCache.clear();
    serverCache.set(cacheKey, translated);

    return NextResponse.json({ translated });
  } catch (err) {
    console.warn('[translate] LT unreachable, returning original:', err);
    const { text } = await req.json().catch(() => ({ text: '' }));
    return NextResponse.json({ translated: text || '' });
  }
}

import { NextResponse } from 'next/server';

const GNEWS_API_KEY = process.env.GNEWS_API_KEY;

export async function GET() {
  if (!GNEWS_API_KEY) {
    return NextResponse.json({ articles: [] });
  }

  try {
    const res = await fetch(
      `https://gnews.io/api/v4/search?q=kashmir+tourism+travel&lang=en&country=in&max=10&apikey=${GNEWS_API_KEY}`,
      { signal: AbortSignal.timeout(6000) },
    );
    if (!res.ok) return NextResponse.json({ articles: [] });

    const data = await res.json();
    const articles = (data.articles ?? []).map((a: any) => ({
      title: a.title,
      url: a.url,
      source: a.source?.name ?? 'News',
      publishedAt: a.publishedAt,
    }));

    return NextResponse.json({ articles });
  } catch {
    return NextResponse.json({ articles: [] });
  }
}

const PEXELS_API_KEY = process.env.PEXELS_API_KEY;

const CATEGORY_QUERIES: Record<string, string> = {
  houseboat: 'Kashmir houseboat Dal Lake',
  shikara: 'Kashmir shikara boat Dal Lake',
  artisan: 'Kashmir handicraft artisan',
  guide: 'Kashmir travel guide',
  vendor: 'Kashmir floating market',
  taxi: 'Kashmir taxi car',
  homestay: 'Kashmir homestay',
  guest_house: 'Kashmir guest house',
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category') || 'houseboat';
  const location = searchParams.get('location') || '';
  const query = location ? `Kashmir ${location}` : (CATEGORY_QUERIES[category] || 'Kashmir tourism');

  if (!PEXELS_API_KEY) {
    return Response.json({ photos: [] });
  }

  try {
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=3&orientation=landscape`,
      { headers: { Authorization: PEXELS_API_KEY }, signal: AbortSignal.timeout(6000) },
    );
    if (!res.ok) return Response.json({ photos: [] });
    const data = await res.json();
    const photos = (data.photos ?? []).map((p: any) => ({
      url: p.src?.medium || p.src?.small || '',
      photographer: p.photographer,
    }));
    return Response.json({ photos });
  } catch {
    return Response.json({ photos: [] });
  }
}

export interface Destination {
  title: string;
  extract: string;
  thumbnail: string | null;
  url: string;
}

const DESTINATION_TITLES = [
  'Dal Lake',
  'Gulmarg',
  'Pahalgam',
  'Sonamarg',
  'Mughal Gardens, Srinagar',
  'Shalimar Bagh, Srinagar',
  'Pari Mahal',
  'Indira Gandhi Tulip Garden',
];

export function getDestinationTitles(): string[] {
  return DESTINATION_TITLES;
}

export async function fetchDestinations(): Promise<Destination[]> {
  const results = await Promise.allSettled(
    DESTINATION_TITLES.map((title) =>
      fetch(
        `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`,
        { signal: AbortSignal.timeout(5000) },
      ).then((r) => (r.ok ? r.json() : null)),
    ),
  );

  const destinations: Destination[] = [];

  for (const result of results) {
    if (result.status !== 'fulfilled' || !result.value) continue;
    const page = result.value;
    if (page.type === 'disambiguation' || !page.extract) continue;

    destinations.push({
      title: page.title,
      extract: page.extract ? page.extract.split('.')[0] + '.' : '',
      thumbnail: page.thumbnail?.source || null,
      url: page.content_urls?.desktop?.page || '',
    });
  }

  return destinations;
}

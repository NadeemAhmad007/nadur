export function parseGoogleMapsUrl(url: string): { lat: number; lng: number } | null {
  if (!url) return null;

  // Format: https://www.google.com/maps/place/.../@lat,lng,...z
  const atMatch = url.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
  if (atMatch) {
    const lat = parseFloat(atMatch[1]);
    const lng = parseFloat(atMatch[2]);
    if (isValidLat(lat) && isValidLng(lng)) return { lat, lng };
  }

  // Format: https://maps.google.com/?q=lat,lng  or  ?ll=lat,lng
  const parsed = new URL(url);
  for (const key of ['q', 'll', 'query']) {
    const val = parsed.searchParams.get(key);
    if (val) {
      const parts = val.split(',');
      if (parts.length >= 2) {
        const lat = parseFloat(parts[0]);
        const lng = parseFloat(parts[1]);
        if (isValidLat(lat) && isValidLng(lng)) return { lat, lng };
      }
    }
  }

  // Format: https://maps.google.com/maps?q=lat,lng
  const pathMatch = url.match(/\/maps\/?\?q=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
  if (pathMatch) {
    const lat = parseFloat(pathMatch[1]);
    const lng = parseFloat(pathMatch[2]);
    if (isValidLat(lat) && isValidLng(lng)) return { lat, lng };
  }

  return null;
}

function isValidLat(lat: number): boolean {
  return lat >= -90 && lat <= 90;
}

function isValidLng(lng: number): boolean {
  return lng >= -180 && lng <= 180;
}

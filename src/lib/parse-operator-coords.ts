import type { Operator } from '@/types';
import { parseGoogleMapsUrl } from './location';

export function getGoogleMapsUrl(op: { houseboat_details?: { google_maps?: string | null } | null; artisan_details?: { google_maps?: string | null } | null; taxi_details?: { google_maps?: string | null } | null; guide_details?: { google_maps?: string | null } | null; vendor_details?: { google_maps?: string | null } | null; accommodation_details?: { google_maps?: string | null } | null }): string | null {
  return op.houseboat_details?.google_maps
    ?? op.artisan_details?.google_maps
    ?? op.taxi_details?.google_maps
    ?? op.guide_details?.google_maps
    ?? op.vendor_details?.google_maps
    ?? op.accommodation_details?.google_maps
    ?? null;
}

export function getEffectiveCoords(op: { lat?: number | null; lng?: number | null } & Parameters<typeof getGoogleMapsUrl>[0]): { lat: number; lng: number } | null {
  const gmaps = getGoogleMapsUrl(op);
  if (gmaps) {
    const parsed = parseGoogleMapsUrl(gmaps);
    if (parsed) return parsed;
  }
  if (op.lat && op.lng && op.lat !== 0 && op.lng !== 0) {
    return { lat: op.lat, lng: op.lng };
  }
  return null;
}

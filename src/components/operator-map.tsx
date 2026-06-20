import { MapPin } from 'lucide-react';
import { parseGoogleMapsUrl } from '@/lib/location';

export function OperatorMap({ lat, lng, name, googleMapsUrl }: { lat: number; lng: number; name: string; googleMapsUrl?: string | null }) {
  const urlCoords = googleMapsUrl ? parseGoogleMapsUrl(googleMapsUrl) : null;
  const efLat = urlCoords?.lat ?? lat;
  const efLng = urlCoords?.lng ?? lng;
  const destination = googleMapsUrl || `https://www.google.com/maps/dir/?api=1&destination=${efLat},${efLng}`;
  return (
    <div>
      <div className="w-full rounded-lg overflow-hidden border border-border/60">
        <iframe
          src={`https://www.google.com/maps?q=${efLat},${efLng}&output=embed&z=14`}
          width="100%"
          height="176"
          style={{ border: 0, display: 'block' }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title={name}
        />
      </div>
      <a
        href={destination}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-accent transition-colors"
      >
        <MapPin className="h-3 w-3" />
        Open in Google Maps
      </a>
    </div>
  );
}

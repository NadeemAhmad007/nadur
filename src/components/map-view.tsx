'use client';

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface MapViewProps {
  operators: { id: string; name: string; slug: string; lat?: number | null; lng?: number | null; category?: string; photos?: string[] }[];
  userLat?: number | null;
  userLng?: number | null;
  onSelect?: (slug: string) => void;
}

const iconUrl = 'data:image/svg+xml,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#C9551F" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="10" r="3"/><path d="M12 21.7C17.3 17 20 13 20 10a8 8 0 1 0-16 0c0 3 2.7 6.9 8 11.7z"/></svg>'
);

const userIconUrl = 'data:image/svg+xml,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#16314D" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="10" r="3"/><path d="M12 21.7C17.3 17 20 13 20 10a8 8 0 1 0-16 0c0 3 2.7 6.9 8 11.7z"/></svg>'
);

export default function MapView({ operators, userLat, userLng, onSelect }: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const [mounted, setMounted] = useState(false);
  const markersRef = useRef<L.Marker[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !mapRef.current || mapInstance.current) return;

    const center: [number, number] = userLat && userLng
      ? [userLat, userLng]
      : [34.0837, 74.7973];
    const zoom = userLat && userLng ? 12 : 10;

    const map = L.map(mapRef.current, { zoomControl: false }).setView(center, zoom);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://openstreetmap.org/copyright">OSM</a>',
      maxZoom: 18,
    }).addTo(map);
    L.control.zoom({ position: 'bottomright' }).addTo(map);
    mapInstance.current = map;

    return () => {
      map.remove();
      mapInstance.current = null;
    };
  }, [mounted, userLat, userLng]);

  useEffect(() => {
    const map = mapInstance.current;
    if (!map) return;

    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    const bounds: L.LatLngBoundsExpression = [];

    if (userLat && userLng) {
      const icon = L.icon({ iconUrl: userIconUrl, iconSize: [28, 28], iconAnchor: [14, 28] });
      const m = L.marker([userLat, userLng], { icon }).addTo(map);
      m.bindPopup('You are here');
      markersRef.current.push(m);
      bounds.push([userLat, userLng]);
    }

    const opsWithCoords = operators.filter(o => o.lat && o.lng && o.lat !== 0 && o.lng !== 0);
    if (opsWithCoords.length === 0) return;

    const icon = L.icon({ iconUrl, iconSize: [24, 24], iconAnchor: [12, 24] });
    opsWithCoords.forEach(op => {
      const m = L.marker([op.lat!, op.lng!], { icon }).addTo(map);
      const img = op.photos?.[0]
        ? `<img src="${op.photos[0]}" alt="${op.name}" style="width:120px;height:80px;object-fit:cover;border-radius:6px;margin-bottom:4px;" />`
        : '';
      m.bindPopup(
        `<div style="font-family:sans-serif;max-width:160px;">${img}<strong style="font-size:13px;color:#16314D;">${op.name}</strong></div>`,
        { closeButton: false },
      );
      m.on('click', () => onSelect?.(op.slug));
      markersRef.current.push(m);
      bounds.push([op.lat!, op.lng!]);
    });

    if (bounds.length > 0) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
    }
  }, [operators, userLat, userLng, onSelect]);

  if (!mounted) return null;

  return <div ref={mapRef} className="w-full h-full rounded-xl overflow-hidden" />;
}

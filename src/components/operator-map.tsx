'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface OperatorMapProps {
  lat: number;
  lng: number;
  name: string;
}

export function OperatorMap({ lat, lng, name }: OperatorMapProps) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (ref.current && !mapRef.current) {
      const map = L.map(ref.current, {
        center: [lat, lng],
        zoom: 14,
        scrollWheelZoom: false,
        zoomControl: false,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '',
        maxZoom: 19,
      }).addTo(map);

      const icon = L.divIcon({
        html: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" fill="#C99A48"/><circle cx="12" cy="10" r="3" fill="white"/></svg>`,
        className: '',
        iconSize: [24, 24],
        iconAnchor: [12, 24],
      });

      L.marker([lat, lng], { icon }).addTo(map);

      mapRef.current = map;
    }

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [lat, lng]);

  return (
    <div
      ref={ref}
      className="w-full h-44 rounded-lg overflow-hidden border border-border/60"
      style={{ background: '#e8e4dc' }}
    />
  );
}

'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Operator } from '@/types';
import { cn } from '@/lib/utils';
import { BadgeCheck, MapPin, ExternalLink } from 'lucide-react';

const categoryLabels: Record<string, string> = {
  houseboat: 'Houseboat',
  shikara: 'Shikara Ride',
  artisan: 'Artisan',
  guide: 'Local Guide',
  vendor: 'Floating Vendor',
};

export function OperatorCard({ operator, className }: { operator: Operator; className?: string }) {
  const router = useRouter();
  const photo = operator.photos?.[0];

  return (
    <Card className={cn('overflow-hidden hover:shadow-md transition-shadow', className)}>
      <div
        className="aspect-[4/3] bg-gray-100 relative cursor-pointer"
        onClick={() => router.push(`/o/${operator.slug}`)}
      >
        {photo ? (
          <img
            src={photo}
            alt={operator.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
            No photo
          </div>
        )}
        {operator.verified && (
          <span className="absolute top-2 left-2 bg-[#2C5F8A] text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
            <BadgeCheck className="w-3 h-3" /> Verified
          </span>
        )}
      </div>
      <CardContent className="p-3">
        <h3
          className="font-semibold text-sm truncate cursor-pointer"
          onClick={() => router.push(`/o/${operator.slug}`)}
        >
          {operator.name}
        </h3>
        <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
          <MapPin className="w-3 h-3" />
          {operator.category ? (categoryLabels[operator.category] || operator.category) : ''}
        </p>
        {operator.short_desc && (
          <p className="text-xs text-gray-600 mt-1 line-clamp-2">{operator.short_desc}</p>
        )}
        <div className="mt-2 pt-2 border-t border-gray-100 flex gap-1.5">
          {(operator.lat && operator.lng) || operator.houseboat_details?.google_maps || operator.artisan_details?.google_maps ? (
            <Button
              size="sm"
              variant="outline"
              className="flex-1 gap-1 text-[10px] h-7 px-1"
              onClick={(e) => {
                e.stopPropagation();
                const url = operator.houseboat_details?.google_maps
                  || operator.artisan_details?.google_maps
                  || `https://www.google.com/maps?q=${operator.lat},${operator.lng}`;
                window.open(url, '_blank');
              }}
            >
              <MapPin className="w-3 h-3" /> Open in Maps
            </Button>
          ) : null}
          <Button
            size="sm"
            variant="outline"
            className="flex-1 gap-1 text-[10px] h-7 px-1"
            onClick={(e) => {
              e.stopPropagation();
              window.open(`https://wa.me/${operator.whatsapp}`, '_blank');
            }}
          >
            <ExternalLink className="w-3 h-3" /> Chat on WhatsApp
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="flex-1 gap-1 text-[10px] h-7 px-1"
            onClick={(e) => {
              e.stopPropagation();
              window.open(`/o/${operator.slug}`, '_blank');
            }}
          >
            <ExternalLink className="w-3 h-3" /> View Profile
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import type { Operator } from '@/types';
import { ArrowLeft, BadgeCheck, Heart, Share2, MessageCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';

const categoryLabels: Record<string, string> = {
  houseboat: 'Houseboat',
  shikara: 'Shikara Ride',
  artisan: 'Artisan',
  guide: 'Local Guide',
  vendor: 'Floating Vendor',
};

export function OperatorProfile({ operator: op }: { operator: Operator }) {
  const [currentPhoto, setCurrentPhoto] = useState(0);
  const [favorited, setFavorited] = useState(false);
  const [blocked, setBlocked] = useState(false);

  const photos = op.photos?.length ? op.photos : [];

  const handleWhatsApp = async () => {
    if (blocked) return;

    const message = encodeURIComponent(
      `Hi! I found you on Nadurr. I'm interested in your ${op.category ? (categoryLabels[op.category] || op.category) : ''}. Is it available?`
    );
    const waUrl = `https://wa.me/${op.whatsapp}?text=${message}`;

    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        body: JSON.stringify({ operator_id: op.id, source: 'profile' }),
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (data.blocked) {
        setBlocked(true);
        return;
      }
    } catch {
      return;
    }

    window.open(waUrl, '_blank');
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Gallery */}
      <div className="relative bg-gray-100">
        {photos.length > 0 ? (
          <div className="aspect-[4/3] relative">
            <img
              src={photos[currentPhoto]}
              alt={op.name}
              className="w-full h-full object-cover"
            />
            {photos.length > 1 && (
              <>
                <button
                  onClick={() => setCurrentPhoto((p) => (p === 0 ? photos.length - 1 : p - 1))}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 rounded-full p-1"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setCurrentPhoto((p) => (p === photos.length - 1 ? 0 : p + 1))}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 rounded-full p-1"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                  {photos.map((_, i) => (
                    <div
                      key={i}
                      className={`w-1.5 h-1.5 rounded-full ${i === currentPhoto ? 'bg-white' : 'bg-white/50'}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="aspect-[4/3] flex items-center justify-center text-gray-400">
            No photos available
          </div>
        )}

        <div className="absolute top-4 left-4 z-10 flex gap-2">
          <Link
            href="/"
            className="bg-white/80 backdrop-blur-sm rounded-full p-2 hover:bg-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </div>

        <div className="absolute top-4 right-4 z-10 flex gap-2">
          <button
            onClick={() => setFavorited(!favorited)}
            className="bg-white/80 backdrop-blur-sm rounded-full p-2 hover:bg-white"
          >
            <Heart className={`w-5 h-5 ${favorited ? 'fill-red-500 text-red-500' : ''}`} />
          </button>
          <button className="bg-white/80 backdrop-blur-sm rounded-full p-2 hover:bg-white">
            <Share2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Details */}
      <div className="px-4 py-4 max-w-lg mx-auto">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold">{op.name}</h1>
            <p className="text-sm text-gray-500 mt-1">
              {op.category ? (categoryLabels[op.category] || op.category) : ''}
              {op.verified && (
                <span className="ml-2 text-[#2C5F8A] inline-flex items-center gap-0.5">
                  <BadgeCheck className="w-3.5 h-3.5" /> Verified
                </span>
              )}
            </p>
          </div>
        </div>

        {op.short_desc && (
          <p className="text-sm text-gray-700 mt-3">{op.short_desc}</p>
        )}

        {op.long_desc && (
          <p className="text-sm text-gray-600 mt-3 leading-relaxed">{op.long_desc}</p>
        )}

        {op.houseboat_details && op.category === 'houseboat' && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm font-medium text-gray-700 mb-2">Houseboat Details</p>
            <div className="text-sm space-y-1">
              {(op.houseboat_details as any).owner && <p><span className="text-gray-500">Owner:</span> {(op.houseboat_details as any).owner}</p>}
              {(op.houseboat_details as any).address && <p><span className="text-gray-500">Address:</span> {(op.houseboat_details as any).address}</p>}
              {(op.houseboat_details as any).contact && <p><span className="text-gray-500">Contact:</span> {(op.houseboat_details as any).contact}</p>}
              {(op.houseboat_details as any).contact2 && <p><span className="text-gray-500">Contact 2:</span> {(op.houseboat_details as any).contact2}</p>}
              {(op.houseboat_details as any).email && <p><span className="text-gray-500">Email:</span> {(op.houseboat_details as any).email}</p>}
              {(op.houseboat_details as any).grade && <p><span className="text-gray-500">Grade:</span> {(op.houseboat_details as any).grade}</p>}
              {(op.houseboat_details as any).boat_ghat && <p><span className="text-gray-500">Boat Ghat:</span> {(op.houseboat_details as any).boat_ghat}</p>}
              {(op.houseboat_details as any).google_maps && <p><span className="text-gray-500">Location:</span> <a href={(op.houseboat_details as any).google_maps} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">View on Map</a></p>}
            </div>
          </div>
        )}

        {op.shikara_details && op.category === 'shikara' && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm font-medium text-gray-700 mb-2">Shikara Details</p>
            <div className="text-sm space-y-1">
              {(op.shikara_details as any).full_name && <p><span className="text-gray-500">Full Name:</span> {(op.shikara_details as any).full_name}</p>}
              {(op.shikara_details as any).mobile_number && <p><span className="text-gray-500">Mobile:</span> {(op.shikara_details as any).mobile_number}</p>}
              {(op.shikara_details as any).shikara_number && <p><span className="text-gray-500">Shikara No.:</span> {(op.shikara_details as any).shikara_number}</p>}
              {(op.shikara_details as any).ghat_number && <p><span className="text-gray-500">Ghat:</span> {(op.shikara_details as any).ghat_number}</p>}
              {(op.shikara_details as any).operating_areas?.length > 0 && <p><span className="text-gray-500">Areas:</span> {(op.shikara_details as any).operating_areas.join(', ')}</p>}
              {(op.shikara_details as any).years_experience && <p><span className="text-gray-500">Experience:</span> {(op.shikara_details as any).years_experience} years</p>}
              {(op.shikara_details as any).languages?.length > 0 && <p><span className="text-gray-500">Languages:</span> {(op.shikara_details as any).languages.join(', ')}</p>}
              {(op.shikara_details as any).services?.length > 0 && <p><span className="text-gray-500">Services:</span> {(op.shikara_details as any).services.join(', ')}</p>}
              {(op.shikara_details as any).tour_duration && <p><span className="text-gray-500">Duration:</span> {(op.shikara_details as any).tour_duration}</p>}
              {(op.shikara_details as any).registered_shikara && <p><span className="text-gray-500">Registered Shikara:</span> {(op.shikara_details as any).registered_shikara}{(op.shikara_details as any).registration_number ? ` (${(op.shikara_details as any).registration_number})` : ''}</p>}
            </div>
          </div>
        )}

        {op.artisan_details && op.category === 'artisan' && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm font-medium text-gray-700 mb-2">Artisan Details</p>
            <div className="text-sm space-y-1">
              {(op.artisan_details as any).business_type && <p><span className="text-gray-500">Business Type:</span> {(op.artisan_details as any).business_type}</p>}
              {(op.artisan_details as any).specialties?.length > 0 && <p><span className="text-gray-500">Specialties:</span> {(op.artisan_details as any).specialties.join(', ')}</p>}
              {(op.artisan_details as any).business_scale && <p><span className="text-gray-500">Scale:</span> {(op.artisan_details as any).business_scale}</p>}
              {(op.artisan_details as any).owner_name && <p><span className="text-gray-500">Owner:</span> {(op.artisan_details as any).owner_name}</p>}
              {(op.artisan_details as any).contact_number && <p><span className="text-gray-500">Contact:</span> {(op.artisan_details as any).contact_number}</p>}
              {(op.artisan_details as any).years_in_business && <p><span className="text-gray-500">Years in Business:</span> {(op.artisan_details as any).years_in_business}</p>}
            </div>
          </div>
        )}

        {op.tariffs && op.category === 'houseboat' && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm font-medium text-gray-700 mb-2">Tariffs (₹)</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
              {([
                ['double_ep', 'Double Bed (EP)'],
                ['double_cp', 'Double Bed (CP)'],
                ['double_map', 'Double Bed (MAP)'],
                ['double_ap', 'Double Bed (AP)'],
                ['single_ep', 'Single Bed (EP)'],
                ['single_cp', 'Single Bed (CP)'],
                ['single_map', 'Single Bed (MAP)'],
                ['single_ap', 'Single Bed (AP)'],
              ] as const).map(([key, label]) => {
                const val = (op.tariffs as any)?.[key];
                if (!val) return null;
                return (
                  <div key={key} className="flex justify-between">
                    <span className="text-gray-500">{label}</span>
                    <span className="font-medium">₹{val}</span>
                  </div>
                );
              })}
            </div>
            {(op.tariffs as any)?.note && (
              <p className="text-xs text-gray-500 mt-2">{(op.tariffs as any).note}</p>
            )}
          </div>
        )}

        {op.pricing_note && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm font-medium text-gray-700">Pricing</p>
            <p className="text-sm text-gray-600 mt-1">{op.pricing_note}</p>
          </div>
        )}

        {blocked ? (
          <div className="w-full mt-6 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800 text-center">
            This operator has reached their monthly contact limit. Please check back next month or browse other operators.
          </div>
        ) : (
          <Button
            onClick={handleWhatsApp}
            size="lg"
            className="w-full mt-6 gap-2 bg-[#25D366] hover:bg-[#20BD5A] text-white"
          >
            <MessageCircle className="w-5 h-5" />
            Contact on WhatsApp
          </Button>
        )}

        <Link
          href="/"
          className="block text-center text-sm text-[#2C5F8A] mt-4 font-medium"
        >
          Browse more Dal Lake operators
        </Link>
      </div>
    </div>
  );
}

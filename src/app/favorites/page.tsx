'use client';

import { useState, useEffect } from 'react';
import { OperatorCard } from '@/components/operator-card';
import type { Operator } from '@/types';
import { Heart, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<Operator[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('kashmir360-favorites');
    if (stored) {
      const ids = JSON.parse(stored) as string[];
      if (ids.length > 0) {
        fetch(`/api/operators?${ids.map((id) => `id=${id}`).join('&')}`)
          .then((r) => r.json())
          .then((d) => setFavorites(d.data))
          .finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 bg-white border-b border-gray-200 z-10">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/" className="p-1">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <img src="/logo.png" alt="Kashmir360" className="h-14 w-auto" />
          <h1 className="text-lg font-semibold">Favorites</h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-4">
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="rounded-xl bg-gray-100 animate-pulse">
                <div className="aspect-[4/3] rounded-t-xl bg-gray-200" />
                <div className="p-3 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : favorites.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <Heart className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="font-medium">No favorites yet</p>
            <p className="text-sm mt-1">Tap the heart icon on an operator profile to save them here</p>
            <Link href="/" className="text-[#2C5F8A] text-sm font-medium mt-4 inline-block">
              Browse operators
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {favorites.map((op) => (
              <OperatorCard key={op.id} operator={op} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

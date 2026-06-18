'use client';

import { useState, useEffect } from 'react';
import { OperatorCard } from '@/components/operator-card';
import type { Operator } from '@/types';
import { Heart, ArrowLeft, Compass } from 'lucide-react';
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
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-background/90 backdrop-blur-lg border-b border-border/50">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3 min-h-24">
          <Link href="/" className="flex h-9 w-9 items-center justify-center rounded-xl hover:bg-secondary transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <img src="/logo.png" alt="Kashmir360" className="h-56 w-auto object-contain" />
          <h1 className="text-lg font-semibold ml-1">Favorites</h1>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="rounded-[14px] border border-border bg-card overflow-hidden animate-pulse">
                <div className="aspect-[4/3] bg-muted" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-muted rounded-lg w-3/4" />
                  <div className="h-3 bg-muted rounded-lg w-1/2" />
                  <div className="h-9 bg-muted rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        ) : favorites.length === 0 ? (
          <div className="text-center py-24">
            <div className="flex justify-center mb-5">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary">
                <Heart className="w-7 h-7 text-muted-foreground" />
              </div>
            </div>
            <h2 className="text-lg font-semibold text-foreground">No favorites yet</h2>
            <p className="text-sm text-muted-foreground mt-1.5 max-w-xs mx-auto">Tap the heart icon on an operator profile to save them here</p>
            <Link href="/" className="inline-flex mt-6 text-sm text-accent font-medium hover:underline">
              Browse operators
            </Link>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-5">{favorites.length} saved operator{favorites.length !== 1 ? 's' : ''}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {favorites.map((op) => (
                <OperatorCard key={op.id} operator={op} />
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { OperatorCard } from '@/components/operator-card';
import type { Operator } from '@/types';
import { Search, Compass, MapPin } from 'lucide-react';

const categories = [
  { slug: null, label: 'All', icon: 'Compass' },
  { slug: 'houseboat', label: 'Houseboats', icon: 'Home' },
  { slug: 'shikara', label: 'Shikara', icon: 'Sailboat' },
  { slug: 'artisan', label: 'Artisans', icon: 'Palette' },
  { slug: 'guide', label: 'Guides', icon: 'MapPin' },
  { slug: 'vendor', label: 'Vendors', icon: 'ShoppingBag' },
];

const SEARCH_RADIUS_KM = 10;

export function BrowsePage() {
  const [operators, setOperators] = useState<Operator[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLng, setUserLng] = useState<number | null>(null);
  const [locating, setLocating] = useState(false);
  const pageRef = useRef(1);

  const fetchOperators = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (activeCategory) params.set('category', activeCategory);
    if (searchQuery) params.set('q', searchQuery);
    params.set('page', String(pageRef.current));
    if (userLat != null && userLng != null) {
      params.set('lat', String(userLat));
      params.set('lng', String(userLng));
      params.set('radius', String(SEARCH_RADIUS_KM));
    }

    try {
      const res = await fetch(`/api/operators?${params}`);
      if (!res.ok) {
        const errBody = await res.text();
        throw new Error(`HTTP ${res.status}: ${errBody}`);
      }
      const { data, hasMore: more } = await res.json();
      if (pageRef.current === 1) {
        setOperators(data);
      } else {
        setOperators(prev => [...prev, ...data]);
      }
      setHasMore(more);
    } catch (e) {
      console.error('Failed to fetch operators', e);
    } finally {
      setLoading(false);
    }
  }, [activeCategory, searchQuery, userLat, userLng]);

  useEffect(() => {
    pageRef.current = 1;
    fetchOperators();
  }, [fetchOperators]);

  const loadMore = () => {
    pageRef.current += 1;
    fetchOperators();
  };

  const nearMe = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLat(pos.coords.latitude);
        setUserLng(pos.coords.longitude);
        setLocating(false);
      },
      () => {
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const clearLocation = () => {
    setUserLat(null);
    setUserLng(null);
  };

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-10 bg-white border-b border-gray-200">
        <div className="max-w-lg mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-xl font-bold text-[#2C5F8A] flex items-center gap-2">
              <img src="/logo.png" alt="Nadurr" className="w-6 h-6" /> Nadurr
            </h1>
            <button
              onClick={userLat != null ? clearLocation : nearMe}
              disabled={locating}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                userLat != null
                  ? 'bg-[#2C5F8A] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <MapPin className="w-4 h-4" />
              {locating ? 'Locating...' : userLat != null ? 'Nearby' : 'Near Me'}
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="search"
              placeholder="Search operators..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2C5F8A]"
            />
          </div>
          <div className="flex gap-2 mt-3 overflow-x-auto pb-2 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat.slug || 'all'}
                onClick={() => setActiveCategory(cat.slug)}
                className={`whitespace-nowrap px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  activeCategory === cat.slug
                    ? 'bg-[#2C5F8A] text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-4">
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="rounded-xl bg-gray-100 animate-pulse">
                <div className="aspect-[4/3] rounded-t-xl bg-gray-200" />
                <div className="p-3 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : operators.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <Compass className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="font-medium">No operators found</p>
            <p className="text-sm mt-1">Try a different category or search term</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              {operators.map((op) => (
                <OperatorCard key={op.id} operator={op} />
              ))}
            </div>
            {hasMore && (
              <button
                onClick={loadMore}
                disabled={loading}
                className="w-full mt-4 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
              >
                {loading ? 'Loading...' : 'Load More'}
              </button>
            )}
          </>
        )}
      </main>
    </div>
  );
}

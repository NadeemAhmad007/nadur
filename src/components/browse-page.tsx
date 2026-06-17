'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { OperatorCard, LeadFormModal } from '@/components/operator-card';
import { CardSkeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Search, MapPin, Navigation, Compass, Sparkles, Building2,
  Ship, Palette, Menu as MenuIcon, Store, LogIn, UserPlus
} from 'lucide-react';

const CATEGORIES = [
  { slug: '', label: 'All', icon: Sparkles },
  { slug: 'houseboat', label: 'Houseboats', icon: Building2 },
  { slug: 'shikara', label: 'Shikara Rides', icon: Ship },
  { slug: 'artisan', label: 'Artisans', icon: Palette },
  { slug: 'guide', label: 'Guides', icon: Navigation },
  { slug: 'vendor', label: 'Vendors', icon: Store },
];

export default function BrowsePage() {
  const router = useRouter();
  const [operators, setOperators] = useState<any[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [activeCategory, setActiveCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLng, setUserLng] = useState<number | null>(null);
  const [locating, setLocating] = useState(false);
  const [loading, setLoading] = useState(true);
  const pageRef = useRef(1);
  const [leadOp, setLeadOp] = useState<any>(null);

  const fetchOperators = async (page = 1, append = false) => {
    setLoading(true);
    const params = new URLSearchParams();
    if (activeCategory) params.set('category', activeCategory);
    if (searchQuery) params.set('q', searchQuery);
    if (userLat && userLng) { params.set('lat', String(userLat)); params.set('lng', String(userLng)); params.set('radius', '10'); }
    params.set('page', String(page));
    params.set('limit', '20');

    try {
      const res = await fetch(`/api/operators?${params}`);
      const { data, hasMore: hm } = await res.json();
      setOperators(append ? prev => [...prev, ...data] : data);
      setHasMore(hm);
      pageRef.current = page;
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => { fetchOperators(); }, [activeCategory]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
  };

  const locateMe = () => {
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => { setUserLat(pos.coords.latitude); setUserLng(pos.coords.longitude); setLocating(false); },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  return (
    <>
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-3">
              <img src="/logo.png" alt="Kashmir360" className="h-16 w-auto" />
            </Link>
            <div className="flex items-center gap-2">
              <Link
                href="/auth/login"
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-foreground hover:bg-muted transition-colors"
              >
                <LogIn className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Sign In</span>
              </Link>
              <Link
                href="/join"
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <UserPlus className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Register</span>
              </Link>
              <button
                onClick={locateMe}
                disabled={locating}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-muted text-muted-foreground hover:bg-muted/80 transition-colors disabled:opacity-50"
              >
                <MapPin className="h-3.5 w-3.5" />
                {locating ? 'Locating...' : userLat ? 'Near Me' : 'Near Me'}
              </button>
            </div>
          </div>
          {/* Search bar */}
          <form onSubmit={handleSearch} className="pb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search operators..."
                className="w-full pl-9 pr-4 h-10 rounded-xl border border-input bg-muted/50 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:bg-card transition-colors"
              />
            </div>
          </form>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.slug}
              onClick={() => setActiveCategory(cat.slug)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                activeCategory === cat.slug
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              <cat.icon className="h-4 w-4" />
              {cat.label}
            </button>
          ))}
        </div>

        {/* Results grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading && operators.length === 0
            ? Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)
            : operators.map((op) => (
                <OperatorCard key={op.id} operator={op} onInquiry={() => setLeadOp(op)} />
              ))
          }
        </div>

        {/* Empty state */}
        {!loading && operators.length === 0 && (
          <div className="text-center py-16">
            <div className="flex justify-center mb-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
                <Compass className="h-8 w-8 text-muted-foreground" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-foreground">No operators found</h3>
            <p className="text-sm text-muted-foreground mt-1">Try a different category or search term</p>
          </div>
        )}

        {/* Load more */}
        {hasMore && (
          <div className="text-center mt-8">
            <Button
              variant="outline"
              onClick={() => fetchOperators(pageRef.current + 1, true)}
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Load More'}
            </Button>
          </div>
        )}
      </main>

      {/* Lead form modal */}
      {leadOp && <LeadFormModal operator={leadOp} onClose={() => setLeadOp(null)} />}
    </>
  );
}

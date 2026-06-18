'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { OperatorCard } from '@/components/operator-card';
import { CardSkeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Search, MapPin, Navigation, Compass, Sparkles, Building2,
  Ship, Palette, Store, LogIn, UserPlus, Car,
  SlidersHorizontal, X, ChevronDown, Check, ArrowUpDown, AlertTriangle,
} from 'lucide-react';

const CATEGORIES = [
  { slug: '', label: 'All', icon: Sparkles },
  { slug: 'houseboat', label: 'Houseboats', icon: Building2 },
  { slug: 'shikara', label: 'Shikara Rides', icon: Ship },
  { slug: 'artisan', label: 'Artisans', icon: Palette },
  { slug: 'guide', label: 'Guides', icon: Navigation },
  { slug: 'vendor', label: 'Vendors', icon: Store },
  { slug: 'taxi', label: 'Taxis', icon: Car },
  { slug: 'homestay', label: 'Homestays', icon: Building2 },
  { slug: 'guest_house', label: 'Guest Houses', icon: Building2 },
];

const GHATS = [
  'Ghat No. 1', 'Ghat No. 2', 'Ghat No. 3', 'Ghat No. 4', 'Ghat No. 5',
  'Ghat No. 6', 'Ghat No. 7', 'Ghat No. 8', 'Ghat No. 9', 'Ghat No. 10',
  'Ghat No. 11', 'Ghat No. 12', 'Ghat No. 13', 'Ghat No. 14', 'Ghat No. 15',
  'Rainawari Ghat',
];

const AREAS = [
  'Srinagar Airport', 'Dal Lake', 'Nigeen Lake', 'Gulmarg',
  'Pahalgam', 'Sonamarg', 'Yusmarg', 'Doodhpathri', 'Kokernag', 'Patnitop', 'Leh',
];

const LANGUAGES = ['Kashmiri', 'Urdu', 'Hindi', 'English', 'Arabic', 'Pashto', 'French', 'German'];

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
  const [fetchError, setFetchError] = useState<string | null>(null);
  const pageRef = useRef(1);

  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('relevance');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [selectedGhats, setSelectedGhats] = useState<string[]>([]);
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  const hasActiveFilters = priceMin || priceMax || selectedGhats.length > 0 || selectedAreas.length > 0 || selectedLanguages.length > 0 || verifiedOnly;

  const buildParams = useCallback((page: number) => {
    const params = new URLSearchParams();
    if (activeCategory) params.set('category', activeCategory);
    if (searchQuery) params.set('q', searchQuery);
    if (userLat && userLng) { params.set('lat', String(userLat)); params.set('lng', String(userLng)); params.set('radius', '10'); }
    if (sortBy !== 'relevance') params.set('sort', sortBy);
    if (priceMin) params.set('price_min', priceMin);
    if (priceMax) params.set('price_max', priceMax);
    if (selectedGhats.length > 0) params.set('ghat', selectedGhats.join(','));
    if (selectedAreas.length > 0) params.set('area', selectedAreas.join(','));
    if (selectedLanguages.length > 0) params.set('language', selectedLanguages.join(','));
    if (verifiedOnly) params.set('verified', 'true');
    params.set('page', String(page));
    params.set('limit', '20');
    return params;
  }, [activeCategory, searchQuery, userLat, userLng, sortBy, priceMin, priceMax, selectedGhats, selectedAreas, selectedLanguages, verifiedOnly]);

  const fetchOperators = useCallback(async (page = 1, append = false) => {
    setLoading(true);
    setFetchError(null);
    const params = buildParams(page);
    try {
      const res = await fetch(`/api/operators?${params}`);
      if (!res.ok) {
        setFetchError(`Server error (${res.status})`);
        setLoading(false);
        return;
      }
      const { data, hasMore: hm } = await res.json();
      setOperators(append ? prev => [...prev, ...data] : data);
      setHasMore(hm);
      pageRef.current = page;
    } catch {
      setFetchError('Network error — please check your connection');
    }
    setLoading(false);
  }, [buildParams]);

  useEffect(() => { fetchOperators(); }, [fetchOperators]);

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

  const clearFilters = () => {
    setPriceMin('');
    setPriceMax('');
    setSelectedGhats([]);
    setSelectedAreas([]);
    setSelectedLanguages([]);
    setVerifiedOnly(false);
    setSortBy('relevance');
  };

  const toggleChip = (list: string[], item: string, setter: (v: string[]) => void) => {
    setter(list.includes(item) ? list.filter(i => i !== item) : [...list, item]);
  };

  const categoriesWithGhat = ['houseboat', 'shikara'];
  const categoriesWithArea = ['shikara', 'taxi', 'guide', 'vendor', 'homestay', 'guest_house'];
  const categoriesWithLanguage = ['shikara', 'taxi', 'guide', 'homestay', 'guest_house'];
  const showGhatFilter = !activeCategory || categoriesWithGhat.includes(activeCategory);
  const showAreaFilter = !activeCategory || categoriesWithArea.includes(activeCategory);
  const showLanguageFilter = !activeCategory || categoriesWithLanguage.includes(activeCategory);

  return (
    <>
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-3">
              <img src="/logo.png" alt="Kashmir360" className="h-16 w-auto" />
            </Link>
            <div className="flex items-center gap-2">
              <Link href="/auth/login" className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-foreground hover:bg-muted transition-colors">
                <LogIn className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Sign In</span>
              </Link>
              <Link href="/join" className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
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
        <div className="flex gap-2 overflow-x-auto pb-3 -mx-4 px-4 scrollbar-none">
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

        {/* Toolbar */}
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <p className="text-sm text-muted-foreground">
              {operators.length > 0 ? `${operators.length} found` : ''}
            </p>
            {hasActiveFilters && (
              <button onClick={clearFilters} className="text-xs text-primary hover:underline flex items-center gap-1">
                <X className="h-3 w-3" /> Clear
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                showFilters || hasActiveFilters
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Filters
              {hasActiveFilters && <Badge variant="primary" size="sm" className="ml-0.5">!</Badge>}
            </button>
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none bg-muted text-muted-foreground text-xs font-medium rounded-lg px-3 py-1.5 pr-7 border-0 focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer hover:bg-muted/80 transition-colors"
              >
                <option value="relevance">Sort: Relevance</option>
                <option value="newest">Sort: Newest</option>
                <option value="name">Sort: Name A-Z</option>
                <option value="-name">Sort: Name Z-A</option>
              </select>
              <ArrowUpDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="mb-6 p-4 rounded-xl bg-muted/30 border border-border space-y-4">
            {/* Price range */}
            <div>
              <p className="text-xs font-semibold text-foreground mb-2">Price Range (₹/night or per km)</p>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={priceMin}
                  onChange={(e) => setPriceMin(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-input bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <span className="text-muted-foreground text-xs">—</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={priceMax}
                  onChange={(e) => setPriceMax(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-input bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>

            {/* Ghat filter */}
            {showGhatFilter && (
              <div>
                <p className="text-xs font-semibold text-foreground mb-2">Ghat / Location</p>
                <div className="flex flex-wrap gap-1.5">
                  {GHATS.map((g) => (
                    <button
                      key={g}
                      onClick={() => toggleChip(selectedGhats, g, setSelectedGhats)}
                      className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                        selectedGhats.includes(g)
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-card text-muted-foreground border-border hover:border-primary/50'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Operating area filter */}
            {showAreaFilter && (
              <div>
                <p className="text-xs font-semibold text-foreground mb-2">Operating Area</p>
                <div className="flex flex-wrap gap-1.5">
                  {AREAS.map((a) => (
                    <button
                      key={a}
                      onClick={() => toggleChip(selectedAreas, a, setSelectedAreas)}
                      className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                        selectedAreas.includes(a)
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-card text-muted-foreground border-border hover:border-primary/50'
                      }`}
                    >
                      {a}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Language filter */}
            {showLanguageFilter && (
              <div>
                <p className="text-xs font-semibold text-foreground mb-2">Languages Spoken</p>
                <div className="flex flex-wrap gap-1.5">
                  {LANGUAGES.map((l) => (
                    <button
                      key={l}
                      onClick={() => toggleChip(selectedLanguages, l, setSelectedLanguages)}
                      className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                        selectedLanguages.includes(l)
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-card text-muted-foreground border-border hover:border-primary/50'
                      }`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Verified only */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={verifiedOnly} onChange={(e) => setVerifiedOnly(e.target.checked)} className="rounded" />
              <span className="text-xs font-medium text-foreground">Verified operators only</span>
            </label>
          </div>
        )}

        {/* Active filter chips */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {priceMin && <Badge variant="outline" size="sm" className="gap-1">Min: ₹{priceMin} <X className="h-3 w-3 cursor-pointer" onClick={() => setPriceMin('')} /></Badge>}
            {priceMax && <Badge variant="outline" size="sm" className="gap-1">Max: ₹{priceMax} <X className="h-3 w-3 cursor-pointer" onClick={() => setPriceMax('')} /></Badge>}
            {selectedGhats.map(g => (
              <Badge key={g} variant="outline" size="sm" className="gap-1">{g} <X className="h-3 w-3 cursor-pointer" onClick={() => setSelectedGhats(selectedGhats.filter(i => i !== g))} /></Badge>
            ))}
            {selectedAreas.map(a => (
              <Badge key={a} variant="outline" size="sm" className="gap-1">{a} <X className="h-3 w-3 cursor-pointer" onClick={() => setSelectedAreas(selectedAreas.filter(i => i !== a))} /></Badge>
            ))}
            {selectedLanguages.map(l => (
              <Badge key={l} variant="outline" size="sm" className="gap-1">{l} <X className="h-3 w-3 cursor-pointer" onClick={() => setSelectedLanguages(selectedLanguages.filter(i => i !== l))} /></Badge>
            ))}
            {verifiedOnly && <Badge variant="outline" size="sm" className="gap-1">Verified <X className="h-3 w-3 cursor-pointer" onClick={() => setVerifiedOnly(false)} /></Badge>}
          </div>
        )}

        {/* Results grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading && operators.length === 0
            ? Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)
            : operators.map((op) => (
                <OperatorCard key={op.id} operator={op} />
              ))
          }
        </div>

        {/* Error state */}
        {fetchError && (
          <div className="text-center py-16">
            <div className="flex justify-center mb-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10">
                <AlertTriangle className="h-8 w-8 text-destructive" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-foreground">Something went wrong</h3>
            <p className="text-sm text-muted-foreground mt-1 mb-4">{fetchError}</p>
            <Button variant="outline" onClick={() => fetchOperators()}>Try Again</Button>
          </div>
        )}

        {/* Empty state */}
        {!loading && !fetchError && operators.length === 0 && (
          <div className="text-center py-16">
            <div className="flex justify-center mb-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
                <Compass className="h-8 w-8 text-muted-foreground" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-foreground">No operators found</h3>
            <p className="text-sm text-muted-foreground mt-1">Try adjusting your filters or search term</p>
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
    </>
  );
}

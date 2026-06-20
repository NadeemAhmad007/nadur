'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { OperatorCard } from '@/components/operator-card';
import { CardSkeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { KASHMIR_AREAS } from '@/lib/areas';
import { Badge } from '@/components/ui/badge';
import { fetchDestinations, type Destination } from '@/lib/wikipedia';
import {
  Search, MapPin, Navigation, Compass, Sparkles, Building2,
  Ship, Palette, Store, LogIn, UserPlus, Car,
  SlidersHorizontal, X, Check, ArrowUpDown, AlertTriangle,
  Heart, Menu, RotateCcw, Filter,
} from 'lucide-react';

const CATEGORIES = [
  { slug: '', label: 'All', icon: Sparkles },
  { slug: 'houseboat', label: 'Houseboats', icon: Building2 },
  { slug: 'shikara', label: 'Shikara Rides', icon: Ship },
  { slug: 'artisan', label: 'Artisans', icon: Palette },
  { slug: 'guide', label: 'Guides', icon: Navigation },
  { slug: 'vendor', label: 'Vendors', icon: Store },
  { slug: 'taxi', label: 'Taxis', icon: Car },
  { slug: 'accommodation', label: 'Accommodation', icon: Building2 },
];

const GHATS = [
  'Ghat No. 1', 'Ghat No. 2', 'Ghat No. 3', 'Ghat No. 4', 'Ghat No. 5',
  'Ghat No. 6', 'Ghat No. 7', 'Ghat No. 8', 'Ghat No. 9', 'Ghat No. 10',
  'Ghat No. 11', 'Ghat No. 12', 'Ghat No. 13', 'Ghat No. 14', 'Ghat No. 15',
  'Rainawari Ghat',
];

const AREAS = KASHMIR_AREAS;

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
  const [destinations, setDestinations] = useState<Destination[]>([]);

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

  useEffect(() => { fetchDestinations().then(setDestinations); }, []);

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
  const categoriesWithArea = ['shikara', 'taxi', 'guide', 'vendor'];
  const categoriesWithLanguage = ['shikara', 'taxi', 'guide', 'accommodation'];
  const showGhatFilter = !activeCategory || categoriesWithGhat.includes(activeCategory);
  const showAreaFilter = !activeCategory || categoriesWithArea.includes(activeCategory);
  const showLanguageFilter = !activeCategory || categoriesWithLanguage.includes(activeCategory);

  return (
    <>
      <header className="sticky top-0 z-30 bg-[#FAF8F3]/90 backdrop-blur-lg border-b border-border/50">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex items-center justify-between py-3 min-h-24">
            <Link href="/" className="flex items-center gap-3 shrink-0">
              <img src="/logo.png" alt="Kasheer360" className="h-32 w-auto object-contain" />
            </Link>
            <div className="flex items-center gap-2">
              <button
                onClick={locateMe}
                disabled={locating}
                className="hidden sm:inline-flex items-center gap-1.5 h-9 px-3 rounded-xl text-xs font-medium bg-secondary text-muted-foreground hover:bg-border transition-all disabled:opacity-50"
              >
                <MapPin className="h-3.5 w-3.5" />
                {locating ? 'Locating...' : userLat ? 'Near Me' : 'Near Me'}
              </button>
              <Link href="/auth/login" className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl text-xs font-medium text-foreground hover:bg-secondary transition-all">
                <LogIn className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Sign In</span>
              </Link>
              <Link href="/join" className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl text-xs font-medium bg-primary text-primary-foreground hover:bg-primary-light transition-all shadow-sm">
                <UserPlus className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Register</span>
              </Link>
            </div>
          </div>
          <form onSubmit={handleSearch} className="pb-4">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search operators..."
                className="w-full pl-10 pr-4 h-11 rounded-xl border border-border bg-card text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-ring transition-all"
              />
              <button
                type="button"
                onClick={locateMe}
                disabled={locating}
                className="sm:hidden absolute right-2 top-1/2 -translate-y-1/2 h-7 px-2 rounded-lg text-[11px] font-medium bg-secondary text-muted-foreground hover:bg-border transition-all disabled:opacity-50"
              >
                <MapPin className="h-3 w-3" />
              </button>
            </div>
          </form>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 pt-8 pb-12">
        {/* Hero Section */}
        <div className="relative mb-10 text-center overflow-hidden rounded-3xl border border-border/40">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-accent/5 to-primary/5" />
          <div className="absolute inset-0 opacity-[0.04]" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2316314D' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: '30px 30px'
          }} />
          <div className="relative p-8 sm:p-14">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-semibold uppercase tracking-wider mb-4">
              <Sparkles className="h-3.5 w-3.5 animate-pulse" />
              Explore Kashmir Like Never Before
            </div>
            <h1 className="text-3xl sm:text-5xl font-black text-foreground tracking-tight max-w-2xl mx-auto leading-tight">
              Connect Direct, <span className="text-accent">Book Local</span> on Kasheer360
            </h1>
            <p className="mt-4 text-base sm:text-lg text-muted-foreground max-w-xl mx-auto">
               Your premium gateway to verified houseboats, shikara rides, authentic local artisans, tourist guides, and local taxi services across Kashmir. 100% direct connection—no middlemen, no hidden commissions.
            </p>
          </div>
        </div>

        {/* AI Search Statement */}
        <div className="mb-10 p-5 rounded-2xl bg-accent/5 border border-accent/20 text-center">
          <p className="text-xs font-medium text-accent uppercase tracking-wider mb-1.5">AI & Search Optimized</p>
          <p className="text-sm text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Kasheer360 is Kashmir's local travel marketplace connecting travelers directly with verified hotels, houseboats, taxi operators, guides, and experience providers for transparent pricing and authentic local experiences.
          </p>
        </div>

        {/* Why Choose Us Section */}
        <div className="mb-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-card p-6 rounded-2xl border border-border/50 hover:border-accent/30 transition-all shadow-sm">
            <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent mb-4">
              <Compass className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-foreground mb-2">100% Verified & Direct</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Every operator is verified locally for authenticity. Get their direct WhatsApp and mobile numbers to plan and negotiate directly.
            </p>
          </div>
          <div className="bg-card p-6 rounded-2xl border border-border/50 hover:border-accent/30 transition-all shadow-sm">
            <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent mb-4">
              <SlidersHorizontal className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-foreground mb-2">No Hidden Commissions</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Travel portals charge up to 30% commission. Kasheer360 connects you directly with the owner so you pay fair, local rates.
            </p>
          </div>
          <div className="bg-card p-6 rounded-2xl border border-border/50 hover:border-accent/30 transition-all shadow-sm">
            <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent mb-4">
              <Sparkles className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-foreground mb-2">Promote Local Tourism</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Support local houseboats, shikara drivers, guides, and artisans directly, keeping tourism revenue where it belongs—in Kashmir.
            </p>
          </div>
        </div>

        {/* Discover Kashmir */}
        {destinations.length > 0 && (
          <div className="mb-10">
            <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <Compass className="h-5 w-5 text-accent" /> Discover Kashmir
            </h2>
            <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-none">
              {destinations.map((d) => (
                <a
                  key={d.title}
                  href={d.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group shrink-0 w-56 rounded-2xl border border-border/50 bg-card overflow-hidden hover:shadow-md hover:border-accent/30 transition-all duration-200"
                >
                  <div className="aspect-[16/9] bg-muted relative overflow-hidden">
                    {d.thumbnail ? (
                      <img src={d.thumbnail} alt={d.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-accent/10 to-accent/5">
                        <Compass className="h-10 w-10 text-accent/30" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                  </div>
                  <div className="p-3.5">
                    <h3 className="text-sm font-semibold text-foreground truncate">{d.title}</h3>
                    <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2 leading-relaxed">{d.extract}</p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-none">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.slug;
            return (
              <button
                key={cat.slug}
                onClick={() => setActiveCategory(cat.slug)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200 shrink-0 ${
                  isActive
                    ? 'bg-accent text-accent-foreground shadow-sm'
                    : 'bg-card text-muted-foreground border border-border hover:border-accent/30 hover:text-foreground'
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-accent-foreground' : 'text-muted-foreground'}`} />
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-2.5">
            {operators.length > 0 && (
              <p className="text-sm text-muted-foreground">{operators.length} operator{operators.length !== 1 ? 's' : ''}</p>
            )}
            {hasActiveFilters && (
              <button onClick={clearFilters} className="text-xs text-accent font-medium hover:underline inline-flex items-center gap-1">
                <RotateCcw className="h-3 w-3" /> Clear
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl text-xs font-medium transition-all ${
                showFilters || hasActiveFilters
                  ? 'bg-accent text-accent-foreground shadow-sm'
                  : 'bg-card text-muted-foreground border border-border hover:border-accent/30 hover:text-foreground'
              }`}
            >
              <Filter className="h-3.5 w-3.5" />
              Filters
              {hasActiveFilters && (
                <span className="ml-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-accent-foreground/20 text-[10px] font-bold">
                  {(selectedGhats.length + selectedAreas.length + selectedLanguages.length + (verifiedOnly ? 1 : 0) + (priceMin ? 1 : 0) + (priceMax ? 1 : 0))}
                </span>
              )}
            </button>
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none h-9 pl-3.5 pr-8 rounded-xl text-xs font-medium bg-card border border-border text-muted-foreground cursor-pointer hover:border-accent/30 hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring/40 transition-all"
              >
                <option value="relevance">Relevance</option>
                <option value="newest">Newest</option>
                <option value="name">Name A-Z</option>
                <option value="-name">Name Z-A</option>
              </select>
              <ArrowUpDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="mb-6 p-5 rounded-xl bg-card border border-border shadow-sm space-y-5">
            {/* Price range */}
            <div>
              <p className="text-xs font-semibold text-foreground mb-2.5">Price Range</p>
              <div className="flex items-center gap-2.5">
                <input
                  type="number"
                  placeholder="Min"
                  value={priceMin}
                  onChange={(e) => setPriceMin(e.target.value)}
                  className="w-full h-9 px-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring/40 transition-all"
                />
                <span className="text-muted-foreground text-xs">—</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={priceMax}
                  onChange={(e) => setPriceMax(e.target.value)}
                  className="w-full h-9 px-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring/40 transition-all"
                />
              </div>
            </div>

            {/* Ghat filter */}
            {showGhatFilter && (
              <div>
                <p className="text-xs font-semibold text-foreground mb-2.5">Ghat / Location</p>
                <div className="flex flex-wrap gap-2">
                  {GHATS.map((g) => {
                    const selected = selectedGhats.includes(g);
                    return (
                      <button
                        key={g}
                        onClick={() => toggleChip(selectedGhats, g, setSelectedGhats)}
                        className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                          selected
                            ? 'bg-accent text-accent-foreground border-accent'
                            : 'bg-background text-muted-foreground border-border hover:border-accent/40 hover:text-foreground'
                        }`}
                      >
                        {g}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Operating area filter */}
            {showAreaFilter && (
              <div>
                <p className="text-xs font-semibold text-foreground mb-2.5">Operating Area</p>
                <div className="flex flex-wrap gap-2">
                  {AREAS.map((a) => {
                    const selected = selectedAreas.includes(a);
                    return (
                      <button
                        key={a}
                        onClick={() => toggleChip(selectedAreas, a, setSelectedAreas)}
                        className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                          selected
                            ? 'bg-accent text-accent-foreground border-accent'
                            : 'bg-background text-muted-foreground border-border hover:border-accent/40 hover:text-foreground'
                        }`}
                      >
                        {a}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Language filter */}
            {showLanguageFilter && (
              <div>
                <p className="text-xs font-semibold text-foreground mb-2.5">Languages Spoken</p>
                <div className="flex flex-wrap gap-2">
                  {LANGUAGES.map((l) => {
                    const selected = selectedLanguages.includes(l);
                    return (
                      <button
                        key={l}
                        onClick={() => toggleChip(selectedLanguages, l, setSelectedLanguages)}
                        className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                          selected
                            ? 'bg-accent text-accent-foreground border-accent'
                            : 'bg-background text-muted-foreground border-border hover:border-accent/40 hover:text-foreground'
                        }`}
                      >
                        {l}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Verified only */}
            <label className="flex items-center gap-2.5 cursor-pointer group">
              <div className={`relative w-5 h-5 rounded-md border-2 transition-all ${
                verifiedOnly ? 'bg-accent border-accent' : 'border-border group-hover:border-accent/50'
              }`}>
                {verifiedOnly && (
                  <Check className="absolute inset-0 h-full w-full p-0.5 text-accent-foreground" />
                )}
                <input type="checkbox" checked={verifiedOnly} onChange={(e) => setVerifiedOnly(e.target.checked)} className="sr-only" />
              </div>
              <span className="text-xs font-medium text-foreground">Verified operators only</span>
            </label>
          </div>
        )}

        {/* Active filter chips */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2 mb-5">
            {priceMin && <Badge variant="outline" size="sm" className="gap-1.5 pr-1">Min: ₹{priceMin} <X className="h-3 w-3 cursor-pointer hover:text-danger transition-colors" onClick={() => setPriceMin('')} /></Badge>}
            {priceMax && <Badge variant="outline" size="sm" className="gap-1.5 pr-1">Max: ₹{priceMax} <X className="h-3 w-3 cursor-pointer hover:text-danger transition-colors" onClick={() => setPriceMax('')} /></Badge>}
            {selectedGhats.map(g => (
              <Badge key={g} variant="outline" size="sm" className="gap-1.5 pr-1">{g} <X className="h-3 w-3 cursor-pointer hover:text-danger transition-colors" onClick={() => setSelectedGhats(selectedGhats.filter(i => i !== g))} /></Badge>
            ))}
            {selectedAreas.map(a => (
              <Badge key={a} variant="outline" size="sm" className="gap-1.5 pr-1">{a} <X className="h-3 w-3 cursor-pointer hover:text-danger transition-colors" onClick={() => setSelectedAreas(selectedAreas.filter(i => i !== a))} /></Badge>
            ))}
            {selectedLanguages.map(l => (
              <Badge key={l} variant="outline" size="sm" className="gap-1.5 pr-1">{l} <X className="h-3 w-3 cursor-pointer hover:text-danger transition-colors" onClick={() => setSelectedLanguages(selectedLanguages.filter(i => i !== l))} /></Badge>
            ))}
            {verifiedOnly && <Badge variant="outline" size="sm" className="gap-1.5 pr-1">Verified <X className="h-3 w-3 cursor-pointer hover:text-danger transition-colors" onClick={() => setVerifiedOnly(false)} /></Badge>}
          </div>
        )}

        {/* Results grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {loading && operators.length === 0
            ? Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)
            : operators.map((op) => (
                <OperatorCard key={op.id} operator={op} />
              ))
          }
        </div>

        {/* Error state */}
        {fetchError && (
          <div className="text-center py-20">
            <div className="flex justify-center mb-5">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-danger/10">
                <AlertTriangle className="h-7 w-7 text-danger" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-foreground">Something went wrong</h3>
            <p className="text-sm text-muted-foreground mt-1.5 mb-5">{fetchError}</p>
            <Button variant="outline" onClick={() => fetchOperators()}>Try Again</Button>
          </div>
        )}

        {/* Empty state */}
        {!loading && !fetchError && operators.length === 0 && (
          <div className="text-center py-20">
            <div className="flex justify-center mb-5">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary">
                <Compass className="h-7 w-7 text-muted-foreground" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-foreground">No operators found</h3>
            <p className="text-sm text-muted-foreground mt-1.5">Try adjusting your filters or search term</p>
          </div>
        )}

        {/* Load more */}
        {hasMore && (
          <div className="text-center mt-8">
            <Button
              variant="outline"
              size="lg"
              onClick={() => fetchOperators(pageRef.current + 1, true)}
              disabled={loading}
              className="px-8"
            >
              {loading ? 'Loading...' : 'Load More'}
            </Button>
          </div>
        )}
      </main>
    </>
  );
}

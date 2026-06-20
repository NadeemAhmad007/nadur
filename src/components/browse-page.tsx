'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { OperatorCard } from '@/components/operator-card';
import { CardSkeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { KASHMIR_AREAS, AREA_GROUPS } from '@/lib/areas';
import { Badge } from '@/components/ui/badge';
import { fetchDestinations, type Destination } from '@/lib/wikipedia';
import { fetchFlights } from '@/lib/flights';
import { getUpcomingHoliday } from '@/lib/holidays';
import { fetchNews, type NewsItem } from '@/lib/news';
import { fetchEvents } from '@/lib/events';
import { fetchCategoryPhoto } from '@/lib/photos';
import dynamic from 'next/dynamic';
import {
  Search, MapPin, Navigation, Compass, Sparkles, Building2,
  Ship, Palette, Store, LogIn, UserPlus, Car,
  SlidersHorizontal, X, Check, ArrowUpDown, AlertTriangle,
  Heart, Menu, RotateCcw, Filter, Plane, Calendar, Map, Grid3X3, BadgeCheck,
} from 'lucide-react';

const MapView = dynamic(() => import('@/components/map-view'), { ssr: false });

const CATEGORIES = [
  { slug: '', label: 'All', icon: Sparkles },
  { slug: 'houseboat', label: 'Houseboats', icon: Building2 },
  { slug: 'accommodation', label: 'Accommodation', icon: Building2 },
  { slug: 'shikara', label: 'Shikara Rides', icon: Ship },
  { slug: 'taxi', label: 'Taxis', icon: Car },
  { slug: 'guide', label: 'Guides', icon: Navigation },
  { slug: 'artisan', label: 'Artisans', icon: Palette },
  { slug: 'vendor', label: 'Vendors', icon: Store },
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
  const [flightCount, setFlightCount] = useState<number | null>(null);
  const [upcomingHoliday, setUpcomingHoliday] = useState<{ date: string; name: string } | null>(null);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [showMap, setShowMap] = useState(false);
  const [events, setEvents] = useState<{ name: string; date: string; url: string; venue: string }[]>([]);
  const [pexelsCache, setPexelsCache] = useState<Record<string, string>>({});

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

  useEffect(() => { fetchFlights().then(d => setFlightCount(d?.count ?? null)); }, []);

  useEffect(() => { const h = getUpcomingHoliday(); if (h) setUpcomingHoliday({ date: h.date, name: h.localName }); }, []);

  useEffect(() => { fetchNews().then(setNews); }, []);

  useEffect(() => { fetchEvents().then(setEvents); }, []);

  useEffect(() => {
    if (operators.length === 0) return;
    const missing = operators.filter(o => !o.photos?.[0] && !pexelsCache[o.id]);
    if (missing.length === 0) return;
    missing.forEach(op => {
      fetchCategoryPhoto(op.category, op.short_desc?.split(' ').slice(0, 3).join(' ')).then(url => {
        if (url) setPexelsCache(prev => ({ ...prev, [op.id]: url }));
      });
    });
  }, [operators]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
  };

  const locateMe = () => {
    if (userLat && userLng) {
      setUserLat(null);
      setUserLng(null);
      if (sortBy === 'distance') setSortBy('relevance');
      return;
    }
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
    setUserLat(null);
    setUserLng(null);
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
          <div className="flex items-center justify-between py-3 min-h-16 sm:min-h-24">
            <Link href="/" className="flex items-center gap-3 shrink-0">
              <img src="/logo.png" alt="Kasheer360" className="h-16 sm:h-20 md:h-32 w-auto object-contain" />
            </Link>
            <div className="flex items-center gap-2">
              <Link href="/auth/login" className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-xs font-medium bg-white text-muted-foreground border border-border/60 hover:border-accent/30 hover:text-foreground transition-all">
                <LogIn className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Sign In</span>
              </Link>
              <Link href="/join" className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg text-xs font-medium bg-primary text-primary-foreground hover:bg-primary-light transition-all shadow-sm">
                <UserPlus className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Register</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 pt-12 pb-12">
        {/* Hero Section */}
        <div className="relative mb-16 text-center overflow-hidden rounded-xl bg-gradient-to-b from-primary to-primary-dark">
          <div className="absolute inset-0 opacity-[0.06]" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23FFFFFF' fill-opacity='0.15'%3E%3Cpath d='M50 50c0-5.523 4.477-10 10-10s10 4.477 10 10-4.477 10-10 10c0 5.523-4.477 10-10 10s-10-4.477-10-10 4.477-10 10-10z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: '60px 60px'
          }} />
          <div className="relative px-6 sm:px-16 pt-14 sm:pt-20 pb-14 sm:pb-20">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-accent/15 text-accent-light text-xs font-medium uppercase tracking-wider mb-5 border border-accent/20">
              <Sparkles className="h-3 w-3" />
              Kashmir's Verified Local Marketplace
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-display text-white leading-[1.1] max-w-3xl mx-auto font-normal tracking-tight">
              Connect Direct, <span className="text-accent">Book Local</span> on Kasheer360
            </h1>
            <p className="mt-4 text-base sm:text-lg text-white/70 max-w-xl mx-auto leading-relaxed font-[450]">
              Houseboats, shikara rides, taxis, guides, and local artisans — booked straight from the people who run them. No agents, no markups, no middlemen.
            </p>
            <p className="mt-3 text-sm text-white/50 max-w-lg mx-auto">
              500+ verified hosts · ₹0 commission · Direct WhatsApp contact
            </p>
          </div>
        </div>

        {/* How Kasheer360 Works */}
        <div className="mb-16">
          <h2 className="text-center text-2xl sm:text-3xl font-display text-foreground font-normal mb-10">
            How Kasheer360 Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {[
              { step: '01', title: 'Browse Verified Locals', desc: 'Explore authentic houseboats, shikaras, guides, and artisans — all verified by our team.' },
              { step: '02', title: 'Connect Direct via WhatsApp', desc: 'Message or call the provider directly. No contact forms, no intermediaries.' },
              { step: '03', title: 'Book & Pay Locally', desc: 'Arrange your stay or service directly with the owner. Fair rates, zero commission.' },
            ].map((item) => (
              <div key={item.step} className="text-center p-6 sm:p-8 rounded-lg bg-white border border-border/60">
                <div className="w-10 h-10 rounded-full bg-primary/5 flex items-center justify-center mx-auto mb-4">
                  <span className="text-sm font-semibold text-accent">{item.step}</span>
                </div>
                <h3 className="font-display text-lg font-medium text-foreground mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Trust strip */}
        <div className="mb-16">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[
              { icon: BadgeCheck, title: 'Verified, Not Just Listed', desc: 'Every host is checked in person before they go live. You get their real WhatsApp number and talk to them directly — like a local would.' },
              { icon: SlidersHorizontal, title: 'Fair Local Pricing', desc: 'Other platforms add up to 30% in commission. Kasheer360 takes none — the price you see is the price the owner actually charges.' },
              { icon: Compass, title: 'Tourism That Stays in Kashmir', desc: 'Every booking goes straight to the houseboat owner, the driver, the guide — not a call centre. You\'re funding the people who make Kashmir what it is.' },
            ].map((item) => (
              <div key={item.title} className="bg-white p-6 sm:p-7 rounded-lg border border-border/60 hover:shadow-sm transition-shadow">
                <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center text-accent mb-4">
                  <item.icon className="h-5 w-5" />
                </div>
                <h3 className="font-display text-lg font-medium text-foreground mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Flight info bar */}
        <div className="mb-5 p-3.5 rounded-xl bg-card border border-border/50 flex items-center justify-between group hover:border-accent/20 transition-all">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
              <Plane className="h-4 w-4 text-accent" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                {flightCount !== null
                  ? `${flightCount} arriving flight${flightCount === 1 ? '' : 's'} today at Srinagar Airport`
                  : 'Srinagar Airport (SXR) — check live arrivals'}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Sheikh ul-Alam International Airport • VISR</p>
            </div>
          </div>
          <a
            href="https://www.flightradar24.com/data/airports/sxr/arrivals"
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 text-xs font-medium text-accent hover:underline hidden sm:block"
          >
            View flights →
          </a>
        </div>

        {/* Discover Kashmir */}
        {destinations.length > 0 && (
          <div className="mb-10">
            <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <Compass className="h-5 w-5 text-accent" /> Discover Kashmir
            </h2>
            <div className="-mx-4 px-4 overflow-x-auto scrollbar-none max-w-[100vw]">
              <div className="flex gap-4" style={{ width: 'max-content' }}>
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
          </div>
        )}

        {/* Categories */}
        <div className="mb-10">
          <h2 className="text-lg font-display text-foreground font-normal mb-5">
            Browse by Category
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
            {CATEGORIES.filter(c => c.slug).map((cat) => {
              const Icon = cat.icon;
              const isActive = activeCategory === cat.slug;
              const gradients: Record<string, string> = {
                houseboat: 'from-[#16314D] to-[#2A4F72]',
                shikara: 'from-[#B65C38] to-[#C99A48]',
                artisan: 'from-[#3F6B4F] to-[#6B8F6B]',
                guide: 'from-[#16314D] to-[#3A6E94]',
                vendor: 'from-[#6B665E] to-[#8A7A6A]',
                taxi: 'from-[#2A4F72] to-[#4A6F8A]',
                homestay: 'from-[#B65C38] to-[#D47A58]',
                guest_house: 'from-[#3F6B4F] to-[#5A8B6A]',
              };
              const gradient = gradients[cat.slug] || 'from-primary to-primary-dark';
              return (
                <button
                  key={cat.slug}
                  onClick={() => setActiveCategory(cat.slug)}
                  className={`relative group rounded-lg overflow-hidden transition-all duration-300 ${
                    isActive ? 'ring-2 ring-accent ring-offset-2 ring-offset-background' : ''
                  }`}
                  style={{ aspectRatio: '4/3' }}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-90 group-hover:opacity-100 transition-opacity duration-300`} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                  <div className="relative h-full flex flex-col items-center justify-center p-4">
                    <Icon className="h-7 w-7 text-white/90 mb-2" />
                    <span className="font-display text-sm text-white font-medium">{cat.label}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Flight arrivals bar */}
        {flightCount !== null && (
          <div className="mb-6 flex items-center gap-2 justify-center text-xs text-muted-foreground">
            <Plane className="h-3.5 w-3.5" />
            <span>
              {flightCount === 0
                ? 'No flights arriving at Srinagar Airport today'
                : `${flightCount} flight${flightCount !== 1 ? 's' : ''} arriving at Srinagar Airport today`}
            </span>
          </div>
        )}

        {/* Toolbar */}
        <div className="space-y-3 mb-5">
          {/* Search row */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, category, or keyword..."
              className="w-full pl-10 pr-4 h-10 rounded-lg border border-border/60 bg-white text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring/40 transition-all"
            />
          </div>
          {/* Controls row */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              {operators.length > 0 && (
                <p className="text-xs text-muted-foreground">{operators.length} operator{operators.length !== 1 ? 's' : ''}</p>
              )}
              {hasActiveFilters && (
                <button onClick={clearFilters} className="text-xs text-accent font-medium hover:underline inline-flex items-center gap-1">
                  <RotateCcw className="h-3 w-3" /> Clear
                </button>
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap justify-end">
              <button
                onClick={locateMe}
                disabled={locating}
                className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-medium transition-all disabled:opacity-50 ${
                  userLat
                    ? 'bg-accent text-white shadow-sm'
                    : 'bg-white text-muted-foreground border border-border/60 hover:border-accent/30 hover:text-foreground'
                }`}
              >
                {userLat && <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span></span>}
                <MapPin className="h-3.5 w-3.5" />
                {locating ? 'Locating...' : userLat ? 'Near Me' : 'Near Me'}
              </button>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-medium transition-all ${
                  showFilters || hasActiveFilters
                    ? 'bg-accent text-accent-foreground shadow-sm'
                    : 'bg-white text-muted-foreground border border-border/60 hover:border-accent/30 hover:text-foreground'
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
                  className="appearance-none h-8 pl-3 pr-7 rounded-lg text-xs font-medium bg-white border border-border/60 text-muted-foreground cursor-pointer hover:border-accent/30 hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring/40 transition-all"
                >
                  <option value="relevance">Recommended</option>
                  <option value="-rating">Highest Rated</option>
                  {userLat && userLng && <option value="distance">Nearest</option>}
                  <option value="newest">Newest</option>
                </select>
                <ArrowUpDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground pointer-events-none" />
              </div>
              <button
                onClick={() => setShowMap(!showMap)}
                className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-medium transition-all ${
                  showMap
                    ? 'bg-accent text-accent-foreground shadow-sm'
                    : 'bg-white text-muted-foreground border border-border/60 hover:border-accent/30 hover:text-foreground'
                }`}
              >
                {showMap ? <span className="inline-flex items-center gap-1"><Grid3X3 className="h-3.5 w-3.5" />List</span> : <span className="inline-flex items-center gap-1"><Map className="h-3.5 w-3.5" />Map</span>}
              </button>
            </div>
          </div>
        </div>

        {/* Festival badge */}
        {upcomingHoliday && (
          <div className="mb-5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-accent/20 bg-accent/5 text-xs font-semibold text-accent">
              <Calendar className="h-3.5 w-3.5" />
              Upcoming: {upcomingHoliday.name} · {new Date(upcomingHoliday.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
            </span>
          </div>
        )}

        {/* News ticker */}
        {news.length > 0 && (
          <div className="mb-5 overflow-hidden">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border/50">
              <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider text-accent">News</span>
              <div className="overflow-hidden relative flex-1 h-5">
                <div className="animate-marquee whitespace-nowrap" style={{ '--duration': `${Math.max(news.length * 4, 15)}s` } as React.CSSProperties}>
                  {news.map((item, i) => (
                    <span key={i} className="inline-flex items-center gap-2 mr-8">
                      <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:text-accent transition-colors truncate max-w-[300px] sm:max-w-[500px] inline-block align-middle">
                        {item.title}
                      </a>
                      <span className="text-[10px] text-muted-foreground/50">{item.source}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Events */}
        {events.length > 0 && (
          <div className="mb-5">
            <div className="-mx-4 px-4 overflow-x-auto scrollbar-none max-w-[100vw]">
              <div className="flex items-center gap-2" style={{ width: 'max-content' }}>
                <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider text-accent">Events</span>
                {events.map((e, i) => (
                  <a
                    key={i}
                    href={e.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl border border-border/60 bg-card text-xs hover:border-accent/30 hover:bg-accent/5 transition-all"
                  >
                    <Calendar className="h-3 w-3 text-accent" />
                    <span className="font-medium text-foreground truncate max-w-[180px]">{e.name}</span>
                    <span className="text-muted-foreground">{e.date}</span>
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Filter Panel */}
        {showFilters && (
          <div className="mb-6 p-5 rounded-lg bg-white border border-border/60 shadow-xs space-y-5">
            {/* Price range */}
            <div>
              <p className="text-xs font-medium text-foreground mb-2.5">Price Range</p>
              <div className="flex items-center gap-2.5">
                <input
                  type="number"
                  placeholder="Min"
                  value={priceMin}
                  onChange={(e) => setPriceMin(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring/40 transition-all"
                />
                <span className="text-muted-foreground text-xs">—</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={priceMax}
                  onChange={(e) => setPriceMax(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring/40 transition-all"
                />
              </div>
            </div>

            {/* Ghat filter */}
            {showGhatFilter && (
              <div>
                <p className="text-xs font-medium text-foreground mb-2.5">Ghat / Location</p>
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
                <p className="text-xs font-medium text-foreground mb-2.5">Operating Area</p>
                <div className="space-y-3">
                  {AREA_GROUPS.map((group) => (
                    <div key={group.label}>
                      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1.5">{group.label}</p>
                      <div className="flex flex-wrap gap-2">
                        {group.items.map((a) => {
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
                  ))}
                </div>
              </div>
            )}

            {/* Language filter */}
            {showLanguageFilter && (
              <div>
                <p className="text-xs font-medium text-foreground mb-2.5">Languages Spoken</p>
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
              <div className={`relative w-5 h-5 rounded border-2 transition-all ${
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

        {/* Map view */}
        {showMap && operators.length > 0 && (
          <div className="mb-5 rounded-xl overflow-hidden border border-border" style={{ height: '500px' }}>
            <MapView
              operators={operators}
              userLat={userLat}
              userLng={userLng}
              onSelect={(slug) => router.push(`/o/${slug}`)}
            />
          </div>
        )}

        {/* Results grid */}
        {!showMap && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {loading && operators.length === 0
              ? Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)
              : operators.map((op) => (
                  <OperatorCard key={op.id} operator={op} pexelsFallback={pexelsCache[op.id] || null} />
                ))
            }
          </div>
        )}

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

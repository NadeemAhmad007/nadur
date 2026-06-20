'use client';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { Operator } from '@/types';
import {
  ArrowLeft, BadgeCheck, Heart, Share2, MessageCircle,
  ChevronLeft, ChevronRight, Phone, MapPin, Globe, Clock, Info,
  Star, User, Check, X, ChevronDown, Sparkles,
  Building2, Ship, Palette, Navigation, Store, Car, Map,
  TrendingUp, Hash, Sun, Droplets, Wind
} from 'lucide-react';
import Link from 'next/link';
import { countryOptions } from '@/data/country-codes';
import { fetchWeather, weatherEmoji, type WeatherData } from '@/lib/weather';
import { getExchangeRates, CURRENCIES } from '@/lib/currency';
import { fetchAQI, type AQIData } from '@/lib/air-quality';
import dynamic from 'next/dynamic';

const OperatorMap = dynamic(() => import('@/components/operator-map').then(m => m.OperatorMap), { ssr: false });

const categoryLabels: Record<string, string> = {
  houseboat: 'Houseboat', shikara: 'Shikara Ride', artisan: 'Artisan',
  guide: 'Local Guide', vendor: 'Floating Vendor', taxi: 'Taxi & Transfers',
  homestay: 'Homestay', guest_house: 'Guest House',
};

function getPrice(op: Operator): { label: string; value: string } | null {
  const c = op.category;
  if (c === 'shikara') {
    const d = op.shikara_details;
    if (d?.price_per_ride) return { label: 'Per ride', value: `₹${d.price_per_ride}` };
    if (d?.price_per_hour) return { label: 'Per hour', value: `₹${d.price_per_hour}` };
  }
  if (c === 'taxi') {
    const d = op.taxi_details;
    if (d?.price_per_km) return { label: 'Per km', value: `₹${d.price_per_km}` };
    if (d?.price_per_day) return { label: 'Per day', value: `₹${d.price_per_day}` };
    if (d?.airport_flat_rate) return { label: 'Airport flat', value: `₹${d.airport_flat_rate}` };
  }
  if (c === 'homestay' || c === 'guest_house') {
    const d = op.accommodation_details;
    if (d?.pricing_single) return { label: 'Per night', value: `₹${d.pricing_single}` };
    if (d?.pricing_double) return { label: 'Per night', value: `₹${d.pricing_double}` };
  }
  if (c === 'houseboat') {
    const t = op.tariffs;
    if (t) {
      const v = t.double_ep || t.double_cp || t.single_ep || t.single_cp;
      if (v) return { label: 'Per night', value: `₹${v}` };
    }
  }
  if (op.pricing_note) return { label: '', value: op.pricing_note };
  return null;
}

function getFeatures(op: Operator): string[] {
  const features: string[] = [];
  if (op.category === 'houseboat') {
    const d = op.houseboat_details as any;
    if (d?.amenities) features.push(...d.amenities);
    if (d?.room_types) features.push(...d.room_types.map((r: string) => r + ' room'));
  }
  if (op.category === 'shikara') {
    const d = op.shikara_details as any;
    if (d?.services) features.push(...d.services);
    if (d?.tour_duration) features.push(d.tour_duration + ' tour');
  }
  if (op.category === 'homestay' || op.category === 'guest_house') {
    const d = op.accommodation_details as any;
    if (d?.amenities) features.push(...d.amenities);
    if (d?.room_types) features.push(...d.room_types.map((r: string) => r));
    if (d?.meals_included) features.push(...d.meals_included.map((m: string) => m + ' included'));
  }
  if (op.category === 'taxi') {
    const d = op.taxi_details as any;
    if (d?.tour_types) features.push(...d.tour_types.map((t: string) => t + ' tours'));
    if (d?.vehicle_type) features.push(d.vehicle_type);
  }
  if (op.category === 'guide') {
    const d = op.guide_details as any;
    if (d?.specialties) features.push(...d.specialties);
    if (d?.certification) features.push('Certified: ' + d.certification);
  }
  if (op.category === 'artisan') {
    const d = op.artisan_details as any;
    if (d?.specialties) features.push(...d.specialties);
    if (d?.business_type) features.push(d.business_type);
  }
  if (op.category === 'vendor') {
    const d = op.vendor_details as any;
    if (d?.specialties) features.push(...d.specialties);
  }
  return features.slice(0, 8);
}

export function OperatorProfile({ operator: op }: { operator: Operator }) {
  const [currentPhoto, setCurrentPhoto] = useState(0);
  const [favorited, setFavorited] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [visitorName, setVisitorName] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [localNumber, setLocalNumber] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [overflow, setOverflow] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpSubmitting, setOtpSubmitting] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [stepError, setStepError] = useState('');

  const getPhone = () => countryCode + localNumber;

  const photos = op.photos?.length ? op.photos : [];
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [rates, setRates] = useState<Record<string, number> | null>(null);
  const [aqi, setAqi] = useState<AQIData | null>(null);

  const price = getPrice(op);
  const features = getFeatures(op);
  const hostSince = op.created_at ? new Date(op.created_at).getFullYear().toString() : null;
  const travelerConversations = op.lead_month || 0;

  useEffect(() => {
    const lat = op.lat || 34.08;
    const lng = op.lng || 74.79;
    fetchWeather(lat, lng).then(setWeather);
    getExchangeRates().then(setRates);
    fetchAQI(lat, lng).then(setAqi);
  }, [op.lat, op.lng]);

  useEffect(() => {
    const stored = localStorage.getItem('kasheer360-favorites');
    if (stored) {
      const ids = JSON.parse(stored) as string[];
      setFavorited(ids.includes(op.id));
    }
  }, [op.id]);

  const toggleFavorite = () => {
    const next = !favorited;
    setFavorited(next);
    const stored = localStorage.getItem('kasheer360-favorites');
    const ids: string[] = stored ? JSON.parse(stored) : [];
    const updated = next
      ? [...ids, op.id]
      : ids.filter((id) => id !== op.id);
    localStorage.setItem('kasheer360-favorites', JSON.stringify(updated));
  };

  const handleSubmit = async () => {
    if (!visitorName.trim() || !localNumber) return;
    const phone = getPhone();
    setSubmitting(true);
    setStepError('');

    if (op.plan === 'pro') {
      try {
        const res = await fetch('/api/leads/send-otp', {
          method: 'POST',
          body: JSON.stringify({ operator_id: op.id, visitor_name: visitorName.trim(), visitor_phone: phone }),
          headers: { 'Content-Type': 'application/json' },
        });
        const data = await res.json();
        if (!res.ok) { setStepError(data.error || 'Failed to send OTP'); setSubmitting(false); return; }
      } catch { setStepError('Failed to send OTP'); setSubmitting(false); return; }
      setSubmitting(false);
      setOtpSent(true);
      return;
    }

    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        body: JSON.stringify({ operator_id: op.id, source: 'profile', visitor_name: visitorName.trim(), visitor_phone: phone }),
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (!res.ok) { setStepError(data.error || 'Failed to submit'); setSubmitting(false); return; }
      setOverflow(data.overflow);
    } catch { setSubmitting(false); return; }
    setShowForm(false);
    setSubmitting(false);
    const waUrl = `https://wa.me/${op.whatsapp}?text=${encodeURIComponent(`Hi! I found you on Kasheer360. I'm interested in your ${op.category ? (categoryLabels[op.category] || op.category) : ''}.`)}`;
    window.location.href = waUrl;
  };

  const handleOtpSubmit = async () => {
    if (!otp.trim()) return;
    const phone = getPhone();
    setOtpSubmitting(true);
    setOtpError('');
    try {
      const res = await fetch('/api/leads/verify-otp', {
        method: 'POST',
        body: JSON.stringify({ operator_id: op.id, visitor_name: visitorName.trim(), visitor_phone: phone, otp: otp.trim() }),
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (!res.ok) { setOtpError(data.error || 'Invalid OTP'); setOtpSubmitting(false); return; }
      window.location.href = data.waUrl || `https://wa.me/${op.whatsapp}`;
    } catch { setOtpError('Failed to verify OTP'); setOtpSubmitting(false); }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* ── Gallery ── */}
      <div className="relative bg-muted">
        {photos.length > 0 ? (
          <>
            <div className="aspect-[16/9] sm:aspect-[21/9] relative overflow-hidden">
              <img
                src={photos[currentPhoto]}
                alt={op.name}
                className="w-full h-full object-cover transition-opacity duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/5" />
              {photos.length > 1 && (
                <>
                  <button
                    onClick={() => setCurrentPhoto(p => p === 0 ? photos.length - 1 : p - 1)}
                    className="absolute left-4 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 backdrop-blur shadow-lg hover:bg-white transition-all active:scale-95"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => setCurrentPhoto(p => p === photos.length - 1 ? 0 : p + 1)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 backdrop-blur shadow-lg hover:bg-white transition-all active:scale-95"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </>
              )}
            </div>
            {photos.length > 1 && (
              <div className="flex justify-center gap-1.5 pb-1 mt-2">
                {photos.map((photo, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPhoto(i)}
                    className={`shrink-0 w-12 h-9 rounded overflow-hidden border transition-all duration-200 ${
                      i === currentPhoto
                        ? 'border-accent opacity-100'
                        : 'border-transparent opacity-50 hover:opacity-80'
                    }`}
                  >
                    <img src={photo} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="aspect-[16/9] sm:aspect-[21/9] flex items-center justify-center bg-gradient-to-br from-muted to-border/50">
            <div className="text-center">
              <div className="text-7xl font-bold text-muted-foreground/15">{op.name[0]}</div>
            </div>
          </div>
        )}

        {/* Top actions */}
        <div className="absolute top-4 left-4 z-10 flex gap-2">
          <Link href="/" className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 backdrop-blur shadow-sm hover:bg-white transition-all active:scale-95">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </div>
        <div className="absolute top-4 right-4 z-10 flex gap-2">
          <button
            onClick={toggleFavorite}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 backdrop-blur shadow-sm hover:bg-white transition-all active:scale-95"
          >
            <Heart className={`h-5 w-5 ${favorited ? 'fill-danger text-danger' : ''}`} />
          </button>
          <button className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 backdrop-blur shadow-sm hover:bg-white transition-all active:scale-95">
            <Share2 className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-12">

          {/* ── Left Column ── */}
          <div className="space-y-10 min-w-0">

            {/* Title block */}
            <div>
              <h1 className="text-2xl sm:text-3xl font-display text-foreground font-normal leading-tight">{op.name}</h1>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
                {op.category && (
                  <span className="text-xs font-medium text-muted-foreground/70 uppercase tracking-wider">
                    {categoryLabels[op.category] || op.category}
                  </span>
                )}
                {op.verified && (
                  <>
                    <span className="text-muted-foreground/30">&middot;</span>
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-accent">
                      <BadgeCheck className="h-3.5 w-3.5" /> Verified by Kasheer360
                    </span>
                  </>
                )}
              </div>
              {(travelerConversations > 0 || hostSince) && (
                <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                  {travelerConversations > 0 && (
                    <>
                      <span className="inline-flex items-center gap-1"><Star className="h-3 w-3 text-accent fill-accent" /> {travelerConversations} traveler conversation{travelerConversations !== 1 ? 's' : ''}</span>
                      {hostSince && <span className="text-muted-foreground/30">&middot;</span>}
                    </>
                  )}
                  {hostSince && <span>Host since {hostSince}</span>}
                </div>
              )}
            </div>

            {/* About */}
            {(op.short_desc || op.long_desc) && (
              <div>
                <h2 className="font-display text-xl font-medium text-foreground mb-3">About this {op.category ? categoryLabels[op.category]?.toLowerCase() : 'listing'}</h2>
                {op.short_desc && <p className="text-sm text-foreground leading-relaxed">{op.short_desc}</p>}
                {op.long_desc && <p className="text-sm text-foreground leading-relaxed mt-3">{op.long_desc}</p>}
              </div>
            )}

            {/* Your host */}
            <div>
              <h2 className="font-display text-xl font-medium text-foreground mb-4">Your host</h2>
              <div className="flex items-start gap-4 p-5 rounded-lg bg-white border border-border/60">
                <div className="w-14 h-14 rounded-full bg-muted overflow-hidden shrink-0">
                  {photos[0] ? (
                    <img src={photos[0]} alt={op.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground/30 text-xl font-bold">
                      {op.name[0]}
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-display text-lg font-medium text-foreground">Meet {op.name.split(' ')[0]}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {hostSince ? `Hosting since ${hostSince}` : 'Verified in person by Kasheer360'}
                    {op.verified && <> &middot; Verified by Kasheer360</>}
                  </p>
                  <p className="text-sm text-muted-foreground mt-3 leading-relaxed italic border-l-2 border-accent/30 pl-3">
                    {op.short_desc || 'Providing authentic local experiences in Kashmir.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Features */}
            {features.length > 0 && (
              <div>
                <h2 className="font-display text-xl font-medium text-foreground mb-3">What's included</h2>
                <div className="flex flex-wrap gap-2">
                  {features.map((f, i) => (
                    <span key={i} className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white border border-border/60 text-xs text-foreground">
                      <Check className="h-3 w-3 text-pine" />
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Weather / AQI / Currency */}
            {(weather || aqi || rates) && (
              <div>
                <h2 className="font-display text-xl font-medium text-foreground mb-3">Know before you go</h2>
                <div className="rounded-lg bg-white border border-border/60 divide-y divide-border/50">
                  {weather && (
                    <div className="p-4 flex items-center gap-4">
                      <span className="text-2xl">{weatherEmoji(weather.current.weatherCode)}</span>
                      <div>
                        <p className="text-sm font-medium text-foreground">{Math.round(weather.current.temperature)}°C</p>
                        <p className="text-xs text-muted-foreground">Feels like {Math.round(weather.current.feelsLike)}°C &middot; {weather.current.humidity}% humidity</p>
                      </div>
                      <div className="ml-auto flex gap-3 text-xs text-muted-foreground">
                        {weather.daily.slice(1, 4).map((day) => (
                          <div key={day.date} className="text-center">
                            <p>{new Date(day.date + 'T12:00:00').toLocaleDateString('en-IN', { weekday: 'short' })}</p>
                            <p className="text-foreground font-medium">{Math.round(day.tempMax)}°</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {aqi && aqi.eaqi != null && (
                    <div className="p-4 flex items-center gap-3 text-sm">
                      <span className="inline-block w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: aqi.color }} />
                      <span className="text-foreground">AQI {aqi.eaqi}/100</span>
                      <span className="text-muted-foreground">&middot; {aqi.label}</span>
                    </div>
                  )}
                  {rates && (
                    <div className="p-4 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                      <span className="text-muted-foreground">Approximate conversion:</span>
                      {CURRENCIES.slice(0, 3).map((code) => {
                        const rate = rates[code];
                        if (!rate) return null;
                        return (
                          <span key={code} className="text-foreground">
                            1 INR = {rate.toFixed(2)} {code}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Category-specific details */}
            {op.houseboat_details && op.category === 'houseboat' && (
              <div>
                <h2 className="font-display text-xl font-medium text-foreground mb-4">Houseboat details</h2>
                <div className="rounded-lg bg-white border border-border/60 divide-y divide-border/50">
                  {(op.houseboat_details as any).owner && <DetailRow icon={User} label="Owner" value={(op.houseboat_details as any).owner} />}
                  {(op.houseboat_details as any).address && <DetailRow icon={MapPin} label="Address" value={(op.houseboat_details as any).address} />}
                  {(op.houseboat_details as any).grade && <DetailRow icon={Star} label="Grade" value={(op.houseboat_details as any).grade} />}
                  {(op.houseboat_details as any).total_rooms && <DetailRow icon={Building2} label="Total rooms" value={(op.houseboat_details as any).total_rooms} />}
                  {(op.houseboat_details as any).capacity && <DetailRow icon={User} label="Max guests" value={(op.houseboat_details as any).capacity} />}
                  {(op.houseboat_details as any).boat_ghat && <DetailRow icon={Map} label="Boat ghat" value={(op.houseboat_details as any).boat_ghat} />}
                  {(op.houseboat_details as any).google_maps && (
                    <a href={(op.houseboat_details as any).google_maps} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-3 text-sm text-accent font-medium hover:bg-muted/50 transition-colors">
                      <Globe className="h-4 w-4" /> View on Google Maps
                    </a>
                  )}
                </div>
              </div>
            )}

            {op.shikara_details && op.category === 'shikara' && (
              <div>
                <h2 className="font-display text-xl font-medium text-foreground mb-4">Shikara details</h2>
                <div className="rounded-lg bg-white border border-border/60 divide-y divide-border/50">
                  {(op.shikara_details as any).full_name && <DetailRow icon={User} label="Full name" value={(op.shikara_details as any).full_name} />}
                  {(op.shikara_details as any).shikara_number && <DetailRow icon={Star} label="Shikara No." value={(op.shikara_details as any).shikara_number} />}
                  {(op.shikara_details as any).ghat_number && <DetailRow icon={Map} label="Ghat" value={(op.shikara_details as any).ghat_number} />}
                  {(op.shikara_details as any).operating_areas?.length > 0 && <DetailRow icon={MapPin} label="Areas" value={(op.shikara_details as any).operating_areas.join(', ')} />}
                  {(op.shikara_details as any).years_experience && <DetailRow icon={Clock} label="Experience" value={`${(op.shikara_details as any).years_experience} years`} />}
                  {(op.shikara_details as any).tour_duration && <DetailRow icon={Clock} label="Tour duration" value={(op.shikara_details as any).tour_duration} />}
                </div>
              </div>
            )}

            {op.artisan_details && op.category === 'artisan' && (
              <div>
                <h2 className="font-display text-xl font-medium text-foreground mb-4">Artisan details</h2>
                <div className="rounded-lg bg-white border border-border/60 divide-y divide-border/50">
                  {(op.artisan_details as any).business_type && <DetailRow icon={Store} label="Business type" value={(op.artisan_details as any).business_type} />}
                  {(op.artisan_details as any).owner_name && <DetailRow icon={User} label="Owner" value={(op.artisan_details as any).owner_name} />}
                  {(op.artisan_details as any).years_in_business && <DetailRow icon={Clock} label="Years in business" value={(op.artisan_details as any).years_in_business} />}
                  {(op.artisan_details as any).business_scale && <DetailRow icon={TrendingUp} label="Scale" value={(op.artisan_details as any).business_scale} />}
                  {(op.artisan_details as any).specialties?.length > 0 && <DetailRow icon={Sparkles} label="Specialties" value={(op.artisan_details as any).specialties.join(', ')} />}
                  {(op.artisan_details as any).google_maps && (
                    <a href={(op.artisan_details as any).google_maps} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-3 text-sm text-accent font-medium hover:bg-muted/50 transition-colors">
                      <Globe className="h-4 w-4" /> View on Google Maps
                    </a>
                  )}
                </div>
              </div>
            )}

            {(op.accommodation_details && (op.category === 'homestay' || op.category === 'guest_house')) && (
              <div>
                <h2 className="font-display text-xl font-medium text-foreground mb-4">Property details</h2>
                <div className="rounded-lg bg-white border border-border/60 divide-y divide-border/50">
                  {(op.accommodation_details as any).owner_name && <DetailRow icon={User} label="Owner" value={(op.accommodation_details as any).owner_name} />}
                  {(op.accommodation_details as any).address && <DetailRow icon={MapPin} label="Address" value={(op.accommodation_details as any).address} />}
                  {(op.accommodation_details as any).total_rooms && <DetailRow icon={Building2} label="Rooms" value={(op.accommodation_details as any).total_rooms} />}
                  {(op.accommodation_details as any).room_types?.length > 0 && <DetailRow icon={Building2} label="Room types" value={(op.accommodation_details as any).room_types.join(', ')} />}
                  {(op.accommodation_details as any).check_in && <DetailRow icon={Clock} label="Check-in" value={(op.accommodation_details as any).check_in} />}
                  {(op.accommodation_details as any).check_out && <DetailRow icon={Clock} label="Check-out" value={(op.accommodation_details as any).check_out} />}
                  {(op.accommodation_details as any).nearby_attractions && <DetailRow icon={MapPin} label="Nearby attractions" value={(op.accommodation_details as any).nearby_attractions} />}
                  {(op.accommodation_details as any).google_maps && (
                    <a href={(op.accommodation_details as any).google_maps} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-3 text-sm text-accent font-medium hover:bg-muted/50 transition-colors">
                      <Globe className="h-4 w-4" /> View on Google Maps
                    </a>
                  )}
                </div>
              </div>
            )}

            {op.taxi_details && op.category === 'taxi' && (
              <div>
                <h2 className="font-display text-xl font-medium text-foreground mb-4">Taxi details</h2>
                <div className="rounded-lg bg-white border border-border/60 divide-y divide-border/50">
                  {op.taxi_details.driver_name && <DetailRow icon={User} label="Driver" value={op.taxi_details.driver_name} />}
                  {op.taxi_details.vehicle_type && <DetailRow icon={Car} label="Vehicle type" value={op.taxi_details.vehicle_type} />}
                  {op.taxi_details.vehicle_model && <DetailRow icon={Car} label="Model" value={op.taxi_details.vehicle_model} />}
                  {op.taxi_details.registration_number && <DetailRow icon={Hash} label="Registration" value={op.taxi_details.registration_number} />}
                  {(op.taxi_details as any).operating_areas?.length > 0 && <DetailRow icon={MapPin} label="Areas" value={(op.taxi_details as any).operating_areas.join(', ')} />}
                  {op.taxi_details.years_experience && <DetailRow icon={Clock} label="Experience" value={`${op.taxi_details.years_experience} years`} />}
                  {op.taxi_details.google_maps && (
                    <a href={op.taxi_details.google_maps} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-3 text-sm text-accent font-medium hover:bg-muted/50 transition-colors">
                      <Globe className="h-4 w-4" /> View on Google Maps
                    </a>
                  )}
                </div>
              </div>
            )}

            {op.guide_details && op.category === 'guide' && (
              <div>
                <h2 className="font-display text-xl font-medium text-foreground mb-4">Guide details</h2>
                <div className="rounded-lg bg-white border border-border/60 divide-y divide-border/50">
                  {op.guide_details.full_name && <DetailRow icon={User} label="Name" value={op.guide_details.full_name} />}
                  {op.guide_details.years_experience && <DetailRow icon={Clock} label="Experience" value={`${op.guide_details.years_experience} years`} />}
                  {op.guide_details.certification && <DetailRow icon={BadgeCheck} label="Certification" value={op.guide_details.certification} />}
                  {op.guide_details.languages && op.guide_details.languages.length > 0 && <DetailRow icon={Globe} label="Languages" value={op.guide_details.languages.join(', ')} />}
                  {op.guide_details.specialties && op.guide_details.specialties.length > 0 && <DetailRow icon={Sparkles} label="Specialties" value={op.guide_details.specialties.join(', ')} />}
                  {op.guide_details.operating_areas && op.guide_details.operating_areas.length > 0 && <DetailRow icon={MapPin} label="Operating areas" value={op.guide_details.operating_areas.join(', ')} />}
                  {op.guide_details.google_maps && (
                    <a href={op.guide_details.google_maps} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-3 text-sm text-accent font-medium hover:bg-muted/50 transition-colors">
                      <Globe className="h-4 w-4" /> View on Google Maps
                    </a>
                  )}
                </div>
              </div>
            )}

            {op.vendor_details && op.category === 'vendor' && (
              <div>
                <h2 className="font-display text-xl font-medium text-foreground mb-4">Vendor details</h2>
                <div className="rounded-lg bg-white border border-border/60 divide-y divide-border/50">
                  {op.vendor_details.business_name && <DetailRow icon={Store} label="Business" value={op.vendor_details.business_name} />}
                  {op.vendor_details.owner_name && <DetailRow icon={User} label="Owner" value={op.vendor_details.owner_name} />}
                  {op.vendor_details.business_type && <DetailRow icon={Building2} label="Type" value={op.vendor_details.business_type.replace('_', ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())} />}
                  {op.vendor_details.specialties && op.vendor_details.specialties.length > 0 && <DetailRow icon={Sparkles} label="Specialties" value={op.vendor_details.specialties.join(', ')} />}
                  {op.vendor_details.operating_areas && op.vendor_details.operating_areas.length > 0 && <DetailRow icon={MapPin} label="Areas" value={op.vendor_details.operating_areas.join(', ')} />}
                  {op.vendor_details.google_maps && (
                    <a href={op.vendor_details.google_maps} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-3 text-sm text-accent font-medium hover:bg-muted/50 transition-colors">
                      <Globe className="h-4 w-4" /> View on Google Maps
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Pricing */}
            {(op.tariffs && op.category === 'houseboat') && (
              <div>
                <h2 className="font-display text-xl font-medium text-foreground mb-4">Tariffs</h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {([
                    ['double_ep', 'Double EP'], ['double_cp', 'Double CP'],
                    ['double_map', 'Double MAP'], ['double_ap', 'Double AP'],
                    ['single_ep', 'Single EP'], ['single_cp', 'Single CP'],
                    ['single_map', 'Single MAP'], ['single_ap', 'Single AP'],
                  ] as const).map(([key, label]) => {
                    const val = (op.tariffs as any)?.[key];
                    if (!val) return null;
                    const usd = rates ? (val * rates.USD).toFixed(0) : null;
                    return (
                      <div key={key} className="rounded-lg bg-secondary p-3.5 text-center">
                        <p className="text-[11px] text-muted-foreground uppercase tracking-wider">{label}</p>
                        <p className="text-lg font-bold text-foreground mt-0.5">₹{val}</p>
                        {usd && <p className="text-[10px] text-muted-foreground/60 mt-0.5">≈${usd}</p>}
                      </div>
                    );
                  })}
                </div>
                {(op.tariffs as any)?.note && (
                  <p className="text-xs text-muted-foreground mt-3">{(op.tariffs as any).note}</p>
                )}
              </div>
            )}

            {(op.accommodation_details && (op.category === 'homestay' || op.category === 'guest_house')) && (
              <div>
                <h2 className="font-display text-xl font-medium text-foreground mb-4">Pricing</h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    ['pricing_single', 'Single/Night'],
                    ['pricing_double', 'Double/Night'],
                  ].map(([key, label]) => {
                    const val = (op.accommodation_details as any)?.[key];
                    if (!val) return null;
                    const usd = rates ? (val * rates.USD).toFixed(0) : null;
                    return (
                      <div key={key} className="rounded-lg bg-secondary p-3.5 text-center">
                        <p className="text-[11px] text-muted-foreground uppercase tracking-wider">{label}</p>
                        <p className="text-lg font-bold text-foreground mt-0.5">₹{val}</p>
                        {usd && <p className="text-[10px] text-muted-foreground/60 mt-0.5">≈${usd}</p>}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {op.taxi_details && op.category === 'taxi' && (
              <div>
                <h2 className="font-display text-xl font-medium text-foreground mb-4">Pricing</h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {op.taxi_details.price_per_km && (
                    <div className="rounded-lg bg-secondary p-3.5 text-center">
                      <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Per km</p>
                      <p className="text-lg font-bold text-foreground mt-0.5">₹{op.taxi_details.price_per_km}</p>
                    </div>
                  )}
                  {op.taxi_details.price_per_day && (
                    <div className="rounded-lg bg-secondary p-3.5 text-center">
                      <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Per day</p>
                      <p className="text-lg font-bold text-foreground mt-0.5">₹{op.taxi_details.price_per_day}</p>
                    </div>
                  )}
                  {op.taxi_details.airport_flat_rate && (
                    <div className="rounded-lg bg-secondary p-3.5 text-center">
                      <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Airport</p>
                      <p className="text-lg font-bold text-foreground mt-0.5">₹{op.taxi_details.airport_flat_rate}</p>
                    </div>
                  )}
                  {op.taxi_details.extra_per_km && (
                    <div className="rounded-lg bg-secondary p-3.5 text-center">
                      <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Extra/km</p>
                      <p className="text-lg font-bold text-foreground mt-0.5">₹{op.taxi_details.extra_per_km}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {op.pricing_note && !price && (
              <p className="text-sm text-muted-foreground">{op.pricing_note}</p>
            )}

            {/* Location */}
            {(op.lat && op.lng) ? (
              <div>
                <h2 className="font-display text-xl font-medium text-foreground mb-3">Location</h2>
                <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                  {op.category === 'houseboat' ? 'On Dal Lake' : 'Srinagar'}, Kashmir
                </p>
                <OperatorMap lat={op.lat} lng={op.lng} name={op.name} />
              </div>
            ) : (op.lat || op.lng) && (
              <div>
                <h2 className="font-display text-xl font-medium text-foreground mb-3">Location</h2>
                <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                  {op.category === 'houseboat' ? 'On Dal Lake' : 'Srinagar'}, Kashmir
                </p>
                <div className="w-full h-44 rounded-lg bg-muted flex items-center justify-center text-xs text-muted-foreground border border-border/60">
                  <MapPin className="h-4 w-4 mr-1" /> {op.lat?.toFixed(4)}, {op.lng?.toFixed(4)}
                </div>
              </div>
            )}

            {/* Traveler conversations */}
            {overflow && (
              <div className="p-4 rounded-lg bg-warning/5 border border-warning/20 flex items-start gap-2.5">
                <Info className="h-4 w-4 text-warning shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground">This operator is currently at capacity. Your enquiry has been forwarded to our team.</p>
              </div>
            )}

            {/* Browse all */}
            <div className="text-center pt-4">
              <Link href="/" className="text-xs text-muted-foreground hover:text-accent transition-colors inline-flex items-center gap-1">
                Browse all operators
              </Link>
            </div>
          </div>

          {/* ── Right Sidebar ── */}
          <aside className="hidden lg:block">
            <div className="sticky top-32">
              <div className="rounded-lg bg-white border border-border/60 shadow-sm">
                <div className="p-6">
                  {price ? (
                    <>
                      <div className="font-display text-3xl font-medium text-foreground">{price.value}</div>
                      <p className="text-xs text-muted-foreground mt-1">{price.label}</p>
                    </>
                  ) : (
                    <div className="font-display text-lg font-medium text-foreground">Contact for pricing</div>
                  )}
                  <p className="text-xs text-accent font-medium mt-2">Owner sets this price directly &middot; ₹0 commission</p>

                  <button
                    onClick={() => setShowForm(true)}
                    className="flex items-center justify-center gap-2 w-full mt-5 py-3.5 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent/90 transition-colors"
                  >
                    <MessageCircle className="h-4 w-4" />
                    Chat on WhatsApp
                  </button>

                  {op.whatsapp && (
                    <a
                      href={`tel:${op.whatsapp}`}
                      className="flex items-center justify-center gap-2 w-full mt-2.5 py-2.5 rounded-lg border border-border/60 text-sm text-foreground hover:border-accent/30 transition-colors"
                    >
                      <Phone className="h-4 w-4" />
                      Call Direct
                    </a>
                  )}

                  <div className="flex items-center justify-center gap-1.5 mt-4 text-xs text-pine font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-pine" />
                    Typically replies within 1 hour
                  </div>
                </div>
              </div>

              {/* Languages */}
              {(op.shikara_details as any)?.languages?.length > 0 ||
               (op.taxi_details as any)?.languages?.length > 0 ||
               (op.guide_details as any)?.languages?.length > 0 ? (
                <div className="mt-3 text-center text-xs text-muted-foreground">
                  Speaks {
                    [...new Set([
                      ...((op.shikara_details as any)?.languages || []),
                      ...((op.taxi_details as any)?.languages || []),
                      ...(op.guide_details?.languages || []),
                    ])].join(', ')
                  }
                </div>
              ) : (
                <div className="mt-3 text-center text-xs text-muted-foreground">
                  Speaks English &middot; Urdu &middot; Kashmiri
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>

      {/* ── Mobile Bottom CTA ── */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-border/60 px-4 py-3 flex items-center justify-between z-30">
        <div>
          {price ? (
            <>
              <div className="font-display text-xl font-medium text-foreground">{price.value}</div>
              <p className="text-[10px] text-muted-foreground">{price.label} &middot; Owner sets price directly</p>
            </>
          ) : (
            <div className="font-display text-base font-medium text-foreground">Contact for pricing</div>
          )}
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 py-2.5 px-5 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent/90 transition-colors shrink-0"
        >
          <MessageCircle className="h-4 w-4" />
          Chat
        </button>
      </div>

      {/* ── Lead Form Modal ── */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setShowForm(false)}>
          <div className="w-full max-w-sm bg-white rounded-lg shadow-xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-border/60">
              <h3 className="font-display text-lg font-medium text-foreground">
                {otpSent ? 'Verify your phone' : 'Contact via WhatsApp'}
              </h3>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
            <div className="p-5 space-y-5">
              {otpSent ? (
                <>
                  <p className="text-sm text-muted-foreground">Enter the one-time code sent to <span className="font-medium text-foreground">{getPhone()}</span></p>
                  <Input
                    label="OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    className="text-center tracking-[0.4em] text-lg font-mono"
                  />
                  {otpError && <p className="text-xs text-danger">{otpError}</p>}
                  <div className="flex gap-2.5">
                    <Button onClick={handleOtpSubmit} disabled={otp.length < 4 || otpSubmitting} className="flex-1">
                      {otpSubmitting ? 'Verifying...' : 'Verify & Contact'}
                    </Button>
                    <Button variant="outline" onClick={() => { setOtpSent(false); setOtp(''); setOtpError(''); handleSubmit(); }} disabled={submitting}>
                      Resend
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-3 pb-1">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                      <MessageCircle className="h-5 w-5 text-accent" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{op.name}</p>
                      <p className="text-xs text-muted-foreground">Reach out directly via WhatsApp</p>
                    </div>
                  </div>
                  {op.plan === 'pro' && (
                    <p className="text-xs text-muted-foreground bg-secondary rounded-lg px-3.5 py-2.5">We'll send a one-time code to verify your number.</p>
                  )}
                  <Input
                    label="Your name"
                    value={visitorName}
                    onChange={(e) => setVisitorName(e.target.value)}
                    placeholder="Enter your name"
                  />
                  <label className="text-sm font-medium text-foreground">Phone number</label>
                  <div className="flex gap-2.5">
                    <div className="relative w-[140px] shrink-0">
                      <select
                        value={countryCode}
                        onChange={(e) => setCountryCode(e.target.value)}
                        className="flex h-10 w-full rounded-lg border border-input bg-card px-3 pr-8 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-ring/40 transition-all"
                      >
                        {countryOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    </div>
                    <Input
                      type="tel"
                      value={localNumber}
                      onChange={(e) => setLocalNumber(e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder="1234567890"
                      className="flex-1"
                    />
                  </div>
                  {stepError && <p className="text-xs text-danger">{stepError}</p>}
                  <Button onClick={handleSubmit} disabled={!visitorName.trim() || !localNumber || submitting} className="w-full" size="lg">
                    {submitting ? 'Sending...' : op.plan === 'pro' ? 'Send OTP' : 'Start Chat'}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Padding for mobile CTA */}
      <div className="lg:hidden h-20" />
    </div>
  );
}

function DetailRow({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 text-sm">
      <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm text-foreground truncate">{value}</p>
      </div>
    </div>
  );
}

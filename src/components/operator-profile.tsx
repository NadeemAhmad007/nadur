'use client';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { Operator } from '@/types';
import {
  ArrowLeft, BadgeCheck, Heart, Share2, MessageCircle,
  ChevronLeft, ChevronRight, Send, MapPin, Phone, Mail,
  Star, User, Map, Clock, Globe, AlertCircle, X, TrendingUp
} from 'lucide-react';
import Link from 'next/link';

const categoryLabels: Record<string, string> = {
  houseboat: 'Houseboat', shikara: 'Shikara Ride', artisan: 'Artisan',
  guide: 'Local Guide', vendor: 'Floating Vendor',
};

export function OperatorProfile({ operator: op }: { operator: Operator }) {
  const [currentPhoto, setCurrentPhoto] = useState(0);
  const [favorited, setFavorited] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [visitorName, setVisitorName] = useState('');
  const [visitorPhone, setVisitorPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const photos = op.photos?.length ? op.photos : [];

  useEffect(() => {
    const stored = localStorage.getItem('kashmir360-favorites');
    if (stored) {
      const ids = JSON.parse(stored) as string[];
      setFavorited(ids.includes(op.id));
    }
  }, [op.id]);

  const toggleFavorite = () => {
    const next = !favorited;
    setFavorited(next);
    const stored = localStorage.getItem('kashmir360-favorites');
    const ids: string[] = stored ? JSON.parse(stored) : [];
    const updated = next
      ? [...ids, op.id]
      : ids.filter((id) => id !== op.id);
    localStorage.setItem('kashmir360-favorites', JSON.stringify(updated));
  };

  const handleSubmit = async () => {
    if (!visitorName.trim() || !visitorPhone.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        body: JSON.stringify({ operator_id: op.id, source: 'profile', visitor_name: visitorName.trim(), visitor_phone: visitorPhone.trim() }),
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (data.blocked) { setBlocked(true); setShowForm(false); setSubmitting(false); return; }
    } catch { setSubmitting(false); return; }
    setShowForm(false);
    setSubmitting(false);
    const waUrl = `https://wa.me/${op.whatsapp}?text=${encodeURIComponent(`Hi! I found you on Kashmir360. I'm interested in your ${op.category ? (categoryLabels[op.category] || op.category) : ''}.`)}`;
    window.location.href = waUrl;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Gallery */}
      <div className="relative bg-muted">
        {photos.length > 0 ? (
          <div className="aspect-[16/9] sm:aspect-[21/9] relative overflow-hidden">
            <img
              src={photos[currentPhoto]}
              alt={op.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
            {photos.length > 1 && (
              <>
                <button
                  onClick={() => setCurrentPhoto(p => p === 0 ? photos.length - 1 : p - 1)}
                  className="absolute left-4 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 backdrop-blur shadow-lg hover:bg-white transition-colors"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setCurrentPhoto(p => p === photos.length - 1 ? 0 : p + 1)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 backdrop-blur shadow-lg hover:bg-white transition-colors"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {photos.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentPhoto(i)}
                      className={`w-2 h-2 rounded-full transition-all ${i === currentPhoto ? 'bg-white w-4' : 'bg-white/50 hover:bg-white/70'}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="aspect-[16/9] sm:aspect-[21/9] flex items-center justify-center text-muted-foreground bg-gradient-to-br from-muted to-border">
            <div className="text-center">
              <div className="text-6xl font-bold text-muted-foreground/20">{op.name[0]}</div>
              <p className="text-sm mt-2">No photos available</p>
            </div>
          </div>
        )}

        {/* Top actions */}
        <div className="absolute top-4 left-4 z-10 flex gap-2">
          <Link href="/" className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 backdrop-blur shadow-lg hover:bg-white transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </div>
        <div className="absolute top-4 right-4 z-10 flex gap-2">
          <button
            onClick={toggleFavorite}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 backdrop-blur shadow-lg hover:bg-white transition-colors"
          >
            <Heart className={`h-5 w-5 ${favorited ? 'fill-danger text-danger' : ''}`} />
          </button>
          <button className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 backdrop-blur shadow-lg hover:bg-white transition-colors">
            <Share2 className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Header info */}
        <div>
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-foreground">{op.name}</h1>
                {op.verified && <BadgeCheck className="h-5 w-5 text-primary" />}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="capitalize">{op.category ? (categoryLabels[op.category] || op.category) : ''}</Badge>
                {op.verified && <Badge variant="primary" size="sm"><BadgeCheck className="h-3 w-3 mr-0.5" /> Verified</Badge>}
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        {op.short_desc && <p className="text-muted-foreground">{op.short_desc}</p>}
        {op.long_desc && <p className="text-muted-foreground leading-relaxed">{op.long_desc}</p>}

        {/* Category-specific details */}
        {op.houseboat_details && op.category === 'houseboat' && (
          <Card>
            <CardContent className="p-5 space-y-4">
              <h2 className="font-semibold flex items-center gap-2"><User className="h-4 w-4 text-muted-foreground" /> Houseboat Details</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                {(op.houseboat_details as any).owner && <DetailRow icon={User} label="Owner" value={(op.houseboat_details as any).owner} />}
                {(op.houseboat_details as any).address && <DetailRow icon={MapPin} label="Address" value={(op.houseboat_details as any).address} />}
                {(op.houseboat_details as any).contact && <DetailRow icon={Phone} label="Contact" value={(op.houseboat_details as any).contact} />}
                {(op.houseboat_details as any).email && <DetailRow icon={Mail} label="Email" value={(op.houseboat_details as any).email} />}
                {(op.houseboat_details as any).grade && <DetailRow icon={Star} label="Grade" value={(op.houseboat_details as any).grade} />}
                {(op.houseboat_details as any).boat_ghat && <DetailRow icon={Map} label="Boat Ghat" value={(op.houseboat_details as any).boat_ghat} />}
              </div>
              {(op.houseboat_details as any).google_maps && (
                <a href={(op.houseboat_details as any).google_maps} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
                  <Globe className="h-4 w-4" /> View on Google Maps
                </a>
              )}
            </CardContent>
          </Card>
        )}

        {op.shikara_details && op.category === 'shikara' && (
          <Card>
            <CardContent className="p-5 space-y-4">
              <h2 className="font-semibold flex items-center gap-2"><User className="h-4 w-4 text-muted-foreground" /> Shikara Details</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                {(op.shikara_details as any).full_name && <DetailRow icon={User} label="Full Name" value={(op.shikara_details as any).full_name} />}
                {(op.shikara_details as any).mobile_number && <DetailRow icon={Phone} label="Mobile" value={(op.shikara_details as any).mobile_number} />}
                {(op.shikara_details as any).shikara_number && <DetailRow icon={Star} label="Shikara No." value={(op.shikara_details as any).shikara_number} />}
                {(op.shikara_details as any).ghat_number && <DetailRow icon={Map} label="Ghat" value={(op.shikara_details as any).ghat_number} />}
                {(op.shikara_details as any).operating_areas?.length > 0 && <DetailRow icon={MapPin} label="Areas" value={(op.shikara_details as any).operating_areas.join(', ')} />}
                {(op.shikara_details as any).languages?.length > 0 && <DetailRow icon={Globe} label="Languages" value={(op.shikara_details as any).languages.join(', ')} />}
              </div>
              {(op.shikara_details as any).services?.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Services</p>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {(op.shikara_details as any).services.map((s: string) => <Badge key={s} variant="outline" size="sm">{s}</Badge>)}
                  </div>
                </div>
              )}
              {(op.shikara_details as any).years_experience && <DetailRow icon={Clock} label="Experience" value={`${(op.shikara_details as any).years_experience} years`} />}
              {(op.shikara_details as any).tour_duration && <DetailRow icon={Clock} label="Tour Duration" value={(op.shikara_details as any).tour_duration} />}
            </CardContent>
          </Card>
        )}

        {op.artisan_details && op.category === 'artisan' && (
          <Card>
            <CardContent className="p-5 space-y-4">
              <h2 className="font-semibold flex items-center gap-2"><User className="h-4 w-4 text-muted-foreground" /> Artisan Details</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                {(op.artisan_details as any).business_type && <DetailRow icon={Star} label="Business Type" value={(op.artisan_details as any).business_type} />}
                {(op.artisan_details as any).business_scale && <DetailRow icon={TrendingUp} label="Scale" value={(op.artisan_details as any).business_scale} />}
                {(op.artisan_details as any).owner_name && <DetailRow icon={User} label="Owner" value={(op.artisan_details as any).owner_name} />}
                {(op.artisan_details as any).contact_number && <DetailRow icon={Phone} label="Contact" value={(op.artisan_details as any).contact_number} />}
                {(op.artisan_details as any).years_in_business && <DetailRow icon={Clock} label="Years in Business" value={(op.artisan_details as any).years_in_business} />}
              </div>
              {(op.artisan_details as any).specialties?.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Specialties</p>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {(op.artisan_details as any).specialties.map((s: string) => <Badge key={s} variant="outline" size="sm">{s}</Badge>)}
                  </div>
                </div>
              )}
              {(op.artisan_details as any).google_maps && (
                <a href={(op.artisan_details as any).google_maps} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
                  <Globe className="h-4 w-4" /> View on Google Maps
                </a>
              )}
            </CardContent>
          </Card>
        )}

        {/* Tariffs */}
        {op.tariffs && op.category === 'houseboat' && (
          <Card>
            <CardContent className="p-5 space-y-4">
              <h2 className="font-semibold flex items-center gap-2"><Star className="h-4 w-4 text-muted-foreground" /> Tariffs (₹)</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {([
                  ['double_ep', 'Double EP'], ['double_cp', 'Double CP'],
                  ['double_map', 'Double MAP'], ['double_ap', 'Double AP'],
                  ['single_ep', 'Single EP'], ['single_cp', 'Single CP'],
                  ['single_map', 'Single MAP'], ['single_ap', 'Single AP'],
                ] as const).map(([key, label]) => {
                  const val = (op.tariffs as any)?.[key];
                  if (!val) return null;
                  return (
                    <div key={key} className="rounded-xl bg-muted p-3 text-center">
                      <p className="text-[10px] text-muted-foreground uppercase">{label}</p>
                      <p className="text-lg font-bold text-foreground mt-0.5">₹{val}</p>
                    </div>
                  );
                })}
              </div>
              {(op.tariffs as any)?.note && (
                <p className="text-xs text-muted-foreground">{(op.tariffs as any).note}</p>
              )}
            </CardContent>
          </Card>
        )}

        {op.pricing_note && (
          <Card className="bg-muted/30">
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">{op.pricing_note}</p>
            </CardContent>
          </Card>
        )}

        {/* CTA */}
        {showForm ? (
          <Card>
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Share your details</h3>
                <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <input
                type="text"
                placeholder="Your name"
                value={visitorName}
                onChange={(e) => setVisitorName(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-input bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <input
                type="tel"
                placeholder="Your phone number"
                value={visitorPhone}
                onChange={(e) => setVisitorPhone(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-input bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <Button onClick={handleSubmit} className="w-full gap-2 bg-[#25D366] hover:bg-[#20BD5A] text-white" disabled={submitting || !visitorName.trim() || !visitorPhone.trim()}>
                {submitting ? 'Sending...' : <Send className="h-4 w-4" />} Send Inquiry
              </Button>
            </CardContent>
          </Card>
        ) : blocked ? (
          <Card className="border-warning/30 bg-warning/5">
            <CardContent className="p-5 text-center">
              <AlertCircle className="h-8 w-8 text-warning mx-auto mb-2" />
              <p className="text-sm text-foreground font-medium">Monthly limit reached</p>
              <p className="text-xs text-muted-foreground mt-1">Please check back next month or browse other operators.</p>
              <Button size="sm" variant="outline" className="mt-3" onClick={() => { setBlocked(false); setShowForm(true); }}>Try Again</Button>
            </CardContent>
          </Card>
        ) : (
          <Button
            onClick={() => setShowForm(true)}
            size="lg"
            className="w-full gap-2 bg-[#25D366] hover:bg-[#20BD5A] text-white h-12 text-base"
          >
            <MessageCircle className="h-5 w-5" />
            Contact on WhatsApp
          </Button>
        )}

        <div className="text-center pb-8">
          <Link href="/" className="text-sm text-primary hover:underline font-medium">
            Browse more Dal Lake operators
          </Link>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm text-foreground">{value}</p>
      </div>
    </div>
  );
}


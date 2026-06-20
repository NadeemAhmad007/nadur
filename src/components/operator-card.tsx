'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import type { Operator } from '@/types';
import { cn } from '@/lib/utils';
import { BadgeCheck, MapPin, ExternalLink, X, Send, ChevronDown, Info, MessageCircle, Phone, IndianRupee, Building2, Ship, Palette, Navigation, Store, Car } from 'lucide-react';
import { countryOptions } from '@/data/country-codes';

const categoryLabels: Record<string, string> = {
  houseboat: 'Houseboat', shikara: 'Shikara Ride', artisan: 'Artisan',
  guide: 'Local Guide', vendor: 'Floating Vendor', taxi: 'Taxi & Transfers',
  homestay: 'Homestay', guest_house: 'Guest House',
};

const categoryIcons: Record<string, React.FC<{ className?: string }>> = {
  houseboat: Building2, shikara: Ship, artisan: Palette,
  guide: Navigation, vendor: Store, taxi: Car,
  homestay: Building2, guest_house: Building2,
};

function getPriceLabel(op: Operator): string | null {
  const c = op.category;
  if (c === 'shikara') {
    const d = op.shikara_details;
    if (d?.price_per_ride) return `₹${d.price_per_ride}/ride`;
    if (d?.price_per_hour) return `₹${d.price_per_hour}/hr`;
  }
  if (c === 'taxi') {
    const d = op.taxi_details;
    if (d?.price_per_km) return `₹${d.price_per_km}/km`;
    if (d?.price_per_day) return `₹${d.price_per_day}/day`;
    if (d?.airport_flat_rate) return `₹${d.airport_flat_rate} airport`;
  }
  if (c === 'homestay' || c === 'guest_house') {
    const d = op.accommodation_details;
    if (d?.pricing_single) return `₹${d.pricing_single}/night`;
    if (d?.pricing_double) return `₹${d.pricing_double}/night`;
  }
  if (c === 'houseboat') {
    const t = op.tariffs;
    if (t) {
      const v = t.double_ep || t.double_cp || t.single_ep || t.single_cp;
      if (v) return `₹${v}/night`;
    }
  }
  if (op.pricing_note) return 'See pricing';
  return null;
}

export function OperatorCard({ operator, className, pexelsFallback }: { operator: Operator; className?: string; pexelsFallback?: string | null }) {
  const router = useRouter();
  const photo = operator.photos?.[0] || pexelsFallback;
  const [showLeadForm, setShowLeadForm] = useState(false);

  return (
    <>
      <div
        className={cn('group cursor-pointer rounded-[14px] border border-border bg-card shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden', className)}
        onClick={() => router.push(`/o/${operator.slug}`)}
      >
        <div className="aspect-[4/3] bg-muted relative overflow-hidden">
          {photo ? (
            <img
              src={photo}
              alt={operator.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-border/50">
              {(() => {
                const cat = operator.category;
                const Icon = cat ? categoryIcons[cat] : null;
                return Icon ? (
                  <Icon className="h-16 w-16 text-muted-foreground/20" />
                ) : (
                  <div className="text-4xl font-bold text-muted-foreground/20">{operator.name[0]}</div>
                );
              })()}
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
          {operator.verified && (
            <div className="absolute top-2.5 left-2.5 flex items-center gap-1 px-2 py-1 rounded-full bg-white/90 backdrop-blur-sm shadow-xs text-[11px] font-medium text-primary">
              <BadgeCheck className="h-3 w-3" />
              Verified
            </div>
          )}
          <div className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-sm shadow-xs text-[11px] font-medium text-muted-foreground capitalize">
            {operator.category ? (categoryLabels[operator.category] || operator.category) : ''}
          </div>
        </div>
        <div className="p-4 space-y-3" onClick={(e) => e.stopPropagation()}>
          <div>
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-foreground truncate hover:text-accent transition-colors">
                {operator.name}
              </h3>
              {getPriceLabel(operator) && (
                <span className="shrink-0 inline-flex items-center gap-0.5 text-xs font-bold text-accent whitespace-nowrap bg-accent/10 px-2 py-0.5 rounded-lg">
                  <IndianRupee className="h-2.5 w-2.5" />
                  {getPriceLabel(operator)!.replace('₹', '')}
                </span>
              )}
            </div>
            {operator.short_desc && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">{operator.short_desc}</p>
            )}
          </div>
          <Button
            size="sm"
            className="w-full"
            onClick={() => setShowLeadForm(true)}
          >
            <MessageCircle className="h-3.5 w-3.5" />
            Enquire via WhatsApp
          </Button>
        </div>
      </div>
      {showLeadForm && <LeadFormModal operator={operator} onClose={() => setShowLeadForm(false)} />}
    </>
  );
}

export function LeadFormModal({ operator, onClose }: { operator: Operator; onClose: () => void }) {
  const [name, setName] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [localNumber, setLocalNumber] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [overflow, setOverflow] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpSubmitting, setOtpSubmitting] = useState(false);
  const [error, setError] = useState('');

  const getPhone = () => countryCode + localNumber;

  const submit = async () => {
    if (!name || !localNumber) return;
    const phone = getPhone();
    setSubmitting(true);
    setError('');

    if (operator.plan === 'pro') {
      try {
        const res = await fetch('/api/leads/send-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ operator_id: operator.id, visitor_name: name, visitor_phone: phone }),
        });
        if (!res.ok) { const d = await res.json(); setError(d.error || 'Failed to send OTP'); setSubmitting(false); return; }
      } catch { setError('Failed to send OTP'); setSubmitting(false); return; }
      setSubmitting(false);
      setOtpSent(true);
      return;
    }

    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operator_id: operator.id, source: 'profile', visitor_name: name, visitor_phone: phone }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to submit'); setSubmitting(false); return; }
      setOverflow(data.overflow);
    } catch { setSubmitting(false); return; }
    setSubmitting(false);
    const waUrl = `https://wa.me/${operator.whatsapp}?text=${encodeURIComponent('Hi! I found you on Kasheer360.')}`;
    window.open(waUrl, '_blank');
    onClose();
  };

  const handleOtpSubmit = async () => {
    if (!otp.trim()) return;
    const phone = getPhone();
    setOtpSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/leads/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operator_id: operator.id, visitor_name: name, visitor_phone: phone, otp: otp.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Invalid OTP'); setOtpSubmitting(false); return; }
      window.open(data.waUrl, '_blank');
      onClose();
    } catch { setError('Failed to verify OTP'); setOtpSubmitting(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="w-full max-w-sm bg-card rounded-2xl shadow-xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-border/60">
          <h3 className="font-semibold text-foreground text-base">
            {otpSent ? 'Verify Phone' : 'Contact via WhatsApp'}
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
        <div className="p-5 space-y-5">
          {overflow && (
            <div className="p-3.5 rounded-xl bg-warning/10 border border-warning/20 flex items-start gap-2.5">
              <Info className="h-4 w-4 text-warning shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground">This operator is currently at capacity. Your enquiry has been forwarded to our team.</p>
            </div>
          )}
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
              {error && <p className="text-xs text-danger">{error}</p>}
              <div className="flex gap-2.5">
                <Button onClick={handleOtpSubmit} disabled={otp.length < 4 || otpSubmitting} className="flex-1">
                  {otpSubmitting ? 'Verifying...' : 'Verify & Unlock'}
                </Button>
                <Button variant="outline" onClick={() => { setOtpSent(false); setOtp(''); setError(''); submit(); }} disabled={submitting}>
                  Resend
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3 pb-1">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
                  <MessageCircle className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{operator.name}</p>
                  <p className="text-xs text-muted-foreground">Reach out directly via WhatsApp</p>
                </div>
              </div>
              {operator.plan === 'pro' && (
                <p className="text-xs text-muted-foreground bg-secondary rounded-xl px-3.5 py-2.5">We'll send a one-time code to verify your number.</p>
              )}
              <Input
                label="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
              />
              <label className="text-sm font-medium text-foreground">Phone number</label>
              <div className="flex gap-2.5">
                <div className="relative w-[140px] shrink-0">
                  <select
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    className="flex h-10 w-full rounded-xl border border-input bg-card px-3 pr-8 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-ring/40 transition-all"
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
              {error && <p className="text-xs text-danger">{error}</p>}
              <Button onClick={submit} disabled={!name || !localNumber || submitting} className="w-full" size="lg">
                {submitting ? 'Sending...' : operator.plan === 'pro' ? 'Send OTP' : 'Start Chat'}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

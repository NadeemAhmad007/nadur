'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import type { Operator } from '@/types';
import { cn } from '@/lib/utils';
import { BadgeCheck, MapPin, ExternalLink, X, Send, ChevronDown, Info } from 'lucide-react';
import { countryOptions } from '@/data/country-codes';

const categoryLabels: Record<string, string> = {
  houseboat: 'Houseboat', shikara: 'Shikara Ride', artisan: 'Artisan',
  guide: 'Local Guide', vendor: 'Floating Vendor', taxi: 'Taxi & Transfers',
  homestay: 'Homestay', guest_house: 'Guest House',
};

export function OperatorCard({ operator, className }: { operator: Operator; className?: string }) {
  const router = useRouter();
  const photo = operator.photos?.[0];
  const [showLeadForm, setShowLeadForm] = useState(false);

  return (
    <Card className={cn('overflow-hidden hover:shadow-lg transition-all duration-300 group', className)}>
      <div
        className="aspect-[4/3] bg-muted relative cursor-pointer overflow-hidden"
        onClick={() => router.push(`/o/${operator.slug}`)}
      >
        {photo ? (
          <img
            src={photo}
            alt={operator.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm bg-gradient-to-br from-muted to-border">
            <div className="text-center">
              <div className="text-3xl font-bold text-muted-foreground/30">{operator.name[0]}</div>
              <p className="text-xs mt-1">No photo</p>
            </div>
          </div>
        )}
        {operator.verified && (
          <Badge variant="primary" size="sm" className="absolute top-2 left-2 shadow-lg">
            <BadgeCheck className="h-3 w-3 mr-0.5" /> Verified
          </Badge>
        )}
              <Badge variant="outline" size="sm" className="absolute top-2 right-2 bg-white/90 backdrop-blur shadow-lg capitalize">
                  {operator.category ? (categoryLabels[operator.category] || operator.category) : ''}
                </Badge>
      </div>
      <CardContent className="p-4 space-y-3">
        <div>
          <h3
            className="font-semibold text-foreground truncate cursor-pointer hover:text-primary transition-colors"
            onClick={() => router.push(`/o/${operator.slug}`)}
          >
            {operator.name}
          </h3>
          {operator.short_desc && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{operator.short_desc}</p>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            className="flex-1 text-xs"
            onClick={() => setShowLeadForm(true)}
          >
            <Send className="h-3.5 w-3.5 mr-1" /> Enquiry
          </Button>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-xs text-muted-foreground"
          onClick={() => router.push(`/o/${operator.slug}`)}
        >
          <ExternalLink className="h-3 w-3 mr-1" /> View Profile
        </Button>
      </CardContent>
      {showLeadForm && <LeadFormModal operator={operator} onClose={() => setShowLeadForm(false)} />}
    </Card>
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
    const waUrl = `https://wa.me/${operator.whatsapp}?text=${encodeURIComponent('Hi! I found you on Kashmir360.')}`;
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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-sm bg-card rounded-2xl shadow-xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="font-semibold text-foreground">
            {otpSent ? 'Verify Phone' : 'Contact via WhatsApp'}
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-muted transition-colors">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
        <div className="p-4 space-y-4">
          {overflow && (
            <div className="p-3 rounded-xl bg-warning/10 border border-warning/20 flex items-start gap-2">
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
                className="text-center tracking-widest text-lg"
              />
              {error && <p className="text-xs text-danger">{error}</p>}
              <div className="flex gap-2">
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
              <p className="text-sm text-muted-foreground">
                Get in touch with <span className="font-medium text-foreground">{operator.name}</span>
              </p>
              {operator.plan === 'pro' && (
                <p className="text-xs text-muted-foreground">We'll send a one-time code to verify your number.</p>
              )}
              <Input
                label="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
              />
              <label className="text-sm font-medium text-foreground">Phone number</label>
              <div className="flex gap-2">
                <div className="relative w-[140px] shrink-0">
                  <select
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    className="flex h-10 w-full rounded-lg border border-input bg-card px-3 pr-8 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
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
              <Button onClick={submit} disabled={!name || !localNumber || submitting} className="w-full">
                {submitting ? 'Sending...' : operator.plan === 'pro' ? 'Send OTP' : 'Unlock WhatsApp'}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

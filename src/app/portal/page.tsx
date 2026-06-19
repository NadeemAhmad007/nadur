'use client';
import { useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  BarChart3, Phone, QrCode, Edit3, CheckCircle2, AlertCircle,
  ArrowUp, ArrowDown, Sparkles, User, Building2, Clock,
  TrendingUp, Target, MessageCircle, ChevronRight, Mail, CheckCheck
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type FieldDef = { key: string; label: string; categories?: string[]; check?: (v: any, op?: any) => boolean };

const getVal = (obj: any, path: string) =>
  path.split('.').reduce((acc, k) => (acc != null ? acc[k] : undefined), obj);

const commonFields: FieldDef[] = [
  { key: 'short_desc', label: 'Short description' },
  { key: 'long_desc', label: 'Detailed description' },
  { key: 'pricing_note', label: 'Pricing info' },
  { key: 'photos', label: 'Photos', check: (v) => Array.isArray(v) && v.length > 0 },
  { key: 'lat', label: 'Map location', check: (v, op) => Boolean(v) || !!op.houseboat_details?.google_maps || !!op.artisan_details?.google_maps || !!op.taxi_details?.google_maps || !!op.guide_details?.google_maps || !!op.vendor_details?.google_maps || !!op.accommodation_details?.google_maps },
];

const categoryFields: Record<string, FieldDef[]> = {
  houseboat: [
    { key: 'houseboat_details.owner', label: 'Owner name' },
    { key: 'houseboat_details.address', label: 'Address' },
    { key: 'houseboat_details.contact', label: 'Contact number' },
    { key: 'houseboat_details.grade', label: 'Grade' },
    { key: 'tariffs', label: 'Tariff rates', check: (v) => v && Object.values(v).some(Boolean) },
  ],
  shikara: [
    { key: 'shikara_details.full_name', label: 'Full name' },
    { key: 'shikara_details.mobile_number', label: 'Mobile number' },
    { key: 'shikara_details.shikara_number', label: 'Shikara number' },
    { key: 'shikara_details.ghat_number', label: 'Ghat number' },
    { key: 'shikara_details.operating_areas', label: 'Operating areas', check: (v) => Array.isArray(v) && v.length > 0 },
    { key: 'shikara_details.languages', label: 'Languages', check: (v) => Array.isArray(v) && v.length > 0 },
    { key: 'shikara_details.services', label: 'Services', check: (v) => Array.isArray(v) && v.length > 0 },
  ],
  artisan: [
    { key: 'artisan_details.business_type', label: 'Business type' },
    { key: 'artisan_details.specialties', label: 'Specialties', check: (v) => Array.isArray(v) && v.length > 0 },
    { key: 'artisan_details.business_scale', label: 'Business scale' },
    { key: 'artisan_details.contact_number', label: 'Contact number' },
    { key: 'artisan_details.years_in_business', label: 'Years in business' },
  ],
  guide: [
    { key: 'guide_details.full_name', label: 'Full name' },
    { key: 'guide_details.contact_number', label: 'Contact number' },
    { key: 'guide_details.languages', label: 'Languages', check: (v) => Array.isArray(v) && v.length > 0 },
    { key: 'guide_details.specialties', label: 'Specialties', check: (v) => Array.isArray(v) && v.length > 0 },
    { key: 'guide_details.years_experience', label: 'Years of experience' },
    { key: 'guide_details.certification', label: 'Certification' },
    { key: 'guide_details.operating_areas', label: 'Operating areas', check: (v) => Array.isArray(v) && v.length > 0 },
  ],
  vendor: [
    { key: 'vendor_details.business_name', label: 'Business name' },
    { key: 'vendor_details.owner_name', label: 'Owner name' },
    { key: 'vendor_details.contact_number', label: 'Contact number' },
    { key: 'vendor_details.business_type', label: 'Business type' },
    { key: 'vendor_details.specialties', label: 'Specialties', check: (v) => Array.isArray(v) && v.length > 0 },
    { key: 'vendor_details.operating_areas', label: 'Operating areas', check: (v) => Array.isArray(v) && v.length > 0 },
  ],
  homestay: [
    { key: 'accommodation_details.owner_name', label: 'Owner name' },
    { key: 'accommodation_details.contact', label: 'Contact number' },
    { key: 'accommodation_details.total_rooms', label: 'Total rooms' },
    { key: 'accommodation_details.room_types', label: 'Room types', check: (v) => Array.isArray(v) && v.length > 0 },
    { key: 'accommodation_details.amenities', label: 'Amenities', check: (v) => Array.isArray(v) && v.length > 0 },
    { key: 'accommodation_details.pricing_single', label: 'Single room pricing' },
    { key: 'accommodation_details.pricing_double', label: 'Double room pricing' },
    { key: 'accommodation_details.languages', label: 'Languages', check: (v) => Array.isArray(v) && v.length > 0 },
    { key: 'accommodation_details.nearby_attractions', label: 'Nearby attractions' },
  ],
  guest_house: [
    { key: 'accommodation_details.owner_name', label: 'Owner name' },
    { key: 'accommodation_details.contact', label: 'Contact number' },
    { key: 'accommodation_details.total_rooms', label: 'Total rooms' },
    { key: 'accommodation_details.room_types', label: 'Room types', check: (v) => Array.isArray(v) && v.length > 0 },
    { key: 'accommodation_details.amenities', label: 'Amenities', check: (v) => Array.isArray(v) && v.length > 0 },
    { key: 'accommodation_details.pricing_single', label: 'Single room pricing' },
    { key: 'accommodation_details.pricing_double', label: 'Double room pricing' },
    { key: 'accommodation_details.languages', label: 'Languages', check: (v) => Array.isArray(v) && v.length > 0 },
    { key: 'accommodation_details.nearby_attractions', label: 'Nearby attractions' },
  ],
  taxi: [
    { key: 'taxi_details.driver_name', label: 'Driver name' },
    { key: 'taxi_details.vehicle_type', label: 'Vehicle type' },
    { key: 'taxi_details.vehicle_model', label: 'Vehicle model' },
    { key: 'taxi_details.registration_number', label: 'Registration' },
    { key: 'taxi_details.operating_areas', label: 'Operating areas', check: (v) => Array.isArray(v) && v.length > 0 },
    { key: 'taxi_details.languages', label: 'Languages', check: (v) => Array.isArray(v) && v.length > 0 },
    { key: 'taxi_details.price_per_km', label: 'Price per km' },
    { key: 'taxi_details.price_per_day', label: 'Price per day' },
  ],
};

export default function PortalPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [operator, setOperator] = useState<any>(null);
  const [leads, setLeads] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/login');
  }, [status, router]);

  useEffect(() => {
    const sUser = session?.user as Record<string, unknown> | undefined;
    const email = session?.user?.email;
    const operatorId = sUser?.operator_id as string | undefined;

    const fetchOperator = async (query: string) => {
      try {
        setFetchError(null);
        const res = await fetch(`/api/operators?${query}`);
        if (!res.ok) {
          setFetchError(`Failed to load profile (${res.status})`);
          setLoading(false);
          return;
        }
        const { data } = await res.json();
        if (data?.length > 0) {
          setOperator(data[0]);
          const leadsRes = await fetch(`/api/leads?operator_id=${data[0].id}`);
          const leadsData = await leadsRes.json();
          setLeads(Array.isArray(leadsData) ? leadsData : []);
        }
      } catch {
        setFetchError('Network error — please check your connection');
      }
      setLoading(false);
    };

    if (operatorId) fetchOperator(`id=${operatorId}`);
    else if (email) fetchOperator(`email=${email}`);
    else setLoading(false);
  }, [session]);

  // Ping online status every 2 minutes
  useEffect(() => {
    if (!operator?.id) return;
    const ping = () => fetch('/api/operators/ping', { method: 'PATCH' }).catch(() => {});
    ping();
    const interval = setInterval(ping, 120000);
    return () => clearInterval(interval);
  }, [operator?.id]);

  // Fetch messages
  useEffect(() => {
    if (!operator?.id) return;
    fetch('/api/portal/messages').then(r => r.json()).then(d => {
      setMessages(d.messages || []);
      setUnreadCount(d.unread || 0);
    }).catch(() => {});
  }, [operator?.id]);

  const stats = useMemo(() => {
    if (!leads.length) return null;
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(weekAgo.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thisWeek = leads.filter((l) => new Date(l.created_at) >= weekAgo).length;
    const lastWeek = leads.filter(
      (l) => new Date(l.created_at) >= twoWeeksAgo && new Date(l.created_at) < weekAgo
    ).length;
    const bySource = leads.reduce<Record<string, number>>((acc, l) => {
      acc[l.source] = (acc[l.source] || 0) + 1;
      return acc;
    }, {});
    return { thisWeek, lastWeek, bySource };
  }, [leads]);

  const score = useMemo(() => {
    if (!operator) return { score: 0, total: 0, missing: [] as string[] };
    const cat = operator.category as string;
    const allFields = [...commonFields, ...(categoryFields[cat] || [])];
    let done = 0;
    const missing: string[] = [];
    for (const f of allFields) {
      const val = getVal(operator, f.key);
      const ok = f.check ? f.check(val, operator) : Boolean(val) && val !== '';
      if (ok) done++;
      else missing.push(f.label);
    }
    return { score: done, total: allFields.length, missing };
  }, [operator]);

  if (loading || status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin h-7 w-7 border-2 border-accent border-t-transparent rounded-full" />
          <p className="text-xs text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-sm">
          <div className="flex justify-center mb-5">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-danger/10">
              <AlertCircle className="h-7 w-7 text-danger" />
            </div>
          </div>
          <h2 className="text-xl font-semibold text-foreground">Something went wrong</h2>
          <p className="text-sm text-muted-foreground mt-2">{fetchError}</p>
          <Button className="mt-6" onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      </div>
    );
  }

  if (!operator) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-sm">
          <div className="flex justify-center mb-5">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary">
              <Building2 className="h-7 w-7 text-muted-foreground" />
            </div>
          </div>
          <h2 className="text-xl font-semibold text-foreground">No profile yet</h2>
          <p className="text-sm text-muted-foreground mt-2">Register your business to get started on Kashmir360</p>
          <Link href="/join">
            <Button className="mt-6">Register Now</Button>
          </Link>
        </div>
      </div>
    );
  }

  const monthlyLeads = operator.lead_month || 0;
  const freeLimit = operator.plan === 'free' ? 3 : Infinity;
  const leadsLeft = freeLimit - monthlyLeads;
  const percent = Math.round((score.score / score.total) * 100);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Welcome back, {operator.name}</p>
        </div>
        <Badge variant={operator.status === 'approved' ? 'success' : 'warning'}>
          {operator.status === 'approved' ? 'Live' : operator.status}
        </Badge>
      </div>

      {/* Profile completion + plan */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3.5">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent font-bold text-lg">
                {operator.name[0]}
              </div>
              <div>
                <h2 className="font-semibold text-foreground">{operator.name}</h2>
                <p className="text-xs text-muted-foreground capitalize">{operator.category} &middot; {operator.plan === 'free' ? 'Free Plan' : 'Pro'}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-foreground">{percent}%</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Complete</p>
            </div>
          </div>
          <div className="w-full bg-secondary rounded-full h-2.5">
            <div
              className={`h-2.5 rounded-full transition-all duration-500 ${percent === 100 ? 'bg-success' : percent > 60 ? 'bg-accent' : 'bg-warning'}`}
              style={{ width: `${percent}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">{score.score}/{score.total} fields filled</p>
        </CardContent>
      </Card>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 sm:p-5 text-center">
            <div className="flex justify-center mb-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
                <BarChart3 className="h-5 w-5 text-accent" />
              </div>
            </div>
            <p className="text-2xl font-bold text-foreground">{monthlyLeads}</p>
            <p className="text-xs text-muted-foreground">Leads this month</p>
            {operator.plan === 'free' && (
              <p className={`text-[11px] mt-1.5 font-medium ${leadsLeft > 0 ? 'text-muted-foreground' : 'text-danger'}`}>
                {leadsLeft > 0 ? `${leadsLeft} remaining` : 'Limit reached'}
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 sm:p-5 text-center">
            <div className="flex justify-center mb-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-info/10">
                <MessageCircle className="h-5 w-5 text-info" />
              </div>
            </div>
            <p className="text-2xl font-bold text-foreground">{leads.length}</p>
            <p className="text-xs text-muted-foreground">Total inquiries</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 sm:p-5 text-center">
            <div className="flex justify-center mb-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/10">
                <TrendingUp className="h-5 w-5 text-success" />
              </div>
            </div>
            <p className="text-2xl font-bold text-foreground">{stats?.thisWeek ?? 0}</p>
            <p className="text-xs text-muted-foreground">This week</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3">
        <Link href="/portal/edit">
          <Card className="hover:shadow-md transition-all duration-200 cursor-pointer border-accent/20 hover:border-accent/40 group">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 shrink-0">
                <Edit3 className="h-5 w-5 text-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">Edit Profile</p>
                <p className="text-xs text-muted-foreground">Update your info</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
            </CardContent>
          </Card>
        </Link>
        <Link href="/portal/qr">
          <Card className="hover:shadow-md transition-all duration-200 cursor-pointer border-info/20 hover:border-info/40 group">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-info/10 shrink-0">
                <QrCode className="h-5 w-5 text-info" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">QR Code</p>
                <p className="text-xs text-muted-foreground">Print & share</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Profile completion tips */}
      {score.missing.length > 0 && (
        <Card className="border-warning/20 bg-warning/[0.03]">
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-warning mt-0.5 shrink-0" />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-foreground">Complete your profile</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Add the following details to attract more customers:
                </p>
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {score.missing.map((m) => (
                    <span key={m} className="inline-flex items-center px-2.5 py-1 rounded-lg bg-warning/10 text-warning text-xs font-medium">
                      {m}
                    </span>
                  ))}
                </div>
                <Link href="/portal/edit">
                  <Button size="sm" variant="outline" className="mt-4">Edit Profile</Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lead trends */}
      {stats && (
        <Card>
          <CardHeader className="p-5 border-b border-border/60">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-semibold text-sm">Lead Trends</h3>
            </div>
          </CardHeader>
          <CardContent className="p-5">
            <div className="grid grid-cols-2 gap-4 mb-5">
              <div className="text-center p-4 rounded-xl bg-secondary">
                <p className="text-2xl font-bold text-foreground">{stats.thisWeek}</p>
                <p className="text-xs text-muted-foreground mt-1">This week</p>
              </div>
              <div className="text-center p-4 rounded-xl bg-secondary">
                <div className="flex items-center justify-center gap-1.5">
                  <p className="text-2xl font-bold text-foreground">{stats.lastWeek}</p>
                  {stats.lastWeek > 0 && (
                    stats.thisWeek > stats.lastWeek ? <ArrowUp className="h-5 w-5 text-success" />
                    : stats.thisWeek < stats.lastWeek ? <ArrowDown className="h-5 w-5 text-danger" />
                    : null
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Last week</p>
              </div>
            </div>
            {Object.keys(stats.bySource).length > 0 && (
              <div className="pt-4 border-t border-border/60">
                <p className="text-xs font-medium text-muted-foreground mb-2.5">By source</p>
                <div className="flex gap-2 flex-wrap">
                  {Object.entries(stats.bySource).map(([src, count]) => (
                    <Badge key={src} variant="outline">{src}: {count}</Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Messages from admin */}
      {messages.length > 0 && (
        <Card>
          <CardHeader className="p-5 border-b border-border/60">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-semibold text-sm">Messages</h3>
              </div>
              {unreadCount > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-accent text-accent-foreground text-[10px] font-bold px-1.5">
                  {unreadCount}
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/60">
              {messages.slice(0, 5).map((m: any) => (
                <div key={m.id} className="p-4 sm:p-5 flex items-start gap-3 hover:bg-secondary/30 transition-colors">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10 shrink-0 mt-0.5">
                    <Mail className="h-4 w-4 text-accent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground">{m.message}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <p className="text-[11px] text-muted-foreground">
                        {new Date(m.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </p>
                      {m.read_at && (
                        <span className="inline-flex items-center gap-0.5 text-[11px] text-success">
                          <CheckCheck className="h-3 w-3" /> Read
                        </span>
                      )}
                      {!m.read_at && (
                        <button
                          onClick={() => {
                            fetch(`/api/portal/messages/${m.id}`, { method: 'PATCH' }).then(() => {
                              setMessages(prev => prev.map(msg => msg.id === m.id ? { ...msg, read_at: new Date().toISOString() } : msg));
                              setUnreadCount(c => Math.max(0, c - 1));
                            }).catch(() => {});
                          }}
                          className="text-[11px] text-accent font-medium hover:underline"
                        >
                          Mark read
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent leads */}
      <Card>
        <CardHeader className="p-5 border-b border-border/60">
          <h3 className="font-semibold text-sm">Recent Leads</h3>
        </CardHeader>
        <CardContent className="p-0">
          {leads.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">No leads yet — your QR code will help customers find you</div>
          ) : (
            <div className="divide-y divide-border/60">
              {leads.slice(0, 10).map((lead: any) => (
                <div key={lead.id} className="p-4 sm:p-5 flex items-center justify-between hover:bg-secondary/30 transition-colors">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">{lead.visitor_name || 'Anonymous'}</p>
                    <p className="text-xs text-muted-foreground truncate">{lead.visitor_phone || ''}</p>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <Badge variant="outline" size="sm">{lead.source}</Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(lead.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upgrade prompts */}
      {operator.plan === 'free' && monthlyLeads >= 3 && (
        <Card className="border-accent/20 bg-accent/[0.03]">
          <CardContent className="p-5 flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-accent mt-0.5 shrink-0" />
            <div>
              <h3 className="text-sm font-semibold text-foreground">Upgrade to Pro</h3>
              <p className="text-xs text-muted-foreground mt-1">Get unlimited leads, higher visibility, and lead details delivered directly to you.</p>
              <div className="flex flex-wrap gap-4 mt-3">
                <span className="text-xs text-muted-foreground flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-success" /> Unlimited leads</span>
                <span className="text-xs text-muted-foreground flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-success" /> Priority listing</span>
                <span className="text-xs text-muted-foreground flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-success" /> Direct notifications</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

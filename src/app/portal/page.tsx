'use client';
import { useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  BarChart3, Phone, QrCode, Edit3, CheckCircle2, AlertCircle,
  ArrowUp, ArrowDown, Sparkles, User, Compass, Building2, Clock,
  TrendingUp, Target
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
  { key: 'lat', label: 'Map location', check: (v, op) => Boolean(v) || !!op.houseboat_details?.google_maps || !!op.artisan_details?.google_maps },
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
  guide: [], vendor: [], taxi: [
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/login');
  }, [status, router]);

  useEffect(() => {
    const sUser = session?.user as Record<string, unknown> | undefined;
    const email = session?.user?.email;
    const operatorId = sUser?.operator_id as string | undefined;

    const fetchOperator = async (query: string) => {
      try {
        const res = await fetch(`/api/operators?${query}`);
        const { data } = await res.json();
        if (data?.length > 0) {
          setOperator(data[0]);
          const leadsRes = await fetch(`/api/leads?operator_id=${data[0].id}`);
          const leadsData = await leadsRes.json();
          setLeads(Array.isArray(leadsData) ? leadsData : []);
        }
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    };

    if (operatorId) fetchOperator(`id=${operatorId}`);
    else if (email) fetchOperator(`email=${email}`);
    else setLoading(false);
  }, [session]);

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
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!operator) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-sm">
          <div className="flex justify-center mb-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
              <Building2 className="h-8 w-8 text-muted-foreground" />
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
          <p className="text-muted-foreground text-sm mt-0.5">Welcome back, {operator.name}</p>
        </div>
        <Badge variant={operator.status === 'approved' ? 'success' : 'warning'}>
          {operator.status === 'approved' ? 'Live' : operator.status}
        </Badge>
      </div>

      {/* Profile completion + plan */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold text-lg">
                {operator.name[0]}
              </div>
              <div>
                <h2 className="font-semibold text-foreground">{operator.name}</h2>
                <p className="text-xs text-muted-foreground capitalize">{operator.category} · {operator.plan === 'free' ? 'Free Plan' : 'Pro'}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-primary">{percent}%</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Complete</p>
            </div>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-500 ${percent === 100 ? 'bg-success' : percent > 60 ? 'bg-primary' : 'bg-warning'}`}
              style={{ width: `${percent}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">{score.score}/{score.total} fields filled</p>
        </CardContent>
      </Card>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex justify-center mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <BarChart3 className="h-5 w-5 text-primary" />
              </div>
            </div>
            <p className="text-2xl font-bold text-foreground">{monthlyLeads}</p>
            <p className="text-xs text-muted-foreground">Leads this month</p>
            {operator.plan === 'free' && (
              <p className={`text-[10px] mt-1 font-medium ${leadsLeft > 0 ? 'text-muted-foreground' : 'text-danger'}`}>
                {leadsLeft > 0 ? `${leadsLeft} remaining` : 'Limit reached'}
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex justify-center mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-info/10">
                <Phone className="h-5 w-5 text-info" />
              </div>
            </div>
            <p className="text-2xl font-bold text-foreground">{leads.length}</p>
            <p className="text-xs text-muted-foreground">Total inquiries</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex justify-center mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
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
          <Card className="hover:shadow-md transition-shadow cursor-pointer border-primary/20">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Edit3 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Edit Profile</p>
                <p className="text-xs text-muted-foreground">Update your business info</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/portal/qr">
          <Card className="hover:shadow-md transition-shadow cursor-pointer border-accent/20">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                <QrCode className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">QR Code</p>
                <p className="text-xs text-muted-foreground">Print stickers & share</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Profile completion tips */}
      {score.missing.length > 0 && (
        <Card className="border-warning/30 bg-warning/5">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-warning mt-0.5 shrink-0" />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-foreground">Complete your profile</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Add the following details to attract more customers:
                </p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {score.missing.map((m) => (
                    <span key={m} className="inline-flex items-center px-2 py-0.5 rounded-md bg-warning/10 text-warning text-xs font-medium">
                      {m}
                    </span>
                  ))}
                </div>
                <Link href="/portal/edit">
                  <Button size="sm" variant="outline" className="mt-3">Edit Profile</Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lead trends */}
      {stats && (
        <Card>
          <CardHeader className="p-4 border-b border-border">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-semibold text-sm">Lead Trends</h3>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center p-3 rounded-lg bg-muted">
                <p className="text-2xl font-bold text-foreground">{stats.thisWeek}</p>
                <p className="text-xs text-muted-foreground">This week</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted">
                <div className="flex items-center justify-center gap-1">
                  <p className="text-2xl font-bold text-foreground">{stats.lastWeek}</p>
                  {stats.lastWeek > 0 && (
                    stats.thisWeek > stats.lastWeek ? <ArrowUp className="h-5 w-5 text-success" />
                    : stats.thisWeek < stats.lastWeek ? <ArrowDown className="h-5 w-5 text-danger" />
                    : null
                  )}
                </div>
                <p className="text-xs text-muted-foreground">Last week</p>
              </div>
            </div>
            {Object.keys(stats.bySource).length > 0 && (
              <div className="pt-3 border-t border-border">
                <p className="text-xs font-medium text-muted-foreground mb-2">By source</p>
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

      {/* Recent leads */}
      <Card>
        <CardHeader className="p-4 border-b border-border">
          <h3 className="font-semibold text-sm">Recent Leads</h3>
        </CardHeader>
        <CardContent className="p-0">
          {leads.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">No leads yet — your QR code will help customers find you</div>
          ) : (
            <div className="divide-y divide-border">
              {leads.slice(0, 10).map((lead: any) => (
                <div key={lead.id} className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">{lead.visitor_name || 'Anonymous'}</p>
                    <p className="text-xs text-muted-foreground">{lead.visitor_phone || ''}</p>
                  </div>
                  <div className="text-right">
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
        <Card className="border-danger/30 bg-danger/5">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-danger mt-0.5 shrink-0" />
            <div>
              <h3 className="text-sm font-semibold text-foreground">Lead limit reached</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Upgrade to Pro for unlimited leads and higher visibility.</p>
              <div className="flex gap-4 mt-2">
                <span className="text-xs text-muted-foreground flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-success" /> Unlimited leads</span>
                <span className="text-xs text-muted-foreground flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-success" /> Priority listing</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

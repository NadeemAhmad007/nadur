'use client';

import { useState, useEffect, useMemo } from 'react';
import { signOut, useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Compass, BarChart3, Phone, QrCode, Edit3, CheckCircle2, AlertCircle, ArrowUp, ArrowDown, Sparkles } from 'lucide-react';
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
  { key: 'lat', label: 'Map latitude', check: (v, op) => Boolean(v) || !!op.houseboat_details?.google_maps || !!op.artisan_details?.google_maps },
  { key: 'lng', label: 'Map longitude', check: (v, op) => Boolean(v) || !!op.houseboat_details?.google_maps || !!op.artisan_details?.google_maps },
];

const categoryFields: Record<string, FieldDef[]> = {
  houseboat: [
    { key: 'houseboat_details.owner', label: 'Owner name' },
    { key: 'houseboat_details.address', label: 'Address' },
    { key: 'houseboat_details.contact', label: 'Contact number' },
    { key: 'houseboat_details.email', label: 'Business email' },
    { key: 'houseboat_details.grade', label: 'Grade' },
    { key: 'tariffs', label: 'Tariff rates', check: (v) => v && Object.values(v).some(Boolean) },
  ],
  shikara: [
    { key: 'shikara_details.full_name', label: 'Full name' },
    { key: 'shikara_details.mobile_number', label: 'Mobile number' },
    { key: 'shikara_details.shikara_number', label: 'Shikara number' },
    { key: 'shikara_details.ghat_number', label: 'Ghat number' },
    { key: 'shikara_details.operating_areas', label: 'Operating areas', check: (v) => Array.isArray(v) && v.length > 0 },
    { key: 'shikara_details.years_experience', label: 'Years experience' },
    { key: 'shikara_details.languages', label: 'Languages', check: (v) => Array.isArray(v) && v.length > 0 },
    { key: 'shikara_details.services', label: 'Services', check: (v) => Array.isArray(v) && v.length > 0 },
    { key: 'shikara_details.tour_duration', label: 'Tour duration' },
  ],
  artisan: [
    { key: 'artisan_details.business_type', label: 'Business type' },
    { key: 'artisan_details.specialties', label: 'Specialties', check: (v) => Array.isArray(v) && v.length > 0 },
    { key: 'artisan_details.business_scale', label: 'Business scale' },
    { key: 'artisan_details.owner_name', label: 'Owner/contact name' },
    { key: 'artisan_details.contact_number', label: 'Contact number' },
    { key: 'artisan_details.years_in_business', label: 'Years in business' },
    { key: 'artisan_details.google_maps', label: 'Google Maps location' },
  ],
  guide: [],
  vendor: [],
};

export default function PortalPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [operator, setOperator] = useState<any>(null);
  const [leads, setLeads] = useState<any[]>([]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    }
  }, [status, router]);

  useEffect(() => {
    const sUser = session?.user as Record<string, unknown> | undefined;
    const email = session?.user?.email;
    const operatorId = sUser?.operator_id as string | undefined;

    const fetchOperator = (query: string) =>
      fetch(`/api/operators?${query}`)
        .then((r) => r.json())
        .then(async ({ data }) => {
          if (data.length > 0) {
            setOperator(data[0]);
            const leadsRes = await fetch(`/api/leads?operator_id=${data[0].id}`);
            const leadsData = await leadsRes.json();
            setLeads(leadsData);
          }
        });

    if (email) {
      fetchOperator(`email=${email}`);
    } else if (operatorId) {
      fetchOperator(`id=${operatorId}`);
    }
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

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-[#2C5F8A] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!operator) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="text-center">
          <Compass className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h2 className="text-lg font-semibold">No operator profile yet</h2>
          <p className="text-sm text-gray-600 mt-1">Register your business to get started</p>
          <Link href="/join">
            <Button className="mt-4">Register Now</Button>
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
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Nadurr" className="w-5 h-5" />
            <span className="font-semibold">Operator Portal</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">
              {operator.plan === 'free' ? 'Free Plan' : 'Pro'}
            </span>
            <button
              onClick={() => signOut({ callbackUrl: '/auth/login' })}
              className="text-xs text-gray-500 hover:text-red-600"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-4 space-y-4">
        {/* Profile Header */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold">{operator.name}</h2>
                <p className="text-xs text-gray-500 mt-1">
                  {operator.status === 'approved' ? 'Live' : operator.status}
                  {operator.verified && ' • Email Verified'}
                </p>
              </div>
              <span className="text-2xl font-bold text-[#2C5F8A]">{percent}%</span>
            </div>
            {/* Profile completion bar */}
            <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${percent === 100 ? 'bg-green-500' : 'bg-[#2C5F8A]'}`}
                style={{ width: `${percent}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardContent className="p-4 text-center">
              <BarChart3 className="w-6 h-6 text-[#2C5F8A] mx-auto mb-1" />
              <p className="text-2xl font-bold">{monthlyLeads}</p>
              <p className="text-xs text-gray-500">Leads this month</p>
              {operator.plan === 'free' && (
                <p className="text-xs text-gray-400 mt-1">
                  {leadsLeft > 0 ? `${leadsLeft} remaining` : 'Limit reached'}
                </p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Phone className="w-6 h-6 text-[#2C5F8A] mx-auto mb-1" />
              <p className="text-2xl font-bold">{leads.length}</p>
              <p className="text-xs text-gray-500">Total inquiries</p>
            </CardContent>
          </Card>
        </div>



        {/* Lead Trends */}
        {stats && (
          <Card>
            <CardContent className="p-4">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Lead Trends</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center">
                  <p className="text-lg font-bold">{stats.thisWeek}</p>
                  <p className="text-xs text-gray-500">This week</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <p className="text-lg font-bold">{stats.lastWeek}</p>
                    {stats.lastWeek > 0 && (
                      stats.thisWeek > stats.lastWeek ? (
                        <ArrowUp className="w-4 h-4 text-green-500" />
                      ) : stats.thisWeek < stats.lastWeek ? (
                        <ArrowDown className="w-4 h-4 text-red-500" />
                      ) : null
                    )}
                  </div>
                  <p className="text-xs text-gray-500">Last week</p>
                </div>
              </div>
              {Object.keys(stats.bySource).length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-xs font-medium text-gray-500 mb-2">By source</p>
                  <div className="flex gap-2 flex-wrap">
                    {Object.entries(stats.bySource).map(([src, count]) => (
                      <span key={src} className="text-xs bg-gray-100 px-2 py-1 rounded-full">
                        {src}: {count}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Profile Completion Tips */}
        {score.missing.length > 0 && (
          <Card className="border-amber-200">
            <CardContent className="p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                <div>
                  <h3 className="text-sm font-semibold text-amber-800">Complete your profile</h3>
                  <p className="text-xs text-amber-700 mt-1">
                    Add the following to attract more customers:
                  </p>
                  <ul className="mt-2 space-y-1">
                    {score.missing.map((m) => (
                      <li key={m} className="text-xs text-amber-700 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-amber-400 rounded-full" /> {m}
                      </li>
                    ))}
                  </ul>
                  <Link href="/portal/edit">
                    <Button size="sm" variant="outline" className="mt-3 text-amber-700 border-amber-300">
                      Edit Profile
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold mb-3">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-2">
              <Link href="/portal/edit">
                <Button variant="outline" size="sm" className="w-full gap-1">
                  <Edit3 className="w-4 h-4" /> Edit Profile
                </Button>
              </Link>
              <Link href="/portal/qr">
                <Button variant="outline" size="sm" className="w-full gap-1">
                  <QrCode className="w-4 h-4" /> QR Code
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Recent Leads */}
        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold mb-3">Recent Leads</h3>
            {leads.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">No leads yet</p>
            ) : (
              <div className="space-y-2">
                {leads.slice(0, 10).map((lead: any) => (
                  <div key={lead.id} className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">
                      {new Date(lead.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short',
                      })}
                    </span>
                    <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">
                      {lead.source}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upgrade Prompt */}
        {operator.plan === 'free' && monthlyLeads >= 3 && (
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="p-4 text-sm text-amber-800">
              You have reached your monthly lead limit. Upgrade to Pro for unlimited leads.
            </CardContent>
          </Card>
        )}

        {/* Upgrade Card */}
        {operator.plan === 'free' && (
          <Card className="border-[#2C5F8A]/20 bg-gradient-to-br from-blue-50 to-white">
            <CardContent className="p-4 flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-[#2C5F8A] mt-0.5 shrink-0" />
              <div>
                <h3 className="text-sm font-semibold">Upgrade to Pro</h3>
                <p className="text-xs text-gray-600 mt-1">
                  Get unlimited leads, priority support, and more visibility.
                </p>
                <div className="mt-2 flex gap-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-green-500" /> Unlimited leads</span>
                  <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-green-500" /> Higher ranking</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}

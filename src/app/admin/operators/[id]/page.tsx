'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft, Mail, Phone, MapPin, Star, Eye, EyeOff, Trash2,
  CheckCircle, XCircle, AlertTriangle, RefreshCw, Globe, User,
  Building2, Clock
} from 'lucide-react';

interface Lead {
  id: string; created_at: string; source: string;
  visitor_name: string; visitor_phone: string;
}

interface Operator {
  id: string; name: string; slug: string; category: string;
  short_desc: string | null; long_desc: string | null;
  whatsapp: string; email: string | null;
  pricing_note: string | null; status: string;
  hidden: boolean; verified: boolean; plan: string;
  lead_month: number; photos: string[];
  tariffs: any; houseboat_details: any; shikara_details: any;
  artisan_details: any; lat: number | null; lng: number | null;
  created_at: string;
}

export default function OperatorDetailPage() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  const params = useParams();
  const [op, setOp] = useState<Operator | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [newEmail, setNewEmail] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [actionLoading, setActionLoading] = useState('');

  const fetchOperator = async () => {
    const data = await fetch(`/api/admin/operators?id=${params.id}`).then(r => r.json());
    setOp(data[0] || null);
    if (data[0]) {
      fetch(`/api/admin/leads?operator_id=${params.id}`).then(r => r.json()).then(setLeads).catch(() => {});
    }
    setLoading(false);
  };

  useEffect(() => {
    if (authStatus === 'unauthenticated') router.push('/auth/login');
    else if (authStatus === 'authenticated') fetchOperator();
  }, [authStatus]);

  const doAction = async (action: string, extra: Record<string, any> = {}) => {
    setActionLoading(action);
    try {
      await fetch(`/api/admin/operators/${params.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...extra }),
      });
      await fetchOperator();
    } catch (e) {
      console.error(e);
    }
    setActionLoading('');
  };

  const isAdmin = (session?.user as any)?.is_admin;

  if (authStatus === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAdmin || !op) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground">Operator not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Back + Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/operators" className="flex h-8 w-8 items-center justify-center rounded-lg border border-border hover:bg-muted transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-foreground">{op.name}</h1>
            {op.plan === 'pro' && <Badge variant="accent">PRO</Badge>}
            <Badge variant={op.status === 'approved' ? 'success' : op.status === 'pending' ? 'warning' : op.status === 'rejected' ? 'danger' : 'default'}>
              {op.status}
            </Badge>
          </div>
          <p className="text-muted-foreground text-sm mt-0.5 capitalize">{op.category} · {op.slug}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Info Card */}
          <Card>
            <CardHeader className="p-4 border-b border-border">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <h2 className="font-semibold">Details</h2>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">WhatsApp</p>
                  <p className="text-sm text-foreground mt-0.5">{op.whatsapp}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Email</p>
                  <p className="text-sm text-foreground mt-0.5">{op.email || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Category</p>
                  <p className="text-sm capitalize text-foreground mt-0.5">{op.category}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Plan</p>
                  <p className="text-sm text-foreground mt-0.5 capitalize">{op.plan}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Leads This Month</p>
                  <p className="text-sm text-foreground mt-0.5">{op.lead_month}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Submitted</p>
                  <p className="text-sm text-foreground mt-0.5">
                    {new Date(op.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              </div>
              {op.short_desc && (
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Short Description</p>
                  <p className="text-sm text-foreground mt-0.5">{op.short_desc}</p>
                </div>
              )}
              {op.long_desc && (
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Long Description</p>
                  <p className="text-sm text-foreground mt-0.5 whitespace-pre-wrap">{op.long_desc}</p>
                </div>
              )}
              {op.pricing_note && (
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Pricing Note</p>
                  <p className="text-sm text-foreground mt-0.5">{op.pricing_note}</p>
                </div>
              )}
              {op.lat && op.lng && (
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Location</p>
                  <p className="text-sm text-foreground mt-0.5">{op.lat}, {op.lng}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tariffs */}
          {op.tariffs && (
            <Card>
              <CardHeader className="p-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-muted-foreground" />
                  <h2 className="font-semibold">Tariffs</h2>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: 'Double EP', key: 'double_ep' },
                    { label: 'Double CP', key: 'double_cp' },
                    { label: 'Double MAP', key: 'double_map' },
                    { label: 'Double AP', key: 'double_ap' },
                    { label: 'Single EP', key: 'single_ep' },
                    { label: 'Single CP', key: 'single_cp' },
                    { label: 'Single MAP', key: 'single_map' },
                    { label: 'Single AP', key: 'single_ap' },
                  ].map((t) => (
                    <div key={t.key} className="rounded-lg bg-muted p-2 text-center">
                      <p className="text-[10px] text-muted-foreground uppercase">{t.label}</p>
                      <p className="text-sm font-semibold text-foreground">₹{(op.tariffs as any)[t.key] || '—'}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Photos */}
          {op.photos && op.photos.length > 0 && (
            <Card>
              <CardHeader className="p-4 border-b border-border">
                <h2 className="font-semibold">Photos ({op.photos.length})</h2>
              </CardHeader>
              <CardContent className="p-4">
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {op.photos.map((url, i) => (
                    <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                      <div className="aspect-square rounded-lg bg-muted overflow-hidden">
                        <img src={url} alt={`${op.name} photo ${i + 1}`} className="w-full h-full object-cover" />
                      </div>
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Leads */}
          <Card>
            <CardHeader className="p-4 border-b border-border">
              <h2 className="font-semibold">Leads ({leads.length})</h2>
            </CardHeader>
            <CardContent className="p-0">
              {leads.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-sm">No leads yet</div>
              ) : (
                <div className="divide-y divide-border">
                  {leads.map((lead) => (
                    <div key={lead.id} className="p-4 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{lead.visitor_name || 'Anonymous'}</p>
                        <p className="text-xs text-muted-foreground">{lead.visitor_phone || 'No phone'}</p>
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
        </div>

        {/* Right: Actions */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="p-4 border-b border-border">
              <h2 className="font-semibold">Actions</h2>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {op.status === 'pending' && (
                <div className="flex gap-2">
                  <Button size="sm" className="flex-1" onClick={() => doAction('approve')} disabled={!!actionLoading}>
                    <CheckCircle className="h-4 w-4 mr-1" /> Approve
                  </Button>
                  <Button size="sm" variant="danger" className="flex-1" onClick={() => doAction('reject')} disabled={!!actionLoading}>
                    <XCircle className="h-4 w-4 mr-1" /> Reject
                  </Button>
                </div>
              )}

              <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => doAction('verify', { verified: !op.verified })} disabled={!!actionLoading}>
                {op.verified ? <XCircle className="h-4 w-4 mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                {op.verified ? 'Remove Verified' : 'Mark Verified'}
              </Button>

              {op.status === 'approved' && (
                <Button variant="outline" size="sm" className="w-full justify-start text-warning" onClick={() => doAction('suspend')} disabled={!!actionLoading}>
                  <AlertTriangle className="h-4 w-4 mr-2" /> Suspend
                </Button>
              )}
              {op.status === 'suspended' && (
                <Button variant="outline" size="sm" className="w-full justify-start text-success" onClick={() => doAction('approve')} disabled={!!actionLoading}>
                  <CheckCircle className="h-4 w-4 mr-2" /> Unsuspend
                </Button>
              )}
              {op.status === 'rejected' && (
                <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => doAction('approve')} disabled={!!actionLoading}>
                  <CheckCircle className="h-4 w-4 mr-2" /> Re-approve
                </Button>
              )}

              <Separator />

              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Plan</p>
                <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => doAction('change_plan', { plan: op.plan === 'free' ? 'pro' : 'free' })} disabled={!!actionLoading}>
                  <Star className="h-4 w-4 mr-2" />
                  Switch to {op.plan === 'free' ? 'Pro' : 'Free'}
                </Button>
              </div>

              <Separator />

              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Visibility</p>
                <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => doAction('toggle_hidden', { hidden: !op.hidden })} disabled={!!actionLoading}>
                  {op.hidden ? <Eye className="h-4 w-4 mr-2" /> : <EyeOff className="h-4 w-4 mr-2" />}
                  {op.hidden ? 'Make Visible' : 'Hide from Browse'}
                </Button>
              </div>

              <Separator />

              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Email</p>
                <div className="flex gap-2">
                  <input
                    value={newEmail}
                    onChange={e => setNewEmail(e.target.value)}
                    placeholder="new@email.com"
                    className="flex-1 h-9 rounded-lg border border-input bg-card px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <Button size="sm" variant="outline" onClick={() => { doAction('update_email', { email: newEmail }); setNewEmail(''); }} disabled={!newEmail || !!actionLoading}>
                    Update
                  </Button>
                </div>
              </div>

              <Separator />

              <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => doAction('reset_leads')} disabled={!!actionLoading}>
                <RefreshCw className="h-4 w-4 mr-2" /> Reset Leads Counter
              </Button>

              <Separator />

              {!deleteConfirm ? (
                <Button variant="danger" size="sm" className="w-full justify-start" onClick={() => setDeleteConfirm(true)}>
                  <Trash2 className="h-4 w-4 mr-2" /> Delete Operator
                </Button>
              ) : (
                <div className="space-y-2 p-3 rounded-lg bg-danger/10 border border-danger/20">
                  <p className="text-xs font-medium text-danger">Are you sure? This is permanent.</p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="danger" className="flex-1" onClick={() => { doAction('delete'); setDeleteConfirm(false); }} disabled={!!actionLoading}>
                      Delete
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => setDeleteConfirm(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

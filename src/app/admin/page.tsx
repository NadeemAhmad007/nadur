'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Table } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Building2, Users, Clock, CheckCircle, XCircle, Eye, EyeOff,
  Star, PhoneCall, TrendingUp, Search, ArrowUpRight, Filter
} from 'lucide-react';

interface Operator {
  id: string;
  name: string;
  slug: string;
  category: string;
  status: string;
  plan: string;
  hidden: boolean;
  verified: boolean;
  email: string | null;
  whatsapp: string;
  lead_month: number;
  created_at: string;
}

interface LeadStats {
  operator_id: string;
  name: string;
  count: number;
}

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [operators, setOperators] = useState<Operator[]>([]);
  const [leadStats, setLeadStats] = useState<LeadStats[]>([]);
  const [totalLeads, setTotalLeads] = useState(0);
  const [todayLeads, setTodayLeads] = useState(0);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [onlineStatuses, setOnlineStatuses] = useState<Record<string, string>>({});

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/login');
  }, [status, router]);

  useEffect(() => {
    fetch('/api/admin/operators').then(r => r.json()).then(setOperators).catch(() => {});
    fetch('/api/admin/leads').then(r => r.json()).then(d => {
      setTotalLeads(d.total ?? 0);
      setTodayLeads(d.today ?? 0);
      setLeadStats(d.byOperator ?? []);
    }).catch(() => {});
    fetch('/api/admin/operators/status').then(r => r.json()).then(setOnlineStatuses).catch(() => {});
  }, []);

  const filtered = operators.filter((op) => {
    const q = search.toLowerCase();
    const matchSearch = !q || op.name.toLowerCase().includes(q) || op.whatsapp.includes(q) || (op.email?.toLowerCase() || '').includes(q);
    const matchStatus = !filterStatus || op.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const stats = [
    { label: 'Total Operators', value: operators.length, icon: Building2, color: 'text-primary', bg: 'bg-primary/10' },
    { label: 'Pending', value: operators.filter(o => o.status === 'pending').length, icon: Clock, color: 'text-warning', bg: 'bg-warning/10' },
    { label: 'Approved', value: operators.filter(o => o.status === 'approved').length, icon: CheckCircle, color: 'text-success', bg: 'bg-success/10' },
    { label: 'Rejected', value: operators.filter(o => o.status === 'rejected').length, icon: XCircle, color: 'text-danger', bg: 'bg-danger/10' },
    { label: 'Pro Plan', value: operators.filter(o => o.plan === 'pro').length, icon: Star, color: 'text-accent', bg: 'bg-accent/10' },
    { label: 'Hidden', value: operators.filter(o => o.hidden).length, icon: EyeOff, color: 'text-muted-foreground', bg: 'bg-muted' },
    { label: 'Total Leads', value: totalLeads, icon: PhoneCall, color: 'text-info', bg: 'bg-info/10' },
    { label: 'Today\'s Leads', value: todayLeads, icon: TrendingUp, color: 'text-success', bg: 'bg-success/10' },
  ];

  const isAdmin = (session?.user as any)?.is_admin;
  if (status === 'loading' || !isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1">Manage operators, approvals, and platform analytics</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${stat.bg}`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Operators Table */}
      <Card>
        <CardHeader className="p-4 border-b border-border">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <h2 className="text-lg font-semibold">Operators</h2>
            <div className="flex gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search operators..."
                  className="w-full pl-9 pr-3 h-9 rounded-lg border border-input bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div className="flex gap-1">
                {['', 'pending', 'approved', 'rejected', 'suspended'].map((s) => (
                  <button
                    key={s}
                    onClick={() => setFilterStatus(s)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                      filterStatus === s
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    {s || 'All'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table
            columns={[
              { key: 'name', header: 'Name', render: (op: Operator) => {
                const status = onlineStatuses[op.id];
                return (
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${
                      status === 'online' ? 'bg-success' : status === 'recent' ? 'bg-warning' : 'bg-muted-foreground/30'
                    }`} />
                    <span className="font-medium text-foreground">{op.name}</span>
                    {op.plan === 'pro' && <Badge variant="accent" size="sm">PRO</Badge>}
                    {op.hidden && <Badge variant="outline" size="sm">Hidden</Badge>}
                  </div>
                );
              }},
              { key: 'category', header: 'Category', render: (op: Operator) => (
                <span className="capitalize text-muted-foreground">{op.category}</span>
              )},
              { key: 'status', header: 'Status', render: (op: Operator) => {
                const variants: Record<string, 'warning' | 'success' | 'danger' | 'default'> = {
                  pending: 'warning', approved: 'success', rejected: 'danger', suspended: 'default',
                };
                return <Badge variant={variants[op.status] || 'default'}>{op.status}</Badge>;
              }},
              { key: 'lead_month', header: 'Leads', render: (op: Operator) => (
                <span className="text-muted-foreground">{op.lead_month}</span>
              )},
              { key: 'created_at', header: 'Date', render: (op: Operator) => (
                <span className="text-muted-foreground text-xs">
                  {new Date(op.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              )},
              { key: 'actions', header: '', render: (op: Operator) => (
                <Link
                  href={`/admin/operators/${op.id}`}
                  className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary-light"
                >
                  Manage <ArrowUpRight className="h-3 w-3" />
                </Link>
              )},
            ]}
            data={filtered}
            keyExtractor={(op) => op.id}
            emptyMessage="No operators found matching your filters"
          />
        </CardContent>
      </Card>

      {/* Top Leads */}
      {leadStats.length > 0 && (
        <Card>
          <CardHeader className="p-4 border-b border-border">
            <h2 className="text-lg font-semibold">Top Operators by Leads</h2>
          </CardHeader>
          <CardContent className="p-0">
            <Table
              columns={[
                { key: 'name', header: 'Operator', render: (ls: LeadStats) => (
                  <span className="font-medium text-foreground">{ls.name}</span>
                )},
                { key: 'count', header: 'Leads', render: (ls: LeadStats) => (
                  <Badge variant="info">{ls.count}</Badge>
                )},
              ]}
              data={leadStats.slice(0, 15)}
              keyExtractor={(ls) => ls.operator_id}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

'use client';
import { useEffect, useState, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, ArrowUpRight, Filter, X } from 'lucide-react';

interface Operator {
  id: string; name: string; slug: string; category: string;
  status: string; plan: string; hidden: boolean; verified: boolean;
  email: string | null; whatsapp: string; lead_month: number;
  created_at: string;
}

const statusColors: Record<string, 'warning' | 'success' | 'danger' | 'default'> = {
  pending: 'warning', approved: 'success', rejected: 'danger', suspended: 'default',
};

function OperatorsContent() {
  const searchParams = useSearchParams();
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  const [operators, setOperators] = useState<Operator[]>([]);
  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
  const [categoryFilter, setCategoryFilter] = useState(searchParams.get('category') || '');
  const [planFilter, setPlanFilter] = useState(searchParams.get('plan') || '');
  const [showHidden, setShowHidden] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authStatus === 'unauthenticated') router.push('/auth/login');
  }, [authStatus, router]);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter) params.set('status', statusFilter);
    if (categoryFilter) params.set('category', categoryFilter);
    if (planFilter) params.set('plan', planFilter);
    if (showHidden) params.set('hidden', 'true');
    if (search) params.set('q', search);

    fetch(`/api/admin/operators?${params}`)
      .then(r => r.json())
      .then(setOperators)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [statusFilter, categoryFilter, planFilter, showHidden, search]);

  const clearFilters = () => {
    setStatusFilter(''); setCategoryFilter(''); setPlanFilter(''); setShowHidden(false); setSearch('');
  };

  const hasFilters = statusFilter || categoryFilter || planFilter || showHidden || search;
  const isAdmin = (session?.user as any)?.is_admin;

  if (authStatus === 'loading' || !isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Operators</h1>
        <p className="text-muted-foreground mt-1">View and manage all registered operators</p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by name, phone, or email..."
                className="w-full pl-9 pr-3 h-10 rounded-lg border border-input bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="flex flex-wrap gap-1">
              <span className="text-xs font-medium text-muted-foreground self-center mr-1">Status:</span>
              {['', 'pending', 'approved', 'rejected', 'suspended'].map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                    statusFilter === s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >{s || 'All'}</button>
              ))}
            </div>
            <div className="w-px bg-border mx-1 hidden sm:block" />
            <div className="flex flex-wrap gap-1">
              <span className="text-xs font-medium text-muted-foreground self-center mr-1">Category:</span>
              {['', 'houseboat', 'shikara', 'artisan', 'guide', 'vendor'].map((c) => (
                <button
                  key={c}
                  onClick={() => setCategoryFilter(c)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium capitalize transition-colors ${
                    categoryFilter === c ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >{c || 'All'}</button>
              ))}
            </div>
            <div className="w-px bg-border mx-1 hidden sm:block" />
            <div className="flex flex-wrap gap-1">
              <span className="text-xs font-medium text-muted-foreground self-center mr-1">Plan:</span>
              {['', 'free', 'pro'].map((p) => (
                <button
                  key={p}
                  onClick={() => setPlanFilter(p)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                    planFilter === p ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >{p || 'All'}</button>
              ))}
            </div>
            <div className="w-px bg-border mx-1 hidden sm:block" />
            <button
              onClick={() => setShowHidden(!showHidden)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                showHidden ? 'bg-danger text-danger-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >Hidden</button>
            {hasFilters && (
              <button onClick={clearFilters} className="px-2.5 py-1 rounded-md text-xs font-medium text-muted-foreground hover:bg-muted flex items-center gap-1">
                <X className="h-3 w-3" /> Clear
              </button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* List */}
      <div className="space-y-2">
        {loading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-16 rounded-xl border border-border bg-card animate-pulse" />
          ))
        ) : operators.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">No operators found matching your filters</p>
            </CardContent>
          </Card>
        ) : (
          operators.map((op) => (
            <Link key={op.id} href={`/admin/operators/${op.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary font-semibold text-sm">
                        {op.name[0]}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground truncate">{op.name}</span>
                          {op.plan === 'pro' && <Badge variant="accent" size="sm">PRO</Badge>}
                          {op.hidden && <Badge variant="outline" size="sm">HIDDEN</Badge>}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-muted-foreground capitalize">{op.category}</span>
                          <span className="text-xs text-muted-foreground">·</span>
                          <span className="text-xs text-muted-foreground">{op.whatsapp}</span>
                          {op.email && (
                            <>
                              <span className="text-xs text-muted-foreground">·</span>
                              <span className="text-xs text-muted-foreground truncate">{op.email}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant={statusColors[op.status] || 'default'}>{op.status}</Badge>
                      {op.verified ? (
                        <Badge variant="success" size="sm">Verified</Badge>
                      ) : (
                        <Badge variant="outline" size="sm">Unverified</Badge>
                      )}
                      <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}

export default function OperatorsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    }>
      <OperatorsContent />
    </Suspense>
  );
}

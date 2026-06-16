'use client';

import { useState, useEffect } from 'react';
import { signOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Shield, Users, Clock, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0, total: 0 });
  const [operators, setOperators] = useState<any[]>([]);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/login');
  }, [status, router]);

  useEffect(() => {
    fetch('/api/admin/operators')
      .then((r) => r.json())
      .then((data) => {
        setOperators(data);
        setStats({
          pending: data.filter((o: any) => o.status === 'pending').length,
          approved: data.filter((o: any) => o.status === 'approved').length,
          rejected: data.filter((o: any) => o.status === 'rejected').length,
          total: data.length,
        });
      });
  }, []);

  if (status === 'loading') {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-2 border-[#2C5F8A] border-t-transparent rounded-full" />
    </div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Nadurr" className="w-5 h-5" />
            <h1 className="font-semibold">Admin Dashboard</h1>
          </div>
          <button onClick={() => signOut({ callbackUrl: '/auth/login' })} className="text-xs text-gray-500 hover:text-red-600">
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        <div className="grid grid-cols-4 gap-3 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <Clock className="w-5 h-5 text-amber-500 mx-auto mb-1" />
              <p className="text-2xl font-bold">{stats.pending}</p>
              <p className="text-xs text-gray-500">Pending</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <CheckCircle className="w-5 h-5 text-green-500 mx-auto mb-1" />
              <p className="text-2xl font-bold">{stats.approved}</p>
              <p className="text-xs text-gray-500">Approved</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <XCircle className="w-5 h-5 text-red-500 mx-auto mb-1" />
              <p className="text-2xl font-bold">{stats.rejected}</p>
              <p className="text-xs text-gray-500">Rejected</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Users className="w-5 h-5 text-[#2C5F8A] mx-auto mb-1" />
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-xs text-gray-500">Total</p>
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-2 mb-4">
          <Link href="/admin/operators?status=pending">
            <Button size="sm" variant={stats.pending > 0 ? 'primary' : 'outline'}>
              Pending ({stats.pending})
            </Button>
          </Link>
          <Link href="/admin/operators?status=approved">
            <Button size="sm" variant="outline">Approved</Button>
          </Link>
          <Link href="/admin/operators">
            <Button size="sm" variant="outline">All</Button>
          </Link>
          <Link href="/admin/categories">
            <Button size="sm" variant="outline">Categories</Button>
          </Link>
        </div>

        <div className="space-y-2">
          {operators.filter((o) => o.status === 'pending').slice(0, 10).map((op: any) => (
            <Link key={op.id} href={`/admin/operators/${op.id}`}>
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{op.name}</p>
                    <p className="text-xs text-gray-500">{op.category} • {new Date(op.created_at).toLocaleDateString()}</p>
                  </div>
                  <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                    Pending
                  </span>
                </CardContent>
              </Card>
            </Link>
          ))}
          {stats.pending === 0 && (
            <p className="text-center text-gray-500 text-sm py-8">No pending operators</p>
          )}
        </div>
      </main>
    </div>
  );
}

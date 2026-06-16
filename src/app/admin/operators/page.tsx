'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Shield, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

function OperatorListContent() {
  const searchParams = useSearchParams();
  const statusFilter = searchParams.get('status');
  const verifiedFilter = searchParams.get('verified');
  const [operators, setOperators] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter) params.set('status', statusFilter);

    fetch(`/api/admin/operators?${params}`)
      .then((r) => r.json())
      .then((all) => {
        let filtered = all;
        if (verifiedFilter === 'unverified') {
          filtered = all.filter((op: any) => op.email?.endsWith('@nadur.com') || !op.verified);
        } else if (verifiedFilter === 'verified') {
          filtered = all.filter((op: any) => !op.email?.endsWith('@nadur.com') && op.verified);
        }
        setOperators(filtered);
      })
      .finally(() => setLoading(false));
  }, [statusFilter, verifiedFilter]);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/admin" className="p-1">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <img src="/logo.png" alt="Nadurr" className="w-5 h-5" />
          <h1 className="font-semibold">Operators {statusFilter && `(${statusFilter})`}</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-4 space-y-2">
        <div className="flex gap-2 flex-wrap mb-2">
          <Link
            href="/admin/operators"
            className={`text-xs px-3 py-1.5 rounded-full border ${
              !verifiedFilter ? 'bg-[#2C5F8A] text-white border-[#2C5F8A]' : 'bg-white text-gray-600 border-gray-300'
            }`}
          >
            All
          </Link>
          <Link
            href="/admin/operators?verified=unverified"
            className={`text-xs px-3 py-1.5 rounded-full border ${
              verifiedFilter === 'unverified' ? 'bg-red-600 text-white border-red-600' : 'bg-white text-gray-600 border-gray-300'
            }`}
          >
            Email Not Verified
          </Link>
          <Link
            href="/admin/operators?verified=verified"
            className={`text-xs px-3 py-1.5 rounded-full border ${
              verifiedFilter === 'verified' ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-600 border-gray-300'
            }`}
          >
            Email Verified
          </Link>
        </div>
        {loading ? (
          [...Array(5)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-1/4" />
              </CardContent>
            </Card>
          ))
        ) : operators.length === 0 ? (
          <p className="text-center text-gray-500 py-8">No operators found</p>
        ) : (
          operators.map((op: any) => (
            <Link key={op.id} href={`/admin/operators/${op.id}`}>
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{op.name}</p>
                    <p className="text-xs text-gray-500">
                      {op.category} • {op.whatsapp}{op.email ? ` • ${op.email}` : ''} • {new Date(op.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      op.status === 'approved' ? 'bg-green-100 text-green-800' :
                      op.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                      op.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {op.status}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      op.email?.endsWith('@nadur.com') || !op.verified ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {op.email?.endsWith('@nadur.com') || !op.verified ? 'Email ✗' : 'Email ✓'}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </main>
    </div>
  );
}

export default function OperatorsListPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50" />}>
      <OperatorListContent />
    </Suspense>
  );
}

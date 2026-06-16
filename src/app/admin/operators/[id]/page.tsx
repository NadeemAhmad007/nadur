'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Shield, BadgeCheck, XCircle } from 'lucide-react';
import Link from 'next/link';

export default function OperatorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [operator, setOperator] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [rejectReason, setRejectReason] = useState('');
  const [showReject, setShowReject] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/operators?status=pending`)
      .then((r) => r.json())
      .then((ops) => {
        const op = ops.find((o: any) => o.id === params.id) || null;
        if (!op) {
          fetch('/api/admin/operators')
            .then((r) => r.json())
            .then((all) => setOperator(all.find((o: any) => o.id === params.id) || null));
        } else {
          setOperator(op);
        }
      })
      .finally(() => setLoading(false));
  }, [params.id]);

  const handleAction = async (action: string, extra?: Record<string, unknown>) => {
    const res = await fetch(`/api/admin/operators/${params.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...extra }),
    });
    if (res.ok) {
      router.push('/admin/operators');
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-2 border-[#2C5F8A] border-t-transparent rounded-full" />
    </div>;
  }

  if (!operator) {
    return <div className="min-h-screen flex items-center justify-center">
      <p>Operator not found</p>
    </div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/admin/operators" className="p-1">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <img src="/logo.png" alt="Nadurr" className="w-5 h-5" />
          <h1 className="font-semibold truncate">{operator.name}</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {operator.status === 'pending' && (
          <div className="flex gap-3">
            <Button onClick={() => handleAction('approve')} className="flex-1 gap-2 bg-green-600 hover:bg-green-700">
              <BadgeCheck className="w-4 h-4" /> Approve
            </Button>
            <Button onClick={() => setShowReject(!showReject)} variant="danger" className="flex-1 gap-2">
              <XCircle className="w-4 h-4" /> Reject
            </Button>
          </div>
        )}

        {showReject && (
          <Card>
            <CardContent className="p-4 space-y-3">
              <h3 className="text-sm font-semibold">Rejection Reason</h3>
              <select
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="">Select reason...</option>
                <option value="insufficient_photos">Insufficient or low-quality photos</option>
                <option value="invalid_info">Invalid or misleading business information</option>
                <option value="wrong_category">Wrong category</option>
                <option value="duplicate">Duplicate profile</option>
                <option value="other">Other</option>
              </select>
              <Button
                onClick={() => handleAction('reject', { reason: rejectReason })}
                variant="danger"
                className="w-full"
                disabled={!rejectReason}
              >
                Confirm Rejection
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardContent className="p-4 space-y-2">
              <h3 className="text-sm font-semibold">Details</h3>
              <div className="text-sm space-y-1">
                <p><span className="text-gray-500">Category:</span> {operator.category}</p>
                <p><span className="text-gray-500">WhatsApp:</span> {operator.whatsapp}</p>
                <p><span className="text-gray-500">Email:</span> {operator.email || 'Not set'}</p>
                <p><span className="text-gray-500">Email Verified:</span> {operator.email?.endsWith('@nadur.com') ? 'No (backfilled)' : operator.verified ? 'Yes' : 'No'}</p>
                <p><span className="text-gray-500">Status:</span> {operator.status}</p>
                <p><span className="text-gray-500">Plan:</span> {operator.plan}</p>
                <p><span className="text-gray-500">Leads this month:</span> {operator.lead_month}</p>
                <p><span className="text-gray-500">Submitted:</span> {new Date(operator.created_at).toLocaleDateString()}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 space-y-3">
              <h3 className="text-sm font-semibold">Actions</h3>
              {operator.status === 'approved' && (
                <Button
                  onClick={() => handleAction('verify', { verified: !operator.verified })}
                  variant={operator.verified ? 'outline' : 'primary'}
                  size="sm"
                  className="w-full"
                >
                  {operator.verified ? 'Remove Verified' : 'Mark Verified'}
                </Button>
              )}
              {operator.status === 'approved' && (
                <Button
                  onClick={() => handleAction('suspend')}
                  variant="danger"
                  size="sm"
                  className="w-full"
                >
                  Suspend
                </Button>
              )}
              {operator.status === 'rejected' && (
                <Button
                  onClick={() => handleAction('approve')}
                  size="sm"
                  className="w-full"
                >
                  Re-approve
                </Button>
              )}
              {operator.status === 'suspended' && (
                <Button
                  onClick={() => handleAction('approve')}
                  size="sm"
                  className="w-full"
                >
                  Unsuspend
                </Button>
              )}
              <hr className="border-gray-200" />
              <h4 className="text-xs font-semibold text-gray-500">Leads & Plan</h4>
              <Button
                onClick={() => handleAction('change_plan', { plan: operator.plan === 'free' ? 'pro' : 'free' })}
                size="sm"
                variant="outline"
                className="w-full"
              >
                Switch to {operator.plan === 'free' ? 'Pro' : 'Free'}
              </Button>
              <Button
                onClick={() => handleAction('reset_leads')}
                size="sm"
                variant="outline"
                className="w-full text-amber-600 border-amber-300 hover:bg-amber-50"
              >
                Reset Lead Counter
              </Button>
            </CardContent>
          </Card>
        </div>

        {operator.short_desc && (
          <Card>
            <CardContent className="p-4">
              <h3 className="text-sm font-semibold mb-2">Short Description</h3>
              <p className="text-sm text-gray-700">{operator.short_desc}</p>
            </CardContent>
          </Card>
        )}

        {operator.long_desc && (
          <Card>
            <CardContent className="p-4">
              <h3 className="text-sm font-semibold mb-2">Long Description</h3>
              <p className="text-sm text-gray-700 whitespace-pre-line">{operator.long_desc}</p>
            </CardContent>
          </Card>
        )}

        {operator.pricing_note && (
          <Card>
            <CardContent className="p-4">
              <h3 className="text-sm font-semibold mb-2">Pricing</h3>
              <p className="text-sm text-gray-700">{operator.pricing_note}</p>
            </CardContent>
          </Card>
        )}

        {operator.houseboat_details && operator.category === 'houseboat' && (
          <Card>
            <CardContent className="p-4">
              <h3 className="text-sm font-semibold mb-2">Houseboat Details</h3>
              <div className="text-sm space-y-1">
                {operator.houseboat_details.owner && <p><span className="text-gray-500">Owner:</span> {operator.houseboat_details.owner}</p>}
                {operator.houseboat_details.address && <p><span className="text-gray-500">Address:</span> {operator.houseboat_details.address}</p>}
                {operator.houseboat_details.contact && <p><span className="text-gray-500">Contact:</span> {operator.houseboat_details.contact}</p>}
                {operator.houseboat_details.contact2 && <p><span className="text-gray-500">Contact 2:</span> {operator.houseboat_details.contact2}</p>}
                {operator.houseboat_details.email && <p><span className="text-gray-500">Email:</span> {operator.houseboat_details.email}</p>}
                {operator.houseboat_details.grade && <p><span className="text-gray-500">Grade:</span> {operator.houseboat_details.grade}</p>}
                {operator.houseboat_details.google_maps && <p><span className="text-gray-500">Location:</span> <a href={operator.houseboat_details.google_maps} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">View on Map</a></p>}
              </div>
            </CardContent>
          </Card>
        )}

        {operator.tariffs && operator.category === 'houseboat' && (
          <Card>
            <CardContent className="p-4">
              <h3 className="text-sm font-semibold mb-2">Tariffs (₹)</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {[
                  ['double_ep', 'Double Bed (EP)'],
                  ['double_cp', 'Double Bed (CP)'],
                  ['double_map', 'Double Bed (MAP)'],
                  ['double_ap', 'Double Bed (AP)'],
                  ['single_ep', 'Single Bed (EP)'],
                  ['single_cp', 'Single Bed (CP)'],
                  ['single_map', 'Single Bed (MAP)'],
                  ['single_ap', 'Single Bed (AP)'],
                ].map(([key, label]) => {
                  const val = operator.tariffs?.[key];
                  if (!val) return null;
                  return (
                    <div key={key} className="flex justify-between">
                      <span className="text-gray-500">{label}</span>
                      <span className="font-medium">₹{val}</span>
                    </div>
                  );
                })}
              </div>
              {operator.tariffs?.note && (
                <p className="text-xs text-gray-500 mt-2">{operator.tariffs.note}</p>
              )}
            </CardContent>
          </Card>
        )}

        {operator.photos?.length > 0 && (
          <Card>
            <CardContent className="p-4">
              <h3 className="text-sm font-semibold mb-3">Photos ({operator.photos.length})</h3>
              <div className="grid grid-cols-3 gap-2">
                {operator.photos.map((url: string, i: number) => (
                  <a key={i} href={url} target="_blank" rel="noreferrer">
                    <img
                      src={url}
                      alt={`Photo ${i + 1}`}
                      className="w-full aspect-square object-cover rounded-lg"
                    />
                  </a>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}

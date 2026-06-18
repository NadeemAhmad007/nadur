'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Download } from 'lucide-react';
import Link from 'next/link';

export default function QRPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [operator, setOperator] = useState<any>(null);
  const [qrDataUrl, setQrDataUrl] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/login');
  }, [status, router]);

  useEffect(() => {
    const sUser = session?.user as Record<string, unknown> | undefined;
    const email = session?.user?.email;
    const operatorId = sUser?.operator_id as string | undefined;

    const fetchOp = async (query: string) => {
      try {
        const r = await fetch(`/api/operators?${query}`);
        const { data } = await r.json();
        const op = data?.[0];
        if (op) {
          setOperator(op);
          const res = await fetch(`/api/qr/${op.slug}`);
          const svg = await res.text();
          setQrDataUrl(`data:image/svg+xml;base64,${btoa(svg)}`);
        }
      } catch { /* ignore */ }
    };

    if (email) fetchOp(`email=${email}`);
    else if (operatorId) fetchOp(`id=${operatorId}`);
  }, [session]);

  const download = (format: 'svg' | 'png') => {
    if (!operator) return;
    const url = `/api/qr/${operator.slug}?format=${format}`;
    const a = document.createElement('a');
    a.href = url;
    a.download = `${operator.slug}-qr.${format}`;
    a.click();
  };

  if (!operator) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-2 border-[#2C5F8A] border-t-transparent rounded-full" />
    </div>;
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-200">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/portal" className="p-1">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <img src="/logo.png" alt="Kashmir360" className="h-14 w-auto" />
          <h1 className="text-lg font-semibold">Your QR Code</h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 text-center">
        <Card className="mb-6">
          <CardContent className="p-6 flex flex-col items-center">
            {qrDataUrl && (
              <img src={qrDataUrl} alt={`QR code for ${operator.name}`} className="w-64 h-64" />
            )}
            <p className="text-sm font-medium mt-3">{operator.name}</p>
            <p className="text-xs text-gray-500 mt-1">
              {process.env.NEXT_PUBLIC_APP_URL || 'https://kashmir360.app'}/o/{operator.slug}
            </p>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button onClick={() => download('svg')} variant="outline" className="flex-1 gap-2">
            <Download className="w-4 h-4" /> SVG (Print)
          </Button>
          <Button onClick={() => download('png')} className="flex-1 gap-2">
            <Download className="w-4 h-4" /> PNG (Digital)
          </Button>
        </div>

        <p className="text-xs text-gray-500 mt-4">
          Print the SVG for stickers or use the PNG for social media.
          Place QR stickers at eye level in your houseboat or shop.
        </p>
      </main>
    </div>
  );
}

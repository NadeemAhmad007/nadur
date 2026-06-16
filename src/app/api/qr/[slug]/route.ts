import { NextResponse } from 'next/server';
import QRCode from 'qrcode';

export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://nadur.app';
  const url = `${appUrl}/o/${slug}?src=qr`;
  const format = new URL(req.url).searchParams.get('format') || 'svg';

  if (format === 'png') {
    const buf = await QRCode.toBuffer(url, { width: 1200, margin: 2 });
    const uint8 = new Uint8Array(buf);
    return new Response(uint8, {
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': `attachment; filename="${slug}-qr.png"`,
      },
    });
  }

  const svg = await QRCode.toString(url, { type: 'svg', margin: 2 });
  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Content-Disposition': `attachment; filename="${slug}-qr.svg"`,
    },
  });
}

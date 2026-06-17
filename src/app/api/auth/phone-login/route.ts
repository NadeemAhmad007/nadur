import { signIn } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || 'anon';
  const { allowed } = rateLimit(`phone-login:${ip}`, 5, 60000);
  if (!allowed) {
    return NextResponse.redirect(new URL('/auth/login?error=generic', req.url), { status: 303 });
  }

  try {
    let phone: string | null = null;
    if (req.headers.get('content-type')?.includes('form')) {
      const fd = await req.formData();
      phone = fd.get('phone') as string | null;
    } else {
      const body = await req.json();
      phone = body.phone;
    }
    if (!phone) {
      return NextResponse.redirect(new URL('/auth/login?error=missing', req.url), { status: 303 });
    }
    const url = await signIn('phone-otp', { phone, otp: 'verify', redirect: false });
    if (typeof url === 'string' && url.includes('?error=')) {
      return NextResponse.redirect(new URL('/auth/login?error=generic', req.url), { status: 303 });
    }
    return NextResponse.redirect(new URL('/portal', req.url), { status: 303 });
  } catch (e) {
    return NextResponse.redirect(new URL('/auth/login?error=generic', req.url), { status: 303 });
  }
}

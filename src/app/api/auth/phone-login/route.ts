import { signIn } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

const adminPhones = ['+919149670483'];

export async function POST(req: NextRequest) {
  console.log('=== PHONE LOGIN ROUTE CALLED ===');
  try {
    let phone: string | null = null;
    if (req.headers.get('content-type')?.includes('form')) {
      const fd = await req.formData();
      phone = fd.get('phone') as string | null;
      console.log('Form data keys:', [...fd.keys()]);
    } else {
      const body = await req.json();
      phone = body.phone;
      console.log('JSON body:', body);
    }
    console.log('Phone:', phone);
    if (!phone) {
      console.log('Missing phone');
      return NextResponse.redirect(new URL('/auth/login?error=missing', req.url), { status: 303 });
    }
    const url = await signIn('phone-otp', { phone, otp: 'verify', redirect: false });
    console.log('signIn returned:', url, 'type:', typeof url);
    if (typeof url === 'string' && url.includes('?error=')) {
      console.log('signIn error url:', url);
      return NextResponse.redirect(new URL('/auth/login?error=phone', req.url), { status: 303 });
    }
    console.log('Sign in successful, redirecting to:', adminPhones.includes(phone) ? '/admin' : '/portal');
    return NextResponse.redirect(new URL(adminPhones.includes(phone) ? '/admin' : '/portal', req.url), { status: 303 });
  } catch (e) {
    console.log('Catch block error:', e);
    return NextResponse.redirect(new URL('/auth/login?error=unknown', req.url), { status: 303 });
  }
}

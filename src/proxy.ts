import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function proxy(request: Request) {
  const url = new URL(request.url);
  const { pathname } = url;

  if (pathname.startsWith('/admin') || pathname.startsWith('/portal')) {
    const session = await auth();

    if (pathname.startsWith('/admin')) {
      const isAdmin = (session?.user as unknown as Record<string, unknown> | undefined)?.is_admin;
      if (!isAdmin) {
        return NextResponse.redirect(new URL('/auth/login', request.url));
      }
    }

    if (pathname.startsWith('/portal')) {
      if (!session) {
        return NextResponse.redirect(new URL('/auth/login', request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/portal/:path*'],
};

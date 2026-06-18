import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { rateLimit } from '@/lib/rate-limit';
import { setSetting } from '@/lib/settings';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function GET() {
  const session = await auth();
  const isAdmin = (session?.user as unknown as Record<string, unknown> | undefined)?.is_admin;
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await execAsync('docker info');
  } catch {
    return NextResponse.json({
      error: 'Docker is not available on this server. Get the API key from your Docker host manually.',
      needs_docker: true,
    }, { status: 400 });
  }

  try {
    const { stdout } = await execAsync('docker logs nadur-openwa 2>&1 | grep -o \'owa_k1_[a-f0-9]*\' | head -1');
    const key = stdout.trim();
    if (!key) {
      return NextResponse.json({ error: 'No API key found in logs. Is the container running?' }, { status: 404 });
    }
    return NextResponse.json({ key });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to extract API key' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await auth();
  const isAdmin = (session?.user as unknown as Record<string, unknown> | undefined)?.is_admin;
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const ip = req.headers.get('x-forwarded-for') || 'anon';
  const { allowed } = rateLimit(`whatsapp-server-key:${ip}`, 10, 60000);
  if (!allowed) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  try {
    const { key } = await req.json();
    if (!key) {
      return NextResponse.json({ error: 'API key is required' }, { status: 400 });
    }
    await setSetting('openwa_api_key', key);
    return NextResponse.json({ success: true, message: 'API key saved' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to save API key' }, { status: 500 });
  }
}

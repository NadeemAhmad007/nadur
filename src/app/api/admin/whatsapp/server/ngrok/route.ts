import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function GET() {
  const session = await auth();
  const isAdmin = (session?.user as unknown as Record<string, unknown> | undefined)?.is_admin;
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const tunnels: { url: string; target: string }[] = [];

  // Try ngrok local API
  try {
    const res = await fetch('http://127.0.0.1:4040/api/tunnels', { signal: AbortSignal.timeout(3000) });
    if (res.ok) {
      const data = await res.json();
      for (const t of data.tunnels || []) {
        tunnels.push({ url: t.public_url, target: t.config?.addr || '' });
      }
    }
  } catch {}

  // Try ngrok CLI
  if (tunnels.length === 0) {
    try {
      const { stdout } = await execAsync('ngrok status 2>&1 | grep -oE "https://[a-zA-Z0-9.-]+ngrok[^\\s]*" || true');
      for (const url of stdout.trim().split('\n')) {
        if (url) tunnels.push({ url: url.trim(), target: '' });
      }
    } catch {}
  }

  return NextResponse.json({
    tunnels,
    count: tunnels.length,
    has_openwa_tunnel: tunnels.some(t => t.target === 'http://localhost:2785' || t.target === 'localhost:2785'),
  });
}

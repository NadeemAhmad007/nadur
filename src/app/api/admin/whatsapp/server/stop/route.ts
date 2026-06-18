import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { rateLimit } from '@/lib/rate-limit';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function POST() {
  const session = await auth();
  const isAdmin = (session?.user as unknown as Record<string, unknown> | undefined)?.is_admin;
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await execAsync('docker info');
  } catch {
    return NextResponse.json({
      error: 'Docker is not available on this server.',
      needs_docker: true,
    }, { status: 400 });
  }

  try {
    await execAsync('docker compose -f docker-compose.openwa.yml down');
    return NextResponse.json({ success: true, message: 'OpenWA server stopped' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to stop server' }, { status: 500 });
  }
}

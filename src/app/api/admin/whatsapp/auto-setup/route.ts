import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { rateLimit } from '@/lib/rate-limit';
import { setSetting, getOpenwaConfig } from '@/lib/settings';
import { createSession, startSession, getSessions, clearSessionUuid, resetOpenwaConfig } from '@/lib/openwa';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function detectDocker(): Promise<boolean> {
  try {
    await execAsync('docker info');
    return true;
  } catch { return false; }
}

async function dockerUp(): Promise<boolean> {
  try {
    await execAsync('docker compose -f docker-compose.openwa.yml up -d');
    return true;
  } catch { return false; }
}

async function waitForContainer(attempts = 12): Promise<boolean> {
  for (let i = 0; i < attempts; i++) {
    try {
      const { stdout } = await execAsync('docker inspect nadur-openwa --format "{{.State.Health.Status}}" 2>/dev/null || echo "not found"');
      if (stdout.trim() === 'healthy') return true;
    } catch {}
    await new Promise(r => setTimeout(r, 5000));
  }
  return false;
}

async function detectApiKey(): Promise<string | null> {
  try {
    const { stdout } = await execAsync('docker logs nadur-openwa 2>&1 | grep -o \'owa_k1_[a-f0-9]*\' | head -1');
    return stdout.trim() || null;
  } catch { return null; }
}

async function detectNgrokUrl(): Promise<string | null> {
  try {
    const res = await fetch('http://127.0.0.1:4040/api/tunnels', { signal: AbortSignal.timeout(3000) });
    if (res.ok) {
      const data = await res.json();
      for (const t of data.tunnels || []) {
        if (t.config?.addr === 'http://localhost:2785' || t.config?.addr === 'localhost:2785') {
          return t.public_url;
        }
      }
      // fallback: return first tunnel
      if (data.tunnels?.[0]) return data.tunnels[0].public_url;
    }
  } catch {}
  return null;
}

async function startNgrok(): Promise<string | null> {
  try {
    await execAsync('ngrok http 2785 --log=stdout > /dev/null 2>&1 &');
    await new Promise(r => setTimeout(r, 5000));
    return detectNgrokUrl();
  } catch { return null; }
}

export async function POST() {
  const session = await auth();
  const isAdmin = (session?.user as unknown as Record<string, unknown> | undefined)?.is_admin;
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const ip = '127.0.0.1';
  const { allowed } = rateLimit(`auto-setup:${ip}`, 3, 60000);
  if (!allowed) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const steps: { step: string; status: string; error?: string; key?: string; url?: string; qr?: string; sessionId?: string }[] = [];

  // Step 1: Check Docker
  steps.push({ step: 'docker', status: 'checking' });
  const dockerAvailable = await detectDocker();
  if (!dockerAvailable) {
    steps[0] = { step: 'docker', status: 'unavailable', error: 'Docker not found. Run locally or paste your ngrok URL manually.' };
    return NextResponse.json({ steps, success: false, needs_manual: true });
  }
  steps[0] = { step: 'docker', status: 'available' };

  // Step 2: Start Docker container
  steps.push({ step: 'container', status: 'starting' });
  const containerStarted = await dockerUp();
  if (!containerStarted) {
    steps[1] = { step: 'container', status: 'error', error: 'Failed to start Docker container' };
    return NextResponse.json({ steps, success: false });
  }
  steps[1] = { step: 'container', status: 'started' };

  // Step 3: Wait for healthy
  steps.push({ step: 'health', status: 'waiting' });
  const healthy = await waitForContainer();
  steps[2] = { step: 'health', status: healthy ? 'ready' : 'timeout' };

  // Step 4: Detect API key
  steps.push({ step: 'apikey', status: 'detecting' });
  const apiKey = await detectApiKey();
  if (apiKey) {
    await setSetting('openwa_api_key', apiKey);
    steps[3] = { step: 'apikey', status: 'saved', key: `${apiKey.slice(0, 10)}...` };
  } else {
    steps[3] = { step: 'apikey', status: 'not_found', error: 'Could not extract API key from logs' };
  }

  // Step 5: Detect or start ngrok
  steps.push({ step: 'ngrok', status: 'detecting' });
  let ngrokUrl = await detectNgrokUrl();
  if (!ngrokUrl) {
    steps[4] = { step: 'ngrok', status: 'starting' };
    ngrokUrl = await startNgrok();
  }
  if (ngrokUrl) {
    await setSetting('openwa_api_url', ngrokUrl);
    steps[4] = { step: 'ngrok', status: 'ready', url: ngrokUrl || undefined };
  } else {
    steps[4] = { step: 'ngrok', status: 'not_found', error: 'Could not start ngrok. Set the URL manually in Settings.' };
  }

  // Step 6: Create & start session
  steps.push({ step: 'session', status: 'creating' });
  resetOpenwaConfig();
  clearSessionUuid();

  try {
    const config = await getOpenwaConfig();
    const sessionName = config.sessionName;
    const sessionsRes = await getSessions();
    const allSessions = Array.isArray(sessionsRes) ? sessionsRes as any[] : [];
    let ourSession = allSessions.find((s: any) => s.name === sessionName);

    if (!ourSession) {
      const created = await createSession(sessionName);
      if (!created.error) {
        ourSession = (created as any).data || created;
      }
    }

    if (ourSession) {
      const sessionId = ourSession.id || ourSession.sessionId;
      const isStarted = ourSession.status === 'started' || ourSession.status === 'qr_ready' || ourSession.status === 'ready' || ourSession.status === 'connected' || ourSession.status === 'active';
      if (!isStarted && sessionId) {
        await startSession(sessionId);
      }
      steps[5] = { step: 'session', status: 'ready', sessionId };
    } else {
      steps[5] = { step: 'session', status: 'error', error: 'Failed to create session' };
    }
  } catch (err: any) {
    steps[5] = { step: 'session', status: 'error', error: err.message };
  }

  // Step 7: Get QR
  steps.push({ step: 'qr', status: 'fetching' });
  try {
    const { getQR } = await import('@/lib/openwa');
    const qrRes = await getQR();
    const qrData = (qrRes as any).qrCode || (qrRes as any).qr || qrRes.data;
    const qrBase64 = typeof qrData === 'string'
      ? (qrData.startsWith('data:') ? qrData : `data:image/png;base64,${qrData}`)
      : null;
    steps[6] = { step: 'qr', status: qrBase64 ? 'ready' : 'not_ready', qr: qrBase64 || undefined };
  } catch {
    steps[6] = { step: 'qr', status: 'error', error: 'Failed to get QR' };
  }

  return NextResponse.json({ steps, success: true });
}

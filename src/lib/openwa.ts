const BASE_URL = process.env.OPENWA_API_URL || 'http://localhost:2785/api';
const API_KEY = process.env.OPENWA_API_KEY;
const SESSION_NAME = process.env.OPENWA_SESSION || 'kashmir360-bot';

let sessionUuid: string | null = null;

interface OpenWAResponse {
  success?: boolean;
  error?: string;
  data?: unknown;
}

async function request(method: string, path: string, body?: unknown): Promise<OpenWAResponse> {
  const url = `${BASE_URL}${path}`;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (API_KEY) {
    headers['X-API-Key'] = API_KEY;
  }
  try {
    const res = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      const text = await res.text();
      console.error(`[OpenWA] ${method} ${path} -> ${res.status}: ${text}`);
      return { error: `OpenWA returned ${res.status}` };
    }
    return await res.json();
  } catch (err) {
    console.error(`[OpenWA] Request failed: ${method} ${path}`, err);
    return { error: 'OpenWA unreachable' };
  }
}

async function resolveSessionUuid(): Promise<string | null> {
  if (sessionUuid) return sessionUuid;
  const res = await request('GET', '/sessions');
  if (res.error || !Array.isArray(res)) {
    console.error('[OpenWA] Failed to list sessions');
    return null;
  }
  const session = (res as any[]).find((s: any) => s.name === SESSION_NAME);
  if (!session) {
    console.error(`[OpenWA] Session "${SESSION_NAME}" not found`);
    return null;
  }
  sessionUuid = session.id;
  return sessionUuid;
}

function normalizePhone(phone: string): string {
  return phone.replace(/[^0-9]/g, '');
}

export async function sendText(phone: string, text: string): Promise<OpenWAResponse> {
  const uuid = await resolveSessionUuid();
  if (!uuid) return { error: 'Session not found' };
  const chatId = `${normalizePhone(phone)}@c.us`;
  return request('POST', `/sessions/${uuid}/messages/send-text`, { chatId, text });
}

export async function sendOtp(phone: string, otp: string): Promise<OpenWAResponse> {
  const message = `Your Kashmir360 OTP code is: ${otp}\nValid for 5 minutes.`;
  return sendText(phone, message);
}

export async function notifyLead(operatorPhone: string, operatorName: string, visitorName?: string, visitorPhone?: string, isAdmin = false): Promise<OpenWAResponse> {
  const prefix = isAdmin ? `*New Lead: ${operatorName}*` : `*New Inquiry on Kashmir360!*`;
  let message = `${prefix}\n\n`;
  if (!isAdmin) {
    message += `A visitor has contacted *${operatorName}*.\n\n`;
  }
  if (visitorName) {
    message += `Name: ${visitorName}\n`;
  }
  if (visitorPhone) {
    message += `Phone: ${visitorPhone}\n`;
  }
  message += `\nLogin to your dashboard to view details:\n${process.env.NEXT_PUBLIC_APP_URL || 'https://kashmir360.com'}${isAdmin ? '/admin' : '/portal'}`;
  const result = await sendText(operatorPhone, message);
  if (result.error) {
    throw new Error(result.error);
  }
  return result;
}

export async function getSessionStatus(): Promise<OpenWAResponse> {
  const uuid = await resolveSessionUuid();
  if (!uuid) return { error: 'Session not found' };
  return request('GET', `/sessions/${uuid}`);
}

export async function getQR(): Promise<OpenWAResponse> {
  const uuid = await resolveSessionUuid();
  if (!uuid) return { error: 'Session not found' };
  return request('GET', `/sessions/${uuid}/qr`);
}

export async function getSessions(): Promise<OpenWAResponse> {
  return request('GET', '/sessions');
}

export async function createSession(name: string): Promise<OpenWAResponse> {
  return request('POST', '/sessions', { name });
}

export async function startSession(uuid: string): Promise<OpenWAResponse> {
  return request('POST', `/sessions/${uuid}/start`);
}

export async function stopSession(uuid: string): Promise<OpenWAResponse> {
  return request('POST', `/sessions/${uuid}/stop`);
}

export function clearSessionUuid(): void {
  sessionUuid = null;
}

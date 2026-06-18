import { getOpenwaConfig } from '@/lib/settings';

let baseUrl = '';
let apiKey = '';
let sessionName = 'nadur-bot';
let configLoaded = false;

async function loadConfig() {
  if (configLoaded) return;
  const config = await getOpenwaConfig();
  baseUrl = config.apiUrl;
  apiKey = config.apiKey;
  sessionName = config.sessionName;
  configLoaded = true;
}

function resetConfig() {
  configLoaded = false;
  sessionUuid = null;
}

let sessionUuid: string | null = null;

interface OpenWAResponse {
  success?: boolean;
  error?: string;
  data?: unknown;
}

async function request(method: string, path: string, body?: unknown): Promise<OpenWAResponse> {
  await loadConfig();
  const url = `${baseUrl}${path}`;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (apiKey) {
    headers['X-API-Key'] = apiKey;
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
  const found = (res as any[]).find((s: any) => s.name === sessionName);
  if (!found) {
    console.error(`[OpenWA] Session "${sessionName}" not found`);
    return null;
  }
  sessionUuid = found.id;
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

export async function deleteSession(uuid: string): Promise<OpenWAResponse> {
  return request('DELETE', `/sessions/${uuid}`);
}

export function clearSessionUuid(): void {
  sessionUuid = null;
}

export function resetOpenwaConfig(): void {
  resetConfig();
}

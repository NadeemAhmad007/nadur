const BASE_URL = process.env.OPENWA_API_URL || 'http://localhost:2785/api';
const API_KEY = process.env.OPENWA_API_KEY;
const SESSION_NAME = process.env.OPENWA_SESSION || 'nadur-bot';

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

function normalizePhone(phone: string): string {
  return phone.replace(/[^0-9]/g, '');
}

export async function sendText(phone: string, text: string): Promise<OpenWAResponse> {
  const chatId = `${normalizePhone(phone)}@c.us`;
  return request('POST', `/sessions/${SESSION_NAME}/messages/send-text`, { chatId, text });
}

export async function sendOtp(phone: string, otp: string): Promise<OpenWAResponse> {
  const message = `Your Nadur OTP code is: ${otp}\nValid for 5 minutes.`;
  return sendText(phone, message);
}

export async function notifyLead(operatorPhone: string, operatorName: string, visitorName?: string): Promise<OpenWAResponse> {
  let message = `*New Inquiry on Nadurr!*\n\nYou have received a new lead from a visitor interested in your services.\n\n`;
  if (visitorName) {
    message += `From: ${visitorName}\n`;
  }
  message += `\nLogin to your dashboard to view details:\n${process.env.NEXT_PUBLIC_APP_URL || 'https://nadurr.com'}/portal`;
  return sendText(operatorPhone, message);
}

export async function getSessionStatus(): Promise<OpenWAResponse> {
  return request('GET', `/sessions/${SESSION_NAME}`);
}

export async function getQR(): Promise<OpenWAResponse> {
  return request('GET', `/sessions/${SESSION_NAME}/qr`);
}

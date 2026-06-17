'use client';

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/components/ui/toast';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Smartphone, Wifi, WifiOff, RefreshCw, Send, QrCode,
  CheckCircle2, XCircle, Loader2, MessageSquare, Phone,
  User, Terminal, Copy, Check, ExternalLink
} from 'lucide-react';

type ConnectionStatus = 'loading' | 'connected' | 'disconnected' | 'error' | 'unreachable';

interface StatusData {
  connected: boolean;
  sessionExists: boolean;
  sessionName: string;
  sessionId?: string;
  status?: string;
  phone?: string;
  pushname?: string;
  message?: string;
  error?: string;
}

export default function AdminWhatsAppPage() {
  const { toast } = useToast();
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('loading');
  const [statusData, setStatusData] = useState<StatusData | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [testPhone, setTestPhone] = useState('');
  const [testMessage, setTestMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [starting, setStarting] = useState(false);
  const [stopping, setStopping] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  const addLog = useCallback((msg: string) => {
    setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 50));
  }, []);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/whatsapp/status');
      const data: StatusData = await res.json();
      setStatusData(data);

      if (data.error) {
        const isUnreachable = (data.message || data.error).toLowerCase().includes('cannot reach') ||
          (data.message || data.error).toLowerCase().includes('unreachable');
        setConnectionStatus(isUnreachable ? 'unreachable' : 'error');
        addLog(`Error: ${data.message || data.error}`);
      } else if (data.connected) {
        setConnectionStatus('connected');
        addLog('WhatsApp connected');
      } else if (data.sessionExists) {
        setConnectionStatus('disconnected');
        addLog(`Session exists (${data.status}) but not connected`);
      } else {
        setConnectionStatus('disconnected');
        addLog('No session found');
      }
    } catch {
      setConnectionStatus('error');
      setStatusData({ connected: false, sessionExists: false, sessionName: '', message: 'Failed to fetch status' });
      addLog('Failed to reach server');
    }
  }, [addLog]);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 10000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  const fetchQR = async () => {
    setQrLoading(true);
    try {
      const res = await fetch('/api/admin/whatsapp/qr');
      const data = await res.json();

      if (data.error) {
        toast('error', 'Failed to get QR code', data.message);
        addLog(`QR error: ${data.message || data.error}`);
      } else if (data.qr) {
        setQrCode(data.qr);
        addLog('QR code retrieved — scan with WhatsApp');
        toast('info', 'QR code ready', 'Scan with WhatsApp to connect');
      } else {
        toast('error', 'No QR code returned');
        addLog('No QR code in response');
      }
    } catch {
      toast('error', 'Failed to get QR code', 'Cannot reach server');
    } finally {
      setQrLoading(false);
    }
  };

  const handleStart = async () => {
    setStarting(true);
    try {
      const res = await fetch('/api/admin/whatsapp/start', { method: 'POST' });
      const data = await res.json();

      if (data.error) {
        toast('error', 'Failed to start', data.message);
        addLog(`Start error: ${data.message || data.error}`);
      } else {
        toast('success', 'Session started', data.message);
        addLog('Session started — fetching QR');
        await fetchQR();
        await fetchStatus();
      }
    } catch {
      toast('error', 'Failed to start session');
    } finally {
      setStarting(false);
    }
  };

  const handleStop = async () => {
    setStopping(true);
    try {
      const res = await fetch('/api/admin/whatsapp/stop', { method: 'POST' });
      const data = await res.json();

      if (data.error) {
        toast('error', 'Failed to stop', data.message);
      } else {
        toast('info', 'Session stopped');
        addLog('Session stopped');
        setQrCode(null);
        await fetchStatus();
      }
    } catch {
      toast('error', 'Failed to stop session');
    } finally {
      setStopping(false);
    }
  };

  const handleTestSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testPhone || !testMessage) return;

    setSending(true);
    try {
      const res = await fetch('/api/admin/whatsapp/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: testPhone, message: testMessage }),
      });
      const data = await res.json();

      if (data.error) {
        toast('error', 'Failed to send', data.message);
        addLog(`Test send failed: ${data.message || data.error}`);
      } else {
        toast('success', 'Message sent', `To: ${testPhone}`);
        addLog(`Test message sent to ${testPhone}`);
        setTestPhone('');
        setTestMessage('');
      }
    } catch {
      toast('error', 'Failed to send test message');
    } finally {
      setSending(false);
    }
  };

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedCmd(id);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  const statusIcon = () => {
    switch (connectionStatus) {
      case 'connected': return <CheckCircle2 className="h-5 w-5 text-success" />;
      case 'disconnected': return <XCircle className="h-5 w-5 text-warning" />;
      case 'unreachable': return <WifiOff className="h-5 w-5 text-danger" />;
      case 'error': return <WifiOff className="h-5 w-5 text-danger" />;
      case 'loading': return <Loader2 className="h-5 w-5 text-muted-foreground animate-spin" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Smartphone className="h-6 w-6" />
            WhatsApp Integration
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your OpenWA WhatsApp bot connection
          </p>
        </div>
        <Badge
          variant={
            connectionStatus === 'connected' ? 'success' :
            connectionStatus === 'unreachable' ? 'danger' :
            connectionStatus === 'error' ? 'danger' :
            'default'
          }
          className="text-xs px-3 py-1.5 flex items-center gap-1.5"
        >
          {statusIcon()}
          {connectionStatus === 'connected' ? 'Connected' :
           connectionStatus === 'disconnected' ? 'Disconnected' :
           connectionStatus === 'unreachable' ? 'Server Offline' :
           connectionStatus === 'error' ? 'Error' : 'Checking...'}
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wifi className={`h-5 w-5 ${connectionStatus === 'connected' ? 'text-success' : 'text-muted-foreground'}`} />
                  <h2 className="text-lg font-semibold">Connection</h2>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchStatus}
                    disabled={connectionStatus === 'loading'}
                  >
                    <RefreshCw className={`h-4 w-4 mr-1 ${connectionStatus === 'loading' ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                  {connectionStatus === 'disconnected' && (
                    <Button size="sm" onClick={handleStart} disabled={starting}>
                      {starting ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <QrCode className="h-4 w-4 mr-1" />}
                      Connect
                    </Button>
                  )}
                  {connectionStatus === 'connected' && (
                    <Button variant="danger" size="sm" onClick={handleStop} disabled={stopping}>
                      {stopping ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <WifiOff className="h-4 w-4 mr-1" />}
                      Disconnect
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Terminal className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Session:</span>
                    <span className="font-medium">{statusData?.sessionName || '—'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Smartphone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Phone:</span>
                    <span className="font-medium">{statusData?.phone || '—'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Profile:</span>
                    <span className="font-medium">{statusData?.pushname || '—'}</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">Status:</span>
                    <Badge
                      variant={connectionStatus === 'connected' ? 'success' : 'default'}
                      className="text-xs"
                    >
                      {statusData?.status || 'unknown'}
                    </Badge>
                  </div>
                  {statusData?.message && (
                    <p className="text-xs text-muted-foreground">{statusData.message}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {connectionStatus === 'unreachable' && (
            <Card className="border-danger/30 bg-danger/5">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <WifiOff className="h-5 w-5 text-danger" />
                  <h2 className="text-lg font-semibold text-danger">OpenWA Server Not Running</h2>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  The OpenWA WhatsApp gateway is required for WhatsApp notifications. Start it with Docker:
                </p>

                <div className="space-y-2">
                  <p className="text-xs font-semibold text-foreground">1. Start the OpenWA Docker container:</p>
                  <div className="relative group">
                    <pre className="text-xs bg-muted p-3 rounded-lg overflow-x-auto font-mono">
                      docker compose -f docker-compose.openwa.yml up -d
                    </pre>
                    <button
                      onClick={() => copyToClipboard('docker compose -f docker-compose.openwa.yml up -d', 'cmd-up')}
                      className="absolute top-2 right-2 p-1.5 rounded-md bg-muted hover:bg-muted-foreground/10 transition-colors"
                    >
                      {copiedCmd === 'cmd-up' ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5 text-muted-foreground" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-semibold text-foreground">2. Get the auto-generated API key:</p>
                  <div className="relative group">
                    <pre className="text-xs bg-muted p-3 rounded-lg overflow-x-auto font-mono">
                      docker logs nadur-openwa 2&gt;&amp;1 | grep -o &apos;owa_k1_[a-f0-9]*&apos; | head -1
                    </pre>
                    <button
                      onClick={() => copyToClipboard('docker logs nadur-openwa 2>&1 | grep -o \'owa_k1_[a-f0-9]*\' | head -1', 'cmd-key')}
                      className="absolute top-2 right-2 p-1.5 rounded-md bg-muted hover:bg-muted-foreground/10 transition-colors"
                    >
                      {copiedCmd === 'cmd-key' ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5 text-muted-foreground" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-semibold text-foreground">3. Set the API key in your <code className="text-foreground">.env</code>:</p>
                  <div className="relative group">
                    <pre className="text-xs bg-muted p-3 rounded-lg overflow-x-auto font-mono">
                      OPENWA_API_KEY=owa_k1_your_key_here
                    </pre>
                    <button
                      onClick={() => copyToClipboard('OPENWA_API_KEY=owa_k1_your_key_here', 'cmd-env')}
                      className="absolute top-2 right-2 p-1.5 rounded-md bg-muted hover:bg-muted-foreground/10 transition-colors"
                    >
                      {copiedCmd === 'cmd-env' ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5 text-muted-foreground" />}
                    </button>
                  </div>
                </div>

                <div className="pt-2">
                  <Button size="sm" onClick={fetchStatus}>
                    <RefreshCw className="h-4 w-4 mr-1" />
                    Check Again
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {connectionStatus === 'disconnected' && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <QrCode className="h-5 w-5" />
                  <h2 className="text-lg font-semibold">QR Code</h2>
                  <Button variant="ghost" size="sm" onClick={fetchQR} disabled={qrLoading} className="ml-auto">
                    <RefreshCw className={`h-4 w-4 ${qrLoading ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center gap-4 py-6">
                  {qrLoading ? (
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Generating QR code...</p>
                    </div>
                  ) : qrCode ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={qrCode}
                        alt="WhatsApp QR Code"
                        className="w-64 h-64 border rounded-xl"
                      />
                      <p className="text-sm text-muted-foreground text-center max-w-sm">
                        Scan this QR code with WhatsApp on your phone to connect the bot.
                        Open WhatsApp {'>'} Linked Devices {'>'} Link a Device.
                      </p>
                    </>
                  ) : (
                    <div className="flex flex-col items-center gap-3">
                      <QrCode className="h-12 w-12 text-muted-foreground/50" />
                      <p className="text-sm text-muted-foreground">Click "Connect" to generate a QR code</p>
                      <Button onClick={handleStart} disabled={starting}>
                        {starting ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <QrCode className="h-4 w-4 mr-1" />}
                        Connect Now
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Send className="h-5 w-5" />
                <h2 className="text-lg font-semibold">Test Message</h2>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleTestSend} className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={testPhone}
                    onChange={(e) => setTestPhone(e.target.value)}
                    placeholder="+919876543210"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Message</label>
                  <textarea
                    value={testMessage}
                    onChange={(e) => setTestMessage(e.target.value)}
                    placeholder="Type a test message..."
                    rows={3}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                    required
                  />
                </div>
                <Button type="submit" disabled={sending || connectionStatus !== 'connected'}>
                  {sending ? (
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 mr-1" />
                  )}
                  {sending ? 'Sending...' : 'Send Test Message'}
                </Button>
                {connectionStatus !== 'connected' && (
                  <p className="text-xs text-warning mt-1">Connect WhatsApp first to send test messages.</p>
                )}
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                <h2 className="text-lg font-semibold">Activity Log</h2>
              </div>
            </CardHeader>
            <CardContent>
              {logs.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No activity yet</p>
              ) : (
                <div className="space-y-1 max-h-[400px] overflow-y-auto">
                  {logs.map((log, i) => (
                    <p key={i} className="text-xs font-mono text-muted-foreground leading-relaxed">
                      {log}
                    </p>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                <h2 className="text-lg font-semibold">Info</h2>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p className="text-muted-foreground">
                When connected, lead notifications are sent automatically to operators via WhatsApp.
              </p>
              <div className="pt-2 border-t border-border space-y-1">
                <p className="text-xs text-muted-foreground">
                  OpenWA runs in Docker on port 2785. Session data persists across restarts (Docker volume <code className="text-foreground">openwa-data</code>).
                </p>
                <p className="text-xs text-muted-foreground">
                  If the server is offline, follow the setup guide on this page to start it.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

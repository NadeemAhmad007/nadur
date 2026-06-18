'use client';

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/components/ui/toast';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  Smartphone, Wifi, WifiOff, RefreshCw, Send, QrCode,
  CheckCircle2, XCircle, Loader2, MessageSquare, Phone,
  User, Terminal, Copy, Check, ExternalLink, Settings,
  Play, StopCircle, Key, Globe, Save, TestTube, ArrowRight,
  Plug, ShieldCheck, Wand2, Network, Server, Bug
} from 'lucide-react';

type ConnectionStatus = 'loading' | 'connected' | 'disconnected' | 'error' | 'unreachable';
type Tab = 'connection' | 'settings';

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

interface SettingsData {
  openwa_api_url: string;
  openwa_api_key: string;
  openwa_api_key_present: boolean;
  openwa_session: string;
  has_db_key: boolean;
}

interface AutoStep {
  step: string;
  status: string;
  error?: string;
  url?: string;
  key?: string;
  qr?: string;
  sessionId?: string;
}

interface NgrokTunnel {
  url: string;
  target: string;
}

interface NgrokData {
  tunnels: NgrokTunnel[];
  count: number;
  has_openwa_tunnel: boolean;
}

type EnvType = 'checking' | 'local' | 'remote' | 'unknown';

export default function AdminWhatsAppPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<Tab>('connection');
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
  const [copied, setCopied] = useState<string | null>(null);

  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [editUrl, setEditUrl] = useState('');
  const [editKey, setEditKey] = useState('');
  const [editSession, setEditSession] = useState('');

  const [envType, setEnvType] = useState<EnvType>('checking');
  const [ngrokData, setNgrokData] = useState<NgrokData | null>(null);
  const [autoSteps, setAutoSteps] = useState<AutoStep[]>([]);
  const [autoRunning, setAutoRunning] = useState(false);

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

  const detectEnvironment = useCallback(async () => {
    setEnvType('checking');
    try {
      const res = await fetch('/api/admin/whatsapp/server/ngrok');
      if (res.ok) {
        const data: NgrokData = await res.json();
        setNgrokData(data);
        setEnvType(data.has_openwa_tunnel || data.count > 0 ? 'local' : 'remote');
        return;
      }
    } catch {}
    setEnvType('unknown');
  }, []);

  useEffect(() => {
    fetchStatus();
    detectEnvironment();
    const interval = setInterval(fetchStatus, 10000);
    return () => clearInterval(interval);
  }, [fetchStatus, detectEnvironment]);

  const fetchSettings = useCallback(async () => {
    setSettingsLoading(true);
    try {
      const res = await fetch('/api/admin/settings');
      const data: SettingsData = await res.json();
      setSettings(data);
      setEditUrl(data.openwa_api_url);
      setEditKey('');
      setEditSession(data.openwa_session);
    } catch {
      toast('error', 'Failed to load settings');
    } finally {
      setSettingsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (activeTab === 'settings') fetchSettings();
  }, [activeTab, fetchSettings]);

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
      toast('error', 'Failed to get QR code');
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

  const runAutoSetup = async () => {
    setAutoRunning(true);
    setAutoSteps([]);
    addLog('Starting Smart Setup...');
    try {
      const res = await fetch('/api/admin/whatsapp/auto-setup', { method: 'POST' });
      const data = await res.json();
      setAutoSteps(data.steps || []);

      if (data.needs_manual) {
        addLog('Smart Setup: Docker not available locally. Switch to Manual Setup.');
        setActiveTab('settings');
      } else if (data.success) {
        const qrStep = (data.steps || []).find((s: AutoStep) => s.step === 'qr');
        if (qrStep?.qr) {
          setQrCode(qrStep.qr);
          addLog('Smart Setup complete! QR code ready.');
          toast('success', 'Smart Setup complete', 'Scan the QR to connect WhatsApp');
        }
        await fetchStatus();
      }
    } catch (err: any) {
      addLog(`Smart Setup failed: ${err.message}`);
      toast('error', 'Smart Setup failed', err.message);
    } finally {
      setAutoRunning(false);
    }
  };

  const testConnection = async () => {
    setTestingConnection(true);
    try {
      const res = await fetch('/api/admin/whatsapp/status');
      const data = await res.json();
      if (data.error || data.message?.toLowerCase().includes('cannot reach')) {
        toast('error', 'Connection failed', data.message || 'Cannot reach OpenWA');
      } else {
        toast('success', 'Connection OK', data.message);
      }
    } catch {
      toast('error', 'Connection test failed');
    } finally {
      setTestingConnection(false);
    }
  };

  const saveSettings = async () => {
    setSavingSettings(true);
    try {
      const body: Record<string, string> = {
        openwa_api_url: editUrl,
        openwa_session: editSession,
      };
      if (editKey.trim()) body.openwa_api_key = editKey.trim();
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.error) {
        toast('error', 'Failed to save settings', data.error);
      } else {
        toast('success', 'Settings saved');
        setEditKey('');
        await fetchSettings();
        await fetchStatus();
      }
    } catch {
      toast('error', 'Failed to save settings');
    } finally {
      setSavingSettings(false);
    }
  };

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const autoFillNgrokUrl = () => {
    if (ngrokData?.tunnels?.[0]) {
      setEditUrl(ngrokData.tunnels[0].url);
      addLog(`Auto-filled ngrok URL: ${ngrokData.tunnels[0].url}`);
      toast('info', 'Ngrok URL filled', ngrokData.tunnels[0].url);
    }
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

  const stepIcon = (step: AutoStep) => {
    if (step.status === 'checking' || step.status === 'starting' || step.status === 'waiting' || step.status === 'detecting' || step.status === 'creating' || step.status === 'fetching') {
      return <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />;
    }
    if (step.status === 'available' || step.status === 'started' || step.status === 'ready' || step.status === 'saved') {
      return <CheckCircle2 className="h-3.5 w-3.5 text-success" />;
    }
    return <XCircle className="h-3.5 w-3.5 text-danger" />;
  };

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'connection', label: 'Connection', icon: <Smartphone className="h-4 w-4" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="h-4 w-4" /> },
  ];

  const stepLabels: Record<string, string> = {
    docker: 'Docker',
    container: 'Start container',
    health: 'Container health',
    apikey: 'API key',
    ngrok: 'Public URL (ngrok)',
    session: 'WhatsApp session',
    qr: 'QR code',
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
            Connect OpenWA WhatsApp gateway
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

      {/* Tab Navigation */}
      <div className="flex gap-1 border-b border-border">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'connection' && (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            {/* Connection Status Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wifi className={`h-5 w-5 ${connectionStatus === 'connected' ? 'text-success' : 'text-muted-foreground'}`} />
                    <h2 className="text-lg font-semibold">Connection</h2>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={fetchStatus} disabled={connectionStatus === 'loading'}>
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
                      <Badge variant={connectionStatus === 'connected' ? 'success' : 'default'} className="text-xs">
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

            {/* Smart Setup / QR Section */}
            {connectionStatus === 'unreachable' || connectionStatus === 'disconnected' ? (
              <Card className={connectionStatus === 'unreachable' ? 'border-primary/30 bg-primary/5' : ''}>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    {connectionStatus === 'unreachable' ? (
                      <Wand2 className="h-5 w-5 text-primary" />
                    ) : (
                      <QrCode className="h-5 w-5" />
                    )}
                    <h2 className="text-lg font-semibold">
                      {connectionStatus === 'unreachable' ? 'Setup' : 'QR Code'}
                    </h2>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">

                  {/* Smart Setup (when server unreachable) */}
                  {connectionStatus === 'unreachable' && (
                    <>
                      <p className="text-sm text-muted-foreground">
                        OpenWA server is not reachable. Choose your setup method:
                      </p>

                      <div className="grid gap-4 sm:grid-cols-2">
                        {/* Option 1: Auto (local) */}
                        <div className="border border-border rounded-xl p-4 space-y-3">
                          <div className="flex items-center gap-2">
                            <Server className="h-4 w-4 text-primary" />
                            <h3 className="text-sm font-semibold">Smart Setup</h3>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Auto-detects Docker + ngrok + API key on this machine. No terminal needed.
                          </p>
                          <Button
                            onClick={runAutoSetup}
                            disabled={autoRunning}
                            className="w-full gap-2"
                            size="sm"
                          >
                            {autoRunning ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Wand2 className="h-4 w-4" />
                            )}
                            {autoRunning ? 'Setting up...' : 'Run Smart Setup'}
                          </Button>
                        </div>

                        {/* Option 2: Manual */}
                        <div className="border border-border rounded-xl p-4 space-y-3">
                          <div className="flex items-center gap-2">
                            <Settings className="h-4 w-4 text-muted-foreground" />
                            <h3 className="text-sm font-semibold">Manual Setup</h3>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Enter your OpenWA public URL and API key in Settings.
                          </p>
                          <Button
                            variant="outline"
                            onClick={() => setActiveTab('settings')}
                            className="w-full gap-2"
                            size="sm"
                          >
                            <ArrowRight className="h-4 w-4" />
                            Go to Settings
                          </Button>
                        </div>
                      </div>

                      {/* Auto Setup Progress */}
                      {autoSteps.length > 0 && (
                        <div className="bg-muted rounded-lg p-4 space-y-2">
                          <p className="text-xs font-semibold text-foreground mb-2">Setup Progress</p>
                          {autoSteps.map((step, i) => (
                            <div key={i} className="flex items-center gap-2">
                              {stepIcon(step)}
                              <span className="text-xs">{stepLabels[step.step] || step.step}</span>
                              <span className={`text-xs ml-auto ${step.status === 'ready' || step.status === 'saved' ? 'text-success' : step.error ? 'text-danger' : 'text-muted-foreground'}`}>
                                {step.url ? step.url : step.key || step.status}
                              </span>
                            </div>
                          ))}
                          {autoSteps.some(s => s.step === 'qr' && s.qr) && (
                            <div className="flex justify-center pt-2">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={autoSteps.find(s => s.step === 'qr')?.qr || ''}
                                alt="QR Code"
                                className="w-48 h-48 border rounded-xl"
                              />
                            </div>
                          )}
                        </div>
                      )}

                      <Separator />

                      {/* Environment Indicator */}
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Network className="h-3 w-3" />
                        <span>Environment: </span>
                        {envType === 'checking' ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : envType === 'local' ? (
                          <Badge variant="success" className="text-[10px]">Local machine detected</Badge>
                        ) : (
                          <Badge variant="default" className="text-[10px]">Remote (manual URL needed)</Badge>
                        )}
                        {ngrokData?.tunnels?.[0] && (
                          <span className="ml-auto font-mono text-[10px] truncate max-w-[200px]">
                            {ngrokData.tunnels[0].url}
                          </span>
                        )}
                      </div>
                    </>
                  )}

                  {/* QR Code (when disconnected but server reachable) */}
                  {connectionStatus === 'disconnected' && (
                    <div className="flex flex-col items-center gap-4 py-6">
                      {qrLoading ? (
                        <div className="flex flex-col items-center gap-3">
                          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">Generating QR code...</p>
                        </div>
                      ) : qrCode ? (
                        <>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={qrCode} alt="WhatsApp QR Code" className="w-64 h-64 border rounded-xl" />
                          <p className="text-sm text-muted-foreground text-center max-w-sm">
                            Scan with WhatsApp {'>'} Linked Devices {'>'} Link a Device
                          </p>
                        </>
                      ) : (
                        <div className="flex flex-col items-center gap-3">
                          <QrCode className="h-12 w-12 text-muted-foreground/50" />
                          <p className="text-sm text-muted-foreground">Click Connect to generate QR code</p>
                          <Button onClick={handleStart} disabled={starting}>
                            {starting ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <QrCode className="h-4 w-4 mr-1" />}
                            Connect Now
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : null}

            {/* Test Message */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Send className="h-5 w-5" />
                  <h2 className="text-lg font-semibold">Test Message</h2>
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleTestSend} className="space-y-3">
                  <Input label="Phone" type="tel" value={testPhone} onChange={(e) => setTestPhone(e.target.value)} placeholder="+919876543210" required />
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">Message</label>
                    <textarea
                      value={testMessage}
                      onChange={(e) => setTestMessage(e.target.value)}
                      placeholder="Type a test message..."
                      rows={3}
                      className="flex min-h-[80px] w-full rounded-lg border border-input bg-card px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 transition-colors resize-y"
                      required
                    />
                  </div>
                  <Button type="submit" disabled={sending || connectionStatus !== 'connected'}>
                    {sending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Send className="h-4 w-4 mr-1" />}
                    {sending ? 'Sending...' : 'Send Test Message'}
                  </Button>
                  {connectionStatus !== 'connected' && (
                    <p className="text-xs text-warning mt-1">Connect WhatsApp first to send test messages.</p>
                  )}
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
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
                      <p key={i} className="text-xs font-mono text-muted-foreground leading-relaxed">{log}</p>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="max-w-2xl space-y-6">
          {/* OpenWA Configuration */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                <h2 className="text-lg font-semibold">OpenWA Configuration</h2>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Set the public URL of your OpenWA instance and the API key.
              </p>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-foreground">API URL</label>
                  {ngrokData?.tunnels?.[0] && (
                    <button onClick={autoFillNgrokUrl} className="text-xs text-primary hover:underline flex items-center gap-1">
                      <Copy className="h-3 w-3" />
                      Auto-fill ngrok URL
                    </button>
                  )}
                </div>
                <input
                  value={editUrl}
                  onChange={(e) => setEditUrl(e.target.value)}
                  placeholder="https://your-tunnel.ngrok-free.dev"
                  className="flex h-10 w-full rounded-lg border border-input bg-card px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
                />
                {ngrokData?.tunnels?.[0] && (
                  <p className="text-xs text-muted-foreground">
                    Detected: <code className="text-foreground">{ngrokData.tunnels[0].url}</code>
                  </p>
                )}
              </div>

              <Input
                label="API Key"
                type="password"
                value={editKey}
                onChange={(e) => setEditKey(e.target.value)}
                placeholder={settings?.openwa_api_key_present ? '•••••••• (leave blank to keep)' : 'Enter API key'}
                hint={settings?.has_db_key ? 'Stored in database' : settings?.openwa_api_key_present ? 'Using env var' : 'Not configured'}
              />

              <Input
                label="Session Name"
                value={editSession}
                onChange={(e) => setEditSession(e.target.value)}
                placeholder="nadur-bot"
              />

              <div className="flex gap-2 pt-2">
                <Button onClick={saveSettings} disabled={savingSettings} className="gap-2">
                  {savingSettings ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {savingSettings ? 'Saving...' : 'Save Settings'}
                </Button>
                <Button variant="outline" onClick={testConnection} disabled={testingConnection} className="gap-2">
                  {testingConnection ? <Loader2 className="h-4 w-4 animate-spin" /> : <TestTube className="h-4 w-4" />}
                  Test Connection
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Quick Reference */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                <h2 className="text-lg font-semibold">Your Webhook URL</h2>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                No ngrok needed for webhooks — your app&apos;s own URL handles them.
              </p>
              <div className="relative group">
                <pre className="text-xs bg-muted p-3 rounded-lg overflow-x-auto font-mono">
                  {typeof window !== 'undefined' ? `${window.location.origin}/api/whatsapp-webhook` : '...'}
                </pre>
                <button
                  onClick={() => copyToClipboard(
                    typeof window !== 'undefined' ? `${window.location.origin}/api/whatsapp-webhook` : '',
                    'webhook'
                  )}
                  className="absolute top-2 right-2 p-1.5 rounded-md"
                >
                  {copied === 'webhook' ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5 text-muted-foreground" />}
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

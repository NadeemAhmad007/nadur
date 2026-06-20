'use client';
import { useEffect, useRef, useState } from 'react';
import { signIn, signOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Mail, MessageCircle } from 'lucide-react';
import Link from 'next/link';

type Tab = 'email' | 'whatsapp';

export default function LoginPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [tab, setTab] = useState<Tab>('email');
  const [email, setEmail] = useState('');
  const [emailOtp, setEmailOtp] = useState('');
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [phone, setPhone] = useState('');
  const [phoneOtp, setPhoneOtp] = useState('');
  const [phoneOtpSent, setPhoneOtpSent] = useState(false);
  const [phoneCooldown, setPhoneCooldown] = useState(0);
  const [showForgotEmail, setShowForgotEmail] = useState(false);
  const [forgotPhone, setForgotPhone] = useState('');
  const [forgotResult, setForgotResult] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const signingOut = useRef(false);

  useEffect(() => {
    if (session?.user) {
      const sUser = session.user as unknown as Record<string, unknown>;
      if (sUser.is_admin) router.push('/admin');
      else if (sUser.operator_id) router.push('/portal');
      else if (status === 'authenticated' && !signingOut.current) {
        signingOut.current = true;
        signOut({ redirect: false });
      }
    }
  }, [session, status, router]);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (cooldown > 0) timer = setInterval(() => setCooldown(c => c - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (phoneCooldown > 0) timer = setInterval(() => setPhoneCooldown(c => c - 1), 1000);
    return () => clearInterval(timer);
  }, [phoneCooldown]);

  const sendEmailOtp = async () => {
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/auth/send-otp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
      const data = await res.json();
      if (data.sent) { setEmailOtpSent(true); setCooldown(60); }
      else { setError(data.error || 'Failed to send OTP'); if (data.useWhatsapp) setTab('whatsapp'); }
    } catch { setError('Network error'); }
    setLoading(false);
  };

  const verifyEmailOtp = async () => {
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/auth/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, otp: emailOtp }) });
      const data = await res.json();
      if (data.success) {
        const signInRes = await signIn('email-otp', { email, otp: emailOtp, redirect: false });
        if (signInRes?.error) {
          setError(`Login failed: ${signInRes.error}`);
        } else if (signInRes?.ok) {
          if (data.is_admin) router.push('/admin');
          else router.push('/portal');
          return;
        }
      } else setError(data.error || 'Verification failed');
    } catch { setError('Network error'); }
    setLoading(false);
  };

  const sendPhoneOtp = async () => {
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/auth/send-otp-whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (data.sent) { setPhoneOtpSent(true); setPhoneCooldown(60); }
      else setError(data.error || 'Failed to send OTP');
    } catch { setError('Network error'); }
    setLoading(false);
  };

  const verifyPhoneOtp = async () => {
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/auth/verify-whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp: phoneOtp }),
      });
      const data = await res.json();
      if (data.success) {
        const signInRes = await signIn('whatsapp-otp', { phone, otp: phoneOtp, redirect: false });
        if (signInRes?.error) {
          setError('Login failed. Check your phone number.');
        } else if (signInRes?.ok) {
          if (data.is_admin) router.push('/admin');
          else router.push('/portal');
          return;
        }
      } else {
        setError(data.error || 'Invalid OTP');
      }
    } catch { setError('Network error'); }
    setLoading(false);
  };

  const lookupEmail = async () => {
    setForgotLoading(true); setForgotResult('');
    try {
      await fetch('/api/auth/lookup-email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone: forgotPhone }) });
      setForgotResult('If this phone is linked to an account, instructions will be sent to the registered email.');
    } catch { setForgotResult('Something went wrong. Please try again.'); }
    setForgotLoading(false);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left — brand panel */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-primary to-primary-dark items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.05]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23FFFFFF' fill-opacity='0.15'%3E%3Cpath d='M50 50c0-5.523 4.477-10 10-10s10 4.477 10 10-4.477 10-10 10c0 5.523-4.477 10-10 10s-10-4.477-10-10 4.477-10 10-10z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '60px 60px'
        }} />
        <div className="relative text-center max-w-sm">
          <Link href="/">
            <img src="/logo.png" alt="Kasheer360" className="h-28 w-auto mx-auto brightness-0 invert" />
          </Link>
          <h1 className="mt-8 text-3xl font-display text-white font-normal leading-tight">
            Welcome back
          </h1>
          <p className="mt-3 text-white/70 text-sm leading-relaxed">
            Sign in to manage your listings, respond to enquiries, and grow your Kashmir tourism business.
          </p>
        </div>
      </div>

      {/* Right — form panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="lg:hidden text-center mb-8">
            <Link href="/" className="inline-flex flex-col items-center gap-3">
              <img src="/logo.png" alt="Kasheer360" className="h-28 w-auto object-contain" />
            </Link>
            <p className="text-sm text-muted-foreground mt-3">Sign in to your account</p>
          </div>

          <Card>
            <CardContent className="p-6">
              <div className="space-y-5">
                {/* Tabs */}
                <div className="flex rounded-lg bg-secondary p-1 gap-1">
                  <button
                    onClick={() => { setTab('email'); setError(''); }}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded text-sm font-medium transition-all ${
                      tab === 'email' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Mail className="h-4 w-4" /> Email
                  </button>
                  <button
                    onClick={() => { setTab('whatsapp'); setError(''); setShowForgotEmail(false); }}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded text-sm font-medium transition-all ${
                      tab === 'whatsapp' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <MessageCircle className="h-4 w-4" /> WhatsApp
                  </button>
                </div>

                <div className="space-y-4">
                  {tab === 'email' ? (
                    <>
                      {!emailOtpSent ? (
                        <>
                          <Input
                            label="Email address"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            disabled={loading}
                          />
                          <Button onClick={sendEmailOtp} className="w-full" disabled={!email || loading}>
                            {loading ? 'Sending...' : 'Send OTP'}
                          </Button>
                          <button
                            onClick={() => setShowForgotEmail(!showForgotEmail)}
                            className="text-xs text-muted-foreground hover:text-foreground underline w-full text-center"
                          >
                            Forgot your email?
                          </button>
                          {showForgotEmail && (
                            <div className="p-4 rounded-lg bg-secondary space-y-3">
                              <p className="text-xs text-muted-foreground">Enter your WhatsApp number and we will send an OTP to the registered email.</p>
                              <Input value={forgotPhone} onChange={(e) => setForgotPhone(e.target.value)} placeholder="+91 1234567890" />
                              <Button size="sm" onClick={lookupEmail} disabled={!forgotPhone || forgotLoading} className="w-full">
                                {forgotLoading ? 'Looking up...' : 'Send OTP to my email'}
                              </Button>
                              {forgotResult && <p className="text-xs text-muted-foreground">{forgotResult}</p>}
                            </div>
                          )}
                        </>
                      ) : (
                        <>
                          <p className="text-sm text-muted-foreground text-center">
                            Enter the 6-digit code sent to <span className="font-medium text-foreground">{email}</span>
                          </p>
                          <Input
                            type="text"
                            value={emailOtp}
                            onChange={(e) => setEmailOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            placeholder="000000"
                            maxLength={6}
                            autoFocus
                            className="text-center text-2xl tracking-[0.4em] font-mono"
                          />
                          <Button onClick={verifyEmailOtp} className="w-full" disabled={emailOtp.length !== 6 || loading}>
                            {loading ? 'Verifying...' : 'Verify'}
                          </Button>
                          <div className="flex items-center justify-between text-sm">
                            <button onClick={() => { setEmailOtpSent(false); setEmailOtp(''); setCooldown(0); }} className="text-muted-foreground hover:text-foreground transition-colors">
                              Change email
                            </button>
                            <button onClick={sendEmailOtp} disabled={cooldown > 0 || loading} className="text-accent font-medium disabled:text-muted-foreground transition-colors">
                              {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend'}
                            </button>
                          </div>
                        </>
                      )}
                    </>
                  ) : (
                    <>
                      {!phoneOtpSent ? (
                        <>
                          <Input
                            label="WhatsApp number"
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="+91 1234567890"
                            disabled={loading}
                          />
                          <Button onClick={sendPhoneOtp} className="w-full" disabled={!phone || loading}>
                            {loading ? 'Sending...' : 'Send OTP via WhatsApp'}
                          </Button>
                        </>
                      ) : (
                        <>
                          <p className="text-sm text-muted-foreground text-center">
                            Enter the 6-digit code sent to <span className="font-medium text-foreground">{phone}</span>
                          </p>
                          <Input
                            type="text"
                            value={phoneOtp}
                            onChange={(e) => setPhoneOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            placeholder="000000"
                            maxLength={6}
                            autoFocus
                            className="text-center text-2xl tracking-[0.4em] font-mono"
                          />
                          <Button onClick={verifyPhoneOtp} className="w-full" disabled={phoneOtp.length !== 6 || loading}>
                            {loading ? 'Verifying...' : 'Verify'}
                          </Button>
                          <div className="flex items-center justify-between text-sm">
                            <button onClick={() => { setPhoneOtpSent(false); setPhoneOtp(''); setPhoneCooldown(0); }} className="text-muted-foreground hover:text-foreground transition-colors">
                              Change number
                            </button>
                            <button onClick={sendPhoneOtp} disabled={phoneCooldown > 0 || loading} className="text-accent font-medium disabled:text-muted-foreground transition-colors">
                              {phoneCooldown > 0 ? `Resend in ${phoneCooldown}s` : 'Resend'}
                            </button>
                          </div>
                        </>
                      )}
                    </>
                  )}

                  {error && (
                    <div className="p-3.5 rounded-lg bg-danger/10 border border-danger/20">
                      <p className="text-xs text-danger font-medium">{error}</p>
                    </div>
                  )}
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border/60" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-card px-3 text-xs text-muted-foreground">or continue with</span>
                  </div>
                </div>

                <Button variant="outline" className="w-full gap-2.5 h-11 rounded-lg" onClick={() => signIn('google', { callbackUrl: '/auth/login' })}>
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Continue with Google
                </Button>

                <p className="text-center text-xs text-muted-foreground">
                  New to Kasheer360?{' '}
                  <Link href="/join" className="text-accent font-medium hover:underline">Register your business</Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

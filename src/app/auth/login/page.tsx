'use client';

import { useEffect, useRef, useState } from 'react';
import { signIn, signOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Mail, Phone } from 'lucide-react';
import Link from 'next/link';

type Tab = 'email' | 'whatsapp';

export default function LoginPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [tab, setTab] = useState<Tab>('email');

  // Email state
  const [email, setEmail] = useState('');
  const [emailOtp, setEmailOtp] = useState('');
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [backfilledOtp, setBackfilledOtp] = useState('');

  // WhatsApp state
  const [phone, setPhone] = useState('');

  // Forgot email state
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
      if (sUser.is_admin) {
        router.push('/admin');
      } else if (sUser.operator_id) {
        router.push('/portal');
      } else if (status === 'authenticated' && !signingOut.current) {
        signingOut.current = true;
        signOut({ redirect: false });
      }
    }
  }, [session, status, router]);

  useEffect(() => {
    if (cooldown > 0) {
      const t = setTimeout(() => setCooldown(c => c - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [cooldown]);

  // ---- EMAIL FLOW ----
  const sendEmailOtp = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.sent) {
        setEmailOtpSent(true);
        setCooldown(60);
        if (data.backfilledOtp) {
          setBackfilledOtp(data.backfilledOtp);
          setEmailOtp(data.backfilledOtp);
        }
      } else {
        setError(data.error || 'Failed to send OTP');
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const verifyEmailOtp = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: emailOtp }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || 'Invalid OTP');
        return;
      }

      const result = await signIn('email-otp', { email, otp: emailOtp, redirect: false });
      if (result?.error) {
        setError('No account found with this email');
      } else {
        router.push(result?.url || '/portal');
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  // ---- WHATSAPP FLOW ----
  const loginWithPhone = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await signIn('whatsapp-otp', { phone, redirect: false });
      if (result?.error) {
        setError('No operator found with this WhatsApp number. Register your business first.');
      } else {
        router.push(result?.url || '/portal');
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  // ---- FORGOT EMAIL ----
  const lookupEmail = async () => {
    setForgotLoading(true);
    setForgotResult('');
    try {
      const res = await fetch('/api/auth/lookup-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: forgotPhone }),
      });
      const data = await res.json();
      if (data.success) {
        setForgotResult('If this phone is linked to an account, an OTP has been sent to the registered email.');
      } else {
        setForgotResult(data.error || 'No account found with this phone number');
      }
    } catch {
      setForgotResult('Network error');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="border-b border-gray-200">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/" className="p-1"><ArrowLeft className="w-5 h-5" /></Link>
          <img src="/logo.png" alt="Nadurr" className="w-5 h-5" />
          <span className="font-semibold">Sign In</span>
        </div>
      </header>

      <main className="flex-1 max-w-sm mx-auto px-4 py-8 w-full">
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold">Welcome back</h2>
            <p className="text-sm text-gray-600 mt-1">Sign in to manage your Nadurr profile</p>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => { setTab('email'); setError(''); }}
              className={`flex-1 pb-2 text-sm font-medium border-b-2 transition-colors ${
                tab === 'email' ? 'border-[#2C5F8A] text-[#2C5F8A]' : 'border-transparent text-gray-500'
              }`}
            >
              <Mail className="w-4 h-4 inline mr-1.5" /> Email
            </button>
            <button
              onClick={() => { setTab('whatsapp'); setError(''); setShowForgotEmail(false); }}
              className={`flex-1 pb-2 text-sm font-medium border-b-2 transition-colors ${
                tab === 'whatsapp' ? 'border-[#2C5F8A] text-[#2C5F8A]' : 'border-transparent text-gray-500'
              }`}
            >
              <Phone className="w-4 h-4 inline mr-1.5" /> WhatsApp
            </button>
          </div>

          <div className="space-y-4">
            {tab === 'email' ? (
              <>
                <div>
                  <label className="text-sm font-medium">Email address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={emailOtpSent}
                    className="w-full mt-1 px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2C5F8A] disabled:bg-gray-100"
                    placeholder="you@example.com"
                  />
                </div>

                {!emailOtpSent ? (
                  <Button onClick={sendEmailOtp} className="w-full" disabled={!email || loading}>
                    {loading ? 'Sending...' : 'Send OTP via Email'}
                  </Button>
                ) : (
                  <>
                    <div>
                      <label className="text-sm font-medium">Enter OTP</label>
                      <input
                        type="text"
                        value={emailOtp}
                        onChange={(e) => setEmailOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        className="w-full mt-1 px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2C5F8A] tracking-widest text-center text-lg"
                        placeholder="000000"
                        maxLength={6}
                        autoFocus
                      />
                    </div>
                    <Button onClick={verifyEmailOtp} className="w-full" disabled={emailOtp.length !== 6 || loading}>
                      {loading ? 'Verifying...' : 'Verify OTP'}
                    </Button>
                    <div className="flex items-center justify-between text-sm">
                      <button
                        onClick={() => { setEmailOtpSent(false); setEmailOtp(''); setBackfilledOtp(''); setCooldown(0); }}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        Change email
                      </button>
                      <button
                        onClick={sendEmailOtp}
                        disabled={cooldown > 0 || loading}
                        className="text-[#2C5F8A] font-medium disabled:text-gray-400"
                      >
                        {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend OTP'}
                      </button>
                    </div>
                  </>
                )}

                <button
                  onClick={() => setShowForgotEmail(!showForgotEmail)}
                  className="text-xs text-gray-500 hover:text-gray-700 underline"
                >
                  Forgot your email?
                </button>

                {showForgotEmail && (
                  <div className="p-3 bg-gray-50 rounded-lg space-y-3">
                    <p className="text-xs text-gray-600">Enter your WhatsApp number and we will send an OTP to the email on file.</p>
                    <input
                      type="tel"
                      value={forgotPhone}
                      onChange={(e) => setForgotPhone(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      placeholder="+91 1234567890"
                    />
                    <Button size="sm" onClick={lookupEmail} disabled={!forgotPhone || forgotLoading} className="w-full">
                      {forgotLoading ? 'Looking up...' : 'Send OTP to my email'}
                    </Button>
                    {forgotResult && (
                      <p className="text-xs text-gray-600">{forgotResult}</p>
                    )}
                  </div>
                )}
              </>
            ) : (
              <>
                <div>
                  <label className="text-sm font-medium">WhatsApp number</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    className="w-full mt-1 px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2C5F8A]"
                    placeholder="+91 1234567890"
                  />
                </div>

                <Button onClick={loginWithPhone} className="w-full" disabled={!phone || loading}>
                  {loading ? 'Logging in...' : 'Login with WhatsApp'}
                </Button>

                <p className="text-xs text-gray-500 text-center">
                  Don&apos;t have an account?{' '}
                  <Link href="/join" className="text-[#2C5F8A] font-medium">Register your business</Link>
                </p>
              </>
            )}

            {error && <p className="text-sm text-red-600 text-center">{error}</p>}
            {backfilledOtp && (
              <p className="text-xs text-amber-600 text-center">
                Temporary email detected — OTP auto-filled. Set your real email in Edit Profile after logging in.
              </p>
            )}
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-2 text-gray-500">or continue with</span>
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={() => signIn('google')}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </Button>

          <p className="text-center text-xs text-gray-500 mt-4">
            New to Nadurr?{' '}
            <Link href="/join" className="text-[#2C5F8A] font-medium">Register your business</Link>
          </p>
        </div>
      </main>
    </div>
  );
}

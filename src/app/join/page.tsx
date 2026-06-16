'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Check, Upload } from 'lucide-react';
import Link from 'next/link';
import imageCompression from 'browser-image-compression';
import { parseGoogleMapsUrl } from '@/lib/location';
import { ghats } from '@/lib/ghats';

type TariffFields = {
  double_ep: string;
  double_cp: string;
  double_map: string;
  double_ap: string;
  single_ep: string;
  single_cp: string;
  single_map: string;
  single_ap: string;
  note: string;
};

const businessTypes = [
  'Handicraft Artisan', 'Handicraft Manufacturer', 'Handicraft Exporter',
  'Handicraft Wholesaler', 'Craft Store', 'Carpet Seller',
  'Carpet Manufacturer', 'Furniture Manufacturer', 'Furniture Store',
  'Fashion & Clothing Brand', 'Embroidery Workshop', 'Jewelry & Silverware',
  'Copperware & Metal Crafts', 'Gift & Souvenir Shop', 'Art Gallery',
  'Fabric & Textile Supplier', 'Wood Crafts & Woodworking',
  'Houseware & Home Decor', 'E-Commerce Seller', 'Market / Shopping Center',
  'Museum / Cultural Center', 'Other',
] as const;

const specialtiesList = [
  'Carpets & Rugs', 'Pashmina Shawls', 'Embroidery (Aari, Sozni, Crewel)',
  'Wooden Crafts', 'Walnut Wood Furniture', 'Copperware', 'Papier-Mâché',
  'Jewelry & Silverware', 'Home Decor', 'Fashion & Apparel', 'Gift Items',
  'Souvenirs', 'Textiles & Fabrics', 'Art & Paintings', 'Corporate Gifts',
  'Housewares', 'Other',
] as const;

const businessScales = [
  'Individual Artisan', 'Small Workshop (1–10 workers)',
  'Medium Manufacturer (11–50 workers)', 'Large Manufacturer (50+ workers)',
  'Retail Store', 'Export House', 'Wholesaler',
] as const;

type ShikaraFormFields = {
  full_name: string;
  mobile_number: string;
  whatsapp_number: string;
  shikara_number: string;
  ghat_number: string;
  operating_areas: string[];
  years_experience: string;
  languages: string[];
  services: string[];
  tour_duration: string;
  registered_shikara: string;
  registration_number: string;
};

type ArtisanFormFields = {
  business_type: string;
  specialties: string[];
  business_scale: string;
  owner_name: string;
  contact_number: string;
  whatsapp_number: string;
  email_address: string;
  website: string;
  gst_number: string;
  export_license: string;
  years_in_business: string;
  google_maps: string;
};

type FormData = {
  email: string;
  name: string;
  category: string;
  owner: string;
  address: string;
  hb_contact: string;
  hb_contact2: string;
  phone: string;
  grade: string;
  google_maps: string;
  short_desc: string;
  long_desc: string;
  pricing_note: string;
  photos: File[];
  tariffs: TariffFields;
  shikara: ShikaraFormFields;
  artisan: ArtisanFormFields;
  boat_ghat: string;
};

const defaultTariffs: TariffFields = {
  double_ep: '', double_cp: '', double_map: '', double_ap: '',
  single_ep: '', single_cp: '', single_map: '', single_ap: '',
  note: '',
};

const defaultArtisan: ArtisanFormFields = {
  business_type: '',
  specialties: [],
  business_scale: '',
  owner_name: '',
  contact_number: '',
  whatsapp_number: '',
  email_address: '',
  website: '',
  gst_number: '',
  export_license: '',
  years_in_business: '',
  google_maps: '',
};

const defaultShikara: ShikaraFormFields = {
  full_name: '',
  mobile_number: '',
  whatsapp_number: '',
  shikara_number: '',
  ghat_number: '',
  operating_areas: [],
  years_experience: '',
  languages: [],
  services: [],
  tour_duration: '',
  registered_shikara: '',
  registration_number: '',
};

const steps = ['Email', 'Business', 'Description', 'Photos', 'Review'];

export default function JoinPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpCooldown, setOtpCooldown] = useState(0);

  useEffect(() => {
    if (otpCooldown > 0) {
      const t = setTimeout(() => setOtpCooldown(c => c - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [otpCooldown]);
  const [form, setForm] = useState<FormData>({
    email: '',
    name: '',
    category: 'houseboat',
    owner: '',
    address: '',
    hb_contact: '',
    hb_contact2: '',
    phone: '',
    grade: 'Grade A',
    google_maps: '',
    short_desc: '',
    long_desc: '',
    pricing_note: '',
    photos: [],
    tariffs: { ...defaultTariffs },
    shikara: { ...defaultShikara },
    artisan: { ...defaultArtisan },
    boat_ghat: '',
  });

  useEffect(() => {
    if (session?.user?.email && !form.email) {
      const email = session.user.email;
      const name = session.user.name || '';
      setForm((prev) => ({ ...prev, email, name }));
    }
  }, [session]);

  const update = (field: keyof FormData, value: string | File[]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (form.photos.length + files.length > 5) return;

    const compressed = await Promise.all(
      files.map((f) => imageCompression(f, { maxSizeMB: 1, maxWidthOrHeight: 1920 }))
    );
    setForm((prev) => ({ ...prev, photos: [...prev.photos, ...compressed] }));
    const previews = compressed.map((f) => URL.createObjectURL(f));
    setPhotoPreviews((prev) => [...prev, ...previews]);
  };

  const removePhoto = (index: number) => {
    setForm((prev) => ({ ...prev, photos: prev.photos.filter((_, i) => i !== index) }));
    setPhotoPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const uploadedUrls: string[] = [];
      for (const file of form.photos) {
        const fd = new FormData();
        fd.append('file', file);
        fd.append('operator_id', 'temp');
        const res = await fetch('/api/upload/photo', { method: 'POST', body: fd });
        const data = await res.json();
        if (data.url) uploadedUrls.push(data.url);
      }

      const houseboatGhat = form.boat_ghat ? ghats.find((g) => g.name === form.boat_ghat) : null;
      const houseboatPayload = form.category === 'houseboat' ? {
        owner: form.owner || null,
        address: form.address || null,
        contact: form.hb_contact || null,
        contact2: form.hb_contact2 || null,
        email: form.email || null,
        grade: form.grade || null,
        google_maps: form.google_maps || null,
        boat_ghat: form.boat_ghat || null,
        boat_ghat_lat: houseboatGhat?.lat ?? null,
        boat_ghat_lng: houseboatGhat?.lng ?? null,
        tariffs: {
          double_ep: form.tariffs.double_ep || null,
          double_cp: form.tariffs.double_cp || null,
          double_map: form.tariffs.double_map || null,
          double_ap: form.tariffs.double_ap || null,
          single_ep: form.tariffs.single_ep || null,
          single_cp: form.tariffs.single_cp || null,
          single_map: form.tariffs.single_map || null,
          single_ap: form.tariffs.single_ap || null,
          note: form.tariffs.note || null,
        },
      } : null;

      const shikaraPayload = form.category === 'shikara' ? {
        full_name: form.shikara.full_name || null,
        mobile_number: form.shikara.mobile_number || null,
        whatsapp_number: form.shikara.whatsapp_number || null,
        shikara_number: form.shikara.shikara_number || null,
        ghat_number: form.shikara.ghat_number || null,
        operating_areas: form.shikara.operating_areas.length > 0 ? form.shikara.operating_areas : null,
        years_experience: form.shikara.years_experience || null,
        languages: form.shikara.languages.length > 0 ? form.shikara.languages : null,
        services: form.shikara.services.length > 0 ? form.shikara.services : null,
        tour_duration: form.shikara.tour_duration || null,
        registered_shikara: form.shikara.registered_shikara || null,
        registration_number: form.shikara.registration_number || null,
      } : null;
      const artisanPayload = form.category === 'artisan' ? {
        business_type: form.artisan.business_type || null,
        specialties: form.artisan.specialties.length > 0 ? form.artisan.specialties : null,
        business_scale: form.artisan.business_scale || null,
        owner_name: form.artisan.owner_name || null,
        contact_number: form.artisan.contact_number || null,
        whatsapp_number: form.artisan.whatsapp_number || null,
        email_address: form.artisan.email_address || null,
        website: form.artisan.website || null,
        gst_number: form.artisan.gst_number || null,
        export_license: form.artisan.export_license || null,
        years_in_business: form.artisan.years_in_business || null,
        google_maps: form.artisan.google_maps || null,
      } : null;
      const coords = form.google_maps ? parseGoogleMapsUrl(form.google_maps) : null;

      const res = await fetch('/api/operators', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          category: form.category,
          short_desc: form.short_desc,
          long_desc: form.long_desc,
          whatsapp: form.phone,
          email: form.email,
          pricing_note: form.pricing_note,
          photos: uploadedUrls,
          houseboat_details: houseboatPayload,
          shikara_details: shikaraPayload,
          artisan_details: artisanPayload,
          lat: coords?.lat ?? null,
          lng: coords?.lng ?? null,
        }),
      });

      if (res.ok) {
        router.push('/join?success=true');
      }
    } catch (e) {
      console.error('Submission failed', e);
    } finally {
      setLoading(false);
    }
  };

  if (typeof window !== 'undefined' && window.location.search.includes('success=true')) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-xl font-bold">Profile Submitted!</h1>
          <p className="text-sm text-gray-600 mt-2">
            Your profile is under review. We will WhatsApp you within 24 hours.
          </p>
          <Link href="/">
            <Button className="mt-6">Back to Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-200">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/" className="p-1">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <img src="/logo.png" alt="Nadurr" className="w-5 h-5" />
          <span className="font-semibold text-sm">Register Your Business</span>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="flex gap-1 mb-6">
          {steps.map((s, i) => (
            <div key={s} className={`flex-1 h-1 rounded-full ${i <= step ? 'bg-[#2C5F8A]' : 'bg-gray-200'}`} />
          ))}
        </div>

        {step === 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Email Address</h2>
            <p className="text-sm text-gray-600">This will be used for login. Verify it first.</p>
            <input
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => { update('email', e.target.value); setOtpVerified(false); setOtpSent(false); setOtp(''); }}
              disabled={otpSent && !otpVerified}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2C5F8A] disabled:bg-gray-100"
            />
            {!otpVerified && (
              <>
                {!otpSent ? (
                  <Button
                    onClick={async () => {
                      setOtpLoading(true);
                      setOtpError('');
                      try {
                        const res = await fetch('/api/auth/send-otp', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ email: form.email }),
                        });
                        const data = await res.json();
                        if (data.sent) {
                          setOtpSent(true);
                          setOtpCooldown(60);
                        } else {
                          setOtpError(data.error || 'Failed to send OTP');
                        }
                      } catch { setOtpError('Network error'); }
                      finally { setOtpLoading(false); }
                    }}
                    className="w-full"
                    disabled={!form.email || otpLoading}
                  >
                    {otpLoading ? 'Sending...' : 'Send OTP via Email'}
                  </Button>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium">Enter OTP</label>
                      <input
                        type="text"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        className="w-full mt-1 px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2C5F8A] tracking-widest text-center text-lg"
                        placeholder="000000"
                        maxLength={6}
                        autoFocus
                      />
                    </div>
                    <Button
                      onClick={async () => {
                        setOtpLoading(true);
                        setOtpError('');
                        try {
                          const res = await fetch('/api/auth/verify', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ email: form.email, otp, verifyOnly: true }),
                          });
                          const data = await res.json();
                          if (data.success) {
                            setOtpVerified(true);
                          } else {
                            setOtpError(data.error || 'Invalid OTP');
                          }
                        } catch { setOtpError('Network error'); }
                        finally { setOtpLoading(false); }
                      }}
                      className="w-full"
                      disabled={otp.length !== 6 || otpLoading}
                    >
                      {otpLoading ? 'Verifying...' : 'Verify OTP'}
                    </Button>
                    <div className="flex items-center justify-between text-sm">
                      <button
                        onClick={() => { setOtpSent(false); setOtp(''); setOtpCooldown(0); }}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        Change email
                      </button>
                      <button
                        onClick={async () => {
                          setOtpLoading(true);
                          setOtpError('');
                          try {
                            const res = await fetch('/api/auth/send-otp', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ email: form.email }),
                            });
                            const data = await res.json();
                            if (data.sent) {
                              setOtpCooldown(60);
                            }
                          } catch { /* ignore */ }
                          finally { setOtpLoading(false); }
                        }}
                        disabled={otpCooldown > 0 || otpLoading}
                        className="text-[#2C5F8A] font-medium disabled:text-gray-400"
                      >
                        {otpCooldown > 0 ? `Resend in ${otpCooldown}s` : 'Resend OTP'}
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
            {otpError && <p className="text-sm text-red-600 text-center">{otpError}</p>}
            {otpVerified && (
              <div className="flex items-center gap-2 text-green-600 text-sm">
                <Check className="w-4 h-4" />
                Email verified
              </div>
            )}
            <Button onClick={() => setStep(1)} className="w-full" disabled={!form.email || !otpVerified}>
              Next <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Business Basics</h2>
            <div>
              <label className="text-sm font-medium">Business Name</label>
              <input
                value={form.name}
                onChange={(e) => update('name', e.target.value)}
                className="w-full mt-1 px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2C5F8A]"
                maxLength={100}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Category</label>
              <select
                value={form.category}
                onChange={(e) => update('category', e.target.value)}
                className="w-full mt-1 px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2C5F8A] bg-white"
              >
                <option value="houseboat">Houseboat</option>
                <option value="shikara">Shikara Ride</option>
                <option value="artisan">Artisan & Craft</option>
                <option value="guide">Local Guide</option>
                <option value="vendor">Floating Vendor</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">WhatsApp / Contact Number</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => update('phone', e.target.value)}
                className="w-full mt-1 px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2C5F8A]"
                placeholder="+91 1234567890"
              />
            </div>
            {form.category === 'houseboat' && (
              <div className="space-y-3 p-3 bg-blue-50 rounded-lg">
                <h3 className="text-sm font-semibold">Houseboat Details</h3>
                <div>
                  <label className="text-xs font-medium">Owner Name</label>
                  <input value={form.owner} onChange={(e) => update('owner', e.target.value)} className="w-full mt-0.5 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="text-xs font-medium">Address</label>
                  <input value={form.address} onChange={(e) => update('address', e.target.value)} className="w-full mt-0.5 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="text-xs font-medium">Contact</label>
                  <input value={form.hb_contact} onChange={(e) => update('hb_contact', e.target.value)} className="w-full mt-0.5 px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="Alternate phone number" />
                </div>
                <div>
                  <label className="text-xs font-medium">Alternate Contact 2</label>
                  <input value={form.hb_contact2} onChange={(e) => update('hb_contact2', e.target.value)} className="w-full mt-0.5 px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="Another alternate phone number" />
                </div>
                <div>
                  <label className="text-xs font-medium">Email</label>
                  <input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} className="w-full mt-0.5 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="text-xs font-medium">Google Maps Link</label>
                  <input value={form.google_maps} onChange={(e) => update('google_maps', e.target.value)} className="w-full mt-0.5 px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="https://maps.google.com/?q=..." />
                </div>
                <div>
                  <label className="text-xs font-medium">Grade</label>
                  <select value={form.grade} onChange={(e) => update('grade', e.target.value)} className="w-full mt-0.5 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
                    <option value="Grade A">Grade A</option>
                    <option value="Grade B">Grade B</option>
                    <option value="Grade C">Grade C</option>
                    <option value="Grade D">Grade D</option>
                    <option value="Deluxe">Deluxe</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium">Shikara Ghat (used to arrive to boat) *</label>
                  <select value={form.boat_ghat} onChange={(e) => update('boat_ghat', e.target.value)} className="w-full mt-0.5 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
                    <option value="">Select Ghat</option>
                    {ghats.map((g) => (
                      <option key={g.name} value={g.name}>{g.name}</option>
                    ))}
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            )}
            {form.category === 'shikara' && (
              <div className="space-y-3 p-3 bg-blue-50 rounded-lg">
                <h3 className="text-sm font-semibold">Basic Register Info</h3>
                <div>
                  <label className="text-xs font-medium">Full Name *</label>
                  <input value={form.shikara.full_name} onChange={(e) => setForm((prev) => ({ ...prev, shikara: { ...prev.shikara, full_name: e.target.value } }))} className="w-full mt-0.5 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="text-xs font-medium">Mobile Number *</label>
                  <input value={form.shikara.mobile_number} onChange={(e) => setForm((prev) => ({ ...prev, shikara: { ...prev.shikara, mobile_number: e.target.value } }))} className="w-full mt-0.5 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="text-xs font-medium">WhatsApp Number *</label>
                  <input value={form.shikara.whatsapp_number} onChange={(e) => setForm((prev) => ({ ...prev, shikara: { ...prev.shikara, whatsapp_number: e.target.value } }))} className="w-full mt-0.5 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="text-xs font-medium">Shikara Number *</label>
                  <input value={form.shikara.shikara_number} onChange={(e) => setForm((prev) => ({ ...prev, shikara: { ...prev.shikara, shikara_number: e.target.value } }))} className="w-full mt-0.5 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="text-xs font-medium">Ghat Number / Location *</label>
                  <select value={form.shikara.ghat_number} onChange={(e) => setForm((prev) => ({ ...prev, shikara: { ...prev.shikara, ghat_number: e.target.value } }))} className="w-full mt-0.5 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
                    <option value="">Select Ghat</option>
                    {ghats.map((g) => (
                      <option key={g.name} value={g.name}>{g.name}</option>
                    ))}
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium">Operating Area</label>
                  <div className="mt-1 space-y-1">
                    {['Dal Lake', 'Nigeen Lake', 'Jhelum', 'Other'].map((area) => (
                      <label key={area} className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={form.shikara.operating_areas.includes(area)}
                          onChange={(e) => {
                            const areas = e.target.checked
                              ? [...form.shikara.operating_areas, area]
                              : form.shikara.operating_areas.filter((a) => a !== area);
                            setForm((prev) => ({ ...prev, shikara: { ...prev.shikara, operating_areas: areas } }));
                          }}
                          className="accent-[#2C5F8A]"
                        />
                        {area}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}
            {form.category === 'artisan' && (
              <div className="space-y-3 p-3 bg-blue-50 rounded-lg">
                <h3 className="text-sm font-semibold">Business Details</h3>
                <div>
                  <label className="text-xs font-medium">Select one</label>
                  <select value={form.artisan.business_type} onChange={(e) => setForm((prev) => ({ ...prev, artisan: { ...prev.artisan, business_type: e.target.value } }))} className="w-full mt-0.5 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
                    <option value="">Select Business Type</option>
                    {businessTypes.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium">Specialties (Select all that apply)</label>
                  <div className="mt-1 grid grid-cols-2 gap-x-3 gap-y-1">
                    {specialtiesList.map((s) => (
                      <label key={s} className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={form.artisan.specialties.includes(s)}
                          onChange={(e) => {
                            const arr = e.target.checked
                              ? [...form.artisan.specialties, s]
                              : form.artisan.specialties.filter((x) => x !== s);
                            setForm((prev) => ({ ...prev, artisan: { ...prev.artisan, specialties: arr } }));
                          }}
                          className="accent-[#2C5F8A]"
                        />
                        {s}
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium">What best describes your business?</label>
                  <div className="mt-1 space-y-1">
                    {businessScales.map((s) => (
                      <label key={s} className="flex items-center gap-2 text-sm">
                        <input
                          type="radio"
                          name="business_scale"
                          value={s}
                          checked={form.artisan.business_scale === s}
                          onChange={(e) => setForm((prev) => ({ ...prev, artisan: { ...prev.artisan, business_scale: e.target.value } }))}
                          className="accent-[#2C5F8A]"
                        />
                        {s}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div>
              <label className="text-sm font-medium">Short Description (max 500 chars)</label>
              <textarea
                value={form.short_desc}
                onChange={(e) => update('short_desc', e.target.value)}
                className="w-full mt-1 px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2C5F8A]"
                rows={3}
                maxLength={500}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(0)} className="flex-1">
                <ArrowLeft className="w-4 h-4 mr-1" /> Back
              </Button>
              <Button onClick={() => setStep(2)} className="flex-1" disabled={!form.name || (form.category === 'houseboat' && !form.boat_ghat) || (form.category === 'shikara' && !form.shikara.ghat_number)}>
                Next <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">About Your Business</h2>
            <div>
              <label className="text-sm font-medium">Detailed Description (max 2000 chars)</label>
              <textarea
                value={form.long_desc}
                onChange={(e) => update('long_desc', e.target.value)}
                className="w-full mt-1 px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2C5F8A]"
                rows={5}
                maxLength={2000}
                placeholder="Tell tourists about your story, what to expect, tips..."
              />
            </div>
            <div>
              <label className="text-sm font-medium">Pricing Note</label>
              <input
                value={form.pricing_note}
                onChange={(e) => update('pricing_note', e.target.value)}
                className="w-full mt-1 px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2C5F8A]"
                placeholder={form.category === 'shikara' ? 'e.g. ₹500/hour, contact for actual offers' : 'e.g. ₹2000/night/room, contact for actual offers'}
                maxLength={300}
              />
            </div>
            {form.category === 'shikara' && (
              <div className="space-y-3 p-3 bg-blue-50 rounded-lg">
                <h3 className="text-sm font-semibold">Section 2: About You</h3>
                <div>
                  <label className="text-xs font-medium">Years of Experience</label>
                  <input value={form.shikara.years_experience} onChange={(e) => setForm((prev) => ({ ...prev, shikara: { ...prev.shikara, years_experience: e.target.value } }))} className="w-full mt-0.5 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="text-xs font-medium">Languages Spoken</label>
                  <div className="mt-1 space-y-1">
                    {['Kashmiri', 'Urdu', 'Hindi', 'English', 'Arabic', 'French', 'German', 'Other'].map((lang) => (
                      <label key={lang} className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={form.shikara.languages.includes(lang)}
                          onChange={(e) => {
                            const langs = e.target.checked
                              ? [...form.shikara.languages, lang]
                              : form.shikara.languages.filter((l) => l !== lang);
                            setForm((prev) => ({ ...prev, shikara: { ...prev.shikara, languages: langs } }));
                          }}
                          className="accent-[#2C5F8A]"
                        />
                        {lang}
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium">Services</label>
                  <div className="mt-1 space-y-1">
                    {['Dal Lake Ride', 'Sunrise Tour', 'Sunset Tour', 'Floating Market Tour', 'Photography Tour', 'Bird Watching Tour', 'Shopping Tour', 'Custom Tours'].map((svc) => (
                      <label key={svc} className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={form.shikara.services.includes(svc)}
                          onChange={(e) => {
                            const svcs = e.target.checked
                              ? [...form.shikara.services, svc]
                              : form.shikara.services.filter((s) => s !== svc);
                            setForm((prev) => ({ ...prev, shikara: { ...prev.shikara, services: svcs } }));
                          }}
                          className="accent-[#2C5F8A]"
                        />
                        {svc}
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium">Typical Tour Duration</label>
                  <select value={form.shikara.tour_duration} onChange={(e) => setForm((prev) => ({ ...prev, shikara: { ...prev.shikara, tour_duration: e.target.value } }))} className="w-full mt-0.5 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
                    <option value="">Select Duration</option>
                    <option value="1 Hour">1 Hour</option>
                    <option value="2 Hours">2 Hours</option>
                    <option value="Half Day">Half Day</option>
                    <option value="Full Day">Full Day</option>
                    <option value="Flexible">Flexible</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium">Do you have a registered Shikara?</label>
                  <div className="mt-1 flex gap-4">
                    {['Yes', 'No'].map((opt) => (
                      <label key={opt} className="flex items-center gap-2 text-sm">
                        <input
                          type="radio"
                          name="registered_shikara"
                          value={opt}
                          checked={form.shikara.registered_shikara === opt}
                          onChange={(e) => setForm((prev) => ({ ...prev, shikara: { ...prev.shikara, registered_shikara: e.target.value } }))}
                          className="accent-[#2C5F8A]"
                        />
                        {opt}
                      </label>
                    ))}
                  </div>
                </div>
                {form.shikara.registered_shikara === 'Yes' && (
                  <div>
                    <label className="text-xs font-medium">Registration Number (if available)</label>
                    <input value={form.shikara.registration_number} onChange={(e) => setForm((prev) => ({ ...prev, shikara: { ...prev.shikara, registration_number: e.target.value } }))} className="w-full mt-0.5 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                  </div>
                )}
              </div>
            )}
            {form.category === 'artisan' && (
              <div className="space-y-3 p-3 bg-blue-50 rounded-lg">
                <h3 className="text-sm font-semibold">Owner Information</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium">Owner Name</label>
                    <input value={form.artisan.owner_name} onChange={(e) => setForm((prev) => ({ ...prev, artisan: { ...prev.artisan, owner_name: e.target.value } }))} className="w-full mt-0.5 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                  </div>
                  <div>
                    <label className="text-xs font-medium">Contact Number</label>
                    <input value={form.artisan.contact_number} onChange={(e) => setForm((prev) => ({ ...prev, artisan: { ...prev.artisan, contact_number: e.target.value } }))} className="w-full mt-0.5 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                  </div>
                  <div>
                    <label className="text-xs font-medium">WhatsApp Number</label>
                    <input value={form.artisan.whatsapp_number} onChange={(e) => setForm((prev) => ({ ...prev, artisan: { ...prev.artisan, whatsapp_number: e.target.value } }))} className="w-full mt-0.5 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                  </div>
                  <div>
                    <label className="text-xs font-medium">Email Address</label>
                    <input type="email" value={form.artisan.email_address} onChange={(e) => setForm((prev) => ({ ...prev, artisan: { ...prev.artisan, email_address: e.target.value } }))} className="w-full mt-0.5 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                  </div>
                  <div>
                    <label className="text-xs font-medium">Website (Optional)</label>
                    <input value={form.artisan.website} onChange={(e) => setForm((prev) => ({ ...prev, artisan: { ...prev.artisan, website: e.target.value } }))} className="w-full mt-0.5 px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="https://" />
                  </div>
                  <div>
                    <label className="text-xs font-medium">GST Number (Optional)</label>
                    <input value={form.artisan.gst_number} onChange={(e) => setForm((prev) => ({ ...prev, artisan: { ...prev.artisan, gst_number: e.target.value } }))} className="w-full mt-0.5 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                  </div>
                  <div>
                    <label className="text-xs font-medium">Export License Number (Optional)</label>
                    <input value={form.artisan.export_license} onChange={(e) => setForm((prev) => ({ ...prev, artisan: { ...prev.artisan, export_license: e.target.value } }))} className="w-full mt-0.5 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                  </div>
                  <div>
                    <label className="text-xs font-medium">Years in Business</label>
                    <input value={form.artisan.years_in_business} onChange={(e) => setForm((prev) => ({ ...prev, artisan: { ...prev.artisan, years_in_business: e.target.value } }))} className="w-full mt-0.5 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium">Google Map Link</label>
                  <input value={form.artisan.google_maps} onChange={(e) => setForm((prev) => ({ ...prev, artisan: { ...prev.artisan, google_maps: e.target.value } }))} className="w-full mt-0.5 px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="https://maps.google.com/?q=..." />
                </div>
              </div>
            )}
            {form.category === 'houseboat' && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold">Houseboat Tariffs (₹)</h3>
                <p className="text-xs text-gray-500">EP=Room only, CP=+Breakfast, MAP=+Breakfast&Dinner, AP=+Breakfast,Lunch&Dinner</p>
                <div className="grid grid-cols-2 gap-3">
                  {([
                    ['double_ep', 'Double Bed (EP)'],
                    ['double_cp', 'Double Bed (CP)'],
                    ['double_map', 'Double Bed (MAP)'],
                    ['double_ap', 'Double Bed (AP)'],
                    ['single_ep', 'Single Bed (EP)'],
                    ['single_cp', 'Single Bed (CP)'],
                    ['single_map', 'Single Bed (MAP)'],
                    ['single_ap', 'Single Bed (AP)'],
                  ] as const).map(([key, label]) => (
                    <div key={key}>
                      <label className="text-xs text-gray-500">{label}</label>
                      <input
                        value={(form.tariffs as any)[key]}
                        onChange={(e) => setForm((prev) => ({ ...prev, tariffs: { ...prev.tariffs, [key]: e.target.value } }))}
                        className="w-full mt-0.5 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2C5F8A]"
                        placeholder="₹"
                      />
                    </div>
                  ))}
                </div>
                  <div>
                    <label className="text-xs text-gray-500">Tariff Note</label>
                    <textarea
                      value={form.tariffs.note}
                      onChange={(e) => setForm((prev) => ({ ...prev, tariffs: { ...prev.tariffs, note: e.target.value } }))}
                      className="w-full mt-0.5 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2C5F8A]"
                      rows={3}
                      placeholder="Children below 5 yrs FREE. Heating charges extra in winter @ ₹600/room/day"
                    />
                  </div>
              </div>
            )}
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                <ArrowLeft className="w-4 h-4 mr-1" /> Back
              </Button>
              <Button onClick={() => setStep(3)} className="flex-1">
                Next <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Photos</h2>
            <p className="text-sm text-gray-600">Upload 1-5 photos (max 5MB each)</p>
            <div className="grid grid-cols-3 gap-2">
              {photoPreviews.map((preview, i) => (
                <div key={i} className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
                  <img src={preview} alt="" className="w-full h-full object-cover" />
                  <button
                    onClick={() => removePhoto(i)}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs"
                  >
                    x
                  </button>
                </div>
              ))}
              {form.photos.length < 5 && (
                <label className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-[#2C5F8A]">
                  <Upload className="w-6 h-6 text-gray-400" />
                  <span className="text-xs text-gray-500 mt-1">Add photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                <ArrowLeft className="w-4 h-4 mr-1" /> Back
              </Button>
              <Button onClick={() => setStep(4)} className="flex-1" disabled={form.photos.length === 0}>
                Next <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Review & Submit</h2>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
              <p><strong>Name:</strong> {form.name}</p>
              <p><strong>Category:</strong> {form.category}</p>
              <p><strong>WhatsApp:</strong> {form.phone}</p>
              {form.short_desc && <p><strong>Short:</strong> {form.short_desc}</p>}
              {form.pricing_note && <p><strong>Pricing:</strong> {form.pricing_note}</p>}
              {form.category === 'houseboat' && (
                <>
                  <div>
                    <strong>Owner:</strong> {form.owner || '—'}
                  </div>
                  <div>
                    <strong>Address:</strong> {form.address || '—'}
                  </div>
                  <div>
                    <strong>Contact:</strong> {form.hb_contact || '—'}
                  </div>
                  <div>
                    <strong>Contact 2:</strong> {form.hb_contact2 || '—'}
                  </div>
                  <div>
                    <strong>Email:</strong> {form.email || '—'}
                  </div>
                  <div>
                    <strong>Grade:</strong> {form.grade || '—'}
                  </div>
                  {form.boat_ghat && <div><strong>Boat Ghat:</strong> {form.boat_ghat} — {ghats.find((g) => g.name === form.boat_ghat) ? `${ghats.find((g) => g.name === form.boat_ghat)!.lat}, ${ghats.find((g) => g.name === form.boat_ghat)!.lng}` : ''}</div>}
                  {form.google_maps && (
                    <div>
                      <strong>Maps:</strong> <a href={form.google_maps} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline text-xs">{form.google_maps}</a>
                    </div>
                  )}
                  <div>
                    <strong>Tariffs:</strong>
                    <div className="grid grid-cols-2 gap-1 mt-1 text-xs">
                      {Object.entries(form.tariffs).filter(([k, v]) => k !== 'note' && v).map(([k, v]) => (
                        <span key={k}>{k.replace('_', ' ')}: ₹{v}</span>
                      ))}
                    </div>
                    {form.tariffs.note && <p className="text-xs text-gray-500 mt-1">{form.tariffs.note}</p>}
                  </div>
                </>
              )}
              {form.category === 'shikara' && (
                <>
                  <div><strong>Full Name:</strong> {form.shikara.full_name || '—'}</div>
                  <div><strong>Mobile:</strong> {form.shikara.mobile_number || '—'}</div>
                  <div><strong>WhatsApp:</strong> {form.shikara.whatsapp_number || '—'}</div>
                  <div><strong>Shikara No.:</strong> {form.shikara.shikara_number || '—'}</div>
                  <div><strong>Ghat:</strong> {form.shikara.ghat_number || '—'}</div>
                  {form.shikara.operating_areas.length > 0 && <div><strong>Areas:</strong> {form.shikara.operating_areas.join(', ')}</div>}
                  {form.shikara.years_experience && <div><strong>Experience:</strong> {form.shikara.years_experience} years</div>}
                  {form.shikara.languages.length > 0 && <div><strong>Languages:</strong> {form.shikara.languages.join(', ')}</div>}
                  {form.shikara.services.length > 0 && <div><strong>Services:</strong> {form.shikara.services.join(', ')}</div>}
                  {form.shikara.tour_duration && <div><strong>Duration:</strong> {form.shikara.tour_duration}</div>}
                  {form.shikara.registered_shikara && <div><strong>Registered Shikara:</strong> {form.shikara.registered_shikara}{form.shikara.registration_number ? ` (${form.shikara.registration_number})` : ''}</div>}
                </>
              )}
              {form.category === 'artisan' && (
                <>
                  <div><strong>Business Type:</strong> {form.artisan.business_type || '—'}</div>
                  {form.artisan.specialties.length > 0 && <div><strong>Specialties:</strong> {form.artisan.specialties.join(', ')}</div>}
                  {form.artisan.business_scale && <div><strong>Scale:</strong> {form.artisan.business_scale}</div>}
                  <div><strong>Owner:</strong> {form.artisan.owner_name || '—'}</div>
                  <div><strong>Contact:</strong> {form.artisan.contact_number || '—'}</div>
                  <div><strong>WhatsApp:</strong> {form.artisan.whatsapp_number || '—'}</div>
                  <div><strong>Email:</strong> {form.artisan.email_address || '—'}</div>
                  {form.artisan.website && <div><strong>Website:</strong> {form.artisan.website}</div>}
                  {form.artisan.gst_number && <div><strong>GST:</strong> {form.artisan.gst_number}</div>}
                  {form.artisan.export_license && <div><strong>Export License:</strong> {form.artisan.export_license}</div>}
                  {form.artisan.years_in_business && <div><strong>Years in Business:</strong> {form.artisan.years_in_business}</div>}
                </>
              )}
              <p><strong>Photos:</strong> {form.photos.length} uploaded</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(3)} className="flex-1">
                <ArrowLeft className="w-4 h-4 mr-1" /> Back
              </Button>
              <Button onClick={handleSubmit} className="flex-1" disabled={loading}>
                {loading ? 'Submitting...' : 'Submit for Review'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

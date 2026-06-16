'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Save, Upload, X, Check } from 'lucide-react';
import Link from 'next/link';
import imageCompression from 'browser-image-compression';
import { parseGoogleMapsUrl } from '@/lib/location';
import { ghats } from '@/lib/ghats';

const businessTypes = [
  'Handicraft Artisan', 'Handicraft Manufacturer', 'Handicraft Exporter',
  'Handicraft Wholesaler', 'Craft Store', 'Carpet Seller',
  'Carpet Manufacturer', 'Furniture Manufacturer', 'Furniture Store',
  'Fashion & Clothing Brand', 'Embroidery Workshop', 'Jewelry & Silverware',
  'Copperware & Metal Crafts', 'Gift & Souvenir Shop', 'Art Gallery',
  'Fabric & Textile Supplier', 'Wood Crafts & Woodworking',
  'Houseware & Home Decor', 'E-Commerce Seller', 'Market / Shopping Center',
  'Museum / Cultural Center', 'Other',
];

const specialtiesList = [
  'Carpets & Rugs', 'Pashmina Shawls', 'Embroidery (Aari, Sozni, Crewel)',
  'Wooden Crafts', 'Walnut Wood Furniture', 'Copperware', 'Papier-Mâché',
  'Jewelry & Silverware', 'Home Decor', 'Fashion & Apparel', 'Gift Items',
  'Souvenirs', 'Textiles & Fabrics', 'Art & Paintings', 'Corporate Gifts',
  'Housewares', 'Other',
];

const businessScales = [
  'Individual Artisan', 'Small Workshop (1–10 workers)',
  'Medium Manufacturer (11–50 workers)', 'Large Manufacturer (50+ workers)',
  'Retail Store', 'Export House', 'Wholesaler',
];

export default function EditProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [operator, setOperator] = useState<any>(null);
  const [form, setForm] = useState<any>({});
  const [photos, setPhotos] = useState<string[]>([]);
  const [newPhotos, setNewPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [emailOtp, setEmailOtp] = useState('');
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [emailOtpLoading, setEmailOtpLoading] = useState(false);
  const [emailOtpError, setEmailOtpError] = useState('');
  const [emailOtpCooldown, setEmailOtpCooldown] = useState(0);

  useEffect(() => {
    if (emailOtpCooldown > 0) {
      const t = setTimeout(() => setEmailOtpCooldown(c => c - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [emailOtpCooldown]);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/login');
  }, [status, router]);

  useEffect(() => {
    const sUser = session?.user as Record<string, unknown> | undefined;
    const email = session?.user?.email;
    const operatorId = sUser?.operator_id as string | undefined;

    const fetchOperator = (query: string) =>
      fetch(`/api/operators?${query}`)
        .then((r) => r.json())
        .then(({ data }) => {
          const op = data[0];
          if (op) {
            setOperator(op);
            setPhotos(op.photos || []);
            const hd = op.houseboat_details || {};
            const sd = op.shikara_details || {};
            const ad = op.artisan_details || {};
            setForm({
              name: op.name,
              short_desc: op.short_desc || '',
              long_desc: op.long_desc || '',
              pricing_note: op.pricing_note || '',
              whatsapp: op.whatsapp,
              operatorEmail: op.email || '',
              tariffs: op.tariffs || {},
              owner: hd.owner || '',
              address: hd.address || '',
              hb_contact: hd.contact || '',
              hb_contact2: hd.contact2 || '',
              email: hd.email || '',
              grade: hd.grade || 'Grade A',
              google_maps: hd.google_maps || '',
              boat_ghat: hd.boat_ghat || '',
              full_name: sd.full_name || '',
              mobile_number: sd.mobile_number || '',
              whatsapp_number: sd.whatsapp_number || '',
              shikara_number: sd.shikara_number || '',
              ghat_number: sd.ghat_number || '',
              operating_areas: sd.operating_areas || [],
              years_experience: sd.years_experience || '',
              languages: sd.languages || [],
              services: sd.services || [],
              tour_duration: sd.tour_duration || '',
              registered_shikara: sd.registered_shikara || '',
              registration_number: sd.registration_number || '',
              business_type: ad.business_type || '',
              specialties: ad.specialties || [],
              business_scale: ad.business_scale || '',
              owner_name: ad.owner_name || '',
              contact_number: ad.contact_number || '',
              artisan_whatsapp: ad.whatsapp_number || '',
              email_address: ad.email_address || '',
              website: ad.website || '',
              gst_number: ad.gst_number || '',
              export_license: ad.export_license || '',
              years_in_business: ad.years_in_business || '',
              artisan_google_maps: ad.google_maps || '',
            });
          }
        });

    if (email) {
      fetchOperator(`email=${email}`);
    } else if (operatorId) {
      fetchOperator(`id=${operatorId}`);
    }
  }, [session]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (photos.length + newPhotos.length + files.length > 5) return;
    const compressed = await Promise.all(
      files.map((f) => imageCompression(f, { maxSizeMB: 1, maxWidthOrHeight: 1920 }))
    );
    setNewPhotos((prev) => [...prev, ...compressed]);
    const previews = compressed.map((f) => URL.createObjectURL(f));
    setPhotoPreviews((prev) => [...prev, ...previews]);
  };

  const removeExisting = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const removeNew = (index: number) => {
    setNewPhotos((prev) => prev.filter((_, i) => i !== index));
    setPhotoPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!operator) return;
    setSaving(true);
    try {
      let allPhotos = [...photos];
      for (const file of newPhotos) {
        const fd = new FormData();
        fd.append('file', file);
        const res = await fetch('/api/upload/photo', { method: 'POST', body: fd });
        const data = await res.json();
        if (data.url) allPhotos.push(data.url);
      }
      const houseboatGhat = form.boat_ghat ? ghats.find((g: any) => g.name === form.boat_ghat) : null;
      const houseboatPayload = operator.category === 'houseboat' ? {
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
      } : undefined;
      const shikaraPayload = operator.category === 'shikara' ? {
        full_name: form.full_name || null,
        mobile_number: form.mobile_number || null,
        whatsapp_number: form.whatsapp_number || null,
        shikara_number: form.shikara_number || null,
        ghat_number: form.ghat_number || null,
        operating_areas: form.operating_areas || null,
        years_experience: form.years_experience || null,
        languages: form.languages || null,
        services: form.services || null,
        tour_duration: form.tour_duration || null,
        registered_shikara: form.registered_shikara || null,
        registration_number: form.registration_number || null,
      } : undefined;
      const artisanPayload = operator.category === 'artisan' ? {
        business_type: form.business_type || null,
        specialties: form.specialties || null,
        business_scale: form.business_scale || null,
        owner_name: form.owner_name || null,
        contact_number: form.contact_number || null,
        whatsapp_number: form.artisan_whatsapp || null,
        email_address: form.email_address || null,
        website: form.website || null,
        gst_number: form.gst_number || null,
        export_license: form.export_license || null,
        years_in_business: form.years_in_business || null,
        google_maps: form.artisan_google_maps || null,
      } : undefined;
      const coords = form.google_maps ? parseGoogleMapsUrl(form.google_maps) : null;

      await fetch(`/api/operators/${operator.slug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          short_desc: form.short_desc,
          long_desc: form.long_desc,
          pricing_note: form.pricing_note,
          email: form.operatorEmail || null,
          whatsapp: form.whatsapp,
          tariffs: form.tariffs,
          photos: allPhotos,
          houseboat_details: houseboatPayload,
          shikara_details: shikaraPayload,
          artisan_details: artisanPayload,
          lat: coords?.lat ?? null,
          lng: coords?.lng ?? null,
        }),
      });
      router.push('/portal');
    } catch (e) {
      console.error('Save failed', e);
    } finally {
      setSaving(false);
    }
  };

  if (!operator) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-2 border-[#2C5F8A] border-t-transparent rounded-full" />
    </div>;
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-200">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/portal" className="p-1">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <img src="/logo.png" alt="Nadurr" className="w-5 h-5" />
          <h1 className="text-lg font-semibold">Edit Profile</h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-4 space-y-4">
        <div>
          <label className="text-sm font-medium">Business Name</label>
          <input
            value={form.name || ''}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full mt-1 px-4 py-3 border border-gray-300 rounded-lg text-sm"
            maxLength={100}
          />
        </div>

        <div>
          <label className="text-sm font-medium">Short Description</label>
          <textarea
            value={form.short_desc || ''}
            onChange={(e) => setForm({ ...form, short_desc: e.target.value })}
            className="w-full mt-1 px-4 py-3 border border-gray-300 rounded-lg text-sm"
            rows={3}
            maxLength={500}
          />
        </div>

        <div>
          <label className="text-sm font-medium">Detailed Description</label>
          <textarea
            value={form.long_desc || ''}
            onChange={(e) => setForm({ ...form, long_desc: e.target.value })}
            className="w-full mt-1 px-4 py-3 border border-gray-300 rounded-lg text-sm"
            rows={5}
            maxLength={2000}
          />
        </div>

        <div>
          <label className="text-sm font-medium">Pricing Note</label>
          <input
            value={form.pricing_note || ''}
            onChange={(e) => setForm({ ...form, pricing_note: e.target.value })}
            className="w-full mt-1 px-4 py-3 border border-gray-300 rounded-lg text-sm"
            maxLength={300}
            placeholder="e.g. ₹2000/night/room, contact for actual offers"
          />
        </div>

        <div>
          <label className="text-sm font-medium">Email (used for login)</label>
          <div className="flex gap-2 mt-1">
            <input
              type="email"
              value={form.operatorEmail || ''}
              onChange={(e) => {
                setForm({ ...form, operatorEmail: e.target.value });
                setEmailOtpSent(false);
                setEmailOtp('');
                setEmailOtpError('');
              }}
              disabled={emailOtpSent}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2C5F8A] disabled:bg-gray-100"
              placeholder="you@example.com"
            />
            {operator.verified && form.operatorEmail === operator.email ? (
              <span className="flex items-center gap-1 px-3 text-sm text-green-600">
                <Check className="w-4 h-4" /> Verified
              </span>
            ) : !emailOtpSent ? (
              <Button
                size="sm"
                variant="outline"
                className="shrink-0"
                disabled={!form.operatorEmail || emailOtpLoading}
                onClick={async () => {
                  setEmailOtpLoading(true);
                  setEmailOtpError('');
                  try {
                    const res = await fetch('/api/auth/send-otp', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ email: form.operatorEmail }),
                    });
                    const data = await res.json();
                    if (data.sent) {
                      setEmailOtpSent(true);
                      setEmailOtpCooldown(60);
                    } else {
                      setEmailOtpError(data.error || 'Failed to send OTP');
                    }
                  } catch { setEmailOtpError('Network error'); }
                  finally { setEmailOtpLoading(false); }
                }}
              >
                {emailOtpLoading ? 'Sending...' : 'Send OTP'}
              </Button>
            ) : null}
          </div>
          {emailOtpSent && (
            <div className="flex gap-2 mt-2">
              <input
                type="text"
                value={emailOtp}
                onChange={(e) => setEmailOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="w-32 px-4 py-3 border border-gray-300 rounded-lg text-sm text-center tracking-widest text-lg"
                placeholder="000000"
                maxLength={6}
                autoFocus
              />
              <Button
                size="sm"
                onClick={async () => {
                  setEmailOtpLoading(true);
                  setEmailOtpError('');
                  try {
                    const res = await fetch('/api/auth/verify-email', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ email: form.operatorEmail, otp: emailOtp, operatorId: operator.id }),
                    });
                    const data = await res.json();
                    if (data.success) {
                      setOperator({ ...operator, email: form.operatorEmail, verified: true });
                      setEmailOtpSent(false);
                      setEmailOtp('');
                    } else {
                      setEmailOtpError(data.error || 'Invalid OTP');
                    }
                  } catch { setEmailOtpError('Network error'); }
                  finally { setEmailOtpLoading(false); }
                }}
                disabled={emailOtp.length !== 6 || emailOtpLoading}
              >
                {emailOtpLoading ? 'Verifying...' : 'Verify'}
              </Button>
              <button
                onClick={() => { setEmailOtpSent(false); setEmailOtp(''); setEmailOtpError(''); }}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>
            </div>
          )}
          {emailOtpError && <p className="text-xs text-red-600 mt-1">{emailOtpError}</p>}
          {!operator.verified && !emailOtpSent && (
            <p className="text-xs text-gray-500 mt-1">
              Enter your email and click Send OTP to verify it. Your profile is unverified until email is confirmed.
            </p>
          )}
        </div>

        <div>
          <label className="text-sm font-medium">WhatsApp Number</label>
          <input
            value={form.whatsapp || ''}
            onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
            className="w-full mt-1 px-4 py-3 border border-gray-300 rounded-lg text-sm"
          />
        </div>

        {operator.category === 'houseboat' && (
          <>
            <div className="space-y-3 p-3 bg-blue-50 rounded-lg">
              <h3 className="text-sm font-semibold">Houseboat Details</h3>
              <div>
                <label className="text-xs font-medium">Owner Name</label>
                <input value={form.owner || ''} onChange={(e) => setForm({ ...form, owner: e.target.value })} className="w-full mt-0.5 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium">Address</label>
                <input value={form.address || ''} onChange={(e) => setForm({ ...form, address: e.target.value })} className="w-full mt-0.5 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium">Contact</label>
                <input value={form.hb_contact || ''} onChange={(e) => setForm({ ...form, hb_contact: e.target.value })} className="w-full mt-0.5 px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="Alternate phone number" />
              </div>
              <div>
                <label className="text-xs font-medium">Alternate Contact 2</label>
                <input value={form.hb_contact2 || ''} onChange={(e) => setForm({ ...form, hb_contact2: e.target.value })} className="w-full mt-0.5 px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="Another alternate phone number" />
              </div>
              <div>
                <label className="text-xs font-medium">Email</label>
                <input type="email" value={form.email || ''} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full mt-0.5 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium">Google Maps Link</label>
                <input value={form.google_maps || ''} onChange={(e) => setForm({ ...form, google_maps: e.target.value })} className="w-full mt-0.5 px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="https://maps.google.com/?q=..." />
              </div>
              <div>
                <label className="text-xs font-medium">Grade</label>
                <select value={form.grade || 'Grade A'} onChange={(e) => setForm({ ...form, grade: e.target.value })} className="w-full mt-0.5 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
                  <option value="Grade A">Grade A</option>
                  <option value="Grade B">Grade B</option>
                  <option value="Grade C">Grade C</option>
                  <option value="Grade D">Grade D</option>
                  <option value="Deluxe">Deluxe</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium">Shikara Ghat (used to arrive to boat)</label>
                <select value={form.boat_ghat || ''} onChange={(e) => setForm({ ...form, boat_ghat: e.target.value })} className="w-full mt-0.5 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
                  <option value="">Select Ghat</option>
                  {ghats.map((g) => (
                    <option key={g.name} value={g.name}>{g.name}</option>
                  ))}
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
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
                    value={form.tariffs?.[key] || ''}
                    onChange={(e) => setForm({ ...form, tariffs: { ...form.tariffs, [key]: e.target.value } })}
                    className="w-full mt-0.5 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    placeholder="₹"
                  />
                </div>
              ))}
            </div>
            <div>
              <label className="text-xs text-gray-500">Tariff Note</label>
              <textarea
                value={form.tariffs?.note || ''}
                onChange={(e) => setForm({ ...form, tariffs: { ...form.tariffs, note: e.target.value } })}
                className="w-full mt-0.5 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                rows={3}
                placeholder="Children below 5 yrs FREE. Heating charges extra in winter @ ₹600/room/day"
              />
            </div>
          </div>
          </>
        )}

        {operator.category === 'shikara' && (
          <>
            <div className="space-y-3 p-3 bg-blue-50 rounded-lg">
              <h3 className="text-sm font-semibold">Basic Register Info</h3>
              <div>
                <label className="text-xs font-medium">Full Name *</label>
                <input value={form.full_name || ''} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className="w-full mt-0.5 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium">Mobile Number *</label>
                <input value={form.mobile_number || ''} onChange={(e) => setForm({ ...form, mobile_number: e.target.value })} className="w-full mt-0.5 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium">WhatsApp Number *</label>
                <input value={form.whatsapp_number || ''} onChange={(e) => setForm({ ...form, whatsapp_number: e.target.value })} className="w-full mt-0.5 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium">Shikara Number *</label>
                <input value={form.shikara_number || ''} onChange={(e) => setForm({ ...form, shikara_number: e.target.value })} className="w-full mt-0.5 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium">Ghat Number / Location</label>
                <select value={form.ghat_number || ''} onChange={(e) => setForm({ ...form, ghat_number: e.target.value })} className="w-full mt-0.5 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
                  <option value="">Select Ghat</option>
                  {ghats.map((g: any) => (
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
                        checked={(form.operating_areas || []).includes(area)}
                        onChange={(e) => {
                          const areas = e.target.checked
                            ? [...(form.operating_areas || []), area]
                            : (form.operating_areas || []).filter((a: string) => a !== area);
                          setForm({ ...form, operating_areas: areas });
                        }}
                        className="accent-[#2C5F8A]"
                      />
                      {area}
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="space-y-3 p-3 bg-blue-50 rounded-lg">
              <h3 className="text-sm font-semibold">About You</h3>
              <div>
                <label className="text-xs font-medium">Years of Experience</label>
                <input value={form.years_experience || ''} onChange={(e) => setForm({ ...form, years_experience: e.target.value })} className="w-full mt-0.5 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium">Languages Spoken</label>
                <div className="mt-1 space-y-1">
                  {['Kashmiri', 'Urdu', 'Hindi', 'English', 'Arabic', 'French', 'German', 'Other'].map((lang) => (
                    <label key={lang} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={(form.languages || []).includes(lang)}
                        onChange={(e) => {
                          const langs = e.target.checked
                            ? [...(form.languages || []), lang]
                            : (form.languages || []).filter((l: string) => l !== lang);
                          setForm({ ...form, languages: langs });
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
                        checked={(form.services || []).includes(svc)}
                        onChange={(e) => {
                          const svcs = e.target.checked
                            ? [...(form.services || []), svc]
                            : (form.services || []).filter((s: string) => s !== svc);
                          setForm({ ...form, services: svcs });
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
                <select value={form.tour_duration || ''} onChange={(e) => setForm({ ...form, tour_duration: e.target.value })} className="w-full mt-0.5 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
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
                        checked={form.registered_shikara === opt}
                        onChange={(e) => setForm({ ...form, registered_shikara: e.target.value })}
                        className="accent-[#2C5F8A]"
                      />
                      {opt}
                    </label>
                  ))}
                </div>
              </div>
              {form.registered_shikara === 'Yes' && (
                <div>
                  <label className="text-xs font-medium">Registration Number (if available)</label>
                  <input value={form.registration_number || ''} onChange={(e) => setForm({ ...form, registration_number: e.target.value })} className="w-full mt-0.5 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                </div>
              )}
            </div>
          </>
        )}

        {operator.category === 'artisan' && (
          <>
            <div className="space-y-3 p-3 bg-blue-50 rounded-lg">
              <h3 className="text-sm font-semibold">Business Details</h3>
              <div>
                <label className="text-xs font-medium">Select one</label>
                <select value={form.business_type || ''} onChange={(e) => setForm({ ...form, business_type: e.target.value })} className="w-full mt-0.5 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
                  <option value="">Select Business Type</option>
                  {businessTypes.map((t: any) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium">Specialties (Select all that apply)</label>
                <div className="mt-1 grid grid-cols-2 gap-x-3 gap-y-1">
                  {specialtiesList.map((s: any) => (
                    <label key={s} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={(form.specialties || []).includes(s)}
                        onChange={(e) => {
                          const arr = e.target.checked
                            ? [...(form.specialties || []), s]
                            : (form.specialties || []).filter((x: string) => x !== s);
                          setForm({ ...form, specialties: arr });
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
                  {businessScales.map((s: any) => (
                    <label key={s} className="flex items-center gap-2 text-sm">
                      <input
                        type="radio"
                        name="business_scale"
                        value={s}
                        checked={form.business_scale === s}
                        onChange={(e) => setForm({ ...form, business_scale: e.target.value })}
                        className="accent-[#2C5F8A]"
                      />
                      {s}
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="space-y-3 p-3 bg-blue-50 rounded-lg">
              <h3 className="text-sm font-semibold">Owner Information</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium">Owner Name</label>
                  <input value={form.owner_name || ''} onChange={(e) => setForm({ ...form, owner_name: e.target.value })} className="w-full mt-0.5 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="text-xs font-medium">Contact Number</label>
                  <input value={form.contact_number || ''} onChange={(e) => setForm({ ...form, contact_number: e.target.value })} className="w-full mt-0.5 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="text-xs font-medium">WhatsApp Number</label>
                  <input value={form.artisan_whatsapp || ''} onChange={(e) => setForm({ ...form, artisan_whatsapp: e.target.value })} className="w-full mt-0.5 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="text-xs font-medium">Email Address</label>
                  <input type="email" value={form.email_address || ''} onChange={(e) => setForm({ ...form, email_address: e.target.value })} className="w-full mt-0.5 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="text-xs font-medium">Website (Optional)</label>
                  <input value={form.website || ''} onChange={(e) => setForm({ ...form, website: e.target.value })} className="w-full mt-0.5 px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="https://" />
                </div>
                <div>
                  <label className="text-xs font-medium">GST Number (Optional)</label>
                  <input value={form.gst_number || ''} onChange={(e) => setForm({ ...form, gst_number: e.target.value })} className="w-full mt-0.5 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="text-xs font-medium">Export License Number (Optional)</label>
                  <input value={form.export_license || ''} onChange={(e) => setForm({ ...form, export_license: e.target.value })} className="w-full mt-0.5 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="text-xs font-medium">Years in Business</label>
                  <input value={form.years_in_business || ''} onChange={(e) => setForm({ ...form, years_in_business: e.target.value })} className="w-full mt-0.5 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium">Google Map Link</label>
                <input value={form.artisan_google_maps || ''} onChange={(e) => setForm({ ...form, artisan_google_maps: e.target.value })} className="w-full mt-0.5 px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="https://maps.google.com/?q=..." />
              </div>
            </div>
          </>
        )}

        <div>
          <label className="text-sm font-medium">Photos (max 5)</label>
          <div className="grid grid-cols-3 gap-2 mt-1">
            {photos.map((url, i) => (
              <div key={`existing-${i}`} className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
                <img src={url} alt="" className="w-full h-full object-cover" />
                <button onClick={() => removeExisting(i)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            {photoPreviews.map((preview, i) => (
              <div key={`new-${i}`} className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
                <img src={preview} alt="" className="w-full h-full object-cover" />
                <button onClick={() => removeNew(i)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            {photos.length + newPhotos.length < 5 && (
              <label className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-[#2C5F8A]">
                <Upload className="w-6 h-6 text-gray-400" />
                <span className="text-xs text-gray-500 mt-1">Add photo</span>
                <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
              </label>
            )}
          </div>
        </div>

        <p className="text-xs text-gray-500">
          Changing photos will reset status to pending (requires admin re-approval).
        </p>

        <Button onClick={handleSave} className="w-full gap-2" disabled={saving}>
          <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </main>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Save, Upload, X, Check, AlertCircle } from 'lucide-react';
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
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
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

    const fetchOperator = async (query: string) => {
      setFetchError(null);
      try {
        const r = await fetch(`/api/operators?${query}`);
        if (!r.ok) {
          setFetchError(`Failed to load profile (${r.status})`);
          return;
        }
        const { data } = await r.json();
        const op = data[0];
        if (op) {
          setOperator(op);
          setPhotos(op.photos || []);
          const hd = op.houseboat_details || {};
          const sd = op.shikara_details || {};
          const ad = op.artisan_details || {};
          const ac = op.accommodation_details || {};
          const gd = op.guide_details || {};
          const vd = op.vendor_details || {};
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
            hb_total_rooms: hd.total_rooms || '',
            hb_capacity: hd.capacity || '',
            hb_room_types: hd.room_types || [],
            hb_amenities: hd.amenities || [],
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
            price_per_ride: sd.price_per_ride || '',
            price_per_hour: sd.price_per_hour || '',
            price_note: sd.price_note || '',
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
            acc_owner_name: ac.owner_name || '',
            acc_manager_name: ac.manager_name || '',
            acc_contact: ac.contact || '',
            acc_email: ac.email || '',
            acc_address: ac.address || '',
            acc_google_maps: ac.google_maps || '',
            acc_total_rooms: ac.total_rooms || '',
            acc_room_types: ac.room_types || [],
            acc_pricing_single: ac.pricing_single || '',
            acc_pricing_double: ac.pricing_double || '',
            acc_amenities: ac.amenities || [],
            acc_meals_included: ac.meals_included || [],
            acc_check_in: ac.check_in || '',
            acc_check_out: ac.check_out || '',
            acc_languages: ac.languages || [],
            acc_nearby_attractions: ac.nearby_attractions || '',
            guide_full_name: gd.full_name || '',
            guide_contact_number: gd.contact_number || '',
            guide_whatsapp_number: gd.whatsapp_number || '',
            guide_email: gd.email || '',
            guide_languages: gd.languages || [],
            guide_specialties: gd.specialties || [],
            guide_years_experience: gd.years_experience || '',
            guide_certification: gd.certification || '',
            guide_operating_areas: gd.operating_areas || [],
            guide_google_maps: gd.google_maps || '',
            vendor_business_name: vd.business_name || '',
            vendor_owner_name: vd.owner_name || '',
            vendor_contact_number: vd.contact_number || '',
            vendor_whatsapp_number: vd.whatsapp_number || '',
            vendor_email: vd.email || '',
            vendor_business_type: vd.business_type || '',
            vendor_specialties: vd.specialties || [],
            vendor_operating_areas: vd.operating_areas || [],
            vendor_google_maps: vd.google_maps || '',
          });
        }
      } catch {
        setFetchError('Network error — please check your connection');
      }
    };

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
    setSaveError(null);
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
        total_rooms: form.hb_total_rooms || null,
        capacity: form.hb_capacity || null,
        room_types: form.hb_room_types || null,
        amenities: form.hb_amenities || null,
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
        price_per_ride: form.price_per_ride || null,
        price_per_hour: form.price_per_hour || null,
        price_note: form.price_note || null,
      } : undefined;
      const taxiPayload = operator.category === 'taxi' ? {
        driver_name: form.driver_name || null,
        vehicle_type: form.vehicle_type || null,
        vehicle_model: form.vehicle_model || null,
        registration_number: form.registration_number || null,
        operating_areas: form.operating_areas || null,
        languages: form.languages || null,
        tour_types: form.tour_types || null,
        price_per_km: form.price_per_km || null,
        price_per_day: form.price_per_day || null,
        airport_flat_rate: form.airport_flat_rate || null,
        extra_per_km: form.extra_per_km || null,
        years_experience: form.years_experience || null,
        google_maps: form.taxi_google_maps || null,
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
      const accommodationPayload = (operator.category === 'homestay' || operator.category === 'guest_house') ? {
        property_type: operator.category,
        owner_name: form.acc_owner_name || null,
        manager_name: form.acc_manager_name || null,
        contact: form.acc_contact || null,
        email: form.acc_email || null,
        address: form.acc_address || null,
        google_maps: form.acc_google_maps || null,
        total_rooms: form.acc_total_rooms || null,
        room_types: form.acc_room_types || null,
        pricing_single: form.acc_pricing_single || null,
        pricing_double: form.acc_pricing_double || null,
        amenities: form.acc_amenities || null,
        meals_included: form.acc_meals_included || null,
        check_in: form.acc_check_in || null,
        check_out: form.acc_check_out || null,
        languages: form.acc_languages || null,
        nearby_attractions: form.acc_nearby_attractions || null,
      } : undefined;
      const guidePayload = operator.category === 'guide' ? {
        full_name: form.guide_full_name || null,
        contact_number: form.guide_contact_number || null,
        whatsapp_number: form.guide_whatsapp_number || null,
        email: form.guide_email || null,
        languages: form.guide_languages || null,
        specialties: form.guide_specialties || null,
        years_experience: form.guide_years_experience || null,
        certification: form.guide_certification || null,
        operating_areas: form.guide_operating_areas || null,
        google_maps: form.guide_google_maps || null,
      } : undefined;
      const vendorPayload = operator.category === 'vendor' ? {
        business_name: form.vendor_business_name || null,
        owner_name: form.vendor_owner_name || null,
        contact_number: form.vendor_contact_number || null,
        whatsapp_number: form.vendor_whatsapp_number || null,
        email: form.vendor_email || null,
        business_type: form.vendor_business_type || null,
        specialties: form.vendor_specialties || null,
        operating_areas: form.vendor_operating_areas || null,
        google_maps: form.vendor_google_maps || null,
      } : undefined;
      const coords = form.google_maps ? parseGoogleMapsUrl(form.google_maps) : null;

      const res = await fetch(`/api/operators/${operator.slug}`, {
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
          taxi_details: taxiPayload,
          accommodation_details: accommodationPayload,
          guide_details: guidePayload,
          vendor_details: vendorPayload,
          lat: coords?.lat ?? null,
          lng: coords?.lng ?? null,
        }),
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => null);
        setSaveError(errBody?.error || `Save failed (${res.status})`);
        setSaving(false);
        return;
      }
      setSaving(false);
      router.push('/portal');
    } catch {
      setSaveError('Network error — please check your connection');
      setSaving(false);
    }
  };

  if (fetchError) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="text-center max-w-sm px-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10 mx-auto mb-4">
          <AlertCircle className="h-8 w-8 text-destructive" />
        </div>
        <h2 className="text-xl font-semibold text-foreground">Something went wrong</h2>
        <p className="text-sm text-muted-foreground mt-2">{fetchError}</p>
        <Button className="mt-6" onClick={() => window.location.reload()}>Try Again</Button>
      </div>
    </div>;
  }

  if (!operator) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-2 border-[#2C5F8A] border-t-transparent rounded-full" />
    </div>;
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-200">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3 min-h-24">
          <Link href="/portal" className="p-1">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <img src="/logo.png" alt="Kashmir360" className="h-56 w-auto object-contain" />
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
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium">Total Rooms</label>
                  <input value={form.hb_total_rooms || ''} onChange={(e) => setForm({ ...form, hb_total_rooms: e.target.value })} className="w-full mt-0.5 px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="e.g. 6" />
                </div>
                <div>
                  <label className="text-xs font-medium">Max Guest Capacity</label>
                  <input value={form.hb_capacity || ''} onChange={(e) => setForm({ ...form, hb_capacity: e.target.value })} className="w-full mt-0.5 px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="e.g. 20" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium">Room Types</label>
                <div className="mt-1 space-y-1">
                  {['Single', 'Double', 'Family Suite', 'Deluxe Suite', 'Dormitory'].map((type) => (
                    <label key={type} className="flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={(form.hb_room_types || []).includes(type)} onChange={(e) => setForm({ ...form, hb_room_types: e.target.checked ? [...(form.hb_room_types || []), type] : (form.hb_room_types || []).filter((t: string) => t !== type) })} className="rounded" />
                      {type}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium">Amenities</label>
                <div className="mt-1 grid grid-cols-2 gap-x-3 gap-y-1">
                  {['AC', 'Heating', 'Attached Bathroom', 'Hot Water', 'TV', 'WiFi', 'Room Service', 'Lake View', 'Bonfire', 'Restaurant', 'Parking', 'Laundry'].map((a) => (
                    <label key={a} className="flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={(form.hb_amenities || []).includes(a)} onChange={(e) => setForm({ ...form, hb_amenities: e.target.checked ? [...(form.hb_amenities || []), a] : (form.hb_amenities || []).filter((x: string) => x !== a) })} className="rounded" />
                      {a}
                    </label>
                  ))}
                </div>
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
            <div className="space-y-3 p-3 bg-blue-50 rounded-lg">
              <h3 className="text-sm font-semibold">Pricing</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium">Price per Ride (₹)</label>
                  <input value={form.price_per_ride || ''} onChange={(e) => setForm({ ...form, price_per_ride: e.target.value })} className="w-full mt-0.5 px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="₹" />
                </div>
                <div>
                  <label className="text-xs font-medium">Price per Hour (₹)</label>
                  <input value={form.price_per_hour || ''} onChange={(e) => setForm({ ...form, price_per_hour: e.target.value })} className="w-full mt-0.5 px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="₹" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium">Price Note (Optional)</label>
                <textarea value={form.price_note || ''} onChange={(e) => setForm({ ...form, price_note: e.target.value })} className="w-full mt-0.5 px-3 py-2 border border-gray-300 rounded-lg text-sm" rows={2} placeholder="e.g. Contact for group discounts" />
              </div>
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

        {(operator.category === 'homestay' || operator.category === 'guest_house') && (
          <>
            <div className="space-y-3 p-3 bg-blue-50 rounded-lg">
              <h3 className="text-sm font-semibold">Property Details</h3>
              <div>
                <label className="text-xs font-medium">Owner Name</label>
                <input value={form.acc_owner_name || ''} onChange={(e) => setForm({ ...form, acc_owner_name: e.target.value })} className="w-full mt-0.5 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium">Manager Name</label>
                <input value={form.acc_manager_name || ''} onChange={(e) => setForm({ ...form, acc_manager_name: e.target.value })} className="w-full mt-0.5 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium">Contact Number</label>
                <input value={form.acc_contact || ''} onChange={(e) => setForm({ ...form, acc_contact: e.target.value })} className="w-full mt-0.5 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium">Email</label>
                <input value={form.acc_email || ''} onChange={(e) => setForm({ ...form, acc_email: e.target.value })} className="w-full mt-0.5 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium">Address</label>
                <input value={form.acc_address || ''} onChange={(e) => setForm({ ...form, acc_address: e.target.value })} className="w-full mt-0.5 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium">Google Maps Link</label>
                <input value={form.acc_google_maps || ''} onChange={(e) => setForm({ ...form, acc_google_maps: e.target.value })} className="w-full mt-0.5 px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="https://maps.google.com/?q=..." />
              </div>
              <div>
                <label className="text-xs font-medium">Total Rooms</label>
                <input value={form.acc_total_rooms || ''} onChange={(e) => setForm({ ...form, acc_total_rooms: e.target.value })} className="w-full mt-0.5 px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="e.g. 4" />
              </div>
              <div>
                <label className="text-xs font-medium">Check-in Time</label>
                <input value={form.acc_check_in || ''} onChange={(e) => setForm({ ...form, acc_check_in: e.target.value })} className="w-full mt-0.5 px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="e.g. 12:00 PM" />
              </div>
              <div>
                <label className="text-xs font-medium">Check-out Time</label>
                <input value={form.acc_check_out || ''} onChange={(e) => setForm({ ...form, acc_check_out: e.target.value })} className="w-full mt-0.5 px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="e.g. 10:00 AM" />
              </div>
              <div>
                <label className="text-xs font-medium">Nearby Attractions</label>
                <textarea value={form.acc_nearby_attractions || ''} onChange={(e) => setForm({ ...form, acc_nearby_attractions: e.target.value })} className="w-full mt-0.5 px-3 py-2 border border-gray-300 rounded-lg text-sm" rows={2} placeholder="e.g. Dal Lake, Shankaracharya Temple, Mughal Gardens" />
              </div>
            </div>
            <div className="space-y-3 p-3 bg-blue-50 rounded-lg">
              <h3 className="text-sm font-semibold">Pricing (₹ per night)</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium">Single Room</label>
                  <input value={form.acc_pricing_single || ''} onChange={(e) => setForm({ ...form, acc_pricing_single: e.target.value })} className="w-full mt-0.5 px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="₹" />
                </div>
                <div>
                  <label className="text-xs font-medium">Double Room</label>
                  <input value={form.acc_pricing_double || ''} onChange={(e) => setForm({ ...form, acc_pricing_double: e.target.value })} className="w-full mt-0.5 px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="₹" />
                </div>
              </div>
            </div>
          </>
        )}

        {operator.category === 'taxi' && (
          <>
            <div className="space-y-3 p-3 bg-blue-50 rounded-lg">
              <h3 className="text-sm font-semibold">Vehicle & Driver Details</h3>
              <div>
                <label className="text-xs font-medium">Driver Name</label>
                <input value={form.driver_name || ''} onChange={(e) => setForm({ ...form, driver_name: e.target.value })} className="w-full mt-0.5 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium">Vehicle Type</label>
                <select value={form.vehicle_type || ''} onChange={(e) => setForm({ ...form, vehicle_type: e.target.value })} className="w-full mt-0.5 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
                  <option value="">Select</option>
                  <option value="sedan">Sedan</option>
                  <option value="suv">SUV</option>
                  <option value="tempo">Tempo Traveller</option>
                  <option value="van">Van</option>
                  <option value="auto">Auto Rickshaw</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium">Vehicle Model</label>
                <input value={form.vehicle_model || ''} onChange={(e) => setForm({ ...form, vehicle_model: e.target.value })} className="w-full mt-0.5 px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="e.g. Dzire, Innova" />
              </div>
              <div>
                <label className="text-xs font-medium">Registration Number</label>
                <input value={form.registration_number || ''} onChange={(e) => setForm({ ...form, registration_number: e.target.value })} className="w-full mt-0.5 px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="JK01AB1234" />
              </div>
              <div>
                <label className="text-xs font-medium">Operating Areas</label>
                <div className="mt-1 space-y-1">
                  {['Srinagar Airport', 'Dal Lake', 'Gulmarg', 'Pahalgam', 'Sonamarg', 'Yusmarg', 'Doodhpathri', 'Kokernag', 'Patnitop', 'Leh'].map((area) => (
                    <label key={area} className="flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={(form.operating_areas || []).includes(area)} onChange={(e) => setForm({ ...form, operating_areas: e.target.checked ? [...(form.operating_areas || []), area] : (form.operating_areas || []).filter((a: string) => a !== area) })} className="rounded" />
                      {area}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium">Languages Spoken</label>
                <div className="mt-1 space-y-1">
                  {['Kashmiri', 'Urdu', 'Hindi', 'English', 'Arabic', 'Pashto'].map((lang) => (
                    <label key={lang} className="flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={(form.languages || []).includes(lang)} onChange={(e) => setForm({ ...form, languages: e.target.checked ? [...(form.languages || []), lang] : (form.languages || []).filter((l: string) => l !== lang) })} className="rounded" />
                      {lang}
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="space-y-3 p-3 bg-blue-50 rounded-lg">
              <h3 className="text-sm font-semibold">Pricing & Tours</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium">Price per Km (₹)</label>
                  <input value={form.price_per_km || ''} onChange={(e) => setForm({ ...form, price_per_km: e.target.value })} className="w-full mt-0.5 px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="₹" />
                </div>
                <div>
                  <label className="text-xs font-medium">Price per Day (₹)</label>
                  <input value={form.price_per_day || ''} onChange={(e) => setForm({ ...form, price_per_day: e.target.value })} className="w-full mt-0.5 px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="₹ (8hrs/80km)" />
                </div>
                <div>
                  <label className="text-xs font-medium">Airport Flat Rate (₹)</label>
                  <input value={form.airport_flat_rate || ''} onChange={(e) => setForm({ ...form, airport_flat_rate: e.target.value })} className="w-full mt-0.5 px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="₹" />
                </div>
                <div>
                  <label className="text-xs font-medium">Extra per Km (₹)</label>
                  <input value={form.extra_per_km || ''} onChange={(e) => setForm({ ...form, extra_per_km: e.target.value })} className="w-full mt-0.5 px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="₹" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium">Tour Types</label>
                <div className="mt-1 space-y-1">
                  {['Airport Transfer', 'Local Sightseeing', 'Day Trip', 'Multi-Day Tour', 'Pilgrimage', 'Adventure'].map((type) => (
                    <label key={type} className="flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={(form.tour_types || []).includes(type)} onChange={(e) => setForm({ ...form, tour_types: e.target.checked ? [...(form.tour_types || []), type] : (form.tour_types || []).filter((t: string) => t !== type) })} className="rounded" />
                      {type}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium">Years of Experience</label>
                <input value={form.years_experience || ''} onChange={(e) => setForm({ ...form, years_experience: e.target.value })} className="w-full mt-0.5 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium">Google Map Link</label>
                <input value={form.taxi_google_maps || ''} onChange={(e) => setForm({ ...form, taxi_google_maps: e.target.value })} className="w-full mt-0.5 px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="https://maps.google.com/?q=..." />
              </div>
            </div>
          </>
        )}

        {operator.category === 'guide' && (
          <>
            <div className="space-y-3 p-3 bg-blue-50 rounded-lg">
              <h3 className="text-sm font-semibold">Guide Details</h3>
              <div>
                <label className="text-xs font-medium">Full Name</label>
                <input value={form.guide_full_name || ''} onChange={(e) => setForm({ ...form, guide_full_name: e.target.value })} className="w-full mt-0.5 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium">Contact Number</label>
                <input value={form.guide_contact_number || ''} onChange={(e) => setForm({ ...form, guide_contact_number: e.target.value })} className="w-full mt-0.5 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium">WhatsApp Number</label>
                <input value={form.guide_whatsapp_number || ''} onChange={(e) => setForm({ ...form, guide_whatsapp_number: e.target.value })} className="w-full mt-0.5 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium">Email</label>
                <input value={form.guide_email || ''} onChange={(e) => setForm({ ...form, guide_email: e.target.value })} className="w-full mt-0.5 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium">Languages Spoken</label>
                <div className="mt-1 space-y-1">
                  {['Kashmiri', 'Urdu', 'Hindi', 'English', 'Arabic', 'French', 'German', 'Pashto'].map((lang) => (
                    <label key={lang} className="flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={(form.guide_languages || []).includes(lang)} onChange={(e) => setForm({ ...form, guide_languages: e.target.checked ? [...(form.guide_languages || []), lang] : (form.guide_languages || []).filter((l: string) => l !== lang) })} className="rounded" />
                      {lang}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium">Specialties</label>
                <div className="mt-1 space-y-1">
                  {['Historical Tours', 'Trekking', 'Food Tours', 'Cultural Tours', 'Photography Tours', 'Bird Watching', 'Shopping Tours', 'Custom Tours'].map((s) => (
                    <label key={s} className="flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={(form.guide_specialties || []).includes(s)} onChange={(e) => setForm({ ...form, guide_specialties: e.target.checked ? [...(form.guide_specialties || []), s] : (form.guide_specialties || []).filter((x: string) => x !== s) })} className="rounded" />
                      {s}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium">Years of Experience</label>
                <input value={form.guide_years_experience || ''} onChange={(e) => setForm({ ...form, guide_years_experience: e.target.value })} className="w-full mt-0.5 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium">Certification</label>
                <input value={form.guide_certification || ''} onChange={(e) => setForm({ ...form, guide_certification: e.target.value })} className="w-full mt-0.5 px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="e.g. JKTDC certified guide" />
              </div>
              <div>
                <label className="text-xs font-medium">Operating Areas</label>
                <div className="mt-1 space-y-1">
                  {['Srinagar Airport', 'Dal Lake', 'Gulmarg', 'Pahalgam', 'Sonamarg', 'Yusmarg', 'Doodhpathri', 'Kokernag', 'Patnitop', 'Leh'].map((area) => (
                    <label key={area} className="flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={(form.guide_operating_areas || []).includes(area)} onChange={(e) => setForm({ ...form, guide_operating_areas: e.target.checked ? [...(form.guide_operating_areas || []), area] : (form.guide_operating_areas || []).filter((a: string) => a !== area) })} className="rounded" />
                      {area}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium">Google Map Link</label>
                <input value={form.guide_google_maps || ''} onChange={(e) => setForm({ ...form, guide_google_maps: e.target.value })} className="w-full mt-0.5 px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="https://maps.google.com/?q=..." />
              </div>
            </div>
          </>
        )}

        {operator.category === 'vendor' && (
          <>
            <div className="space-y-3 p-3 bg-blue-50 rounded-lg">
              <h3 className="text-sm font-semibold">Vendor Details</h3>
              <div>
                <label className="text-xs font-medium">Business Name</label>
                <input value={form.vendor_business_name || ''} onChange={(e) => setForm({ ...form, vendor_business_name: e.target.value })} className="w-full mt-0.5 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium">Owner Name</label>
                <input value={form.vendor_owner_name || ''} onChange={(e) => setForm({ ...form, vendor_owner_name: e.target.value })} className="w-full mt-0.5 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium">Contact Number</label>
                <input value={form.vendor_contact_number || ''} onChange={(e) => setForm({ ...form, vendor_contact_number: e.target.value })} className="w-full mt-0.5 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium">WhatsApp Number</label>
                <input value={form.vendor_whatsapp_number || ''} onChange={(e) => setForm({ ...form, vendor_whatsapp_number: e.target.value })} className="w-full mt-0.5 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium">Email</label>
                <input value={form.vendor_email || ''} onChange={(e) => setForm({ ...form, vendor_email: e.target.value })} className="w-full mt-0.5 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium">Business Type</label>
                <select value={form.vendor_business_type || ''} onChange={(e) => setForm({ ...form, vendor_business_type: e.target.value })} className="w-full mt-0.5 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
                  <option value="">Select type</option>
                  <option value="food">Food & Beverages</option>
                  <option value="souvenirs">Souvenirs</option>
                  <option value="flowers">Flowers & Garlands</option>
                  <option value="handicrafts">Handicrafts</option>
                  <option value="pashmina">Pashmina & Shawls</option>
                  <option value="spices">Spices & Dry Fruits</option>
                  <option value="produce">Fresh Produce</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium">Specialties</label>
                <div className="mt-1 space-y-1">
                  {['Food & Beverages', 'Souvenirs', 'Flowers & Garlands', 'Handicrafts', 'Pashmina & Shawls', 'Spices & Dry Fruits', 'Fresh Produce', 'Other'].map((s) => (
                    <label key={s} className="flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={(form.vendor_specialties || []).includes(s)} onChange={(e) => setForm({ ...form, vendor_specialties: e.target.checked ? [...(form.vendor_specialties || []), s] : (form.vendor_specialties || []).filter((x: string) => x !== s) })} className="rounded" />
                      {s}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium">Operating Areas</label>
                <div className="mt-1 space-y-1">
                  {['Srinagar Airport', 'Dal Lake', 'Gulmarg', 'Pahalgam', 'Sonamarg', 'Yusmarg', 'Doodhpathri', 'Kokernag', 'Patnitop', 'Leh'].map((area) => (
                    <label key={area} className="flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={(form.vendor_operating_areas || []).includes(area)} onChange={(e) => setForm({ ...form, vendor_operating_areas: e.target.checked ? [...(form.vendor_operating_areas || []), area] : (form.vendor_operating_areas || []).filter((a: string) => a !== area) })} className="rounded" />
                      {area}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium">Google Map Link</label>
                <input value={form.vendor_google_maps || ''} onChange={(e) => setForm({ ...form, vendor_google_maps: e.target.value })} className="w-full mt-0.5 px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="https://maps.google.com/?q=..." />
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

        {saveError && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{saveError}</span>
          </div>
        )}

        <Button onClick={handleSave} className="w-full gap-2" disabled={saving}>
          <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </main>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Check, Upload, MessageCircle, Mail, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import imageCompression from 'browser-image-compression';
import { parseGoogleMapsUrl } from '@/lib/location';
import { ghats } from '@/lib/ghats';
import { KASHMIR_AREAS, SHIKARA_AREAS } from '@/lib/areas';

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
  price_per_ride: string;
  price_per_hour: string;
  price_note: string;
};

type TaxiFormFields = {
  driver_name: string;
  vehicle_type: string;
  vehicle_model: string;
  registration_number: string;
  operating_areas: string[];
  languages: string[];
  tour_types: string[];
  price_per_km: string;
  price_per_day: string;
  airport_flat_rate: string;
  extra_per_km: string;
  years_experience: string;
  google_maps: string;
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

type GuideFormFields = {
  full_name: string;
  contact_number: string;
  whatsapp_number: string;
  email: string;
  languages: string[];
  specialties: string[];
  years_experience: string;
  certification: string;
  operating_areas: string[];
  google_maps: string;
};

type VendorFormFields = {
  business_name: string;
  owner_name: string;
  contact_number: string;
  whatsapp_number: string;
  email: string;
  business_type: string;
  specialties: string[];
  operating_areas: string[];
  google_maps: string;
};

type AccommodationFormFields = {
  owner_name: string;
  manager_name: string;
  contact: string;
  email: string;
  address: string;
  google_maps: string;
  total_rooms: string;
  room_types: string[];
  pricing_single: string;
  pricing_double: string;
  amenities: string[];
  meals_included: string[];
  check_in: string;
  check_out: string;
  languages: string[];
  nearby_attractions: string;
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
  taxi: TaxiFormFields;
  accommodation: AccommodationFormFields;
  guide: GuideFormFields;
  vendor: VendorFormFields;
  boat_ghat: string;
  hb_total_rooms: string;
  hb_capacity: string;
  hb_room_types: string[];
  hb_amenities: string[];
};

const defaultTaxi: TaxiFormFields = {
  driver_name: '',
  vehicle_type: '',
  vehicle_model: '',
  registration_number: '',
  operating_areas: [],
  languages: [],
  tour_types: [],
  price_per_km: '',
  price_per_day: '',
  airport_flat_rate: '',
  extra_per_km: '',
  years_experience: '',
  google_maps: '',
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
  price_per_ride: '',
  price_per_hour: '',
  price_note: '',
};

const ROOM_TYPES = ['Single', 'Double', 'Family', 'Dormitory', 'Suite'];
const AMENITIES_LIST = ['WiFi', 'AC', 'Parking', 'Hot Water', 'TV', 'Kitchen Access', 'Garden', 'Lake View', 'Mountain View', 'Bonfire', 'Room Service', 'Laundry'];
const MEALS_LIST = ['Breakfast', 'Lunch', 'Dinner', 'All Meals'];
const ACCOMMODATION_LANGUAGES = ['Kashmiri', 'Urdu', 'Hindi', 'English', 'Arabic', 'French'];

const GUIDE_SPECIALTIES = ['Historical Tours', 'Trekking', 'Food Tours', 'Cultural Tours', 'Photography Tours', 'Bird Watching', 'Shopping Tours', 'Custom Tours'];
const GUIDE_LANGUAGES = ['Kashmiri', 'Urdu', 'Hindi', 'English', 'Arabic', 'French', 'German', 'Pashto'];
const VENDOR_SPECIALTIES = ['Food & Beverages', 'Souvenirs', 'Flowers & Garlands', 'Handicrafts', 'Pashmina & Shawls', 'Spices & Dry Fruits', 'Fresh Produce', 'Other'];

const defaultGuide: GuideFormFields = {
  full_name: '',
  contact_number: '',
  whatsapp_number: '',
  email: '',
  languages: [],
  specialties: [],
  years_experience: '',
  certification: '',
  operating_areas: [],
  google_maps: '',
};

const defaultVendor: VendorFormFields = {
  business_name: '',
  owner_name: '',
  contact_number: '',
  whatsapp_number: '',
  email: '',
  business_type: '',
  specialties: [],
  operating_areas: [],
  google_maps: '',
};

const defaultAccommodation: AccommodationFormFields = {
  owner_name: '',
  manager_name: '',
  contact: '',
  email: '',
  address: '',
  google_maps: '',
  total_rooms: '',
  room_types: [],
  pricing_single: '',
  pricing_double: '',
  amenities: [],
  meals_included: [],
  check_in: '',
  check_out: '',
  languages: [],
  nearby_attractions: '',
};

const steps = ['Email', 'Business', 'Description', 'Photos', 'Review'];

export default function JoinPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpCooldown, setOtpCooldown] = useState(0);
  const [otpMethod, setOtpMethod] = useState<'email' | 'whatsapp'>('email');
  const [phoneOtp, setPhoneOtp] = useState('');
  const [phoneOtpSent, setPhoneOtpSent] = useState(false);
  const [verifiedPhone, setVerifiedPhone] = useState('');
  const [claimOtp, setClaimOtp] = useState('');
  const [claimSent, setClaimSent] = useState(false);
  const [claimLoading, setClaimLoading] = useState(false);
  const [claimError, setClaimError] = useState('');
  const [existingOperator, setExistingOperator] = useState<{ id: string; name: string; slug: string; status: string } | null>(null);
  const [checkingDuplicate, setCheckingDuplicate] = useState(false);

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
    taxi: { ...defaultTaxi },
    accommodation: { ...defaultAccommodation },
    guide: { ...defaultGuide },
    vendor: { ...defaultVendor },
    boat_ghat: '',
    hb_total_rooms: '',
    hb_capacity: '',
    hb_room_types: [],
    hb_amenities: [],
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
    setSubmitError(null);
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
        total_rooms: form.hb_total_rooms || null,
        capacity: form.hb_capacity || null,
        room_types: form.hb_room_types.length > 0 ? form.hb_room_types : null,
        amenities: form.hb_amenities.length > 0 ? form.hb_amenities : null,
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
        price_per_ride: form.shikara.price_per_ride || null,
        price_per_hour: form.shikara.price_per_hour || null,
        price_note: form.shikara.price_note || null,
      } : null;
      const accommodationPayload = (form.category === 'homestay' || form.category === 'guest_house') ? {
        property_type: form.category,
        owner_name: form.accommodation.owner_name || null,
        manager_name: form.accommodation.manager_name || null,
        contact: form.accommodation.contact || null,
        email: form.accommodation.email || null,
        address: form.accommodation.address || null,
        google_maps: form.accommodation.google_maps || null,
        total_rooms: form.accommodation.total_rooms || null,
        room_types: form.accommodation.room_types.length > 0 ? form.accommodation.room_types : null,
        pricing_single: form.accommodation.pricing_single || null,
        pricing_double: form.accommodation.pricing_double || null,
        amenities: form.accommodation.amenities.length > 0 ? form.accommodation.amenities : null,
        meals_included: form.accommodation.meals_included.length > 0 ? form.accommodation.meals_included : null,
        check_in: form.accommodation.check_in || null,
        check_out: form.accommodation.check_out || null,
        languages: form.accommodation.languages.length > 0 ? form.accommodation.languages : null,
        nearby_attractions: form.accommodation.nearby_attractions || null,
      } : null;
      const taxiPayload = form.category === 'taxi' ? {
        driver_name: form.taxi.driver_name || null,
        vehicle_type: form.taxi.vehicle_type || null,
        vehicle_model: form.taxi.vehicle_model || null,
        registration_number: form.taxi.registration_number || null,
        operating_areas: form.taxi.operating_areas.length > 0 ? form.taxi.operating_areas : null,
        languages: form.taxi.languages.length > 0 ? form.taxi.languages : null,
        tour_types: form.taxi.tour_types.length > 0 ? form.taxi.tour_types : null,
        price_per_km: form.taxi.price_per_km || null,
        price_per_day: form.taxi.price_per_day || null,
        airport_flat_rate: form.taxi.airport_flat_rate || null,
        extra_per_km: form.taxi.extra_per_km || null,
        years_experience: form.taxi.years_experience || null,
        google_maps: form.taxi.google_maps || null,
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
      const guidePayload = form.category === 'guide' ? {
        full_name: form.guide.full_name || null,
        contact_number: form.guide.contact_number || null,
        whatsapp_number: form.guide.whatsapp_number || null,
        email: form.guide.email || null,
        languages: form.guide.languages.length > 0 ? form.guide.languages : null,
        specialties: form.guide.specialties.length > 0 ? form.guide.specialties : null,
        years_experience: form.guide.years_experience || null,
        certification: form.guide.certification || null,
        operating_areas: form.guide.operating_areas.length > 0 ? form.guide.operating_areas : null,
        google_maps: form.guide.google_maps || null,
      } : null;
      const vendorPayload = form.category === 'vendor' ? {
        business_name: form.vendor.business_name || null,
        owner_name: form.vendor.owner_name || null,
        contact_number: form.vendor.contact_number || null,
        whatsapp_number: form.vendor.whatsapp_number || null,
        email: form.vendor.email || null,
        business_type: form.vendor.business_type || null,
        specialties: form.vendor.specialties.length > 0 ? form.vendor.specialties : null,
        operating_areas: form.vendor.operating_areas.length > 0 ? form.vendor.operating_areas : null,
        google_maps: form.vendor.google_maps || null,
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
        setSubmitError(errBody?.error || `Submission failed (${res.status})`);
        setLoading(false);
        return;
      }
      setLoading(false);
      router.push('/join?success=true');
    } catch (err) {
      console.error('Submit error:', err);
      setSubmitError('Network error — please check your connection');
      setLoading(false);
    }
  };

  const handleClaimSendOtp = async () => {
    setClaimLoading(true);
    setClaimError('');
    setClaimSent(false);
    try {
      const res = await fetch('/api/auth/send-otp-whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: form.phone }),
      });
      const data = await res.json();
      if (res.ok) {
        setClaimSent(true);
      } else {
        setClaimError(data.error || 'Failed to send OTP');
      }
    } catch {
      setClaimError('Network error');
    }
    setClaimLoading(false);
  };

  const handleClaimVerify = async () => {
    setClaimLoading(true);
    setClaimError('');
    try {
      const verifyRes = await fetch('/api/auth/verify-whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: form.phone, otp: claimOtp }),
      });
      const verifyData = await verifyRes.json();
      if (!verifyData.success) {
        setClaimError(verifyData.error || 'Invalid OTP');
        setClaimLoading(false);
        return;
      }
      const signInRes = await signIn('whatsapp-otp', {
        phone: form.phone,
        otp: claimOtp,
        redirect: false,
      });
      if (signInRes?.error) {
        setClaimError('Login failed — please try again');
        setClaimLoading(false);
        return;
      }
      router.push('/portal');
    } catch {
      setClaimError('Network error');
      setClaimLoading(false);
    }
  };

  const handleStep1Next = async () => {
    if (checkingDuplicate) return;
    setCheckingDuplicate(true);
    setExistingOperator(null);
    setClaimOtp('');
    setClaimSent(false);
    setClaimError('');
    try {
      const res = await fetch('/api/operators/check-whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: form.phone }),
      });
      const data = await res.json();
      if (data.exists && data.operator) {
        setExistingOperator(data.operator);
      } else {
        setStep(2);
      }
    } catch {
      setStep(2);
    }
    setCheckingDuplicate(false);
  };

  if (typeof window !== 'undefined' && window.location.search.includes('success=true')) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-success" />
          </div>
          <h1 className="text-xl font-bold">Profile Submitted!</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Your profile is under review. We will WhatsApp you within 24 hours.
          </p>
          <div className="flex flex-col gap-2 mt-6">
            <Link href="/auth/login">
              <Button className="w-full">Go to Login →</Button>
            </Link>
            <Link href="/">
              <Button variant="outline" className="w-full">Back to Home</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3 min-h-24">
          <Link href="/" className="p-1">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <img src="/logo.png" alt="Kasheer360" className="h-56 w-auto object-contain" />
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="flex gap-1 mb-6">
          {steps.map((s, i) => (
            <div key={s} className={`flex-1 h-1 rounded-full ${i <= step ? 'bg-[#2C5F8A]' : 'bg-border'}`} />
          ))}
        </div>

        {step === 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Verify Your Contact</h2>
            <p className="text-sm text-muted-foreground">Verify your email or WhatsApp to get started.</p>
            <div className="flex rounded-lg border border-input overflow-hidden">
              <button
                onClick={() => { setOtpMethod('email'); setOtpVerified(false); setOtpSent(false); setOtp(''); setOtpError(''); setPhoneOtpSent(false); setPhoneOtp(''); }}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors ${otpMethod === 'email' ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground hover:bg-secondary'}`}
              >
                <Mail className="h-4 w-4" /> Email
              </button>
              <button
                onClick={() => { setOtpMethod('whatsapp'); setOtpVerified(false); setOtpSent(false); setOtp(''); setOtpError(''); setPhoneOtpSent(false); setPhoneOtp(''); }}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors ${otpMethod === 'whatsapp' ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground hover:bg-secondary'}`}
              >
                <MessageCircle className="h-4 w-4" /> WhatsApp
              </button>
            </div>
            {otpMethod === 'email' && (
              <>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={(e) => { update('email', e.target.value); setOtpVerified(false); setOtpSent(false); setOtp(''); }}
                  disabled={otpSent && !otpVerified}
                  className="w-full px-4 py-3 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:bg-muted"
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
                            className="w-full mt-1 px-4 py-3 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring tracking-widest text-center text-lg"
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
                            className="text-muted-foreground hover:text-foreground"
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
                            className="text-primary font-medium disabled:text-gray-400"
                          >
                            {otpCooldown > 0 ? `Resend in ${otpCooldown}s` : 'Resend OTP'}
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
            {otpMethod === 'whatsapp' && (
              <>
                <input
                  type="tel"
                  placeholder="+91 1234567890"
                  value={phoneOtp}
                  onChange={(e) => { setPhoneOtp(e.target.value); setOtpVerified(false); setPhoneOtpSent(false); setOtp(''); setOtpError(''); }}
                  disabled={phoneOtpSent && !otpVerified}
                  className="w-full px-4 py-3 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:bg-muted"
                />
                {!otpVerified && (
                  <>
                    {!phoneOtpSent ? (
                      <Button
                        onClick={async () => {
                          setOtpLoading(true);
                          setOtpError('');
                          try {
                            const res = await fetch('/api/auth/send-otp-whatsapp', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ phone: phoneOtp }),
                            });
                            const data = await res.json();
                            if (data.sent) {
                              setPhoneOtpSent(true);
                              setOtpCooldown(60);
                            } else {
                              setOtpError(data.error || 'Failed to send OTP');
                            }
                          } catch { setOtpError('Network error'); }
                          finally { setOtpLoading(false); }
                        }}
                        className="w-full"
                        disabled={!phoneOtp || otpLoading}
                      >
                        {otpLoading ? 'Sending...' : 'Send OTP via WhatsApp'}
                      </Button>
                    ) : (
                      <div className="space-y-3">
                        <div>
                          <label className="text-sm font-medium">Enter OTP</label>
                          <input
                            type="text"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            className="w-full mt-1 px-4 py-3 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring tracking-widest text-center text-lg"
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
                              const res = await fetch('/api/auth/verify-whatsapp', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ phone: phoneOtp, otp }),
                              });
                              const data = await res.json();
                              if (data.success) {
                                setOtpVerified(true);
                                setVerifiedPhone(phoneOtp);
                                setForm((prev) => ({ ...prev, phone: phoneOtp }));
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
                            onClick={() => { setPhoneOtpSent(false); setOtp(''); setOtpCooldown(0); }}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            Change number
                          </button>
                          <button
                            onClick={async () => {
                              setOtpLoading(true);
                              setOtpError('');
                              try {
                                const res = await fetch('/api/auth/send-otp-whatsapp', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ phone: phoneOtp }),
                                });
                                const data = await res.json();
                                if (data.sent) {
                                  setOtpCooldown(60);
                                }
                              } catch { /* ignore */ }
                              finally { setOtpLoading(false); }
                            }}
                            disabled={otpCooldown > 0 || otpLoading}
                            className="text-primary font-medium disabled:text-gray-400"
                          >
                            {otpCooldown > 0 ? `Resend in ${otpCooldown}s` : 'Resend OTP'}
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
            {otpError && <p className="text-sm text-danger text-center">{otpError}</p>}
            {otpVerified && (
              <div className="flex items-center gap-2 text-success text-sm">
                <Check className="w-4 h-4" />
                {otpMethod === 'email' ? 'Email verified' : 'WhatsApp verified'}
              </div>
            )}
            <Button onClick={() => setStep(1)} className="w-full" disabled={!otpVerified || (otpMethod === 'email' && !form.email) || (otpMethod === 'whatsapp' && !verifiedPhone)}>
              Next <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Business Basics</h2>
            <div>
              <label className="text-sm font-medium">Business Name *</label>
              <input
                value={form.name}
                onChange={(e) => update('name', e.target.value)}
                className="w-full mt-1 px-4 py-3 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                maxLength={100}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Category</label>
              <select
                value={form.category}
                onChange={(e) => update('category', e.target.value)}
                className="w-full mt-1 px-4 py-3 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-white"
              >
                <option value="houseboat">Houseboat</option>
                <option value="shikara">Shikara Ride</option>
                <option value="artisan">Artisan & Craft</option>
                <option value="guide">Local Guide</option>
                <option value="vendor">Floating Vendor</option>
                <option value="taxi">Taxi & Transfers</option>
                <option value="homestay">Homestay</option>
                <option value="guest_house">Guest House</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">WhatsApp / Contact Number *</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => update('phone', e.target.value)}
                className="w-full mt-1 px-4 py-3 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="+91 1234567890"
              />
            </div>
            {form.category === 'houseboat' && (
              <div className="space-y-3 p-3 bg-secondary rounded-lg">
                <h3 className="text-sm font-semibold">Houseboat Details</h3>
                <div>
                  <label className="text-xs font-medium">Owner Name *</label>
                  <input value={form.owner} onChange={(e) => update('owner', e.target.value)} className="w-full mt-0.5 px-3 py-2 border border-input rounded-lg text-sm" />
                </div>
                <div>
                  <label className="text-xs font-medium">Address *</label>
                  <input value={form.address} onChange={(e) => update('address', e.target.value)} className="w-full mt-0.5 px-3 py-2 border border-input rounded-lg text-sm" />
                </div>
                <div>
                  <label className="text-xs font-medium">Contact</label>
                  <input value={form.hb_contact} onChange={(e) => update('hb_contact', e.target.value)} className="w-full mt-0.5 px-3 py-2 border border-input rounded-lg text-sm" placeholder="Alternate phone number" />
                </div>
                <div>
                  <label className="text-xs font-medium">Alternate Contact 2</label>
                  <input value={form.hb_contact2} onChange={(e) => update('hb_contact2', e.target.value)} className="w-full mt-0.5 px-3 py-2 border border-input rounded-lg text-sm" placeholder="Another alternate phone number" />
                </div>
                <div>
                  <label className="text-xs font-medium">Email</label>
                  <input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} className="w-full mt-0.5 px-3 py-2 border border-input rounded-lg text-sm" />
                </div>
                <div>
                  <label className="text-xs font-medium">Google Maps Link</label>
                  <input value={form.google_maps} onChange={(e) => update('google_maps', e.target.value)} className="w-full mt-0.5 px-3 py-2 border border-input rounded-lg text-sm" placeholder="https://maps.google.com/?q=..." />
                </div>
                <div>
                  <label className="text-xs font-medium">Grade</label>
                  <select value={form.grade} onChange={(e) => update('grade', e.target.value)} className="w-full mt-0.5 px-3 py-2 border border-input rounded-lg text-sm bg-card">
                    <option value="Grade A">Grade A</option>
                    <option value="Grade B">Grade B</option>
                    <option value="Grade C">Grade C</option>
                    <option value="Grade D">Grade D</option>
                    <option value="Deluxe">Deluxe</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium">Shikara Ghat (used to arrive to boat) *</label>
                  <select value={form.boat_ghat} onChange={(e) => update('boat_ghat', e.target.value)} className="w-full mt-0.5 px-3 py-2 border border-input rounded-lg text-sm bg-card">
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
                    <input value={form.hb_total_rooms} onChange={(e) => update('hb_total_rooms', e.target.value)} className="w-full mt-0.5 px-3 py-2 border border-input rounded-lg text-sm" placeholder="e.g. 6" />
                  </div>
                  <div>
                    <label className="text-xs font-medium">Max Guest Capacity</label>
                    <input value={form.hb_capacity} onChange={(e) => update('hb_capacity', e.target.value)} className="w-full mt-0.5 px-3 py-2 border border-input rounded-lg text-sm" placeholder="e.g. 20" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium">Room Types</label>
                  <div className="mt-1 space-y-1">
                    {['Single', 'Double', 'Family Suite', 'Deluxe Suite', 'Dormitory'].map((type) => (
                      <label key={type} className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={form.hb_room_types.includes(type)} onChange={(e) => setForm((prev) => ({ ...prev, hb_room_types: e.target.checked ? [...prev.hb_room_types, type] : prev.hb_room_types.filter((t) => t !== type) }))} className="accent-[#2C5F8A]" />
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
                        <input type="checkbox" checked={form.hb_amenities.includes(a)} onChange={(e) => setForm((prev) => ({ ...prev, hb_amenities: e.target.checked ? [...prev.hb_amenities, a] : prev.hb_amenities.filter((x) => x !== a) }))} className="accent-[#2C5F8A]" />
                        {a}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}
            {form.category === 'shikara' && (
              <div className="space-y-3 p-3 bg-secondary rounded-lg">
                <h3 className="text-sm font-semibold">Basic Register Info</h3>
                <div>
                  <label className="text-xs font-medium">Full Name *</label>
                  <input value={form.shikara.full_name} onChange={(e) => setForm((prev) => ({ ...prev, shikara: { ...prev.shikara, full_name: e.target.value } }))} className="w-full mt-0.5 px-3 py-2 border border-input rounded-lg text-sm" />
                </div>
                <div>
                  <label className="text-xs font-medium">Mobile Number *</label>
                  <input value={form.shikara.mobile_number} onChange={(e) => setForm((prev) => ({ ...prev, shikara: { ...prev.shikara, mobile_number: e.target.value } }))} className="w-full mt-0.5 px-3 py-2 border border-input rounded-lg text-sm" />
                </div>
                <div>
                  <label className="text-xs font-medium">WhatsApp Number *</label>
                  <input value={form.shikara.whatsapp_number} onChange={(e) => setForm((prev) => ({ ...prev, shikara: { ...prev.shikara, whatsapp_number: e.target.value } }))} className="w-full mt-0.5 px-3 py-2 border border-input rounded-lg text-sm" />
                </div>
                <div>
                  <label className="text-xs font-medium">Shikara Number *</label>
                  <input value={form.shikara.shikara_number} onChange={(e) => setForm((prev) => ({ ...prev, shikara: { ...prev.shikara, shikara_number: e.target.value } }))} className="w-full mt-0.5 px-3 py-2 border border-input rounded-lg text-sm" />
                </div>
                <div>
                  <label className="text-xs font-medium">Ghat Number / Location *</label>
                  <select value={form.shikara.ghat_number} onChange={(e) => setForm((prev) => ({ ...prev, shikara: { ...prev.shikara, ghat_number: e.target.value } }))} className="w-full mt-0.5 px-3 py-2 border border-input rounded-lg text-sm bg-card">
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
                    {SHIKARA_AREAS.map((area) => (
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
              <div className="space-y-3 p-3 bg-secondary rounded-lg">
                <h3 className="text-sm font-semibold">Business Details</h3>
                <div>
                  <label className="text-xs font-medium">Select one *</label>
                  <select value={form.artisan.business_type} onChange={(e) => setForm((prev) => ({ ...prev, artisan: { ...prev.artisan, business_type: e.target.value } }))} className="w-full mt-0.5 px-3 py-2 border border-input rounded-lg text-sm bg-card">
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
            {(form.category === 'homestay' || form.category === 'guest_house') && (
              <div className="space-y-3 p-3 bg-secondary rounded-lg">
                <h3 className="text-sm font-semibold">Property Details</h3>
                <div>
                  <label className="text-xs font-medium">Owner Name *</label>
                  <input value={form.accommodation.owner_name} onChange={(e) => setForm((prev) => ({ ...prev, accommodation: { ...prev.accommodation, owner_name: e.target.value } }))} className="w-full mt-0.5 px-3 py-2 border border-input rounded-lg text-sm" />
                </div>
                <div>
                  <label className="text-xs font-medium">Manager Name (if different)</label>
                  <input value={form.accommodation.manager_name} onChange={(e) => setForm((prev) => ({ ...prev, accommodation: { ...prev.accommodation, manager_name: e.target.value } }))} className="w-full mt-0.5 px-3 py-2 border border-input rounded-lg text-sm" />
                </div>
                <div>
                  <label className="text-xs font-medium">Contact Number *</label>
                  <input value={form.accommodation.contact} onChange={(e) => setForm((prev) => ({ ...prev, accommodation: { ...prev.accommodation, contact: e.target.value } }))} className="w-full mt-0.5 px-3 py-2 border border-input rounded-lg text-sm" />
                </div>
                <div>
                  <label className="text-xs font-medium">Email</label>
                  <input type="email" value={form.accommodation.email} onChange={(e) => setForm((prev) => ({ ...prev, accommodation: { ...prev.accommodation, email: e.target.value } }))} className="w-full mt-0.5 px-3 py-2 border border-input rounded-lg text-sm" />
                </div>
                <div>
                  <label className="text-xs font-medium">Address *</label>
                  <input value={form.accommodation.address} onChange={(e) => setForm((prev) => ({ ...prev, accommodation: { ...prev.accommodation, address: e.target.value } }))} className="w-full mt-0.5 px-3 py-2 border border-input rounded-lg text-sm" />
                </div>
                <div>
                  <label className="text-xs font-medium">Google Maps Link</label>
                  <input value={form.accommodation.google_maps} onChange={(e) => setForm((prev) => ({ ...prev, accommodation: { ...prev.accommodation, google_maps: e.target.value } }))} className="w-full mt-0.5 px-3 py-2 border border-input rounded-lg text-sm" placeholder="https://maps.google.com/?q=..." />
                </div>
                <div>
                  <label className="text-xs font-medium">Total Rooms</label>
                  <input type="number" value={form.accommodation.total_rooms} onChange={(e) => setForm((prev) => ({ ...prev, accommodation: { ...prev.accommodation, total_rooms: e.target.value } }))} className="w-full mt-0.5 px-3 py-2 border border-input rounded-lg text-sm" placeholder="e.g. 4" />
                </div>
                <div>
                  <label className="text-xs font-medium">Room Types (select all that apply)</label>
                  <div className="mt-1 space-y-1">
                    {ROOM_TYPES.map((rt) => (
                      <label key={rt} className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={form.accommodation.room_types.includes(rt)} onChange={(e) => setForm((prev) => ({ ...prev, accommodation: { ...prev.accommodation, room_types: e.target.checked ? [...prev.accommodation.room_types, rt] : prev.accommodation.room_types.filter((r) => r !== rt) } }))} className="accent-[#2C5F8A]" />
                        {rt}
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium">Languages Spoken</label>
                  <div className="mt-1 space-y-1">
                    {ACCOMMODATION_LANGUAGES.map((lang) => (
                      <label key={lang} className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={form.accommodation.languages.includes(lang)} onChange={(e) => setForm((prev) => ({ ...prev, accommodation: { ...prev.accommodation, languages: e.target.checked ? [...prev.accommodation.languages, lang] : prev.accommodation.languages.filter((l) => l !== lang) } }))} className="accent-[#2C5F8A]" />
                        {lang}
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium">Check-in Time</label>
                  <input value={form.accommodation.check_in} onChange={(e) => setForm((prev) => ({ ...prev, accommodation: { ...prev.accommodation, check_in: e.target.value } }))} className="w-full mt-0.5 px-3 py-2 border border-input rounded-lg text-sm" placeholder="e.g. 12:00 PM" />
                </div>
                <div>
                  <label className="text-xs font-medium">Check-out Time</label>
                  <input value={form.accommodation.check_out} onChange={(e) => setForm((prev) => ({ ...prev, accommodation: { ...prev.accommodation, check_out: e.target.value } }))} className="w-full mt-0.5 px-3 py-2 border border-input rounded-lg text-sm" placeholder="e.g. 10:00 AM" />
                </div>
                <div>
                  <label className="text-xs font-medium">Amenities (select all that apply)</label>
                  <div className="mt-1 grid grid-cols-2 gap-x-3 gap-y-1">
                    {AMENITIES_LIST.map((a) => (
                      <label key={a} className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={form.accommodation.amenities.includes(a)} onChange={(e) => setForm((prev) => ({ ...prev, accommodation: { ...prev.accommodation, amenities: e.target.checked ? [...prev.accommodation.amenities, a] : prev.accommodation.amenities.filter((x) => x !== a) } }))} className="accent-[#2C5F8A]" />
                        {a}
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium">Meals Included</label>
                  <div className="mt-1 space-y-1">
                    {MEALS_LIST.map((m) => (
                      <label key={m} className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={form.accommodation.meals_included.includes(m)} onChange={(e) => setForm((prev) => ({ ...prev, accommodation: { ...prev.accommodation, meals_included: e.target.checked ? [...prev.accommodation.meals_included, m] : prev.accommodation.meals_included.filter((x) => x !== m) } }))} className="accent-[#2C5F8A]" />
                        {m}
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium">Nearby Attractions</label>
                  <textarea value={form.accommodation.nearby_attractions} onChange={(e) => setForm((prev) => ({ ...prev, accommodation: { ...prev.accommodation, nearby_attractions: e.target.value } }))} className="w-full mt-0.5 px-3 py-2 border border-input rounded-lg text-sm" rows={2} placeholder="e.g. Dal Lake, Shankaracharya Temple, Mughal Gardens" />
                </div>
              </div>
            )}
            {form.category === 'taxi' && (
              <div className="space-y-3 p-3 bg-secondary rounded-lg">
                <h3 className="text-sm font-semibold">Vehicle & Driver Details</h3>
                <div>
                  <label className="text-xs font-medium">Driver Name *</label>
                  <input value={form.taxi.driver_name} onChange={(e) => setForm((prev) => ({ ...prev, taxi: { ...prev.taxi, driver_name: e.target.value } }))} className="w-full mt-0.5 px-3 py-2 border border-input rounded-lg text-sm" />
                </div>
                <div>
                  <label className="text-xs font-medium">Vehicle Type *</label>
                  <select value={form.taxi.vehicle_type} onChange={(e) => setForm((prev) => ({ ...prev, taxi: { ...prev.taxi, vehicle_type: e.target.value } }))} className="w-full mt-0.5 px-3 py-2 border border-input rounded-lg text-sm bg-card">
                    <option value="">Select vehicle type</option>
                    <option value="sedan">Sedan</option>
                    <option value="suv">SUV</option>
                    <option value="tempo">Tempo Traveller</option>
                    <option value="van">Van</option>
                    <option value="auto">Auto Rickshaw</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium">Vehicle Model</label>
                  <input value={form.taxi.vehicle_model} onChange={(e) => setForm((prev) => ({ ...prev, taxi: { ...prev.taxi, vehicle_model: e.target.value } }))} className="w-full mt-0.5 px-3 py-2 border border-input rounded-lg text-sm" placeholder="e.g. Dzire, Innova, Ertiga" />
                </div>
                <div>
                  <label className="text-xs font-medium">Registration Number *</label>
                  <input value={form.taxi.registration_number} onChange={(e) => setForm((prev) => ({ ...prev, taxi: { ...prev.taxi, registration_number: e.target.value } }))} className="w-full mt-0.5 px-3 py-2 border border-input rounded-lg text-sm" placeholder="e.g. JK01AB1234" />
                </div>
                <div>
                  <label className="text-xs font-medium">Operating Areas</label>
                  <div className="mt-1 space-y-1">
                    {KASHMIR_AREAS.map((area) => (
                      <label key={area} className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={form.taxi.operating_areas.includes(area)} onChange={(e) => setForm((prev) => ({ ...prev, taxi: { ...prev.taxi, operating_areas: e.target.checked ? [...prev.taxi.operating_areas, area] : prev.taxi.operating_areas.filter((a) => a !== area) } }))} className="rounded" />
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
                        <input type="checkbox" checked={form.taxi.languages.includes(lang)} onChange={(e) => setForm((prev) => ({ ...prev, taxi: { ...prev.taxi, languages: e.target.checked ? [...prev.taxi.languages, lang] : prev.taxi.languages.filter((l) => l !== lang) } }))} className="rounded" />
                        {lang}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}
            {form.category === 'guide' && (
              <div className="space-y-3 p-3 bg-secondary rounded-lg">
                <h3 className="text-sm font-semibold">Guide Details</h3>
                <div>
                  <label className="text-xs font-medium">Full Name *</label>
                  <input value={form.guide.full_name} onChange={(e) => setForm((prev) => ({ ...prev, guide: { ...prev.guide, full_name: e.target.value } }))} className="w-full mt-0.5 px-3 py-2 border border-input rounded-lg text-sm" />
                </div>
                <div>
                  <label className="text-xs font-medium">Contact Number *</label>
                  <input value={form.guide.contact_number} onChange={(e) => setForm((prev) => ({ ...prev, guide: { ...prev.guide, contact_number: e.target.value } }))} className="w-full mt-0.5 px-3 py-2 border border-input rounded-lg text-sm" />
                </div>
                <div>
                  <label className="text-xs font-medium">WhatsApp Number</label>
                  <input value={form.guide.whatsapp_number} onChange={(e) => setForm((prev) => ({ ...prev, guide: { ...prev.guide, whatsapp_number: e.target.value } }))} className="w-full mt-0.5 px-3 py-2 border border-input rounded-lg text-sm" />
                </div>
                <div>
                  <label className="text-xs font-medium">Languages Spoken</label>
                  <div className="mt-1 space-y-1">
                    {GUIDE_LANGUAGES.map((lang) => (
                      <label key={lang} className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={form.guide.languages.includes(lang)} onChange={(e) => setForm((prev) => ({ ...prev, guide: { ...prev.guide, languages: e.target.checked ? [...prev.guide.languages, lang] : prev.guide.languages.filter((l) => l !== lang) } }))} className="accent-[#2C5F8A]" />
                        {lang}
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium">Specialties</label>
                  <div className="mt-1 space-y-1">
                    {GUIDE_SPECIALTIES.map((s) => (
                      <label key={s} className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={form.guide.specialties.includes(s)} onChange={(e) => setForm((prev) => ({ ...prev, guide: { ...prev.guide, specialties: e.target.checked ? [...prev.guide.specialties, s] : prev.guide.specialties.filter((x) => x !== s) } }))} className="accent-[#2C5F8A]" />
                        {s}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}
            {form.category === 'vendor' && (
              <div className="space-y-3 p-3 bg-secondary rounded-lg">
                <h3 className="text-sm font-semibold">Vendor Details</h3>
                <div>
                  <label className="text-xs font-medium">Business Name *</label>
                  <input value={form.vendor.business_name} onChange={(e) => setForm((prev) => ({ ...prev, vendor: { ...prev.vendor, business_name: e.target.value } }))} className="w-full mt-0.5 px-3 py-2 border border-input rounded-lg text-sm" />
                </div>
                <div>
                  <label className="text-xs font-medium">Owner Name</label>
                  <input value={form.vendor.owner_name} onChange={(e) => setForm((prev) => ({ ...prev, vendor: { ...prev.vendor, owner_name: e.target.value } }))} className="w-full mt-0.5 px-3 py-2 border border-input rounded-lg text-sm" />
                </div>
                <div>
                  <label className="text-xs font-medium">Contact Number *</label>
                  <input value={form.vendor.contact_number} onChange={(e) => setForm((prev) => ({ ...prev, vendor: { ...prev.vendor, contact_number: e.target.value } }))} className="w-full mt-0.5 px-3 py-2 border border-input rounded-lg text-sm" />
                </div>
                <div>
                  <label className="text-xs font-medium">WhatsApp Number</label>
                  <input value={form.vendor.whatsapp_number} onChange={(e) => setForm((prev) => ({ ...prev, vendor: { ...prev.vendor, whatsapp_number: e.target.value } }))} className="w-full mt-0.5 px-3 py-2 border border-input rounded-lg text-sm" />
                </div>
                <div>
                  <label className="text-xs font-medium">Business Type</label>
                  <select value={form.vendor.business_type} onChange={(e) => setForm((prev) => ({ ...prev, vendor: { ...prev.vendor, business_type: e.target.value } }))} className="w-full mt-0.5 px-3 py-2 border border-input rounded-lg text-sm bg-card">
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
                    {VENDOR_SPECIALTIES.map((s) => (
                      <label key={s} className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={form.vendor.specialties.includes(s)} onChange={(e) => setForm((prev) => ({ ...prev, vendor: { ...prev.vendor, specialties: e.target.checked ? [...prev.vendor.specialties, s] : prev.vendor.specialties.filter((x) => x !== s) } }))} className="accent-[#2C5F8A]" />
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
                className="w-full mt-1 px-4 py-3 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                rows={3}
                maxLength={500}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(0)} className="flex-1">
                <ArrowLeft className="w-4 h-4 mr-1" /> Back
              </Button>
              <Button onClick={handleStep1Next} className="flex-1" disabled={!form.name || !form.phone || (form.category === 'houseboat' && !form.boat_ghat) || (form.category === 'shikara' && !form.shikara.ghat_number) || checkingDuplicate}>
                {checkingDuplicate ? 'Checking...' : 'Next'} <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
            {existingOperator && (
              <div className="p-4 rounded-lg border border-border space-y-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0 text-destructive" />
                  <div className="text-sm text-destructive">
                    <p className="font-medium">"{existingOperator.name}" is already registered with this number.</p>
                    <p className="text-muted-foreground mt-1">Verify your WhatsApp to claim and manage this profile.</p>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-secondary/50 text-sm space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">WhatsApp</span>
                    <span className="font-medium">{form.phone}</span>
                  </div>
                  {!claimSent ? (
                    <Button onClick={handleClaimSendOtp} disabled={claimLoading} size="sm" className="w-full mt-1">
                      {claimLoading ? 'Sending...' : 'Send OTP to WhatsApp'}
                    </Button>
                  ) : (
                    <div className="space-y-2 mt-2">
                      <p className="text-xs text-muted-foreground">Enter the 6-digit code sent to your WhatsApp</p>
                      <input
                        value={claimOtp}
                        onChange={(e) => setClaimOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="000000"
                        className="w-full px-3 py-2 text-center text-lg tracking-widest border border-input rounded-lg"
                        maxLength={6}
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <Button onClick={handleClaimVerify} disabled={claimLoading || claimOtp.length !== 6} size="sm" className="flex-1">
                          {claimLoading ? 'Verifying...' : 'Verify & Claim Profile'}
                        </Button>
                        <Button onClick={handleClaimSendOtp} disabled={claimLoading} variant="outline" size="sm">
                          Resend
                        </Button>
                      </div>
                    </div>
                  )}
                  {claimError && (
                    <p className="text-xs text-destructive mt-1">{claimError}</p>
                  )}
                </div>
                <div className="text-center">
                  <Link href="/auth/login" className="text-xs text-accent hover:underline">
                    Already have an account? Sign in
                  </Link>
                </div>
              </div>
            )}
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
                className="w-full mt-1 px-4 py-3 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
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
                className="w-full mt-1 px-4 py-3 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder={form.category === 'shikara' ? 'e.g. ₹500/hour, contact for actual offers' : 'e.g. ₹2000/night/room, contact for actual offers'}
                maxLength={300}
              />
            </div>
            {form.category === 'shikara' && (
              <div className="space-y-3 p-3 bg-secondary rounded-lg">
                <h3 className="text-sm font-semibold">Section 2: About You</h3>
                <div>
                  <label className="text-xs font-medium">Years of Experience</label>
                  <input value={form.shikara.years_experience} onChange={(e) => setForm((prev) => ({ ...prev, shikara: { ...prev.shikara, years_experience: e.target.value } }))} className="w-full mt-0.5 px-3 py-2 border border-input rounded-lg text-sm" />
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
                  <select value={form.shikara.tour_duration} onChange={(e) => setForm((prev) => ({ ...prev, shikara: { ...prev.shikara, tour_duration: e.target.value } }))} className="w-full mt-0.5 px-3 py-2 border border-input rounded-lg text-sm bg-card">
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
                    <input value={form.shikara.registration_number} onChange={(e) => setForm((prev) => ({ ...prev, shikara: { ...prev.shikara, registration_number: e.target.value } }))} className="w-full mt-0.5 px-3 py-2 border border-input rounded-lg text-sm" />
                  </div>
                )}
              </div>
            )}
            {form.category === 'shikara' && (
              <div className="space-y-3 p-3 bg-secondary rounded-lg">
                <h3 className="text-sm font-semibold">Pricing</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium">Price per Ride (₹)</label>
                    <input value={form.shikara.price_per_ride} onChange={(e) => setForm((prev) => ({ ...prev, shikara: { ...prev.shikara, price_per_ride: e.target.value } }))} className="w-full mt-0.5 px-3 py-2 border border-input rounded-lg text-sm" placeholder="₹" />
                  </div>
                  <div>
                    <label className="text-xs font-medium">Price per Hour (₹)</label>
                    <input value={form.shikara.price_per_hour} onChange={(e) => setForm((prev) => ({ ...prev, shikara: { ...prev.shikara, price_per_hour: e.target.value } }))} className="w-full mt-0.5 px-3 py-2 border border-input rounded-lg text-sm" placeholder="₹" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium">Price Note (Optional)</label>
                  <textarea value={form.shikara.price_note} onChange={(e) => setForm((prev) => ({ ...prev, shikara: { ...prev.shikara, price_note: e.target.value } }))} className="w-full mt-0.5 px-3 py-2 border border-input rounded-lg text-sm" rows={2} placeholder="e.g. Contact for group discounts" />
                </div>
              </div>
            )}
            {form.category === 'artisan' && (
              <div className="space-y-3 p-3 bg-secondary rounded-lg">
                <h3 className="text-sm font-semibold">Owner Information</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium">Owner Name *</label>
                    <input value={form.artisan.owner_name} onChange={(e) => setForm((prev) => ({ ...prev, artisan: { ...prev.artisan, owner_name: e.target.value } }))} className="w-full mt-0.5 px-3 py-2 border border-input rounded-lg text-sm" />
                  </div>
                  <div>
                    <label className="text-xs font-medium">Contact Number *</label>
                    <input value={form.artisan.contact_number} onChange={(e) => setForm((prev) => ({ ...prev, artisan: { ...prev.artisan, contact_number: e.target.value } }))} className="w-full mt-0.5 px-3 py-2 border border-input rounded-lg text-sm" />
                  </div>
                  <div>
                    <label className="text-xs font-medium">WhatsApp Number</label>
                    <input value={form.artisan.whatsapp_number} onChange={(e) => setForm((prev) => ({ ...prev, artisan: { ...prev.artisan, whatsapp_number: e.target.value } }))} className="w-full mt-0.5 px-3 py-2 border border-input rounded-lg text-sm" />
                  </div>
                  <div>
                    <label className="text-xs font-medium">Email Address</label>
                    <input type="email" value={form.artisan.email_address} onChange={(e) => setForm((prev) => ({ ...prev, artisan: { ...prev.artisan, email_address: e.target.value } }))} className="w-full mt-0.5 px-3 py-2 border border-input rounded-lg text-sm" />
                  </div>
                  <div>
                    <label className="text-xs font-medium">Website (Optional)</label>
                    <input value={form.artisan.website} onChange={(e) => setForm((prev) => ({ ...prev, artisan: { ...prev.artisan, website: e.target.value } }))} className="w-full mt-0.5 px-3 py-2 border border-input rounded-lg text-sm" placeholder="https://" />
                  </div>
                  <div>
                    <label className="text-xs font-medium">GST Number (Optional)</label>
                    <input value={form.artisan.gst_number} onChange={(e) => setForm((prev) => ({ ...prev, artisan: { ...prev.artisan, gst_number: e.target.value } }))} className="w-full mt-0.5 px-3 py-2 border border-input rounded-lg text-sm" />
                  </div>
                  <div>
                    <label className="text-xs font-medium">Export License Number (Optional)</label>
                    <input value={form.artisan.export_license} onChange={(e) => setForm((prev) => ({ ...prev, artisan: { ...prev.artisan, export_license: e.target.value } }))} className="w-full mt-0.5 px-3 py-2 border border-input rounded-lg text-sm" />
                  </div>
                  <div>
                    <label className="text-xs font-medium">Years in Business</label>
                    <input value={form.artisan.years_in_business} onChange={(e) => setForm((prev) => ({ ...prev, artisan: { ...prev.artisan, years_in_business: e.target.value } }))} className="w-full mt-0.5 px-3 py-2 border border-input rounded-lg text-sm" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium">Google Map Link</label>
                  <input value={form.artisan.google_maps} onChange={(e) => setForm((prev) => ({ ...prev, artisan: { ...prev.artisan, google_maps: e.target.value } }))} className="w-full mt-0.5 px-3 py-2 border border-input rounded-lg text-sm" placeholder="https://maps.google.com/?q=..." />
                </div>
              </div>
            )}
            {form.category === 'houseboat' && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold">Houseboat Tariffs (₹)</h3>
                <p className="text-xs text-muted-foreground">EP=Room only, CP=+Breakfast, MAP=+Breakfast&Dinner, AP=+Breakfast,Lunch&Dinner</p>
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
                      <label className="text-xs text-muted-foreground">{label}</label>
                      <input
                        value={(form.tariffs as any)[key]}
                        onChange={(e) => setForm((prev) => ({ ...prev, tariffs: { ...prev.tariffs, [key]: e.target.value } }))}
                        className="w-full mt-0.5 px-3 py-2 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        placeholder="₹"
                      />
                    </div>
                  ))}
                </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Tariff Note</label>
                    <textarea
                      value={form.tariffs.note}
                      onChange={(e) => setForm((prev) => ({ ...prev, tariffs: { ...prev.tariffs, note: e.target.value } }))}
                      className="w-full mt-0.5 px-3 py-2 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      rows={3}
                      placeholder="Children below 5 yrs FREE. Heating charges extra in winter @ ₹600/room/day"
                    />
                  </div>
              </div>
            )}
            {(form.category === 'homestay' || form.category === 'guest_house') && (
              <div className="space-y-3 p-3 bg-secondary rounded-lg">
                <h3 className="text-sm font-semibold">Pricing (₹ per night)</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium">Single Room</label>
                    <input value={form.accommodation.pricing_single} onChange={(e) => setForm((prev) => ({ ...prev, accommodation: { ...prev.accommodation, pricing_single: e.target.value } }))} className="w-full mt-0.5 px-3 py-2 border border-input rounded-lg text-sm" placeholder="₹" />
                  </div>
                  <div>
                    <label className="text-xs font-medium">Double Room</label>
                    <input value={form.accommodation.pricing_double} onChange={(e) => setForm((prev) => ({ ...prev, accommodation: { ...prev.accommodation, pricing_double: e.target.value } }))} className="w-full mt-0.5 px-3 py-2 border border-input rounded-lg text-sm" placeholder="₹" />
                  </div>
                </div>
              </div>
            )}
            {form.category === 'taxi' && (
              <div className="space-y-3 p-3 bg-secondary rounded-lg">
                <h3 className="text-sm font-semibold">Pricing & Tours</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium">Price per Km (₹)</label>
                    <input value={form.taxi.price_per_km} onChange={(e) => setForm((prev) => ({ ...prev, taxi: { ...prev.taxi, price_per_km: e.target.value } }))} className="w-full mt-0.5 px-3 py-2 border border-input rounded-lg text-sm" placeholder="₹" />
                  </div>
                  <div>
                    <label className="text-xs font-medium">Price per Day (₹)</label>
                    <input value={form.taxi.price_per_day} onChange={(e) => setForm((prev) => ({ ...prev, taxi: { ...prev.taxi, price_per_day: e.target.value } }))} className="w-full mt-0.5 px-3 py-2 border border-input rounded-lg text-sm" placeholder="₹ (8hrs/80km)" />
                  </div>
                  <div>
                    <label className="text-xs font-medium">Airport Flat Rate (₹)</label>
                    <input value={form.taxi.airport_flat_rate} onChange={(e) => setForm((prev) => ({ ...prev, taxi: { ...prev.taxi, airport_flat_rate: e.target.value } }))} className="w-full mt-0.5 px-3 py-2 border border-input rounded-lg text-sm" placeholder="₹" />
                  </div>
                  <div>
                    <label className="text-xs font-medium">Extra per Km (₹)</label>
                    <input value={form.taxi.extra_per_km} onChange={(e) => setForm((prev) => ({ ...prev, taxi: { ...prev.taxi, extra_per_km: e.target.value } }))} className="w-full mt-0.5 px-3 py-2 border border-input rounded-lg text-sm" placeholder="₹" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium">Tour Types</label>
                  <div className="mt-1 space-y-1">
                    {['Airport Transfer', 'Local Sightseeing', 'Day Trip', 'Multi-Day Tour', 'Pilgrimage', 'Adventure'].map((type) => (
                      <label key={type} className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={form.taxi.tour_types.includes(type)} onChange={(e) => setForm((prev) => ({ ...prev, taxi: { ...prev.taxi, tour_types: e.target.checked ? [...prev.taxi.tour_types, type] : prev.taxi.tour_types.filter((t) => t !== type) } }))} className="rounded" />
                        {type}
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium">Years of Experience</label>
                  <input value={form.taxi.years_experience} onChange={(e) => setForm((prev) => ({ ...prev, taxi: { ...prev.taxi, years_experience: e.target.value } }))} className="w-full mt-0.5 px-3 py-2 border border-input rounded-lg text-sm" placeholder="e.g. 5 years" />
                </div>
                <div>
                  <label className="text-xs font-medium">Google Map Link</label>
                  <input value={form.taxi.google_maps} onChange={(e) => setForm((prev) => ({ ...prev, taxi: { ...prev.taxi, google_maps: e.target.value } }))} className="w-full mt-0.5 px-3 py-2 border border-input rounded-lg text-sm" placeholder="https://maps.google.com/?q=..." />
                </div>
              </div>
            )}
            {form.category === 'guide' && (
              <div className="space-y-3 p-3 bg-secondary rounded-lg">
                <h3 className="text-sm font-semibold">About You</h3>
                <div>
                  <label className="text-xs font-medium">Years of Experience</label>
                  <input value={form.guide.years_experience} onChange={(e) => setForm((prev) => ({ ...prev, guide: { ...prev.guide, years_experience: e.target.value } }))} className="w-full mt-0.5 px-3 py-2 border border-input rounded-lg text-sm" placeholder="e.g. 5 years" />
                </div>
                <div>
                  <label className="text-xs font-medium">Certification</label>
                  <input value={form.guide.certification} onChange={(e) => setForm((prev) => ({ ...prev, guide: { ...prev.guide, certification: e.target.value } }))} className="w-full mt-0.5 px-3 py-2 border border-input rounded-lg text-sm" placeholder="e.g. JKTDC certified guide" />
                </div>
                <div>
                  <label className="text-xs font-medium">Operating Areas</label>
                  <div className="mt-1 space-y-1">
                    {KASHMIR_AREAS.map((area) => (
                      <label key={area} className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={form.guide.operating_areas.includes(area)} onChange={(e) => setForm((prev) => ({ ...prev, guide: { ...prev.guide, operating_areas: e.target.checked ? [...prev.guide.operating_areas, area] : prev.guide.operating_areas.filter((a) => a !== area) } }))} className="rounded" />
                        {area}
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium">Google Map Link</label>
                  <input value={form.guide.google_maps} onChange={(e) => setForm((prev) => ({ ...prev, guide: { ...prev.guide, google_maps: e.target.value } }))} className="w-full mt-0.5 px-3 py-2 border border-input rounded-lg text-sm" placeholder="https://maps.google.com/?q=..." />
                </div>
              </div>
            )}
            {form.category === 'vendor' && (
              <div className="space-y-3 p-3 bg-secondary rounded-lg">
                <h3 className="text-sm font-semibold">About Your Business</h3>
                <div>
                  <label className="text-xs font-medium">Email Address</label>
                  <input type="email" value={form.vendor.email} onChange={(e) => setForm((prev) => ({ ...prev, vendor: { ...prev.vendor, email: e.target.value } }))} className="w-full mt-0.5 px-3 py-2 border border-input rounded-lg text-sm" />
                </div>
                <div>
                  <label className="text-xs font-medium">Operating Areas</label>
                  <div className="mt-1 space-y-1">
                    {KASHMIR_AREAS.map((area) => (
                      <label key={area} className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={form.vendor.operating_areas.includes(area)} onChange={(e) => setForm((prev) => ({ ...prev, vendor: { ...prev.vendor, operating_areas: e.target.checked ? [...prev.vendor.operating_areas, area] : prev.vendor.operating_areas.filter((a) => a !== area) } }))} className="rounded" />
                        {area}
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium">Google Map Link</label>
                  <input value={form.vendor.google_maps} onChange={(e) => setForm((prev) => ({ ...prev, vendor: { ...prev.vendor, google_maps: e.target.value } }))} className="w-full mt-0.5 px-3 py-2 border border-input rounded-lg text-sm" placeholder="https://maps.google.com/?q=..." />
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
            <p className="text-sm text-muted-foreground">Upload 1-5 photos (max 5MB each)</p>
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
                <label className="aspect-square border-2 border-dashed border-input rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-[#2C5F8A]">
                  <Upload className="w-6 h-6 text-gray-400" />
                  <span className="text-xs text-muted-foreground mt-1">Add photo</span>
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
                      <strong>Maps:</strong> <a href={form.google_maps} target="_blank" rel="noopener noreferrer" className="text-accent underline text-xs">{form.google_maps}</a>
                    </div>
                  )}
                  <div>
                    <strong>Tariffs:</strong>
                    <div className="grid grid-cols-2 gap-1 mt-1 text-xs">
                      {Object.entries(form.tariffs).filter(([k, v]) => k !== 'note' && v).map(([k, v]) => (
                        <span key={k}>{k.replace('_', ' ')}: ₹{v}</span>
                      ))}
                    </div>
                    {form.tariffs.note && <p className="text-xs text-muted-foreground mt-1">{form.tariffs.note}</p>}
                  </div>
                  {form.hb_total_rooms && <div><strong>Rooms:</strong> {form.hb_total_rooms}</div>}
                  {form.hb_capacity && <div><strong>Capacity:</strong> {form.hb_capacity} guests</div>}
                  {form.hb_room_types.length > 0 && <div><strong>Room Types:</strong> {form.hb_room_types.join(', ')}</div>}
                  {form.hb_amenities.length > 0 && <div><strong>Amenities:</strong> {form.hb_amenities.join(', ')}</div>}
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
                  {form.shikara.price_per_ride && <div><strong>Per Ride:</strong> ₹{form.shikara.price_per_ride}</div>}
                  {form.shikara.price_per_hour && <div><strong>Per Hour:</strong> ₹{form.shikara.price_per_hour}</div>}
                  {form.shikara.price_note && <div><strong>Price Note:</strong> {form.shikara.price_note}</div>}
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
               {(form.category === 'homestay' || form.category === 'guest_house') && (
                  <>
                    <div><strong>Owner:</strong> {form.accommodation.owner_name || '—'}</div>
                    <div><strong>Contact:</strong> {form.accommodation.contact || '—'}</div>
                    <div><strong>Address:</strong> {form.accommodation.address || '—'}</div>
                    <div><strong>Total Rooms:</strong> {form.accommodation.total_rooms || '—'}</div>
                    {form.accommodation.room_types.length > 0 && <div><strong>Room Types:</strong> {form.accommodation.room_types.join(', ')}</div>}
                    {form.accommodation.amenities.length > 0 && <div><strong>Amenities:</strong> {form.accommodation.amenities.join(', ')}</div>}
                    {form.accommodation.meals_included.length > 0 && <div><strong>Meals:</strong> {form.accommodation.meals_included.join(', ')}</div>}
                    <div><strong>Single/Night:</strong> {form.accommodation.pricing_single ? `₹${form.accommodation.pricing_single}` : '—'}</div>
                    <div><strong>Double/Night:</strong> {form.accommodation.pricing_double ? `₹${form.accommodation.pricing_double}` : '—'}</div>
                  </>
                )}
                {form.category === 'taxi' && (
                  <>
                  <div><strong>Driver:</strong> {form.taxi.driver_name || '—'}</div>
                  <div><strong>Vehicle:</strong> {form.taxi.vehicle_type || '—'} {form.taxi.vehicle_model ? `(${form.taxi.vehicle_model})` : ''}</div>
                  <div><strong>Registration:</strong> {form.taxi.registration_number || '—'}</div>
                  {form.taxi.operating_areas.length > 0 && <div><strong>Areas:</strong> {form.taxi.operating_areas.join(', ')}</div>}
                  {form.taxi.languages.length > 0 && <div><strong>Languages:</strong> {form.taxi.languages.join(', ')}</div>}
                  {form.taxi.tour_types.length > 0 && <div><strong>Tours:</strong> {form.taxi.tour_types.join(', ')}</div>}
                  <div><strong>Per Km:</strong> {form.taxi.price_per_km ? `₹${form.taxi.price_per_km}` : '—'}</div>
                  <div><strong>Per Day:</strong> {form.taxi.price_per_day ? `₹${form.taxi.price_per_day}` : '—'}</div>
                  <div><strong>Airport:</strong> {form.taxi.airport_flat_rate ? `₹${form.taxi.airport_flat_rate}` : '—'}</div>
                  <div><strong>Extra/Km:</strong> {form.taxi.extra_per_km ? `₹${form.taxi.extra_per_km}` : '—'}</div>
                  {form.taxi.years_experience && <div><strong>Experience:</strong> {form.taxi.years_experience} years</div>}
                </>
              )}
              {form.category === 'guide' && (
                <>
                  <div><strong>Full Name:</strong> {form.guide.full_name || '—'}</div>
                  <div><strong>Contact:</strong> {form.guide.contact_number || '—'}</div>
                  <div><strong>WhatsApp:</strong> {form.guide.whatsapp_number || '—'}</div>
                  {form.guide.languages.length > 0 && <div><strong>Languages:</strong> {form.guide.languages.join(', ')}</div>}
                  {form.guide.specialties.length > 0 && <div><strong>Specialties:</strong> {form.guide.specialties.join(', ')}</div>}
                  {form.guide.years_experience && <div><strong>Experience:</strong> {form.guide.years_experience} years</div>}
                  {form.guide.certification && <div><strong>Certification:</strong> {form.guide.certification}</div>}
                  {form.guide.operating_areas.length > 0 && <div><strong>Areas:</strong> {form.guide.operating_areas.join(', ')}</div>}
                </>
              )}
              {form.category === 'vendor' && (
                <>
                  <div><strong>Business:</strong> {form.vendor.business_name || '—'}</div>
                  <div><strong>Owner:</strong> {form.vendor.owner_name || '—'}</div>
                  <div><strong>Contact:</strong> {form.vendor.contact_number || '—'}</div>
                  <div><strong>WhatsApp:</strong> {form.vendor.whatsapp_number || '—'}</div>
                  {form.vendor.business_type && <div><strong>Type:</strong> {form.vendor.business_type}</div>}
                  {form.vendor.specialties.length > 0 && <div><strong>Specialties:</strong> {form.vendor.specialties.join(', ')}</div>}
                  {form.vendor.operating_areas.length > 0 && <div><strong>Areas:</strong> {form.vendor.operating_areas.join(', ')}</div>}
                </>
              )}
              <p><strong>Photos:</strong> {form.photos.length} uploaded</p>
            </div>
            {submitError && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>{submitError}</span>
              </div>
            )}
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

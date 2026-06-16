export type CategorySlug = 'houseboat' | 'shikara' | 'artisan' | 'guide' | 'vendor';

export type OperatorStatus = 'pending' | 'approved' | 'rejected' | 'suspended';

export type Plan = 'free' | 'pro';

export type LeadSource = 'profile' | 'qr' | 'search';

export interface Category {
  slug: CategorySlug;
  label: string;
  icon: string;
  description: string;
  sort_order: number;
}

export interface Tariffs {
  double_ep?: string;
  double_cp?: string;
  double_map?: string;
  double_ap?: string;
  single_ep?: string;
  single_cp?: string;
  single_map?: string;
  single_ap?: string;
  note?: string;
}

export interface ShikaraDetails {
  full_name?: string | null;
  mobile_number?: string | null;
  whatsapp_number?: string | null;
  shikara_number?: string | null;
  ghat_number?: string | null;
  operating_areas?: string[] | null;
  years_experience?: string | null;
  languages?: string[] | null;
  services?: string[] | null;
  tour_duration?: string | null;
  registered_shikara?: string | null;
  registration_number?: string | null;
}

export interface ArtisanDetails {
  business_type?: string | null;
  specialties?: string[] | null;
  business_scale?: string | null;
  owner_name?: string | null;
  contact_number?: string | null;
  whatsapp_number?: string | null;
  email_address?: string | null;
  website?: string | null;
  gst_number?: string | null;
  export_license?: string | null;
  years_in_business?: string | null;
  google_maps?: string | null;
}

export interface HouseboatDetails {
  owner: string;
  address: string;
  contact: string;
  contact2: string;
  email: string;
  grade: string;
  google_maps: string;
  latitude?: string;
  longitude?: string;
  boat_ghat?: string | null;
  boat_ghat_lat?: number | null;
  boat_ghat_lng?: number | null;
}

export interface Operator {
  id: string;
  created_at: Date | null;
  updated_at: Date | null;
  user_id: string | null;
  slug: string;
  name: string;
  category: CategorySlug | null;
  short_desc: string | null;
  long_desc: string | null;
  whatsapp: string;
  pricing_note: string | null;
  status: OperatorStatus | null;
  verified: boolean | null;
  plan: Plan | null;
  lead_month: number | null;
  photos: string[] | null;
  tariffs: Tariffs | null;
  houseboat_details: HouseboatDetails | null;
  shikara_details: ShikaraDetails | null;
  artisan_details: ArtisanDetails | null;
  lat: number | null;
  lng: number | null;
}

export interface Lead {
  id: string;
  created_at: Date | null;
  operator_id: string;
  session_id: string;
  source: LeadSource;
}

export interface Favorite {
  id: string;
  user_id: string;
  operator_id: string;
  created_at: Date | null;
}

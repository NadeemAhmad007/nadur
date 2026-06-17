# Screen Inventory

## 1. Browse Page (Home) (`/`)

| Property | Value |
|----------|-------|
| **File** | `src/app/page.tsx` (renders `src/components/browse-page.tsx`) |
| **Type** | Server Component wrapper, client component for BrowsePage |
| **Auth Required** | No |
| **Features** | - Search bar (full-text) |
| | - Category filter pills (All/Houseboats/Shikara Rides/Artisans & Crafts/Local Guides/Floating Vendors) |
| | - "Near Me" button (geolocation with 10km hardcoded radius) |
| | - Infinite-scroll "Load More" pagination |
| | - Loading skeleton grid (6 cards) |
| | - Empty state with "No operators found" |
| **Data Source** | `GET /api/operators` with query params: `q`, `category`, `lat`, `lng` |
| **State** | - Loading: skeleton grid |
| | - Empty: "No operators found" message |
| | - Error: error toast |
| | - Geolocation prompt (browser permission) |

---

## 2. Search Page (`/search`)

| Property | Value |
|----------|-------|
| **File** | `src/app/search/page.tsx` |
| **Type** | Client Component (Suspense-based) |
| **Auth Required** | No |
| **Features** | - Reads `?q=` query param |
| | - Fetches `/api/operators?q=...` |
| | - Renders OperatorCard grid |
| **Data Source** | `GET /api/operators?q={query}` |

---

## 3. Operator Profile Page (`/o/[slug]`)

| Property | Value |
|----------|-------|
| **File** | `src/app/o/[slug]/page.tsx` (renders `src/components/operator-profile.tsx`) |
| **Type** | Server Component (force-dynamic), client component for profile |
| **Auth Required** | No |
| **Sections** | 1. Hero: name, category badge, short_desc, verified badge |
| | 2. Photo gallery (prev/next arrows, dot indicators, optional heart/favorite toggle + share button) |
| | 3. Long description |
| | 4. Category-specific section (houseboat_details, shikara_details, artisan_details) |
| | 5. Pricing / tariffs |
| | 6. Contact: WhatsApp deep link button (also tracks lead via POST /api/leads) |
| **Data Source** | Direct DB query by slug, then client renders operator-profile |
| **State** | - Not found: 404 redirect |
| | - WhatsApp lead: shows blocked state if free-plan limit reached |
| **WhatsApp** | Deep link: `https://wa.me/{whatsapp}?text={encoded_message}` |

---

## 4. Join Page (`/join`)

| Property | Value |
|----------|-------|
| **File** | `src/app/join/page.tsx` |
| **Type** | Client Component |
| **Auth Required** | No |
| **Features** | - 5-step multi-step registration wizard |
| | - Steps: Email → Business → Description → Photos → Review |
| | - Supports 3 categories: houseboat, shikara, artisan |
| | - Email OTP verification during registration |
| | - `browser-image-compression` before upload |
| | - Submits to `POST /api/operators` |
| **Validation** | - Required: name, whatsapp, category |
| | - WhatsApp: phone format validation |
| **On Success** | Redirect to login with success message |

---

## 5. Login Page (`/auth/login`)

| Property | Value |
|----------|-------|
| **File** | `src/app/auth/login/page.tsx` |
| **Type** | Client Component |
| **Auth Required** | No (redirects if already authenticated) |
| **Tabs** | 1. **Email OTP** — email input + "Send OTP" + OTP input (6 digits) |
| | 2. **WhatsApp OTP** — phone input + "Send OTP" + OTP input |
| **Additional** | Google OAuth button, "forgot email" lookup link |
| **Edge Cases** | Stale session detection: if session exists but lacks `operator_id`, calls `signOut()` then redirects to login |

---

## 6. Operator Dashboard (`/portal`)

| Property | Value |
|----------|-------|
| **File** | `src/app/portal/page.tsx` |
| **Type** | Client Component |
| **Auth Required** | Yes (guarded by `proxy.ts`) |
| **Fetches** | Operator data by session, leads by operator_id |
| **Sections** | 1. Profile completion score with missing fields checklist |
| | 2. Lead counters (this month / total), trend (this week vs last week) |
| | 3. Quick actions (Edit Profile, QR Code) |
| | 4. Recent leads list |
| | 5. Upgrade-to-pro prompt |
| | 6. Free-plan lead limit warning (3/month) |
| **Profile Completion** | 8 fields at 12.5% each: name, short_desc, long_desc, photos, tariffs, category_details, lat, lng |

---

## 7. Edit Profile (`/portal/edit`)

| Property | Value |
|----------|-------|
| **File** | `src/app/portal/edit/page.tsx` |
| **Type** | Client Component |
| **Auth Required** | Yes |
| **Fetches** | `GET /api/operators/[slug]` (by operator's slug) |
| **Form Sections** | 1. **Basic Info:** name, slug (auto), short_desc, long_desc, pricing_note |
| | 2. **Contact:** whatsapp, email (with re-verify OTP) |
| | 3. **Category-specific:** |
| | - houseboat: owner, address, contact, contact2, email, grade, google_maps, lat/lng, boat_ghat, amenities, rooms |
| | - shikara: full_name, mobile_number, whatsapp_number, shikara_number, ghat_number, operating_areas, years_experience, languages, services, tour_duration, registered_shikara, registration_number |
| | - artisan: business_type, specialties, business_scale, owner_name, contact_number, whatsapp_number, email_address, website, gst_number, export_license, years_in_business, google_maps |
| | 4. **Tariffs:** houseboat tariff table (double/single EP/CP/MAP/AP) |
| | 5. **Photos:** custom file upload → `/api/upload/photo` → Cloudinary, max 5 photos |
| **Save** | `PATCH /api/operators/[slug]`; changing photos/tariffs/details resets status to `pending` |

---

## 8. Favorites Page (`/favorites`)

| Property | Value |
|----------|-------|
| **File** | `src/app/favorites/page.tsx` |
| **Type** | Client Component |
| **Auth Required** | No (uses localStorage) |
| **Data Source** | Reads `nadur-favorites` from localStorage, fetches operator names by ID for display |

---

## 9. Admin Panel (`/admin`)

| Property | Value |
|----------|-------|
| **File** | `src/app/admin/page.tsx` |
| **Type** | Client Component |
| **Auth Required** | Yes + `is_admin` check (client-side and proxy) |
| **Fetches** | `GET /api/admin/operators` |
| **Sections** | 1. Stat cards (pending/approved/rejected/total counts) |
| | 2. Link buttons to filtered operator lists |
| | 3. Latest 10 pending operators list |
| **Actions** | Navigate to `/admin/operators` for full management |

---

## 10. Admin Operators List (`/admin/operators`)

| Property | Value |
|----------|-------|
| **File** | `src/app/admin/operators/page.tsx` |
| **Type** | Client Component (Suspense) |
| **Auth Required** | Yes + admin |
| **Features** | - Filter by `?status=` and `?verified=` |
| | - Status and email-verified badges |
| | - Links to operator detail page |

---

## 11. Admin Operator Detail (`/admin/operators/[id]`)

| Property | Value |
|----------|-------|
| **File** | `src/app/admin/operators/[id]/page.tsx` |
| **Type** | Client Component |
| **Auth Required** | Yes + admin |
| **Actions** | Approve, Reject (with reason dropdown), Suspend, Verify/Unverify, Change Plan, Reset Lead Counter |
| **Data** | Full operator data: photos, tariffs, category details |

---

## 12. Admin Categories (`/admin/categories`)

| Property | Value |
|----------|-------|
| **File** | `src/app/admin/categories/page.tsx` |
| **Type** | Client Component |
| **Auth Required** | Yes + admin |
| **Content** | Lists 5 hardcoded categories (houseboat, shikara, artisan, guide, vendor) |

---

## 13. Other Pages

| Page | File | Notes |
|------|------|-------|
| Privacy Policy | `src/app/privacy/page.tsx` | Static server component |
| Terms of Service | `src/app/terms/page.tsx` | Static server component |
| Offline (PWA) | `src/app/offline/page.tsx` | Server component |
| Suspended | `src/app/suspended/page.tsx` | Shown when profile is suspended |
| 404 | `src/app/not-found.tsx` | Custom 404 with compass icon |

---

## 14. Shared Components

### operator-card.tsx
- Props: `operator: Operator`
- Renders: Photo (aspect 4:3, or "No photo" placeholder), name, category badge, verified badge, truncated short_desc, action buttons: "Open in Maps" (Google Maps), "Chat on WhatsApp" (wa.me), "View Profile"
- Used in: Browse page (home), Search page, Favorites page

### browse-page.tsx
- Self-contained browse experience with search, category pills, Near Me, infinite-scroll load more
- States: loading (6 skeleton cards), empty ("No operators found"), error toast

### operator-profile.tsx
- Self-contained profile view with photo gallery, details, favorite toggle, share, WhatsApp lead button
- States: loading, not-found, error
- Lead tracking: POST /api/leads, shows blocked state if free-plan limit reached

### ui/button.tsx
- 6 variants: primary, secondary, outline, ghost, danger, accent
- 4 sizes: sm, md, lg, icon
- Uses `cn()` for Tailwind class merging

### ui/card.tsx
- `Card`, `CardHeader`, `CardContent` with forwardRef
- Standard shadcn/ui card styling (rounded-xl, border, shadow)

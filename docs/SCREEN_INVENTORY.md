# Screen Inventory

## 1. Landing Page (`/`)

| Property | Value |
|----------|-------|
| **File** | `src/app/page.tsx` |
| **Type** | Server Component (no `"use client"`) |
| **Auth Required** | No |
| **Sections** | 1. Hero (title, subtitle, CTA buttons: Browse, Join) |
| | 2. "How It Works" (3-step diagram) |
| | 3. Categories grid (5 cards with icons, links to /[category]) |
| | 4. Testimonials carousel (hardcoded or from DB — INFERRED) |
| | 5. Footer |
| **SEO** | Basic metadata in root layout |
| **State** | Static (no data fetching) |

---

## 2. Browse Page (`/browse`)

| Property | Value |
|----------|-------|
| **File** | `src/components/browse-page.tsx` (client component imported by `src/app/browse/page.tsx`) |
| **Type** | Client Component |
| **Auth Required** | No |
| **Features** | - Search bar (full-text) |
| | - Category filter buttons |
| | - "Near Me" button (geolocation) |
| | - Radius slider (when Near Me active) |
| | - Result grid of operator cards |
| | - Loading skeleton |
| | - Empty state ("No operators found") |
| **Data Source** | `GET /api/operators` with query params: `search`, `category`, `lat`, `lng`, `radius` |
| **State** | - Loading: skeleton grid |
| | - Empty: "No operators found" message |
| | - Error: error message (INFERRED) |
| | - Geolocation prompt (browser permission) |
| **Query Params** | `?category=`, `?search=`, `?lat=`, `?lng=`, `?radius=` (URL-driven state) |

---

## 3. Category Listing Pages (`/[category]`)

| Property | Value |
|----------|-------|
| **Files** | `src/app/[category]/page.tsx` (5 dynamic routes) |
| **Type** | Server Component |
| **Auth Required** | No |
| **Categories** | `houseboat`, `shikara`, `artisan`, `guide`, `vendor` |
| **Features** | - Category title |
| | - Description/intro |
| | - Operator cards grid |
| **Data Source** | `GET /api/operators?category={slug}` |
| **Note** | Each category may have custom intro text (hardcoded per file) |

---

## 4. Operator Profile Page (`/op/[slug]`)

| Property | Value |
|----------|-------|
| **File** | `src/components/operator-profile.tsx` (client component imported by `src/app/op/[slug]/page.tsx`) |
| **Type** | Client Component |
| **Auth Required** | No |
| **Sections** | 1. Hero: name, category badge, short_desc |
| | 2. Photo gallery (Cloudinary images, carousel) |
| | 3. Long description |
| | 4. Category-specific section (houseboat_details, shikara_details) |
| | 5. Pricing / tariffs |
| | 6. Map (Leaflet with marker) |
| | 7. Contact: WhatsApp button, lead form |
| **Data Source** | `GET /api/operators/[slug]` |
| **State** | - Loading: spinner/skeleton |
| | - Not found: 404 message |
| | - Error: error message |
| **WhatsApp** | Deep link: `https://wa.me/{whatsapp}?text={encoded_message}` |

---

## 5. Join Page (`/join`)

| Property | Value |
|----------|-------|
| **File** | `src/app/join/page.tsx` |
| **Type** | Client Component |
| **Auth Required** | No |
| **Features** | - Multi-field form |
| | - Name, WhatsApp number, Email, Category (dropdown: houseboat/shikara/artisan/guide/vendor) |
| | - Short description, Long description, Pricing note |
| | - Slug auto-generation from name |
| | - Terms acceptance checkbox |
| | - Submit button |
| **Validation** | - Required: name, whatsapp, category |
| | - WhatsApp: phone format (INFERRED validation) |
| **On Success** | Redirect to `/auth/login` with success message |
| **On Error** | Display error message from API |

---

## 6. Login Page (`/auth/login`)

| Property | Value |
|----------|-------|
| **File** | `src/app/auth/login/page.tsx` |
| **Type** | Client Component (contains `"use client"`) |
| **Auth Required** | No (redirects if already authenticated) |
| **Tabs** | 1. **Google OAuth** — "Sign in with Google" button |
| | 2. **Email OTP** — email input + "Send OTP" + OTP input |
| | 3. **WhatsApp OTP** — phone input + "Send OTP" + OTP input |
| **Edge Cases** | - Stale session detection: if session exists but lacks `operator_id`, calls `signOut()` then redirects to login |
| | - Rate-limited OTP resend (60-second cooldown — INFERRED) |
| | - Auto-submit OTP on 6 digits entered |

---

## 7. Operator Dashboard (`/portal`)

| Property | Value |
|----------|-------|
| **File** | `src/app/portal/page.tsx` |
| **Type** | Client Component |
| **Auth Required** | Yes (guarded by `proxy.ts`) |
| **Fetches** | - `/api/operators?email={email}` (or fallback by `operator_id`) |
| | - `/api/leads?operator_id={id}` (INFERRED) |
| **Sections** | 1. Welcome header with operator name |
| | 2. Profile completion score (progress bar: 0-100%) |
| | 3. Completion checklist (missing fields) |
| | 4. Leads count badge |
| | 5. Recent leads list (name, message, date) |
| | 6. "Edit Profile" button → `/portal/edit` |
| | 7. "View Public Profile" link → `/op/[slug]` |
| **Profile Completion** | Calculated fields: name, short_desc, long_desc, photos, category details, tariffs, lat/lng (each field = partial %) |

---

## 8. Edit Profile (`/portal/edit`)

| Property | Value |
|----------|-------|
| **File** | `src/app/portal/edit/page.tsx` |
| **Type** | Client Component |
| **Auth Required** | Yes |
| **Fetches** | `GET /api/operators/[slug]` (by operator's slug) |
| **Form Sections** | 1. **Basic Info:** name, slug (auto), short_desc, long_desc |
| | 2. **Contact:** whatsapp, email |
| | 3. **Category-specific:** |
| | - houseboat: rooms, amenities, check_in, check_out |
| | - shikara: routes, durations, capacities |
| | - artisan: craft type, materials, custom_quote |
| | 4. **Pricing:** tariffs JSON (dynamic key-value pairs) |
| | 5. **Photos:** Cloudinary upload widget, sortable gallery |
| | 6. **Location:** lat/lng (manual input or map picker) |
| **Save** | `PATCH /api/operators/[slug]` with all form fields |
| **Validation** | - Name required (min 2 chars) |
| | - WhatsApp required (valid phone) |
| | - Slug: auto-generated, must be unique |
| **Photo Upload** | Via `CldUploadButton` (Cloudinary) — opens file picker, uploads directly to Cloudinary, returns secure_url |

---

## 9. Admin Panel (`/admin`)

| Property | Value |
|----------|-------|
| **File** | `src/app/admin/page.tsx` |
| **Type** | Client Component |
| **Auth Required** | Yes + `is_admin` check (client-side and proxy) |
| **Fetches** | `GET /api/admin/operators` |
| **Sections** | 1. Operators table (columns: name, category, status, leads count, created date) |
| | 2. Action buttons per row: Approve, Reject, Suspend |
| | 3. Status filter: All / Pending / Approved / Rejected / Suspended |
| | 4. Leaderboard: operators sorted by lead count descending |
| **Actions** | `PATCH /api/admin/operators/[id]` with `{ status }` |
| **Admin Email** | Hardcoded: `nadeemkolu22@gmail.com` |

---

## 10. 404 Page (`/not-found`)

| Property | Value |
|----------|-------|
| **File** | `src/app/not-found.tsx` |
| **Type** | Server Component |
| **Content** | - "Page not found" heading |
| | - Description text |
| | - "Go Home" button linking to / |

---

## 11. Portal Layout (`/portal` layout)

| Property | Value |
|----------|-------|
| **File** | `src/app/portal/layout.tsx` |
| **Type** | Client Component |
| **Features** | - Sidebar navigation |
| | - Nav items: Dashboard, Edit Profile, View Profile, Logout |
| | - Responsive: sidebar collapses on mobile (Sheet drawer) |

---

## 12. Root Layout (`/` layout)

| Property | Value |
|----------|-------|
| **File** | `src/app/layout.tsx` |
| **Type** | Server Component |
| **Features** | - Imports `globals.css` |
| | - Geist font via `next/font/google` |
| | - Metadata: title template "%s | Nadurr", description |
| | - Children wrapper |
| | - SessionProvider (NextAuth) wrapping children |
| | - Toaster (Sonner) component |

---

## 13. Shared Components

### operator-card.tsx
- Props: `operator` object
- Renders: Photo thumbnail, name, category badge, short_desc, rating stars (INFERRED), "View Profile" + "WhatsApp" buttons
- Used in: Browse page, category pages

### browse-page.tsx
- Self-contained browse experience
- Contains search, filter, Near Me, results grid, pagination (INFERRED)
- States: loading, empty, error, geolocation-prompt

### operator-profile.tsx
- Self-contained profile view
- Contains gallery, details, map, lead form
- States: loading, not-found, error
- Lead form: POST /api/leads, shows success toast

### ui/*.tsx (shadcn/ui components)
- button.tsx, card.tsx, badge.tsx, input.tsx, dialog.tsx, sheet.tsx
- textarea.tsx, skeleton.tsx
- Standard shadcn/ui v4 variants with Tailwind CSS

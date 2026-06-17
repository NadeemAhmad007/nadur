# Feature Specifications

## Feature 1: Public Directory / Browse

### Overview
The core discovery feature allowing visitors to browse, search, and filter operators on Dal Lake.

### Technical Implementation
- **Page:** `/` — uses `src/components/browse-page.tsx` (Client Component)
- **Data:** `GET /api/operators` with query parameters
- **State management:** URL search params (`useSearchParams`)

### UI States

| State | Trigger | UI |
|-------|---------|-----|
| **Loading** | Initial page load or new search | Grid of 6 skeleton cards (`animate-pulse`) |
| **Empty** | No operators match filters | "No operators found" message |
| **Error** | API returns error | Error toast via Sonner |
| **Geolocation Prompt** | User clicks "Near Me" | Browser permission dialog |
| **Results** | Operators found | Grid of operator cards with photo, name, badge, short_desc, CTAs |
| **Results + Near Me** | Geolocation active | Same grid (no distance indicator) |

### Filter Behavior
- **Category filter:** URL-driven (`?category=houseboat`). Clicking a category pill sets param; "All" clears it.
- **Search:** Debounced input (300ms). Updates `?q=query` in URL.
- **Near Me:** Requests geolocation, sets `?lat=...&lng=...` with 10km hardcoded radius.
- **Combined filters:** All active params applied simultaneously (AND logic).
- **Load More:** Fetches next page with `offset` param.

### Edge Cases
- **Geolocation denied:** Show error toast, fall back to non-geo search
- **Geolocation unavailable:** Show "Location not available" message
- **Empty search results:** "No operators found" empty state
- **Rapid filter changes:** Debounce search input

---

## Feature 2: Operator Profile

### Overview
Public profile page for each operator, showing all relevant information with category-specific sections.

### Technical Implementation
- **Page:** `/o/[slug]` — uses `src/components/operator-profile.tsx` (Client Component)
- **Data:** Server-side fetch by slug

### Sections

| Section | Content | Conditional? |
|---------|---------|--------------|
| Hero | Name, category badge, short_desc, verified badge | No |
| Photo Gallery | Image carousel with prev/next arrows and dot indicators | Yes — only if photos exist |
| Description | `long_desc` | Yes — only if set |
| Houseboat Details | Owner, address, grade, amenities, rooms | Yes — only if category = houseboat |
| Shikara Details | Full name, shikara number, ghat, operating areas, languages | Yes — only if category = shikara |
| Artisan Details | Business type, specialties, years in business | Yes — only if category = artisan |
| Tariffs/Pricing | Key-value pricing table | Yes — only if tariffs exist |
| Contact | WhatsApp button (deep link + lead tracking) | No |
| Favorite | Heart toggle (localStorage-based) | No |

### WhatsApp Lead Behavior
1. Visitor clicks "Chat on WhatsApp"
2. `POST /api/leads` with operator_id, source='profile'
3. If free-plan limit reached (3/month): show "Blocked" state
4. Otherwise: open WhatsApp deep link with encoded message

### Edge Cases
- **Slug not found:** 404 page
- **No photos:** "No photos available" placeholder shown
- **WhatsApp missing:** Button disabled
- **Category-specific details missing:** Section hidden

---

## Feature 3: Operator Registration (Join)

### Overview
Self-registration flow for operators to create their profile on the platform.

### Technical Implementation
- **Page:** `/join` (Client Component)
- **Data:** `POST /api/operators`

### Registration Wizard (5 Steps)

| Step | Fields |
|------|--------|
| **Email** | Email input + OTP send/verify |
| **Business** | Name, Category (houseboat/shikara/artisan), WhatsApp |
| **Description** | Short description, Long description, Pricing note |
| **Photos** | File upload + compression (up to 5 photos) |
| **Review** | Summary of all entered data + terms checkbox + submit |

### Flow
1. User fills email, verifies via OTP (sent by Resend)
2. Fills business details, uploads photos (client-side compression)
3. Submits → `POST /api/operators` creates record with `status='pending'`
4. Slug auto-generated from name with random suffix
5. On success: redirect to login with success message

---

## Feature 4: Authentication

### Overview
Multi-provider authentication system supporting Google OAuth, Email OTP, and WhatsApp OTP.

### Technical Implementation
- **Config:** `src/lib/auth.ts`
- **Pages:** `/auth/login` (Client Component)
- **Providers:** Google (OAuth), Email (Resend-based OTP), WhatsApp (OpenWA-based OTP)

### Provider Details

**Google OAuth:**
- Standard OAuth 2.0 flow
- Requires `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET`

**Email OTP:**
- User enters email → `POST /api/auth/send-otp { email }`
- 6-digit OTP generated, stored in `email_verifications` table
- OTP sent via Resend email API
- User enters OTP → `POST /api/auth/verify { email, otp }`
- Backfilled `@nadur.com` emails return OTP directly in response

**WhatsApp OTP:**
- User enters phone → `POST /api/auth/send-otp-whatsapp { phone }`
- 6-digit OTP generated, stored in `phone_verifications` table
- OTP sent via OpenWA WhatsApp gateway
- User enters OTP → `POST /api/auth/verify-whatsapp { phone, otp }`

### JWT Callback Logic
```
if token has user.email:
    lookup operator by email
    if found:
        add operator_id, is_admin to token
    else:
        if email == 'nadeemkolu22@gmail.com':
            set is_admin = true
else:
    lookup operator by user.id (fallback for OTP users without email)
    if found:
        add operator_id to token
```

### Edge Cases
- **Stale session:** Login page detects missing `operator_id`, calls `signOut()`, redirects to login
- **OTP expired:** User must request new code
- **Concurrent OTP requests:** New OTP overwrites old one (by phone/email)

---

## Feature 5: Operator Dashboard

### Overview
Personal dashboard for operators showing profile completion status and lead activity.

### Technical Implementation
- **Page:** `/portal` (Client Component, wrapped in portal layout)
- **Data:** Session-based operator lookup, leads by operator_id

### Dashboard Sections

**Profile Completion Card:**
- Progress bar showing completion %
- Checklist of missing fields
- Fields checked: name, short_desc, long_desc, photos, tariffs, category_details, lat, lng

**Leads Summary Card:**
- Total leads count (this month + all time)
- Trend comparison (this week vs last week)
- Recent leads list (source, date)
- Free-plan lead limit warning (3/month)

**Quick Actions:**
- "Edit Profile" button → `/portal/edit`
- "View QR Code" → `/portal/qr`
- "View Public Profile" → `/o/[slug]`

### Edge Cases
- **No leads yet:** Empty state
- **Profile 100% complete:** Success message

---

## Feature 6: Profile Editing

### Overview
Full profile editor for operators to manage all aspects of their listing.

### Technical Implementation
- **Page:** `/portal/edit` (Client Component)
- **Data:** `GET /api/operators/[slug]` → form pre-fill → `PATCH /api/operators/[slug]`

### Form Sections

**Basic Information:**
- Name, Slug (auto-generated), Short description (max 500), Long description (max 2000), Pricing note
- WhatsApp, Email (with verification OTP)

**Category-Specific Fields (conditional):**

*Houseboat:*
- Owner, Address, Contact, Contact 2, Email, Grade
- Google Maps URL (auto-parses lat/lng)
- Boat Ghat, Room types with pricing (double/single EP/CP/MAP/AP)

*Shikara:*
- Full Name, Mobile, WhatsApp, Shikara Number, Ghat Number
- Operating Areas, Years Experience, Languages, Services
- Tour Duration, Registration status & number

*Artisan:*
- Business Type, Specialties, Scale
- Owner Name, Contact, WhatsApp, Email
- Website, GST Number, Export License
- Years in Business, Google Maps URL

**Tariffs:**
- Houseboat tariff table: double/single EP/CP/MAP/AP

**Photos:**
- Current photos displayed as thumbnail grid (max 5)
- "Add photo" button → file input → compress → upload to `/api/upload/photo`
- Changing photos resets status to pending

**Location:**
- Latitude / Longitude (parsed from Google Maps URL)

### Save Behavior
- "Save Changes" button validates and submits
- `PATCH /api/operators/[slug]`
- Changing photos, tariffs, or details resets status to `pending`

---

## Feature 7: Admin Panel

### Overview
Administrative interface for managing operators and viewing platform data.

### Technical Implementation
- **Pages:** `/admin` (dashboard), `/admin/operators` (list), `/admin/operators/[id]` (detail), `/admin/categories`
- **Data:** `GET /api/admin/operators`, `POST /api/admin/operators/[id]`

### Admin Pages

**Dashboard (`/admin`):**
- Stat cards: pending/approved/rejected/total counts
- Latest 10 pending operators

**Operators List (`/admin/operators`):**
- Filterable by `?status=` and `?verified=`
- Status badges: Pending (yellow), Approved (green), Rejected (red), Suspended (orange)

**Operator Detail (`/admin/operators/[id]`):**
- Full operator data display
- Actions: Approve, Reject (with reason), Suspend, Verify, Change Plan, Reset Leads

**Categories (`/admin/categories`):**
- Lists all 5 categories (read-only)

### Status Action Matrix

| Current Status | Available Actions |
|---------------|-------------------|
| Pending | Approve, Reject |
| Approved | Suspend |
| Rejected | Approve (re-activate) |
| Suspended | Approve (re-activate) |

---

## Feature 8: Lead Capture

### Overview
Anonymous lead submission system allowing visitors to express interest in an operator's services.

### Technical Implementation
- **Endpoints:** `POST /api/leads` (create), `GET /api/leads` (read)
- **Client tracking:** `session_id` generated via `crypto.randomUUID()` stored in localStorage
- **Lead notification:** OpenWA sends WhatsApp message to operator on new lead

### Lead Record Structure
```
{
  id: UUID,
  operator_id: UUID,    // FK to operators
  session_id: string,   // anonymous visitor identifier (from header or auto-generated)
  source: string,       // 'profile' | 'qr' | 'search'
  created_at: timestamp
}
```

### Visitor Session Tracking
1. On first visit: generate UUID, store in `localStorage.setItem('session_id', uuid)`
2. On lead submission: send `x-session-id` header
3. Same visitor can submit multiple leads (one per operator)
4. Free-plan limit: 3 leads/month per operator (enforced)

### Edge Cases
- **Duplicate submission (same visitor, same operator):** Allowed (no dedup)
- **Invalid operator_id:** 400 "Operator not found"
- **Free plan limit reached:** `{ blocked: true }` response

---

## Feature 9: Geospatial Search (Near Me)

### Overview
Location-based filtering that shows operators within a configurable radius of the visitor's current location.

### Technical Implementation
- **DB:** PostgreSQL `earthdistance` extension with GiST index
- **Client:** Browser Geolocation API
- **Parameter:** `?lat=34.09&lng=74.79` (radius hardcoded at 10,000m)

### Query Logic
```sql
SELECT * FROM operators
WHERE status = 'approved'
  AND lat IS NOT NULL
  AND lng IS NOT NULL
  AND earth_distance(
    ll_to_earth(lat, lng),
    ll_to_earth(:userLat, :userLng)
  ) <= 10000
ORDER BY earth_distance(
  ll_to_earth(lat, lng),
  ll_to_earth(:userLat, :userLng)
) ASC;
```

### Edge Cases
- **Location permission denied:** Show toast "Enable location to use Near Me"
- **Location unavailable (GPS timeout):** Show toast "Could not get your location"
- **No operators nearby:** "No operators found" empty state

---

## Feature 10: Photo Upload

### Overview
Image upload for operator profiles using Cloudinary via server-side API route.

### Technical Implementation
- **API:** `POST /api/upload/photo` (multipart form data)
- **Library:** `browser-image-compression` (client-side), `sharp` (server-side not used), Cloudinary SDK
- **Storage:** Cloudinary CDN

### Upload Flow
1. Operator clicks "Add photo" in edit page
2. File input opened (accept: jpeg/png/webp)
3. Client-side compression via `browser-image-compression`
4. File sent as FormData to `POST /api/upload/photo`
5. Server validates MIME type and size (max 5MB)
6. Server uploads buffer to Cloudinary
7. Cloudinary returns `{ url, publicId }`
8. URL added to local photos array
9. On "Save", entire photos array sent in PATCH request

### Configuration
- Cloud name: `CLOUDINARY_CLOUD_NAME`
- Max 5 photos per operator

### Edge Cases
- **File too large:** Server returns 400
- **Wrong file type:** Server returns 400 "Invalid file type"
- **Upload failure:** Server returns 500
- **Remove photo:** Not implemented; operator can only add

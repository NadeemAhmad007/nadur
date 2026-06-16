# Feature Specifications

## Feature 1: Public Directory / Browse

### Overview
The core discovery feature allowing visitors to browse, search, and filter operators on Dal Lake.

### Technical Implementation
- **Page:** `/browse` — uses `src/components/browse-page.tsx` (Client Component)
- **Data:** `GET /api/operators` with query parameters
- **State management:** URL search params (`useSearchParams`)

### UI States

| State | Trigger | UI |
|-------|---------|-----|
| **Loading** | Initial page load or new search | Grid of skeleton cards (8x `animate-pulse` rectangles) |
| **Empty** | No operators match filters | Centered illustration + "No operators found" message + "Clear filters" button |
| **Error** | API returns error | Error toast via Sonner + retry button (INFERRED) |
| **Geolocation Prompt** | User clicks "Near Me" | Browser permission dialog; shows "Enable location" on denial |
| **Results** | Operators found | Grid of operator cards with photo, name, badge, short_desc, CTAs |
| **Results + Near Me** | Geolocation active | Same grid with distance indicator on each card |

### Filter Behavior
- **Category filter:** URL-driven (`?category=houseboat`). Clicking a category button sets param; "All" clears it.
- **Search:** Debounced input (300ms INFERRED). Updates `?search=query` in URL.
- **Near Me:** Requests geolocation, sets `?lat=...&lng=...&radius=5000`. Radius adjustable via slider.
- **Combined filters:** All active params applied simultaneously (AND logic).

### Edge Cases
- **Geolocation denied:** Show error toast, fall back to non-geo search
- **Geolocation unavailable:** Show "Location not available" message
- **Empty search results:** "No operators found matching 'query'"
- **Rapid filter changes:** Debounce search input; cancel in-flight requests

---

## Feature 2: Operator Profile

### Overview
Public profile page for each operator, showing all relevant information with category-specific sections.

### Technical Implementation
- **Page:** `/op/[slug]` — uses `src/components/operator-profile.tsx` (Client Component)
- **Data:** `GET /api/operators/[slug]`

### Sections

| Section | Content | Conditional? |
|---------|---------|--------------|
| Hero | Name, category badge, short_desc, verified badge | No |
| Photo Gallery | Image carousel from `photos[]` | Yes — only if photos exist |
| Description | `long_desc` | Yes — only if set |
| Houseboat Details | Rooms, amenities, check-in/out | Yes — only if category = houseboat |
| Shikara Details | Routes, durations, capacity | Yes — only if category = shikara |
| Artisan Details | Craft type, materials, custom orders | Yes — only if category = artisan |
| Tariffs/Pricing | Key-value pricing table | Yes — only if tariffs exist |
| Map | Leaflet map with marker | Yes — only if lat/lng set |
| Contact | WhatsApp button (deep link) | No |
| Lead Form | Name + Message + Submit | No |

### Lead Form Behavior
1. Visitor fills name + message
2. Clicks "Send Inquiry"
3. `POST /api/leads` with operator_id, session_id, source='profile'
4. On success: toast "Inquiry sent!" + form reset
5. On error: toast error message

### Edge Cases
- **Slug not found:** 404 page
- **No photos:** Gallery section hidden
- **No lat/lng:** Map section hidden
- **WhatsApp missing:** Contact button disabled
- **Category-specific details missing:** Section hidden
- **Invalid slug format:** 404 page

---

## Feature 3: Operator Registration (Join)

### Overview
Self-registration flow for operators to create their profile on the platform.

### Technical Implementation
- **Page:** `/join` (Client Component)
- **Data:** `POST /api/operators`

### Form Fields

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| name | Text input | Yes | Min 2 characters |
| whatsapp | Tel input | Yes | Must include country code |
| email | Email input | No | Valid email format |
| category | Select dropdown | Yes | Must be one of 5 valid categories |
| short_desc | Textarea | No | Max 500 chars |
| long_desc | Textarea | No | Max 2000 chars |
| pricing_note | Text input | No | Free text |
| terms | Checkbox | Yes | Must be checked |

### Flow
1. User fills form
2. Slug auto-generated from name on blur (INFERRED)
3. User submits
4. `POST /api/operators` creates record with `status='pending'`
5. On success: redirect to `/auth/login` with toast "Registration submitted! Login to manage your profile."
6. On error: show validation error on form

### Edge Cases
- **Duplicate slug:** Auto-retry with random suffix; if still fails, show error
- **Network error:** toast "Something went wrong. Please try again."
- **Invalid phone:** Show inline validation error

---

## Feature 4: Authentication

### Overview
Multi-provider authentication system supporting Google OAuth, Email OTP, and WhatsApp OTP.

### Technical Implementation
- **Config:** `src/lib/auth.ts`
- **Pages:** `/auth/login` (Client Component)
- **Providers:** Google (OAuth), Email (Resend-based OTP), WhatsApp (custom credentials)

### Provider Details

**Google OAuth:**
- Standard OAuth 2.0 flow
- Requires `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET`
- Callback creates/updates NextAuth user
- JWT callback looks up operator by email

**Email OTP:**
- User enters email → `POST /api/auth/otp/send { email }`
- 6-digit OTP generated, stored in `email_verifications` table
- OTP sent via Resend email API
- User enters OTP → `POST /api/auth/otp/verify { email, otp }`
- On success: NextAuth credentials provider creates session
- On failure: "Invalid code" error, increment attempts

**WhatsApp OTP:**
- User enters phone → `POST /api/auth/otp/send { phone }`
- 6-digit OTP generated, stored in `phone_verifications` table
- OTP sent via WhatsApp API (INFERRED — actual integration unclear)
- User enters OTP → `POST /api/auth/otp/verify { phone, otp }`
- On success: NextAuth credentials provider creates session

### JWT Callback Logic
```
if token has user.email:
    lookup operator by email
    if found:
        add operator_id, is_admin (from operator), user_role to token
    else:
        if email == 'nadeemkolu22@gmail.com':
            set is_admin = true
else:
    lookup operator by user.id (fallback for OTP users without email)
    if found:
        add operator_id, user_role to token
```

### Edge Cases
- **Stale session:** Login page detects missing `operator_id`, calls `signOut()`, redirects to login
- **OTP expired:** User must request new code
- **Too many OTP attempts:** OTP invalidated after 3-5 failed attempts
- **Concurrent OTP requests:** New OTP invalidates old one (overwrite by phone/email)

---

## Feature 5: Operator Dashboard

### Overview
Personal dashboard for operators showing profile completion status and lead activity.

### Technical Implementation
- **Page:** `/portal` (Client Component, wrapped in portal layout)
- **Data:** `GET /api/operators?email=...` (or by operator_id fallback), `GET /api/leads?operator_id=...`

### Dashboard Sections

**Profile Completion Card:**
- Circular or linear progress bar showing completion %
- Checklist of missing fields with "Add Now" links
- Fields checked: name, short_desc, long_desc, photos, tariffs, category_details, lat, lng

**Leads Summary Card:**
- Total leads count (large number)
- Recent leads list (5 most recent): name, message excerpt, date
- "View All" link (INFERRED — may not exist)

**Quick Actions:**
- "Edit Profile" button → `/portal/edit`
- "View Public Profile" link → `/op/[slug]`

### Edge Cases
- **Session missing operator_id:** Fallback lookup by operator_id from session
- **Email empty for operator:** Fallback to operator_id-based lookup
- **No leads yet:** "No inquiries yet" empty state
- **Profile 100% complete:** "Your profile is complete!" message

---

## Feature 6: Profile Editing

### Overview
Full profile editor for operators to manage all aspects of their listing.

### Technical Implementation
- **Page:** `/portal/edit` (Client Component)
- **Data:** `GET /api/operators/[slug]` → form pre-fill → `PATCH /api/operators/[slug]`

### Form Sections

**Basic Information:**
- Name (text input)
- Slug (text input, auto-generated, shows uniqueness check)
- Short description (textarea, char counter, max 500)
- Long description (textarea, char counter, max 2000)
- WhatsApp (tel input)
- Email (email input)
- Pricing note (text input)

**Category-Specific Fields (conditional):**

*Houseboat:*
- Rooms (number)
- Amenities (multi-select or tag input)
- Check-in time (time input)
- Check-out time (time input)
- Has electricity (toggle)
- Has attached bathroom (toggle)

*Shikara:*
- Routes (dynamic list of {name, duration, capacity, price})
- Max capacity (number)
- Has shade (toggle)

*Artisan:*
- Craft type (text/select)
- Materials (tag input)
- Custom orders (toggle)
- Delivery available (toggle)

**Tariffs:**
- Dynamic key-value pairs (add/remove rows)
- Each row: label (text), price (text)
- Stored as JSONB

**Photos:**
- Current photos displayed as thumbnail grid
- "Add Photo" button → opens Cloudinary widget
- Uploaded photo URL added to array

**Location:**
- Latitude (number input, -90 to 90)
- Longitude (number input, -180 to 180)
- Map preview with draggable marker (INFERRED)

### Save Behavior
- "Save Changes" button
- Validates all fields client-side before submit
- `PATCH /api/operators/[slug]` with all changed fields
- On success: toast "Profile updated!" + update displayed data
- On error: toast error message, keep form state

### Edge Cases
- **User not authorized for this profile:** Redirect to dashboard
- **Concurrent edits:** Last save wins (no merge strategy)
- **Cloudinary upload fails:** Widget shows error; form state preserved
- **Invalid coordinates:** Client-side validation before submit
- **Slug already taken:** Show "Slug is taken" error inline

---

## Feature 7: Admin Panel

### Overview
Administrative interface for managing operators and viewing platform data.

### Technical Implementation
- **Page:** `/admin` (Client Component)
- **Data:** `GET /api/admin/operators`, `PATCH /api/admin/operators/[id]`

### Sections

**Operators Table:**
- Columns: Name, Category, Status, Lead Count, Created Date
- Status badges: Pending (yellow), Approved (green), Rejected (red), Suspended (orange)
- Action buttons per row: Approve, Reject, Suspend (context-dependent)
- Status filter tabs: All / Pending / Approved / Rejected / Suspended
- Search input to filter table

**Lead Leaderboard:**
- Operators sorted by lead count descending
- Shows: Rank, Name, Lead Count, Category

### Status Action Matrix

| Current Status | Available Actions |
|---------------|-------------------|
| Pending | Approve, Reject |
| Approved | Suspend |
| Rejected | Approve (re-activate) |
| Suspended | Approve (re-activate) |

### Edge Cases
- **Non-admin user accesses /admin:** Redirect to login (proxy.ts) or show "Access denied"
- **Action fails:** Toast error "Failed to update status"
- **No operators:** "No operators registered yet" empty state
- **All leads viewed:** Leaderboard shows operators with 0 leads too

---

## Feature 8: Lead Capture

### Overview
Anonymous lead submission system allowing visitors to express interest in an operator's services.

### Technical Implementation
- **Endpoints:** `POST /api/leads` (create), `GET /api/leads` (read)
- **Client tracking:** `session_id` generated via `crypto.randomUUID()` stored in localStorage

### Lead Record Structure
```
{
  id: UUID,
  operator_id: UUID,    // FK to operators
  session_id: string,   // anonymous visitor identifier
  source: string,       // 'profile' | 'browse' | 'card'
  name: string | null,  // visitor's name (optional)
  message: string | null, // visitor's message (optional)
  created_at: timestamp
}
```

### Visitor Session Tracking
1. On first visit: generate UUID, store in `localStorage.setItem('session_id', uuid)`
2. On lead submission: include `session_id` in request body
3. Same visitor can submit multiple leads (one per operator)
4. No lead limit enforced per session

### Edge Cases
- **Duplicate submission (same visitor, same operator):** Allowed (no dedup)
- **Invalid operator_id:** 400 "Operator not found"
- **Missing session_id:** 400 "Session ID required"
- **Rate limiting:** Not implemented — visitor could spam leads

---

## Feature 9: Geospatial Search (Near Me)

### Overview
Location-based filtering that shows operators within a configurable radius of the visitor's current location.

### Technical Implementation
- **DB:** PostgreSQL `earthdistance` extension with GiST index
- **Client:** Browser Geolocation API
- **Parameter:** `?lat=34.09&lng=74.79&radius=5000`

### Query Logic
```sql
SELECT * FROM operators
WHERE status = 'approved'
  AND lat IS NOT NULL
  AND lng IS NOT NULL
  AND earth_distance(
    ll_to_earth(lat, lng),
    ll_to_earth(:userLat, :userLng)
  ) <= :radius
ORDER BY earth_distance(
  ll_to_earth(lat, lng),
  ll_to_earth(:userLat, :userLng)
) ASC;
```

### Radius Presets (INFERRED)
- 1 km (walking distance)
- 3 km
- 5 km (default)
- 10 km
- 20 km (entire Dal Lake area)

### Edge Cases
- **Location permission denied:** Show toast "Enable location to use Near Me"
- **Location unavailable (GPS timeout):** Show toast "Could not get your location"
- **No operators nearby:** "No operators found near your location. Try increasing the radius."
- **Old browser (no Geolocation API):** Hide Near Me button

---

## Feature 10: Photo Upload

### Overview
Image upload for operator profiles using Cloudinary.

### Technical Implementation
- **Library:** `next-cloudinary` (`CldUploadButton`)
- **Widget:** Cloudinary Upload Widget (opens in browser)
- **Storage:** Cloudinary CDN
- **Integration:** URL returned by widget stored in `operators.photos[]`

### Upload Flow
1. Operator clicks "Add Photo" in edit page
2. Cloudinary widget opens (file picker)
3. User selects image file
4. Widget uploads directly to Cloudinary (client-side)
5. Cloudinary returns `{ secure_url, public_id }` in callback
6. URL added to local photos array
7. On "Save", entire photos array sent in PATCH request

### Configuration (INFERRED from env vars)
- Cloud name: `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`
- Upload preset: unsigned or signed (depends on config)

### Edge Cases
- **File too large:** Cloudinary widget shows error (max ~10MB by default)
- **Wrong file type:** Widget validates image types (jpg, png, webp)
- **Upload failure:** Widget shows error; operator can retry
- **Remove photo:** Not implemented; operator can only add

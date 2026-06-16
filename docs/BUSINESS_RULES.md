# Business Rules

## 1. Operator Status Workflow

```mermaid
stateDiagram-v2
    [*] --> Pending: Operator registers via /join
    Pending --> Approved: Admin approves
    Pending --> Rejected: Admin rejects
    Approved --> Suspended: Admin suspends
    Suspended --> Approved: Admin reinstates
    Rejected --> Pending: Operator re-registers
    Approved --> [*]
```

**Rules:**
- New registrations default to `status = 'pending'`
- Only `approved` operators appear in public browse/search results
- `suspended` operators' profiles are hidden from public
- `rejected` operators are hidden; can re-register with new info
- Status changes are recorded via `updated_at` timestamp (no separate audit log)
- **INFERRED:** No notification is sent to operators on status change

---

## 2. Authentication Rules

| Rule | Description |
|------|-------------|
| AR-01 | Google OAuth is available to anyone with a Google account |
| AR-02 | Email OTP: valid email required, OTP expires after 10 minutes (INFERRED) |
| AR-03 | WhatsApp OTP: valid phone number required, OTP expires after 10 minutes (INFERRED) |
| AR-04 | OTP is 6 digits, alphanumeric (INFERRED — stored as TEXT) |
| AR-05 | OTP verification attempts: max 3-5 before OTP is invalidated (INFERRED — `attempts` column exists but no explicit check in code) |
| AR-06 | Session expires with JWT token lifetime (NextAuth default: 30 days) |
| AR-07 | Stale/invalid sessions (missing `operator_id`) are detected on login page and cleaned via `signOut()` |
| AR-08 | Admin is identified by hardcoded email `nadeemkolu22@gmail.com` in auth callbacks |
| AR-09 | Only one active session per user (JWT strategy — no session store) |

---

## 3. Lead Capture Rules

| Rule | Description |
|------|-------------|
| LR-01 | Any visitor (authenticated or not) can submit a lead |
| LR-02 | Lead requires `operator_id` and `session_id` — `name` and `message` are optional |
| LR-03 | `session_id` is a client-generated UUID stored in localStorage to identify anonymous visitors |
| LR-04 | One lead submission = one row; no deduplication |
| LR-05 | `source` field tracks where the lead was submitted from: `'profile'`, `'browse'`, etc. |
| LR-06 | Leads are visible to: the operator who received them, and the admin |
| LR-07 | **NOT ENFORCED:** Free plan allows 3 leads/month; no code checks `lead_month` counter |
| LR-08 | **NOT ENFORCED:** Pro plan has unlimited leads; no code differentiates plan tiers |

---

## 4. Profile Completion Score (Client-Side Logic)

The dashboard calculates a completion percentage based on filled fields:

| Field | Weight | Notes |
|-------|--------|-------|
| `name` | 12.5% | Must be non-empty |
| `short_desc` | 12.5% | Must be non-empty |
| `long_desc` | 12.5% | Must be non-empty |
| `photos` | 12.5% | Array must have at least 1 element |
| `tariffs` | 12.5% | Must be non-null (even if empty object) |
| `category_details` | 12.5% | Must have corresponding `*_details` JSONB (houseboat_details for houseboat category, etc.) |
| `lat` | 12.5% | Must be non-null |
| `lng` | 12.5% | Must be non-null |

**Formula:** `(filled_fields / 8) * 100`

---

## 5. Slug Generation Rules

| Rule | Description |
|------|-------------|
| SR-01 | Slug is auto-generated from the operator's name |
| SR-02 | Generation: lowercase, replace spaces with hyphens, remove special chars, append random suffix if needed |
| SR-03 | Slug must be unique (enforced by DB unique index) |
| SR-04 | Slug is set on creation and editable by the operator |
| SR-05 | URL pattern: `/op/[slug]` |
| SR-06 | Slugs can contain: lowercase letters, numbers, hyphens |

---

## 6. Geospatial Rules

| Rule | Description |
|------|-------------|
| GR-01 | Lat/Lng are stored as `DOUBLE PRECISION` (WGS84 coordinate system) |
| GR-02 | Search radius is in meters (default: 5000m / 5km when "Near Me" is active) |
| GR-03 | Distance calculation uses PostgreSQL earthdistance extension (`ll_to_earth`) |
| GR-04 | Operators with NULL lat/lng are excluded from geospatial queries |
| GR-05 | Geospatial index (`operators_earth_idx`) requires lat/lng to be non-null |
| GR-06 | Multiple operators at same coordinates are allowed (no unique constraint on lat/lng) |

---

## 7. Photo Upload Rules

| Rule | Description |
|------|-------------|
| PR-01 | Photos are uploaded directly to Cloudinary via the `CldUploadButton` widget (client-side) |
| PR-02 | Cloudinary returns `secure_url` which is stored in the `photos` TEXT[] array |
| PR-03 | Max photo count: no explicit limit in code (DB array has no max) |
| PR-04 | Photo deletion: not implemented (no remove button in edit page — INFERRED) |
| PR-05 | Photo order: array order = display order (no manual sorting UI) |
| PR-06 | Photo dimensions: Cloudinary transformations handle sizing (INFERRED) |

---

## 8. Admin Privileges

| Rule | Description |
|------|-------------|
| AR-01 | Admin is identified by hardcoded email: `nadeemkolu22@gmail.com` |
| AR-02 | Admin can view all operators regardless of status |
| AR-03 | Admin can change operator status: `pending → approved/rejected`, `approved → suspended`, `suspended → approved` |
| AR-04 | Admin can view all leads across all operators |
| AR-05 | Admin panel shows lead count leaderboard (descending) |
| AR-06 | Admin has NO special API for editing operator content (must use same PATCH endpoint) |
| AR-07 | Route protection is dual: `proxy.ts` middleware + client-side `is_admin` check |

---

## 9. Category-Specific Rules

### Houseboat
- `houseboat_details` JSONB structure (INFERRED):
  - `rooms` (number): Total rooms
  - `amenities` (string[]): List of amenities
  - `check_in` (string): Check-in time
  - `check_out` (string): Check-out time
  - `has_electricity` (boolean)
  - `has_attached_bathroom` (boolean)

### Shikara
- `shikara_details` JSONB structure (INFERRED):
  - `routes` (array): [{ name, duration, capacity, price }]
  - `max_capacity` (number)
  - `has_shade` (boolean)

### Artisan
- `artisan_details` JSONB structure (INFERRED):
  - `craft_type` (string): Type of craft (e.g., "Papier-mâché", "Carpet weaving")
  - `materials` (string[]): Materials used
  - `custom_orders` (boolean): Whether custom orders are accepted
  - `delivery_available` (boolean)

### Guide
- No specific `guide_details` JSONB column in migration (guide-specific fields stored in `artisan_details` or generic fields — REQUIRES VERIFICATION)

### Vendor
- No specific `vendor_details` JSONB column in migration

---

## 10. Plan / Billing Rules (NOT ENFORCED)

| Rule | Description | Enforced? |
|------|-------------|-----------|
| BR-01 | Free plan: 3 leads/month | ❌ No |
| BR-02 | Pro plan: unlimited leads | ❌ No |
| BR-03 | Pro plan requires payment | ❌ No payment integration |
| BR-04 | `lead_month` resets monthly | ❌ No cron/reset job |
| BR-05 | Profile visibility is same for free and pro | ❌ No differentiation |

---

## 11. Data Validation Rules

| Field | Rule |
|-------|------|
| `name` | Required, min 2 characters |
| `whatsapp` | Required, valid phone format (must include country code — INFERRED) |
| `category` | Required, must be one of 5 valid categories |
| `slug` | Auto-generated from name, must be unique |
| `short_desc` | Max 500 characters |
| `long_desc` | Max 2000 characters |
| `email` | Optional, valid email format if provided |
| `photos` | Array of valid URLs (Cloudinary secure_url format) |
| `lat` | Range: -90 to 90 |
| `lng` | Range: -180 to 180 |

---

## 12. Privacy & Data Rules

| Rule | Description |
|------|-------------|
| PDR-01 | Visitor sessions are tracked via `session_id` stored in localStorage (not cookies) |
| PDR-02 | Phone numbers are visible on public profiles (WhatsApp deep link) |
| PDR-03 | No user consent banner / GDPR notice |
| PDR-04 | No cookie consent mechanism |
| PDR-05 | Lead data (name, message, session_id) is stored indefinitely — no retention policy |
| PDR-06 | No data deletion endpoint for operators or visitors |

---

## 13. Error Handling Rules

| Scenario | Behavior |
|----------|----------|
| API returns 4xx/5xx | Toast notification with error message (sonner/sonner) |
| Network offline | No explicit offline handling |
| Invalid slug | 404 page |
| Session expired | Redirect to login, attempt to clear stale session |
| OTP expired | User must request new OTP |
| OTP wrong | Increment `attempts` counter, show "Invalid OTP" |
| Max OTP attempts reached | OTP invalidated, user must request new code |
| Category page not found | 404 (fallback to not-found.tsx) |
| Photo upload fails | Cloudinary widget shows error, operator retries |

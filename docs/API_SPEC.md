# API Specification

**Base URL:** `https://{domain}` (development: `http://localhost:3000`)  
**Auth:** NextAuth v5 (JWT sessions, sent via cookies)  
**Content-Type:** `application/json`  

---

## 1. Operators API

### 1.1 GET /api/operators

List operators with filtering, search, and geospatial capabilities.

**Query Parameters:**

| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `category` | string | No | all | Filter by category slug |
| `q` | string | No | — | Full-text search query |
| `lat` | number | No | — | Latitude for geospatial filter |
| `lng` | number | No | — | Longitude for geospatial filter |
| `radius` | number | No | 5000 | Search radius in meters |
| `id` | string | No | — | Filter by operator ID |
| `email` | string | No | — | Filter by email |
| `offset` | number | No | 0 | Pagination offset |
| `limit` | number | No | 20 | Pagination limit |

**Response (200):**
```json
[
  {
    "id": "uuid",
    "slug": "kashmir-houseboats",
    "name": "Kashmir Houseboats",
    "category": "houseboat",
    "short_desc": "Luxury houseboats on Dal Lake...",
    "whatsapp": "+919123456789",
    "photos": ["https://res.cloudinary.com/.../photo1.jpg"],
    "status": "approved",
    "verified": false,
    "lat": 34.09,
    "lng": 74.79,
    "created_at": "2026-06-01T12:00:00Z"
  }
]
```

**Notes:**
- Returns only `status = 'approved'` operators for public requests
- Full-text search uses PostgreSQL `to_tsvector`/`plainto_tsquery`
- Geospatial filter uses `earth_distance` from `ll_to_earth`
- Combined search + geospatial: results must match BOTH criteria

---

### 1.2 POST /api/operators

Create a new operator (registration).

**Request Body:**
```json
{
  "name": "Kashmir Houseboats",
  "whatsapp": "+919123456789",
  "email": "owner@example.com",
  "category": "houseboat",
  "slug": "kashmir-houseboats-1",
  "short_desc": "Luxury houseboats on Dal Lake",
  "long_desc": "Detailed description...",
  "pricing_note": "Starting from ₹5000/night"
}
```

**Response (201):**
```json
{
  "id": "uuid",
  "slug": "kashmir-houseboats-1",
  "status": "pending",
  "created_at": "2026-06-13T12:00:00Z"
}
```

**Notes:**
- Slug is auto-generated if not provided (slugify name + random suffix)
- New operators default to `status = 'pending'`
- `whatsapp` is required; `email` is optional

---

### 1.3 GET /api/operators/[slug]

Get a single operator by slug.

**Response (200):**
```json
{
  "id": "uuid",
  "slug": "kashmir-houseboats",
  "name": "Kashmir Houseboats",
  "category": "houseboat",
  "short_desc": "Luxury houseboats on Dal Lake",
  "long_desc": "Detailed description...",
  "whatsapp": "+919123456789",
  "email": "owner@example.com",
  "pricing_note": "Starting from ₹5000/night",
  "status": "approved",
  "verified": false,
  "plan": "free",
  "lead_month": 0,
  "photos": ["https://res.cloudinary.com/.../photo1.jpg"],
  "tariffs": { "standard": "₹5000", "deluxe": "₹8000" },
  "houseboat_details": { "rooms": 5, "amenities": ["AC", "WiFi"], "check_in": "12:00", "check_out": "10:00" },
  "shikara_details": null,
  "artisan_details": null,
  "lat": 34.09,
  "lng": 74.79,
  "created_at": "2026-06-01T12:00:00Z",
  "updated_at": "2026-06-10T12:00:00Z"
}
```

**Response (404):**
```json
{
  "error": "Operator not found"
}
```

---

### 1.4 PATCH /api/operators/[slug]

Update an operator profile. Requires authentication (must own the profile or be admin).

**Request Body:** (all fields optional)
```json
{
  "name": "Updated Name",
  "short_desc": "Updated short description",
  "long_desc": "Updated long description...",
  "whatsapp": "+919123456789",
  "email": "newemail@example.com",
  "pricing_note": "Updated pricing",
  "photos": ["https://res.cloudinary.com/.../newphoto.jpg"],
  "tariffs": { "standard": "₹6000", "deluxe": "₹9000" },
  "houseboat_details": { "rooms": 6, "amenities": ["AC", "WiFi", "Heater"] },
  "lat": 34.10,
  "lng": 74.80,
  "slug": "new-slug"
}
```

**Response (200):**
```json
{
  "id": "uuid",
  "slug": "new-slug",
  "updated_at": "2026-06-13T12:00:00Z"
}
```

**Notes:**
- Only the operator (matched by email/operator_id from session) or admin can update
- Changing photos, tariffs, or category details resets status to `pending`

---

## 2. Leads API

### 2.1 GET /api/leads

List leads for a specific operator.

**Query Parameters:**

| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `operator_id` | UUID | Yes | — | Filter by operator |

**Response (200):**
```json
[
  {
    "id": "uuid",
    "operator_id": "uuid",
    "session_id": "client-generated-uuid",
    "source": "profile",
    "created_at": "2026-06-13T12:00:00Z"
  }
]
```

---

### 2.2 POST /api/leads

Submit a new lead.

**Request Body:**
```json
{
  "operator_id": "uuid",
  "source": "profile"
}
```

**Headers:**
- `x-session-id` (optional, auto-generated if missing)

**Response (201):**
```json
{
  "ok": true
}
```

**Notes:**
- No authentication required (anonymous visitors can submit leads)
- `session_id` read from `x-session-id` header or auto-generated
- Free plan operators are limited to 3 leads/month (returns `{ blocked: true }` if exceeded)
- On successful submission, triggers WhatsApp notification to operator via OpenWA

---

## 3. Admin API

### 3.1 GET /api/admin/operators

List all operators with optional status filter. Requires admin session.

**Query Parameters:**

| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `status` | string | No | all | Filter by status |

**Response (200):**
```json
[
  {
    "id": "uuid",
    "name": "Kashmir Houseboats",
    "category": "houseboat",
    "status": "pending",
    "created_at": "2026-06-01T12:00:00Z"
  }
]
```

---

### 3.2 POST /api/admin/operators/[id]

Perform admin actions on an operator. Requires admin session.

**Request Body:**
```json
{
  "action": "approve"
}
```

**Valid actions:**
- `approve` — sets status to `approved`
- `reject` — sets status to `rejected`
- `suspend` — sets status to `suspended`
- `verify` — toggles `verified` field (requires `{ verified: true/false }`)
- `change_plan` — changes plan (requires `{ plan: 'free'|'pro' }`)
- `reset_leads` — resets `lead_month` counter to 0

**Response (200):**
```json
{
  "id": "uuid",
  "status": "approved",
  "updated_at": "..."
}
```

---

## 4. Upload API

### 4.1 POST /api/upload/photo

Upload a photo file. Returns the Cloudinary URL.

**Request:** `multipart/form-data` with `file` field

**Validation:**
- Allowed MIME types: `image/jpeg`, `image/png`, `image/webp`
- Max file size: 5MB

**Response (200):**
```json
{
  "url": "https://res.cloudinary.com/.../photo.jpg",
  "key": "nadur/abc123"
}
```

---

## 5. QR Code API

### 5.1 GET /api/qr/[slug]

Generate a QR code linking to the operator's public profile.

**Response (200):** SVG or PNG image of QR code

**Query Parameters:**

| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `format` | string | No | `svg` | Output format (`svg` or `png`) |

---

## 6. Auth / OTP API

### 6.1 POST /api/auth/send-otp

Send a 6-digit OTP to an email address.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response (200):**
```json
{
  "ok": true,
  "backfilledOtp": "123456"
}
```

**Notes:**
- For backfilled emails (`@nadur.com`), the OTP is returned directly in the response
- OTP stored in `email_verifications` table with expiration timestamp

### 6.2 POST /api/auth/verify

Verify a 6-digit OTP sent to email.

**Request Body:**
```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

**Response (200):**
```json
{
  "ok": true
}
```

### 6.3 POST /api/auth/send-otp-whatsapp

Send a 6-digit OTP via WhatsApp to a phone number.

**Request Body:**
```json
{
  "phone": "+919123456789"
}
```

**Response (200):**
```json
{
  "ok": true
}
```

**Notes:**
- Uses OpenWA to send the OTP message
- OTP stored in `phone_verifications` table

### 6.4 POST /api/auth/verify-whatsapp

Verify WhatsApp OTP.

**Request Body:**
```json
{
  "phone": "+919123456789",
  "otp": "123456"
}
```

**Response (200):**
```json
{
  "ok": true
}
```

### 6.5 POST /api/auth/lookup-email

Look up an operator's email by phone number, then send OTP to that email.

**Request Body:**
```json
{
  "phone": "+919123456789"
}
```

**Response (200):**
```json
{
  "ok": true
}
```

### 6.6 POST /api/auth/verify-email

Verify email OTP and update operator's email and verified status.

**Request Body:**
```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

**Response (200):**
```json
{
  "ok": true
}
```

---

## 7. Error Response Format

All API errors follow this structure:

```json
{
  "error": "Human-readable error message"
}
```

**HTTP Status Codes Used:**

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (not authenticated) |
| 403 | Forbidden (not authorized) |
| 404 | Not Found |
| 500 | Internal Server Error |

---

## 8. API Route Summary

```
# Public (no auth)
GET    /api/operators                          # List operators
POST   /api/operators                          # Register operator
GET    /api/operators/[slug]                   # Get operator
POST   /api/leads                              # Submit lead
GET    /api/qr/[slug]                          # Generate QR code
POST   /api/auth/send-otp                      # Send email OTP
POST   /api/auth/verify                        # Verify email OTP
POST   /api/auth/send-otp-whatsapp             # Send WhatsApp OTP
POST   /api/auth/verify-whatsapp               # Verify WhatsApp OTP
POST   /api/auth/lookup-email                  # Lookup email by phone
POST   /api/auth/verify-email                  # Verify email + update operator

# Authenticated (operator)
PATCH  /api/operators/[slug]                   # Update own profile
GET    /api/leads                              # View own leads
POST   /api/upload/photo                       # Upload photo

# Admin only
GET    /api/admin/operators                    # All operators
POST   /api/admin/operators/[id]               # Admin actions

# NextAuth (handled by @auth/core)
GET    /api/auth/session
POST   /api/auth/signin
POST   /api/auth/signout
POST   /api/auth/callback/:provider
GET    /api/auth/callback/:provider
```

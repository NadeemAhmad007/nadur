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
| `search` | string | No | — | Full-text search query |
| `lat` | number | No | — | Latitude for geospatial filter |
| `lng` | number | No | — | Longitude for geospatial filter |
| `radius` | number | No | 5000 | Search radius in meters |
| `status` | string | No | `'approved'` | Filter by status (admin only sees pending) |

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

**Response (400):**
```json
{
  "error": "Name is required"
}
```

**Notes:**
- Slug is auto-generated if not provided (slugify name + random suffix)
- New operators default to `status = 'pending'`
- `whatsapp` is required; `email` is optional
- Duplicate slug returns 409

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

**Response (401):**
```json
{
  "error": "Unauthorized"
}
```

**Notes:**
- Only the operator (matched by email/operator_id from session) or admin can update
- Slug update re-checks uniqueness

---

## 2. Leads API

### 2.1 GET /api/leads

List leads. Requires authentication (operator sees own leads; admin sees all).

**Query Parameters:**

| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `operator_id` | UUID | No | — | Filter by operator |
| `limit` | number | No | 50 | Max results |

**Response (200):**
```json
[
  {
    "id": "uuid",
    "operator_id": "uuid",
    "session_id": "client-generated-uuid",
    "source": "profile",
    "name": "John Doe",
    "message": "I'm interested in booking a houseboat",
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
  "session_id": "client-generated-uuid",
  "source": "profile",
  "name": "John Doe",
  "message": "I'm interested in booking a houseboat for 2 nights"
}
```

**Response (201):**
```json
{
  "id": "uuid",
  "created_at": "2026-06-13T12:00:00Z"
}
```

**Notes:**
- No authentication required (anonymous visitors can submit leads)
- `session_id` is a UUID generated by the client and stored in localStorage
- Operator's `lead_month` counter is NOT incremented (gap)

---

## 3. Admin API

### 3.1 GET /api/admin/operators

List all operators with lead counts. Requires admin session.

**Response (200):**
```json
[
  {
    "id": "uuid",
    "name": "Kashmir Houseboats",
    "category": "houseboat",
    "status": "pending",
    "lead_count": 5,
    "created_at": "2026-06-01T12:00:00Z"
  }
]
```

---

### 3.2 PATCH /api/admin/operators/[id]

Update operator status. Requires admin session.

**Request Body:**
```json
{
  "status": "approved"
}
```

**Response (200):**
```json
{
  "id": "uuid",
  "status": "approved",
  "updated_at": "2026-06-13T12:00:00Z"
}
```

**Valid status transitions:**
- `pending → approved`
- `pending → rejected`
- `approved → suspended`
- `suspended → approved`

---

### 3.3 GET /api/admin/leads

List all leads across all operators. Requires admin session.

**Response (200):**
```json
[
  {
    "id": "uuid",
    "operator_id": "uuid",
    "operator_name": "Kashmir Houseboats",
    "session_id": "...",
    "source": "profile",
    "name": "John Doe",
    "message": "...",
    "created_at": "2026-06-13T12:00:00Z"
  }
]
```

---

## 4. Auth API (NextAuth v5)

### 4.1 GET /api/auth/session

Get current session.

**Response (200) — Authenticated:**
```json
{
  "user": {
    "id": "uuid",
    "email": "owner@example.com",
    "name": "Owner Name",
    "image": null,
    "operator_id": "uuid",
    "is_admin": false,
    "user_role": "operator"
  },
  "expires": "2026-07-13T12:00:00Z"
}
```

**Response (200) — Unauthenticated:**
```json
null
```

### 4.2 POST /api/auth/signin

Sign in with a provider.

**Request (credentials):**
```json
{
  "email": "user@example.com",
  "csrfToken": "..."
}
```

### 4.3 POST /api/auth/signout

Sign out.

---

## 5. OTP API

### 5.1 POST /api/auth/otp/send

Send OTP to email or WhatsApp.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```
or
```json
{
  "phone": "+919123456789"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "OTP sent successfully"
}
```

**Notes:**
- Stores OTP in `email_verifications` or `phone_verifications` table
- OTP is a 6-digit code
- Rate limiting: INFERRED — `attempts` column exists but no explicit cooldown in code

---

### 5.2 POST /api/auth/otp/verify

Verify OTP and create session.

**Request Body:**
```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```
or
```json
{
  "phone": "+919123456789",
  "otp": "123456"
}
```

**Response (200):**
```json
{
  "success": true,
  "session": { ... }
}
```

**Response (400):**
```json
{
  "error": "Invalid or expired OTP"
}
```

---

## 6. Upload API

### 6.1 POST /api/upload

Upload a file (photo). Returns the Cloudinary URL.

**Request:** `multipart/form-data` with file field
**OR** JSON with Cloudinary URL after client-side upload (INFERRED — actual implementation unclear)

**Response (200):**
```json
{
  "url": "https://res.cloudinary.com/.../photo.jpg",
  "public_id": "nadur/abc123"
}
```

---

## 7. Favorites API

### 7.1 GET /api/favorites

List user's favorite operators. Requires authentication.

**Response (200):**
```json
[
  {
    "id": "uuid",
    "operator_id": "uuid",
    "operator": { ... },
    "created_at": "2026-06-13T12:00:00Z"
  }
]
```

### 7.2 POST /api/favorites

Toggle favorite (add/remove). Requires authentication.

**Request Body:**
```json
{
  "operator_id": "uuid"
}
```

**Response (200):**
```json
{
  "favorited": true,
  "favorite_id": "uuid"
}
```

---

## 8. Error Response Format

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
| 409 | Conflict (duplicate slug, etc.) |
| 429 | Too Many Requests (not implemented) |
| 500 | Internal Server Error |

---

## 9. API Route Summary

```
# Public (no auth)
GET    /api/operators                          # List operators
POST   /api/operators                          # Register operator
GET    /api/operators/[slug]                   # Get operator
POST   /api/leads                              # Submit lead
POST   /api/auth/otp/send                      # Send OTP
POST   /api/auth/otp/verify                    # Verify OTP
POST   /api/upload                             # Upload photo

# Authenticated (operator)
PATCH  /api/operators/[slug]                   # Update own profile
GET    /api/leads                              # View own leads
POST   /api/favorites                          # Toggle favorite
GET    /api/favorites                          # List favorites

# Admin only
GET    /api/admin/operators                    # All operators
PATCH  /api/admin/operators/[id]               # Change status
GET    /api/admin/leads                        # All leads

# NextAuth (handled by @auth/core)
GET    /api/auth/session
POST   /api/auth/signin
POST   /api/auth/signout
POST   /api/auth/callback/:provider
GET    /api/auth/callback/:provider
```

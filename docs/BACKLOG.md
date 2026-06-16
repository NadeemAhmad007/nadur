# Backlog & Known Issues

> **Priority labels:** P0 = Critical (blocking), P1 = High (should fix), P2 = Medium (nice to have), P3 = Low (future)

---

## P0 — Critical

### BUG-001: proxy.ts is not next.config.ts middleware
The route protection file is named `proxy.ts` but Next.js middleware must be named `middleware.ts` in the project root or `src/middleware.ts`. The current file may not be picked up, leaving `/admin` and `/portal` unprotected.
- **File:** `src/proxy.ts`
- **Impact:** Unauthenticated users can access admin and portal pages
- **Fix:** Rename to `src/middleware.ts`
- **Verification:** Check if middleware is running by inspecting response headers

---

## P1 — High

### BUG-002: No rate limiting on any API endpoint
All API routes are unprotected against abuse. A malicious actor could:
- Spam lead submissions
- Brute-force OTP verification
- Flood registration endpoint
- **Fix:** Implement rate limiting via Vercel KV, Upstash, or middleware-level throttling

### BUG-003: OTP expiry and attempt limits not enforced
The `expires_at` and `attempts` columns exist in both verification tables but the API does not check them before validating OTP.
- **File:** `src/app/api/auth/otp/verify/route.ts` (INFERRED path)
- **Impact:** Expired OTPs can be used; unlimited brute-force attempts
- **Fix:** Add `WHERE expires_at > NOW() AND attempts < 3` to verification query

### BUG-004: No CSP (Content Security Policy) headers
- **Impact:** Vulnerable to XSS attacks, data injection, and clickjacking
- **Fix:** Add CSP headers in `next.config.ts`:
```typescript
async headers() {
  return [{
    source: '/(.*)',
    headers: [{
      key: 'Content-Security-Policy',
      value: "default-src 'self'; img-src 'self' https://res.cloudinary.com; script-src 'self' 'unsafe-eval'; style-src 'self' 'unsafe-inline';"
    }]
  }];
}
```

### BUG-005: Free plan lead limit not enforced
The `lead_month` column exists but is never checked before lead submission. Free plan operators can receive unlimited leads.
- **File:** `src/app/api/leads/route.ts`
- **Fix:** Before inserting lead, check `operators.lead_month < 3` for free plan operators; increment counter on insertion

### BUG-006: Stale token redirect handling is fragile
The login page detects stale tokens (missing `operator_id`) and calls `signOut()`, but this only works if the user visits the login page. Direct navigation to `/portal` with a stale token causes a redirect loop.
- **File:** `src/app/auth/login/page.tsx`
- **Fix:** Add stale token check in portal layout or middleware

### BUG-007: Client-side admin check is bypassable
The `/admin` page checks `is_admin` in `useEffect` client-side. A savvy user could block the redirect or modify the session client-side.
- **Fix:** Ensure `proxy.ts` (renamed to middleware.ts) server-side check is working; remove client-side redirect as redundant

---

## P2 — Medium

### BUG-008: Photo deletion not implemented
Operators can add photos but cannot remove them. The edit page has no "Remove" or "Delete" button for individual photos.
- **File:** `src/app/portal/edit/page.tsx`
- **Fix:** Add delete button per photo; implement `DELETE /api/upload` or Cloudinary admin API call

### BUG-009: No email notification for new leads
When a visitor submits a lead, the operator is not notified. They must manually visit their dashboard to see new leads.
- **Fix:** Send email to operator via Resend when new lead is created

### BUG-010: No lead deduplication
The same visitor can submit unlimited leads to the same operator (no rate limit per session-operatr pair).
- **Fix:** Implement per-session cooldown (e.g., 1 lead per operator per 24 hours)

### BUG-011: Environment variable `NEXT_PUBLIC_URL` not defined
The app may use `NEXT_PUBLIC_URL` for OAuth callbacks and deep links, but it's not documented in `.env.example`.
- **Fix:** Add to `.env.example` and ensure it's set in production

### BUG-012: No proper 404 for invalid categories
Navigating to a non-existent category (e.g., `/hotel`) may not show a 404 and could return an empty page.
- **File:** `src/app/[category]/page.tsx`
- **Fix:** Validate category param; if invalid, call `notFound()`

### BUG-013: Drizzle schema may be out of sync with DB
Columns added via raw SQL migration (`lat`, `lng`, `email`, `*_details`) may not be properly reflected in `schema.ts`.
- **Fix:** Regenerate Drizzle schema to match actual DB state

### BUG-014: Seed script creates operators with NULL lat/lng
The artisan seed script inserts 171 operators but many may have NULL coordinates, making them invisible to geospatial search.
- **Fix:** `assign_coords.mjs` script exists but may not cover all artisans

### BUG-015: S3 credentials in env but unused
The `.env` file contains S3 credentials but no code path uses them. This is confusing and a potential credential leak surface.
- **Fix:** Remove unused S3 env vars or implement backup S3 upload

---

## P3 — Low / Feature Requests

### FEAT-001: Hindi / Urdu language support
The `categories` table has a `label_hi` column for Hindi labels, but the UI has no language switcher.
- **Effort:** Medium (requires i18n library setup)

### FEAT-002: PWA support
No service worker or manifest configured. Users cannot install the app on their home screen.
- **Effort:** Small (next-pwa or next-offline)

### FEAT-003: Reviews and ratings
Operators cannot be reviewed or rated by visitors.
- **Effort:** Medium (new reviews table, UI, moderation)

### FEAT-004: Booking / reservation system
No way for visitors to book houseboats or shikara rides directly through the app.
- **Effort:** Large (calendar integration, payment processing)

### FEAT-005: Operator analytics dashboard
Operators have no charts, trends, or analytics for leads over time.
- **Effort:** Medium (chart library, aggregation queries)

### FEAT-006: Email notifications for status changes
Operators are not notified when their status changes (approved/rejected/suspended).
- **Effort:** Small (Resend email trigger on status update)

### FEAT-007: Social sharing for operator profiles
No share buttons to share operator profiles on WhatsApp, Facebook, etc.
- **Effort:** Small (Web Share API or social links)

### FEAT-008: Dark mode
- **Effort:** Small (shadcn supports dark mode; just need `darkMode: 'class'` in Tailwind)

### FEAT-009: Operator search filter by price range
Visitors cannot filter operators by price/tariff range.
- **Effort:** Medium (requires indexing pricing data)

### FEAT-010: Map view for browse page
Browse page shows only grid; no map view toggle.
- **Effort:** Medium (Leaflet map with markers)

### FEAT-011: Bulk import / CSV upload for admin
Admin cannot bulk import operators from spreadsheet.
- **Effort:** Medium (file parsing + validation)

### FEAT-012: Email OTP for login as admin bypass
Admin may need to login via email OTP even if Google OAuth is the primary method.
- **Effort:** Small (already implemented)

---

## Recently Fixed Issues

### FIXED-001: JWT callback fails for OTP-authenticated users
When an operator logs in via WhatsApp or email OTP, `user.email` may be undefined. The JWT callback only looked up operators by email, causing `operator_id` to never be set.
- **Fix:** Added fallback: look up operator by `user.id` when email is missing
- **File:** `src/lib/auth.ts` — JWT callback

### FIXED-002: Stale session redirect to /join
Old JWT tokens (from before `operator_id` enrichment) redirected to `/join` instead of the login page, causing a confusing loop.
- **Fix:** Changed redirect to call `signOut()` then redirect to `/auth/login`
- **File:** `src/app/auth/login/page.tsx`

### FIXED-003: Portal and edit pages fail for email-less operators
Operators without email (e.g., those who registered via WhatsApp) couldn't fetch their own profile because the portal page used `email` query param.
- **Fix:** Added fallback: fetch operator by `operator_id` from session when email is empty
- **Files:** `src/app/portal/page.tsx`, `src/app/portal/edit/page.tsx`

### FIXED-004: Edit page save incorrectly nestes tariffs inside houseboat_details
The edit form was sending `tariffs` as a subfield of `houseboat_details` JSONB, causing tariffs to be lost or stored in the wrong column.
- **Fix:** Separated tariffs as a top-level field in the PATCH request body; email also sent at top level
- **File:** `src/app/portal/edit/page.tsx`

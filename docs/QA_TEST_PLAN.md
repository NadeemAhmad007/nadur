# QA Test Plan

> **Status:** No existing tests — this document defines the test strategy for v0.1-alpha  
> **Framework Recommendation:** Playwright (E2E) + Vitest (unit/integration)  

---

## 1. Test Strategy

| Level | Tool | Scope | Priority |
|-------|------|-------|----------|
| Unit | Vitest | lib functions, utils, validation logic | P1 |
| Integration | Vitest | API route handlers, DB queries | P1 |
| Component | Vitest + Testing Library | React component rendering, state, interactions | P2 |
| E2E | Playwright | Full user flows across pages | P1 |

---

## 2. Unit Tests

### 2.1 Lib/Utils Tests

| Test ID | Description | Expected |
|---------|-------------|----------|
| UT-01 | `cn()` merges Tailwind classes correctly | `cn('px-4', 'py-2')` → `'px-4 py-2'` |
| UT-02 | `generateSlug()` converts "Kashmir Houseboats" → "kashmir-houseboats" | Lowercase, spaces→hyphens |
| UT-03 | `generateSlug()` removes special characters | "John's Boat" → "johns-boat" |
| UT-04 | `generateSlug()` adds random suffix on collision | Returns unique slug each time |
| UT-05 | `formatWhatsAppNumber()` normalizes phone format | `+91 9123 456 789` → `+919123456789` |
| UT-06 | WhatsApp deep link URL generation | `createWhatsAppLink('+919123456789')` returns correct `wa.me` URL |

### 2.2 Validation Tests

| Test ID | Description | Expected |
|---------|-------------|----------|
| UT-07 | Valid operator name (≥2 chars) passes | `validateName('AB')` → `{ valid: true }` |
| UT-08 | Empty name fails | `validateName('')` → `{ valid: false }` |
| UT-09 | Valid WhatsApp with country code passes | `validateWhatsApp('+919123456789')` → `true` |
| UT-10 | WhatsApp without country code fails | `validateWhatsApp('9123456789')` → `false` |
| UT-11 | Short desc ≤500 chars passes | `validateShortDesc('...', 500)` → `true` |
| UT-12 | Short desc >500 chars fails | `validateShortDesc('...', 501)` → `false` |

### 2.3 Auth Tests

| Test ID | Description | Expected |
|---------|-------------|----------|
| UT-13 | OTP code generation returns 6 digits | `generateOTP().length === 6` and is numeric |
| UT-14 | OTP expiry calculation | `getOTPExpiry()` returns timestamp 10 min from now |

---

## 3. Integration Tests

### 3.1 API Route Tests (Vitest + Supertest)

| Test ID | Endpoint | Scenario | Expected |
|---------|----------|----------|----------|
| IT-01 | GET /api/operators | Returns approved operators | Status 200, array |
| IT-02 | GET /api/operators | No operators exist | Status 200, empty array |
| IT-03 | GET /api/operators?category=invalid | Invalid category | Status 400 |
| IT-04 | GET /api/operators?search=test | Filters by search query | Returns matching results |
| IT-05 | GET /api/operators?lat=&lng=&radius= | Geospatial filter | Returns operators within radius |
| IT-06 | POST /api/operators | Valid registration | Status 201, returns operator with status='pending' |
| IT-07 | POST /api/operators | Missing required fields | Status 400 |
| IT-08 | POST /api/operators | Duplicate slug | Status 409 |
| IT-09 | GET /api/operators/[slug] | Existing slug | Status 200, full operator object |
| IT-10 | GET /api/operators/[slug] | Non-existent slug | Status 404 |
| IT-11 | PATCH /api/operators/[slug] | Valid update (auth) | Status 200, updated_at changed |
| IT-12 | PATCH /api/operators/[slug] | No auth | Status 401 |
| IT-13 | PATCH /api/operators/[slug] | Unauthorized user | Status 403 |
| IT-14 | POST /api/leads | Valid lead | Status 201 |
| IT-15 | POST /api/leads | Missing operator_id | Status 400 |
| IT-16 | GET /api/auth/otp/send | Valid email | Status 200, OTP stored in DB |
| IT-17 | POST /api/auth/otp/verify | Correct OTP | Status 200, session created |
| IT-18 | POST /api/auth/otp/verify | Wrong OTP | Status 400 |
| IT-19 | POST /api/auth/otp/verify | Expired OTP | Status 400 |
| IT-20 | GET /api/admin/operators | Admin session | Status 200, all operators with lead counts |
| IT-21 | GET /api/admin/operators | Non-admin session | Status 403 |
| IT-22 | PATCH /api/admin/operators/[id] | Admin approves pending | Status 200, status='approved' |
| IT-23 | PATCH /api/admin/operators/[id] | Invalid status transition | INFERRED: Status 400 or 422 |

---

## 4. Component Tests (Testing Library)

| Test ID | Component | Scenario | Expected |
|---------|-----------|----------|----------|
| CT-01 | operator-card | Renders with all props | Shows name, category badge, buttons |
| CT-02 | operator-card | Missing photo | Shows placeholder/fallback image |
| CT-03 | operator-card | Clicks "View Profile" | Navigates to /op/[slug] |
| CT-04 | operator-card | Clicks WhatsApp | Opens wa.me deep link |
| CT-05 | operator-profile | Loading state | Shows skeleton/spinner |
| CT-06 | operator-profile | Error state | Shows error message |
| CT-07 | operator-profile | Houseboat category | Shows houseboat_details section |
| CT-08 | operator-profile | Shikara category | Shows shikara_details section |
| CT-09 | operator-profile | No photos | Gallery section not rendered |
| CT-10 | operator-profile | Lead form submit | Calls POST /api/leads, shows success toast |
| CT-11 | operator-profile | Lead form error | Shows error toast |
| CT-12 | browse-page | Loading state | Shows 8 skeleton cards |
| CT-13 | browse-page | Empty results | Shows "No operators found" |
| CT-14 | browse-page | Category filter click | Updates URL params |
| CT-15 | browse-page | Near Me click | Requests geolocation |
| CT-16 | browse-page | Geolocation denied | Shows error toast |

---

## 5. E2E Tests (Playwright)

### 5.1 Browse Flow (E2E-01)

```
Steps:
1. Navigate to /
2. Click "Browse All" → redirected to /browse
3. Observe operator cards rendered
4. Type in search box → results filter in real-time
5. Click "Near Me" → geolocation prompt (accept)
6. Verify results update with distance
7. Click category "Houseboats" → URL updated, results filter
8. Click on operator card → navigated to /op/[slug]
9. Observe profile page: all sections render
10. Click WhatsApp → new tab opened with wa.me
11. Submit lead form → success toast
```

### 5.2 Registration Flow (E2E-02)

```
Steps:
1. Navigate to /join
2. Fill all required fields (name, phone, category)
3. Submit form
4. Redirected to /auth/login
5. Success toast visible
```

### 5.3 Login & Dashboard Flow (E2E-03)

```
Steps:
1. Navigate to /auth/login
2. Click "Sign in with Google"
3. Complete OAuth flow (test account)
4. Redirected to /portal dashboard
5. Observe profile completion score
6. Click "Edit Profile"
7. Modify fields, add photo via Cloudinary widget
8. Click "Save" → success toast
```

### 5.4 Admin Flow (E2E-04)

```
Steps:
1. Login as admin (nadeemkolu22@gmail.com)
2. Navigate to /admin
3. See all operators table
4. Filter by "Pending" status
5. Click "Approve" on a pending operator
6. Verify status changes to "Approved"
7. View leaderboard section
```

### 5.5 Error Flows (E2E-05)

```
Steps:
1. Navigate to /op/non-existent-slug → 404 page
2. Navigate to /admin without auth → redirected to /auth/login
3. Submit lead with invalid operator_id (API test)
4. Submit registration with existing phone (duplicate check)
```

---

## 6. Performance Tests

| Test ID | Scenario | Target | Tool |
|---------|----------|--------|------|
| PT-01 | Landing page load | LCP < 2.5s | Lighthouse |
| PT-02 | Browse page with 50 operators | FCP < 2s | Lighthouse |
| PT-03 | Geospatial query with 1000 operators | Response < 500ms | k6/autocannon |
| PT-04 | Lead submission API | Throughput > 100 req/s | k6 |
| PT-05 | Photo upload (1MB image) | Upload < 5s | Manual |
| PT-06 | Mobile viewport (375x667) | All content visible, no overflow | Lighthouse |

---

## 7. Security Tests (Manual)

| Test ID | Scenario | Expected |
|---------|----------|----------|
| ST-01 | Attempt to access /admin without session | Redirect to /auth/login |
| ST-02 | Attempt to access /admin as non-admin user | Redirect to /auth/login |
| ST-03 | Attempt to PATCH another operator's profile | Status 403 |
| ST-04 | Submit XSS payload in lead message | Stored safely, not executed |
| ST-05 | Brute-force OTP endpoint (rapid requests) | Rate limited or blocked |
| ST-06 | SQL injection in search parameter | Query sanitized, no injection |
| ST-07 | CSRF: submit lead from external origin | Blocked or requires CSRF token |

---

## 8. Accessibility Tests

| Test ID | WCAG Criterion | Tool |
|---------|---------------|------|
| AT-01 | 1.1.1 Non-text Content (images have alt text) | axe DevTools |
| AT-02 | 1.4.3 Contrast Minimum (text meets 4.5:1) | axe DevTools |
| AT-03 | 2.1.1 Keyboard (all interactive elements focusable) | Manual keyboard nav |
| AT-04 | 2.4.1 Bypass Blocks (skip link present) | Manual check |
| AT-05 | 2.4.4 Link Purpose (links have discernible text) | axe DevTools |
| AT-06 | 3.3.2 Labels (form inputs have labels) | axe DevTools |
| AT-07 | 4.1.2 Name, Role, Value (ARIA attributes correct) | axe DevTools |

---

## 9. Responsive Tests

| Test ID | Viewport | Devices | Check |
|---------|----------|---------|-------|
| RT-01 | 375×667 | iPhone SE | All pages render without horizontal scroll |
| RT-02 | 414×896 | iPhone 12 Pro | Browse grid: 1 column |
| RT-03 | 768×1024 | iPad (portrait) | Browse grid: 2 columns |
| RT-04 | 1024×768 | iPad (landscape) | Browse grid: 2-3 columns |
| RT-05 | 1280×720 | Desktop HD | Browse grid: 3 columns |
| RT-06 | 1920×1080 | Desktop FHD | Browse grid: 4 columns |

---

## 10. Test Data Setup

**Seed data required:**
- 5+ operators (1 per category, various statuses)
- 3+ leads (for different operators)
- 1 admin user (nadeemkolu22@gmail.com)
- Operators with missing fields (for completion score tests)
- Operators with null lat/lng (for geospatial filter tests)
- Operators with complete data (houseboat with details, shikara with routes)
- OTP verification records (expired, valid, max-attempts)

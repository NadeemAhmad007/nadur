# Nadurr — Project Overview

> **Codename:** `nadur-temp` (package.json)  
> **Version:** 0.1.0  
> **Status:** Pre-alpha / Active Development  

---

## 1. What Is Nadurr?

Nadurr is a **SaaS directory platform** that connects tourists and locals with service providers on and around Dal Lake, Srinagar, Kashmir. It serves as a unified discovery, lead-generation, and communication bridge for five categories of operators:

| Category     | Description                          |
|-------------|--------------------------------------|
| Houseboat   | Owners of houseboats (accommodation) |
| Shikara     | Shikara ride operators               |
| Artisan     | Handicraft artisans & craftspeople   |
| Guide       | Local tour guides                    |
| Vendor      | Floating market vendors              |

Each operator gets a **public profile page** with photos, contact info, pricing, and a lead-capture form. The platform uses **geospatial search** (Near Me) to help users find operators nearby and **WhatsApp link** for direct chat.

---

## 2. Core Features

### For Visitors (UnAuthenticated)
- Browse operators by category
- Full-text search by name/description
- Geospatial "Near Me" filtering (radius-based)
- View detailed operator profiles with photo galleries
- Click-to-WhatsApp contact
- View pricing/tariffs (houseboat/shikara)
- Submit leads (contact requests) — tracked per session

### For Operators (Authenticated)
- Dashboard with profile completion score and lead statistics
- Edit own profile (name, description, photos, pricing, contact info)
- Category-specific fields (houseboat_details, shikara_details, artisan_details)
- Upload photos to Cloudinary
- View leads received

### For Admin
- View all operators in a master list
- Approve/reject/suspend operator registrations
- View all leads data (INFERRED — admin leaderboard shows leads per operator)
- Hardcoded admin: nadeemkolu22@gmail.com

---

## 3. Tech Stack

| Layer        | Technology                                   |
|-------------|----------------------------------------------|
| Framework   | Next.js 16.2.9 (App Router, React 19.2.4)   |
| Language    | TypeScript 5.8                               |
| Styling     | Tailwind CSS 4.1.x                           |
| UI          | shadcn/ui (Radix primitives + class-variance-authority) |
| Database    | Neon (Serverless PostgreSQL)                 |
| ORM         | Drizzle ORM 0.45.2                           |
| Auth        | NextAuth v5 beta (@auth/core 0.41.2)        |
| Email       | Resend                                       |
| File Upload | Cloudinary (via CldUploadButton)             |
| Maps        | Leaflet (react-leaflet) + OpenStreetMap tiles|
| Icons       | Lucide React                                 |
| Storage     | S3-compatible (credentials in env)           |
| Linting     | ESLint 9.x (flat config)                     |

---

## 4. Directory Structure

```
nadur/
├── .env / .env.example            # Environment variables
├── next.config.ts                 # Next.js config (images, rewrites, webpack)
├── drizzle.config.ts              # Drizzle ORM config (Neon connection)
├── tsconfig.json                  # TypeScript config (strict mode, path aliases)
├── package.json                   # Dependencies & scripts
├── eslint.config.mjs              # ESLint flat config
├── postcss.config.mjs             # PostCSS (Tailwind v4)
│
├── public/                        # Static assets (favicon, pics, etc.)
│
├── src/
│   ├── middleware.ts              # (present in some commands; NOT present on disk; proxy.ts exists instead)
│   ├── proxy.ts                   # Route guard for /admin and /portal
│   │
│   ├── app/                       # Next.js App Router pages
│   │   ├── layout.tsx             # Root layout (imports globals.css, Geist font)
│   │   ├── page.tsx               # Landing page (hero, steps, categories grid, testimonials)
│   │   ├── globals.css            # Tailwind directives + custom CSS
│   │   ├── not-found.tsx          # 404 page
│   │   │
│   │   ├── browse/                # /browse — public operator directory
│   │   ├── join/                  # /join — operator sign-up
│   │   ├── admin/                 # /admin — admin dashboard
│   │   ├── portal/                # /portal — operator dashboard
│   │   │   ├── page.tsx           # Dashboard home
│   │   │   ├── layout.tsx         # Portal shell with sidebar
│   │   │   └── edit/              # /portal/edit — edit profile
│   │   ├── auth/                  # /auth/login — authentication
│   │   ├── api/                   # API route handlers
│   │   ├── [category]/            # Category listing pages (5 category dirs)
│   │   └── op/                    # /op/[slug] — public operator profile
│   │
│   ├── components/                # Shared React components
│   │   ├── browse-page.tsx        # Full browse page component
│   │   ├── operator-card.tsx      # Operator card (grid)
│   │   ├── operator-profile.tsx   # Public profile page component
│   │   ├── search-command.tsx     # Search command palette (INFERRED from import)
│   │   └── ui/                    # shadcn/ui components
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── badge.tsx
│   │       ├── input.tsx
│   │       ├── dialog.tsx
│   │       ├── sheet.tsx
│   │       ├── textarea.tsx
│   │       └── skeleton.tsx
│   │
│   ├── lib/                       # Library / utility code
│   │   ├── auth.ts                # NextAuth config (providers, callbacks)
│   │   ├── db.ts                  # Drizzle client (Neon)
│   │   ├── upload.ts              # Cloudinary / S3 upload utilities
│   │   ├── resend.ts              # Resend email client
│   │   ├── utils.ts               # Misc utilities (cn, slug generation)
│   │   ├── constants.ts           # App-wide constants
│   │   └── whatsapp.ts            # WhatsApp link / message utilities
│   │
│   ├── db/                        # Database layer
│   │   ├── schema.ts              # Drizzle table definitions
│   │   └── migrate.ts             # SQL migration script (raw SQL via neon)
│   │
│   └── types/                     # TypeScript types
│       └── index.ts               # All shared types & interfaces
│
├── scripts/
│   ├── seed-artisans.mjs          # Seed script (171 artisans from spreadsheet)
│   ├── assign_coords.mjs          # Assign lat/lng to operators
│   ├── check_hyperlinks.mjs       # Validate hyperlinks in data
│   ├── check_xlsx.mjs             # Validate XLSX spreadsheet
│   └── test_operator.mjs          # Test operator data
│
└── docs/                          # Documentation (this directory)
```

---

## 5. Database Overview

**Two primary tables** + four auxiliary tables:

| Table                | Purpose                          | Rows (est.) |
|---------------------|----------------------------------|-------------|
| `operators`         | Core operator profiles (22 cols) | ~200        |
| `leads`             | Contact request submissions      | ~0          |
| `categories`        | Category definitions (5 rows)    | 5           |
| `favorites`         | User favorites                   | ~0          |
| `phone_verifications` | WhatsApp OTP store           | ~0          |
| `email_verifications`  | Email OTP store              | ~0          |

See [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) for full details.

---

## 6. Authentication System

- **Framework:** NextAuth v5 beta (@auth/core v0.41.2)
- **Three providers:**
  1. **Google OAuth** — standard OAuth sign-in
  2. **Email OTP** — magic link via Resend (6-digit code sent to email)
  3. **WhatsApp OTP** — SMS-like one-time password via WhatsApp (INFERRED — requires WhatsApp Business API integration)
- **Session strategy:** JWT (no database sessions)
- **Callbacks:**
  - `jwt()` — enriches token with `operator_id`, `is_admin`, `user_role`
  - `session()` — injects enriched fields into session object
- **Route protection:** `proxy.ts` middleware (runs on `/admin/*` and `/portal/*`)
  - `/admin/*` requires `is_admin === true`
  - `/portal/*` requires any valid session
- **Stale session handling:** Login page checks for missing `operator_id` in session and calls `signOut()` to clear invalid tokens (fixed in current code)

---

## 7. Key Flows

| Flow                    | Path                        |
|------------------------|-----------------------------|
| Browse operators       | `/browse`                   |
| View category listing  | `/[category]`               |
| View operator profile  | `/op/[slug]`                |
| Register as operator   | `/join`                     |
| Login                  | `/auth/login`               |
| Operator dashboard     | `/portal`                   |
| Edit profile           | `/portal/edit`              |
| Admin panel            | `/admin`                    |

See [USER_FLOWS.md](./USER_FLOWS.md) for detailed flow diagrams.

---

## 8. API Endpoints

| Method | Path                          | Purpose                   |
|--------|-------------------------------|---------------------------|
| GET    | `/api/operators`              | List operators (with filters) |
| POST   | `/api/operators`              | Create operator           |
| GET    | `/api/operators/[slug]`       | Get single operator       |
| PATCH  | `/api/operators/[slug]`       | Update operator           |
| GET    | `/api/leads`                  | List leads (admin)        |
| POST   | `/api/leads`                  | Submit lead               |
| GET    | `/api/auth/session`           | Get current session (NextAuth) |
| POST   | `/api/auth/signin`            | Sign in (NextAuth)        |
| POST   | `/api/auth/signout`           | Sign out (NextAuth)       |
| POST   | `/api/auth/callback/*`        | OAuth/OTP callbacks       |
| POST   | `/api/auth/otp/send`          | Send OTP (email/whatsapp) |
| POST   | `/api/auth/otp/verify`        | Verify OTP                |
| POST   | `/api/upload`                 | Upload photo              |
| GET    | `/api/admin/operators`        | List all operators (admin)|
| PATCH  | `/api/admin/operators/[id]`   | Update operator status    |
| GET    | `/api/admin/leads`            | All leads (admin)         |
| GET    | `/api/favorites`              | List favorites            |
| POST   | `/api/favorites`              | Toggle favorite           |

See [API_SPEC.md](./API_SPEC.md) for full request/response schemas.

---

## 9. Third-Party Integrations

| Service       | Purpose                        | Env Vars Needed                          |
|--------------|--------------------------------|------------------------------------------|
| Neon         | PostgreSQL database            | `DATABASE_URL`                           |
| Cloudinary   | Image upload & CDN             | `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` |
| Resend       | Transactional emails           | `RESEND_API_KEY`                         |
| Google       | OAuth authentication           | `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`   |
| S3-compatible| File storage (INFERRED backup) | `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_BUCKET_NAME`, `S3_ENDPOINT` |
| WhatsApp     | OTP / contact (INFERRED)       | `WHATSAPP_API_KEY` (REQUIRES VERIFICATION)|
| Leaflet/OSM  | Maps (free, no API key needed)| None                                     |

---

## 10. Known Gaps & Risks

- **Payment:** No Stripe or billing integration. The `plan` field exists but is never checked/enforced.
- **Middleware:** The `proxy.ts` file exists but it's unclear if it's registered as Next.js middleware (filename vs `middleware.ts` convention).
- **Admin guard:** `/admin` page checks `is_admin` on the client side only; the real guard is in `proxy.ts`.
- **No proper logout:** No dedicated sign-out endpoint; handled by NextAuth's built-in `signOut()`.
- **Lead limit not enforced:** Free plan allows 3 leads/month, but no code enforces this limit.
- **No rate limiting:** API endpoints have no throttling.
- **No CSP headers:** Content Security Policy not configured.
- **S3 credentials present but unused:** `S3_*` vars exist in env but no S3 upload code path found.
- **Geospatial index:** `operators_earth_idx` uses `ll_to_earth(lat, lng)` but some operators may have null lat/lng.
- **No tests:** Zero test files found in the codebase.
- **Drizzle schema out of sync:** `src/db/schema.ts` references columns added via raw migration (lat, lng, category_details) but may not match exactly.

---

## 11. Architecture Diagram

```mermaid
graph TB
    subgraph Client [Browser / Mobile]
        A[Next.js App Router]
        B[React 19 Components]
        C[Tailwind CSS / shadcn UI]
    end

    subgraph NextJS [Next.js Server]
        D[Server Components / RSC]
        E[API Routes / Route Handlers]
        F[proxy.ts Middleware]
        G[NextAuth v5]
    end

    subgraph Services [Third-Party Services]
        H[Neon PostgreSQL]
        I[Cloudinary CDN]
        J[Resend Email]
        K[Google OAuth]
        L[WhatsApp API]
        M[OSM / Leaflet Tiles]
    end

    subgraph Storage [File Storage]
        N[S3-compatible Storage]
    end

    A --> D
    D --> E
    F --> A
    E --> G
    G --> K
    G --> J
    G --> L
    E --> H
    E --> I
    A --> M
    E --> N
```

---

## 12. Scripts (package.json)

| Script             | Command                              |
|-------------------|--------------------------------------|
| `dev`             | `next dev` (port 3000)              |
| `build`           | `next build`                        |
| `start`           | `next start`                        |
| `lint`            | `next lint`                         |
| `db:generate`     | `drizzle-kit generate`              |
| `db:migrate`      | `npx tsx src/db/migrate.ts`         |
| `db:push`         | `drizzle-kit push`                  |
| `db:studio`       | `drizzle-kit studio`                |
| `seed:artisans`   | `node scripts/seed-artisans.mjs`    |
| `assign:coords`   | `node scripts/assign_coords.mjs`    |

---

## 13. Environment Variables

| Variable                            | Required | Description                        |
|------------------------------------|----------|------------------------------------|
| `DATABASE_URL`                     | Yes      | Neon PostgreSQL connection string  |
| `AUTH_SECRET`                      | Yes      | NextAuth encryption secret         |
| `AUTH_GOOGLE_ID`                   | Yes      | Google OAuth client ID             |
| `AUTH_GOOGLE_SECRET`               | Yes      | Google OAuth client secret         |
| `RESEND_API_KEY`                   | Yes      | Resend API key for emails          |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`| Yes      | Cloudinary cloud name              |
| `CLOUDINARY_API_KEY`               | Yes      | Cloudinary API key                 |
| `CLOUDINARY_API_SECRET`            | Yes      | Cloudinary API secret              |
| `S3_ACCESS_KEY_ID`                 | No       | S3 access key (unused in code)     |
| `S3_SECRET_ACCESS_KEY`             | No       | S3 secret key (unused in code)     |
| `S3_BUCKET_NAME`                   | No       | S3 bucket name (unused in code)    |
| `S3_ENDPOINT`                      | No       | S3 endpoint URL (unused in code)   |
| `WHATSAPP_API_KEY`                 | INFERRED | WhatsApp Business API key          |
| `NEXT_PUBLIC_URL`                  | INFERRED | Base URL for the app               |
| `NEXT_PUBLIC_EMAIL_FROM`           | INFERRED | From address for emails            |

---

## 14. Development Status

```
🚧 Landing Page        ✅ Complete
🚧 Browse Page         ✅ Complete
🚧 Category Pages      ✅ Complete (5 categories)
🚧 Operator Profile    ✅ Complete
🚧 Operator Join       ✅ Complete
🚧 Auth System         ✅ Complete (3 providers)
🚧 Operator Dashboard  ✅ Complete
🚧 Operator Edit       ✅ Complete
🚧 Admin Panel         ✅ Complete (basic)
🚧 Geospatial Search   ✅ Complete
🚧 Lead Capture        ✅ Complete
🚧 Photo Upload        ✅ Complete
🚧 Seed Data           ✅ Complete (171 artisans)
🚧 Payment/Billing     ❌ Not started
🚧 Testing             ❌ Not started
🚧 Rate Limiting       ❌ Not started
🚧 Analytics           ❌ Not started
🚧 i18n/Hindi          ❌ Not started
🚧 PWA                 ❌ Not started
🚧 SEO                 ⚠️ Basic (metadata in layout)
```

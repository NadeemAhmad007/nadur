# System Architecture

## 1. High-Level Architecture

```mermaid
graph TB
    subgraph CDN [Content Delivery]
        V[Vercel Edge Network]
    end

    subgraph Client [Browser]
        R[React 19 SPA]
        T[Tailwind CSS / shadcn]
        L[Leaflet Maps]
        CL[Cloudinary Widget]
    end

    subgraph NextJS [Next.js 16 Server]
        direction TB
        SC[Server Components RSC]
        CC[Client Components]
        API[API Route Handlers]
        MW[proxy.ts Middleware]
        NA[NextAuth v5]
    end

    subgraph Data [Data Layer]
        DB[(Neon PostgreSQL)]
        DZ[Drizzle ORM]
    end

    subgraph External [External Services]
        C[Cloudinary]
        R[Resend]
        G[Google OAuth]
        W[WhatsApp API]
        O[OpenStreetMap Tiles]
        S3[S3-compatible Storage]
    end

    Client --> CDN
    CDN --> NextJS
    NextJS --> Data
    NextJS --> External

    SC --> DZ
    CC --> API
    API --> DZ
    MW --> NA
    NA --> G
    NA --> R
    NA --> W
    API --> C
    CC --> C
    CC --> L
    L --> O
    API --> S3
```

---

## 2. Component Architecture

```mermaid
graph TB
    subgraph App [App Router Pages]
        L[layout.tsx]
        LP[page.tsx - Landing]
        BR[browse/page.tsx]
        CT[category/page.tsx]
        OP[op/slug/page.tsx]
        JN[join/page.tsx]
        LG[auth/login/page.tsx]
        PO[portal/layout.tsx]
        PD[portal/page.tsx]
        PE[portal/edit/page.tsx]
        AD[admin/page.tsx]
        NF[not-found.tsx]
    end

    subgraph Components [Shared Components]
        BP[browse-page.tsx]
        OC[operator-card.tsx]
        OPR[operator-profile.tsx]
        SC[search-command.tsx]
        UI[ui/*.tsx - shadcn]
    end

    subgraph Lib [Library Layer]
        A[auth.ts]
        DB[db.ts]
        U[upload.ts]
        RE[resend.ts]
        UT[utils.ts]
        CO[constants.ts]
        WH[whatsapp.ts]
    end

    subgraph Types [Types]
        TY[index.ts]
    end

    subgraph DB [Database]
        SCHEMA[schema.ts]
        MIG[migrate.ts]
    end

    BR --> BP
    CT --> OC
    OP --> OPR
    JN --> A
    LG --> A
    PD --> A
    PD --> DB
    PE --> A
    PE --> DB
    PE --> U
    AD --> A
    AD --> DB

    BP --> OC
    BP --> UI
    OPR --> UI
    OPR --> WH

    A --> NA[NextAuth]
    A --> DZ[Drizzle]
    A --> RE
    DB --> DZ
    U --> CL[Cloudinary SDK]
    RE --> R[Resend SDK]

    SCHEMA --> DZ
    MIG --> NEON[@neondatabase/serverless]
```

---

## 3. Data Flow Pattern

```mermaid
sequenceDiagram
    participant Browser
    participant NextJS as Next.js Server
    participant DB as PostgreSQL
    participant Cloudinary
    participant Resend
    participant WhatsApp

    Note over Browser,NextJS: Server Components (RSC)
    Browser->>NextJS: Request /browse (initial load)
    NextJS->>NextJS: Server Component renders
    NextJS->>DB: SELECT operators (via Drizzle)
    DB-->>NextJS: rows
    NextJS-->>Browser: SSR HTML + RSC payload

    Note over Browser,NextJS: Client Components (later interactions)
    Browser->>NextJS: Click "Near Me"
    NextJS->>Browser: Browser geolocation prompt
    Browser->>Browser: Gets lat/lng
    Browser->>NextJS: GET /api/operators?lat=...&lng=...
    NextJS->>DB: SELECT with earthdistance filter
    DB-->>NextJS: rows
    NextJS-->>Browser: JSON

    Note over Browser,NextJS: Auth Flow
    Browser->>NextJS: Sign in with Google
    NextJS->>Resend: Send OTP email
    NextJS->>WhatsApp: Send OTP message
    NextJS->>DB: Verify OTP
    DB-->>NextJS: verified
    NextJS-->>Browser: JWT session cookie

    Note over Browser,NextJS: Photo Upload
    Browser->>Cloudinary: Upload image (CldUploadButton)
    Cloudinary-->>Browser: secure_url
    Browser->>NextJS: PATCH /api/operators/[slug] { photos: [...] }
    NextJS->>DB: UPDATE operators SET photos
    DB-->>NextJS: success
    NextJS-->>Browser: 200
```

---

## 4. Route Protection Architecture

```mermaid
flowchart TD
    A[Incoming Request] --> B{Path matches /admin/* or /portal/*?}
    B -->|No| C[NextResponse.next - pass through]
    B -->|Yes| D{Has valid session?}
    D -->|No| E[Redirect to /auth/login]
    D -->|Yes| F{Path is /admin/*?}
    F -->|No| G[Allow - render /portal]
    F -->|Yes| H{is_admin === true?}
    H -->|No| I[Redirect to /auth/login]
    H -->|Yes| J[Allow - render /admin]
```

**Implementation:** `src/proxy.ts`
- Runs as middleware (should be `middleware.ts` per Next.js convention — current filename may prevent automatic execution)
- Uses `matcher: ['/admin/:path*', '/portal/:path*']`
- Calls `auth()` (NextAuth) to get session
- For `/admin`: checks `session.user.is_admin === true`
- For `/portal`: checks `session` exists

**Client-side redundant checks:**
- `/admin` page re-checks `session?.user?.is_admin` in useEffect and redirects if not admin
- `/portal` layout re-checks session

---

## 5. State Management

**No global state library** (no Redux, Zustand, or Jotai). State is managed through:

| State Type | Mechanism |
|-----------|-----------|
| Server state | React Server Components (RSC) — direct DB access |
| Client state | React `useState`, `useEffect` |
| URL state | `useSearchParams` for browse filters |
| Session | NextAuth's `useSession()` hook (React Context) |
| Form state | Local component state |
| Toasts | Sonner (global toast context in root layout) |

---

## 6. File Upload Architecture

```mermaid
flowchart LR
    U[User clicks Upload] --> W[CldUploadButton opens]
    W --> P[User selects file]
    P --> CU[Cloudinary Upload API]
    CU --> UU[Upload to Cloudinary CDN]
    UU --> CU
    CU --> CB[JavaScript callback]
    CB --> S[Save URL to operator.photos array]
    S --> D[PATCH API -> DB]
```

**Key Points:**
- Cloudinary widget (`CldUploadButton` from `next-cloudinary`) handles client-side upload
- No server-side upload processing
- URLs stored as TEXT[] array in `operators.photos`
- Backup S3 upload is INFERRED (env vars exist but no code path found)

---

## 7. Geospatial Search Architecture

```mermaid
flowchart LR
    U[User clicks Near Me] --> G[Browser Geolocation API]
    G --> GL[Gets lat/lng]
    GL --> R[Builds URL: /api/operators?lat=...&lng=...&radius=5000]
    R --> Q[(PostgreSQL Query)]
    Q --> E[earth_distance ll_to_earth]
    E --> I[GiST Index Scan]
    I --> RE[Returns results]
```

**Performance:**
- GiST index on `ll_to_earth(lat, lng)` enables fast radius searches
- Index only works when both `lat` and `lng` are non-null
- Query pattern: `SELECT * FROM operators WHERE earth_distance(ll_to_earth(lat, lng), ll_to_earth($1, $2)) <= $3`

---

## 8. Session & Auth Architecture

```mermaid
flowchart TD
    subgraph NextAuth [NextAuth v5 Config]
        JWT[JWT Callback]
        S[Session Callback]
        P1[Google Provider]
        P2[Credentials Provider - Email OTP]
        P3[Credentials Provider - WhatsApp OTP]
    end

    subgraph Flow [Auth Flow]
        L[Login Form] -->|Google| P1
        L -->|Email OTP| P2
        L -->|WhatsApp OTP| P3
        P1 -->|OAuth callback| JWT
        P2 -->|OTP verify| JWT
        P3 -->|OTP verify| JWT
        JWT -->|Add operator_id, is_admin, user_role| T[Enriched JWT]
        T -->|Store in cookie| C[Session Cookie]
        C -->|Session callback| S
        S -->|Inject into session| SS[Session with user.operator_id, user.is_admin]
    end

    subgraph Callback [JWT Callback Logic]
        E[Is there user.email?] -->|Yes| LOOK[Look up operator by email]
        E -->|No| FALLBACK[Look up operator by user.id]
        LOOK --> FOUND{Operator found?}
        FALLBACK --> FOUND
        FOUND -->|Yes| ADD[Add operator_id, is_admin, user_role to token]
        FOUND -->|No| ADMIN{Is admin email?}
        ADMIN -->|Yes| SET_ADMIN[Set is_admin = true]
        ADMIN -->|No| SKIP[Skip enrichment]
    end
```

---

## 9. Dependencies & Imports Map

```
src/app/page.tsx
  ├── next/link
  ├── lucide-react (icons)
  └── @/components/ui/*

src/components/browse-page.tsx
  ├── next/navigation (useSearchParams, useRouter)
  ├── react (useState, useEffect, useCallback)
  ├── @/lib/utils (cn)
  ├── @/components/operator-card
  ├── lucide-react
  └── sonner (toast)

src/components/operator-card.tsx
  ├── next/link
  ├── @/lib/utils (cn)
  ├── @/types
  └── lucide-react

src/components/operator-profile.tsx
  ├── next/navigation (useParams)
  ├── react (useState, useEffect)
  ├── @/lib/utils (cn)
  ├── @/lib/whatsapp
  ├── @/types
  ├── lucide-react
  ├── sonner
  ├── react-leaflet (MapContainer, TileLayer, Marker, Popup)
  └── leaflet (icon)

src/lib/auth.ts
  ├── next-auth/adapters
  ├── @auth/core (NextAuth v5 beta)
  ├── next-auth/providers/google
  ├── next-auth/providers/resend (INFERRED — or custom credentials)
  ├── @/lib/db (Drizzle instance)
  └── @/db/schema (operators table)

src/lib/db.ts
  ├── @neondatabase/serverless (neon)
  └── drizzle-orm/neon-http (drizzle)
```

---

## 10. Deployment Architecture

```mermaid
graph TB
    subgraph Dev [Development]
        DEV[localhost:3000]
        DB_DEV[Neon Development DB]
    end

    subgraph CI [CI/CD - Not Implemented]
        GH[GitHub]
        LINT[ESLint]
        BUILD[Next Build]
    end

    subgraph Prod [Production - Target]
        VERCEL[Vercel Deployment]
        DB_PROD[Neon Production DB]
        CL_PROD[Cloudinary Production]
        RESEND_PROD[Resend Production]
    end

    Dev -->|git push| GH
    GH -->|manual deploy| VERCEL
    VERCEL --> DB_PROD
    VERCEL --> CL_PROD
    VERCEL --> RESEND_PROD
```

**Current State:**
- No CI/CD pipeline configured
- No Docker configuration
- Deployment is manual (vercel CLI or git push to Vercel)
- Development uses local `next dev` on port 3000
- Production target is Vercel (Next.js optimization is configured)

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
        W[OpenWA WhatsApp Gateway]
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
```

---

## 2. Component Architecture

```mermaid
graph TB
    subgraph App [App Router Pages]
        L[layout.tsx]
        HP[page.tsx - Browse Home]
        OP[o/slug/page.tsx]
        SP[search/page.tsx]
        FP[favorites/page.tsx]
        JN[join/page.tsx]
        LG[auth/login/page.tsx]
        PO[portal/layout.tsx]
        PD[portal/page.tsx]
        PE[portal/edit/page.tsx]
        AD[admin/page.tsx]
        AO[admin/operators/page.tsx]
        ADET[admin/operators/[id]/page.tsx]
        AC[admin/categories/page.tsx]
        NF[not-found.tsx]
    end

    subgraph Components [Shared Components]
        BP[browse-page.tsx]
        OC[operator-card.tsx]
        OPR[operator-profile.tsx]
        UI[ui/*.tsx - shadcn]
    end

    subgraph Lib [Library Layer]
        A[auth.ts]
        CL[cloudinary.ts]
        OW[openwa.ts]
        RE[resend.ts]
        S3[s3.ts]
        LOC[location.ts]
        GH[ghats.ts]
        UT[utils.ts]
    end

    subgraph Types [Types]
        TY[index.ts]
    end

    subgraph DB [Database]
        SCHEMA[schema.ts]
        MIG[migrate.ts]
    end

    HP --> BP
    OP --> OPR
    SP --> OC
    FP --> OC
    JN --> UT
    LG --> A
    PD --> A
    PE --> UT
    AD --> A

    BP --> OC
    BP --> UI
    OPR --> UI

    A --> NA[NextAuth]
    A --> DZ[Drizzle]
    RE --> R[Resend SDK]
    CL --> C[Cloudinary SDK]

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
    participant OpenWA

    Note over Browser,NextJS: Server Components (RSC)
    Browser->>NextJS: Request / (initial load)
    NextJS->>NextJS: Server Component renders
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
    Browser->>NextJS: POST /api/auth/send-otp { email }
    NextJS->>Resend: Send OTP email
    Resend-->>NextJS: sent
    NextJS-->>Browser: { ok: true }
    Browser->>NextJS: POST /api/auth/verify { email, otp }
    NextJS->>DB: Verify OTP
    DB-->>NextJS: verified
    NextJS-->>Browser: JWT session cookie

    Note over Browser,NextJS: Photo Upload
    Browser->>NextJS: POST /api/upload/photo (multipart)
    NextJS->>Cloudinary: Upload buffer
    Cloudinary-->>NextJS: { url, publicId }
    NextJS-->>Browser: { url, key }
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
- Runs as middleware (file is `proxy.ts`, not `middleware.ts` — may need renaming per Next.js convention)
- Uses `matcher: ['/admin/:path*', '/portal/:path*']`
- Calls `auth()` (NextAuth) to get session
- For `/admin`: checks `session.user.is_admin === true`
- For `/portal`: checks `session` exists

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
| Toasts | Sonner (global toast context) |

---

## 6. File Upload Architecture

```mermaid
flowchart LR
    U[User clicks Upload] --> P[File input onChange]
    P --> C[Compress via browser-image-compression]
    C --> F[POST /api/upload/photo multipart/form-data]
    F --> N[Next.js API Route]
    N --> CL[Upload to Cloudinary]
    CL --> CLR[Return { url, publicId }]
    CLR --> S[Save URL to operator.photos array]
    S --> D[PATCH API -> DB]
```

**Key Points:**
- Upload via custom API route, not client-side widget
- Server validates MIME type (jpeg/png/webp) and size (max 5MB)
- Images compressed client-side before upload

---

## 7. Geospatial Search Architecture

```mermaid
flowchart LR
    U[User clicks Near Me] --> G[Browser Geolocation API]
    G --> GL[Gets lat/lng]
    GL --> R[Builds URL: /api/operators?lat=...&lng=...&radius=10000]
    R --> Q[(PostgreSQL Query)]
    Q --> E[earth_distance ll_to_earth]
    E --> I[GiST Index Scan]
    I --> RE[Returns results]
```

**Performance:**
- GiST index on `ll_to_earth(lat, lng)` enables fast radius searches
- Index only works when both `lat` and `lng` are non-null

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
        JWT -->|Add operator_id, is_admin| T[Enriched JWT]
        T -->|Store in cookie| C[Session Cookie]
        C -->|Session callback| S
        S -->|Inject into session| SS[Session with user.operator_id, user.is_admin]
    end

    subgraph Callback [JWT Callback Logic]
        E[Is there user.email?] -->|Yes| LOOK[Look up operator by email]
        E -->|No| FALLBACK[Look up operator by user.id]
        LOOK --> FOUND{Operator found?}
        FALLBACK --> FOUND
        FOUND -->|Yes| ADD[Add operator_id, is_admin to token]
        FOUND -->|No| ADMIN{Is admin email?}
        ADMIN -->|Yes| SET_ADMIN[Set is_admin = true]
        ADMIN -->|No| SKIP[Skip enrichment]
    end
```

---

## 9. Dependencies & Imports Map

```
src/app/page.tsx
  └── @/components/browse-page

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
  ├── @/types
  ├── lucide-react
  └── sonner

src/lib/auth.ts
  ├── @auth/core (NextAuth v5 beta)
  ├── next-auth/providers/google
  ├── @/db (Drizzle instance)
  └── @/db/schema (operators table)
```

---

## 10. Deployment Architecture

```mermaid
graph TB
    subgraph Dev [Development]
        DEV[localhost:3000]
        DB_DEV[Neon Development DB]
    end

    subgraph Prod [Production - Target]
        VERCEL[Vercel Deployment]
        DB_PROD[Neon Production DB]
        CL_PROD[Cloudinary Production]
        RESEND_PROD[Resend Production]
        OWA[OpenWA Docker Container]
    end

    Dev -->|git push| VERCEL
    VERCEL --> DB_PROD
    VERCEL --> CL_PROD
    VERCEL --> RESEND_PROD
```

**Current State:**
- No CI/CD pipeline configured
- OpenWA WhatsApp gateway runs via Docker (`docker-compose.openwa.yml`)
- Deployment is manual (vercel CLI or git push to Vercel)

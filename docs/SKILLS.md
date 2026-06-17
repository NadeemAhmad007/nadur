# Skills & Context for AI Agents

> This file provides structured context for AI coding assistants (like Claude + opencode) to understand the codebase, conventions, and common tasks.

---

## 1. Project Identity

- **Project:** Nadurr (Dal Lake operator directory)
- **Stack:** Next.js 16 App Router + React 19 + Drizzle ORM + Neon PostgreSQL
- **Auth:** NextAuth v5 beta with 3 providers (Google, Email OTP, WhatsApp OTP)
- **Agent Instructions:** See `AGENTS.md` for Next.js framework notes

---

## 2. Key Files & Locations

| Purpose | Path |
|---------|------|
| Root layout | `src/app/layout.tsx` |
| Browse page (home) | `src/app/page.tsx` (renders `src/components/browse-page.tsx`) |
| Search page | `src/app/search/page.tsx` |
| Operator profile | `src/components/operator-profile.tsx` (route: `/o/[slug]`) |
| Operator card | `src/components/operator-card.tsx` |
| Login page | `src/app/auth/login/page.tsx` |
| Join page | `src/app/join/page.tsx` |
| Portal dashboard | `src/app/portal/page.tsx` |
| Portal layout | `src/app/portal/layout.tsx` |
| Edit profile | `src/app/portal/edit/page.tsx` |
| QR code page | `src/app/portal/qr/page.tsx` |
| Admin dashboard | `src/app/admin/page.tsx` |
| Admin operators list | `src/app/admin/operators/page.tsx` |
| Admin operator detail | `src/app/admin/operators/[id]/page.tsx` |
| Admin categories | `src/app/admin/categories/page.tsx` |
| Favorites page | `src/app/favorites/page.tsx` |
| 404 page | `src/app/not-found.tsx` |
| Auth config | `src/lib/auth.ts` |
| DB schema | `src/db/schema.ts` |
| DB migration | `src/db/migrate.ts` |
| DB client | `src/db/index.ts` |
| Route guard | `src/proxy.ts` (should be middleware.ts) |
| Types | `src/types/index.ts` |
| Utils | `src/lib/utils.ts` |
| Cloudinary upload | `src/lib/cloudinary.ts` |
| OpenWA WhatsApp | `src/lib/openwa.ts` |
| Resend email | `src/lib/resend.ts` |
| S3 client | `src/lib/s3.ts` |
| Location parser | `src/lib/location.ts` |
| Ghats data | `src/lib/ghats.ts` |

---

## 3. Common Tasks

### 3.1 Adding a New API Route

1. Create file: `src/app/api/{resource}/route.ts`
2. Export named functions: `GET`, `POST`, `PATCH`, `DELETE`
3. Use `auth()` from `@/lib/auth` for protected routes
4. Use `db` from `@/db` for database access
5. Return `NextResponse.json(data, { status })`

**Pattern:**
```typescript
import { NextResponse } from 'next/server';
import { db } from '@/db';
import { auth } from '@/lib/auth';

export async function GET(request: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const data = await db.select().from(/* ... */);
  return NextResponse.json(data);
}
```

### 3.2 Adding a New Page

1. Create directory under `src/app/{path}/`
2. Create `page.tsx` (Server Component by default)
3. Use `"use client"` directive if client-side state is needed
4. Pages in `/portal` and `/admin` are automatically route-guarded by proxy.ts

### 3.3 Database Changes

**Option A — Drizzle Schema (preferred for new development):**
1. Edit `src/db/schema.ts`
2. Run `npm run db:generate` to create SQL migration
3. Run `npm run db:push` to apply

**Option B — Raw SQL Migration:**
1. Edit `src/db/migrate.ts`
2. Add `ALTER TABLE` or `CREATE TABLE` statements
3. Run `npm run db:migrate`
4. Update Drizzle schema to match

### 3.4 Adding an Auth Provider

1. Edit `src/lib/auth.ts`
2. Import provider from `next-auth/providers/*` or `@auth/core/providers/*`
3. Add to `providers` array
4. Handle OTP logic in API routes under `src/app/api/auth/`

### 3.5 Modifying the Operator Schema (Adding Fields)

1. Add column to `operators` table in `src/db/migrate.ts`:
   ```sql
   ALTER TABLE operators ADD COLUMN IF NOT EXISTS new_field TEXT;
   ```
2. Add field to Drizzle schema in `src/db/schema.ts`
3. Add TypeScript type in `src/types/index.ts`
4. Add form field in `src/app/portal/edit/page.tsx`
5. Update profile completion score calculation in `src/app/portal/page.tsx`
6. Display field in public profile: `src/components/operator-profile.tsx`

---

## 4. Conventions

### Naming Conventions
- **Files:** `kebab-case.ts` (e.g., `operator-card.tsx`, `browse-page.tsx`)
- **Directories:** `kebab-case/` (e.g., `auth/login/`, `o/[slug]/`)
- **Components:** PascalCase (e.g., `OperatorCard`, `BrowsePage`)
- **Database columns:** `snake_case` (e.g., `short_desc`, `created_at`)
- **Drizzle schema fields:** snake_case matching DB columns

### Component Patterns
- Shared components in `src/components/`
- Page-specific logic in page files or colocated components
- UI primitives in `src/components/ui/` (shadcn)
- Client Components use `"use client"` directive

### API Patterns
- RESTful endpoints
- Auth: `const session = await auth()` — returns `null` if not authenticated
- Errors: `NextResponse.json({ error: 'message' }, { status: xxx })`
- Success: `NextResponse.json(data, { status: 200 | 201 })`

### Database Patterns
- Use Drizzle ORM for queries
- Use raw SQL in migration script only
- Always parameterize queries (Drizzle does this automatically)

---

## 5. Environment Configuration

```bash
# Required
DATABASE_URL=postgresql://...
AUTH_SECRET=<random-string>
AUTH_GOOGLE_ID=...
AUTH_GOOGLE_SECRET=...
RESEND_API_KEY=...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

# Optional
OPENWA_API_URL=http://localhost:2785/api
OPENWA_API_KEY=...
OPENWA_SESSION=nadur-bot
S3_ACCESS_KEY_ID=...
S3_SECRET_ACCESS_KEY=...
S3_BUCKET=...
S3_ENDPOINT=...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 6. Common Pitfalls

| Pitfall | Description | Solution |
|---------|-------------|----------|
| Stale session redirect loop | Old JWT tokens lack `operator_id` | Login page detects and calls `signOut()` |
| Email-based operator lookup fails | OTP users may not have email | Fallback to `user.id` lookup |
| proxy.ts vs middleware.ts | Route guard file may not be auto-discovered | Rename to `middleware.ts` |
| Drizzle schema out of sync | Raw SQL columns not in Drizzle definitions | Regenerate Drizzle schema |
| No input validation | API inputs not validated | Add Zod schemas to all API routes |
| OTP limits not enforced | `attempts` and `expires_at` not checked | Add WHERE conditions to OTP verification |

---

## 7. Debugging Tips

- Check `session` object: `console.log(JSON.stringify(session, null, 2))`
- Debug JWT callback: add `console.log('JWT callback:', { token, user })` in `src/lib/auth.ts`
- Check middleware execution: add `console.log('Middleware running for:', pathname)` in proxy.ts
- View actual DB state: `npm run db:studio` opens Drizzle Studio GUI
- Debug API requests: use `curl` or browser devtools Network tab

---

## 8. Build & Deploy Commands

```bash
# Development
npm install         # Install dependencies
npm run dev         # Start dev server (localhost:3000)
npm run lint        # Run ESLint

# Database
npm run db:migrate  # Run SQL migration

# Production
npm run build       # Build Next.js
npm run start       # Start production server

# Docker (OpenWA WhatsApp gateway)
docker compose -f docker-compose.openwa.yml up -d
```

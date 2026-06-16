# Skills & Context for AI Agents

> This file provides structured context for AI coding assistants (like Claude + opencode) to understand the codebase, conventions, and common tasks.

---

## 1. Project Identity

- **Project:** Nadurr (Dal Lake operator directory)
- **Stack:** Next.js 16 App Router + React 19 + Drizzle ORM + Neon PostgreSQL
- **Auth:** NextAuth v5 beta with 3 providers (Google, Email OTP, WhatsApp OTP)
- **Agent Instructions:** See `AGENTS.md` for Next.js framework notes
- **Agent Model Note:** See `CLAUDE.md` for model-specific notes

---

## 2. Key Files & Locations

| Purpose | Path |
|---------|------|
| Root layout | `src/app/layout.tsx` |
| Landing page | `src/app/page.tsx` |
| Browse page | `src/components/browse-page.tsx` |
| Category pages | `src/app/[category]/page.tsx` |
| Operator profile | `src/components/operator-profile.tsx` |
| Operator card | `src/components/operator-card.tsx` |
| Login page | `src/app/auth/login/page.tsx` |
| Join page | `src/app/join/page.tsx` |
| Portal dashboard | `src/app/portal/page.tsx` |
| Portal layout | `src/app/portal/layout.tsx` |
| Edit profile | `src/app/portal/edit/page.tsx` |
| Admin panel | `src/app/admin/page.tsx` |
| 404 page | `src/app/not-found.tsx` |
| Auth config | `src/lib/auth.ts` |
| DB schema | `src/db/schema.ts` |
| DB migration | `src/db/migrate.ts` |
| DB client | `src/lib/db.ts` |
| Route guard | `src/proxy.ts` (should be middleware.ts) |
| Types | `src/types/index.ts` |
| Utils | `src/lib/utils.ts` |
| Constants | `src/lib/constants.ts` |
| WhatsApp utils | `src/lib/whatsapp.ts` |
| Upload utils | `src/lib/upload.ts` |
| Resend utils | `src/lib/resend.ts` |

---

## 3. Common Tasks

### 3.1 Adding a New API Route

1. Create file: `src/app/api/{resource}/route.ts`
2. Export named functions: `GET`, `POST`, `PATCH`, `DELETE`
3. Use `auth()` from `@/lib/auth` for protected routes
4. Use `db` from `@/lib/db` for database access
5. Return `NextResponse.json(data, { status })`

**Pattern:**
```typescript
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
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
4. Pages in `/portal` and `/admin` are automatically route-guarded by middleware

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
4. Handle OTP logic in API routes under `src/app/api/auth/otp/`

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
- **Directories:** `kebab-case/` (e.g., `[category]/`, `auth/login/`)
- **Components:** PascalCase (e.g., `OperatorCard`, `BrowsePage`)
- **Functions:** camelCase (e.g., `generateSlug`, `formatWhatsApp`)
- **Database columns:** `snake_case` (e.g., `short_desc`, `created_at`)
- **Drizzle schema fields:** camelCase mapped to snake_case columns

### Component Patterns
- Shared components in `src/components/`
- Page-specific logic in page files or colocated components
- UI primitives in `src/components/ui/` (shadcn)
- Client Components use `"use client"` directive
- Avoid deep prop drilling; compose components

### API Patterns
- RESTful endpoints
- Auth: `const session = await auth()` — returns `null` if not authenticated
- Errors: `NextResponse.json({ error: 'message' }, { status: xxx })`
- Success: `NextResponse.json(data, { status: 200 | 201 })`

### Database Patterns
- Use Drizzle ORM for queries
- Use raw SQL in migration script only
- Always parameterize queries (Drizzle does this automatically)
- Index columns used in WHERE, JOIN, and ORDER BY clauses

---

## 5. Environment Configuration

```bash
# Required
DATABASE_URL=postgresql://...
AUTH_SECRET=<random-string>
AUTH_GOOGLE_ID=...
AUTH_GOOGLE_SECRET=...
RESEND_API_KEY=...
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

# Optional / INFERRED
WHATSAPP_API_KEY=...
S3_ACCESS_KEY_ID=...
S3_SECRET_ACCESS_KEY=...
S3_BUCKET_NAME=...
S3_ENDPOINT=...
NEXT_PUBLIC_URL=http://localhost:3000
```

---

## 6. Data Seeding

```bash
# Seed 171 artisans from Dal_Lake_Artisans_wa.xlsx
npm run seed:artisans

# Assign lat/lng coordinates from address data
npm run assign:coords
```

**Seed script location:** `scripts/seed-artisans.mjs`  
**Seed data source:** `Dal_Lake_Artisans_wa.xlsx` (in project root)  

---

## 7. Common Pitfalls

| Pitfall | Description | Solution |
|---------|-------------|----------|
| Stale session redirect loop | Old JWT tokens lack `operator_id` | Login page detects and calls `signOut()` |
| Email-based operator lookup fails | OTP users may not have email | Fallback to `user.id` lookup |
| proxy.ts vs middleware.ts | Route guard file may not be auto-discovered | Rename to `middleware.ts` |
| Tariffs inside houseboat_details | Edit page `PATCH` nested incorrectly | Send tariffs and email as top-level fields |
| Drizzle schema out of sync | Raw SQL columns not in Drizzle definitions | Regenerate Drizzle schema |
| No input validation | API inputs not validated | Add Zod schemas to all API routes |
| OTP limits not enforced | `attempts` and `expires_at` not checked | Add WHERE conditions to OTP verification |

---

## 8. Debugging Tips

- Check `session` object: `console.log(JSON.stringify(session, null, 2))`
- Debug JWT callback: add `console.log('JWT callback:', { token, user })` in `src/lib/auth.ts`
- Check middleware execution: add `console.log('Middleware running for:', pathname)` in proxy.ts
- View actual DB state: `npm run db:studio` opens Drizzle Studio GUI
- Check environment variables: `console.log(process.env.DATABASE_URL?.slice(0, 20))`
- Debug API requests: use `curl` or browser devtools Network tab
- Check OTP tables: query `SELECT * FROM email_verifications ORDER BY created_at DESC LIMIT 5`
- Seed data issues: run `node scripts/check_xlsx.mjs` to validate spreadsheet

---

## 9. Build & Deploy Commands

```bash
# Development
npm install         # Install dependencies
npm run dev         # Start dev server (localhost:3000)
npm run lint        # Run ESLint

# Database
npm run db:migrate  # Run SQL migration
npm run seed:artisans  # Seed operator data

# Production
npm run build       # Build Next.js
npm run start       # Start production server

# Deploy
vercel              # Deploy preview
vercel --prod       # Deploy production
```

# DevOps & Deployment

---

## 1. Current Infrastructure

| Component | Provider | Configuration |
|-----------|----------|---------------|
| Hosting | Vercel (target) | Next.js optimized |
| Database | Neon (Serverless PostgreSQL) | Single instance |
| Image Storage | Cloudinary | `next-cloudinary` SDK |
| Email | Resend | `resend` SDK |
| Domain | Not configured | Running on Vercel domain |

**Vercel Configuration (`next.config.ts`):**
```typescript
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: '**.vercel.app' },
    ],
  },
  async rewrites() { /* INFERRED — may have custom rewrites */ },
  webpack(config) { /* INFERRED — custom webpack config */ },
};
```

---

## 2. Environment Variables

**Required for production:**

```bash
# Database
DATABASE_URL=postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/nadur?sslmode=require

# Auth
AUTH_SECRET=<random-64-char-string>
AUTH_GOOGLE_ID=<google-oauth-client-id>
AUTH_GOOGLE_SECRET=<google-oauth-client-secret>

# Email
RESEND_API_KEY=<resend-api-key>

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=<cloud-name>
CLOUDINARY_API_KEY=<api-key>
CLOUDINARY_API_SECRET=<api-secret>

# Optional (unused in code)
S3_ACCESS_KEY_ID=<s3-key>
S3_SECRET_ACCESS_KEY=<s3-secret>
S3_BUCKET_NAME=<bucket>
S3_ENDPOINT=<endpoint-url>
```

---

## 3. Database Management

### Migration Commands

```bash
# Run migration (raw SQL script)
npm run db:migrate

# Generate Drizzle schema (for tracking)
npm run db:generate

# Push schema changes (Drizzle Kit)
npm run db:push

# Open Drizzle Studio (GUI)
npm run db:studio
```

### Migration Strategy
- Primary migration: `src/db/migrate.ts` (raw SQL via neon driver)
- Drizzle Kit is configured but secondary
- Migration is idempotent (uses `CREATE TABLE IF NOT EXISTS`, `ADD COLUMN IF NOT EXISTS`)
- Run on deploy (via Vercel post-deploy hook or manual)

### Backup Strategy
- **Current:** ❌ No automated backup configured
- **Recommended:** Enable Neon point-in-time recovery or scheduled exports
- **Manual:** `pg_dump --no-owner --no-acl postgresql://... > backup.sql`

---

## 4. CI/CD Pipeline

**Current State:** ❌ No CI/CD pipeline configured

### Recommended Pipeline (GitHub Actions)

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run lint

  test:
    needs: lint
    runs-on: ubuntu-latest
    env:
      DATABASE_URL: ${{ secrets.TEST_DATABASE_URL }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run db:migrate
      - run: npm test

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

---

## 5. Vercel Deployment

### Manual Deploy
```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy preview
vercel

# Deploy production
vercel --prod
```

### Vercel Configuration
- **Framework:** Next.js (auto-detected)
- **Build Command:** `next build` (default)
- **Output Directory:** `.next` (default)
- **Node.js Version:** 22.x (package.json `engines.node`)
- **Environment Variables:** Set in Vercel dashboard or `.env.production`

### Vercel Environment Variables
All production env vars must be added in Vercel project settings. `NEXT_PUBLIC_*` vars are exposed to client-side code.

---

## 6. Monitoring & Observability

**Current State:** ❌ Not configured

### Recommended Setup
| Tool | Purpose | Cost |
|------|---------|------|
| Vercel Analytics | Page views, web vitals | Free tier |
| Sentry | Error tracking | Free tier |
| Neon Monitoring | DB performance, query insights | Included |
| Uptime Robot | Uptime monitoring | Free tier |

---

## 7. Logging

**Current State:** ❌ No structured logging

- API errors: returned as JSON response, not logged server-side
- No log aggregation service

### Recommended Approach
```typescript
// src/lib/logger.ts
export const logger = {
  info: (msg: string, data?: Record<string, unknown>) => {
    console.log(JSON.stringify({ level: 'info', msg, data, timestamp: new Date().toISOString() }));
  },
  error: (msg: string, error?: unknown, data?: Record<string, unknown>) => {
    console.error(JSON.stringify({ level: 'error', msg, error, data, timestamp: new Date().toISOString() }));
  },
};
```

---

## 8. Local Development

```bash
# Install dependencies
npm install

# Start dev server (port 3000)
npm run dev

# Run migration
npm run db:migrate

# Seed data
npm run seed:artisans

# Assign coordinates
npm run assign:coords

# Run linter
npm run lint
```

### Local Database
- Use Neon's "Branch" feature for development database
- Or run local PostgreSQL via Docker:
```yaml
# docker-compose.yml
services:
  db:
    image: postgres:16
    environment:
      POSTGRES_DB: nadur
      POSTGRES_USER: nadur
      POSTGRES_PASSWORD: nadur
    ports:
      - "5432:5432"
```

---

## 9. Production Readiness Checklist

- [ ] Rename `proxy.ts` to `middleware.ts`
- [ ] Set all production environment variables in Vercel
- [ ] Run `npm run db:migrate` against production database
- [ ] Seed categories (migration handles this)
- [ ] Create admin user manually or via seed script
- [ ] Configure Cloudinary upload preset (signed or unsigned)
- [ ] Configure Resend domain verification (SPF, DKIM)
- [ ] Set up Google OAuth consent screen (production credentials)
- [ ] Configure Neon production database (size, auto-pause, backups)
- [ ] Set up custom domain in Vercel
- [ ] Add CSP headers in `next.config.ts`
- [ ] Enable Vercel Analytics
- [ ] Set up Sentry error tracking
- [ ] Create monitoring dashboard
- [ ] Add `robots.txt` and `sitemap.xml`
- [ ] Configure rate limiting
- [ ] Add `/.well-known/` endpoints if needed

---

## 10. Scaling Considerations

| Bottleneck | Impact | Solution |
|-----------|--------|----------|
| Single DB connection | All queries bottleneck on one Neon endpoint | Neon auto-scaling, connection pooling |
| Full-text search | Slow on large datasets | Already indexed with GIN; considerpg_trgm for fuzzy search |
| Geospatial queries | Slow without index | Already indexed with GiST |
| Image uploads | Bandwidth and storage | Cloudinary handles CDN and transformations |
| Unoptimized queries | N+1 on operator + leads queries | Add eager loading / JOINs |
| No caching | Repeated identical queries | Add Vercel Edge Cache or SWR |
| Client-side rendering | SEO impact for browse pages | Convert to RSC or ISR for operator profiles |

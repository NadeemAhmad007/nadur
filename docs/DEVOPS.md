# DevOps & Deployment

---

## 1. Current Infrastructure

| Component | Provider | Configuration |
|-----------|----------|---------------|
| Hosting | Vercel (target) | Next.js optimized |
| Database | Neon (Serverless PostgreSQL) | Single instance |
| Image Storage | Cloudinary | Server-side upload API |
| Email | Resend | `resend` SDK |
| WhatsApp | OpenWA (Docker) | Self-hosted gateway |
| Domain | Not configured | Running on Vercel domain |

**Vercel Configuration (`next.config.ts`):**
```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { hostname: '*.s3.*.amazonaws.com' },
      { hostname: '*.r2.cloudflarestorage.com' },
      { hostname: 'res.cloudinary.com' },
    ],
    formats: ['image/avif', 'image/webp'],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
};

export default nextConfig;
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
CLOUDINARY_CLOUD_NAME=<cloud-name>
CLOUDINARY_API_KEY=<api-key>
CLOUDINARY_API_SECRET=<api-secret>

# OpenWA (WhatsApp gateway)
OPENWA_API_URL=http://localhost:2785/api
OPENWA_API_KEY=<api-key>
OPENWA_SESSION=nadur-bot

# Optional (unused in code)
S3_ACCESS_KEY_ID=<s3-key>
S3_SECRET_ACCESS_KEY=<s3-secret>
S3_BUCKET=<bucket>
S3_ENDPOINT=<endpoint-url>
```

---

## 3. Database Management

### Migration Commands

```bash
# Run migration (raw SQL script)
npm run db:migrate

# Open Drizzle Studio (GUI)
npm run db:studio
```

### Migration Strategy
- Primary migration: `src/db/migrate.ts` (raw SQL via neon driver)
- Drizzle Kit is configured but secondary (no npm script for generate/push)
- Migration is idempotent (uses `CREATE TABLE IF NOT EXISTS`, `ADD COLUMN IF NOT EXISTS`)

### Backup Strategy
- **Current:** ❌ No automated backup configured
- **Recommended:** Enable Neon point-in-time recovery or scheduled exports

---

## 4. Docker (OpenWA WhatsApp Gateway)

The app uses [OpenWA](https://github.com/rmyndharis/OpenWA) for WhatsApp messaging.

```bash
# Start OpenWA
docker compose -f docker-compose.openwa.yml up -d

# Open dashboard at http://localhost:2886
# Create session 'nadur-bot' and scan QR with the operator phone
```

**Service Definition:**
- Container: `openwa` (image: `rmyndharis/openwa:latest`)
- API port: `2785`
- Dashboard port: `2886`
- Session persists across restarts (named volume: `openwa-data`)

---

## 5. CI/CD Pipeline

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

  deploy:
    needs: lint
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

## 6. Vercel Deployment

### Manual Deploy
```bash
npm i -g vercel
vercel login
vercel          # Deploy preview
vercel --prod   # Deploy production
```

### Vercel Configuration
- **Framework:** Next.js (auto-detected)
- **Build Command:** `next build` (default)
- **Output Directory:** `.next` (default)
- **Node.js Version:** 22.x (package.json `engines.node`)
- **Environment Variables:** Set in Vercel dashboard or `.env.production`

---

## 7. Monitoring & Observability

**Current State:** ❌ Not configured

### Recommended Setup
| Tool | Purpose | Cost |
|------|---------|------|
| Vercel Analytics | Page views, web vitals | Free tier |
| Sentry | Error tracking | Free tier |
| Neon Monitoring | DB performance, query insights | Included |

---

## 8. Local Development

```bash
# Install dependencies
npm install

# Start dev server (port 3000)
npm run dev

# Run migration
npm run db:migrate

# Start OpenWA (WhatsApp gateway)
docker compose -f docker-compose.openwa.yml up -d

# Run linter
npm run lint
```

---

## 9. Production Readiness Checklist

- [ ] Rename `proxy.ts` to `middleware.ts`
- [ ] Set all production environment variables in Vercel
- [ ] Run `npm run db:migrate` against production database
- [ ] Configure Cloudinary upload preset
- [ ] Configure Resend domain verification (SPF, DKIM)
- [ ] Set up Google OAuth consent screen (production credentials)
- [ ] Configure Neon production database (size, auto-pause, backups)
- [ ] Set up custom domain in Vercel
- [ ] Add CSP headers in `next.config.ts`
- [ ] Enable Vercel Analytics
- [ ] Set up Sentry error tracking
- [ ] Add `robots.txt` and `sitemap.xml`
- [ ] Configure rate limiting

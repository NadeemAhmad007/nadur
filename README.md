# Nadurr — Discover Dal Lake Operators

**Nadurr** is a SaaS directory platform connecting tourists with verified houseboats, shikara rides, artisans, guides, and floating vendors on Dal Lake, Srinagar.

## Stack

- **Framework:** Next.js 16 (App Router) + React 19
- **Styling:** Tailwind CSS 4 + shadcn/ui
- **Database:** Neon (Serverless PostgreSQL) + Drizzle ORM
- **Auth:** NextAuth v5 (Google OAuth, Email OTP, WhatsApp OTP)
- **Media:** Cloudinary (images), OpenWA (WhatsApp gateway)
- **Email:** Resend

## Getting Started

```bash
npm install
cp .env.example .env   # fill in your env vars
npm run db:migrate      # run database migrations
npm run dev             # start dev server at http://localhost:3000
```

## Scripts

| Script | Command |
|--------|---------|
| `npm run dev` | Next.js dev server |
| `npm run build` | Production build |
| `npm run start` | Production server |
| `npm run lint` | ESLint |
| `npm run db:migrate` | Run SQL migration |
| `npm run db:studio` | Open Drizzle Studio |

## Docs

See `docs/` for architecture, API specs, business rules, and more.

## Docker (WhatsApp Gateway)

```bash
docker compose -f docker-compose.openwa.yml up -d
```

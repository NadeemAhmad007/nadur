<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:openwa-integration -->
# OpenWA WhatsApp Gateway

OpenWA (https://github.com/rmyndharis/OpenWA) is the self-hosted WhatsApp API gateway for Nadurr.

## Files
- `src/lib/openwa.ts` — HTTP client (`sendText`, `sendOtp`, `notifyLead`, `getSessionStatus`, `getQR`)
- `docker-compose.openwa.yml` — OpenWA Docker service definition

## Env Vars
- `OPENWA_API_URL` — default `http://localhost:2785/api`
- `OPENWA_API_KEY` — API key set in OpenWA config
- `OPENWA_SESSION` — session name, default `nadur-bot`

## Integrations
1. **Lead notifications** (`/api/leads` POST) — after inserting lead, calls `notifyLead()` to push WhatsApp message to operator
2. **WhatsApp OTP delivery** (`/api/auth/send-otp-whatsapp`) — sends OTP code via OpenWA instead of just logging to console

## Build (first time only)
The ARM64 Node binary in the upstream image segfaults under Colima VZ. Build a fixed image once:
```bash
mkdir -p /tmp/openwa-fix
cat > /tmp/openwa-fix/Dockerfile << 'EOF'
FROM ghcr.io/rmyndharis/openwa:latest AS base
FROM node:22-bookworm AS node-fix
FROM base
COPY --from=node-fix /usr/local/bin/node /usr/local/bin/node
RUN printf '#!/bin/sh\nuser="$1"; shift; exec su -s /bin/sh "$user" -c "$*"\n' > /usr/local/bin/gosu && \
    chmod +x /usr/local/bin/gosu
EOF
docker build -t openwa-fixed:latest /tmp/openwa-fix
```

## Setup
```bash
docker compose -f docker-compose.openwa.yml up -d
# API runs on port 2785 (no dashboard — use API directly)
# Auto-generated API key is printed in container logs:
API_KEY=$(docker logs nadur-openwa 2>&1 | grep -o 'owa_k1_[a-f0-9]*' | head -1)
```

## Session Management
- **Create session**:
  ```bash
  curl -s -X POST "http://localhost:2785/api/sessions" \
    -H "Content-Type: application/json" \
    -H "x-api-key: $API_KEY" \
    -d '{"name":"nadur-bot"}'
  ```
- **Get session UUID**:
  ```bash
  curl -s -X GET "http://localhost:2785/api/sessions" -H "x-api-key: $API_KEY"
  ```
- **Start session** (uses UUID from response):
  ```bash
  curl -s -X POST "http://localhost:2785/api/sessions/<UUID>/start" -H "x-api-key: $API_KEY"
  ```
- **Get QR code**:
  ```bash
  curl -s "http://localhost:2785/api/sessions/<UUID>/qr" -H "x-api-key: $API_KEY" \
    | python3 -c "import sys,json,base64; d=json.load(sys.stdin); \
    open('/tmp/nadur-qr.png','wb').write(base64.b64decode(d['qrCode'].split(',')[1]))"
  open /tmp/nadur-qr.png
  ```
- Scan the QR code with the phone `+919149670483` to pair the nadur-bot session
- Session persists across restarts (volume: openwa-data)
- Check status: `GET /api/sessions/<UUID>`
<!-- END:openwa-integration -->

<!-- BEGIN:browse-page-features -->
# Browse Page Widgets

## Flight Arrivals Bar
- **`src/lib/flights.ts`** — Client fetcher with 5-min localStorage cache
- **`src/app/api/flights/route.ts`** — Server proxy to OpenSky Network (avoids CORS)
- Falls back to static message if no data
- CSP: no external domain needed (proxied)

## Festival Badge
- **`src/lib/holidays.ts`** — Hardcoded Kashmir-relevant holidays for 2026 (Islamic, national, regional)
- `getUpcomingHoliday()` returns the next upcoming holiday (no API calls)

## News Ticker
- **`src/lib/news.ts`** — Client fetcher with 10-min localStorage cache
- **`src/app/api/news/route.ts`** — Server proxy to GNews API
- Requires `GNEWS_API_KEY` env var (free tier, 100 req/day at https://gnews.io)
- Shows nothing if no key is configured

## Area Filter Hierarchy
- **`src/lib/areas.ts`** — `AREA_GROUPS` exports three groups: Kashmir Valley, Jammu Region, Tourist Destinations
- Browse page filter panel renders grouped sections with group labels instead of one flat list

## Interactive Map
- **`src/components/map-view.tsx`** — Leaflet map component with OpenStreetMap tiles
- Toggle Map/Grid button in browse page toolbar
- Shows operator pins (click → profile), user location marker, auto-fit bounds
- **`src/lib/nominatim.ts`** — Forward/reverse geocoding via Nominatim (free, no key)
- CSP: `*.tile.openstreetmap.org` in `img-src`, `nominatim.openstreetmap.org` in `connect-src`

## Stock Photos (Pexels)
- **`src/lib/photos.ts`** — Client fetcher with 24-hr localStorage cache
- **`src/app/api/photos/route.ts`** — Server proxy to Pexels API
- Requires `PEXELS_API_KEY` env var (free at https://pexels.com/api)
- `operator-card.tsx` accepts `pexelsFallback` prop — shows relevant stock photo when operator has no photos

## Local Events (Ticketmaster)
- **`src/lib/events.ts`** — Client fetcher with 6-hr localStorage cache
- **`src/app/api/events/route.ts`** — Server proxy to Ticketmaster Discovery API
- Requires `TICKETMASTER_API_KEY` env var (free at https://developer.ticketmaster.com)
- Renders horizontal event pill row on browse page

## Pincode Auto-fill
- **`src/lib/pincode.ts`** — Fetches city/district/state from Indian Pincode API (free, no key)
- Integrated in `portal/edit/page.tsx` — houseboat address section
- CSP: `indianpincode.com` in `connect-src`
<!-- END:browse-page-features -->

<!-- BEGIN:visual-redesign -->
# Visual Redesign — Boutique Luxury Travel Marketplace

**Goal**: Redesign Kasheer360 as a boutique luxury travel marketplace (Mr & Mrs Smith / Plum Guide tone). All changes are visual only — no feature changes.

## Design Tokens (Phase 0)
- **Palette**: Dal Lake Navy (`#16314D`) anchor, Chinar Gold (`#C99A48`) accent (vs old orange `#C9551F`), Snow Linen (`#FAF7F1`) background, Warm Grey (`#6B665E`), Pine Green (`#3F6B4F`), Muted Rust (`#A13D2F`)
- **Typography**: `--font-display` (Source Serif 4) for headlines, Inter (`--font-inter`) for body (replaced Poppins). 1.6 line-height body, 1.1 display. Editorial scale: H1 56px, H2 36px, H3 24px serif
- **Radii**: 8px/12px/14px/16px/24px (all `rounded-xl` → `rounded-lg` in operator-profile and cards)
- **Shadows**: `shadow-xs` `shadow-sm` `shadow-md` `shadow-xl` refined
- **Utilities**: `scrollbar-none`, `shimmer` animation, `fade-up` keyframe, `.font-display` class
- **Files**: `src/app/globals.css`, `src/app/layout.tsx`, `src/components/ui/card.tsx`

## Hero Section (Phase 2) — `src/components/browse-page.tsx`
- Full-bleed navy gradient hero with geometric pattern overlay
- "Explore Kashmir" chip in gold
- Serif headline: "Connect Direct, *Book Local*" in gold accent
- Floating search card (white, shadow, search input + button)
- Replaced old: text-only hero with SVG crosshatch pattern

## How Kasheer360 Works (Phase 2)
- 3-step module with numbered circles (01/02/03), serif headings, white cards
- Steps: Browse Verified Locals → Connect via WhatsApp → Book & Pay Locally

## Trust Strip (Phase 2)
- 3-column grid of white cards with icon boxes (Compass/Sliders/Sparkles)
- Clean serif headings, muted body text
- Replaced old: `bg-card rounded-2xl` cards with accent hover borders

## Category Tiles (Phase 2)
- Grid (2-col mobile, 3-col tablet, 4-col desktop) of gradient photographic tiles at 4:3 aspect ratio
- Each category has its own curated gradient palette (houseboat=navy, shikara=rust, artisan=green, etc.)
- Active state: gold ring accent
- Replaced old: horizontal scroll of chip buttons

## Operator Cards (Phase 3) — `src/components/operator-card.tsx`
- 3:2 aspect photo (vs old 4:3)
- White card with `border-border/60` borderline, subtle hover shadow
- Verified badge: white/80 overlay top-left with check icon
- Distance badge: white/80 overlay top-right
- Name: `font-display text-lg font-medium` serif, single-line truncate
- Category in uppercase tracking-wider tiny text
- Price inline right-aligned, no pill background
- WhatsApp button: outlined (`variant="outline"`) with `rounded-lg`
- Lead modal: `rounded-lg` corners, white bg everywhere

## Toolbar (Phase 3) — `src/components/browse-page.tsx`
- Smaller controls: `h-8` buttons, `rounded-lg`, `bg-white` border style
- Festival badge inline in toolbar (desktop), separate row (mobile)
- Map toggle uses accent active state (vs old primary)
- All border radii: `rounded-lg` from `rounded-xl`

## Filter Panel (Phase 3)
- `bg-white border border-border/60 shadow-xs` (vs old `bg-card` shadow-sm)
- Section labels: `text-xs font-medium` (vs old `font-semibold`)
- Checkbox: `rounded` (vs `rounded-md`)
- Inputs: `rounded-lg` (vs `rounded-xl`)

## Listing Detail (Phase 4) — `src/components/operator-profile.tsx`
- Name: `font-display text-2xl sm:text-3xl font-normal` serif
- Category: uppercase tracking-wider tiny text (vs old Badge component)
- Verified: inline gold check with text (vs old Badge primary)
- Gallery: slimmer filmstrip (`w-12 h-9` vs `w-16 h-12`), less padding
- Gallery gradient: softer (`from-black/30` vs `from-black/40`)
- Section headers: `font-display text-base font-medium` (vs old `font-semibold`)
- Card bg: `bg-white` via updated Card component
- Pricing cards: updated bg-secondary rounded-lg
- CTA button: `rounded-lg` added
- "Browse all" link: muted color

## Auth Split-Screen (Phase 5) — `src/app/auth/login/page.tsx`
- Desktop: 50/50 split — left panel navy gradient with inverted logo, serif "Welcome back" headline, tagline
- Mobile: stacked, centered logo above card
- Tabs: `rounded-lg` bg-secondary (vs old `rounded-xl`)
- Error/toast cards: `rounded-lg` (vs old `rounded-xl`)
- "or continue with" and Google button: `rounded-lg`

## Footer (Phase 8) — `src/components/footer.tsx`
- Navy (`bg-primary`) footer with white text hierarchy
- Logo: brightness-0 invert for dark background
- Section headers: gold (`text-accent`) uppercase tracking-wider
- Links: `text-white/60 hover:text-white`
- Borders: `border-white/10` for subtle dividers
- Replaced old: `bg-card` light footer

## Key Design Decisions
- 90% of every screen is navy/white/linen — gold used sparingly for emphasis
- All `rounded-xl` phased out in favor of `rounded-lg` (editorial restraint)
- Serif for display, sans-serif for body (Inter replaces Poppins for better readability at small sizes)
- Cards are white (`bg-white` or `bg-card` = #FFFFFF), no secondary card colors
- Hover effects are subtle (shadow increase, opacity change) — no dramatic transformations
<!-- END:visual-redesign -->


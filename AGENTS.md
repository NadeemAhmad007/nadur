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

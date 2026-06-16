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

## Setup
```bash
docker compose -f docker-compose.openwa.yml up -d
# Open dashboard at http://localhost:2886
# Scan QR code with the phone +919149670483 to pair the nadur-bot session
```

## Session Management
- First-time setup: visit OpenWA dashboard, create session `nadur-bot`, scan QR
- Session persists across restarts (volume: openwa-data)
- Check status: GET /api/sessions/nadur-bot
<!-- END:openwa-integration -->

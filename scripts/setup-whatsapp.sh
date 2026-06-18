#!/bin/bash
set -e

DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$DIR"

echo "=== WhatsApp Setup Script ==="

_get_ngrok_url() {
  curl -sf http://127.0.0.1:4040/api/tunnels 2>/dev/null | \
    python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    for t in d.get('tunnels', []):
        if t.get('proto') == 'https':
            print(t['public_url'])
except: pass
" 2>/dev/null || true
}

# ── 1. Docker ──────────────────────────────────────────────
if docker ps --format '{{.Names}}' 2>/dev/null | grep -q '^nadur-openwa$'; then
  echo "[1/5] Docker container already running"
else
  echo "[1/5] Starting OpenWA container..."
  docker compose -f docker-compose.openwa.yml up -d
  echo "  Waiting for container..."
  for i in $(seq 1 30); do
    status=$(docker inspect --format='{{.State.Health.Status}}' nadur-openwa 2>/dev/null)
    if [ "$status" = "healthy" ]; then break; fi
    sleep 2
  done
  echo "  Container healthy"
fi

# ── 2. ngrok ──────────────────────────────────────────────
NGROK_URL=$(_get_ngrok_url)

if [ -n "$NGROK_URL" ]; then
  echo "[2/5] ngrok already running: $NGROK_URL"
else
  echo "[2/5] Starting ngrok..."
  ngrok http 2785 --log=stdout >/tmp/ngrok.log 2>&1 &
  for i in $(seq 1 15); do
    sleep 2
    NGROK_URL=$(_get_ngrok_url)
    if [ -n "$NGROK_URL" ]; then break; fi
  done
  if [ -z "$NGROK_URL" ]; then
    echo "ERROR: ngrok not ready. Check /tmp/ngrok.log"
    exit 1
  fi
  echo "  ngrok URL: $NGROK_URL"
fi

# ── 3. Get API key ─────────────────────────────────────────
echo "[3/5] Extracting API key..."
API_KEY=$(docker logs nadur-openwa 2>&1 | grep -o 'owa_k1_[a-f0-9]*' | head -1 || true)
if [ -z "$API_KEY" ]; then
  API_KEY=$(docker exec nadur-openwa env 2>/dev/null | grep '^API_KEY=' | cut -d= -f2 || true)
fi
if [ -z "$API_KEY" ]; then
  echo "ERROR: Could not find API key"
  echo "  Try: docker logs nadur-openwa | grep -o 'owa_k1_[a-f0-9]*'"
  exit 1
fi
echo "  API key: ${API_KEY:0:12}..."

# ── 4. Save to DB ─────────────────────────────────────────
echo "[4/5] Saving to Neon DB..."
node scripts/update-openwa-config.cjs "$NGROK_URL" "$API_KEY"

# ── 5. Done ───────────────────────────────────────────────
echo "[5/5] Done!"
echo ""
echo "  Next → open browser → admin WhatsApp → Connection tab → Connect Now"
echo "  (Cmd+Shift+R if page is already open)"

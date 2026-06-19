#!/bin/bash
set -e

DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$DIR"

echo "=== WhatsApp Setup Script ==="

MIN_DISK_MB=500

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

_check_disk() {
  local avail_kb
  avail_kb=$(df / | awk 'NR==2 {print $4}')
  local avail_mb=$((avail_kb / 1024))
  if [ "$avail_mb" -lt "$MIN_DISK_MB" ]; then
    echo "ERROR: Low disk space (${avail_mb}MB available, need ${MIN_DISK_MB}MB)"
    echo "  Run: docker system prune -f"
    echo "  And: rm -rf ~/Library/Caches/Google ~/Library/Caches/colima"
    exit 1
  fi
}

_check_docker() {
  if ! docker info >/dev/null 2>&1; then
    echo "ERROR: Docker daemon not responding"
    echo "  Try: colima restart"
    exit 1
  fi
  # Check for containerd blob errors (corrupt metadata)
  if docker system df >/dev/null 2>&1; then
    : # healthy
  else
    echo "WARNING: Docker metadata issue detected — restarting Colima..."
    colima restart
    sleep 5
    if ! docker info >/dev/null 2>&1; then
      echo "ERROR: Docker still unhealthy after restart"
      exit 1
    fi
  fi
}

_get_compose_key() {
  # Read default API_KEY from docker-compose.openwa.yml
  python3 -c "
import re
with open('docker-compose.openwa.yml') as f:
    content = f.read()
m = re.search(r'API_KEY:\s*\$\{OPENWA_API_KEY:-([^}]+)\}', content)
if m:
    print(m.group(1))
" 2>/dev/null || true
}

_clean_env_dups() {
  local env_file="$DIR/.env"
  local tmp_file="${env_file}.tmp"
  # Remove duplicate OPENWA_* lines while preserving the first occurrence
  python3 -c "
import re
seen = set()
with open('$env_file') as f:
    lines = f.readlines()
with open('$tmp_file', 'w') as out:
    for line in lines:
        key = line.split('=')[0].strip()
        if key.startswith('OPENWA_'):
            if key in seen:
                continue
            seen.add(key)
        out.write(line)
" 2>/dev/null
  mv "$tmp_file" "$env_file"
}

_upsert_env() {
  local key="$1" val="$2"
  local env_file="$DIR/.env"
  python3 -c "
import re
with open('$env_file') as f:
    content = f.read()
pattern = re.compile(r'^$key=.*', re.MULTILINE)
if pattern.search(content):
    content = pattern.sub('$key=$val', content)
else:
    content += '$key=$val\n'
with open('$env_file', 'w') as f:
    f.write(content)
" 2>/dev/null
}

# ── 0. Preflight ──────────────────────────────────────────────
echo "[0/5] Preflight checks..."
_check_disk
_check_docker
_clean_env_dups
echo "  OK"

# ── 1. Docker ──────────────────────────────────────────────
HEALTHY=$(docker inspect --format='{{.State.Health.Status}}' nadur-openwa 2>/dev/null || echo "")
if [ "$HEALTHY" = "healthy" ]; then
  echo "[1/5] Docker container already running (healthy)"
else
  echo "[1/5] Starting OpenWA container..."
  docker compose -f docker-compose.openwa.yml up -d
  echo "  Waiting for container to become healthy..."
  for i in $(seq 1 30); do
    status=$(docker inspect --format='{{.State.Health.Status}}' nadur-openwa 2>/dev/null || echo "starting")
    if [ "$status" = "healthy" ]; then
      echo "  Container healthy"
      break
    fi
    if [ "$status" = "unhealthy" ]; then
      echo "  Container unhealthy — restarting..."
      docker compose -f docker-compose.openwa.yml restart
      sleep 5
    fi
    sleep 2
  done
  HEALTHY=$(docker inspect --format='{{.State.Health.Status}}' nadur-openwa 2>/dev/null || echo "")
  if [ "$HEALTHY" != "healthy" ]; then
    echo "WARNING: container healthcheck not passing — continuing anyway (status: $HEALTHY)"
  fi
fi

# ── 2. ngrok ──────────────────────────────────────────────
NGROK_URL=$(_get_ngrok_url)

if [ -n "$NGROK_URL" ]; then
  echo "[2/5] ngrok already running: $NGROK_URL"
  # Verify tunnel is for port 2785
  TUNNEL_PORT=$(curl -sf http://127.0.0.1:4040/api/tunnels 2>/dev/null | \
    python3 -c "import sys,json; d=json.load(sys.stdin); t=d.get('tunnels',[{}])[0]; print(t.get('config',{}).get('addr',{}).get('port',''))" 2>/dev/null || echo "")
  if [ -n "$TUNNEL_PORT" ] && [ "$TUNNEL_PORT" != "2785" ]; then
    echo "  WARNING: ngrok tunnel points to port $TUNNEL_PORT, expected 2785"
  fi
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
    echo "  Try: pkill ngrok && ngrok http 2785"
    exit 1
  fi
  echo "  ngrok URL: $NGROK_URL"
fi

# ── 3. Get API key ─────────────────────────────────────────
echo "[3/5] Extracting API key..."
API_KEY=""

# Try docker-compose default first
COMPOSE_DEFAULT=$(_get_compose_key)
if [ -n "$COMPOSE_DEFAULT" ]; then
  API_KEY=$(docker exec nadur-openwa env 2>/dev/null | grep '^API_KEY=' | cut -d= -f2 || echo "$COMPOSE_DEFAULT")
fi

# Fallback: grep auto-generated key from logs
if [ -z "$API_KEY" ]; then
  API_KEY=$(docker logs nadur-openwa 2>&1 | grep -o 'owa_k1_[a-f0-9]*' | head -1 || true)
fi

# Last resort: docker exec
if [ -z "$API_KEY" ]; then
  API_KEY=$(docker exec nadur-openwa env 2>/dev/null | grep '^API_KEY=' | cut -d= -f2 || true)
fi

if [ -z "$API_KEY" ]; then
  echo "ERROR: Could not find API key"
  echo "  It's set in docker-compose.openwa.yml as: \${OPENWA_API_KEY:-kashmir360-dev-key}"
  echo "  Check: docker exec nadur-openwa env | grep API_KEY"
  exit 1
fi
echo "  API key: ${API_KEY:0:16}..."

# ── 4. Save to DB + .env ──────────────────────────────────
echo "[4/5] Saving configuration..."
node scripts/update-openwa-config.cjs "$NGROK_URL" "$API_KEY"
echo "  Updating .env..."
_upsert_env "OPENWA_API_URL" "${NGROK_URL}/api"
_upsert_env "OPENWA_API_KEY" "$API_KEY"
_upsert_env "OPENWA_SESSION" "kashmir360-bot"

# ── 5. Verify ─────────────────────────────────────────────
echo "[5/5] Verification..."
VERIFY=$(curl -sf -X GET "${NGROK_URL}/api/health" -H "x-api-key: $API_KEY" 2>/dev/null || echo "")
if echo "$VERIFY" | grep -q '"ok"'; then
  echo "  OpenWA reachable via ngrok ✓"
else
  echo "  WARNING: ngrok tunnel not responding with API key"
  echo "  The database is updated — you can test manually in admin WhatsApp page"
fi

echo ""
echo "  Done! Open admin WhatsApp page → Connection tab → Connect Now"
echo "  (Cmd+Shift+R if page is already open)"

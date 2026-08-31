#!/usr/bin/env bash
set -euo pipefail

# Run from the script directory so relative paths work from any current directory
cd "$(dirname "$0")"

# ─────────────────────────────────────────────
#  Dropcue — Development Start Script
#  Starts all app services for local development
# ─────────────────────────────────────────────

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Helpers
port_pids() {
  # Return PIDs listening on PORT using the available platform tool.
  if command -v lsof &>/dev/null; then
    lsof -ti :"$PORT" 2>/dev/null || true
  elif command -v netstat &>/dev/null; then
    netstat -ano 2>/dev/null \
      | awk -v port=":$PORT" '$1 == "TCP" && $2 ~ port "$" && $4 == "LISTENING" { print $5 }' \
      | sort -u
  fi
}

kill_port_pids() {
  for pid in $(port_pids); do
    if command -v taskkill &>/dev/null; then
      taskkill //F //PID "$pid" 2>/dev/null || true
    else
      kill -9 "$pid" 2>/dev/null || true
    fi
  done
}
log()    { echo -e "${BLUE}[dropcue]${NC} $*"; }
ok()     { echo -e "${GREEN}  ✓${NC} $*"; }
warn()   { echo -e "${YELLOW}  ⚠${NC} $*"; }
fail()   { echo -e "${RED}  ✗${NC} $*"; }
header() { echo -e "\n${BOLD}${CYAN}$*${NC}"; }

# ─────────────────────────────────────────────
#  Banner
# ─────────────────────────────────────────────
echo ""
echo -e "${BOLD}  ╔═══════════════════════════════════════╗${NC}"
echo -e "${BOLD}  ║        ${CYAN}🎨 DROPCUE${NC}${BOLD} — Start All      ║${NC}"
echo -e "${BOLD}  ╚═══════════════════════════════════════╝${NC}"
echo ""

# ─────────────────────────────────────────────
#  1. Pre-flight checks
# ─────────────────────────────────────────────
header "Pre-flight Checks"

# Check Node.js
if command -v node &>/dev/null; then
  NODE_VER=$(node --version)
  ok "Node.js ${NODE_VER}"
else
  fail "Node.js not found. Install from https://nodejs.org"
  exit 1
fi

# Check npm
if command -v npm &>/dev/null; then
  NPM_VER=$(npm --version)
  ok "npm ${NPM_VER}"
else
  fail "npm not found"
  exit 1
fi

# Check .env.local
if [ -f ".env.local" ]; then
  # Count how many vars are set (non-empty, non-comment)
  ENV_COUNT=$(grep -cE '^[A-Z_]+=.[^ ]' .env.local 2>/dev/null || echo 0)
  ok ".env.local found (${ENV_COUNT} vars set)"
else
  warn ".env.local not found — copying from .env.example"
  if [ -f ".env.example" ]; then
    cp .env.example .env.local
    ok "Created .env.local from .env.example"
  else
    fail "No .env.example found. Create .env.local manually."
    exit 1
  fi
fi

# Check node_modules
if [ -d "node_modules" ]; then
  PKG_COUNT=$(ls node_modules | wc -l | tr -d ' ')
  ok "node_modules present (${PKG_COUNT} packages)"
else
  log "Installing dependencies..."
  npm install
  ok "Dependencies installed"
fi

# ─────────────────────────────────────────────
#  2. Kill any existing processes on port 3000
# ─────────────────────────────────────────────
header "Port Check"

PORT=3000
if [ -n "$(port_pids)" ]; then
  warn "Port ${PORT} is in use — killing existing process"
  kill_port_pids
  sleep 1
fi
if [ -n "$(port_pids)" ]; then
  fail "Port ${PORT} is still in use — stop it manually and retry"
  exit 1
fi
ok "Port ${PORT} is free"

# ─────────────────────────────────────────────
#  3. Database health check
# ─────────────────────────────────────────────
header "Database Check"

if grep -q 'SUPABASE_SERVICE_ROLE_KEY=.[^ ]' .env.local 2>/dev/null; then
  ok "Supabase service role key configured"

  # Quick connectivity test — retried once to avoid false negatives on
  # slow TLS handshakes or transient DNS hiccups
  SUPABASE_URL=$(grep 'NEXT_PUBLIC_SUPABASE_URL=' .env.local | cut -d'=' -f2- | tr -d '\r')
  if [ -n "$SUPABASE_URL" ]; then
    KEY=$(grep 'SUPABASE_SERVICE_ROLE_KEY=' .env.local | cut -d'=' -f2- | tr -d '\r')
    probe_db() {
      curl -s --connect-timeout 10 --max-time 20 \
        -H "apikey: $KEY" \
        -H "Authorization: Bearer $KEY" \
        "${SUPABASE_URL}/rest/v1/products?select=id&limit=1" \
        -o /dev/null -w "%{http_code}" 2>/dev/null | grep -qE '200|404'
    }
    if probe_db || { sleep 2; probe_db; }; then
      ok "Supabase reachable at ${SUPABASE_URL}"
    else
      warn "Supabase unreachable after 2 attempts — check your project is active"
    fi
  fi
else
  warn "No Supabase service role key — database features disabled"
fi

# ─────────────────────────────────────────────
#  4. Build (optional, skip with --no-build)
# ─────────────────────────────────────────────
SKIP_BUILD=false
for arg in "$@"; do
  case $arg in
    --no-build) SKIP_BUILD=true ;;
    --build)    SKIP_BUILD=false ;;
  esac
done

if [ "$SKIP_BUILD" = false ]; then
  header "Type Check"
  log "Running TypeScript type check..."
  if npx tsc --noEmit 2>&1; then
    ok "TypeScript compiles cleanly"
  else
    warn "TypeScript errors found — fix before deploying"
  fi
fi

# ─────────────────────────────────────────────
#  5. Start the Next.js dev server
# ─────────────────────────────────────────────
header "Starting Services"

# A production build and a dev server share .next; clear a production cache
# before starting dev so their compiled assets cannot be mixed.
if [ -f ".next/BUILD_ID" ]; then
  warn "Production build cache found — clearing .next for a clean dev start"
  rm -rf .next
fi

log "Starting Next.js dev server on port ${PORT}..."

# Start the server and capture PID

npx next dev --port "$PORT" --hostname 0.0.0.0 &
DEV_PID=$!

# Wait for the server to be ready
log "Waiting for server to be ready..."
for i in $(seq 1 30); do
  if curl -s -o /dev/null -w "" http://127.0.0.1:${PORT} 2>/dev/null; then
    break
  fi
  sleep 1
done

# Verify it's running
if curl -s -o /dev/null -w "" http://127.0.0.1:${PORT} 2>/dev/null; then
  ok "Next.js dev server running → http://localhost:${PORT}"
else
  # Give it more time — Next.js cold start can be slow
  log "Still starting... waiting 15 more seconds"
  sleep 15
  if curl -s -o /dev/null -w "" http://127.0.0.1:${PORT} 2>/dev/null; then
    ok "Next.js dev server running → http://localhost:${PORT}"
  else
    fail "Server failed to start. Check logs."
    exit 1
  fi
fi

# ─────────────────────────────────────────────
#  6. Service summary
# ─────────────────────────────────────────────
header "Services Running"
echo ""
echo -e "  ${GREEN}●${NC} Next.js App        ${BOLD}http://localhost:${PORT}${NC}"
echo -e "  ${GREEN}●${NC} API Routes         ${BOLD}http://localhost:${PORT}/api/*${NC}"
echo -e "  ${GREEN}●${NC} Creator Dashboard  ${BOLD}http://localhost:${PORT}/${NC}"
echo -e "  ${GREEN}●${NC} Auth (Magic Link)  ${BOLD}http://localhost:${PORT}/auth/login${NC}"
echo -e "  ${GREEN}●${NC} Setup Wizard       ${BOLD}http://localhost:${PORT}/setup${NC}"
echo ""
echo -e "  ${CYAN}External Services (cloud):${NC}"
echo -e "    Supabase   → $(grep 'NEXT_PUBLIC_SUPABASE_URL=' .env.local 2>/dev/null | cut -d'=' -f2- || echo 'not configured')"
echo -e "    Stripe     → $(grep -q 'STRIPE_SECRET_KEY=' .env.local && echo 'configured' || echo 'not configured')"
echo -e "    Korapay    → $(grep -q 'KORAPAY_SECRET_KEY=' .env.local && echo 'configured' || echo 'not configured')"
echo -e "    Resend     → $(grep -q 'RESEND_API_KEY=' .env.local && echo 'configured' || echo 'not configured')"
echo ""
echo -e "  ${YELLOW}Tip:${NC} Press ${BOLD}Ctrl+C${NC} to stop all services"
echo -e "  ${YELLOW}Tip:${NC} Run ${BOLD}./start.sh --no-build${NC} to skip type checking"
echo ""

# ─────────────────────────────────────────────
#  7. Trap to clean up on exit
# ─────────────────────────────────────────────
cleanup() {
  log "Shutting down services..."
  if [ -n "${DEV_PID:-}" ]; then
    kill "$DEV_PID" 2>/dev/null || true
    wait "$DEV_PID" 2>/dev/null || true
  fi
  # Also kill any orphaned processes on the port
  kill_port_pids
  ok "All services stopped"
  echo ""
  exit 0
}

trap cleanup SIGINT SIGTERM

# Keep the script running
wait "$DEV_PID" 2>/dev/null

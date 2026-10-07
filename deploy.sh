#!/usr/bin/env bash
# Deployment script for CertKraft Page Preview & AI Chat API Server.
# Usage: ./deploy.sh
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")"
WEB_ROOT="${WEB_ROOT:-/var/www/preview}"
HEALTH_URL="${HEALTH_URL:-http://127.0.0.1:3001/api/health}"

PREV_COMMIT=$(git rev-parse HEAD)

echo "=== 1. Pulling latest main ==="
if ! git pull origin main; then
  echo "Git pull failed. Aborting deployment."
  exit 1
fi

CURRENT_COMMIT=$(git rev-parse HEAD)
echo "Deploying commit $CURRENT_COMMIT (previous was $PREV_COMMIT)..."

echo "=== 2. Installing dependencies and building ==="
if ! pnpm install || ! pnpm typecheck || ! pnpm build; then
  echo "Build/typecheck failed. Rolling back to $PREV_COMMIT..."
  git checkout "$PREV_COMMIT"
  exit 1
fi

echo "=== 3. Deploying frontend static bundle ==="
sudo mkdir -p "$WEB_ROOT/media"
if command -v rsync >/dev/null 2>&1; then
  sudo rsync -a --delete --exclude 'media/' apps/preview/dist/ "$WEB_ROOT/"
else
  sudo find "$WEB_ROOT" -mindepth 1 -maxdepth 1 ! -name media -exec rm -rf {} +
  (cd apps/preview/dist && tar --exclude='./media' -cf - .) | sudo tar -xf - -C "$WEB_ROOT"
fi

echo "=== 4. Restarting backend server process ==="
if command -v pm2 >/dev/null 2>&1; then
  pm2 restart certkraft-server || pm2 start "pnpm --filter @certkraft/server dev" --name certkraft-server
else
  pkill -f "tsx src/index.ts" || true
  nohup pnpm --filter @certkraft/server exec tsx src/index.ts > server.log 2>&1 &
  sleep 2
fi

echo "=== 5. Health Check Verification ==="
HEALTH_PASS=false
for i in {1..5}; do
  if curl -sf "$HEALTH_URL" | grep -q "ok"; then
    HEALTH_PASS=true
    break
  fi
  sleep 1
done

if [ "$HEALTH_PASS" = true ]; then
  echo "Health check passed! Deployment successful."
else
  echo "Health check failed for $HEALTH_URL. Rolling back to $PREV_COMMIT..."
  git checkout "$PREV_COMMIT"
  pnpm build
  if command -v pm2 >/dev/null 2>&1; then
    pm2 restart certkraft-server || true
  else
    pkill -f "node apps/server/dist/index.js" || true
    nohup node apps/server/dist/index.js > server.log 2>&1 &
  fi
  exit 1
fi

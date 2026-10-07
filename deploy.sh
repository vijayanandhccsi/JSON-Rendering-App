#!/usr/bin/env bash
# Builds the preview app and copies it to the web folder. Run it on the server, from the repo, after each change.
# See docs/DEPLOY.md. Image files in the web folder's media/ are kept (they are not part of the build).
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")"
web_root="${WEB_ROOT:-/var/www/preview}"

git pull --ff-only
pnpm install --frozen-lockfile
pnpm typecheck
pnpm test
pnpm build

sudo mkdir -p "$web_root/media"
if command -v rsync >/dev/null 2>&1; then
  sudo rsync -a --delete --exclude 'media/' apps/preview/dist/ "$web_root/"
else
  # No rsync on this server: remove the old build (but not media/) and copy the new one.
  sudo find "$web_root" -mindepth 1 -maxdepth 1 ! -name media -exec rm -rf {} +
  (cd apps/preview/dist && tar --exclude='./media' -cf - .) | sudo tar -xf - -C "$web_root"
fi
echo "Deployed to $web_root."

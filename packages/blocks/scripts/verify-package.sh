#!/usr/bin/env bash
# Proves that @certkraft/blocks works on its own: packs it, installs the tarball into a brand-new
# Vite + React + Tailwind v4 project outside this repo, type-checks it and builds it.
# Needs internet access (it installs from npm). Run with `pnpm verify:package`.
set -euo pipefail

package_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT

echo "1/5  Building and packing the package"
(cd "$package_dir" && pnpm pack --pack-destination "$work" >/dev/null)
tarball="$(ls "$work"/certkraft-blocks-*.tgz)"
echo "     $(basename "$tarball")"

echo "2/5  Checking what is in the tarball"
tar -xzf "$tarball" -C "$work"
node -e '
  const pkg = require(process.argv[1] + "/package/package.json");
  const fail = (m) => { console.error("FAIL: " + m); process.exit(1); };
  if (!pkg.exports || pkg.exports["."].import !== "./dist/index.js") fail("exports should point to dist/index.js, not the source");
  if (pkg.exports["./tokens.css"] !== "./dist/tokens.css") fail("tokens.css should be served from dist");
  if (pkg.types !== "./dist/index.d.ts") fail("types should point to dist/index.d.ts");
  if (!pkg.peerDependencies || !pkg.peerDependencies.react) fail("react should be a peer dependency");
' "$work"
for file in dist/index.js dist/index.d.ts dist/tokens.css dist/fonts; do
  [ -e "$work/package/$file" ] || { echo "FAIL: the tarball has no $file"; exit 1; }
done
if tar -tzf "$tarball" | grep -qE 'package/src/|\.test\.'; then echo "FAIL: the tarball contains source or test files"; exit 1; fi

echo "3/5  Creating a fresh project and installing the tarball"
app="$work/consumer"
mkdir -p "$app/src"
cd "$app"
cat > package.json <<JSON
{ "name": "consumer", "private": true, "type": "module" }
JSON
npm install --silent --no-audit --no-fund react@19 react-dom@19 typescript vite @vitejs/plugin-react tailwindcss @tailwindcss/vite @types/react @types/react-dom "$tarball" >/dev/null

cat > index.html <<'HTML'
<!doctype html><html lang="en"><body><div id="root"></div><script type="module" src="/src/main.tsx"></script></body></html>
HTML
cat > vite.config.ts <<'TS'
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
export default defineConfig({ plugins: [react(), tailwindcss()] });
TS
cat > tsconfig.json <<'JSON'
{ "compilerOptions": { "target": "ES2022", "module": "ESNext", "moduleResolution": "Bundler", "jsx": "react-jsx", "strict": true, "noEmit": true, "skipLibCheck": false, "types": ["vite/client"] }, "include": ["src"] }
JSON
cat > src/index.css <<'CSS'
@import "tailwindcss";
@import "@certkraft/blocks/tokens.css";
@source "../node_modules/@certkraft/blocks/dist";
CSS
cat > src/main.tsx <<'TSX'
import { createRoot } from "react-dom/client";
import { PageRenderer, PageSchema, validatePage } from "@certkraft/blocks";
import type { Page, ValidationResult } from "@certkraft/blocks";
import "./index.css";

const input: unknown = {
  chapter: "network-security-basics",
  title: "What is a firewall?",
  summary: "Learn what a firewall does.",
  blocks: [
    { type: "paragraph", text: "A **firewall** filters traffic." },
    { type: "code", language: "bash", code: "ss -tuln" },
    { type: "callout", variant: "tip", text: "Default deny is safer." },
  ],
};

const result: ValidationResult = validatePage(input);
if (!result.valid) throw new Error(result.errors.map((e) => e.message).join("\n"));
const page: Page = PageSchema.parse(input);

createRoot(document.getElementById("root")!).render(<PageRenderer page={page} mediaBaseUrl="/media/" />);
TSX

echo "4/5  Type-checking the consumer against the package's declarations"
npx tsc --noEmit

echo "5/5  Building the consumer"
npx vite build >"$work/build.log" 2>&1 || { cat "$work/build.log"; exit 1; }
css="$(ls dist/assets/*.css | head -1)"
for rule in rounded-card bg-primary-strong "text-h2" "max-w-reading"; do
  grep -q -- "$rule" "$css" || { echo "FAIL: the built CSS has no .$rule, so the package's classes were not found (check the @source line)"; exit 1; }
done
grep -q -- "--color-primary" "$css" || { echo "FAIL: the design tokens are missing from the built CSS"; exit 1; }
ls dist/assets/*.woff2 >/dev/null 2>&1 || { echo "FAIL: the fonts were not copied into the build"; exit 1; }

echo
echo "OK: @certkraft/blocks installs, type-checks and builds in a fresh project."

// Builds the package into dist/: JavaScript and type declarations from the TypeScript source,
// plus tokens.css and the fonts. Run with `pnpm build`.
import { execFileSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");

rmSync(dist, { recursive: true, force: true });
execFileSync("pnpm", ["exec", "tsc", "-p", "tsconfig.build.json"], { cwd: root, stdio: "inherit" });

// The source imports files without an extension ("./common"), which bundlers accept but Node and some
// tools do not. Add the extension so the built files work everywhere.
const RELATIVE = /(\bfrom\s+|\bimport\s*\(\s*|\bimport\s+)(["'])(\.{1,2}\/[^"']*)\2/g;

function walk(directory) {
  return readdirSync(directory).flatMap((name) => {
    const path = join(directory, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

let rewritten = 0;
for (const file of walk(dist).filter((path) => /\.(js|d\.ts)$/.test(path))) {
  const text = readFileSync(file, "utf8");
  const next = text.replace(RELATIVE, (match, lead, quote, specifier) => {
    if (/\.(js|mjs|css|json)$/.test(specifier)) return match;
    const target = resolve(dirname(file), specifier);
    const fixed = existsSync(`${target}.js`)
      ? `${specifier}.js`
      : existsSync(join(target, "index.js"))
        ? `${specifier}/index.js`
        : null;
    if (!fixed) throw new Error(`${file}: cannot resolve "${specifier}"`);
    rewritten++;
    return `${lead}${quote}${fixed}${quote}`;
  });
  if (next !== text) writeFileSync(file, next);
}

cpSync(join(root, "src/tokens.css"), join(dist, "tokens.css"));
cpSync(join(root, "src/fonts"), join(dist, "fonts"), { recursive: true });

for (const required of ["index.js", "index.d.ts", "tokens.css", "fonts"]) {
  if (!existsSync(join(dist, required))) throw new Error(`The build is missing dist/${required}`);
}
console.log(`Built dist/ (${walk(dist).length} files, ${rewritten} import paths completed)`);

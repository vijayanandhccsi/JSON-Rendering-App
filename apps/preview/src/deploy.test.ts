import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = join(__dirname, "../../..");
const read = (path: string) => readFileSync(join(root, path), "utf8");

describe("deployment files", () => {
  const conf = read("deploy/nginx-preview.conf");
  const guide = read("docs/DEPLOY.md");

  it("the Nginx config in the repo is the one DEPLOY.md shows", () => {
    const block =
      /Create `\/etc\/nginx\/sites-available\/preview`:\n```\n(server \{[\s\S]*?\n\})\n```/.exec(
        guide,
      )?.[1];
    expect(block).toBeDefined();
    expect(conf).toContain(block as string);
  });

  it("is protected: password, no search engines, no sniffing, and a referrer policy that works with Vimeo", () => {
    expect(conf).toContain("auth_basic_user_file /etc/nginx/.htpasswd-preview;");
    expect(conf).toContain('X-Robots-Tag "noindex, nofollow"');
    expect(conf).toContain('X-Content-Type-Options "nosniff"');
    expect(conf).toContain('Referrer-Policy "strict-origin-when-cross-origin"');
    expect(conf).not.toContain('Referrer-Policy "no-referrer"');
  });

  it("serves single-page routes (/gallery and /batch) by falling back to index.html", () => {
    expect(conf).toMatch(/location \/ \{\s*try_files \$uri \/index\.html;/);
  });

  it("does not let a missing image fall back to index.html (the image checker needs a real 404)", () => {
    expect(conf).toMatch(/location \/media\/ \{[^}]*try_files \$uri =404;/);
  });

  it("the app tells search engines to stay away too", () => {
    expect(read("apps/preview/public/robots.txt")).toContain("User-agent: *\nDisallow: /");
    expect(read("apps/preview/index.html")).toContain(
      '<meta name="robots" content="noindex, nofollow" />',
    );
  });

  it("deploy.sh is executable, stops on errors, checks before building, and keeps the media folder", () => {
    const script = read("deploy.sh");
    expect(statSync(join(root, "deploy.sh")).mode & 0o111).not.toBe(0);
    expect(script).toContain("set -euo pipefail");
    expect(script.indexOf("pnpm test")).toBeLessThan(script.indexOf("pnpm build"));
    expect(script).toContain("--exclude 'media/'");
    expect(script).toContain("command -v rsync");
    expect(script).toContain("tar --exclude='./media'");
    expect(script).toContain("--frozen-lockfile");
  });

  it("image files are kept out of git, but the folder exists", () => {
    expect(read(".gitignore")).toContain("apps/preview/public/media/*");
    expect(existsSync(join(root, "apps/preview/public/media/.gitkeep"))).toBe(true);
  });
});

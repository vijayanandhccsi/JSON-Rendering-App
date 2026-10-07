import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.tsx?$/.test(name) && !/\.test\.tsx?$/.test(name) ? [path] : [];
  });
}

const components = ["blocks", "renderer", "text", "ui"].flatMap((dir) =>
  sourceFiles(join(__dirname, dir)),
);

describe("components use design tokens only", () => {
  it.each(components)("%s has no hard-coded colors, arbitrary sizes or raw HTML", (file) => {
    const source = readFileSync(file, "utf8");
    expect(source, "hex color").not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(source, "rgb()/hsl() color").not.toMatch(/\b(rgb|hsl)a?\(/);
    expect(source, "arbitrary Tailwind value").not.toMatch(/\b[a-z-]+-\[[^\]]*\]/);
    expect(source, "dangerouslySetInnerHTML").not.toContain("dangerouslySetInnerHTML");
  });
});

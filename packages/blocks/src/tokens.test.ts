import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const css = readFileSync(join(__dirname, "tokens.css"), "utf8");

function token(name: string): string {
  const match = new RegExp(`--color-${name}:\\s*(#[0-9a-fA-F]{6})`).exec(css);
  if (!match?.[1]) throw new Error(`Missing token --color-${name}`);
  return match[1];
}

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * (r ?? 0) + 0.7152 * (g ?? 0) + 0.0722 * (b ?? 0);
}

function contrast(a: string, b: string): number {
  const [x, y] = [luminance(token(a)), luminance(token(b))];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

// [foreground, background, minimum ratio]. Mirrors the table in docs/DESIGN.md.
const text = 4.5;
const ui = 3;
const pairs: [string, string, number][] = [
  ["primary-strong", "surface", text],
  ["primary-strong", "bg", text],
  ["surface", "primary-strong", text],
  ["surface", "primary-strong-hover", text],
  ["success-strong", "surface", text],
  ["surface", "success-strong", text],
  ["success-strong", "success-tint", text],
  ["warning", "warning-tint", text],
  ["warning", "surface", text],
  ["danger", "danger-tint", text],
  ["danger", "surface", text],
  ["ink", "surface", text],
  ["ink", "bg", text],
  ["ink", "primary-tint", text],
  ["ink", "info-tint", text],
  ["ink", "success-tint", text],
  ["ink-muted", "surface", text],
  ["ink-muted", "bg", text],
  ["surface", "ink", text],
  ["primary", "surface", ui],
  ["primary", "bg", ui],
  ["primary", "primary-tint", ui],
  ["success", "surface", ui],
  ["primary-strong", "primary-tint", ui],
];

describe("design tokens", () => {
  it.each(pairs)("%s on %s meets %d:1", (foreground, background, minimum) => {
    expect(contrast(foreground, background)).toBeGreaterThanOrEqual(minimum);
  });

  it("keeps the brand colors out of text use (they fail 4.5:1 on white)", () => {
    expect(contrast("primary", "surface")).toBeLessThan(text);
    expect(contrast("success", "surface")).toBeLessThan(text);
  });
});

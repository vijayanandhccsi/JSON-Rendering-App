import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { ICON_MAP } from "./iconMap";
import { ICON_NAMES } from "./iconNames";

describe("curated icon set", () => {
  it("is about 150 icons", () => {
    expect(ICON_NAMES.length).toBeGreaterThanOrEqual(120);
    expect(ICON_NAMES.length).toBeLessThanOrEqual(200);
  });

  it("has a component for every name and no extras", () => {
    expect(Object.keys(ICON_MAP).sort()).toEqual([...ICON_NAMES].sort());
    for (const name of ICON_NAMES) expect(ICON_MAP[name], name).toBeDefined();
  });

  it("includes every icon DESIGN.md names", () => {
    const needed = [
      "info",
      "lightbulb",
      "triangle-alert",
      "octagon-alert",
      "circle-check",
      "quote",
      "square-check",
      "copy",
      "book-open",
      "chevron-left",
      "chevron-right",
      "table-2",
      "circle",
      "shield-check",
      "lock",
      "server",
      "shield",
    ];
    for (const name of needed) expect(ICON_NAMES as readonly string[], name).toContain(name);
  });

  it("matches the list in docs/guide.md (run `pnpm gen:icons` if this fails)", () => {
    const guide = readFileSync(join(__dirname, "../../../../docs/guide.md"), "utf8");
    const section = /<!-- icons:start[^>]*-->([\s\S]*?)<!-- icons:end -->/.exec(guide)?.[1] ?? "";
    const listed = [...section.matchAll(/`([a-z0-9-]+)`/g)].map((match) => match[1]);
    expect(listed.sort()).toEqual([...ICON_NAMES].sort());
  });
});

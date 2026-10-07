import dynamicIconImports from "lucide-react/dynamicIconImports";
import { describe, expect, it } from "vitest";
import { LUCIDE_ICON_NAMES } from "./icons";

describe("Lucide icon names", () => {
  it("match the installed lucide-react (run `pnpm gen:icons` if this fails)", () => {
    expect([...LUCIDE_ICON_NAMES].sort()).toEqual(Object.keys(dynamicIconImports).sort());
  });

  it("include the icons used in DESIGN.md", () => {
    for (const name of [
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
    ]) {
      expect(LUCIDE_ICON_NAMES.has(name), name).toBe(true);
    }
  });
});

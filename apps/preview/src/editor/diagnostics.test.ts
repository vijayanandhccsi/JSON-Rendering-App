import { validateJsonText } from "@certkraft/blocks";
import { describe, expect, it } from "vitest";
import { issueRange, offsetOf, toDiagnostics } from "./diagnostics";
import { indexJson } from "./jsonPositions";

describe("offsetOf", () => {
  const text = "ab\ncde\nf";
  it("turns a line and column into a character offset", () => {
    expect(offsetOf(text, 1, 1)).toBe(0);
    expect(offsetOf(text, 2, 2)).toBe(4);
    expect(offsetOf(text, 3, 1)).toBe(7);
  });
  it("stays inside the text", () => {
    expect(offsetOf(text, 99, 99)).toBe(text.length);
  });
});

const bad = JSON.stringify(
  {
    chapter: "Bad Slug",
    title: "T",
    summary: "S",
    blocks: [
      { type: "paragraph", text: "ok" },
      { type: "heading", level: 1, text: "x" },
      { type: "image", src: "a.webp", description: "d" },
    ],
  },
  null,
  2,
);

describe("toDiagnostics", () => {
  const result = validateJsonText(bad);
  const index = indexJson(bad);
  const diagnostics = toDiagnostics(result, bad, index);

  it("makes one marker per error and warning, with severity, source and the fix in the message", () => {
    expect(diagnostics).toHaveLength(result.errors.length + result.warnings.length);
    const chapter = diagnostics.find((d) => d.source === "Page");
    expect(chapter).toMatchObject({ severity: "error" });
    expect(chapter?.message).toContain("lowercase hyphenated slug");
    expect(chapter?.message).toContain("Fix:");
    expect(diagnostics.some((d) => d.source === "Block 2 (heading)")).toBe(true);
  });

  it("puts each marker on the right text", () => {
    const at = (needle: string) => diagnostics.find((d) => bad.slice(d.from, d.to) === needle);
    expect(at('"Bad Slug"')).toBeDefined();
    expect(at("1")).toMatchObject({ severity: "error" });
    expect(at('"image"')).toBeDefined();
  });

  it("never makes an empty or out-of-range marker", () => {
    for (const d of diagnostics) {
      expect(d.to).toBeGreaterThan(d.from);
      expect(d.to).toBeLessThanOrEqual(bad.length);
    }
  });

  it("marks a JSON syntax error at its line and column", () => {
    const text = '{\n  "a": 1,\n  "b": ,\n}';
    const syntax = validateJsonText(text);
    const range = issueRange(syntax.errors[0]!, text, indexJson(text));
    expect(text.slice(range!.from, range!.to)).toBe(",");
  });

  it("puts a page-level problem with no place at the start of the text", () => {
    const result2 = validateJsonText("   ");
    const [d] = toDiagnostics(result2, "   ", indexJson("   "));
    expect(d?.from).toBe(0);
  });
});

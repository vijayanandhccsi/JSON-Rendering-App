import { describe, expect, it } from "vitest";
import { indexJson, markerRange } from "./jsonPositions";

const page = `{
  "chapter": "network-security",
  "blocks": [
    { "type": "paragraph", "text": "Hello" },
    { "type": "list", "style": "bulleted", "items": ["One", "Two"] }
  ]
}`;

const slice = (text: string, range: { from: number; to: number } | undefined | null) =>
  range ? text.slice(range.from, range.to) : null;

describe("indexJson", () => {
  const index = indexJson(page);

  it("finds the whole document, objects, strings and array items by path", () => {
    expect(slice(page, index.get(""))).toBe(page);
    expect(slice(page, index.get("chapter"))).toBe('"network-security"');
    expect(slice(page, index.get("blocks[0]"))).toBe('{ "type": "paragraph", "text": "Hello" }');
    expect(slice(page, index.get("blocks[0].text"))).toBe('"Hello"');
    expect(slice(page, index.get("blocks[1].items[1]"))).toBe('"Two"');
  });

  it("finds numbers, booleans and null", () => {
    const text = '{"a": 12.5e1, "b": true, "c": null, "d": [], "e": {}}';
    const found = indexJson(text);
    expect(["a", "b", "c", "d", "e"].map((key) => slice(text, found.get(key)))).toEqual([
      "12.5e1",
      "true",
      "null",
      "[]",
      "{}",
    ]);
  });

  it("handles escaped quotes and brackets inside strings", () => {
    const text = '{"a": "say \\"hi\\" [x]", "b": 1}';
    expect(slice(text, indexJson(text).get("b"))).toBe("1");
    expect(slice(text, indexJson(text).get("a"))).toBe('"say \\"hi\\" [x]"');
  });

  it("keeps what it found before a syntax error", () => {
    const text = '{"a": 1, "b": [1, 2, oops]}';
    const found = indexJson(text);
    expect(slice(text, found.get("a"))).toBe("1");
    expect(slice(text, found.get("b[0]"))).toBe("1");
    expect(found.has("b[2]")).toBe(false);
  });

  it("returns an empty index for empty or non-JSON text", () => {
    expect(indexJson("").size).toBe(0);
    expect(indexJson("hello").size).toBe(0);
  });
});

describe("markerRange", () => {
  const index = indexJson(page);

  it("marks the exact value when the path exists", () => {
    expect(slice(page, markerRange(index, "blocks[0].text", page))).toBe('"Hello"');
  });

  it("marks a block at its type when the problem is in the block itself (a missing or unknown field)", () => {
    expect(slice(page, markerRange(index, "blocks[1]", page))).toBe('"list"');
    expect(slice(page, markerRange(index, "blocks[0].alt", page))).toBe('"paragraph"');
  });

  it("uses the closest parent when a deeper path is missing", () => {
    expect(slice(page, markerRange(index, "blocks[1].items[5].text", page))).toBe('["One", "Two"]');
    expect(slice(page, markerRange(index, "blocks[7].text", page))).toBe("[");
  });

  it("marks only the first line of a multi-line value", () => {
    expect(slice(page, markerRange(index, "blocks", page))).toBe("[");
    expect(slice(page, markerRange(index, "", page))).toBe("{");
  });

  it("gives up when nothing matches", () => {
    expect(markerRange(new Map(), "blocks[0]", "")).toBeNull();
  });
});

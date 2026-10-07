import { describe, expect, it } from "vitest";
import { parseInline } from "./parseInline";

const text = (value: string) => ({ kind: "text", value });
const code = (value: string) => ({ kind: "code", value });
const bold = (...children: unknown[]) => ({ kind: "bold", children });
const italic = (...children: unknown[]) => ({ kind: "italic", children });

describe("parseInline", () => {
  it.each([
    ["plain text", [text("plain text")]],
    ["a **bold** word", [text("a "), bold(text("bold")), text(" word")]],
    ["an *italic* word", [text("an "), italic(text("italic")), text(" word")]],
    ["use `ss -tuln` here", [text("use "), code("ss -tuln"), text(" here")]],
    [
      "**bold with *italic* inside**",
      [bold(text("bold with "), italic(text("italic")), text(" inside"))],
    ],
    [
      "*italic with **bold** inside*",
      [italic(text("italic with "), bold(text("bold")), text(" inside"))],
    ],
    ["**bold with `code`**", [bold(text("bold with "), code("code"))]],
    ["***both***", [bold(italic(text("both")))]],
    ["`**not bold**`", [code("**not bold**")]],
    ["**a `**` b**", [bold(text("a "), code("**"), text(" b"))]],
  ])("parses %j", (input, expected) => {
    expect(parseInline(input)).toEqual(expected);
  });

  it.each([
    "2 * 3 * 4",
    "a*b",
    "**unclosed bold",
    "*unclosed italic",
    "`unclosed code",
    "** spaced **",
    "snake_case_name and __dunder__",
    "price is $5 < $10 > $2",
    "<b>not html</b>",
  ])("leaves %j as plain text", (input) => {
    expect(parseInline(input)).toEqual([text(input)]);
  });

  it("never produces HTML nodes, only the four inline kinds", () => {
    const kinds = new Set<string>();
    const walk = (nodes: ReturnType<typeof parseInline>) =>
      nodes.forEach((node) => {
        kinds.add(node.kind);
        if ("children" in node) walk(node.children);
      });
    walk(parseInline("<script>x</script> **a** *b* `c`"));
    expect([...kinds].sort()).toEqual(["bold", "code", "italic", "text"]);
  });
});

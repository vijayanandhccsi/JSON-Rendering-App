import { describe, expect, it } from "vitest";
import { validateJsonText } from "./json";
import { locateJsonError } from "./locateJsonError";

const agrees = [
  "{}",
  "[]",
  '{"a":[1,2.5e3,-0.1,true,false,null,"x\\n\\u00e9"]}',
  '  {\n "a" : { "b" : [ ] }\n}\n',
  '"text"',
  "0",
];
const broken: [string, number][] = [
  ['{"a":1,}', 7],
  ["[1,2,]", 5],
  ["{a:1}", 1],
  ["{'a':1}", 1],
  ['{"a" 1}', 5],
  ['{"a":1 "b":2}', 7],
  ['{"a":[1 2]}', 8],
  ['{"a":"unterminated}', 19],
  ['{"a":tru}', 5],
  ['{"a":01}', 6],
  ['{"a":1} extra', 8],
  ["", 0],
  ['{"a":"x\ny"}', 7],
  ['{"a":"\\q"}', 6],
];

describe("locateJsonError", () => {
  it.each(agrees)("accepts valid JSON %j like JSON.parse", (text) => {
    expect(() => JSON.parse(text)).not.toThrow();
    expect(locateJsonError(text)).toBeNull();
  });

  it.each(broken)("finds the problem in %j at %i", (text, position) => {
    expect(() => JSON.parse(text)).toThrow();
    expect(locateJsonError(text)?.position).toBe(position);
  });
});

describe("validateJsonText", () => {
  it("reports line and column for a syntax error", () => {
    const result = validateJsonText('{\n  "chapter": "x",\n  "blocks": [,]\n}');
    expect(result.errors[0]).toMatchObject({ line: 3, column: 14 });
    expect(result.errors[0]?.message).toContain("Line 3, column 14");
  });
});

import { describe, expect, it } from "vitest";
import { downloadName, formatJson } from "./files";
import { readStored, removeStored, writeStored } from "./storage";

describe("downloadName", () => {
  it("joins the chapter and the title into a safe file name", () => {
    expect(
      downloadName(
        JSON.stringify({ chapter: "network-security-basics", title: "What is a firewall?" }),
      ),
    ).toBe("network-security-basics-what-is-a-firewall.json");
  });
  it("falls back to page.json", () => {
    expect(downloadName("not json")).toBe("page.json");
    expect(downloadName("{}")).toBe("page.json");
    expect(downloadName(JSON.stringify({ chapter: 5, title: "  " }))).toBe("page.json");
  });
});

describe("formatJson", () => {
  it("lays JSON out with two spaces and a final newline", () => {
    expect(formatJson('{"a":[1,2],"b":{"c":true}}')).toBe(
      '{\n  "a": [\n    1,\n    2\n  ],\n  "b": {\n    "c": true\n  }\n}\n',
    );
  });
  it("returns null for invalid JSON", () => {
    expect(formatJson("{oops")).toBeNull();
  });
});

describe("storage", () => {
  it("saves, reads and removes a value", () => {
    writeStored("test-key", "value");
    expect(readStored("test-key")).toBe("value");
    removeStored("test-key");
    expect(readStored("test-key")).toBeNull();
  });
  it("never throws when localStorage is blocked", () => {
    const original = Storage.prototype.getItem;
    Storage.prototype.getItem = () => {
      throw new Error("blocked");
    };
    expect(readStored("x")).toBeNull();
    Storage.prototype.getItem = original;
  });
});

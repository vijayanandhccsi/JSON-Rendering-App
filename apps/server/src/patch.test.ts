import fs from "node:fs";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { closeDb, getDb } from "./db/index.js";
import { processAndSaveJsonVersion } from "./routes/chat.js";
import { applyJsonPatch } from "./utils/jsonPatch.js";

const TEST_DB_PATH = path.resolve(__dirname, "../data/test_m9.db");

describe("Milestone 9: Patch edits (RFC 6902)", () => {
  beforeAll(() => {
    process.env.NODE_ENV = "test";
    process.env.DATABASE_PATH = TEST_DB_PATH;

    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH);
    }
    const db = getDb(TEST_DB_PATH);
    db.prepare("INSERT INTO users (id, email, password_hash, role) VALUES ('u1', 'u1@certkraft.com', 'hash', 'user')").run();
  });

  afterAll(() => {
    closeDb();
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH);
    }
  });

  it("applies a 'replace' patch operation", () => {
    const baseDoc = {
      chapter: "network-security",
      title: "Old Title",
      summary: "Old summary text.",
      blocks: [{ type: "heading", level: 2, text: "Original Heading" }],
    };

    const ops = [
      { op: "replace" as const, path: "/title", value: "New Patch Title" },
      { op: "replace" as const, path: "/blocks/0/text", value: "Updated Heading" },
    ];

    const result = applyJsonPatch(baseDoc, ops) as typeof baseDoc;
    expect(result.title).toBe("New Patch Title");
    expect(result.blocks[0]?.text).toBe("Updated Heading");
    expect(baseDoc.title).toBe("Old Title"); // Immutable
  });

  it("applies an 'add' patch operation to arrays (insert & append)", () => {
    const baseDoc = {
      chapter: "network-security",
      title: "Add Test",
      summary: "Summary text.",
      blocks: [
        { type: "paragraph", text: "Block 0" },
        { type: "paragraph", text: "Block 1" },
      ],
    };

    // Insert at index 1 and append at end /-
    const ops = [
      {
        op: "add" as const,
        path: "/blocks/1",
        value: { type: "heading", level: 2, text: "Inserted Heading" },
      },
      {
        op: "add" as const,
        path: "/blocks/-",
        value: { type: "paragraph", text: "Appended Block" },
      },
    ];

    const result = applyJsonPatch(baseDoc, ops) as typeof baseDoc;
    expect(result.blocks.length).toBe(4);
    expect(result.blocks[0]?.text).toBe("Block 0");
    expect(result.blocks[1]?.text).toBe("Inserted Heading");
    expect(result.blocks[2]?.text).toBe("Block 1");
    expect(result.blocks[3]?.text).toBe("Appended Block");
  });

  it("applies a 'remove' patch operation", () => {
    const baseDoc = {
      chapter: "network-security",
      title: "Remove Test",
      summary: "Summary text.",
      blocks: [
        { type: "paragraph", text: "Block 0" },
        { type: "paragraph", text: "Block to remove" },
        { type: "paragraph", text: "Block 2" },
      ],
    };

    const ops = [{ op: "remove" as const, path: "/blocks/1" }];

    const result = applyJsonPatch(baseDoc, ops) as typeof baseDoc;
    expect(result.blocks.length).toBe(2);
    expect(result.blocks[0]?.text).toBe("Block 0");
    expect(result.blocks[1]?.text).toBe("Block 2");
  });

  it("throws descriptive error for invalid patch paths", () => {
    const baseDoc = {
      chapter: "network-security",
      title: "Invalid Path Test",
      summary: "Summary text.",
      blocks: [],
    };

    const ops = [{ op: "replace" as const, path: "/nonexistent/path/99", value: "fail" }];

    expect(() => applyJsonPatch(baseDoc, ops)).toThrowError(/Property "nonexistent" does not exist/);
  });

  it("processAndSaveJsonVersion processes valid patch and updates page version in DB", () => {
    const db = getDb(TEST_DB_PATH);

    // Seed a page with v1
    const pageId = "page-patch-1";
    db.prepare(
      "INSERT INTO pages (id, user_id, title, learning_path, status, created_at) VALUES (?, 'u1', 'Patch Page', 'lp1', 'draft', CURRENT_TIMESTAMP)"
    ).run(pageId);

    const initialJson = JSON.stringify({
      chapter: "ch-1",
      title: "Original Title",
      summary: "Original summary.",
      blocks: [{ type: "paragraph", text: "Initial text." }],
    });

    db.prepare(
      "INSERT INTO json_versions (id, page_id, version_no, json, valid, created_at) VALUES ('v1-patch', ?, 1, ?, 1, CURRENT_TIMESTAMP)"
    ).run(pageId, initialJson);
    db.prepare("UPDATE pages SET current_version_id = 'v1-patch' WHERE id = ?").run(pageId);

    // AI output contains a JSON patch codeblock
    const patchRawText = `
Here is the requested update:
\`\`\`json
{
  "patch": [
    { "op": "replace", "path": "/title", "value": "Updated via Patch" },
    { "op": "add", "path": "/blocks/-", "value": { "type": "paragraph", "text": "Second paragraph." } }
  ]
}
\`\`\`
    `;

    const outcome = processAndSaveJsonVersion(pageId, patchRawText);
    expect(outcome.valid).toBe(true);
    expect(outcome.isPatch).toBe(true);
    expect(outcome.versionNo).toBe(2);
    expect((outcome.parsedJson as any).title).toBe("Updated via Patch");
    expect((outcome.parsedJson as any).blocks.length).toBe(2);

    // Verify DB updated
    const updatedPage = db.prepare("SELECT current_version_id FROM pages WHERE id = ?").get(pageId) as any;
    expect(updatedPage.current_version_id).toBe(outcome.versionId);
  });

  it("handles patch application failure gracefully with patchFailed flag", () => {
    const db = getDb(TEST_DB_PATH);

    const pageId = "page-patch-2";
    db.prepare(
      "INSERT INTO pages (id, user_id, title, learning_path, status, created_at) VALUES (?, 'u1', 'Patch Fail Page', 'lp1', 'draft', CURRENT_TIMESTAMP)"
    ).run(pageId);

    const initialJson = JSON.stringify({
      chapter: "ch-1",
      title: "Title",
      summary: "Summary.",
      blocks: [],
    });

    db.prepare(
      "INSERT INTO json_versions (id, page_id, version_no, json, valid, created_at) VALUES ('v1-fail', ?, 1, ?, 1, CURRENT_TIMESTAMP)"
    ).run(pageId, initialJson);
    db.prepare("UPDATE pages SET current_version_id = 'v1-fail' WHERE id = ?").run(pageId);

    // Bad path patch
    const badPatchText = `
\`\`\`json
{
  "patch": [
    { "op": "replace", "path": "/blocks/99/text", "value": "out of bounds" }
  ]
}
\`\`\`
    `;

    const outcome = processAndSaveJsonVersion(pageId, badPatchText);
    expect(outcome.valid).toBe(false);
    expect(outcome.isPatch).toBe(true);
    expect(outcome.patchFailed).toBe(true);
    expect(outcome.errors?.[0]?.message).toMatch(/Failed to apply patch/);
  });
});

import fs from "node:fs";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { closeDb, getDb } from "./db/index.js";
import { processAndSaveJsonVersion } from "./routes/chat.js";
import { isOutlinePayload } from "./utils/jsonOutline.js";

const TEST_DB_PATH = path.resolve(__dirname, "../data/test_m10.db");

describe("Milestone 10: Long pages by section & Outline flow", () => {
  beforeAll(() => {
    process.env.NODE_ENV = "test";
    process.env.DATABASE_PATH = TEST_DB_PATH;

    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH);
    }
    const db = getDb(TEST_DB_PATH);
    db.prepare("INSERT INTO users (id, email, password_hash, role) VALUES ('u1', 'sec@certkraft.com', 'hash', 'user')").run();
  });

  afterAll(() => {
    closeDb();
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH);
    }
  });

  it("detects valid outline payload using isOutlinePayload", () => {
    const validOutline = {
      type: "outline",
      chapter: "cloud-security",
      title: "AWS Security Foundations",
      summary: "Overview of IAM, VPC, and Encryption.",
      estimatedMinutes: 12,
      sections: [
        { title: "IAM Roles & Policies", plannedBlocks: ["paragraph", "callout"] },
        { title: "VPC Security Groups", plannedBlocks: ["heading", "grid"] },
        { title: "Key Takeaways", plannedBlocks: ["heading", "list"] },
      ],
    };

    expect(isOutlinePayload(validOutline)).toBe(true);

    const invalidOutline = {
      type: "outline",
      title: "Missing chapter and sections",
    };
    expect(isOutlinePayload(invalidOutline)).toBe(false);
  });

  it("processAndSaveJsonVersion saves initial page document from outline JSON", () => {
    const db = getDb(TEST_DB_PATH);
    const pageId = "page-sec-1";

    db.prepare(
      "INSERT INTO pages (id, user_id, title, learning_path, status, created_at) VALUES (?, 'u1', 'Outline Page', 'lp1', 'draft', CURRENT_TIMESTAMP)"
    ).run(pageId);

    const outlineText = `
Here is the proposed outline for your long page:
\`\`\`json
{
  "type": "outline",
  "chapter": "cloud-security",
  "title": "AWS Security Foundations",
  "summary": "Overview of IAM, VPC, and Encryption.",
  "estimatedMinutes": 10,
  "sections": [
    { "title": "Introduction", "plannedBlocks": ["paragraph"] },
    { "title": "VPC Security", "plannedBlocks": ["heading", "paragraph"] }
  ]
}
\`\`\`
    `;

    const outcome = processAndSaveJsonVersion(pageId, outlineText);
    expect(outcome.valid).toBe(true);
    expect(outcome.isOutline).toBe(true);
    expect(outcome.versionNo).toBe(1);
    expect((outcome.parsedJson as any).title).toBe("AWS Security Foundations");
    expect((outcome.parsedJson as any).blocks.length).toBe(1);

    const pageInDb = db.prepare("SELECT title, current_version_id FROM pages WHERE id = ?").get(pageId) as any;
    expect(pageInDb.title).toBe("AWS Security Foundations");
    expect(pageInDb.current_version_id).toBe(outcome.versionId);
  });

  it("appends sections sequentially as patch versions without losing previous sections", () => {
    const pageId = "page-sec-1"; // Reusing initialized page from outline test

    // Generate Section 1 blocks via add patch
    const section1Text = `
Generating Section 1 of 2:
\`\`\`json
{
  "type": "section",
  "sectionIndex": 0,
  "sectionTitle": "Introduction",
  "patch": [
    { "op": "add", "path": "/blocks/-", "value": { "type": "paragraph", "text": "IAM is the core identity service." } }
  ]
}
\`\`\`
    `;

    const outcome1 = processAndSaveJsonVersion(pageId, section1Text);
    expect(outcome1.valid).toBe(true);
    expect(outcome1.versionNo).toBe(2);
    expect((outcome1.parsedJson as any).blocks.length).toBe(2);

    // Generate Section 2 blocks via add patch
    const section2Text = `
Generating Section 2 of 2:
\`\`\`json
{
  "type": "section",
  "sectionIndex": 1,
  "sectionTitle": "VPC Security",
  "patch": [
    { "op": "add", "path": "/blocks/-", "value": { "type": "heading", "level": 2, "text": "VPC Security Groups" } },
    { "op": "add", "path": "/blocks/-", "value": { "type": "paragraph", "text": "Security groups act as virtual firewalls." } }
  ]
}
\`\`\`
    `;

    const outcome2 = processAndSaveJsonVersion(pageId, section2Text);
    expect(outcome2.valid).toBe(true);
    expect(outcome2.versionNo).toBe(3);
    expect((outcome2.parsedJson as any).blocks.length).toBe(4);
    expect((outcome2.parsedJson as any).blocks[1].text).toBe("IAM is the core identity service.");
    expect((outcome2.parsedJson as any).blocks[2].text).toBe("VPC Security Groups");
  });

  it("discards partial truncated section response and allows retrying the section", () => {
    const db = getDb(TEST_DB_PATH);
    const pageId = "page-sec-1";

    // Simulate truncated response (incomplete JSON cut off by token limit)
    const truncatedText = `
Generating Section 3:
\`\`\`json
{
  "type": "section",
  "patch": [
    { "op": "add", "path": "/blocks/-", "value": { "type": "paragraph", "text": "Truncated text here...
`;

    const outcomeTruncated = processAndSaveJsonVersion(pageId, truncatedText);
    expect(outcomeTruncated.valid).toBe(false);

    // Verify current_version_id in DB is still version 3 (saved sections kept intact!)
    const pageInDb = db.prepare("SELECT current_version_id FROM pages WHERE id = ?").get(pageId) as any;
    const currentVer = db.prepare("SELECT version_no FROM json_versions WHERE id = ?").get(pageInDb.current_version_id) as any;
    expect(currentVer.version_no).toBe(3);

    // Retry Section 3 with complete response
    const retryText = `
\`\`\`json
{
  "type": "section",
  "sectionIndex": 2,
  "sectionTitle": "Key Takeaways",
  "patch": [
    { "op": "add", "path": "/blocks/-", "value": { "type": "heading", "level": 2, "text": "Key Takeaways" } }
  ]
}
\`\`\`
    `;

    const outcomeRetry = processAndSaveJsonVersion(pageId, retryText);
    expect(outcomeRetry.valid).toBe(true);
    expect(outcomeRetry.versionNo).toBe(4);
    expect((outcomeRetry.parsedJson as any).blocks.length).toBe(5);
  });
});

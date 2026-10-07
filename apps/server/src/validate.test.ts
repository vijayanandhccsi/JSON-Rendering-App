import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import bcrypt from "bcryptjs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import app from "./index.js";
import { closeDb, getDb } from "./db/index.js";
import { loadRulesSystemPrompt } from "./utils/rulesContext.js";

const TEST_DB_PATH = path.resolve(__dirname, "../data/test_m7.db");

describe("Milestone 7: Rules Loading & Block Validator API", () => {
  let server: http.Server;
  let baseUrl: string;
  let sessionCookie: string;

  beforeAll(async () => {
    process.env.NODE_ENV = "test";
    process.env.DATABASE_PATH = TEST_DB_PATH;

    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH);
    }

    const db = getDb(TEST_DB_PATH);
    const hashed = bcrypt.hashSync("password123", 10);
    db.prepare("INSERT INTO users (id, email, password_hash, role) VALUES (?, ?, ?, ?)").run(
      "user-m7",
      "m7@certkraft.com",
      hashed,
      "user"
    );

    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const addr = server.address();
        if (addr && typeof addr === "object") {
          baseUrl = `http://localhost:${addr.port}`;
        }
        resolve();
      });
    });

    const loginRes = await fetch(`${baseUrl}/api/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "m7@certkraft.com", password: "password123" }),
    });

    const setCookie = loginRes.headers.get("set-cookie");
    sessionCookie = setCookie!.split(";")[0]!;
  });

  afterAll(async () => {
    closeDb();
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH);
    }
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });

  it("reads rules.md and guide.md from disk as system prompt", () => {
    const promptText = loadRulesSystemPrompt();
    expect(promptText).toBeDefined();
    expect(promptText).toContain("Rules for generating CertKraft reading-page JSON");
    expect(promptText).toContain("Allowed blocks only");
  });

  it("POST /api/validate returns valid: true for a valid page JSON", async () => {
    const validPage = {
      chapter: "chapter-1",
      title: "Introduction to CertKraft",
      summary: "An overview of page components.",
      blocks: [
        {
          type: "heading",
          level: 2,
          text: "Getting Started",
        },
        {
          type: "paragraph",
          text: "Welcome to CertKraft lesson pages.",
        },
      ],
    };

    const res = await fetch(`${baseUrl}/api/validate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: sessionCookie,
      },
      body: JSON.stringify(validPage),
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.valid).toBe(true);
    expect(data.errors).toHaveLength(0);
  });

  it("POST /api/validate catches unknown block types", async () => {
    const invalidPage = {
      chapter: 1,
      title: "Test Page",
      summary: "Summary",
      blocks: [
        {
          type: "unknown_custom_block",
          content: "Hello",
        },
      ],
    };

    const res = await fetch(`${baseUrl}/api/validate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: sessionCookie,
      },
      body: JSON.stringify(invalidPage),
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.valid).toBe(false);
    expect(data.errors.length).toBeGreaterThan(0);
    expect(data.errors.some((e: { message: string }) => e.message.includes("unknown") || e.message.includes("type"))).toBe(true);
  });

  it("POST /api/validate catches missing required fields", async () => {
    const invalidPage = {
      chapter: 1,
      // Missing title
      summary: "Summary",
      blocks: [],
    };

    const res = await fetch(`${baseUrl}/api/validate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: sessionCookie,
      },
      body: JSON.stringify(invalidPage),
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.valid).toBe(false);
    expect(data.errors.length).toBeGreaterThan(0);
    expect(data.errors.some((e: { path: string }) => e.path.includes("title"))).toBe(true);
  });

  it("POST /api/validate catches wrong field types", async () => {
    const invalidPage = {
      chapter: "one", // should be a number
      title: "Test Page",
      summary: "Summary",
      blocks: [
        {
          type: "heading",
          level: "invalid_string_level", // should be a number (2-4)
          text: "Heading Text",
        },
      ],
    };

    const res = await fetch(`${baseUrl}/api/validate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: sessionCookie,
      },
      body: JSON.stringify(invalidPage),
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.valid).toBe(false);
    expect(data.errors.length).toBeGreaterThan(0);
  });
});

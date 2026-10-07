import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import bcrypt from "bcryptjs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import app from "./index.js";
import { closeDb, getDb } from "./db/index.js";

const TEST_DB_PATH = path.resolve(__dirname, "../data/test_m3.db");

describe("Milestone 3: AI Provider Adapter & Chat Endpoint", () => {
  let server: http.Server;
  let baseUrl: string;
  let sessionCookie: string;

  beforeAll(async () => {
    process.env.NODE_ENV = "test";
    process.env.DATABASE_PATH = TEST_DB_PATH;
    process.env.ANTHROPIC_API_KEY = "test-anthropic-key";
    process.env.GEMINI_API_KEY = "test-gemini-key";

    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH);
    }

    const db = getDb(TEST_DB_PATH);
    const hashed = bcrypt.hashSync("password123", 10);
    db.prepare("INSERT INTO users (id, email, password_hash, role) VALUES (?, ?, ?, ?)").run(
      "user-m3",
      "m3@certkraft.com",
      hashed,
      "admin"
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

    // Login to obtain session cookie
    const loginRes = await fetch(`${baseUrl}/api/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "m3@certkraft.com", password: "password123" }),
    });

    const setCookie = loginRes.headers.get("set-cookie");
    expect(setCookie).toBeDefined();
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

  it("GET /api/models requires authentication", async () => {
    const res = await fetch(`${baseUrl}/api/models`);
    expect(res.status).toBe(401);
  });

  it("GET /api/models returns list of configured models", async () => {
    const res = await fetch(`${baseUrl}/api/models`, {
      headers: { Cookie: sessionCookie },
    });
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(Array.isArray(data.models)).toBe(true);
    expect(data.models.length).toBeGreaterThan(0);

    const modelIds = data.models.map((m: { id: string }) => m.id);
    expect(modelIds).toContain("claude-3-5-sonnet-20241022");
    expect(modelIds).toContain("gemini-2.5-flash");
  });

  it("GET /api/models filters models when API keys are missing", async () => {
    const oldAnthropic = process.env.ANTHROPIC_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;

    const res = await fetch(`${baseUrl}/api/models`, {
      headers: { Cookie: sessionCookie },
    });
    const data = await res.json();

    const modelIds = data.models.map((m: { id: string }) => m.id);
    expect(modelIds).not.toContain("claude-3-5-sonnet-20241022");
    expect(modelIds).toContain("gemini-2.5-flash");

    process.env.ANTHROPIC_API_KEY = oldAnthropic;
  });

  it("POST /api/chat fails if model or messages are missing", async () => {
    const res = await fetch(`${baseUrl}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: sessionCookie,
      },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBeDefined();
  });

  it("POST /api/chat returns error if requested model is invalid", async () => {
    const res = await fetch(`${baseUrl}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: sessionCookie,
      },
      body: JSON.stringify({
        model: "non-existent-model",
        messages: [{ role: "user", content: "Hello" }],
      }),
    });
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("Unsupported model ID");
  });
});

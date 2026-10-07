import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import bcrypt from "bcryptjs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import app from "./index.js";
import { closeDb, getDb } from "./db/index.js";

const TEST_DB_PATH = path.resolve(__dirname, "../data/test_m6.db");

describe("Milestone 6: Paste and File Upload API", () => {
  let server: http.Server;
  let baseUrl: string;
  let sessionCookie: string;

  beforeAll(async () => {
    process.env.NODE_ENV = "test";
    process.env.DATABASE_PATH = TEST_DB_PATH;
    process.env.MAX_UPLOAD_SIZE_BYTES = "1024"; // 1 KB limit for fast test

    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH);
    }

    const db = getDb(TEST_DB_PATH);
    const hashed = bcrypt.hashSync("password123", 10);
    db.prepare("INSERT INTO users (id, email, password_hash, role) VALUES (?, ?, ?, ?)").run(
      "user-m6",
      "m6@certkraft.com",
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
      body: JSON.stringify({ email: "m6@certkraft.com", password: "password123" }),
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

  it("POST /api/upload requires authentication", async () => {
    const res = await fetch(`${baseUrl}/api/upload`, { method: "POST" });
    expect(res.status).toBe(401);
  });

  it("POST /api/upload accepts valid .txt, .md, .json files and returns text content", async () => {
    const formData = new FormData();
    const blob = new Blob(["# Lesson Outline\n\n1. Intro\n2. Basics"], { type: "text/markdown" });
    formData.append("file", blob, "outline.md");

    const res = await fetch(`${baseUrl}/api/upload`, {
      method: "POST",
      headers: { Cookie: sessionCookie },
      body: formData,
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.filename).toBe("outline.md");
    expect(data.text).toContain("# Lesson Outline");
  });

  it("POST /api/upload rejects unsupported file extensions", async () => {
    const formData = new FormData();
    const blob = new Blob(["binary data"], { type: "application/octet-stream" });
    formData.append("file", blob, "script.exe");

    const res = await fetch(`${baseUrl}/api/upload`, {
      method: "POST",
      headers: { Cookie: sessionCookie },
      body: formData,
    });

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("Unsupported file format");
  });

  it("POST /api/upload rejects files exceeding maximum size limit", async () => {
    const largeContent = "a".repeat(2048); // 2 KB > 1 KB limit
    const formData = new FormData();
    const blob = new Blob([largeContent], { type: "text/plain" });
    formData.append("file", blob, "large.txt");

    const res = await fetch(`${baseUrl}/api/upload`, {
      method: "POST",
      headers: { Cookie: sessionCookie },
      body: formData,
    });

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("File exceeds maximum allowed size");
  });
});

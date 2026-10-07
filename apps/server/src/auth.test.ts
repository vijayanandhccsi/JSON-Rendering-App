import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import bcrypt from "bcryptjs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import app from "./index.js";
import { closeDb, getDb } from "./db/index.js";

const TEST_DB_PATH = path.resolve(__dirname, "../data/test_m2.db");

describe("Milestone 2: Authentication & Sessions", () => {
  let server: http.Server;
  let baseUrl: string;

  beforeAll(async () => {
    process.env.NODE_ENV = "test";
    process.env.DATABASE_PATH = TEST_DB_PATH;
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH);
    }

    const db = getDb(TEST_DB_PATH);
    // Seed a test user
    const hashed = bcrypt.hashSync("secret123", 10);
    db.prepare("INSERT INTO users (id, email, password_hash, role) VALUES (?, ?, ?, ?)").run(
      "user-1",
      "test@certkraft.com",
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

  it("GET /api/me without session returns 401 Unauthorized", async () => {
    const res = await fetch(`${baseUrl}/api/me`);
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBeDefined();
  });

  it("POST /api/login fails with wrong password", async () => {
    const res = await fetch(`${baseUrl}/api/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "test@certkraft.com", password: "wrongpassword" }),
    });
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBe("Invalid email or password");
  });

  it("POST /api/login succeeds with correct password and sets httpOnly session cookie", async () => {
    const res = await fetch(`${baseUrl}/api/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "test@certkraft.com", password: "secret123" }),
    });
    expect(res.status).toBe(200);

    const setCookie = res.headers.get("set-cookie");
    expect(setCookie).toBeDefined();
    expect(setCookie).toContain("certkraft_session=");
    expect(setCookie).toContain("HttpOnly");

    const data = await res.json();
    expect(data.user).toEqual({
      id: "user-1",
      email: "test@certkraft.com",
      role: "admin",
    });

    // Extract cookie for subsequent GET /api/me check
    const cookieHeader = setCookie!.split(";")[0]!;
    const meRes = await fetch(`${baseUrl}/api/me`, {
      headers: { Cookie: cookieHeader },
    });
    expect(meRes.status).toBe(200);
    const meData = await meRes.json();
    expect(meData.user.email).toBe("test@certkraft.com");
  });

  it("POST /api/logout clears session cookie and revokes access to /api/me", async () => {
    // First login
    const loginRes = await fetch(`${baseUrl}/api/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "test@certkraft.com", password: "secret123" }),
    });
    const setCookie = loginRes.headers.get("set-cookie")!.split(";")[0]!;

    // Logout
    const logoutRes = await fetch(`${baseUrl}/api/logout`, {
      method: "POST",
      headers: { Cookie: setCookie },
    });
    expect(logoutRes.status).toBe(200);

    // Verify /api/me fails after logout
    const meRes = await fetch(`${baseUrl}/api/me`, {
      headers: { Cookie: "certkraft_session=cleared" },
    });
    expect(meRes.status).toBe(401);
  });
});

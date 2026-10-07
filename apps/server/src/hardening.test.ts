import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import bcrypt from "bcryptjs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import app from "./index.js";
import { closeDb, getDb } from "./db/index.js";
import { runBackup } from "./scripts/backup.js";

const TEST_DB_PATH = path.resolve(__dirname, "../data/test_m11.db");

describe("Milestone 11: Hardening, Rate Limiting & Backups", () => {
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
    db.prepare("INSERT INTO users (id, email, password_hash, role) VALUES ('user-m11', 'm11@certkraft.com', ?, 'user')").run(hashed);

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
      body: JSON.stringify({ email: "m11@certkraft.com", password: "password123" }),
    });

    const setCookie = loginRes.headers.get("set-cookie");
    sessionCookie = setCookie!.split(";")[0]!;
  });

  afterAll(async () => {
    closeDb();
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH);
    }
    const backupsDir = path.resolve(process.cwd(), "backups");
    if (fs.existsSync(backupsDir)) {
      fs.rmSync(backupsDir, { recursive: true, force: true });
    }
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });

  it("GET /api/stats returns accumulated token usage", async () => {
    const db = getDb(TEST_DB_PATH);

    // Seed a page, chat, and messages with token counts
    db.prepare("INSERT INTO pages (id, user_id, title, status) VALUES ('p-stat-1', 'user-m11', 'Stat Page', 'draft')").run();
    db.prepare("INSERT INTO chats (id, page_id, model) VALUES ('c-stat-1', 'p-stat-1', 'model-1')").run();
    db.prepare(
      "INSERT INTO messages (id, chat_id, role, content, tokens_in, tokens_out) VALUES ('m-stat-1', 'c-stat-1', 'assistant', 'Reply', 120, 350)"
    ).run();

    const statsRes = await fetch(`${baseUrl}/api/stats`, {
      headers: { Cookie: sessionCookie },
    });

    expect(statsRes.status).toBe(200);
    const data = await statsRes.json();
    expect(data.total.tokensIn).toBeGreaterThanOrEqual(120);
    expect(data.total.tokensOut).toBeGreaterThanOrEqual(350);
    expect(data.total.totalTokens).toBe(data.total.tokensIn + data.total.tokensOut);
  });

  it("GET /api/pages/:id/stats returns per-page and total token stats", async () => {
    const statsRes = await fetch(`${baseUrl}/api/pages/p-stat-1/stats`, {
      headers: { Cookie: sessionCookie },
    });

    expect(statsRes.status).toBe(200);
    const data = await statsRes.json();
    expect(data.page.tokensIn).toBe(120);
    expect(data.page.tokensOut).toBe(350);
    expect(data.page.totalTokens).toBe(470);
  });

  it("runBackup creates a dated backup folder and limits retention to maxKeep", () => {
    const backupFolder = runBackup(3);
    expect(fs.existsSync(backupFolder)).toBe(true);

    const backupsDir = path.resolve(process.cwd(), "backups");
    const subfolders = fs.readdirSync(backupsDir).filter((f) => f.startsWith("backup-"));
    expect(subfolders.length).toBeLessThanOrEqual(3);
  });
});

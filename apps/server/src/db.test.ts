import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import app from "./index.js";
import { closeDb, getDb } from "./db/index.js";

const TEST_DB_PATH = path.resolve(__dirname, "../data/test_m1.db");

describe("Milestone 1: Backend skeleton & SQLite", () => {
  let server: http.Server;
  let serverPort: number;

  beforeAll(async () => {
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH);
    }

    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const addr = server.address();
        if (addr && typeof addr === "object") {
          serverPort = addr.port;
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

  it("initializes SQLite database with all 6 tables and indexes", () => {
    const db = getDb(TEST_DB_PATH);
    expect(db).toBeDefined();

    const tables = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
      .all() as { name: string }[];
    const tableNames = tables.map((t) => t.name);

    expect(tableNames).toContain("users");
    expect(tableNames).toContain("pages");
    expect(tableNames).toContain("chats");
    expect(tableNames).toContain("messages");
    expect(tableNames).toContain("json_versions");
    expect(tableNames).toContain("settings");
  });

  it("GET /api/health returns status ok", async () => {
    const res = await fetch(`http://localhost:${serverPort}/api/health`);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.status).toBe("ok");
    expect(data.timestamp).toBeDefined();
  });
});

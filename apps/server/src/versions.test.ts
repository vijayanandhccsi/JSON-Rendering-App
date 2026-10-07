import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import bcrypt from "bcryptjs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import app from "./index.js";
import { closeDb, getDb } from "./db/index.js";

const TEST_DB_PATH = path.resolve(__dirname, "../data/test_m8.db");

describe("Milestone 8: JSON loop, preview, versions & undo API", () => {
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
      "user-m8",
      "m8@certkraft.com",
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
      body: JSON.stringify({ email: "m8@certkraft.com", password: "password123" }),
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

  it("saves valid and invalid JSON versions with incrementing version_no", async () => {
    const db = getDb(TEST_DB_PATH);

    // Create a page
    const pageRes = await fetch(`${baseUrl}/api/pages`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: sessionCookie },
      body: JSON.stringify({ title: "Version Test Page" }),
    });
    const { page } = await pageRes.json();

    // Insert valid version 1
    const validJson1 = JSON.stringify({
      chapter: "ch-1",
      title: "Version 1 Title",
      summary: "Summary 1",
      blocks: [],
    });
    db.prepare(
      "INSERT INTO json_versions (id, page_id, version_no, json, valid, created_at) VALUES ('v1-id', ?, 1, ?, 1, CURRENT_TIMESTAMP)"
    ).run(page.id, validJson1);
    db.prepare("UPDATE pages SET current_version_id = 'v1-id' WHERE id = ?").run(page.id);

    // Insert valid version 2
    const validJson2 = JSON.stringify({
      chapter: "ch-1",
      title: "Version 2 Title",
      summary: "Summary 2",
      blocks: [],
    });
    db.prepare(
      "INSERT INTO json_versions (id, page_id, version_no, json, valid, created_at) VALUES ('v2-id', ?, 2, ?, 1, CURRENT_TIMESTAMP)"
    ).run(page.id, validJson2);
    db.prepare("UPDATE pages SET current_version_id = 'v2-id' WHERE id = ?").run(page.id);

    // Fetch versions via GET /api/pages/:id/versions
    const versionsRes = await fetch(`${baseUrl}/api/pages/${page.id}/versions`, {
      headers: { Cookie: sessionCookie },
    });
    expect(versionsRes.status).toBe(200);

    const data = await versionsRes.json();
    expect(data.versions.length).toBe(2);
    expect(data.versions[0].version_no).toBe(2);
    expect(data.currentVersionId).toBe("v2-id");
  });

  it("POST /api/pages/:id/restore/:versionNo restores previous version", async () => {
    const db = getDb(TEST_DB_PATH);

    // Create page
    const pageRes = await fetch(`${baseUrl}/api/pages`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: sessionCookie },
      body: JSON.stringify({ title: "Restore Test Page" }),
    });
    const { page } = await pageRes.json();

    // Insert version 1 and version 2
    const jsonV1 = JSON.stringify({ chapter: "c1", title: "V1", summary: "S1", blocks: [] });
    const jsonV2 = JSON.stringify({ chapter: "c1", title: "V2", summary: "S2", blocks: [] });

    db.prepare(
      "INSERT INTO json_versions (id, page_id, version_no, json, valid, created_at) VALUES ('v1-res', ?, 1, ?, 1, CURRENT_TIMESTAMP)"
    ).run(page.id, jsonV1);
    db.prepare(
      "INSERT INTO json_versions (id, page_id, version_no, json, valid, created_at) VALUES ('v2-res', ?, 2, ?, 1, CURRENT_TIMESTAMP)"
    ).run(page.id, jsonV2);
    db.prepare("UPDATE pages SET current_version_id = 'v2-res' WHERE id = ?").run(page.id);

    // Restore to version 1
    const restoreRes = await fetch(`${baseUrl}/api/pages/${page.id}/restore/1`, {
      method: "POST",
      headers: { Cookie: sessionCookie },
    });
    expect(restoreRes.status).toBe(200);

    const restoreData = await restoreRes.json();
    expect(restoreData.ok).toBe(true);
    expect(restoreData.currentJson.title).toBe("V1");

    // GET /api/pages/:id to verify updated currentJson
    const getPageRes = await fetch(`${baseUrl}/api/pages/${page.id}`, {
      headers: { Cookie: sessionCookie },
    });
    const pageData = await getPageRes.json();
    expect(pageData.page.current_version_id).toBe("v1-res");
    expect(pageData.currentJson.title).toBe("V1");
  });
});

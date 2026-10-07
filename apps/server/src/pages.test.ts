import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import bcrypt from "bcryptjs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import app from "./index.js";
import { closeDb, getDb } from "./db/index.js";

const TEST_DB_PATH = path.resolve(__dirname, "../data/test_m4.db");

describe("Milestone 4: Pages, Chats & Messages API", () => {
  let server: http.Server;
  let baseUrl: string;
  let user1Cookie: string;
  let user2Cookie: string;

  beforeAll(async () => {
    process.env.NODE_ENV = "test";
    process.env.DATABASE_PATH = TEST_DB_PATH;
    process.env.ANTHROPIC_API_KEY = "test-key";

    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH);
    }

    const db = getDb(TEST_DB_PATH);
    const hashed = bcrypt.hashSync("password123", 10);

    // Seed two test users
    db.prepare("INSERT INTO users (id, email, password_hash, role) VALUES (?, ?, ?, ?)").run(
      "user-m4-1",
      "user1@certkraft.com",
      hashed,
      "user"
    );
    db.prepare("INSERT INTO users (id, email, password_hash, role) VALUES (?, ?, ?, ?)").run(
      "user-m4-2",
      "user2@certkraft.com",
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

    // Obtain cookies for user1 and user2
    const login1 = await fetch(`${baseUrl}/api/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "user1@certkraft.com", password: "password123" }),
    });
    user1Cookie = login1.headers.get("set-cookie")!.split(";")[0]!;

    const login2 = await fetch(`${baseUrl}/api/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "user2@certkraft.com", password: "password123" }),
    });
    user2Cookie = login2.headers.get("set-cookie")!.split(";")[0]!;
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

  it("POST /api/pages creates a page and its associated chat", async () => {
    const res = await fetch(`${baseUrl}/api/pages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: user1Cookie,
      },
      body: JSON.stringify({ title: "Lesson 1: Introduction", model: "claude-3-5-sonnet-20241022" }),
    });

    expect(res.status).toBe(201);
    const data = await res.json();

    expect(data.page).toBeDefined();
    expect(data.page.title).toBe("Lesson 1: Introduction");
    expect(data.page.user_id).toBe("user-m4-1");

    expect(data.chat).toBeDefined();
    expect(data.chat.page_id).toBe(data.page.id);
    expect(data.chat.model).toBe("claude-3-5-sonnet-20241022");
  });

  it("GET /api/pages lists only pages owned by the logged-in user", async () => {
    // User 1 creates page
    await fetch(`${baseUrl}/api/pages`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: user1Cookie },
      body: JSON.stringify({ title: "User 1 Page" }),
    });

    // User 2 creates page
    await fetch(`${baseUrl}/api/pages`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: user2Cookie },
      body: JSON.stringify({ title: "User 2 Page" }),
    });

    // Fetch User 1 pages
    const res1 = await fetch(`${baseUrl}/api/pages`, {
      headers: { Cookie: user1Cookie },
    });
    const data1 = await res1.json();
    const titles1 = data1.pages.map((p: { title: string }) => p.title);
    expect(titles1).toContain("User 1 Page");
    expect(titles1).not.toContain("User 2 Page");

    // Fetch User 2 pages
    const res2 = await fetch(`${baseUrl}/api/pages`, {
      headers: { Cookie: user2Cookie },
    });
    const data2 = await res2.json();
    const titles2 = data2.pages.map((p: { title: string }) => p.title);
    expect(titles2).toContain("User 2 Page");
    expect(titles2).not.toContain("User 1 Page");
  });

  it("GET /api/pages/:id returns 404 for pages belonging to another user", async () => {
    // User 1 creates page
    const createRes = await fetch(`${baseUrl}/api/pages`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: user1Cookie },
      body: JSON.stringify({ title: "Private Page" }),
    });
    const { page } = await createRes.json();

    // User 2 tries to access User 1's page
    const getRes = await fetch(`${baseUrl}/api/pages/${page.id}`, {
      headers: { Cookie: user2Cookie },
    });
    expect(getRes.status).toBe(404);
  });

  it("saving messages and retrieving chat history survives simulated restart", async () => {
    // Create page for User 1
    const createRes = await fetch(`${baseUrl}/api/pages`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: user1Cookie },
      body: JSON.stringify({ title: "History Test Page" }),
    });
    const { page, chat } = await createRes.json();

    // Insert user and assistant messages directly into database to simulate a chat session
    const db = getDb();
    db.prepare(
      "INSERT INTO messages (id, chat_id, role, content, attachment_name, tokens_in, tokens_out, created_at) VALUES (?, ?, 'user', 'What is block 1?', null, 0, 0, CURRENT_TIMESTAMP)"
    ).run("msg-1", chat.id);

    db.prepare(
      "INSERT INTO messages (id, chat_id, role, content, attachment_name, tokens_in, tokens_out, created_at) VALUES (?, ?, 'assistant', 'Block 1 is a heading.', null, 15, 10, CURRENT_TIMESTAMP)"
    ).run("msg-2", chat.id);

    // Simulate server restart by closing database connection
    closeDb();

    // GET /api/pages/:id after reopening
    const getRes = await fetch(`${baseUrl}/api/pages/${page.id}`, {
      headers: { Cookie: user1Cookie },
    });
    expect(getRes.status).toBe(200);

    const historyData = await getRes.json();
    expect(historyData.page.id).toBe(page.id);
    expect(historyData.messages.length).toBe(2);
    expect(historyData.messages[0].content).toBe("What is block 1?");
    expect(historyData.messages[1].content).toBe("Block 1 is a heading.");
    expect(historyData.messages[1].tokens_in).toBe(15);
    expect(historyData.messages[1].tokens_out).toBe(10);
  });

  it("PATCH /api/pages/:id updates title and chat model", async () => {
    const createRes = await fetch(`${baseUrl}/api/pages`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: user1Cookie },
      body: JSON.stringify({ title: "Old Title", model: "claude-3-5-sonnet-20241022" }),
    });
    const { page } = await createRes.json();

    const patchRes = await fetch(`${baseUrl}/api/pages/${page.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: user1Cookie },
      body: JSON.stringify({ title: "New Title", model: "gemini-2.5-flash" }),
    });
    expect(patchRes.status).toBe(200);

    const patchData = await patchRes.json();
    expect(patchData.page.title).toBe("New Title");
    expect(patchData.chat.model).toBe("gemini-2.5-flash");
  });
});

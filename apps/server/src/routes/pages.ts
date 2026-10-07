import crypto from "node:crypto";
import { Router } from "express";
import { getAvailableModels } from "../ai/index.js";
import { getDb } from "../db/index.js";

export const pagesRouter = Router();

export interface PageRow {
  id: string;
  user_id: string;
  title: string;
  learning_path?: string | null;
  status: string;
  current_version_id?: string | null;
  created_at: string;
}

export interface ChatRow {
  id: string;
  page_id: string;
  model: string;
  created_at: string;
}

export interface MessageRow {
  id: string;
  chat_id: string;
  role: string;
  content: string;
  attachment_name?: string | null;
  tokens_in: number;
  tokens_out: number;
  created_at: string;
}

export interface JsonVersionRow {
  id: string;
  page_id: string;
  version_no: number;
  json: string;
  valid: number;
  errors?: string | null;
  source_message_id?: string | null;
  created_at: string;
}

// POST /api/pages - Create a page and its chat
pagesRouter.post("/pages", (req, res) => {
  const userId = req.user!.id;
  const { title, learning_path, model } = req.body || {};

  const availableModels = getAvailableModels();
  const defaultModel = availableModels[0]?.id || "claude-3-5-sonnet-20241022";
  const selectedModel = model && typeof model === "string" ? model : defaultModel;

  const pageId = crypto.randomUUID();
  const chatId = crypto.randomUUID();
  const pageTitle = title && typeof title === "string" && title.trim() ? title.trim() : "Untitled Page";

  const db = getDb();
  const insertPage = db.prepare(
    "INSERT INTO pages (id, user_id, title, learning_path, status, created_at) VALUES (?, ?, ?, ?, 'draft', CURRENT_TIMESTAMP)"
  );
  const insertChat = db.prepare(
    "INSERT INTO chats (id, page_id, model, created_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)"
  );

  db.transaction(() => {
    insertPage.run(pageId, userId, pageTitle, learning_path || null);
    insertChat.run(chatId, pageId, selectedModel);
  })();

  const page = db.prepare("SELECT * FROM pages WHERE id = ?").get(pageId) as PageRow;
  const chat = db.prepare("SELECT * FROM chats WHERE id = ?").get(chatId) as ChatRow;

  res.status(201).json({ page, chat });
});

// GET /api/pages - List user's pages
pagesRouter.get("/pages", (req, res) => {
  const userId = req.user!.id;
  const db = getDb();
  const pages = db.prepare("SELECT * FROM pages WHERE user_id = ? ORDER BY created_at DESC").all(userId) as PageRow[];
  res.json({ pages });
});

// GET /api/pages/:id - Return page, chat, messages history, and current JSON
pagesRouter.get("/pages/:id", (req, res) => {
  const userId = req.user!.id;
  const pageId = req.params.id;

  const db = getDb();
  const page = db.prepare("SELECT * FROM pages WHERE id = ? AND user_id = ?").get(pageId, userId) as PageRow | undefined;

  if (!page) {
    res.status(404).json({ error: "Page not found" });
    return;
  }

  const chat = db.prepare("SELECT * FROM chats WHERE page_id = ?").get(page.id) as ChatRow | undefined;
  const messages = chat
    ? (db.prepare("SELECT * FROM messages WHERE chat_id = ? ORDER BY created_at ASC").all(chat.id) as MessageRow[])
    : [];

  let currentJson = null;
  if (page.current_version_id) {
    const versionRow = db.prepare("SELECT json FROM json_versions WHERE id = ?").get(page.current_version_id) as
      | { json: string }
      | undefined;
    if (versionRow) {
      try {
        currentJson = JSON.parse(versionRow.json);
      } catch {
        currentJson = versionRow.json;
      }
    }
  }

  res.json({
    page,
    chat,
    messages,
    currentJson,
  });
});

// GET /api/pages/:id/versions - Return all versions for a page
pagesRouter.get("/pages/:id/versions", (req, res) => {
  const userId = req.user!.id;
  const pageId = req.params.id;

  const db = getDb();
  const page = db.prepare("SELECT * FROM pages WHERE id = ? AND user_id = ?").get(pageId, userId) as PageRow | undefined;

  if (!page) {
    res.status(404).json({ error: "Page not found" });
    return;
  }

  const versions = db
    .prepare("SELECT * FROM json_versions WHERE page_id = ? ORDER BY version_no DESC")
    .all(pageId) as JsonVersionRow[];

  res.json({ versions, currentVersionId: page.current_version_id });
});

// POST /api/pages/:id/restore/:versionNo - Restore a specific version
pagesRouter.post("/pages/:id/restore/:versionNo", (req, res) => {
  const userId = req.user!.id;
  const pageId = req.params.id;
  const versionNo = parseInt(req.params.versionNo || "0", 10);

  const db = getDb();
  const page = db.prepare("SELECT * FROM pages WHERE id = ? AND user_id = ?").get(pageId, userId) as PageRow | undefined;

  if (!page) {
    res.status(404).json({ error: "Page not found" });
    return;
  }

  const versionRow = db
    .prepare("SELECT * FROM json_versions WHERE page_id = ? AND version_no = ?")
    .get(pageId, versionNo) as JsonVersionRow | undefined;

  if (!versionRow) {
    res.status(404).json({ error: `Version ${versionNo} not found for this page.` });
    return;
  }

  db.prepare("UPDATE pages SET current_version_id = ? WHERE id = ?").run(versionRow.id, pageId);

  let parsedJson = null;
  try {
    parsedJson = JSON.parse(versionRow.json);
  } catch {
    parsedJson = versionRow.json;
  }

  res.json({
    ok: true,
    version: versionRow,
    currentJson: parsedJson,
  });
});

// PATCH /api/pages/:id - Update page title or chat model
pagesRouter.patch("/pages/:id", (req, res) => {
  const userId = req.user!.id;
  const pageId = req.params.id;
  const { title, model } = req.body || {};

  const db = getDb();
  const page = db.prepare("SELECT * FROM pages WHERE id = ? AND user_id = ?").get(pageId, userId) as PageRow | undefined;

  if (!page) {
    res.status(404).json({ error: "Page not found" });
    return;
  }

  db.transaction(() => {
    if (title && typeof title === "string" && title.trim()) {
      db.prepare("UPDATE pages SET title = ? WHERE id = ?").run(title.trim(), pageId);
    }
    if (model && typeof model === "string") {
      db.prepare("UPDATE chats SET model = ? WHERE page_id = ?").run(model, pageId);
    }
  })();

  const updatedPage = db.prepare("SELECT * FROM pages WHERE id = ?").get(pageId) as PageRow;
  const updatedChat = db.prepare("SELECT * FROM chats WHERE page_id = ?").get(pageId) as ChatRow;

  res.json({ page: updatedPage, chat: updatedChat });
});

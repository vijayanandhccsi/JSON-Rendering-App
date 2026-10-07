import crypto from "node:crypto";
import { validatePage } from "@certkraft/blocks";
import { Router } from "express";
import rateLimit from "express-rate-limit";
import { getAdapterForModel, getAvailableModels } from "../ai/index.js";
import type { ChatMessage } from "../ai/types.js";
import { getDb } from "../db/index.js";
import { extractJsonFromText } from "../utils/jsonExtract.js";
import { isOutlinePayload } from "../utils/jsonOutline.js";
import { applyJsonPatch, extractPatchOperations, isPatchPayload } from "../utils/jsonPatch.js";
import { loadRulesSystemPrompt } from "../utils/rulesContext.js";
import type { ChatRow, MessageRow, PageRow } from "./pages.js";

export const chatRouter = Router();

const chatRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  keyGenerator: (req) => (req as any).user?.id || req.ip || "anonymous",
  validate: false,
  message: { error: "Rate limit exceeded for chat requests. Please wait a moment before sending more messages." },
  standardHeaders: true,
  legacyHeaders: false,
});

// GET /api/models
chatRouter.get("/models", (_req, res) => {
  const models = getAvailableModels();
  res.json({ models });
});

// GET /api/stats
chatRouter.get("/stats", (req, res) => {
  const userId = req.user!.id;
  const db = getDb();

  const totalRow = db.prepare(`
    SELECT COALESCE(SUM(m.tokens_in), 0) AS tokensIn, COALESCE(SUM(m.tokens_out), 0) AS tokensOut
    FROM messages m
    JOIN chats c ON m.chat_id = c.id
    JOIN pages p ON c.page_id = p.id
    WHERE p.user_id = ?
  `).get(userId) as { tokensIn: number; tokensOut: number };

  res.json({
    total: {
      tokensIn: totalRow.tokensIn,
      tokensOut: totalRow.tokensOut,
      totalTokens: totalRow.tokensIn + totalRow.tokensOut,
    },
  });
});

// GET /api/pages/:id/stats
chatRouter.get("/pages/:id/stats", (req, res) => {
  const userId = req.user!.id;
  const { id: pageId } = req.params;
  const db = getDb();

  const page = db.prepare("SELECT id FROM pages WHERE id = ? AND user_id = ?").get(pageId, userId);
  if (!page) {
    res.status(404).json({ error: "Page not found or access denied" });
    return;
  }

  const pageRow = db.prepare(`
    SELECT COALESCE(SUM(m.tokens_in), 0) AS tokensIn, COALESCE(SUM(m.tokens_out), 0) AS tokensOut
    FROM messages m
    JOIN chats c ON m.chat_id = c.id
    WHERE c.page_id = ?
  `).get(pageId) as { tokensIn: number; tokensOut: number };

  const totalRow = db.prepare(`
    SELECT COALESCE(SUM(m.tokens_in), 0) AS tokensIn, COALESCE(SUM(m.tokens_out), 0) AS tokensOut
    FROM messages m
    JOIN chats c ON m.chat_id = c.id
    JOIN pages p ON c.page_id = p.id
    WHERE p.user_id = ?
  `).get(userId) as { tokensIn: number; tokensOut: number };

  res.json({
    page: {
      tokensIn: pageRow.tokensIn,
      tokensOut: pageRow.tokensOut,
      totalTokens: pageRow.tokensIn + pageRow.tokensOut,
    },
    total: {
      tokensIn: totalRow.tokensIn,
      tokensOut: totalRow.tokensOut,
      totalTokens: totalRow.tokensIn + totalRow.tokensOut,
    },
  });
});

// Helper to validate and save JSON version to DB
export function processAndSaveJsonVersion(
  pageId: string,
  rawText: string,
  sourceMessageId?: string
): {
  versionId?: string;
  versionNo?: number;
  valid: boolean;
  errors?: any[];
  parsedJson?: unknown;
  isPatch?: boolean;
  patchFailed?: boolean;
  isOutline?: boolean;
  outlinePayload?: any;
} {
  const extracted = extractJsonFromText(rawText);
  if (!extracted.found || !extracted.json) {
    return { valid: false };
  }

  const db = getDb();
  let targetJsonToValidate = extracted.json;
  let isPatch = false;
  let isOutline = false;
  let outlinePayload: any = null;

  if (isOutlinePayload(extracted.json)) {
    isOutline = true;
    outlinePayload = extracted.json;
    const rawSlug = (extracted.json.chapter || "chapter-slug").toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
    const slug = rawSlug && /^[a-z0-9]+(-[a-z0-9]+)*$/.test(rawSlug) ? rawSlug : "chapter-slug";

    targetJsonToValidate = {
      chapter: slug,
      title: extracted.json.title || "Page Title",
      summary: extracted.json.summary || "Summary of the page.",
      estimatedMinutes: extracted.json.estimatedMinutes || 5,
      blocks: [
        {
          type: "paragraph",
          text: `Outline approved: ${extracted.json.sections?.length || 0} sections planned.`,
        },
      ],
    };
  } else if (isPatchPayload(extracted.json)) {
    isPatch = true;
    const page = db.prepare("SELECT current_version_id FROM pages WHERE id = ?").get(pageId) as { current_version_id?: string } | undefined;
    if (page?.current_version_id) {
      const vRow = db.prepare("SELECT json FROM json_versions WHERE id = ?").get(page.current_version_id) as { json: string } | undefined;
      if (vRow) {
        try {
          const currentDoc = JSON.parse(vRow.json);
          const ops = extractPatchOperations(extracted.json);
          targetJsonToValidate = applyJsonPatch(currentDoc, ops);
        } catch (patchErr: any) {
          return {
            valid: false,
            isPatch: true,
            patchFailed: true,
            errors: [{ message: `Failed to apply patch: ${patchErr.message}` }],
          };
        }
      }
    }
  }

  const validation = validatePage(targetJsonToValidate);

  const maxRow = db
    .prepare("SELECT COALESCE(MAX(version_no), 0) AS max_v FROM json_versions WHERE page_id = ?")
    .get(pageId) as { max_v: number } | undefined;
  const versionNo = (maxRow?.max_v || 0) + 1;
  const versionId = crypto.randomUUID();
  const validFlag = validation.valid ? 1 : 0;
  const errorJsonStr = validation.valid ? null : JSON.stringify(validation.errors);

  db.prepare(
    "INSERT INTO json_versions (id, page_id, version_no, json, valid, errors, source_message_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)"
  ).run(
    versionId,
    pageId,
    versionNo,
    JSON.stringify(targetJsonToValidate),
    validFlag,
    errorJsonStr,
    sourceMessageId || null
  );

  if (validation.valid) {
    db.prepare("UPDATE pages SET current_version_id = ?, title = ? WHERE id = ?").run(
      versionId,
      (targetJsonToValidate as any).title || "Untitled Page",
      pageId
    );
  }

  return {
    versionId,
    versionNo,
    valid: validation.valid,
    errors: validation.errors,
    parsedJson: targetJsonToValidate,
    isPatch,
    isOutline,
    outlinePayload,
  };
}

// POST /api/chat
chatRouter.post("/chat", chatRateLimiter, async (req, res) => {
  const userId = req.user!.id;
  const { pageId, message, model, system, attachmentName } = req.body || {};

  const db = getDb();
  let selectedModel = model;
  let chatRecord: ChatRow | null = null;
  let chatHistory: ChatMessage[] = [];
  let currentJsonContext = "";

  if (pageId && typeof pageId === "string") {
    // 1. Verify page ownership
    const page = db.prepare("SELECT * FROM pages WHERE id = ? AND user_id = ?").get(pageId, userId) as PageRow | undefined;
    if (!page) {
      res.status(404).json({ error: "Page not found or access denied" });
      return;
    }

    // 2. Load current page JSON if present for edit context
    if (page.current_version_id) {
      const vRow = db
        .prepare("SELECT json FROM json_versions WHERE id = ?")
        .get(page.current_version_id) as { json: string } | undefined;
      if (vRow) {
        currentJsonContext = `\n\n=== CURRENT PAGE JSON ===\n${vRow.json}\n\nFor small edits, return a JSON patch (RFC 6902, e.g. {"patch": [{"op": "replace", "path": "/blocks/0/text", "value": "..."}]}). For big restructures or new pages, return the full updated page JSON inside a \`\`\`json ... \`\`\` code block.`;
      }
    }

    // 3. Find or create chat record
    chatRecord = db.prepare("SELECT * FROM chats WHERE page_id = ?").get(pageId) as ChatRow | undefined || null;

    if (!chatRecord) {
      const chatId = crypto.randomUUID();
      const defaultModel = selectedModel || getAvailableModels()[0]?.id || "claude-3-5-sonnet-20241022";
      db.prepare("INSERT INTO chats (id, page_id, model, created_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)").run(
        chatId,
        pageId,
        defaultModel
      );
      chatRecord = db.prepare("SELECT * FROM chats WHERE id = ?").get(chatId) as ChatRow;
    }

    // 4. Update model if requested
    if (selectedModel && typeof selectedModel === "string" && selectedModel !== chatRecord.model) {
      db.prepare("UPDATE chats SET model = ? WHERE id = ?").run(selectedModel, chatRecord.id);
      chatRecord.model = selectedModel;
    } else {
      selectedModel = chatRecord.model;
    }

    // 5. Save incoming user message if present
    if (message && typeof message === "string" && message.trim()) {
      const userMsgId = crypto.randomUUID();
      db.prepare(
        "INSERT INTO messages (id, chat_id, role, content, attachment_name, tokens_in, tokens_out, created_at) VALUES (?, ?, 'user', ?, ?, 0, 0, CURRENT_TIMESTAMP)"
      ).run(userMsgId, chatRecord.id, message.trim(), attachmentName || null);
    }

    // 6. Load full history from messages table
    const storedMessages = db
      .prepare("SELECT role, content FROM messages WHERE chat_id = ? ORDER BY created_at ASC")
      .all(chatRecord.id) as MessageRow[];

    chatHistory = storedMessages.map((m) => ({
      role: m.role as "user" | "assistant" | "system",
      content: m.content,
    }));
  } else if (Array.isArray(req.body.messages) && req.body.messages.length > 0) {
    // Standalone chat mode without pageId
    chatHistory = req.body.messages;
  } else {
    res.status(400).json({ error: "Either 'pageId' with 'message' OR a non-empty 'messages' array must be provided." });
    return;
  }

  const activeModel = selectedModel || getAvailableModels()[0]?.id || "claude-3-5-sonnet-20241022";

  let systemPrompt: string;
  try {
    const basePrompt = typeof system === "string" && system.trim() ? system : loadRulesSystemPrompt();
    systemPrompt = `${basePrompt}${currentJsonContext}`;
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: errorMsg });
    return;
  }

  let adapterInfo;
  try {
    adapterInfo = getAdapterForModel(activeModel);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    res.status(400).json({ error: errorMsg });
    return;
  }

  // Set SSE Headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();

  const sendEvent = (data: object) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  let fullResponse = "";

  try {
    await adapterInfo.adapter.send(
      chatHistory,
      systemPrompt,
      adapterInfo.modelId,
      {
        onChunk: (text) => {
          fullResponse += text;
          sendEvent({ type: "chunk", text });
        },
        onDone: (usage) => {
          let assistantMsgId: string | undefined;
          let versionOutcome: ReturnType<typeof processAndSaveJsonVersion> | null = null;

          // Save assistant message to database if chatRecord exists
          if (chatRecord && fullResponse.trim()) {
            assistantMsgId = crypto.randomUUID();
            db.prepare(
              "INSERT INTO messages (id, chat_id, role, content, attachment_name, tokens_in, tokens_out, created_at) VALUES (?, ?, 'assistant', ?, null, ?, ?, CURRENT_TIMESTAMP)"
            ).run(assistantMsgId, chatRecord.id, fullResponse, usage.tokensIn, usage.tokensOut);

            if (pageId && typeof pageId === "string") {
              versionOutcome = processAndSaveJsonVersion(pageId, fullResponse, assistantMsgId);
            }
          }

          sendEvent({
            type: "done",
            messageId: assistantMsgId,
            tokensIn: usage.tokensIn,
            tokensOut: usage.tokensOut,
            stopReason: usage.stopReason,
            isTruncated: usage.stopReason === "max_tokens" || usage.stopReason === "length",
            jsonVersion: versionOutcome?.versionNo
              ? {
                  versionId: versionOutcome.versionId,
                  versionNo: versionOutcome.versionNo,
                  valid: versionOutcome.valid,
                  errors: versionOutcome.errors,
                  parsedJson: versionOutcome.parsedJson,
                  isPatch: versionOutcome.isPatch,
                  patchFailed: versionOutcome.patchFailed,
                  isOutline: versionOutcome.isOutline,
                  outlinePayload: versionOutcome.outlinePayload,
                }
              : undefined,
          });
          res.end();
        },
        onError: (err) => {
          sendEvent({ type: "error", error: err.message });
          res.end();
        },
      }
    );
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    sendEvent({ type: "error", error: errorMsg });
    res.end();
  }
});

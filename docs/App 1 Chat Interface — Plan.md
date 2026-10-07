# App 1 Chat Interface — Plan

Oct 7, 2026 · @Vijay

## Overview

App 1 gets a floating, Claude-style chat window that turns n8n lesson content into validated reading-page JSON, edits it on request, and shows it live in the preview. Only validated JSON is later imported into the LMS (Project 2).

- **Where it runs:** App 1, the standalone preview app on the Bluehost VPS, in its own folder, built with Cursor.
- **Input:** text you type, paste or upload directly in the chat, plus output from the n8n workflow when you use it (course outline, learning objectives, lesson content, suggested blocks).
- **Output:** page JSON built only from the blocks allowed in rules.md and guide.md.

## Decisions so far

| Area | Decision |
| --- | --- |
| Host app | App 1 (preview app), not the LMS |
| Chat style | Floating chat window, similar to the Claude chat interface |
| Chat jobs | Generate page JSON, edit existing JSON, validate against rules |
| AI models | Switchable per chat (Claude or Gemini) |
| Input | Type, paste or upload in the chat; n8n output is one possible source |
| API keys | Server-side .env behind a small Node backend |
| Storage | SQLite |
| Rules context | Auto-load rules.md and guide.md as the system prompt (recommended; files edited on disk) |

## Architecture

&#91;embedded content: architecture · 9 components\]

The backend is the only part that touches API keys, the AI providers, the rules files and the database; the validator gates every JSON result before the preview.

## Database structure (SQLite)

One chat per page. Every accepted JSON result becomes a numbered version, so any step can be undone.

| Table | Key columns | Purpose |
| --- | --- | --- |
| pages | id, title, learning\_path, status, current\_version\_id, created\_at | One row per reading page |
| chats | id, page\_id, model, created\_at | One chat per page |
| messages | id, chat\_id, role, content, attachment\_name, tokens\_in, tokens\_out, created\_at | Chat history and token use |
| json\_versions | id, page\_id, version\_no, json, valid, errors, source\_message\_id, created\_at | Every JSON result with its validation outcome |
| settings | key, value | Default model and UI options |

Relations: pages 1-1 chats, chats 1-many messages, pages 1-many json\_versions.

## Backend API

A small Node/Express server proxies all AI calls so keys never reach the browser. A provider adapter gives Claude and Gemini the same interface, so the model dropdown only changes a parameter.

| Endpoint | Purpose |
| --- | --- |
| POST /api/chat | Send a message (plus current JSON and optional file); streams the reply |
| GET /api/pages | List pages |
| POST /api/pages | Create a page and its chat |
| GET /api/pages/:id | Page, chat history, current JSON |
| GET /api/pages/:id/versions | Version list |
| POST /api/pages/:id/restore/:versionNo | Undo to an earlier version |
| POST /api/validate | Validate JSON against the block schema |
| POST /api/upload | Read an uploaded file (JSON, markdown or text) |
| GET /api/models | Models available from configured keys |

Provider adapter: `send(messages, system, model) -> stream`, with one implementation each for Claude and Gemini.

## Login

Login is required, so the backend protects every route except the login page.

- **Method (proposed):** email and password, passwords hashed with bcrypt, session in an httpOnly cookie. No third-party auth service, which keeps App 1 self-contained on the VPS.
- **New table `users`:** id, email, password\_hash, role, created\_at. `pages` gets a `user_id` column.
- **New endpoints:** POST /api/login, POST /api/logout, GET /api/me.
- **Protection:** all /api routes check the session; login attempts are rate limited; the app runs over HTTPS only.
- **Accounts:** no public sign-up. You create users yourself (a seed script or an admin-only screen).
- **Build order:** added in phase 1 with the backend core, so no route is ever built unprotected.

## Floating chat UI

The chat floats over the preview so the page stays visible while you talk to the AI.

- Round launcher button bottom-right; opens a resizable, draggable chat window.
- Streaming replies, markdown rendering, copy button per message.
- Model dropdown in the header; applies to the current chat.
- Input box with paste and a file-attach button (JSON, markdown or text).
- Quick actions: Generate, Apply to preview, Validate, Undo.
- Status badge on each JSON reply: valid, or the list of validation errors.
- Version menu to restore any earlier JSON.
- Page switcher so each page keeps its own chat.

## JSON generate, edit, validate loop

1. You type, paste or upload content (n8n output or your own) and ask for a page.
2. The backend sends the system prompt (rules.md + guide.md), the chat history and, in edit mode, the current JSON.
3. The AI replies with JSON; the backend extracts it.
4. A schema validator checks every block against the allowed list. The AI's own claim of validity is not trusted.
5. If invalid, the errors go back to the AI for up to 2 automatic retries.
6. A valid result is saved as a new version and loaded into the preview.
7. Edit requests ("change block 3") send the current JSON again; the AI returns either a patch (small changes) or the full JSON (large changes).
8. Undo restores any earlier version.

Decision: support both reply types. New pages and big restructures use full JSON. Small edits (one block, a few fields) use a patch: a list of operations (replace, add, remove) on a block path. The backend applies the patch to the current JSON, then validates the result like any other. If a patch fails to apply or fails validation, the backend asks the AI for full JSON instead. Build full JSON first (phase 4), patches in phase 5.

**Long pages:** a long page can exceed the model's output limit, so it is built in sections using the same patch mechanism.

1. The AI first returns a short outline: section titles and the block types it plans to use. You approve or tweak it.
2. It then writes one section at a time, each as an "add" patch that appends blocks to the page.
3. The backend validates after every section and saves a version, so one section can be undone on its own.
4. If a reply is cut off (token limit reached, or incomplete JSON), the backend discards the partial section and asks again for just that section. Saved sections are never lost.
5. A page short enough for one reply is still generated as full JSON; the section flow starts only when the outline is long.

## Rules context

rules.md and guide.md are plain files in the App 1 folder, read from disk on every request and sent as the system prompt. Editing the files changes AI behavior immediately, with no settings screen to build. The same block list should also drive the validator, so the AI and the checker never disagree.

## Phased build plan

1. **Backend core:** Express server, `/api/chat` with streaming, provider adapter for Claude and Gemini, keys in .env. Done when a test message streams from both models.
2. **SQLite:** create the five tables and the page/chat/message endpoints. Done when a chat survives a restart.
3. **Floating chat UI:** launcher, window, streaming messages, model dropdown, paste and file upload. Done when you can chat inside App 1.
4. **JSON loop:** load rules.md and guide.md, extract JSON, validate, push to preview, save versions. Done when a pasted outline becomes a rendered page.
5. **Edit mode and undo:** send current JSON with each message, patch replies, section-by-section generation for long pages, version menu, restore. Done when "change block 3" works and can be undone.
6. **Hardening:** auto-retry on validation errors, token and cost display, rate limit, error messages. Done when a bad AI reply recovers without manual work.

Project 2 (the LMS import screen) starts after phase 4 is stable.

## Open questions and risks

- [ ] Does App 1 already have a block schema or validator, or should it be built from rules.md?
- [ ] Decided: both full JSON and patches for edits (see the JSON loop section).
- [ ] Decided: login is required. Open: who are the users (only you, or a small team) and does each user see only their own pages?
- [ ] Decided: long pages are generated outline first, then section by section as patches (see the JSON loop section).
- [ ] Decided: track API cost across 500-600 pages with the token display in phase 6.
- [ ] Decided: keep .env and the SQLite file out of git (add both to .gitignore) and back them up on the VPS.

## Gemini check prompt (Antigravity)

Paste this into Gemini with this plan uploaded. It answers the first open question: does App 1 already have a block schema or validator?

```
Read the attached plan "App 1 Chat Interface — Plan". Then do a READ-ONLY inspection of the App 1 codebase. Do not modify any files.

Answer these questions:

1. Does App 1 already have a block schema or validator for page JSON? Look for JSON Schema files, Zod/Yup/Ajv usage, TypeScript block types, or validation functions. List file paths and what each does.
2. Where is the list of allowed blocks defined? Is it only in rules.md and guide.md, or also in code?
3. How does the preview currently render each block type? Is there a block-to-component map? List its path.
4. Do the allowed blocks in rules.md and guide.md match the blocks the renderer actually supports? List every mismatch (missing, extra, or differently named blocks, and different field names).
5. Is there an existing backend (Express or other)? If so, list its routes, port, and how env vars are loaded.
6. Is SQLite or any database already in use?
7. What are the framework, bundler and package manager of App 1?

Then give a verdict:
- "Validator exists" (reuse it, say how), or
- "Needs to be built" (recommend the best single source of truth, so the AI rules, validator and renderer share one block list).

Finally, list anything in the plan that conflicts with the existing code. Keep the report short, with file paths for every claim.
```

If the verdict is "Needs to be built", the validator is generated from the same block list as rules.md so the AI and the checker never disagree.

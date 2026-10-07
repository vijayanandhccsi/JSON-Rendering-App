# App 1 Chat — Gemini Milestones

Oct 7, 2026 · @Vijay

## How to use these milestones

Run one milestone at a time in Antigravity, with the plan doc "App 1 Chat Interface — Plan" attached. Test each result before starting the next. Each milestone has a goal, done-when checks, and a prompt to paste.

Every prompt starts with the same rules, so Gemini stays in scope:

```
RULES FOR THIS TASK
- Follow the attached plan "App 1 Chat Interface — Plan".
- Do ONLY this milestone. Do not start later milestones or refactor unrelated code.
- Reuse the existing stack and folder structure of App 1 (found in Milestone 0). Do not add new frameworks unless this milestone says so.
- Never put API keys or secrets in code or in git. Read them from .env.
- When finished, give a short summary: files changed, how to run it, and how to test each "done when" check. Then stop.
```

Paste the rules block at the top of each milestone prompt below (the prompts say "RULES ABOVE" where it goes).

## M0: Inspect the codebase (read-only)

**Goal:** find out what App 1 already has, so later milestones reuse it instead of duplicating it.

**Done when:** you have a short report that answers all seven questions, with file paths. Nothing was changed.

```
RULES ABOVE.

Do a READ-ONLY inspection of the App 1 codebase. Do not modify any files.

1. Does App 1 already have a block schema or validator for page JSON? Look for JSON Schema, Zod/Yup/Ajv, TypeScript block types, validation functions. List file paths and what each does.
2. Where is the list of allowed blocks defined? Only in rules.md and guide.md, or also in code?
3. How does the preview render each block type? Is there a block-to-component map? List its path.
4. Do the blocks in rules.md and guide.md match what the renderer supports? List every mismatch (missing, extra, renamed blocks, different field names).
5. Is there an existing backend? List routes, port, and how env vars load.
6. Is SQLite or any database already used?
7. What are the framework, bundler and package manager?

Verdict: "Validator exists" (how to reuse it) or "Needs to be built" (recommend one source of truth for the block list shared by the AI rules, validator and renderer).
Finally list anything in the plan that conflicts with the existing code. Keep it short, with file paths for every claim.
```

**After this:** send me the report so later milestones can be adjusted.

## M1: Backend skeleton and SQLite

**Goal:** a running Node/Express server with .env loading and a SQLite database with all tables created.

**Done when:**

- The server starts and GET /api/health returns ok.
- Keys and settings load from .env; .env and the .db file are in .gitignore; a .env.example exists.
- The database file is created on first start with tables users, pages, chats, messages, json\_versions, settings.

```
RULES ABOVE.

MILESTONE 1: backend skeleton and SQLite.

- Create (or reuse, if M0 found one) a Node/Express backend in its own folder inside App 1.
- Load config from .env (port, database path). Add .env.example with placeholder values. Add .env and *.db to .gitignore.
- Add GET /api/health.
- Set up SQLite (better-sqlite3 unless M0 found something else) and create tables on first start, as in the plan's Database structure section:
  users(id, email, password_hash, role, created_at)
  pages(id, user_id, title, learning_path, status, current_version_id, created_at)
  chats(id, page_id, model, created_at)
  messages(id, chat_id, role, content, attachment_name, tokens_in, tokens_out, created_at)
  json_versions(id, page_id, version_no, json, valid, errors, source_message_id, created_at)
  settings(key, value)
- Add foreign keys and sensible indexes.
- Do not build login, chat or UI yet.
```

## M2: Login

**Goal:** every /api route is protected; only logged-in users get in. No public sign-up.

**Done when:**

- Logging in with a seeded user sets an httpOnly session cookie; logging out clears it.
- Any /api route (except login and health) returns 401 without a session.
- Wrong passwords fail, and repeated failures are rate limited.
- App 1 shows a login page first, and the main app only after login.

```
RULES ABOVE.

MILESTONE 2: login.

- Backend: POST /api/login, POST /api/logout, GET /api/me. Passwords hashed with bcrypt. Sessions in an httpOnly, sameSite cookie (secure when behind HTTPS). Session secret from .env.
- Middleware that requires a session on every /api route except /api/login and /api/health.
- Rate limit login attempts.
- No public sign-up. Add a seed script (npm run create-user) that creates a user from an email and password typed in the terminal.
- Frontend: a simple login page in App 1 matching its existing styling. After login show the existing app; if /api/me returns 401, show the login page.
- Do not build the chat yet.
```

## M3: AI provider adapter and chat endpoint

**Goal:** the backend can stream a reply from either Claude or Gemini through one interface.

**Done when:**

- GET /api/models lists only the models whose keys are set in .env.
- POST /api/chat streams a reply from Claude and from Gemini (test with curl or a small script).
- Provider errors (bad key, rate limit) return a clear message, not a crash.
- Token counts (in and out) are returned at the end of each reply.

```
RULES ABOVE.

MILESTONE 3: AI provider adapter and chat endpoint.

- Add a provider adapter with one interface: send(messages, system, model) -> streamed text plus token usage. Implement it for the Claude API and the Gemini API.
- Keys come from .env (ANTHROPIC_API_KEY, GEMINI_API_KEY). A provider with no key is not offered.
- GET /api/models returns the available models.
- POST /api/chat takes { model, messages, system? } and streams the reply (server-sent events). It requires login (M2).
- Return token usage when the stream ends. Handle provider errors cleanly.
- Do not save anything to the database yet and do not build UI.
```

## M4: Pages, chats and messages API

**Goal:** pages, one chat per page, and chat messages are saved in SQLite and survive a restart.

**Done when:**

- You can create a page and list your pages.
- Sending a message through /api/chat saves both your message and the reply, with token counts.
- After restarting the server, GET /api/pages/:id returns the full chat history.
- A user can only see their own pages.

```
RULES ABOVE.

MILESTONE 4: pages, chats and messages API.

- POST /api/pages creates a page (user_id from the session) and its chat. GET /api/pages lists the user's pages. GET /api/pages/:id returns the page, its chat history and its current JSON (empty for now).
- Change POST /api/chat to take a pageId, load the chat history from the database, save the user message and the streamed reply (with tokens_in and tokens_out), and use the model stored on the chat. Allow changing the chat's model.
- Every query must filter by the logged-in user's id.
- No UI yet and no JSON handling yet.
```

## M5: Floating chat UI

**Goal:** a Claude-style floating chat inside App 1 that talks to the backend, with a page switcher and model dropdown.

**Done when:**

- A launcher button opens and closes a draggable, resizable chat window over the preview.
- Replies stream in and render as markdown; each message has a copy button.
- The header has a page switcher (with New page) and a model dropdown.
- Reloading the browser restores the chat history of the selected page.

```
RULES ABOVE.

MILESTONE 5: floating chat UI.

- Add a floating chat to App 1: round launcher button bottom-right, opening a draggable, resizable chat window that floats over the preview, similar to the Claude chat interface.
- Message list with streaming replies (consume the /api/chat stream), markdown rendering, and a copy button on each message. Input box (Enter to send, Shift+Enter for a new line).
- Header: page switcher with a New page action, and a model dropdown filled from /api/models.
- Load and show the saved chat history for the selected page (M4).
- Match App 1's existing styling. Do not add file upload, JSON handling or version controls yet.
```

## M6: Paste and file upload

**Goal:** you can type, paste or attach a file (JSON, markdown or text) in the chat, from n8n or your own content.

**Done when:**

- Pasting a long text works and is sent as the message.
- Attaching a .json, .md or .txt file shows a file chip and its content is sent with your message.
- Unsupported or oversized files are rejected with a clear message.
- The attachment name is saved with the message.

```
RULES ABOVE.

MILESTONE 6: paste and file upload.

- Backend: POST /api/upload accepts .json, .md and .txt files (size limit set in .env, default 1 MB), checks type and size, and returns the text content. Requires login.
- Frontend: an attach button in the chat input and drag-and-drop onto the chat. Show the attached file as a removable chip. On send, include the file text with the message and save the file name in messages.attachment_name.
- Long pasted text must not freeze the input.
- Do not build JSON handling yet.
```

## M7: Rules loading and block validator

**Goal:** rules.md and guide.md become the AI's system prompt, and a validator checks page JSON against the allowed blocks. Adjust this milestone to the M0 report: reuse any existing validator, and build only what is missing.

**Done when:**

- Every /api/chat request sends rules.md and guide.md as the system prompt, read from disk each time.
- POST /api/validate returns { valid, errors } with the block path for each error.
- One block list drives both the validator and the rules, with no second copy to keep in sync.
- Tests cover a valid page, an unknown block type, a missing required field and a wrong field type.

```
RULES ABOVE.

MILESTONE 7: rules loading and block validator. Use the M0 report: reuse what exists, build only what is missing.

- Read rules.md and guide.md from disk on every request and send them as the system prompt in /api/chat. Missing files must give a clear error.
- Create ONE source of truth for the allowed blocks (a schema file, derived from rules.md and guide.md and matching what the preview renderer supports). Build the validator from it, and if possible have the renderer's block map use the same list. Report any mismatch you find between the rules files and the renderer instead of silently fixing it.
- POST /api/validate takes page JSON and returns { valid, errors[] } where each error has the block path and a plain message.
- Add automated tests for: a valid page, an unknown block type, a missing required field, a wrong field type.
- Do not wire the validator into the chat yet.
```

## M8: JSON loop, preview, versions and undo

**Goal:** ask for a page, get validated JSON, see it in the preview, and undo to any earlier version. Full JSON replies only; patches come in M9.

**Done when:**

- A pasted outline produces page JSON that is extracted from the reply, validated and rendered in the preview.
- Each valid result is saved as a new numbered version; invalid results are saved with their errors but not shown.
- If validation fails, the errors go back to the AI automatically, up to 2 retries.
- Each JSON reply shows a valid or error badge; a version menu lets you restore any version.
- When you ask for an edit, the current JSON is sent with your message and the AI returns the full JSON.

```
RULES ABOVE.

MILESTONE 8: JSON loop, preview, versions and undo (full JSON replies only).

- Backend: after the AI replies, extract the JSON from the reply, validate it with M7's validator, and save it in json_versions (version_no increments, valid flag, errors). On invalid JSON, send the validation errors back to the AI and retry, max 2 retries; if still invalid, save it as invalid and tell the user.
- On each chat request, include the page's current JSON so edit requests work (the AI returns the full replacement JSON). Update pages.current_version_id only for valid versions.
- Endpoints: GET /api/pages/:id/versions, POST /api/pages/:id/restore/:versionNo.
- Frontend: when a valid version is saved, load it into the existing preview automatically. Show a valid/error badge on JSON replies (with the error list), a version menu to restore any version, and an Undo action.
- Do not implement patches or section-by-section generation yet.
```

## M9: Patch edits

**Goal:** small edits use patches instead of resending the whole page, with a safe fallback to full JSON.

**Done when:**

- A request like "change block 3" returns a patch that the backend applies to the current JSON.
- The patched result is validated and saved as a new version, like any other.
- If a patch cannot be applied or the result is invalid, the backend asks for full JSON instead.
- Big restructures and new pages still use full JSON.
- Tests cover replace, add and remove operations and the fallback.

```
RULES ABOVE.

MILESTONE 9: patch edits.

- Define a patch format: a list of operations (replace, add, remove) on a block path inside the page JSON (follow JSON Patch, RFC 6902, unless M0 found a better fit). Document the format in guide.md so the AI knows when to use a patch (small edits) and when to return full JSON (new pages, big restructures).
- Backend: detect whether the AI reply is a patch or full JSON. For a patch, apply it to the current JSON, validate the result with the M7 validator, and save a new version (M8 flow). If applying fails or validation fails, retry once asking for a corrected patch, then fall back to asking for full JSON.
- Add automated tests for replace, add, remove, an invalid path, and the fallback.
- Do not implement section-by-section generation yet.
```

## M10: Long pages by section

**Goal:** long pages are built outline first, then one section at a time as "add" patches, so the model's output limit is never hit.

**Done when:**

- For a long request the AI first returns an outline (section titles and planned block types) that you can approve or tweak.
- After approval, each section is generated separately and appended as a patch, validated, and saved as its own version.
- A reply cut off by the token limit is detected; only that section is retried, and saved sections are kept.
- A short page still comes back as one full JSON reply.
- The chat shows progress (for example, section 3 of 8).

```
RULES ABOVE.

MILESTONE 10: long pages by section.

- Add an outline step: for a long request, the AI returns an outline (section titles and planned block types) first. The UI shows it with Approve and Edit actions.
- After approval, generate one section per request. Each section is an "add" patch (M9) that appends blocks to the page. Validate after every section and save a version per section.
- Detect truncated replies (the provider's stop reason is the token limit, or the JSON is incomplete). Discard the partial section and retry only that section, up to 2 times. Never lose saved sections.
- Decide automatically between one full-JSON reply (short page) and the section flow (long outline). Put the rule for this in guide.md and keep the threshold in settings.
- Show progress in the chat (for example, "Section 3 of 8") and let the user stop the run.
```

## M11: Hardening and backups

**Goal:** App 1 is safe and cheap to run across 500-600 pages.

**Done when:**

- Each reply shows its tokens, and a per-page and total token count is visible.
- /api/chat is rate limited per user; errors show clear messages in the chat.
- A backup script copies the SQLite file and .env to a backup folder on the VPS on a schedule, keeping the last few copies.
- A final check confirms .env and the .db file are not tracked by git.
- A short README explains how to run, create a user, and restore a backup.

```
RULES ABOVE.

MILESTONE 11: hardening and backups.

- Token display: show tokens in and out for each reply, plus per-page and overall totals (from messages.tokens_in and tokens_out).
- Rate limit /api/chat per user. Make every backend error return a clear message that the chat UI shows.
- Add a backup script that copies the SQLite file and .env into a dated backup folder on the VPS, keeps the latest 7 copies, and can run from cron. Do not commit backups.
- Verify .env and *.db are in .gitignore and not tracked by git (git ls-files). Fix and report if they are.
- Add a short README: how to install, run, create a user, run backups and restore one.
- Do not change features built in earlier milestones.
```

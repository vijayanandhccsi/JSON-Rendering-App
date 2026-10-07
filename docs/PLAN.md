# App 1: CertKraft page preview app — full plan

Status: planning. Built first. Project 2 (LMS import and learner side) comes after and reuses App 1's shared package.

Related files: `DESIGN.md` (visual rules), `CLAUDE.md` (instructions for Claude Code), `DEPLOY.md` (VPS setup), `docs/rules.md` and `docs/guide.md` (the block rules the AI follows; these define the schema).

---

## 1. Purpose

A standalone web app where the author pastes or uploads a page's JSON on the left and sees the finished page on the right, exactly as a learner will see it. It validates the JSON against the block schema and lists every error by block. Only validated final JSON is later uploaded into the LMS.

The app exists to:
1. Catch bad JSON before it reaches the LMS.
2. Let the author check design and interactivity for 500 to 600 pages without logging into the LMS.
3. Produce the shared package (`@certkraft/blocks`) that the LMS will reuse, so the preview and the real pages can never drift apart.

## 2. Scope

**In scope**
- All 27 blocks from `docs/guide.md`, rendered with live interactivity.
- JSON editor with syntax highlighting and inline error markers.
- Validation with errors and warnings, listed by block.
- Device-width preview (mobile, tablet, desktop).
- Upload, paste, copy, format, and download of JSON.
- Image handling against a media folder, with placeholders for missing images.
- Image checklist built from `imageBriefs`.
- Block gallery route showing every block with sample data.
- Batch validation of many `.json` files at once.
- Deployment to the Bluehost VPS behind a password.

**Out of scope**
- Login, users, database, or any server code.
- Saving pages on a server.
- Mark as complete, progress bars, bookmarks, notes, Kira (all LMS features).
- Assessments, quizzes, flashcard decks.
- Editing the page visually (the JSON is the source).
- Dark mode (light mode only).

## 3. Workflow this app supports

```
AI writes JSON (guided by rules.md + guide.md)
        |
        v
Paste into preview app  -->  errors? --> send error list back to the AI --> repeat
        |
        v
Looks right?  -->  no --> tell the AI what to change --> repeat
        |
        v
Download validated JSON  -->  (Project 2) upload into the LMS import screen
```

Everything runs in the browser. Pasted JSON is never sent to a server.

## 4. Tech stack

| Area | Choice | Why |
| --- | --- | --- |
| Language | TypeScript (strict) | Types come straight from the schema. |
| Build | Vite | Matches the LMS (Vite + React). |
| UI | React (latest stable) | Same as the LMS. |
| Styling | Tailwind CSS v4 with `@theme` tokens | Same as the LMS, so styles carry over. |
| Schema and validation | Zod | One schema gives types, validation, and error paths. |
| Code editor | CodeMirror 6 | Light, JSON mode, inline lint markers. |
| Charts | Apache ECharts | Covers all 15 chart types (bar to Sankey, treemap, gauge, heatmap; Gantt via custom series). |
| Code highlighting | Shiki (light theme) | Accurate highlighting, no runtime eval. |
| Drag and drop | @dnd-kit | Keyboard and touch support built in. |
| Carousel | Embla | Small, accessible. |
| Icons | lucide-react (only) | The LMS rule: Lucide is the only icon library. |
| Inline text | Custom mini parser | Supports only `**bold**`, `*italic*`, `` `code` ``. Never raw HTML. |
| Tests | Vitest + Testing Library | Unit and component tests. |
| Package manager | pnpm workspaces | Shared package without publishing. |
| Lint and format | ESLint + Prettier | Consistency. |

Do not add other libraries without asking.

## 5. Repository structure

```
certkraft-pages/
  apps/
    preview/                 # the preview app (Vite + React)
      src/
        app/                 # shell: header, split view, panels
        editor/              # CodeMirror setup + lint bridge
        panels/              # errors, image checklist, batch validate
        routes/              # /  (editor), /gallery, /batch
  packages/
    blocks/                  # @certkraft/blocks  (shared with the LMS later)
      src/
        schema/              # Zod schemas, one file per block + page.ts
        validate/            # validatePage(), rule checks, error formatting
        blocks/              # one React component per block
        renderer/            # PageRenderer, nested block renderer
        text/                # inline text parser
        tokens.css           # design tokens (from DESIGN.md)
        index.ts             # public exports
  fixtures/
    pages/valid/             # one valid page per block + a full sample page
    pages/invalid/           # one invalid page per error rule
  docs/                      # rules.md, guide.md, PLAN.md, DESIGN.md, DEPLOY.md
  CLAUDE.md
  package.json, pnpm-workspace.yaml, tsconfig.base.json
```

## 6. The shared package: `@certkraft/blocks`

Public exports:
- `PageSchema` and per-block schemas, plus inferred TypeScript types.
- `validatePage(input: unknown): ValidationResult` returning `{ valid, errors[], warnings[] }`. Each item has `severity`, `blockIndex`, `path`, `message`, and a plain-English `fix` hint.
- `PageRenderer` component: `<PageRenderer page={page} mediaBaseUrl="/media/" />`.
- `tokens.css`.

Rules for the package:
- It contains no app-specific code and no network calls.
- It must run unchanged inside the LMS (React, Tailwind v4).
- `mediaBaseUrl` is a prop, so the LMS can point to its own media library later.
- Any schema change must also update `docs/guide.md` and `docs/rules.md`.

How Project 2 will consume it (decide then): workspace link, git dependency, or a private package. Keep the package self-contained so any of these works.

## 7. Preview app features

**Must have (v1)**
- Split view: JSON editor left, rendered page right, draggable divider.
- Editor: JSON highlighting, line numbers, inline error markers, Format button.
- Validation status chip: "Valid", or "N errors, M warnings".
- Error panel: each item shows block number, block type, message, and fix hint. Clicking an item jumps to that block in the editor.
- Paste, upload `.json`, copy JSON, download JSON (download only enabled when valid).
- Device width toggle: mobile (390 px), tablet (768 px), desktop (1280 px).
- Live interactivity for every block (flip, drag, slide, timer, and so on).
- Media base URL setting. Missing image shows a placeholder with the alt text and description.
- Load sample page and Clear.
- Remember the last JSON in the browser (localStorage) so a refresh does not lose work.

**Should have (v1.1)**
- Image checklist panel built from `imageBriefs`: file name, brief, found or missing in the media folder.
- Batch validate screen: drop many `.json` files, see a pass/fail table with errors per file.
- `/gallery` route: every block with sample data (also the dev environment for components).

**Later**
- Compare two versions of a page.
- Print-friendly view for review.

## 8. Validation spec

Errors block download. Warnings do not.

| Check | Severity |
| --- | --- |
| Not valid JSON (show line and column) | Error |
| Missing `chapter`, `title`, `summary`, or `blocks`; empty `blocks` | Error |
| `chapter` is not a lowercase hyphenated slug | Error |
| Unknown block `type` | Error |
| Unknown field on a block or page | Error |
| Missing required field, wrong type, or value not in the allowed list | Error |
| Heading level below 2 or above 4 | Error |
| Container inside a container, or disallowed child type in a container | Error |
| Text contains HTML tags | Error |
| Image `src` is a path or URL, or extension is not `.webp`, `.png`, `.gif` | Error |
| Image missing `alt` or `description` | Error |
| Image `src` not listed in `imageBriefs` | Warning |
| `imageBriefs` entry with no matching image in the page | Warning |
| Video `provider` is not `vimeo` | Error |
| Video `id` is not digits and not `"TBD"` | Error |
| Video `id` is `"TBD"` | Warning |
| `scenario` does not have exactly one `correct: true` | Error |
| `dragdrop` fields do not match its `mode` | Error |
| `hotspot` or label coordinates outside 0 to 100 | Error |
| `timer` in `countdown` mode without `seconds` | Error |
| Chart data does not match its `chartType` (series length, single-series types, heatmap size, unknown Sankey node, Gantt end before start) | Error |
| Chart missing `description` | Error |
| Paragraph over 80 words | Warning |
| Icon name not found in Lucide | Warning |
| `imageBriefs` missing or empty when images are used | Error |

Every error message must say what is wrong and how to fix it, in plain English, so it can be pasted straight back to the AI.

## 9. Definition of done for each block

A block is done only when all of these exist:
1. Zod schema with required fields and allowed values.
2. React component that follows `DESIGN.md`.
3. At least one valid fixture and one invalid fixture.
4. Unit tests for validation and a render test.
5. Entry in the `/gallery` route.
6. Matching section in `docs/guide.md` (update it if the schema changed).
7. Keyboard and screen-reader behavior checked (see `DESIGN.md`, Accessibility).

## 10. Milestones

Build in this order. Finish and verify each milestone before the next.

**M0. Setup**
- Create the repo, pnpm workspace, TypeScript, ESLint, Prettier, Vitest.
- Create `packages/blocks` and `apps/preview` with an empty page.
- Add `tokens.css`, Tailwind v4, and the Overused Grotesk font.
- Accept when: `pnpm dev`, `pnpm build`, `pnpm test`, `pnpm typecheck` all pass on the VPS.

**M1. Schema and validator**
- Zod schemas for the page and all 27 blocks, matching `docs/guide.md`.
- `validatePage()` with every rule in section 8 and plain-English messages.
- Fixtures: one valid page per block, one full sample page, one invalid page per rule.
- Accept when: all fixtures behave as expected in tests.

**M2. Renderer core and text blocks**
- `PageRenderer`, inline text parser, nested block renderer.
- Blocks: heading, paragraph, callout, quote, list (all four styles).
- Blocks: image (with placeholder), video (Vimeo embed with optional hash).
- Blocks: code (Shiki), terminal.
- Accept when: the sample page renders these blocks to `DESIGN.md` and passes accessibility checks.

**M3. Reveal, sequence, comparison, grid and layout**
- accordion, tabs, expandable, flipcard.
- timeline (vertical and horizontal scroll), carousel.
- comparison, smartsheet.
- grid, card, layout (bento, masonry, metro, modular).
- Accept when: all render correctly at mobile, tablet, and desktop widths.

**M4. Interactive blocks**
- hotspot, dragdrop (match, order, label), beforeafter, kanban, timer, scenario.
- Accept when: each works with mouse, touch, and keyboard, and shows clear feedback.

**M5. Charts**
- One `chart` block using ECharts for all 15 chart types, themed from tokens.
- Accept when: every chart type has a fixture and renders; invalid data shows a clear error, not a blank box.

**M6. Preview app shell**
- Split view, CodeMirror editor with lint markers, error panel, status chip.
- Paste, upload, copy, download, format, sample, clear, autosave.
- Device width toggle and media base URL setting.
- Accept when: the full author workflow in section 3 works end to end.

**M7. Image checklist, batch validate, gallery**
- Image checklist panel, `/batch` screen, `/gallery` route.
- Accept when: 20 files validated in one drop with a correct pass/fail table.

**M8. Deploy and hand-off**
- Deploy to the VPS following `DEPLOY.md`, behind a password.
- Write a short README: how to use the app and how Project 2 will import the package.
- Accept when: the live site works from a phone and a laptop, and `@certkraft/blocks` builds cleanly on its own.

## 11. Testing

- Unit tests for every validation rule (valid and invalid fixtures).
- Render tests for every block.
- Keyboard tests for the interactive blocks.
- A "full sample page" that uses every block, checked by eye at three widths before each milestone is closed.
- Optional later: Playwright for the paste, validate, render workflow.

## 12. Configuration

| Setting | Where | Default |
| --- | --- | --- |
| Media base URL | App settings (stored in localStorage), env `VITE_MEDIA_BASE_URL` | `/media/` |
| Media folder | `apps/preview/public/media/` | Put image files here for preview |

No secrets are needed. The app has no backend.

## 13. Risks and how to handle them

| Risk | Handling |
| --- | --- |
| Preview and LMS drift apart | One shared package; no copies of components. |
| Schema changes break old pages | Version the schema (`schemaVersion` later if needed); keep fixtures for every rule. |
| Too many blocks delay the first usable version | Build in the M2 to M5 order and test pages as you go. |
| Charts are the heaviest part | One ECharts wrapper with a small adapter per type; test each type with a fixture. |
| The AI invents fields | The validator rejects unknown fields and says so. |
| Public preview exposes unpublished lessons | Password protect the site and block search engines (see `DEPLOY.md`). |
| LMS styles differ from this app | `DESIGN.md` tokens come from the LMS `DESIGN.md`; the LMS file wins on any difference. |

## 14. Open decisions

1. Confirm that the tokens in `DESIGN.md` match the LMS `DESIGN.md`.
2. Subdomain for the preview app (for example `preview.certkraft.com`).
3. Where the media folder lives for preview: copied into the app, or fetched from the LMS media URL.
4. How Project 2 consumes the package (workspace, git dependency, or private package).

## 15. Kickoff prompts for Claude Code

Start every session with: "Read CLAUDE.md, PLAN.md, DESIGN.md, docs/rules.md and docs/guide.md first."

**M0:** "Do milestone M0 from PLAN.md. Set up the pnpm workspace with apps/preview and packages/blocks, Tailwind v4, tokens.css, Overused Grotesk, ESLint, Prettier, and Vitest. Show me the commands to run and confirm that dev, build, test, and typecheck pass."

**M1:** "Do milestone M1. Write the Zod schemas for the page and all 27 blocks from docs/guide.md, then validatePage() with every rule in PLAN.md section 8. Create fixtures and tests. Do not build any UI yet."

**M2 to M5:** "Do milestone M2 (or M3, M4, M5). Follow DESIGN.md. For each block follow the definition of done in PLAN.md section 9. Stop after the milestone and list what you built and anything you were unsure about."

**M6 to M8:** "Do milestone M6 (or M7, M8) following PLAN.md."

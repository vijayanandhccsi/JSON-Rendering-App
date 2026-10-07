# CertKraft page preview

A private tool for checking a reading page before it goes into the LMS. Paste or upload a page's JSON on the left, see the finished page on the right, and get every problem listed with a plain-English fix. Everything runs in your browser: the JSON is never sent to a server.

This repo also holds `@certkraft/blocks`, the package (schema, validator and page renderer) that the LMS will reuse later, so the preview and the real pages can never drift apart.

## How to use the app

The author workflow:

1. The AI writes the page JSON, guided by [docs/rules.md](docs/rules.md) and [docs/guide.md](docs/guide.md).
2. Paste it into the **Editor**. The status chip says **Valid**, or how many errors and warnings there are.
3. If there are problems, press **Copy problems** (under the editor) and paste them back to the AI. Repeat until valid.
4. Check the page at **mobile**, **tablet** and **desktop** width. Tell the AI what to change.
5. Check the **Images** panel: it lists every image the page needs and whether the file is in the media folder.
6. **Download** the validated JSON (the button works only when there are no errors). Later this is uploaded into the LMS.

### The three pages

| Page           | Address    | What it is for                                                                                                                                                       |
| -------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Editor         | `/`        | One page at a time: JSON editor, problem list, image checklist and live preview.                                                                                     |
| Batch validate | `/batch`   | Drop many `.json` files, or a whole folder, and get a pass/fail table with the problems for each file. Can copy a report for the AI and open any file in the editor. |
| Gallery        | `/gallery` | Every block and variant with sample data, and the JSON for each. Use it to see what is possible and to check a component.                                            |

### Editor tips

- **Problems:** click a row to jump to the exact spot in the JSON. Errors block download; warnings do not.
- **Header buttons:** Paste, Upload, Copy, Download, Format, Sample and Clear. Paste, Clear and Format can be undone with Ctrl+Z (Cmd+Z) in the editor.
- **While there are errors,** the preview keeps showing the last valid version, with a notice.
- **Media folder:** image file names in the JSON are looked up under this address (default `/media/`). Change it with the **Media folder** button. For local previews put the files in `apps/preview/public/media/`.
- **Autosave:** the last JSON is kept in this browser (localStorage) so a refresh does not lose work. It is not stored anywhere else.
- **Small screens:** below 1024 px the editor and preview become two tabs.

## Running it

You need Node 22 and pnpm 10 (`corepack enable` sets up pnpm).

```
pnpm install
pnpm dev            # the app, at http://localhost:5173
pnpm build          # production build of the app and the package
pnpm test           # all tests
pnpm typecheck
pnpm lint
```

Two more, for maintainers:

```
pnpm gen:icons                                   # after changing the icon set (see below)
pnpm --filter @certkraft/blocks verify:package   # proves the package works in a fresh project (needs internet)
```

## What is where

```
apps/preview/          the app: editor, panels, Batch validate, Gallery
packages/blocks/       @certkraft/blocks: schema, validator, block components, renderer, design tokens
fixtures/pages/        valid pages (one per block and variant, plus a full sample) and invalid pages (one per rule)
deploy/, deploy.sh     the Nginx site config and the deploy script
docs/                  PLAN.md, DESIGN.md, DEPLOY.md, rules.md, guide.md
CLAUDE.md              instructions for Claude Code
```

## The rules for the AI, and changing them

`docs/rules.md` and `docs/guide.md` are what you give the AI. The schema in `packages/blocks/src/schema/` must match them. If you change a schema, update both files in the same change. Tests keep fixtures and rules in step.

**Icons** come from a curated set of about 150 (the list is in `guide.md`, section 6). To add one, add its Lucide name to `packages/blocks/scripts/icon-set.mjs`, then run `pnpm gen:icons`. That regenerates the code and the list in `guide.md`.

**Design** values live in one place: `packages/blocks/src/tokens.css` (see `docs/DESIGN.md`). If the LMS design file differs, the LMS file wins.

## Deploying

Follow [docs/DEPLOY.md](docs/DEPLOY.md). In short: build the app, serve the files with Nginx over HTTPS (the app has no sign-in), and run `./deploy.sh` on the server after each change. `deploy/nginx-preview.conf` is the site config, and a test keeps it identical to the one in `DEPLOY.md`. Image files for previewing go in `/var/www/preview/media/` on the server.

## Reusing the blocks in the LMS (Project 2)

The LMS imports `@certkraft/blocks` and uses the same `PageRenderer` and `validatePage`. How to install it, the Tailwind setup and the lazy loading are in [packages/blocks/README.md](packages/blocks/README.md).

## Status

All milestones M0 to M7 are built and tested. M8 (this hand-off) added the deploy files, the package build and these READMEs. The live deployment on the server is a step for the server owner: see `docs/DEPLOY.md`.

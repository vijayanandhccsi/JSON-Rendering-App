# @certkraft/blocks

The shared package behind the CertKraft page preview, meant to be reused by the LMS. It has three parts:

- **Schema:** Zod schemas for a page and all 27 blocks (`PageSchema`, `BlockSchema` and one schema per block), with TypeScript types.
- **Validator:** `validatePage(input)` and `validateJsonText(text)`. Every problem comes with a plain-English message and a fix. `formatIssues(result)` turns a result into text to paste back to an AI.
- **Renderer:** `<PageRenderer page={page} mediaBaseUrl="/media/" />` draws a page as a learner sees it, with all blocks interactive.

It has no app-specific code and makes no network calls (image files are requested by the browser from `mediaBaseUrl`).

## Using it

```tsx
import { PageRenderer, PageSchema, validatePage } from "@certkraft/blocks";

const result = validatePage(json); // { valid, errors[], warnings[] }
if (result.valid) {
  const page = PageSchema.parse(json);
  return <PageRenderer page={page} mediaBaseUrl="https://lms.example.com/media/" />;
}
```

Other exports: `validateJsonText`, `formatIssues`, `BlockRenderer`, `NestedBlocks`, `isWideBlock`, `MediaProvider`, `mediaUrl`, `InlineText`, `parseInline`, and the block and chart type lists (`BLOCK_TYPES`, `CHART_TYPES`).

The page language (`lang="en"`) is set on the page. The renderer does not draw a "Mark as complete" button, progress or navigation: those belong to the LMS player. Wrap the page in your player's `<main>`.

## Setting up a project that uses it

Requirements: React 19 and Tailwind CSS v4. `react` and `react-dom` are peer dependencies; everything else installs with the package.

In the project's main stylesheet:

```css
@import "tailwindcss";
@import "@certkraft/blocks/tokens.css";
@source "../node_modules/@certkraft/blocks/dist";
```

- `tokens.css` holds the design tokens (colors, fonts, spacing) and loads the fonts. Do not copy its values elsewhere.
- `@source` tells Tailwind to look for the class names the blocks use. Without it the blocks have no styling. (Inside this repo the app points at `packages/blocks/src` instead.)

## Getting it into the LMS

Three ways. Pick one when Project 2 starts.

| Way                                | How                                                                                                                                                                | Status                                                                                                                           |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| **Tarball** (recommended to start) | `pnpm --filter @certkraft/blocks pack` makes `certkraft-blocks-<version>.tgz`. Install that file in the LMS: `pnpm add ./certkraft-blocks-0.1.0.tgz`.              | Tested by `pnpm verify:package`: it installs the tarball into a brand-new Vite + Tailwind project, type-checks it and builds it. |
| **Workspace**                      | Add this repo's `packages/blocks` to the LMS monorepo's workspace. Inside a workspace the package points at its TypeScript source, so the LMS bundler compiles it. | Works the same way the preview app uses it.                                                                                      |
| **Private registry**               | Remove `"private": true` from `package.json`, then `pnpm publish` to your registry.                                                                                | Not tried.                                                                                                                       |

A git dependency on this repo has not been tried; because the package lives in a subfolder of a monorepo, use one of the ways above.

When the package is packed, `publishConfig` swaps its entry points from the source to the built files in `dist/` (JavaScript, type declarations, `tokens.css` and the fonts). Build it yourself with `pnpm build` in this folder.

## Loading and size

A page that does not use a feature does not download it:

- **ECharts** (about 240 kB gzipped) loads only when a page has a chart.
- **Shiki** and each code language load only when a page has a code block that needs them.
- The data check for charts (it uses Zod) loads together with ECharts.

The interactive blocks (drag and drop, carousel) are included in the main code today. If the LMS needs a smaller first load, they can be loaded on demand the same way; measure first.

## Keeping it in step

- The schema in `src/schema/` must match `docs/guide.md` and `docs/rules.md`. Change all of them together.
- Icons: the allowed set is in `scripts/icon-set.mjs`. After editing it, or after upgrading `lucide-react`, run `pnpm gen:icons`. A test fails if the generated files or the list in `guide.md` are out of date.
- Design values live only in `src/tokens.css`. Charts read the `--chart-*` variables from it.

## Scripts

| Command               | What it does                                                                            |
| --------------------- | --------------------------------------------------------------------------------------- |
| `pnpm build`          | Builds `dist/`.                                                                         |
| `pnpm test`           | Runs the tests (validation rules, every block, keyboard use, accessibility with axe).   |
| `pnpm typecheck`      | Type-checks the source and the tests.                                                   |
| `pnpm gen:icons`      | Regenerates the icon files and the icon list in `guide.md`.                             |
| `pnpm verify:package` | Packs the package and builds it into a fresh project outside this repo. Needs internet. |

# CLAUDE.md: instructions for Claude Code

## Project

You are building **App 1: the CertKraft page preview app**, plus the shared package `@certkraft/blocks` that the LMS will reuse later (Project 2). The app renders reading-page JSON and validates it. It is a static, client-side app with no backend.

## Read these first, every session

1. `docs/PLAN.md`: scope, milestones, validation spec, definition of done.
2. `docs/DESIGN.md`: all visual rules and design tokens.
3. `docs/rules.md` and `docs/guide.md`: the block rules and exact JSON for all 27 blocks. These define the schema and are the source of truth.
4. `docs/DEPLOY.md`: only when working on deployment.

If these files disagree, stop and ask me which one is right. Do not guess.

## Stack

TypeScript (strict), Vite, React, Tailwind CSS v4, Zod, CodeMirror 6, Apache ECharts, Shiki, @dnd-kit, Embla, lucide-react, Vitest + Testing Library, pnpm workspaces, ESLint, Prettier.

Do not add any other dependency without asking me first and explaining why.

## Commands

```
pnpm install
pnpm dev            # run the preview app
pnpm build          # production build
pnpm test           # unit and component tests
pnpm typecheck
pnpm lint
```

Run `pnpm typecheck`, `pnpm lint`, and `pnpm test` before telling me a task is done.

## Structure

- `packages/blocks/`: schema, validator, block components, renderer, tokens. No app-specific code, no network calls.
- `apps/preview/`: the preview app shell, editor, panels, and routes.
- `fixtures/pages/`: valid and invalid JSON pages used by tests and the gallery.
- `docs/`: the planning and rule files above.

## Working rules

1. Work on **one milestone at a time**, in the order in `PLAN.md`. Stop at the end of each milestone and give me a short summary: what you built, how to check it, and anything you were unsure about.
2. For every block, meet the definition of done in `PLAN.md` section 9 (schema, component, fixtures, tests, gallery entry, guide.md section, accessibility).
3. The schema lives in `packages/blocks/src/schema/`, one file per block. If you change a schema, update `docs/guide.md` and `docs/rules.md` in the same change.
4. Validation messages must say what is wrong and how to fix it, in plain English, so they can be pasted back to an AI.
5. Make small, focused commits with clear messages.
6. If something in the plan is unclear or two options are reasonable, ask me instead of choosing silently.

## Code rules

- Use design tokens only. No hard-coded colors, font sizes, spacing, or radii outside `tokens.css`.
- Lucide is the only icon library. No emoji as icons.
- Never use `dangerouslySetInnerHTML`. Inline text goes through the mini parser that supports only `**bold**`, `*italic*`, and `` `code` ``.
- No `any`. Prefer types inferred from the Zod schemas.
- Components in `packages/blocks` must not import from `apps/preview`.
- Keep components small and in one file per block.
- All interactive blocks must work with keyboard and touch, and respect `prefers-reduced-motion`.
- Do not store or send the author's JSON anywhere except the browser's localStorage for autosave.

## Out of scope (do not build)

Login, a database, server code, Mark as complete, progress tracking, Kira, assessments, dark mode.

## When finished with a milestone

Report in this format:
- **Built:** a short list.
- **How to check:** the commands or pages to open.
- **Open questions:** anything uncertain.

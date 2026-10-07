# Rules for generating CertKraft reading-page JSON

You are generating ONE reading page as JSON for the CertKraft LMS. Follow every rule below exactly. The full block reference is in `guide.md`. Read both files before you write anything.

## 1. Output

1. Return a single JSON object in a single code block. Write nothing before or after it.
2. The JSON must be valid: double quotes only, no trailing commas, no comments, no line breaks inside strings (use `\n` only inside `code` and `terminal` text).
3. The top-level fields are exactly: `chapter`, `title`, `summary`, `blocks`. Optional: `estimatedMinutes`, `imageBriefs`, `authorNotes`.

## 2. Allowed blocks only

4. Use ONLY these 27 block types: `heading`, `paragraph`, `callout`, `quote`, `list`, `image`, `video`, `code`, `terminal`, `accordion`, `tabs`, `expandable`, `flipcard`, `timeline`, `carousel`, `hotspot`, `dragdrop`, `beforeafter`, `kanban`, `timer`, `comparison`, `scenario`, `smartsheet`, `grid`, `card`, `layout`, `chart`.
5. Use ONLY the fields and allowed values shown in `guide.md` for each block. Never invent block types, fields, variants, modes, or values.
6. If you need something no block provides, use the closest available block and add one line to `authorNotes`. Never work around the list.
7. Never output HTML, CSS, JavaScript, Markdown headings, Markdown tables, or Markdown image syntax.

## 3. Text

8. Text is plain text. The only inline formatting allowed is `**bold**`, `*italic*`, and `` `code` ``.
9. Use sentence case for headings. No emoji.
10. The page title goes in `title`. Heading blocks start at level 2.
11. Keep each paragraph to 80 words or fewer.

## 4. Nesting

12. Only `accordion`, `tabs`, and `expandable` can contain other blocks.
13. Nested blocks may only be: `paragraph`, `list`, `callout`, `quote`, `code`, `terminal`, `image`, `smartsheet`.
14. Never put a container inside a container.

## 5. Media

15. Images: use a file name only, never a URL. Lowercase letters, digits, and hyphens, ending in `.webp` (preferred), `.png`, or `.gif`.
16. Every image (including images inside `carousel`, `hotspot`, `beforeafter`, and `dragdrop` label mode) must have `alt` and `description`. The description says what the image shows in 1 to 3 sentences. The LMS AI mentor reads this text, because it cannot read pixels.
17. List every image file you use in `imageBriefs` with a short brief for the person who will create it.
18. Flowcharts, network topologies, mind maps, pyramids, funnels, and labeled diagrams are images. Do not try to draw them in JSON.
19. Video: `provider` is always `"vimeo"` and `id` is the Vimeo video ID only. Add `hash` only if the author gave one (the extra code at the end of an unlisted Vimeo link). If no ID was given, use `"TBD"` and add a line to `authorNotes`. Never use URLs.

## 6. Design

20. Never specify colors, fonts, pixel sizes, or CSS. Use only the variants listed in the guide.
21. Icons: use ONLY icons from the allowed icon list in `guide.md` section 6, written in kebab-case, for example `shield-check`, `server`, `network`, `lock`. If no icon on the list fits, leave the optional `icon` field out. Never use an icon that is not on the list.

## 7. Content

22. Follow the supplied source material. Do not invent facts, ports, versions, prices, commands, or exam details. If you are not sure, leave it out.
23. Chart numbers must come from the source material. If they are examples you made up, set the chart `note` to `"Illustrative values"`.
24. Do not write multiple-choice quizzes, knowledge checks, or flashcard decks. The LMS handles assessments separately. The practice blocks `scenario`, `dragdrop`, and `flipcard` are allowed.
25. Do not add a Mark as complete button, progress bar, bookmarks, or notes. The LMS player provides them.

## 8. Self-check before you answer

Check each item, then output the JSON:

1. Is it valid JSON?
2. Does every block have a `type` from the list in rule 4?
3. Does every block have all its required fields and only allowed values?
4. Does every image have `alt` and `description`, and is it listed in `imageBriefs`?
5. Are there any containers inside containers?
6. Is every icon name on the allowed list in `guide.md` section 6?
7. Did I invent any facts, fields, or values?

# DESIGN.md: visual rules for the CertKraft page preview app and block library

This file is the single source of truth for how blocks and the preview app look. Claude Code must follow it for every UI decision.

**Important:** these tokens come from the CertKraft LMS brand. If the LMS project's own `DESIGN.md` differs from this file, the LMS file wins. Copy any changed values into `packages/blocks/src/tokens.css` and nowhere else.

---

## 1. Principles

1. **Match the LMS.** Pages must look like they belong in the learner player.
2. **Light mode only.** No dark theme.
3. **Calm and readable.** Warm cream background, white cards, one strong accent color, generous spacing.
4. **Tokens only.** No hard-coded colors, font sizes, spacing, or radii in components. Everything comes from `tokens.css`.
5. **Lucide is the only icon library.** No emoji as icons.
6. **Flat.** Thin borders and very light shadows. No gradients, glows, or heavy effects.

## 2. Design tokens

Define these in `packages/blocks/src/tokens.css` using Tailwind v4 `@theme` so utilities such as `bg-surface` and `text-ink` exist.

### Color

| Token | Value | Use |
| --- | --- | --- |
| `--color-primary` | `#E8570A` (burnt orange) | Brand accent for **non-text** use: borders, focus ring, active underlines, dots, icons, large headings (24 px or bigger), decorative fills |
| `--color-primary-strong` | `#C2410C` | Links, small text, and fills that carry white text (primary buttons, numbered circles, `primary` layout tiles) |
| `--color-primary-strong-hover` | `#A83A0A` | Hover state for `primary-strong` |
| `--color-primary-tint` | `#FDEBDD` | Tinted backgrounds for primary (proposed) |
| `--color-bg` | `#FAF9F5` (warm cream) | Page background |
| `--color-surface` | `#FFFFFF` | Cards, panels, editor |
| `--color-border` | `#E6E2D8` | Hairlines and card borders (proposed) |
| `--color-ink` | `#07111F` (navy) | Headings and body text |
| `--color-ink-muted` | `#5B6470` | Secondary text, captions (proposed) |
| `--color-success` | `#00A86B` (emerald) | Brand accent for **non-text** use: borders, large icons, chart fills, decorative fills |
| `--color-success-strong` | `#047857` | Success text, small icons, and fills that carry white text (`accent` layout tiles) |
| `--color-success-tint` | `#E1F6EC` | Success backgrounds (proposed) |
| `--color-info-tint` | `#E8EDF4` | Info callouts (proposed) |
| `--color-warning` | `#B45309` | Warning text and icon (proposed) |
| `--color-warning-tint` | `#FEF3C7` | Warning backgrounds (proposed) |
| `--color-danger` | `#B42318` | Errors, wrong answers (proposed) |
| `--color-danger-tint` | `#FDECEA` | Danger backgrounds (proposed) |

Values marked "proposed" are not in the brand and must be confirmed against the LMS `DESIGN.md`. The two `-strong` tokens are an accessibility decision: if the LMS buttons use `#E8570A` with white text, match the LMS only if the LMS file says so; otherwise follow this file. The LMS file wins on any difference.

Contrast: all text and icon colors must meet WCAG AA (4.5:1 for body text, 3:1 for large text and UI components) on their background. If a proposed value fails, darken it.

**Checked contrast ratios** (re-check when any token changes):

| Foreground on background | Ratio | Use it for |
| --- | --- | --- |
| `primary` on white | 3.6 | UI parts only (borders, underlines, dots, icons, focus ring). Never body text. |
| `primary` on cream | 3.4 | Same as above. |
| `success` on white | 3.1 | UI parts and large icons only. Never text. |
| `primary-strong` on white | 5.2 | Links and small text. |
| `primary-strong` on cream | 4.9 | Links and small text. |
| White on `primary-strong` | 5.2 | Buttons, numbered circles, `primary` tiles. |
| White on `primary-strong-hover` | 6.4 | Button hover. |
| `primary-strong` on `primary-tint` | 4.5 (4.46) | Icons only. Use `ink` for text on the tint. |
| `success-strong` on white | 5.5 | Success text and icons. |
| White on `success-strong` | 5.5 | `accent` tiles. |
| `success-strong` on `success-tint` | 4.9 | Success text and icons. |
| `warning` on `warning-tint` | 4.5 (4.51) | Warning text. This is right at the limit: do not lighten it. |
| `warning` on white | 5.0 | Warning text. |
| `danger` on `danger-tint` | 5.8 | Danger text. |
| `danger` on white | 6.6 | Danger text. |
| `ink-muted` on white | 6.0 | Captions and secondary text. |
| `ink-muted` on cream | 5.7 | Captions and secondary text. |
| `ink` on any tint | 16 or more | Any text. |
| White on navy `ink` | 18.9 | `secondary` tiles. |

**Rule of thumb:** if a color is text, or sits behind white text, use a `-strong` token or `ink`. If it is a border, dot, underline or icon, the brand color is fine.

### Typography

| Token | Value |
| --- | --- |
| `--font-sans` | `"Overused Grotesk", system-ui, sans-serif` (self-hosted woff2) |
| `--font-mono` | `"DM Mono", ui-monospace, "SF Mono", Menlo, monospace` (self-hosted woff2, weight 400 only, latin subset) |

| Style | Size / line height | Weight |
| --- | --- | --- |
| Page title | 36 / 44 px | 600 |
| Heading level 2 | 28 / 36 px | 600 |
| Heading level 3 | 22 / 30 px | 600 |
| Heading level 4 | 18 / 26 px | 600 |
| Body | 16 / 26 px | 400 |
| Small | 14 / 22 px | 400 |
| Caption | 13 / 20 px | 400 |
| Code | 14 / 22 px | 400 |

Use only weights 400, 500, 600 for the sans font. The mono font has weight 400 only, so never apply bold or medium to it. Body text line length: maximum 72 characters (about 720 px).

### Spacing, shape, motion

| Token | Value |
| --- | --- |
| Spacing unit | 4 px. Use multiples: 4, 8, 12, 16, 24, 32, 40, 48 |
| Gap between blocks | 24 px |
| Space above a level 2 heading | 40 px; level 3: 32 px |
| Reading column width | 720 px |
| Wide column width | 960 px (charts, layout, carousel, comparison, full-size images) |
| Radius: card | 12 px |
| Radius: control | 8 px |
| Radius: pill and badge | 999 px |
| Border | 1 px solid `--color-border` |
| Shadow | none by default; `0 1px 2px rgb(7 17 31 / 0.06)` for raised cards only |
| Motion | 150 to 200 ms, ease-out. Flip card 400 ms. |
| Focus ring | 2 px `--color-primary`, 2 px offset, on every interactive element |

Respect `prefers-reduced-motion`: replace flips, slides, and fades with instant changes.

## 3. Layout and responsiveness

- Breakpoints: mobile under 640 px, tablet 640 to 1023 px, desktop 1024 px and up.
- The page is a centered column. Wide blocks may extend to the wide width. On mobile everything is full width with 16 px side padding.
- Multi-column blocks (grid, comparison, layout, kanban) collapse to one column on mobile, or scroll horizontally where order matters (kanban, horizontal timeline).
- Tables scroll horizontally inside their own container on small screens. Never let the page scroll sideways.
- Touch targets are at least 44 by 44 px.

## 4. Block visual specs

Keep every block inside the tokens above. "Card" means: surface background, 1 px border, 12 px radius, 20 px padding.

### Page header
The page title uses the page title style. When the page has `estimatedMinutes`, a caption-style muted line under the title reads "N min read". The `summary` and `chapter` are never shown to learners; the preview app shows them in its own panel (section 7).

### Text
| Block | Look |
| --- | --- |
| heading | Ink color, weight 600, spacing above per section 2. No underline or icon. |
| paragraph | Body style, ink color. Inline `**bold**`, `*italic*`, `` `code` `` (code: mono, tint background `--color-bg`, 4 px radius, 2 px by 6 px padding). |
| callout | Left-aligned icon plus optional bold title plus text, 12 px radius, tinted background and matching icon color: `info` navy tint, `tip` primary tint with a `primary-strong` icon, `warning` amber tint, `danger` red tint, `success` emerald tint with a `success-strong` icon. Callout text is always `ink`. Icons: info, lightbulb, triangle-alert, octagon-alert, circle-check. |
| quote | Large muted quote mark (Lucide `quote`), text in 18 px, source in caption style. 3 px primary left border. |
| list | Bulleted: primary-colored dots. Numbered: white numbers in `primary-strong` circles. Checklist: Lucide `square-check` icons. Icon list: Lucide icon in `primary-strong` inside a 36 px primary-tint circle on the left or right of the text per `iconPosition`. |

### Media
| Block | Look |
| --- | --- |
| image | Rounded 12 px, 1 px border, caption below in caption style. Sizes: small 320 px, medium 560 px, full wide width. Missing file shows a placeholder card with an image icon, the alt text, and the description. |
| video | 16:9 Vimeo iframe, 12 px radius, title as accessible name, caption below. No autoplay. |

### Code
| Block | Look |
| --- | --- |
| code | Surface card, mono font, Shiki light theme, optional title bar with language label, copy button (Lucide `copy`), horizontal scroll for long lines. |
| terminal | Same frame as code, with a title bar of three small neutral dots. Commands start with a `$` prompt in `primary-strong`. Output lines in muted ink. Copy button copies commands only. |

### Reveal
| Block | Look |
| --- | --- |
| accordion | Stacked rows separated by borders, title weight 500, chevron icon rotates on open. Several panels may be open. |
| tabs | Underlined tab bar, active tab has a 2 px primary underline and ink text. Arrow keys switch tabs. |
| expandable | One bordered panel with a "deeper" icon (Lucide `book-open`), title, and chevron. Primary tint header. |
| flipcard | Cards in a responsive grid (min 220 px). Front: large centered term on surface. Back: primary-tint background with the definition. Click, tap, Enter, or Space flips. Provide a "flip" hint icon. |

### Sequence
| Block | Look |
| --- | --- |
| timeline | Vertical: line on the left with white numbers in `primary-strong` dots, label as small muted text, title in weight 500. Horizontal: same as cards in a row that scrolls left to right with scroll snap and a visible scroll hint. |
| carousel | Embla slider, one slide at a time, previous and next buttons (Lucide `chevron-left`, `chevron-right`), dot indicators, swipe on touch, slide counter "2 / 5" for screen readers. |

### Interactive
| Block | Look |
| --- | --- |
| hotspot | Image with white numbers in `primary-strong` pulse dots (static when reduced motion). Clicking opens a popover card with title and text. Dots are focusable buttons. |
| dragdrop | Draggable chips (surface, border, 8 px radius, grip icon). Drop targets are dashed borders. Correct placement turns emerald (`success` border, `success-strong` text and check icon), wrong turns red (`danger`, with an x icon) with a shake (none for reduced motion). A "Check" and a "Reset" button. Keyboard and click-to-place alternatives are required. |
| beforeafter | Two images with a draggable vertical handle (circle with left-right arrows). Labels as pills in the top corners. Range input for keyboard control. |
| kanban | Columns as cards on a cream background, column title with a count pill, cards as small surface tiles. Static display. |
| timer | Large mono digits in a card, circular progress ring in primary, Start, Pause, and Reset buttons. Countdown ends with the `message` in `ink` on a success tint, with a check icon. |

### Comparison and reference
| Block | Look |
| --- | --- |
| comparison | Two columns, a vs divider pill in the middle on desktop, stacked on mobile. Left title in navy tint header, right title in primary tint header. Points with check-style bullets. |
| scenario | Card with a "Scenario" pill, situation text, bold question, options as selectable cards. After choosing, show feedback with emerald or red tint, an icon, and `success-strong` or `danger` text. One attempt shown, then "Try again". |
| smartsheet | Table with a header row on a cream background, 1 px row borders, mono font for first column when values look like commands or ports, optional title with a Lucide `table-2` icon. Sticky first column on mobile. |

### Grid and layout
| Block | Look |
| --- | --- |
| grid | 2, 3, or 4 columns of cards. Feature variant: `primary-strong` icon in a primary-tint circle, bold title, text. Comparison variant: same cards with an optional badge pill. |
| card | Single card with optional icon, title, text. `highlight` variant has a 2 px primary border and primary-tint background. |
| layout | Variant `bento`: asymmetric grid with one large tile. `masonry`: tiles in columns with natural heights. `metro`: flat colored rectangular tiles, no radius larger than 4 px, bold titles. `modular`: 12-column grid mixing wide, tall, large, and small tiles. Tone: `default` white, `primary` solid `primary-strong` with white text, `secondary` navy with white text, `accent` solid `success-strong` with white text. All three pass AA with white text (5.2, 18.9, 5.5). |

### Chart
| Block | Look |
| --- | --- |
| chart | Card with title, optional note in caption style ("Illustrative values"), chart area, and a visually hidden data table or description for screen readers. ECharts theme built from tokens: primary, navy, emerald (the brand colors; chart fills are not text, and labels and legends stay `ink`), then tints; thin gridlines in `--color-border`; no 3D, no heavy shadows. Always label axes and units when given. |

## 5. Icons

- Library: `lucide-react`. Size 20 px by default, 16 px inline, 24 px in headings of cards. Stroke width 1.75.
- Icons used for meaning (error, success) must also have text or an accessible label.
- Pages may only use icons from a curated set of about 150 (the list is in `guide.md` section 6, generated by `pnpm gen:icons` from `packages/blocks/scripts/icon-set.mjs`). The set is bundled statically in one chunk, so deploys stay small.
- An icon outside the set is a validation **error**, with a message telling the author to choose from the list. If one ever reaches the renderer, it shows Lucide `circle`.
- Adding an icon is a one-line change to `icon-set.mjs`, then `pnpm gen:icons`.

## 6. Accessibility (required)

- WCAG 2.2 AA.
- Every interactive element is reachable and operable by keyboard, with a visible focus ring.
- Interactive blocks use correct roles: accordion (button with `aria-expanded`), tabs (`tablist`, `tab`, `tabpanel`), carousel (region with roving controls), timer (`role="timer"`), dialogs and popovers (focus returns to the trigger).
- Images use `alt`; the long `description` is available to screen readers (for example via `aria-describedby`).
- Colors never carry meaning alone: correct and wrong answers also show icons and text.
- Drag and drop must work with keyboard (dnd-kit sensors) and have a click-to-place fallback.
- Respect `prefers-reduced-motion`.
- Language attribute set to `en` on the page.

## 7. Preview app chrome (not part of the learner page)

The app around the page is neutral so the page stays the focus.

- **Header (56 px):** app name "CertKraft page preview" on the left; actions on the right: Paste, Upload, Copy, Download, Format, Sample, Clear. Primary button style (`primary-strong` fill, white text, `primary-strong-hover` on hover) only for Download.
- **Toolbar under the header:** status chip (`success-strong` text on success tint with a check icon for "Valid", `danger` text on danger tint with an icon for "N errors, M warnings"), device width toggle (mobile, tablet, desktop as a segmented control), media base URL button.
- **Split view:** editor left, preview right, 8 px draggable divider. The preview sits on the cream background and shows the page in a centered white device frame at the chosen width. The editor uses a light theme with mono font.
- **Error panel:** collapsible panel under the editor. Rows: severity icon, block number and type, message, fix hint. Clicking a row selects that block in the editor.
- **Page info panel:** a small card above the device frame, outside the page, showing the chapter, summary, estimated minutes and author notes, so the author can review them. Not part of the learner page.
- **Empty state:** short instruction text and a "Load sample page" button.
- **Responsive:** below 1024 px the split view becomes two tabs: JSON and Preview.
- Copy for buttons and messages: sentence case, verb first, no exclamation marks.

## 8. Do and do not

| Do | Do not |
| --- | --- |
| Use tokens from `tokens.css` | Hard-code hex values, px sizes, or font names in components |
| Use Lucide icons | Use emoji, other icon sets, or inline SVG icons |
| Keep backgrounds cream and cards white | Add dark mode, gradients, or glow effects |
| Use one primary accent per view | Use several bright colors for decoration |
| Use `primary-strong` and `success-strong` for text and for fills with white text | Put white text on `primary` or `success`, or use them for small text |
| Use mono at weight 400 | Bold or medium the mono font |
| Show clear feedback text with colors | Rely on color alone |
| Test at 390, 768, and 1280 px | Assume desktop only |

# Guide: CertKraft reading-page blocks

This guide lists every block you may use and the exact JSON for each. Read `rules.md` first. If a block is not in this guide, you may not use it.

## 1. Page structure

```json
{
  "chapter": "chapter-slug",
  "title": "Page title",
  "summary": "One or two sentences saying what the learner will understand after this page.",
  "estimatedMinutes": 8,
  "blocks": [],
  "imageBriefs": [
    { "file": "example-diagram.webp", "brief": "What the image should show, for the designer." }
  ],
  "authorNotes": ["Optional notes for the page author."]
}
```

| Field | Required | Notes |
| --- | --- | --- |
| `chapter` | yes | The chapter slug the page belongs to. Lowercase, hyphens. |
| `title` | yes | Page title. Sentence case. |
| `summary` | yes | 1 to 2 sentences. The LMS AI mentor uses it to find the page. |
| `blocks` | yes | The page content, top to bottom. |
| `estimatedMinutes` | no | Whole number. |
| `imageBriefs` | no, but required if any image is used | One entry per image file. |
| `authorNotes` | no | Short notes for the human author, for example a missing video ID. |

## 2. Rules that apply to every block

- Every block has a `"type"`.
- Text fields are plain text. Inline formatting allowed: `**bold**`, `*italic*`, `` `code` ``.
- An **image object** (used in several blocks) always has this shape: `{ "src": "file-name.webp", "alt": "Short label", "description": "What the image shows, 1 to 3 sentences." }`.
- Positions `x` and `y` are numbers from 0 to 100, measured as a percentage from the top-left of the image.
- Icons must come from the allowed icon list in section 6, written in kebab-case, for example `shield-check`. Any other icon name is an error.

## 3. Writing guidance

- **Page flow:** a short intro paragraph, then sections with `heading` blocks (level 2, then level 3 inside). End with a `heading` named "Key takeaways" followed by a `list` with `"style": "checklist"` or `"numbered"`.
- **One idea per block.** Do not stack more than three text blocks in a row. Break them up with a callout, list, image, or interactive block.
- **Use interactive blocks after the concept is explained,** not before. Good pairs: `flipcard` for terms, `dragdrop` for matching or ordering, `scenario` for decisions, `hotspot` for diagrams.
- **Put real teaching in text.** Do not put a concept only inside an image. The LMS AI mentor answers from text and image descriptions.
- **Choose the right block:**

| You want to... | Use |
| --- | --- |
| Explain steps in order | `timeline` (vertical) or `list` with `"style": "numbered"` |
| Show a long process left to right | `timeline` with `"orientation": "horizontal"` |
| Compare two things | `comparison` |
| Compare many features | `grid` or `smartsheet` |
| Give a quick reference of commands, ports, protocols | `smartsheet` |
| Hide extra detail | `accordion`, `tabs`, or `expandable` |
| Teach terms | `flipcard` |
| Practice a decision | `scenario` |
| Show numbers | `chart` |
| Show a diagram, topology, flowchart, mind map, pyramid, funnel | `image` |

## 4. Block reference

### Text blocks

#### heading
Required: `level` (2, 3, or 4), `text`.
```json
{ "type": "heading", "level": 2, "text": "What is a firewall?" }
```

#### paragraph
Required: `text`.
```json
{ "type": "paragraph", "text": "A **firewall** filters network traffic using rules." }
```

#### callout
Required: `variant` (`info`, `tip`, `warning`, `danger`, `success`), `text`. Optional: `title`.
```json
{ "type": "callout", "variant": "tip", "title": "Exam tip", "text": "A stateful firewall tracks the state of connections." }
```

#### quote
Required: `text`. Optional: `source`.
```json
{ "type": "quote", "text": "Security is a process, not a product.", "source": "Bruce Schneier" }
```

#### list
Required: `style` (`bulleted`, `numbered`, `checklist`, `icon`), `items`. Optional: `iconPosition` (`left` or `right`, only for `icon`, default `left`).
- For `bulleted`, `numbered`, and `checklist`, each item is a string.
- For `icon`, each item is an object with `text` and `icon`.
```json
{ "type": "list", "style": "numbered", "items": ["Identify the asset", "Assess the risk", "Apply a control"] }
```
```json
{ "type": "list", "style": "icon", "iconPosition": "right", "items": [
  { "icon": "lock", "text": "Confidentiality keeps data private." },
  { "icon": "shield-check", "text": "Integrity keeps data accurate." }
] }
```

### Media blocks

#### image
Required: `src`, `alt`, `description`. Optional: `caption`, `size` (`small`, `medium`, `full`, default `medium`). Use for photos, screenshots, GIFs, and all diagrams (flowcharts, topologies, mind maps, pyramids, funnels, labeled images).
```json
{ "type": "image", "src": "osi-model-layers.webp", "alt": "OSI model layers", "description": "A stack of the seven OSI layers from Physical at the bottom to Application at the top, each labeled with its name and number.", "caption": "The seven layers of the OSI model", "size": "medium" }
```

#### video
Required: `provider` (always `vimeo`), `id`, `title`. Optional: `caption`, `hash`. Use `"id": "TBD"` if the ID is not known.

`id` is the number in the Vimeo link. `hash` is the extra code at the end of an unlisted Vimeo link, for example `ab12cd34ef` in `vimeo.com/123456789/ab12cd34ef`. Include `hash` only if one was given. Never write a full URL.
```json
{ "type": "video", "provider": "vimeo", "id": "123456789", "hash": "ab12cd34ef", "title": "How DNS resolution works", "caption": "Watch the full walkthrough." }
```

### Code blocks

#### code
Required: `language`, `code`. Optional: `title`. Use `\n` for new lines.
```json
{ "type": "code", "language": "bash", "title": "List listening ports", "code": "ss -tuln" }
```

#### terminal
Required: `lines`, a list of `{ "kind": "command" or "output", "text": "..." }`. Optional: `title`.
```json
{ "type": "terminal", "title": "Ping a host", "lines": [
  { "kind": "command", "text": "ping -c 2 example.com" },
  { "kind": "output", "text": "2 packets transmitted, 2 received" }
] }
```

### Reveal blocks (these may contain nested blocks)

Nested blocks may only be `paragraph`, `list`, `callout`, `quote`, `code`, `terminal`, `image`, `smartsheet`.

#### accordion
Required: `items`, a list of `{ "title", "blocks" }`.
```json
{ "type": "accordion", "items": [
  { "title": "What is NAT?", "blocks": [ { "type": "paragraph", "text": "NAT translates private addresses to public ones." } ] }
] }
```

#### tabs
Required: `tabs`, a list of `{ "label", "blocks" }`.
```json
{ "type": "tabs", "tabs": [
  { "label": "Windows", "blocks": [ { "type": "code", "language": "powershell", "code": "ipconfig /all" } ] },
  { "label": "Linux", "blocks": [ { "type": "code", "language": "bash", "code": "ip addr" } ] }
] }
```

#### expandable
One panel that opens for a deeper explanation or example. Required: `title`, `blocks`.
```json
{ "type": "expandable", "title": "Go deeper: the TCP three-way handshake", "blocks": [ { "type": "paragraph", "text": "The client sends SYN, the server replies SYN-ACK, and the client sends ACK." } ] }
```

#### flipcard
Term on the front, definition on the back. Required: `cards`, a list of `{ "front", "back" }`.
```json
{ "type": "flipcard", "cards": [ { "front": "SIEM", "back": "Collects and correlates logs from many sources to detect threats." } ] }
```

### Sequence blocks

#### timeline
Sequential walkthrough or process. Required: `orientation` (`vertical` or `horizontal`; horizontal scrolls left to right), `steps`, a list of `{ "title", "text" }`. Optional per step: `label` (for example "Step 1" or a date).
```json
{ "type": "timeline", "orientation": "horizontal", "steps": [
  { "label": "Step 1", "title": "Identify", "text": "Detect that an incident has occurred." },
  { "label": "Step 2", "title": "Contain", "text": "Limit the damage and stop it spreading." }
] }
```

#### carousel
Step-by-step slides. Required: `slides`, a list of objects with at least one of `text` or `image`. Optional per slide: `title`. `image` is an image object.
```json
{ "type": "carousel", "slides": [
  { "title": "Step 1: Open the console", "text": "Sign in and open the dashboard.", "image": { "src": "console-step-1.webp", "alt": "Console home", "description": "The cloud console home page with the main menu on the left." } }
] }
```

### Interactive blocks

#### hotspot
Click areas on an image to reveal information. Required: `image` (image object), `hotspots`, a list of `{ "x", "y", "title", "text" }`.
```json
{ "type": "hotspot", "image": { "src": "network-topology.webp", "alt": "Office network", "description": "A router connected to a firewall, a switch, and two servers." }, "hotspots": [
  { "x": 30, "y": 40, "title": "Firewall", "text": "Filters traffic between the internet and the internal network." }
] }
```

#### dragdrop
Required: `mode` (`match`, `order`, or `label`) and `prompt`. Optional: `hint`. The rest depends on the mode.

Match concepts: `pairs`, a list of `{ "left", "right" }`.
```json
{ "type": "dragdrop", "mode": "match", "prompt": "Match each protocol to its port.", "pairs": [ { "left": "HTTPS", "right": "443" }, { "left": "SSH", "right": "22" } ] }
```
Arrange in order: `items`, a list of strings in the CORRECT order. The LMS shuffles them.
```json
{ "type": "dragdrop", "mode": "order", "prompt": "Put the incident response phases in order.", "items": ["Preparation", "Detection", "Containment", "Eradication", "Recovery"] }
```
Label an image: `image` (image object) and `labels`, a list of `{ "text", "x", "y" }` giving the correct position of each label.
```json
{ "type": "dragdrop", "mode": "label", "prompt": "Place each label on the diagram.", "image": { "src": "network-topology.webp", "alt": "Office network", "description": "A router, firewall, switch, and server." }, "labels": [ { "text": "Firewall", "x": 30, "y": 40 } ] }
```

#### beforeafter
Slider between two images. Required: `before` and `after`, each an image object with an optional `label` (defaults "Before" and "After").
```json
{ "type": "beforeafter", "before": { "src": "acl-wrong.webp", "alt": "Misconfigured ACL", "description": "An access list that allows all traffic.", "label": "Misconfigured" }, "after": { "src": "acl-correct.webp", "alt": "Correct ACL", "description": "An access list that permits only required traffic.", "label": "Correct" } }
```

#### kanban
Progress board showing stages. Required: `columns`, a list of `{ "title", "cards" }`. Each card has `title` and optional `text`.
```json
{ "type": "kanban", "columns": [
  { "title": "Learned", "cards": [ { "title": "IP addressing" } ] },
  { "title": "Practicing", "cards": [ { "title": "Subnetting" } ] },
  { "title": "Mastered", "cards": [] }
] }
```

#### timer
Required: `mode` (`countdown` or `timer`). For `countdown`, `seconds` is required. Optional: `label`, `message` (shown when a countdown ends).
```json
{ "type": "timer", "mode": "countdown", "seconds": 300, "label": "Lab time", "message": "Time is up. Review your answers." }
```

### Comparison blocks

#### comparison
Two things side by side. Required: `left` and `right`, each `{ "title", "points" }` where `points` is a list of strings.
```json
{ "type": "comparison", "left": { "title": "TCP", "points": ["Connection-oriented", "Reliable delivery"] }, "right": { "title": "UDP", "points": ["Connectionless", "Faster, no delivery guarantee"] } }
```

#### scenario
A real-world situation with a decision. Required: `situation`, `question`, `options`, a list of `{ "text", "correct", "feedback" }` with exactly one `correct: true`. Optional: `title`.
```json
{ "type": "scenario", "title": "Suspicious login", "situation": "You see a login to an admin account at 3 a.m. from an unfamiliar country.", "question": "What do you do first?", "options": [
  { "text": "Ignore it until morning", "correct": false, "feedback": "A possible compromise needs a prompt response." },
  { "text": "Follow the incident response plan and investigate", "correct": true, "feedback": "Correct. Start the documented process." }
] }
```

### Reference block

#### smartsheet
A quick-reference table for commands, ports, or protocols. Required: `headers`, `rows` (each row has one string per header). Optional: `title`.
```json
{ "type": "smartsheet", "title": "Common ports", "headers": ["Port", "Protocol", "Use"], "rows": [ ["22", "SSH", "Secure remote login"], ["443", "HTTPS", "Secure web traffic"] ] }
```

### Grid and layout blocks

#### grid
Required: `variant` (`feature` or `comparison`), `columns` (2, 3, or 4), `items`, a list of `{ "title", "text" }`. Optional per item: `icon`, `badge`.
```json
{ "type": "grid", "variant": "feature", "columns": 3, "items": [
  { "icon": "lock", "title": "Confidentiality", "text": "Only authorized people can read data." },
  { "icon": "shield-check", "title": "Integrity", "text": "Data is not changed without permission." },
  { "icon": "server", "title": "Availability", "text": "Systems are reachable when needed." }
] }
```

#### card
One bounded idea. Required: `title`. Optional: `text`, `icon`, `variant` (`default` or `highlight`).
```json
{ "type": "card", "variant": "highlight", "icon": "shield", "title": "Defense in depth", "text": "Use several layers of control so one failure does not expose everything." }
```

#### layout
Tiles arranged in a styled layout. Required: `variant` (`bento`, `masonry`, `metro`, `modular`), `tiles`, a list of `{ "title" }`. Optional per tile: `text`, `icon`, `size` (`small`, `wide`, `tall`, `large`), `tone` (`default`, `primary`, `secondary`, `accent`).
```json
{ "type": "layout", "variant": "bento", "tiles": [
  { "title": "Identify", "text": "Know your assets.", "size": "large", "tone": "primary" },
  { "title": "Protect", "text": "Apply controls.", "size": "small" },
  { "title": "Detect", "text": "Watch for events.", "size": "small" }
] }
```

### Chart block

#### chart
Required: `chartType`, `title`, `description` (one or two sentences saying what the chart shows, for the LMS AI mentor), plus the data for that type. Optional: `unit`, `xAxisLabel`, `yAxisLabel`, `note`.

`chartType` values: `bar`, `line`, `pie`, `donut`, `stacked-bar`, `stacked-area`, `radar`, `scatter`, `bubble`, `heatmap`, `gantt`, `sankey`, `gauge`, `treemap`, `funnel`.

Data by type:

| chartType | Data fields |
| --- | --- |
| `bar`, `line`, `stacked-bar`, `stacked-area`, `radar` | `labels` (list of strings) and `series` (list of `{ "name", "values" }`, one value per label) |
| `pie`, `donut`, `treemap`, `funnel` | `labels` and `series` with exactly ONE series |
| `scatter`, `bubble` | `series`, a list of `{ "name", "points" }` where each point is `{ "x", "y" }` (bubble adds `"size"`) |
| `heatmap` | `xLabels`, `yLabels`, `values` (list of rows, one per y label, one number per x label) |
| `gantt` | `tasks`, a list of `{ "label", "start", "end" }` with dates as `YYYY-MM-DD` |
| `sankey` | `nodes` (list of names) and `links` (list of `{ "source", "target", "value" }` using node names) |
| `gauge` | `value`, `min`, `max`, `label` |

```json
{ "type": "chart", "chartType": "bar", "title": "Ports by protocol", "description": "Compares the port numbers of four common protocols.", "labels": ["SSH", "HTTP", "HTTPS", "RDP"], "series": [ { "name": "Port", "values": [22, 80, 443, 3389] } ], "yAxisLabel": "Port number" }
```
```json
{ "type": "chart", "chartType": "donut", "title": "Exam domain weighting", "description": "Shows how exam questions are split across domains.", "labels": ["Domain A", "Domain B", "Domain C"], "series": [ { "name": "Weight", "values": [40, 35, 25] } ], "unit": "%", "note": "Illustrative values" }
```
```json
{ "type": "chart", "chartType": "gantt", "title": "Study plan", "description": "A four-week study plan with one task per week.", "tasks": [ { "label": "Networking basics", "start": "2026-11-02", "end": "2026-11-08" }, { "label": "Security concepts", "start": "2026-11-09", "end": "2026-11-15" } ], "note": "Illustrative values" }
```

## 5. Complete example page

```json
{
  "chapter": "network-security-basics",
  "title": "What is a firewall?",
  "summary": "Learn what a firewall does, how it filters traffic, and the difference between stateless and stateful firewalls.",
  "estimatedMinutes": 6,
  "blocks": [
    { "type": "paragraph", "text": "A **firewall** sits between networks and decides which traffic is allowed through." },
    { "type": "heading", "level": 2, "text": "How a firewall works" },
    { "type": "image", "src": "firewall-between-networks.webp", "alt": "Firewall between networks", "description": "A firewall placed between the internet and an internal network, with arrows showing allowed and blocked traffic.", "caption": "A firewall filters traffic between networks" },
    { "type": "callout", "variant": "tip", "title": "Exam tip", "text": "A **stateful** firewall tracks connections. A **stateless** firewall checks each packet on its own." },
    { "type": "flipcard", "cards": [
      { "front": "Stateless firewall", "back": "Checks each packet against rules without remembering earlier packets." },
      { "front": "Stateful firewall", "back": "Tracks the state of connections and allows replies to approved requests." }
    ] },
    { "type": "scenario", "situation": "An external host sends unexpected traffic to port 3389 on an internal server.", "question": "What should the firewall do by default?", "options": [
      { "text": "Allow it, since it might be useful", "correct": false, "feedback": "A default-deny approach blocks traffic that is not explicitly allowed." },
      { "text": "Block it unless a rule allows it", "correct": true, "feedback": "Correct. Default deny is the safer approach." }
    ] },
    { "type": "heading", "level": 2, "text": "Key takeaways" },
    { "type": "list", "style": "checklist", "items": ["A firewall filters traffic using rules", "Stateful firewalls track connections", "Default deny is the safer approach"] }
  ],
  "imageBriefs": [
    { "file": "firewall-between-networks.webp", "brief": "Simple diagram: internet on the left, firewall in the middle, internal network on the right, with arrows for allowed and blocked traffic." }
  ]
}
```

## 6. Allowed icons

Use ONLY these Lucide icons wherever a block has an `icon` field (`list` with `"style": "icon"`, `grid`, `card`, `layout`). Pick the closest match. If none fits, leave the optional `icon` out. Never invent an icon name.

<!-- icons:start (generated by pnpm gen:icons, do not edit by hand) -->
- **Security:** `lock`, `lock-open`, `key`, `key-round`, `shield`, `shield-check`, `shield-alert`, `shield-x`, `fingerprint-pattern`, `eye`, `eye-off`, `bug`, `skull`, `ban`, `siren`, `badge-check`, `user-check`, `scan`
- **Networking and infrastructure:** `network`, `server`, `server-cog`, `database`, `hard-drive`, `cloud`, `cloud-upload`, `cloud-download`, `globe`, `wifi`, `router`, `cable`, `plug`, `ethernet-port`, `radio`, `satellite`, `signal`, `share-2`, `waypoints`, `workflow`, `git-branch`, `git-merge`, `container`, `boxes`, `box`, `layers`
- **Devices and hardware:** `cpu`, `memory-stick`, `monitor`, `laptop`, `smartphone`, `tablet`, `printer`, `usb`, `power`
- **Code and tools:** `terminal`, `square-terminal`, `code`, `file-code`, `braces`, `command`, `settings`, `wrench`, `sliders-horizontal`, `bot`, `brain`, `binary`
- **Data and files:** `chart-bar`, `chart-line`, `chart-pie`, `activity`, `gauge`, `trending-up`, `trending-down`, `table`, `table-2`, `list`, `list-checks`, `list-ordered`, `clipboard-list`, `clipboard-check`, `file`, `file-text`, `folder`, `folder-open`, `archive`, `download`, `upload`, `save`, `search`, `filter`
- **Learning:** `graduation-cap`, `book`, `book-open`, `library`, `notebook`, `lightbulb`, `target`, `award`, `trophy`, `flag`, `bookmark`, `star`, `puzzle`, `route`, `map`, `compass`, `milestone`, `quote`
- **Status and feedback:** `check`, `circle-check`, `circle-x`, `x`, `circle-help`, `circle-alert`, `info`, `triangle-alert`, `octagon-alert`, `square-check`, `circle`, `plus`, `minus`, `bell`, `zap`, `flame`
- **Arrows and actions:** `arrow-right`, `arrow-left`, `arrow-up`, `arrow-down`, `arrow-right-left`, `arrow-up-down`, `refresh-cw`, `rotate-ccw`, `repeat`, `play`, `pause`, `copy`, `link`, `external-link`, `chevron-left`, `chevron-right`
- **People and places:** `user`, `users`, `user-cog`, `building`, `building-2`, `house`, `mail`, `message-square`, `clock`, `timer`, `hourglass`, `calendar`
<!-- icons:end -->

## 7. JSON Patch edits for small updates

When the user asks for a small edit (e.g. changing text in a block, adding/deleting a block, updating page title or summary), return a **JSON Patch** (RFC 6902) instead of the entire page JSON. This saves tokens and reduces output latency.

For new pages or major page restructures, return the complete page JSON as normal inside a ```json ... ``` code block.

### Patch Format
Return JSON containing a `patch` array with RFC 6902 operations (`replace`, `add`, `remove`):

```json
{
  "patch": [
    { "op": "replace", "path": "/blocks/2/text", "value": "Updated heading text" },
    { "op": "add", "path": "/blocks/3", "value": { "type": "paragraph", "text": "New paragraph text" } },
    { "op": "remove", "path": "/blocks/5" }
  ]
}
```

Or directly as a JSON array of operations:

```json
[
  { "op": "replace", "path": "/title", "value": "New Page Title" }
]
```

### Operation rules
- `replace`: Replaces the value at `path`. Example: `/title`, `/summary`, `/blocks/0/text`.
- `add`: Inserts a value at `path`. For arrays (e.g. `/blocks`), `/blocks/2` inserts at index 2, and `/blocks/-` appends to the end of the array.
- `remove`: Removes the value/item at `path`. Example: `/blocks/4`.

## 8. Outline and Section-by-Section Generation for Long Pages

For long or multi-section page requests (e.g. topics with 4 or more sections), return a **Page Outline** JSON first before writing block content:

```json
{
  "type": "outline",
  "chapter": "chapter-slug",
  "title": "Page Title",
  "summary": "Summary of what the learner will gain.",
  "estimatedMinutes": 10,
  "sections": [
    { "title": "Introduction to Concept", "plannedBlocks": ["paragraph", "callout"] },
    { "title": "Architecture Overview", "plannedBlocks": ["heading", "paragraph", "grid"] },
    { "title": "Key Takeaways", "plannedBlocks": ["heading", "list"] }
  ]
}
```

Once the outline is approved by the user, generate blocks section by section using JSON patch operations (`op: "add", path: "/blocks/-"`):

```json
{
  "type": "section",
  "sectionIndex": 0,
  "sectionTitle": "Introduction to Concept",
  "patch": [
    { "op": "add", "path": "/blocks/-", "value": { "type": "paragraph", "text": "..." } }
  ]
}
```



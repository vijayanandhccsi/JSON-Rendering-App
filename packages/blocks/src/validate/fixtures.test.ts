import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { BLOCK_TYPES, CHART_TYPES, PageSchema } from "../schema";
import { formatIssues, validateJsonText } from "./index";

const fixtures = join(__dirname, "../../../../fixtures/pages");
const read = (dir: string, file: string) => readFileSync(join(fixtures, dir, file), "utf8");
const list = (dir: string) => readdirSync(join(fixtures, dir)).sort();

describe("valid fixtures", () => {
  const files = list("valid");

  it.each(files)("%s has no errors and no warnings", (file) => {
    const result = validateJsonText(read("valid", file));
    expect(formatIssues(result)).toBe("No errors or warnings.");
    expect(result.valid).toBe(true);
  });

  it.each(files)("%s also passes the strict PageSchema", (file) => {
    const parsed = PageSchema.safeParse(JSON.parse(read("valid", file)));
    expect(parsed.error?.issues).toBeUndefined();
  });

  it("has a single-block fixture for every block type", () => {
    for (const type of BLOCK_TYPES) {
      expect(
        files.some(
          (file) =>
            file.startsWith(`block-${type}`) ||
            file.startsWith(`${type}-`) ||
            (type === "chart" && file.startsWith("block-chart-")),
        ),
        type,
      ).toBe(true);
    }
  });

  it("has a chart fixture for every chart type", () => {
    for (const chartType of CHART_TYPES)
      expect(files, chartType).toContain(`block-chart-${chartType}.json`);
  });

  it("full-sample uses every block type", () => {
    const page = JSON.parse(read("valid", "full-sample.json")) as { blocks: { type: string }[] };
    const used = new Set(page.blocks.map((block) => block.type));
    for (const type of BLOCK_TYPES) expect(used.has(type), type).toBe(true);
  });
});

interface Expectation {
  /** Is the page still valid (warnings only)? */
  valid: boolean;
  severity: "error" | "warning";
  path: string;
  includes: string;
}

const error = (path: string, includes: string): Expectation => ({
  valid: false,
  severity: "error",
  path,
  includes,
});
const warning = (path: string, includes: string): Expectation => ({
  valid: true,
  severity: "warning",
  path,
  includes,
});

const expectations: Record<string, Expectation> = {
  "not-json.txt": error("", "not valid JSON. Line 4, column 14"),
  "empty-text.txt": error("", "empty"),
  "page-not-object": error("", "must be a JSON object"),
  "missing-chapter": error("chapter", "is required"),
  "missing-title": error("title", "is required"),
  "missing-summary": error("summary", "is required"),
  "missing-blocks": error("blocks", "is required"),
  "empty-blocks": error("blocks", "at least 1"),
  "chapter-not-slug": error("chapter", "lowercase hyphenated slug"),
  "unknown-page-field": error("", 'Unknown field "author"'),
  "block-missing-type": error("blocks[0].type", "is required"),
  "unknown-block-type": error("blocks[0].type", 'Unknown block type "banner"'),
  "unknown-block-field": error("blocks[0]", 'Unknown field "color"'),
  "missing-required-field": error("blocks[0].text", "is required"),
  "wrong-type": error("blocks[0].text", "must be a text string"),
  "value-not-allowed": error("blocks[0].variant", "must be one of"),
  "heading-level-1": error("blocks[0].level", "must be one of 2, 3, 4"),
  "heading-level-5": error("blocks[0].level", "must be one of 2, 3, 4"),
  "container-in-container": error(
    "blocks[0].items[0].blocks[0]",
    "cannot go inside another container",
  ),
  "disallowed-child": error("blocks[0].tabs[0].blocks[0]", "cannot be nested"),
  "nested-unknown-field": error("blocks[0].blocks[0]", 'Unknown field "bold"'),
  "html-in-text": error("blocks[0].text", "HTML tag"),
  "image-src-url": error("blocks[0].src", "path or URL"),
  "image-src-path": error("blocks[0].src", "path or URL"),
  "image-src-extension": error("blocks[0].src", ".webp, .png or .gif"),
  "image-src-uppercase": error("blocks[0].src", "lowercase letters"),
  "image-missing-alt": error("blocks[0].alt", "is required"),
  "image-missing-description": error("blocks[0].description", "is required"),
  "image-nested-missing-alt": error("blocks[0].items[0].blocks[0].alt", "is required"),
  "carousel-image-missing-description": error(
    "blocks[0].slides[0].image.description",
    "is required",
  ),
  "carousel-empty-slide": error("blocks[0].slides[0]", 'at least one of "text" or "image"'),
  "video-provider-youtube": error("blocks[0].provider", 'must be "vimeo"'),
  "video-id-url": error("blocks[0].id", "digits only"),
  "scenario-no-correct": error("blocks[0].options", "found 0"),
  "scenario-two-correct": error("blocks[0].options", "found 2"),
  "dragdrop-mode-mismatch": error("blocks[0]", 'Unknown field "pairs"'),
  "dragdrop-unknown-mode": error("blocks[0].mode", '"match", "order", "label"'),
  "hotspot-out-of-range": error("blocks[0].hotspots[0].x", "at most 100"),
  "dragdrop-label-out-of-range": error("blocks[0].labels[0].y", "at least 0"),
  "timer-countdown-no-seconds": error("blocks[0].seconds", 'when mode is "countdown"'),
  "smartsheet-row-length": error("blocks[0].rows[0]", "2 cells but there are 3 headers"),
  "list-icon-with-plain-items": error("blocks[0].items[0]", "must be an object"),
  "list-plain-with-icon-position": error("blocks[0]", 'Unknown field "iconPosition"'),
  "chart-series-length": error("blocks[0].series[0].values", "2 values but there are 3 labels"),
  "chart-pie-two-series": error("blocks[0].series", "exactly 1 item but has 2"),
  "chart-heatmap-size": error("blocks[0].values[1]", "2 numbers but there are 3 xLabels"),
  "chart-sankey-unknown-node": error("blocks[0].links[0].target", 'refers to "C"'),
  "chart-gantt-end-before-start": error("blocks[0].tasks[0].end", "before the start date"),
  "chart-missing-description": error("blocks[0].description", "is required"),
  "chart-unknown-type": error("blocks[0].chartType", "must be one of"),
  "chart-wrong-data-for-type": error("blocks[0].series[0].points", "is required"),
  "warn-image-not-in-briefs": warning("blocks[0].src", "is not listed in"),
  "warn-brief-unused": warning("imageBriefs[0].file", "no image on the page uses it"),
  "warn-imagebriefs-missing": warning("imageBriefs", "is missing"),
  "warn-video-tbd": warning("blocks[0].id", '"TBD"'),
  "warn-paragraph-too-long": warning("blocks[0].text", "85 words"),
  "warn-unknown-icon": warning("blocks[0].icon", 'Did you mean "shield-check"'),
};

describe("invalid fixtures", () => {
  const files = list("invalid");
  const name = (file: string) => file.replace(/\.json$/, "");

  it("has an expectation for every fixture and a fixture for every expectation", () => {
    expect(files.map(name).sort()).toEqual(Object.keys(expectations).sort());
  });

  it.each(files)("%s is reported clearly", (file) => {
    const expected = expectations[name(file)];
    if (!expected) throw new Error(`No expectation for ${file}`);
    const result = validateJsonText(read("invalid", file));

    expect(result.valid, formatIssues(result)).toBe(expected.valid);
    const group = expected.severity === "error" ? result.errors : result.warnings;
    const match = group.find(
      (issue) =>
        issue.path === expected.path && `${issue.message} ${issue.fix}`.includes(expected.includes),
    );
    expect(
      match,
      `expected ${expected.severity} at "${expected.path}" including "${expected.includes}"\n${formatIssues(result)}`,
    ).toBeDefined();
    expect(match?.fix.length).toBeGreaterThan(0);
    if (expected.severity === "warning") expect(result.errors).toEqual([]);
  });

  it("blocks page-level problems from being attributed to a block", () => {
    const result = validateJsonText(read("invalid", "missing-title.json"));
    expect(result.errors[0]?.blockIndex).toBeNull();
  });

  it("reports the top-level block index and the nested block's own type", () => {
    const page = JSON.parse(read("valid", "block-paragraph.json")) as { blocks: unknown[] };
    page.blocks.push(JSON.parse(read("invalid", "image-nested-missing-alt.json")).blocks[0]);
    const result = validateJsonText(JSON.stringify(page));
    expect(result.errors[0]).toMatchObject({ blockIndex: 1, blockType: "image" });
  });

  it("reports every problem in one pass, not just the first", () => {
    const result = validateJsonText(
      JSON.stringify({
        chapter: "Bad Slug",
        title: "T",
        summary: "S",
        blocks: [
          { type: "heading", level: 9, text: "x" },
          { type: "banner" },
          { type: "paragraph", text: "<i>x</i>" },
        ],
      }),
    );
    expect(result.errors.map((e) => e.blockIndex)).toEqual([null, 0, 1, 2]);
  });
});

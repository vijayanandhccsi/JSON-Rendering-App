import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { CHART_TYPES, PageSchema } from "../schema";
import { buildChartOption } from "./options";
import { seriesPalette } from "./tokens";
import type { ChartTokens } from "./tokens";

// The real ECharts (the tests normally replace it), drawn to an SVG string without a browser.
type Setup = typeof import("./echarts-setup");
const real = vi.importActual<Setup>("./echarts-setup");

const tokens: ChartTokens = {
  series: ["#e8570a", "#07111f", "#00a86b"],
  low: "#fdebdd",
  surface: "#ffffff",
  grid: "#e6e2d8",
  text: "#07111f",
  textMuted: "#5b6470",
  fontFamily: "sans-serif",
  monoFamily: "monospace",
  fontSize: 13,
};

function chartOf(type: string) {
  const file = join(__dirname, `../../../../fixtures/pages/valid/block-chart-${type}.json`);
  const block = PageSchema.parse(JSON.parse(readFileSync(file, "utf8"))).blocks[0];
  if (block?.type !== "chart") throw new Error("not a chart");
  return block;
}

/** Text each chart should show, taken from its own data. */
const expectedText: Record<string, string[]> = {
  bar: ["SSH", "HTTPS", "Port number"],
  line: ["Mon", "Day", "Alerts"],
  pie: ["A", "B", "C"],
  donut: ["Domain A", "Domain B"],
  "stacked-bar": ["Q1", "Low", "High"],
  "stacked-area": ["Q3", "Low"],
  radar: ["Speed", "Safety", "Option A"],
  scatter: ["Latency", "Loss"],
  bubble: [],
  heatmap: ["Mon", "High"],
  gantt: ["Networking basics", "Security concepts"],
  sankey: ["Internet", "Firewall", "Blocked"],
  gauge: ["Patch compliance", "72"],
  treemap: ["Web", "Mail"],
  funnel: ["Alerts", "Incidents"],
};

describe("every chart type draws with the real ECharts", () => {
  it.each(CHART_TYPES)("%s", async (type) => {
    const { init } = await real;
    const chart = init(null, undefined, { renderer: "svg", ssr: true, width: 640, height: 320 });
    try {
      chart.setOption(buildChartOption(chartOf(type), { tokens, animate: false }));
      const svg = chart.renderToSVGString();

      expect(svg.startsWith("<svg")).toBe(true);
      expect(svg.length).toBeGreaterThan(800);
      for (const text of expectedText[type] ?? []) expect(svg, text).toContain(text);
      expect(svg).not.toMatch(/linearGradient|radialGradient/);

      const palette = seriesPalette(tokens).map((color) => color.toLowerCase());
      expect(
        palette.some((color) => svg.toLowerCase().includes(color)),
        "uses a token color",
      ).toBe(true);
    } finally {
      chart.dispose();
    }
  });
});

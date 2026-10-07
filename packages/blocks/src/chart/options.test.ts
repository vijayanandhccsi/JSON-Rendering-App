import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { CHART_TYPES, PageSchema } from "../schema";
import type { BlockOf } from "../types";
import { chartDataTable } from "./dataTable";
import { buildChartOption, chartHeight } from "./options";
import { seriesPalette } from "./tokens";
import type { ChartTokens } from "./tokens";

const tokens: ChartTokens = {
  series: ["#e8570a", "#07111f", "#00a86b"],
  low: "#fdebdd",
  surface: "#ffffff",
  grid: "#e6e2d8",
  text: "#07111f",
  textMuted: "#5b6470",
  fontFamily: "Test Sans",
  monoFamily: "Test Mono",
  fontSize: 13,
};

function chartOf(type: string): BlockOf<"chart"> {
  const file = join(__dirname, `../../../../fixtures/pages/valid/block-chart-${type}.json`);
  const block = PageSchema.parse(JSON.parse(readFileSync(file, "utf8"))).blocks[0];
  if (block?.type !== "chart") throw new Error(`block-chart-${type}.json is not a chart`);
  return block;
}

const option = (type: string, extra: Partial<BlockOf<"chart">> = {}, animate = true) =>
  buildChartOption({ ...chartOf(type), ...extra } as BlockOf<"chart">, {
    tokens,
    animate,
  }) as Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

describe.each(CHART_TYPES)("%s chart", (type) => {
  it("builds an option with the theme: palette from the tokens, token text and a flat look", () => {
    const built = option(type);
    expect(built.color).toEqual(seriesPalette(tokens));
    expect(built.color.slice(0, 3)).toEqual(tokens.series);
    expect(built.textStyle).toMatchObject({
      fontFamily: "Test Sans",
      fontSize: 13,
      color: tokens.text,
    });
    expect(built.tooltip).toMatchObject({
      backgroundColor: tokens.surface,
      borderColor: tokens.grid,
    });
    const json = JSON.stringify(built);
    expect(json).not.toMatch(/gradient/i);
    expect(json).not.toMatch(/shadowBlur|shadowColor/);
    expect(json).not.toMatch(/"3d"|grid3D|bar3D/i);
  });

  it("only uses colors from the tokens (and tints of them)", () => {
    const colors = JSON.stringify(option(type)).match(/#[0-9a-f]{6}/gi) ?? [];
    const allowed = new Set([
      ...Object.values(tokens).filter(
        (v): v is string => typeof v === "string" && v.startsWith("#"),
      ),
      ...tokens.series,
      ...seriesPalette(tokens),
    ]);
    for (const color of colors) expect(allowed.has(color.toLowerCase()), color).toBe(true);
  });

  it("turns animation off when the reader prefers reduced motion", () => {
    expect(option(type, {}, true).animation).toBe(true);
    expect(option(type, {}, false).animation).toBe(false);
  });

  it("has a data table for screen readers with a header row and at least one data row", () => {
    const table = chartDataTable(chartOf(type));
    expect(table.headers.length).toBeGreaterThan(1);
    expect(table.rows.length).toBeGreaterThan(0);
    for (const row of table.rows) expect(row).toHaveLength(table.headers.length);
  });

  it("has a positive height from the spacing token", () => {
    expect(chartHeight(chartOf(type))).toMatch(/^calc\(var\(--spacing\) \* \d+\)$/);
  });
});

describe("bar, line, stacked-bar and stacked-area", () => {
  it("bar: one series per entry on a category axis, with axis names and units", () => {
    const built = option("bar", { unit: "ports" });
    expect(built.xAxis).toMatchObject({ type: "category", data: ["SSH", "HTTP", "HTTPS", "RDP"] });
    expect(built.yAxis).toMatchObject({ type: "value", name: "Port number (ports)" });
    expect(built.yAxis.axisLabel.formatter).toBe("{value} ports");
    expect(built.series).toEqual([
      expect.objectContaining({ type: "bar", name: "Port", data: [22, 80, 443, 3389] }),
    ]);
    expect(built.tooltip.valueFormatter(22)).toBe("22 ports");
  });

  it("labels both axes when both labels are given", () => {
    const built = option("line");
    expect(built.xAxis.name).toBe("Day");
    expect(built.yAxis.name).toBe("Alerts");
  });

  it("shows a legend only when there is more than one series", () => {
    expect(option("bar").legend.show).toBe(false);
    expect(option("stacked-bar").legend.show).toBe(true);
  });

  it("line: lines with round markers", () => {
    expect(option("line").series[0]).toMatchObject({ type: "line", symbol: "circle" });
  });

  it("stacked-bar: bars that share a stack", () => {
    const series = option("stacked-bar").series;
    expect(series.map((s: { type: string; stack: string }) => [s.type, s.stack])).toEqual([
      ["bar", "total"],
      ["bar", "total"],
    ]);
  });

  it("stacked-area: filled lines that share a stack", () => {
    const series = option("stacked-area").series;
    expect(
      series.every(
        (s: { type: string; stack: string; areaStyle: object }) =>
          s.type === "line" && s.stack === "total" && s.areaStyle,
      ),
    ).toBe(true);
  });
});

describe("radar", () => {
  it("has one indicator per label, a shared maximum above the data, and a series per entry", () => {
    const built = option("radar");
    expect(built.radar.indicator.map((i: { name: string }) => i.name)).toEqual([
      "Speed",
      "Cost",
      "Safety",
      "Reach",
    ]);
    expect(built.radar.indicator[0].max).toBeGreaterThanOrEqual(5);
    expect(built.series[0].data).toHaveLength(2);
    expect(built.legend.show).toBe(true);
  });
});

describe("pie, donut, treemap and funnel", () => {
  it("pie: a solid pie with name and value for each label, and a legend", () => {
    const built = option("pie");
    expect(built.series[0]).toMatchObject({
      type: "pie",
      radius: "68%",
      data: [
        { name: "A", value: 40 },
        { name: "B", value: 35 },
        { name: "C", value: 25 },
      ],
    });
    expect(built.legend.show).toBe(true);
  });

  it("donut: a pie with a hole, and the unit in labels and tooltips", () => {
    const built = option("donut");
    expect(built.series[0].radius).toEqual(["45%", "68%"]);
    expect(built.series[0].label.formatter).toBe("{b}: {c} %");
    expect(built.tooltip.formatter).toBe("{b}: {c} % ({d}%)");
  });

  it("treemap: boxes filled with light tints so the dark labels stay readable", () => {
    const built = option("treemap");
    const tints = seriesPalette(tokens).slice(3);
    expect(built.series[0].type).toBe("treemap");
    expect(built.series[0].breadcrumb).toEqual({ show: false });
    for (const item of built.series[0].data) expect(tints).toContain(item.itemStyle.color);
    expect(built.series[0].label.color).toBe(tokens.text);
  });

  it("funnel: sorted largest first, with labels outside the shapes", () => {
    const built = option("funnel");
    expect(built.series[0]).toMatchObject({ type: "funnel", sort: "descending" });
    expect(built.series[0].label).toMatchObject({ position: "right", color: tokens.text });
  });
});

describe("scatter and bubble", () => {
  it("scatter: x and y pairs on two value axes", () => {
    const built = option("scatter");
    expect(built.series[0]).toMatchObject({
      type: "scatter",
      data: [
        [1, 2],
        [2, 4],
        [3, 3],
      ],
    });
    expect(built.xAxis).toMatchObject({ type: "value", name: "Latency" });
    expect(built.yAxis.name).toBe("Loss");
  });

  it("bubble: the third value sets the size, between the smallest and largest bubble", () => {
    const built = option("bubble");
    expect(built.series[0].data).toEqual([
      [1, 2, 10],
      [2, 4, 25],
    ]);
    const size = built.series[0].symbolSize as (value: number[]) => number;
    expect(size([0, 0, 10])).toBeLessThan(size([0, 0, 25]));
    expect(size([0, 0, 25])).toBeCloseTo(48);
    expect(size([0, 0, 0.01])).toBeGreaterThanOrEqual(10);
  });
});

describe("heatmap", () => {
  it("has a cell for every value, a color scale from the light tint to the primary color, and the value in each cell", () => {
    const built = option("heatmap");
    expect(built.series[0].data).toHaveLength(6);
    expect(built.series[0].data[0]).toEqual([0, 0, 1]);
    expect(built.series[0].data[5]).toEqual([2, 1, 6]);
    expect(built.visualMap).toMatchObject({ type: "piecewise", min: 1, max: 6 });
    expect(built.visualMap.inRange.color).toEqual([tokens.low, tokens.series[0]]);
    expect(built.series[0].label).toMatchObject({ show: true, color: tokens.text });
    expect(built.xAxis.data).toEqual(["Mon", "Tue", "Wed"]);
    expect(built.yAxis.data).toEqual(["Low", "High"]);
  });
});

describe("gantt", () => {
  it("draws one bar per task on a time axis, running to the end of the end date", () => {
    const built = option("gantt");
    const day = 24 * 60 * 60 * 1000;
    expect(built.series[0].type).toBe("custom");
    expect(built.series[0].data).toEqual([
      [0, Date.parse("2026-11-02T00:00:00Z"), Date.parse("2026-11-08T00:00:00Z") + day],
      [1, Date.parse("2026-11-09T00:00:00Z"), Date.parse("2026-11-15T00:00:00Z") + day],
    ]);
    expect(built.xAxis).toMatchObject({
      type: "time",
      min: Date.parse("2026-11-02T00:00:00Z"),
      max: Date.parse("2026-11-15T00:00:00Z") + day,
    });
    expect(built.yAxis).toMatchObject({
      type: "category",
      inverse: true,
      data: ["Networking basics", "Security concepts"],
    });
  });

  it("turns a data row into a rectangle", () => {
    const render = option("gantt").series[0].renderItem as (
      params: object,
      api: object,
    ) => { type: string; shape: { width: number; height: number } };
    const api = {
      value: (i: number) => [0, 0, 100][i],
      coord: ([x]: number[]) => [x as number, 50],
      size: () => [0, 40],
      style: () => ({}),
    };
    const item = render({}, api);
    expect(item.type).toBe("rect");
    expect(item.shape.width).toBe(100);
    expect(item.shape.height).toBeCloseTo(22);
  });

  it("grows taller with more tasks", () => {
    const full = chartOf("gantt");
    if (full.chartType !== "gantt") throw new Error("expected a gantt chart");
    const one = { ...full, tasks: full.tasks.slice(0, 1) };
    expect(chartHeight(full)).not.toBe(chartHeight(one));
  });
});

describe("sankey", () => {
  it("has every node and link, with soft source-colored flows", () => {
    const built = option("sankey");
    expect(built.series[0].data).toEqual([
      { name: "Internet" },
      { name: "Firewall" },
      { name: "Allowed" },
      { name: "Blocked" },
    ]);
    expect(built.series[0].links).toHaveLength(3);
    expect(built.series[0].links[1]).toEqual({ source: "Firewall", target: "Allowed", value: 7 });
    expect(built.series[0].lineStyle).toMatchObject({ color: "source", opacity: 0.35 });
    expect(built.series[0].label.color).toBe(tokens.text);
  });
});

describe("gauge", () => {
  it("shows the value with its label and unit between the minimum and maximum", () => {
    const built = option("gauge");
    expect(built.series[0]).toMatchObject({
      type: "gauge",
      min: 0,
      max: 100,
      data: [{ value: 72, name: "Patch compliance" }],
    });
    expect(built.series[0].detail.formatter(72)).toBe("72 %");
    expect(built.series[0].detail.fontFamily).toBe("Test Mono");
    expect(built.series[0].progress.itemStyle.color).toBe(tokens.series[0]);
    expect(built.series[0].axisLine.lineStyle.color).toEqual([[1, tokens.grid]]);
  });
});

describe("data tables", () => {
  it("category charts: one row per label, one column per series, with units", () => {
    expect(chartDataTable({ ...chartOf("bar"), unit: "ms" } as BlockOf<"chart">)).toEqual({
      headers: ["Label", "Port"],
      rows: [
        ["SSH", "22 ms"],
        ["HTTP", "80 ms"],
        ["HTTPS", "443 ms"],
        ["RDP", "3389 ms"],
      ],
    });
  });

  it("gantt, sankey, heatmap, gauge, bubble", () => {
    expect(chartDataTable(chartOf("gantt")).rows[0]).toEqual([
      "Networking basics",
      "2026-11-02",
      "2026-11-08",
    ]);
    expect(chartDataTable(chartOf("sankey")).rows[0]).toEqual(["Internet", "Firewall", "10"]);
    expect(chartDataTable(chartOf("heatmap"))).toEqual({
      headers: ["Row", "Mon", "Tue", "Wed"],
      rows: [
        ["Low", "1", "2", "3"],
        ["High", "4", "5", "6"],
      ],
    });
    expect(chartDataTable(chartOf("gauge")).rows[0]).toEqual([
      "Patch compliance",
      "72 %",
      "0",
      "100",
    ]);
    expect(chartDataTable(chartOf("bubble")).headers).toEqual(["Series", "x", "y", "Size"]);
  });
});

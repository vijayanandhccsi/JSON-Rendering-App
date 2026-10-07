import type { EChartsOption } from "echarts";
import type { BlockOf } from "../types";
import { seriesPalette } from "./tokens";
import type { ChartTokens } from "./tokens";

type Chart = BlockOf<"chart">;
type Of<T extends Chart["chartType"]> = Extract<Chart, { chartType: T }>;

export interface BuildContext {
  tokens: ChartTokens;
  /** False for readers who prefer reduced motion. */
  animate: boolean;
}

const DAY_MS = 24 * 60 * 60 * 1000;
const BUBBLE_MIN = 10;
const BUBBLE_MAX = 48;
const HEATMAP_STEPS = 5;

interface Params {
  name?: unknown;
  value?: unknown;
}
/** The first item of a tooltip or label callback's argument, which is one item or a list of them. */
const firstParam = (params: unknown): Params =>
  (Array.isArray(params) ? params[0] : params) as Params;
const cell = (params: unknown, index: number) =>
  String(((firstParam(params).value as unknown[]) ?? [])[index] ?? "");

/** Text after a number, for example " %". */
const suffix = (unit: string | undefined) => (unit ? ` ${unit}` : "");

function axisStyle({ tokens }: BuildContext) {
  return {
    axisLine: { lineStyle: { color: tokens.grid } },
    axisTick: { lineStyle: { color: tokens.grid } },
    axisLabel: { color: tokens.text },
    nameTextStyle: { color: tokens.text },
    splitLine: { lineStyle: { color: tokens.grid, width: 1 } },
  };
}

function base(ctx: BuildContext): EChartsOption {
  const { tokens } = ctx;
  return {
    color: seriesPalette(tokens),
    animation: ctx.animate,
    textStyle: { fontFamily: tokens.fontFamily, fontSize: tokens.fontSize, color: tokens.text },
    tooltip: {
      backgroundColor: tokens.surface,
      borderColor: tokens.grid,
      borderWidth: 1,
      textStyle: { color: tokens.text, fontFamily: tokens.fontFamily, fontSize: tokens.fontSize },
      extraCssText: "box-shadow:none;",
    },
  };
}

function legend(ctx: BuildContext, show: boolean): EChartsOption["legend"] {
  return {
    show,
    bottom: 0,
    textStyle: { color: ctx.tokens.text, fontFamily: ctx.tokens.fontFamily },
  };
}

/** "Label (unit)" when both are given, otherwise whichever exists. */
function axisName(label: string | undefined, unit: string | undefined): string | undefined {
  if (label && unit) return `${label} (${unit})`;
  return label;
}

function cartesianGrid(hasLegend: boolean): EChartsOption["grid"] {
  return { left: 8, right: 24, top: 24, bottom: hasLegend ? 64 : 40, containLabel: true };
}

function multiSeries(
  chart: Of<"bar" | "line" | "stacked-bar" | "stacked-area" | "radar">,
  ctx: BuildContext,
): EChartsOption {
  const { tokens } = ctx;
  const many = chart.series.length > 1;

  if (chart.chartType === "radar") {
    const peak = Math.max(1, ...chart.series.flatMap((series) => series.values));
    return {
      ...base(ctx),
      legend: legend(ctx, many),
      tooltip: { ...base(ctx).tooltip, trigger: "item" },
      radar: {
        indicator: chart.labels.map((name) => ({ name, max: Math.ceil(peak * 1.1) })),
        radius: "62%",
        axisName: { color: tokens.text },
        axisLine: { lineStyle: { color: tokens.grid } },
        splitLine: { lineStyle: { color: tokens.grid } },
        splitArea: { show: false },
      },
      series: [
        {
          type: "radar",
          data: chart.series.map((series) => ({
            name: series.name,
            value: series.values,
            areaStyle: { opacity: 0.2 },
          })),
        },
      ],
    };
  }

  const stacked = chart.chartType === "stacked-bar" || chart.chartType === "stacked-area";
  const type = chart.chartType === "bar" || chart.chartType === "stacked-bar" ? "bar" : "line";
  const style = axisStyle(ctx);

  return {
    ...base(ctx),
    legend: legend(ctx, many),
    grid: cartesianGrid(many),
    tooltip: {
      ...base(ctx).tooltip,
      trigger: "axis",
      valueFormatter: (value) => `${String(value)}${suffix(chart.unit)}`,
    },
    xAxis: {
      type: "category",
      data: chart.labels,
      name: chart.xAxisLabel,
      nameLocation: "middle",
      nameGap: 32,
      ...style,
    },
    yAxis: {
      type: "value",
      name: axisName(chart.yAxisLabel, chart.unit),
      nameLocation: "middle",
      nameGap: 44,
      ...style,
      axisLabel: { color: tokens.text, formatter: `{value}${chart.unit ? ` ${chart.unit}` : ""}` },
    },
    series: chart.series.map((series) => ({
      name: series.name,
      type,
      data: series.values,
      ...(stacked ? { stack: "total" } : {}),
      ...(chart.chartType === "stacked-area"
        ? { areaStyle: { opacity: 0.35 }, showSymbol: false }
        : {}),
      ...(type === "line" ? { symbol: "circle", symbolSize: 8, lineStyle: { width: 2 } } : {}),
    })),
  } as EChartsOption;
}

function singleSeries(
  chart: Of<"pie" | "donut" | "treemap" | "funnel">,
  ctx: BuildContext,
): EChartsOption {
  const { tokens } = ctx;
  const values = chart.series[0]?.values ?? [];
  const data = chart.labels.map((name, i) => ({ name, value: values[i] ?? 0 }));
  const palette = seriesPalette(tokens);
  const unit = suffix(chart.unit);

  if (chart.chartType === "treemap") {
    // Labels sit inside the boxes, so the boxes use light tints to keep the dark text readable.
    const tints = palette.slice(3);
    return {
      ...base(ctx),
      series: [
        {
          type: "treemap",
          roam: false,
          nodeClick: false,
          breadcrumb: { show: false },
          left: 0,
          right: 0,
          top: 0,
          bottom: 0,
          label: {
            color: tokens.text,
            fontFamily: tokens.fontFamily,
            formatter: `{b}\n{c}${unit}`,
          },
          itemStyle: { borderColor: tokens.surface, borderWidth: 2, gapWidth: 2 },
          data: data.map((item, i) => ({ ...item, itemStyle: { color: tints[i % tints.length] } })),
        },
      ],
    };
  }

  if (chart.chartType === "funnel") {
    return {
      ...base(ctx),
      tooltip: { ...base(ctx).tooltip, trigger: "item", formatter: `{b}: {c}${unit}` },
      series: [
        {
          type: "funnel",
          sort: "descending",
          gap: 2,
          left: "4%",
          top: 16,
          bottom: 16,
          width: "52%",
          itemStyle: { borderColor: tokens.surface, borderWidth: 1 },
          label: {
            show: true,
            position: "right",
            color: tokens.text,
            formatter: `{b}: {c}${unit}`,
          },
          labelLine: { show: true, lineStyle: { color: tokens.grid } },
          data,
        },
      ],
    };
  }

  return {
    ...base(ctx),
    legend: legend(ctx, true),
    tooltip: { ...base(ctx).tooltip, trigger: "item", formatter: `{b}: {c}${unit} ({d}%)` },
    series: [
      {
        type: "pie",
        radius: chart.chartType === "donut" ? ["45%", "68%"] : "68%",
        center: ["50%", "46%"],
        itemStyle: { borderColor: tokens.surface, borderWidth: 2 },
        label: { color: tokens.text, formatter: `{b}: {c}${unit}` },
        labelLine: { lineStyle: { color: tokens.grid } },
        data,
      },
    ],
  };
}

function pointSeries(chart: Of<"scatter" | "bubble">, ctx: BuildContext): EChartsOption {
  const style = axisStyle(ctx);
  const many = chart.series.length > 1;
  const bubble = chart.chartType === "bubble";
  const sizes = chart.series.flatMap((series) =>
    series.points.map((point) => ("size" in point ? point.size : 0)),
  );
  const biggest = Math.max(1, ...sizes);

  return {
    ...base(ctx),
    legend: legend(ctx, many),
    grid: cartesianGrid(many),
    tooltip: { ...base(ctx).tooltip, trigger: "item" },
    xAxis: {
      type: "value",
      name: chart.xAxisLabel,
      nameLocation: "middle",
      nameGap: 32,
      scale: true,
      ...style,
    },
    yAxis: {
      type: "value",
      name: axisName(chart.yAxisLabel, chart.unit),
      nameLocation: "middle",
      nameGap: 44,
      scale: true,
      ...style,
      axisLabel: {
        color: ctx.tokens.text,
        formatter: `{value}${chart.unit ? ` ${chart.unit}` : ""}`,
      },
    },
    series: chart.series.map((series) => ({
      name: series.name,
      type: "scatter",
      data: series.points.map((point) =>
        bubble && "size" in point ? [point.x, point.y, point.size] : [point.x, point.y],
      ),
      symbolSize: bubble
        ? (value: unknown) =>
            BUBBLE_MIN +
            Math.sqrt(Number((value as number[])[2]) / biggest) * (BUBBLE_MAX - BUBBLE_MIN)
        : 10,
      itemStyle: { opacity: bubble ? 0.75 : 1 },
    })),
  } as EChartsOption;
}

function heatmap(chart: Of<"heatmap">, ctx: BuildContext): EChartsOption {
  const { tokens } = ctx;
  const style = axisStyle(ctx);
  const flat = chart.values.flat();
  const data = chart.values.flatMap((row, y) => row.map((value, x) => [x, y, value]));

  return {
    ...base(ctx),
    grid: { left: 8, right: 24, top: 16, bottom: 72, containLabel: true },
    tooltip: {
      ...base(ctx).tooltip,
      trigger: "item",
      formatter: (p) => `${String(firstParam(p).name)}: ${cell(p, 2)}${suffix(chart.unit)}`,
    },
    xAxis: {
      type: "category",
      data: chart.xLabels,
      name: chart.xAxisLabel,
      nameLocation: "middle",
      nameGap: 32,
      splitArea: { show: false },
      ...style,
    },
    yAxis: {
      type: "category",
      data: chart.yLabels,
      name: chart.yAxisLabel,
      nameLocation: "middle",
      nameGap: 56,
      splitArea: { show: false },
      ...style,
    },
    // The colors run from a light tint to the primary color, so dark labels stay readable on every cell.
    // Stepped bands, not a smooth gradient bar: the design is flat.
    visualMap: {
      type: "piecewise",
      splitNumber: HEATMAP_STEPS,
      min: Math.min(...flat),
      max: Math.max(...flat),
      orient: "horizontal",
      left: "center",
      bottom: 0,
      inRange: { color: [tokens.low, tokens.series[0] ?? tokens.low] },
      textStyle: { color: tokens.text },
    },
    series: [
      {
        type: "heatmap",
        data,
        label: {
          show: true,
          color: tokens.text,
          formatter: (p) => String((p.value as number[])[2]),
        },
        itemStyle: { borderColor: tokens.surface, borderWidth: 2 },
      },
    ],
  };
}

const toTime = (date: string) => Date.parse(`${date}T00:00:00Z`);

function gantt(chart: Of<"gantt">, ctx: BuildContext): EChartsOption {
  const { tokens } = ctx;
  const style = axisStyle(ctx);
  // The end date is a whole day, so each bar runs to the end of that day.
  const data = chart.tasks.map((task, i) => [i, toTime(task.start), toTime(task.end) + DAY_MS]);
  const starts = chart.tasks.map((task) => toTime(task.start));
  const ends = chart.tasks.map((task) => toTime(task.end) + DAY_MS);

  return {
    ...base(ctx),
    grid: { left: 8, right: 24, top: 16, bottom: 40, containLabel: true },
    tooltip: {
      ...base(ctx).tooltip,
      trigger: "item",
      formatter: (p) => {
        const task = chart.tasks[Number(cell(p, 0))];
        return task ? `${task.label}: ${task.start} to ${task.end}` : "";
      },
    },
    xAxis: {
      type: "time",
      min: Math.min(...starts),
      max: Math.max(...ends),
      name: chart.xAxisLabel,
      nameLocation: "middle",
      nameGap: 32,
      ...style,
    },
    yAxis: {
      type: "category",
      data: chart.tasks.map((task) => task.label),
      inverse: true,
      name: chart.yAxisLabel,
      ...style,
      splitLine: { show: false },
    },
    series: [
      {
        type: "custom",
        itemStyle: { color: tokens.series[0] ?? tokens.text },
        encode: { x: [1, 2], y: 0 },
        data,
        renderItem: (_params, api) => {
          const row = api.value(0) as number;
          const start = api.coord([api.value(1), row]);
          const end = api.coord([api.value(2), row]);
          const size = api.size?.([0, 1]) as number[] | undefined;
          const height = (size?.[1] ?? 0) * 0.55;
          return {
            type: "rect",
            shape: {
              x: start[0] ?? 0,
              y: (start[1] ?? 0) - height / 2,
              width: Math.max((end[0] ?? 0) - (start[0] ?? 0), 2),
              height,
            },
            style: api.style(),
          };
        },
      },
    ],
  } as EChartsOption;
}

function sankey(chart: Of<"sankey">, ctx: BuildContext): EChartsOption {
  const { tokens } = ctx;
  return {
    ...base(ctx),
    tooltip: {
      ...base(ctx).tooltip,
      trigger: "item",
      valueFormatter: (value) => `${String(value)}${suffix(chart.unit)}`,
    },
    series: [
      {
        type: "sankey",
        left: 8,
        right: "24%",
        top: 16,
        bottom: 16,
        data: chart.nodes.map((name) => ({ name })),
        links: chart.links.map((link) => ({
          source: link.source,
          target: link.target,
          value: link.value,
        })),
        emphasis: { focus: "adjacency" },
        lineStyle: { color: "source", opacity: 0.35, curveness: 0.5 },
        itemStyle: { borderColor: tokens.surface },
        label: { color: tokens.text, fontFamily: tokens.fontFamily },
      },
    ],
  };
}

function gauge(chart: Of<"gauge">, ctx: BuildContext): EChartsOption {
  const { tokens } = ctx;
  const unit = chart.unit ? ` ${chart.unit}` : "";
  const arcWidth = 16;
  return {
    ...base(ctx),
    series: [
      {
        type: "gauge",
        min: chart.min,
        max: chart.max,
        startAngle: 200,
        endAngle: -20,
        radius: "92%",
        splitNumber: 1,
        progress: {
          show: true,
          width: arcWidth,
          itemStyle: { color: tokens.series[0] ?? tokens.text },
        },
        axisLine: { lineStyle: { width: arcWidth, color: [[1, tokens.grid]] } },
        pointer: { show: false },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: { show: true, distance: 24, color: tokens.text },
        title: {
          show: true,
          offsetCenter: [0, "34%"],
          color: tokens.text,
          fontFamily: tokens.fontFamily,
          fontSize: tokens.fontSize,
        },
        detail: {
          valueAnimation: ctx.animate,
          offsetCenter: [0, "-4%"],
          fontFamily: tokens.monoFamily,
          fontSize: Math.round(tokens.fontSize * 2.2),
          fontWeight: "normal",
          color: tokens.text,
          formatter: (value: number) => `${value}${unit}`,
        },
        data: [{ value: chart.value, name: chart.label }],
      },
    ],
  };
}

/** The ECharts option for a chart block, styled with the design tokens. */
export function buildChartOption(chart: Chart, ctx: BuildContext): EChartsOption {
  switch (chart.chartType) {
    case "bar":
    case "line":
    case "stacked-bar":
    case "stacked-area":
    case "radar":
      return multiSeries(chart, ctx);
    case "pie":
    case "donut":
    case "treemap":
    case "funnel":
      return singleSeries(chart, ctx);
    case "scatter":
    case "bubble":
      return pointSeries(chart, ctx);
    case "heatmap":
      return heatmap(chart, ctx);
    case "gantt":
      return gantt(chart, ctx);
    case "sankey":
      return sankey(chart, ctx);
    case "gauge":
      return gauge(chart, ctx);
  }
}

/** The chart's height as a CSS length built from the spacing token. Gantt charts grow with their tasks. */
export function chartHeight(chart: Chart): string {
  const units = chart.chartType === "gantt" ? 24 + chart.tasks.length * 12 : 80;
  return `calc(var(--spacing) * ${units})`;
}

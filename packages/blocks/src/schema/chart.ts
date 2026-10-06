import { z } from "zod";
import { customIssue, PlainText } from "./common";

export const CHART_TYPES = [
  "bar",
  "line",
  "pie",
  "donut",
  "stacked-bar",
  "stacked-area",
  "radar",
  "scatter",
  "bubble",
  "heatmap",
  "gantt",
  "sankey",
  "gauge",
  "treemap",
  "funnel",
] as const;

const base = {
  type: z.literal("chart"),
  title: PlainText,
  description: PlainText,
  unit: PlainText.optional(),
  xAxisLabel: PlainText.optional(),
  yAxisLabel: PlainText.optional(),
  note: PlainText.optional(),
};

const NamedValues = z.strictObject({ name: PlainText, values: z.array(z.number()).min(1) });

function categoryChart<const T extends readonly [string, ...string[]]>(
  chartTypes: T,
  singleSeries: boolean,
) {
  return z
    .strictObject({
      ...base,
      chartType: z.enum(chartTypes),
      labels: z.array(PlainText).min(1),
      series: singleSeries ? z.array(NamedValues).length(1) : z.array(NamedValues).min(1),
    })
    .superRefine((chart, ctx) => {
      chart.series.forEach((series, index) => {
        if (series.values.length !== chart.labels.length) {
          customIssue(
            ctx,
            `has ${series.values.length} values but there are ${chart.labels.length} labels`,
            "Give each series exactly one value per label.",
            ["series", index, "values"],
          );
        }
      });
    });
}

const MultiSeriesChart = categoryChart(
  ["bar", "line", "stacked-bar", "stacked-area", "radar"],
  false,
);
const SingleSeriesChart = categoryChart(["pie", "donut", "treemap", "funnel"], true);

const ScatterChart = z.strictObject({
  ...base,
  chartType: z.literal("scatter"),
  series: z
    .array(
      z.strictObject({
        name: PlainText,
        points: z.array(z.strictObject({ x: z.number(), y: z.number() })).min(1),
      }),
    )
    .min(1),
});

const BubbleChart = z.strictObject({
  ...base,
  chartType: z.literal("bubble"),
  series: z
    .array(
      z.strictObject({
        name: PlainText,
        points: z
          .array(z.strictObject({ x: z.number(), y: z.number(), size: z.number().positive() }))
          .min(1),
      }),
    )
    .min(1),
});

const HeatmapChart = z
  .strictObject({
    ...base,
    chartType: z.literal("heatmap"),
    xLabels: z.array(PlainText).min(1),
    yLabels: z.array(PlainText).min(1),
    values: z.array(z.array(z.number()).min(1)).min(1),
  })
  .superRefine((chart, ctx) => {
    if (chart.values.length !== chart.yLabels.length) {
      customIssue(
        ctx,
        `has ${chart.values.length} rows but there are ${chart.yLabels.length} yLabels`,
        'Give "values" one row for each entry in "yLabels".',
        ["values"],
      );
    }
    chart.values.forEach((row, index) => {
      if (row.length !== chart.xLabels.length) {
        customIssue(
          ctx,
          `has ${row.length} numbers but there are ${chart.xLabels.length} xLabels`,
          'Give each row one number for each entry in "xLabels".',
          ["values", index],
        );
      }
    });
  });

const IsoDate = z.string().superRefine((value, ctx) => {
  const valid =
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    new Date(`${value}T00:00:00Z`).toISOString().startsWith(value);
  if (!valid) {
    customIssue(
      ctx,
      "must be a real date written as YYYY-MM-DD",
      'Write the date like "2026-11-02".',
    );
  }
});

const GanttChart = z.strictObject({
  ...base,
  chartType: z.literal("gantt"),
  tasks: z
    .array(
      z
        .strictObject({ label: PlainText, start: IsoDate, end: IsoDate })
        .superRefine((task, ctx) => {
          if (task.end < task.start) {
            customIssue(
              ctx,
              `is before the start date (${task.start})`,
              'Set "end" on or after "start", or swap the two dates.',
              ["end"],
            );
          }
        }),
    )
    .min(1),
});

const SankeyChart = z
  .strictObject({
    ...base,
    chartType: z.literal("sankey"),
    nodes: z.array(PlainText).min(2),
    links: z
      .array(z.strictObject({ source: PlainText, target: PlainText, value: z.number().positive() }))
      .min(1),
  })
  .superRefine((chart, ctx) => {
    const known = new Set(chart.nodes);
    chart.links.forEach((link, index) => {
      for (const end of ["source", "target"] as const) {
        if (!known.has(link[end])) {
          customIssue(
            ctx,
            `refers to "${link[end]}", which is not in "nodes"`,
            'Add the name to "nodes", or use a name that is already listed there.',
            ["links", index, end],
          );
        }
      }
    });
  });

const GaugeChart = z
  .strictObject({
    ...base,
    chartType: z.literal("gauge"),
    value: z.number(),
    min: z.number(),
    max: z.number(),
    label: PlainText,
  })
  .superRefine((chart, ctx) => {
    if (chart.min >= chart.max) {
      customIssue(ctx, 'must be greater than "min"', 'Set "max" higher than "min".', ["max"]);
    }
  });

export const ChartBlockSchema = z.discriminatedUnion("chartType", [
  MultiSeriesChart,
  SingleSeriesChart,
  ScatterChart,
  BubbleChart,
  HeatmapChart,
  GanttChart,
  SankeyChart,
  GaugeChart,
]);

/** Schema to use for each value of `chartType`, so errors can be reported per chart type. */
export const chartVariants = {
  bar: MultiSeriesChart,
  line: MultiSeriesChart,
  "stacked-bar": MultiSeriesChart,
  "stacked-area": MultiSeriesChart,
  radar: MultiSeriesChart,
  pie: SingleSeriesChart,
  donut: SingleSeriesChart,
  treemap: SingleSeriesChart,
  funnel: SingleSeriesChart,
  scatter: ScatterChart,
  bubble: BubbleChart,
  heatmap: HeatmapChart,
  gantt: GanttChart,
  sankey: SankeyChart,
  gauge: GaugeChart,
} as const;

import type { BlockOf } from "../types";

type Chart = BlockOf<"chart">;

export interface DataTable {
  headers: string[];
  rows: string[][];
}

const withUnit = (value: number, unit: string | undefined) =>
  unit ? `${value} ${unit}` : String(value);

/** The chart's data as a table, for screen readers (it is visually hidden). */
export function chartDataTable(chart: Chart): DataTable {
  const { unit } = chart;
  switch (chart.chartType) {
    case "bar":
    case "line":
    case "stacked-bar":
    case "stacked-area":
    case "radar":
    case "pie":
    case "donut":
    case "treemap":
    case "funnel":
      return {
        headers: ["Label", ...chart.series.map((series) => series.name)],
        rows: chart.labels.map((label, i) => [
          label,
          ...chart.series.map((series) => withUnit(series.values[i] ?? 0, unit)),
        ]),
      };
    case "scatter":
      return {
        headers: ["Series", "x", "y"],
        rows: chart.series.flatMap((series) =>
          series.points.map((p) => [series.name, String(p.x), withUnit(p.y, unit)]),
        ),
      };
    case "bubble":
      return {
        headers: ["Series", "x", "y", "Size"],
        rows: chart.series.flatMap((series) =>
          series.points.map((p) => [series.name, String(p.x), withUnit(p.y, unit), String(p.size)]),
        ),
      };
    case "heatmap":
      return {
        headers: ["Row", ...chart.xLabels],
        rows: chart.yLabels.map((label, y) => [
          label,
          ...chart.xLabels.map((_, x) => withUnit(chart.values[y]?.[x] ?? 0, unit)),
        ]),
      };
    case "gantt":
      return {
        headers: ["Task", "Start", "End"],
        rows: chart.tasks.map((task) => [task.label, task.start, task.end]),
      };
    case "sankey":
      return {
        headers: ["From", "To", "Value"],
        rows: chart.links.map((link) => [link.source, link.target, withUnit(link.value, unit)]),
      };
    case "gauge":
      return {
        headers: [chart.label, "Value", "Minimum", "Maximum"],
        rows: [[chart.label, withUnit(chart.value, unit), String(chart.min), String(chart.max)]],
      };
  }
}

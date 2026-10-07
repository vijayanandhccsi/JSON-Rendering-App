// Everything from ECharts that the chart block needs, in one place. The chart block loads this file
// on demand, so pages without charts never download ECharts.
import {
  BarChart,
  CustomChart,
  FunnelChart,
  GaugeChart,
  HeatmapChart,
  LineChart,
  PieChart,
  RadarChart,
  SankeyChart,
  ScatterChart,
  TreemapChart,
} from "echarts/charts";
import {
  GridComponent,
  LegendComponent,
  RadarComponent,
  TooltipComponent,
  VisualMapComponent,
} from "echarts/components";
import { init, use } from "echarts/core";
import { SVGRenderer } from "echarts/renderers";

use([
  BarChart,
  CustomChart,
  FunnelChart,
  GaugeChart,
  GridComponent,
  HeatmapChart,
  LegendComponent,
  LineChart,
  PieChart,
  RadarChart,
  RadarComponent,
  SankeyChart,
  ScatterChart,
  SVGRenderer,
  TooltipComponent,
  TreemapChart,
  VisualMapComponent,
]);

export { init };
export type { ECharts } from "echarts/core";

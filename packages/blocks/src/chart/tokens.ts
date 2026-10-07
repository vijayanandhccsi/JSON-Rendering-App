/** Colors and text settings for charts, read from the design tokens in tokens.css. */
export interface ChartTokens {
  series: string[];
  low: string;
  surface: string;
  grid: string;
  text: string;
  textMuted: string;
  fontFamily: string;
  monoFamily: string;
  fontSize: number;
}

const CSS_NAMES = {
  s1: "--chart-series-1",
  s2: "--chart-series-2",
  s3: "--chart-series-3",
  low: "--chart-low",
  surface: "--chart-surface",
  grid: "--chart-grid",
  text: "--chart-text",
  textMuted: "--chart-text-muted",
  font: "--chart-font",
  mono: "--chart-font-mono",
  size: "--chart-font-size",
} as const;

/** Share of the white page color mixed into a series color to make its tint. */
const TINT_AMOUNT = 0.55;

function parseHex(color: string): [number, number, number] | null {
  const match = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(color.trim());
  if (!match?.[1]) return null;
  const hex = match[1].length === 3 ? [...match[1]].map((c) => c + c).join("") : match[1];
  return [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16)) as [number, number, number];
}

/** `color` mixed with `into` (both #rrggbb). `amount` is how much of `into` to use, from 0 to 1. */
export function mixColors(color: string, into: string, amount: number): string {
  const a = parseHex(color);
  const b = parseHex(into);
  if (!a || !b) return color;
  const mixed = a.map((channel, i) => Math.round(channel + ((b[i] as number) - channel) * amount));
  return `#${mixed.map((channel) => channel.toString(16).padStart(2, "0")).join("")}`;
}

/** Series colors: the three brand colors first, then a lighter tint of each. */
export function seriesPalette(tokens: Pick<ChartTokens, "series" | "surface">): string[] {
  const base = tokens.series;
  return [...base, ...base.map((color) => mixColors(color, tokens.surface, TINT_AMOUNT))];
}

/** Reads the chart tokens from the page's computed styles. Missing tokens come back empty. */
export function readChartTokens(element: Element = document.documentElement): ChartTokens {
  const style = getComputedStyle(element);
  const read = (name: string) => style.getPropertyValue(name).trim();
  const size = Number.parseFloat(read(CSS_NAMES.size));
  return {
    series: [read(CSS_NAMES.s1), read(CSS_NAMES.s2), read(CSS_NAMES.s3)].filter(Boolean),
    low: read(CSS_NAMES.low),
    surface: read(CSS_NAMES.surface),
    grid: read(CSS_NAMES.grid),
    text: read(CSS_NAMES.text),
    textMuted: read(CSS_NAMES.textMuted),
    fontFamily: read(CSS_NAMES.font),
    monoFamily: read(CSS_NAMES.mono),
    fontSize: Number.isFinite(size) ? size : 13,
  };
}

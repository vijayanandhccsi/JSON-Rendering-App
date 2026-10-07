import { afterEach, describe, expect, it } from "vitest";
import { mixColors, readChartTokens, seriesPalette } from "./tokens";

describe("mixColors", () => {
  it("mixes two colors by the given amount", () => {
    expect(mixColors("#000000", "#ffffff", 0.5)).toBe("#808080");
    expect(mixColors("#102030", "#ffffff", 0)).toBe("#102030");
    expect(mixColors("#102030", "#ffffff", 1)).toBe("#ffffff");
  });

  it("accepts three-digit colors", () => {
    expect(mixColors("#000", "#fff", 1)).toBe("#ffffff");
  });

  it("returns the color unchanged when it cannot read it", () => {
    expect(mixColors("rebeccapurple", "#ffffff", 0.5)).toBe("rebeccapurple");
  });
});

describe("seriesPalette", () => {
  const tokens = { series: ["#e8570a", "#07111f", "#00a86b"], surface: "#ffffff" };

  it("starts with the three brand colors in order, then a lighter tint of each", () => {
    const palette = seriesPalette(tokens);
    expect(palette.slice(0, 3)).toEqual(tokens.series);
    expect(palette).toHaveLength(6);
    expect(palette[3]).toBe(mixColors("#e8570a", "#ffffff", 0.55));
    expect(palette[3]).not.toBe(palette[0]);
  });
});

describe("readChartTokens", () => {
  afterEach(() => document.documentElement.removeAttribute("style"));

  it("reads the chart tokens from the page's CSS variables", () => {
    const root = document.documentElement;
    const values: Record<string, string> = {
      "--chart-series-1": "#111111",
      "--chart-series-2": "#222222",
      "--chart-series-3": "#333333",
      "--chart-low": "#eeeeee",
      "--chart-surface": "#ffffff",
      "--chart-grid": "#dddddd",
      "--chart-text": "#000000",
      "--chart-text-muted": "#555555",
      "--chart-font": "Test Sans",
      "--chart-font-mono": "Test Mono",
      "--chart-font-size": "13px",
    };
    for (const [name, value] of Object.entries(values)) root.style.setProperty(name, value);
    expect(readChartTokens(root)).toEqual({
      series: ["#111111", "#222222", "#333333"],
      low: "#eeeeee",
      surface: "#ffffff",
      grid: "#dddddd",
      text: "#000000",
      textMuted: "#555555",
      fontFamily: "Test Sans",
      monoFamily: "Test Mono",
      fontSize: 13,
    });
  });

  it("falls back to empty values and 13 px text when the tokens are missing", () => {
    const tokens = readChartTokens(document.createElement("div"));
    expect(tokens.series).toEqual([]);
    expect(tokens.fontSize).toBe(13);
  });
});

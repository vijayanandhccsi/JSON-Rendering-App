import { render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BlockRenderer } from "../renderer/BlockRenderer";
import type { Block } from "../schema";

const echarts = vi.hoisted(() => ({
  setOption: vi.fn(),
  resize: vi.fn(),
  dispose: vi.fn(),
  init: vi.fn(),
}));

vi.mock("../chart/echarts-setup", () => ({ init: echarts.init }));

const bar: Block = {
  type: "chart",
  chartType: "bar",
  title: "Ports by protocol",
  description: "Compares the port numbers of four common protocols.",
  labels: ["SSH", "HTTPS"],
  series: [{ name: "Port", values: [22, 443] }],
  yAxisLabel: "Port number",
  note: "Illustrative values",
};

const show = (block: Block) => render(<BlockRenderer block={block} />);

beforeEach(() => {
  echarts.init.mockReset();
  echarts.setOption.mockReset();
  echarts.dispose.mockReset();
  echarts.resize.mockReset();
  echarts.init.mockReturnValue({
    setOption: echarts.setOption,
    resize: echarts.resize,
    dispose: echarts.dispose,
  });
});
afterEach(() => vi.unstubAllGlobals());

describe("chart block", () => {
  it("shows the title and the note, a labelled image for the chart, and a hidden description", () => {
    show(bar);
    expect(screen.getByText("Ports by protocol", { selector: "p" })).toBeVisible();
    expect(screen.getByText("Illustrative values")).toBeVisible();
    const chart = screen.getByRole("img", { name: "Ports by protocol" });
    expect(chart).toHaveAccessibleDescription(
      "Compares the port numbers of four common protocols.",
    );
  });

  it("includes a visually hidden data table with every value", () => {
    show(bar);
    const table = screen.getByRole("table", { name: "Ports by protocol: data" });
    expect(
      within(table)
        .getAllByRole("columnheader")
        .map((cell) => cell.textContent),
    ).toEqual(["Label", "Port"]);
    expect(
      within(table)
        .getAllByRole("row")
        .map((row) => row.textContent),
    ).toEqual(["LabelPort", "SSH22", "HTTPS443"]);
    expect(table).toHaveClass("sr-only");
  });

  it("draws with the SVG renderer into its own container and passes the themed option", async () => {
    show(bar);
    await waitFor(() => expect(echarts.setOption).toHaveBeenCalledTimes(1));
    const [element, theme, options] = echarts.init.mock.calls[0] ?? [];
    expect(element).toBe(screen.getByRole("img", { name: "Ports by protocol" }));
    expect(theme).toBeUndefined();
    expect(options).toEqual({ renderer: "svg" });
    expect(echarts.setOption.mock.calls[0]?.[0]).toMatchObject({
      animation: true,
      series: [{ type: "bar", name: "Port", data: [22, 443] }],
    });
  });

  it("removes the loading text once the chart is drawn", async () => {
    show(bar);
    expect(screen.getByText("Loading chart")).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByText("Loading chart")).toBeNull());
  });

  it("turns animation off when the reader prefers reduced motion", async () => {
    vi.stubGlobal("matchMedia", (query: string) => ({
      matches: query.includes("reduce"),
      media: query,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    }));
    show(bar);
    await waitFor(() => expect(echarts.setOption).toHaveBeenCalled());
    expect(echarts.setOption.mock.calls[0]?.[0]).toMatchObject({ animation: false });
  });

  it("disposes the chart when it is removed", async () => {
    const { unmount } = show(bar);
    await waitFor(() => expect(echarts.setOption).toHaveBeenCalled());
    unmount();
    expect(echarts.dispose).toHaveBeenCalledTimes(1);
  });

  it("does not draw if it is removed before the chart library has loaded", () => {
    const { unmount } = show(bar);
    unmount();
    expect(echarts.dispose).not.toHaveBeenCalled();
  });

  it("shows a clear error, not a blank box, when the chart library fails", async () => {
    echarts.setOption.mockImplementation(() => {
      throw new Error("Invalid option");
    });
    show(bar);
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("This chart cannot be drawn.");
    expect(alert).toHaveTextContent("Invalid option");
    expect(alert).toHaveTextContent("Check the chart data in the JSON.");
    expect(screen.getByText("Ports by protocol", { selector: "p" })).toBeVisible();
    expect(echarts.dispose).toHaveBeenCalled();
  });

  it("shows what is wrong, and how to fix it, when the data does not match the chart type", async () => {
    const broken = { ...bar, series: [{ name: "Port", values: [22] }] } as Block;
    show(broken);
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("This chart cannot be drawn.");
    expect(alert).toHaveTextContent("series[0].values");
    expect(alert).toHaveTextContent("1 values but there are 2 labels");
    expect(alert).toHaveTextContent("Give each series exactly one value per label.");
    expect(echarts.init).not.toHaveBeenCalled();
    expect(screen.queryByRole("img")).toBeNull();
  });

  it.each([
    [
      "a pie chart with two series",
      {
        type: "chart",
        chartType: "pie",
        title: "Share",
        description: "d",
        labels: ["A", "B"],
        series: [
          { name: "x", values: [1, 2] },
          { name: "y", values: [3, 4] },
        ],
      },
      "exactly 1 item",
    ],
    [
      "a sankey link to an unknown node",
      {
        type: "chart",
        chartType: "sankey",
        title: "Flow",
        description: "d",
        nodes: ["A", "B"],
        links: [{ source: "A", target: "C", value: 1 }],
      },
      'refers to "C"',
    ],
    [
      "a gantt task that ends before it starts",
      {
        type: "chart",
        chartType: "gantt",
        title: "Plan",
        description: "d",
        tasks: [{ label: "T", start: "2026-11-09", end: "2026-11-02" }],
      },
      "before the start date",
    ],
    [
      "a heatmap row of the wrong length",
      {
        type: "chart",
        chartType: "heatmap",
        title: "Map",
        description: "d",
        xLabels: ["a", "b"],
        yLabels: ["c"],
        values: [[1]],
      },
      "1 numbers but there are 2 xLabels",
    ],
    [
      "an unknown chart type",
      { type: "chart", chartType: "waterfall", title: "W", description: "d" },
      "must be one of",
    ],
  ])("%s shows an error instead of a blank box", async (_name, block, message) => {
    show(block as unknown as Block);
    expect(await screen.findByRole("alert")).toHaveTextContent(message);
    expect(echarts.init).not.toHaveBeenCalled();
  });
});

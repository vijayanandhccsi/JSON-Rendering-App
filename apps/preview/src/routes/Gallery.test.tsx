import { BLOCK_TYPES, CHART_TYPES } from "@certkraft/blocks";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { App } from "../app/App";
import { GALLERY_GROUPS, galleryEntries } from "./Gallery";

beforeEach(() => {
  localStorage.clear();
  window.history.pushState({}, "", "/gallery");
});
afterEach(() => {
  localStorage.clear();
  window.history.pushState({}, "", "/");
});

describe("gallery sample data", () => {
  const entries = galleryEntries();

  it("groups every block type exactly once", () => {
    const grouped = GALLERY_GROUPS.flatMap((group) => group.types);
    expect([...grouped].sort()).toEqual([...BLOCK_TYPES].sort());
  });

  it("has sample data for every block type", () => {
    for (const type of BLOCK_TYPES)
      expect(
        entries.some((entry) => entry.block.type === type),
        type,
      ).toBe(true);
  });

  it("has a sample for every variant: list styles, drag and drop modes, layouts, timelines, timers, grids and all 15 chart types", () => {
    const ids = entries.map((entry) => entry.id);
    for (const id of [
      "list-bulleted",
      "list-numbered",
      "list-checklist",
      "list-icon",
      "dragdrop-match",
      "dragdrop-order",
      "dragdrop-label",
      "layout-bento",
      "layout-masonry",
      "layout-metro",
      "layout-modular",
      "timeline-vertical",
      "timeline-horizontal",
      "timer-countdown",
      "timer-stopwatch",
      "grid",
      "grid-comparison",
    ]) {
      expect(ids, id).toContain(id);
    }
    for (const type of CHART_TYPES) expect(ids, type).toContain(`chart-${type}`);
  });
});

describe("gallery page", () => {
  it("shows every block under its group, with a menu that links to each", async () => {
    render(<App />);
    expect(
      await screen.findByRole("heading", { level: 1, name: "Block gallery" }),
    ).toBeInTheDocument();
    for (const group of GALLERY_GROUPS)
      expect(screen.getByRole("heading", { level: 2, name: group.name })).toBeInTheDocument();
    for (const type of BLOCK_TYPES) {
      expect(screen.getByRole("heading", { level: 3, name: type })).toBeInTheDocument();
      expect(
        within(screen.getByRole("navigation", { name: "Blocks" })).getByRole("link", {
          name: type,
        }),
      ).toHaveAttribute("href", `#block-${type}`);
      expect(document.getElementById(`block-${type}`)).not.toBeNull();
    }
  });

  it("renders every sample, so a block that crashes is caught here", async () => {
    render(<App />);
    await screen.findByRole("heading", { level: 1, name: "Block gallery" });
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(BLOCK_TYPES.length);
    // A few blocks that are only there when their component drew something real.
    expect(screen.getAllByRole("tab").length).toBeGreaterThan(0);
    expect(screen.getAllByRole("slider").length).toBeGreaterThan(0);
    expect(screen.getAllByRole("timer").length).toBe(2);
    expect(
      screen.getAllByRole("img", { name: /Sample .* chart|Ports by protocol/ }).length,
    ).toBeGreaterThanOrEqual(15);
  });

  it("shows each sample's JSON, which can be copied", async () => {
    const user = userEvent.setup();
    render(<App />);
    await screen.findByRole("heading", { level: 1, name: "Block gallery" });
    const block = galleryEntries().find((entry) => entry.id === "callout")!.block;
    const json = JSON.stringify(block, null, 2);
    expect(screen.getByLabelText("JSON: callout")).toHaveTextContent('"variant": "tip"');
    await user.click(screen.getByRole("button", { name: "Copy JSON: callout" }));
    expect(await navigator.clipboard.readText()).toBe(json);
    expect(await screen.findByText("Copied the block JSON.")).toBeInTheDocument();
  });

  it("shows the samples at the chosen width", async () => {
    const user = userEvent.setup();
    render(<App />);
    await screen.findByRole("heading", { level: 1, name: "Block gallery" });
    const widthOf = () =>
      (
        screen
          .getByRole("heading", { level: 3, name: "paragraph" })
          .closest("section") as HTMLElement
      )
        .querySelector("[style]")!
        .getAttribute("style");
    expect(widthOf()).toContain("width: 390px");
    await user.click(screen.getByRole("radio", { name: /Desktop/ }));
    expect(widthOf()).toContain("width: 1280px");
  });

  it("has a menu for narrow screens too", async () => {
    render(<App />);
    await screen.findByRole("heading", { level: 1, name: "Block gallery" });
    const jump = screen.getByText("Jump to a block").closest("details")!;
    expect(within(jump).getAllByRole("link")).toHaveLength(BLOCK_TYPES.length);
  });
});

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BlockRenderer } from "../renderer/BlockRenderer";
import type { Block } from "../schema";
import { looksLikeCode } from "./Smartsheet";

const show = (block: Block) => render(<BlockRenderer block={block} />);

describe("comparison", () => {
  const block: Block = {
    type: "comparison",
    left: { title: "TCP", points: ["Connection-oriented", "Reliable"] },
    right: { title: "UDP", points: ["Connectionless"] },
  };

  it("is one labelled group with both sides, check icons on every point, and a decorative vs pill", () => {
    const { container } = show(block);
    expect(screen.getByRole("group", { name: "TCP compared with UDP" })).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
    expect(container.querySelectorAll("li svg.lucide-check")).toHaveLength(3);
    expect(screen.getByText("vs")).toHaveAttribute("aria-hidden", "true");
  });

  it("stacks in a narrow column and sits side by side from the md container width", () => {
    const { container } = show(block);
    expect(container.firstElementChild).toHaveClass("@container");
    expect(screen.getByRole("group")).toHaveClass("grid", "@md:grid-cols-2");
    expect(screen.getByText("vs")).toHaveClass("hidden", "@md:block");
  });
});

describe("smartsheet", () => {
  const ports: Block = {
    type: "smartsheet",
    title: "Common ports",
    headers: ["Port", "Protocol"],
    rows: [
      ["22", "SSH"],
      ["443", "HTTPS"],
    ],
  };

  it("is a table inside a keyboard-focusable scroll region named by its title", () => {
    show(ports);
    expect(screen.getByRole("region", { name: "Common ports" })).toHaveAttribute("tabindex", "0");
    expect(screen.getAllByRole("columnheader").map((cell) => cell.textContent)).toEqual([
      "Port",
      "Protocol",
    ]);
    expect(screen.getAllByRole("rowheader").map((cell) => cell.textContent)).toEqual(["22", "443"]);
    expect(screen.getAllByRole("row")).toHaveLength(3);
  });

  it("uses the mono font and a sticky first column when the first column holds ports", () => {
    show(ports);
    expect(screen.getByRole("rowheader", { name: "22" })).toHaveClass(
      "font-mono",
      "sticky",
      "left-0",
    );
  });

  it("does not use mono for ordinary words", () => {
    show({
      type: "smartsheet",
      headers: ["Term", "Meaning"],
      rows: [["Firewall", "Filters traffic"]],
    });
    expect(screen.getByRole("rowheader", { name: "Firewall" })).not.toHaveClass("font-mono");
    expect(screen.getByRole("region", { name: "Table" })).toBeInTheDocument();
  });

  it.each([
    "22",
    "443",
    "8080-8090",
    "53/udp",
    "80, 443",
    "ss -tuln",
    "ping -c 2 host",
    "ip addr show",
    "chmod 755 file",
  ])("treats %j as code", (value) => expect(looksLikeCode(value)).toBe(true));
  it.each(["Firewall", "Secure web traffic", "SSH", "Port", "ping", "Windows 11"])(
    "treats %j as ordinary text",
    (value) => expect(looksLikeCode(value)).toBe(false),
  );
});

describe("grid", () => {
  const items = [
    { icon: "lock", title: "Confidentiality", text: "Only authorized people." },
    { icon: "server", title: "Availability", text: "Reachable when needed.", badge: "Core" },
  ];

  it.each([
    [2, "@md:grid-cols-2"],
    [3, "@2xl:grid-cols-3"],
    [4, "@2xl:grid-cols-4"],
  ] as const)(
    "%i columns use %s and collapse to one column on narrow layouts",
    (columns, className) => {
      show({ type: "grid", variant: "feature", columns, items });
      const list = screen.getByRole("list");
      expect(list).toHaveClass("grid", className);
      expect(list.className).not.toMatch(/(^| )grid-cols-/);
    },
  );

  it("feature variant: icon in a circle, title and text", () => {
    const { container } = show({ type: "grid", variant: "feature", columns: 2, items });
    expect(container.querySelectorAll("li svg")).toHaveLength(2);
    expect(screen.getAllByRole("listitem")[0]).toHaveTextContent(
      "ConfidentialityOnly authorized people.",
    );
  });

  it("comparison variant: badges as pills and no icon circles", () => {
    const { container } = show({ type: "grid", variant: "comparison", columns: 2, items });
    expect(screen.getByText("Core")).toHaveClass("rounded-pill");
    expect(container.querySelectorAll("li svg")).toHaveLength(0);
  });
});

describe("card", () => {
  it("default: a bordered white card with an optional icon", () => {
    const { container } = show({
      type: "card",
      icon: "shield",
      title: "Defense in depth",
      text: "Use layers.",
    });
    expect(container.firstElementChild).toHaveClass("border", "bg-surface");
    expect(container.querySelector("svg.lucide-shield")).not.toBeNull();
    expect(screen.getByText("Use layers.")).toBeVisible();
  });

  it("highlight: a 2 px primary border on a primary tint", () => {
    const { container } = show({ type: "card", variant: "highlight", title: "Remember this" });
    expect(container.firstElementChild).toHaveClass(
      "border-2",
      "border-primary",
      "bg-primary-tint",
    );
  });
});

describe("layout", () => {
  const tiles = [
    { title: "Identify", text: "Know your assets.", tone: "primary" as const },
    { title: "Protect" },
    { title: "Detect", tone: "secondary" as const },
    { title: "Respond", tone: "accent" as const },
  ];
  const tile = (name: string) => screen.getByText(name).closest("li");

  it("bento: with no sizes given, the first tile is the large one", () => {
    show({ type: "layout", variant: "bento", tiles });
    expect(tile("Identify")).toHaveClass("@md:col-span-2", "@md:row-span-2");
    expect(tile("Protect")).not.toHaveClass("@md:col-span-2");
  });

  it("bento: explicit sizes are respected and nothing is forced", () => {
    show({
      type: "layout",
      variant: "bento",
      tiles: [
        { title: "A", size: "small" },
        { title: "B", size: "wide" },
      ],
    });
    expect(tile("A")).not.toHaveClass("@md:col-span-2");
    expect(tile("B")).toHaveClass("@md:col-span-2");
  });

  it("masonry: natural-height tiles in columns", () => {
    show({ type: "layout", variant: "masonry", tiles });
    expect(screen.getByRole("list")).toHaveClass("@md:columns-2");
    expect(tile("Protect")).toHaveClass("break-inside-avoid");
  });

  it("metro: flat rectangles with a radius of at most 4 px and bold titles", () => {
    show({ type: "layout", variant: "metro", tiles });
    expect(tile("Identify")).toHaveClass("rounded-sm");
    expect(tile("Identify")).not.toHaveClass("rounded-card");
    expect(screen.getByText("Identify")).toHaveClass("font-semibold");
  });

  it("modular: a 12-column grid with wide, tall, large and small tiles", () => {
    show({
      type: "layout",
      variant: "modular",
      tiles: [
        { title: "S", size: "small" },
        { title: "W", size: "wide" },
        { title: "T", size: "tall" },
        { title: "L", size: "large" },
      ],
    });
    expect(screen.getByRole("list")).toHaveClass("@md:grid-cols-12");
    expect(tile("S")).toHaveClass("@md:col-span-3");
    expect(tile("W")).toHaveClass("@md:col-span-6");
    expect(tile("T")).toHaveClass("@md:col-span-3", "@md:row-span-2");
    expect(tile("L")).toHaveClass("@md:col-span-6", "@md:row-span-2");
  });

  it("tones: white text only on solid fills that pass AA", () => {
    show({ type: "layout", variant: "metro", tiles });
    expect(tile("Identify")).toHaveClass("bg-primary-strong", "text-surface");
    expect(tile("Detect")).toHaveClass("bg-ink", "text-surface");
    expect(tile("Respond")).toHaveClass("bg-success-strong", "text-surface");
    expect(tile("Protect")).toHaveClass("bg-surface", "text-ink");
  });

  it("stacks every tile in one column on narrow layouts (spans only apply from the md container width)", () => {
    show({ type: "layout", variant: "bento", tiles: [{ title: "A", size: "large" }] });
    expect(tile("A")?.className).not.toMatch(/(^| )(col|row)-span-/);
  });
});

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { BlockRenderer } from "../renderer/BlockRenderer";
import type { Block } from "../schema";

const show = (block: Block) => render(<BlockRenderer block={block} />);

describe("accordion", () => {
  const block: Block = {
    type: "accordion",
    items: [
      { title: "What is NAT?", blocks: [{ type: "paragraph", text: "NAT translates addresses." }] },
      { title: "What is PAT?", blocks: [{ type: "paragraph", text: "PAT maps ports." }] },
    ],
  };

  it("starts closed, with each row a button that says whether it is expanded", () => {
    show(block);
    const buttons = screen.getAllByRole("button");
    expect(buttons.map((button) => button.getAttribute("aria-expanded"))).toEqual([
      "false",
      "false",
    ]);
    expect(screen.queryByText("NAT translates addresses.")).not.toBeVisible();
  });

  it("opens and closes a row with the mouse, and several rows can be open at once", async () => {
    const user = userEvent.setup();
    show(block);
    await user.click(screen.getByRole("button", { name: "What is NAT?" }));
    await user.click(screen.getByRole("button", { name: "What is PAT?" }));
    expect(screen.getByText("NAT translates addresses.")).toBeVisible();
    expect(screen.getByText("PAT maps ports.")).toBeVisible();
    await user.click(screen.getByRole("button", { name: "What is NAT?" }));
    expect(screen.getByRole("button", { name: "What is NAT?" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    expect(screen.getByText("PAT maps ports.")).toBeVisible();
  });

  it("works with Enter and Space, and the button controls its panel", async () => {
    const user = userEvent.setup();
    show(block);
    await user.tab();
    await user.keyboard("{Enter}");
    const first = screen.getByRole("button", { name: "What is NAT?" });
    expect(first).toHaveAttribute("aria-expanded", "true");
    expect(document.getElementById(first.getAttribute("aria-controls") ?? "")).toHaveTextContent(
      "NAT translates addresses.",
    );
    await user.keyboard(" ");
    expect(first).toHaveAttribute("aria-expanded", "false");
  });
});

describe("expandable", () => {
  const block: Block = {
    type: "expandable",
    title: "Go deeper: the handshake",
    blocks: [{ type: "paragraph", text: "SYN, SYN-ACK, ACK." }],
  };

  it("is closed until the header is pressed", async () => {
    const user = userEvent.setup();
    show(block);
    const header = screen.getByRole("button", { name: "Go deeper: the handshake" });
    expect(header).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByText("SYN, SYN-ACK, ACK.")).not.toBeVisible();
    await user.click(header);
    expect(screen.getByText("SYN, SYN-ACK, ACK.")).toBeVisible();
  });
});

describe("tabs", () => {
  const block: Block = {
    type: "tabs",
    tabs: [
      {
        label: "Windows",
        blocks: [{ type: "code", language: "powershell", code: "ipconfig /all" }],
      },
      { label: "Linux", blocks: [{ type: "code", language: "bash", code: "ip addr" }] },
      { label: "macOS", blocks: [{ type: "paragraph", text: "Use ifconfig." }] },
    ],
  };

  it("uses tablist, tab and tabpanel roles, with only the first tab selected", () => {
    show(block);
    const tabs = screen.getAllByRole("tab");
    expect(screen.getByRole("tablist")).toBeInTheDocument();
    expect(tabs.map((tab) => tab.getAttribute("aria-selected"))).toEqual([
      "true",
      "false",
      "false",
    ]);
    expect(tabs.map((tab) => tab.getAttribute("tabindex"))).toEqual(["0", "-1", "-1"]);
    expect(screen.getByRole("tabpanel")).toHaveAccessibleName("Windows");
    expect(screen.getAllByRole("tabpanel", { hidden: true })).toHaveLength(3);
  });

  it("switches tabs with the arrow keys, wrapping around, and with Home and End", async () => {
    const user = userEvent.setup();
    show(block);
    await user.tab();
    expect(screen.getByRole("tab", { name: "Windows" })).toHaveFocus();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Linux" })).toHaveFocus();
    expect(screen.getByRole("tabpanel")).toHaveAccessibleName("Linux");
    await user.keyboard("{ArrowLeft}{ArrowLeft}");
    expect(screen.getByRole("tab", { name: "macOS" })).toHaveFocus();
    await user.keyboard("{Home}");
    expect(screen.getByRole("tab", { name: "Windows" })).toHaveFocus();
    await user.keyboard("{End}");
    expect(screen.getByRole("tab", { name: "macOS" })).toHaveAttribute("aria-selected", "true");
  });

  it("switches tabs by clicking", async () => {
    const user = userEvent.setup();
    show(block);
    await user.click(screen.getByRole("tab", { name: "Linux" }));
    expect(screen.getByRole("tabpanel")).toHaveTextContent("ip addr");
  });
});

describe("flipcard", () => {
  const block: Block = {
    type: "flipcard",
    cards: [
      { front: "SIEM", back: "Collects and correlates logs." },
      { front: "SOAR", back: "Automates incident response." },
    ],
  };

  it("shows one face at a time to screen readers and flips with Enter and Space", async () => {
    const user = userEvent.setup();
    show(block);
    const card = screen.getByRole("button", { name: "SIEM" });
    expect(card).toHaveAttribute("aria-pressed", "false");
    expect(card).toHaveAccessibleDescription("Press to show the definition");
    await user.tab();
    expect(card).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(screen.getByRole("button", { name: "Collects and correlates logs." })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(card).toHaveAccessibleDescription("Press to show the term again");
    await user.keyboard(" ");
    expect(card).toHaveAttribute("aria-pressed", "false");
  });

  it("flips cards independently by clicking", async () => {
    const user = userEvent.setup();
    show(block);
    await user.click(screen.getByRole("button", { name: "SOAR" }));
    expect(
      screen.getByRole("button", { name: "Automates incident response." }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "SIEM" })).toHaveAttribute("aria-pressed", "false");
  });
});

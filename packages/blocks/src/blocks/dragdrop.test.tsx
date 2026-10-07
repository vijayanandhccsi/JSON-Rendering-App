import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { BlockRenderer } from "../renderer/BlockRenderer";
import type { Block } from "../schema";

const show = (block: Block) => render(<BlockRenderer block={block} />);

// dnd-kit adds its own live region for drag announcements; this is the board's own result message.
const status = () => {
  const own = screen
    .getAllByRole("status")
    .filter((element) => !element.id.startsWith("DndLiveRegion"));
  expect(own).toHaveLength(1);
  return own[0] as HTMLElement;
};

describe("dragdrop match", () => {
  const block: Block = {
    type: "dragdrop",
    mode: "match",
    prompt: "Match each protocol to its port.",
    hint: "Think about well-known ports.",
    pairs: [
      { left: "HTTPS", right: "443" },
      { left: "SSH", right: "22" },
      { left: "DNS", right: "53" },
    ],
  };

  const slot = (name: string) => screen.getByRole("button", { name: new RegExp(`^${name}\\.`) });
  const choice = (text: string) => screen.getByRole("button", { name: text });

  it("shows the prompt and hint, every slot empty, and every answer as a choice", () => {
    show(block);
    expect(screen.getByText("Match each protocol to its port.")).toBeVisible();
    expect(screen.getByText(/Think about well-known ports\./)).toBeVisible();
    for (const name of ["HTTPS", "SSH", "DNS"])
      expect(slot(name)).toHaveAccessibleName(new RegExp(`^${name}\\. Empty\\.`));
    expect(["443", "22", "53"].map((text) => choice(text))).toHaveLength(3);
  });

  it("offers the answers in a shuffled order that is the same on every render", () => {
    const names = () =>
      screen.getAllByRole("button", { pressed: false }).map((button) => button.textContent);
    const first = render(<BlockRenderer block={block} />);
    const a = names();
    first.unmount();
    render(<BlockRenderer block={block} />);
    expect(names()).toEqual(a);
    expect(a.join(",")).not.toBe("443,22,53");
  });

  it("places an answer by selecting it and then selecting a slot, with a spoken confirmation", async () => {
    const user = userEvent.setup();
    show(block);
    await user.click(choice("443"));
    expect(choice("443")).toHaveAttribute("aria-pressed", "true");
    expect(slot("HTTPS")).toHaveAccessibleName(/Press to place 443 here/);
    await user.click(slot("HTTPS"));
    expect(slot("HTTPS")).toHaveAccessibleName(
      "HTTPS. Contains 443. Press to return it to the choices.".replace(
        " Press to return it to the choices.",
        " Press to return it to the choices.",
      ),
    );
    expect(status()).toHaveTextContent("Placed 443 in HTTPS.");
    expect(screen.queryByRole("button", { name: "443" })).toBeNull();
  });

  it("returns a placed answer to the choices when its slot is pressed with nothing selected", async () => {
    const user = userEvent.setup();
    show(block);
    await user.click(choice("22"));
    await user.click(slot("SSH"));
    await user.click(slot("SSH"));
    expect(slot("SSH")).toHaveAccessibleName(/Empty\./);
    expect(choice("22")).toBeInTheDocument();
    expect(status()).toHaveTextContent("Returned 22 to the choices.");
  });

  it("swaps: placing into a filled slot sends the old answer back", async () => {
    const user = userEvent.setup();
    show(block);
    await user.click(choice("22"));
    await user.click(slot("SSH"));
    await user.click(choice("53"));
    await user.click(slot("SSH"));
    expect(slot("SSH")).toHaveAccessibleName(/Contains 53\./);
    expect(choice("22")).toBeInTheDocument();
  });

  it("works with the keyboard alone: Tab to a choice, Enter to select, Tab to a slot, Enter to place", async () => {
    const user = userEvent.setup();
    show(block);
    choice("443").focus();
    await user.keyboard("{Enter}");
    expect(choice("443")).toHaveAttribute("aria-pressed", "true");
    slot("HTTPS").focus();
    await user.keyboard("{Enter}");
    expect(slot("HTTPS")).toHaveAccessibleName(/Contains 443\./);
  });

  it("every choice and filled slot has a drag handle with a name", async () => {
    const user = userEvent.setup();
    show(block);
    expect(screen.getByRole("button", { name: "Drag 443" })).toHaveAttribute(
      "aria-roledescription",
      "draggable",
    );
    await user.click(choice("443"));
    await user.click(slot("HTTPS"));
    expect(screen.getByRole("button", { name: "Drag 443" })).toBeInTheDocument();
  });

  it("checks the answers: icons and words, not color alone", async () => {
    const user = userEvent.setup();
    const { container } = show(block);
    for (const [answer, name] of [
      ["443", "HTTPS"],
      ["22", "SSH"],
      ["53", "DNS"],
    ] as const) {
      await user.click(choice(answer));
      await user.click(slot(name));
    }
    await user.click(screen.getByRole("button", { name: "Check" }));
    expect(status()).toHaveTextContent("All 3 correct. Well done.");
    expect(slot("HTTPS")).toHaveAccessibleName(/Correct\./);
    expect(container.querySelectorAll("svg.lucide-circle-check").length).toBeGreaterThanOrEqual(4);
  });

  it("marks wrong answers as incorrect with a message, and editing clears the marks", async () => {
    const user = userEvent.setup();
    const { container } = show(block);
    for (const [answer, name] of [
      ["22", "HTTPS"],
      ["443", "SSH"],
      ["53", "DNS"],
    ] as const) {
      await user.click(choice(answer));
      await user.click(slot(name));
    }
    await user.click(screen.getByRole("button", { name: "Check" }));
    expect(status()).toHaveTextContent(
      "1 of 3 correct. Fix the items marked incorrect, then check again.",
    );
    expect(slot("HTTPS")).toHaveAccessibleName(/Incorrect\./);
    expect(container.querySelectorAll("svg.lucide-circle-x").length).toBeGreaterThanOrEqual(2);
    expect(slot("HTTPS").closest("div.animate-shake")).not.toBeNull();
    await user.click(slot("HTTPS"));
    expect(slot("SSH")).not.toHaveAccessibleName(/Incorrect\./);
  });

  it("resets everything", async () => {
    const user = userEvent.setup();
    show(block);
    await user.click(choice("443"));
    await user.click(slot("HTTPS"));
    await user.click(screen.getByRole("button", { name: "Check" }));
    await user.click(screen.getByRole("button", { name: "Reset" }));
    expect(slot("HTTPS")).toHaveAccessibleName(/Empty\./);
    expect(choice("443")).toBeInTheDocument();
    expect(status()).toHaveTextContent("Cleared.");
  });
});

describe("dragdrop order", () => {
  const items = ["Preparation", "Detection", "Containment", "Recovery"];
  const block: Block = {
    type: "dragdrop",
    mode: "order",
    prompt: "Put the phases in order.",
    items,
  };

  const order = () =>
    screen
      .getAllByRole("listitem")
      .map((li) => items.find((text) => within(li).queryByText(text, { exact: false })) ?? "?");

  it("starts shuffled, never already solved", () => {
    show(block);
    expect(order()).not.toEqual(items);
    expect([...order()].sort()).toEqual([...items].sort());
  });

  it("moves items with the up and down buttons, which are disabled at the ends", async () => {
    const user = userEvent.setup();
    show(block);
    const before = order();
    await user.click(screen.getByRole("button", { name: `Move ${before[1]} up` }));
    expect(order()).toEqual([before[1], before[0], before[2], before[3]]);
    expect(status()).toHaveTextContent(`Moved ${before[1]} to position 1 of 4.`);
    expect(screen.getByRole("button", { name: `Move ${before[1]} up` })).toBeDisabled();
    expect(screen.getAllByRole("button", { name: /down$/ }).at(-1)).toBeDisabled();
  });

  it("each item has a drag handle that says its position", () => {
    show(block);
    expect(screen.getAllByRole("button", { name: /^Drag .*\. Position \d of 4\.$/ })).toHaveLength(
      4,
    );
  });

  async function solve(user: ReturnType<typeof userEvent.setup>) {
    for (let target = 0; target < items.length; target++) {
      while (order()[target] !== items[target]) {
        await user.click(screen.getByRole("button", { name: `Move ${items[target]} up` }));
      }
    }
  }

  it("checks the order: all correct once solved", async () => {
    const user = userEvent.setup();
    show(block);
    await solve(user);
    await user.click(screen.getByRole("button", { name: "Check" }));
    expect(status()).toHaveTextContent("All 4 correct. Well done.");
  });

  it("checks the order: wrong positions are marked with a message and an icon", async () => {
    const user = userEvent.setup();
    const { container } = show(block);
    await user.click(screen.getByRole("button", { name: "Check" }));
    expect(status()).toHaveTextContent(/of 4 correct\. Fix the items marked incorrect/);
    expect(container.querySelectorAll("li svg.lucide-circle-x").length).toBeGreaterThan(0);
    expect(container.querySelectorAll("li .sr-only").length).toBeGreaterThan(0);
  });

  it("resets to the starting order", async () => {
    const user = userEvent.setup();
    show(block);
    const start = order();
    await solve(user);
    await user.click(screen.getByRole("button", { name: "Reset" }));
    expect(order()).toEqual(start);
  });
});

describe("dragdrop label", () => {
  const block: Block = {
    type: "dragdrop",
    mode: "label",
    prompt: "Place each label on the diagram.",
    image: {
      src: "topology.webp",
      alt: "Lab network",
      description: "A router, a firewall and a server.",
    },
    labels: [
      { text: "Firewall", x: 30, y: 40 },
      { text: "Server", x: 80, y: 70 },
    ],
  };

  it("shows numbered positions on the image at the right coordinates", () => {
    show(block);
    const first = screen.getByRole("button", { name: /^Position 1\. Empty\./ });
    expect(first.closest("[style]")).toHaveStyle({ left: "30%", top: "40%" });
    expect(
      screen.getByRole("button", { name: /^Position 2\. Empty\./ }).closest("[style]"),
    ).toHaveStyle({ left: "80%", top: "70%" });
  });

  it("places and checks labels by clicking", async () => {
    const user = userEvent.setup();
    show(block);
    await user.click(screen.getByRole("button", { name: "Firewall" }));
    await user.click(screen.getByRole("button", { name: /^Position 1\./ }));
    await user.click(screen.getByRole("button", { name: "Server" }));
    await user.click(screen.getByRole("button", { name: /^Position 2\./ }));
    await user.click(screen.getByRole("button", { name: "Check" }));
    expect(status()).toHaveTextContent("All 2 correct. Well done.");
  });

  it("marks a label in the wrong position", async () => {
    const user = userEvent.setup();
    show(block);
    await user.click(screen.getByRole("button", { name: "Firewall" }));
    await user.click(screen.getByRole("button", { name: /^Position 2\./ }));
    await user.click(screen.getByRole("button", { name: "Check" }));
    expect(status()).toHaveTextContent("0 of 2 correct.");
    expect(screen.getByRole("button", { name: /^Position 2\./ })).toHaveAccessibleName(
      /Incorrect\./,
    );
  });
});

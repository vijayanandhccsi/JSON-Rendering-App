import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BlockRenderer } from "../renderer/BlockRenderer";
import type { Block } from "../schema";
import { formatClock } from "./Timer";

const show = (block: Block) => render(<BlockRenderer block={block} />);

describe("hotspot", () => {
  const block: Block = {
    type: "hotspot",
    image: {
      src: "net.webp",
      alt: "Office network",
      description: "A router, a firewall and a switch.",
    },
    hotspots: [
      { x: 20, y: 30, title: "Firewall", text: "Filters traffic." },
      { x: 80, y: 80, title: "Switch", text: "Connects servers." },
    ],
  };

  it("has a numbered, labelled button for every hotspot at its position", () => {
    show(block);
    const first = screen.getByRole("button", { name: "1. Firewall" });
    expect(first).toHaveAttribute("aria-expanded", "false");
    expect(first.parentElement).toHaveStyle({ left: "20%", top: "30%" });
    expect(screen.getByRole("button", { name: "2. Switch" }).parentElement).toHaveStyle({
      left: "80%",
      top: "80%",
    });
  });

  it("opens a dialog with the title and text, and moves focus into it", async () => {
    const user = userEvent.setup();
    show(block);
    await user.click(screen.getByRole("button", { name: "1. Firewall" }));
    const dialog = screen.getByRole("dialog", { name: "Firewall" });
    expect(dialog).toHaveTextContent("Filters traffic.");
    expect(dialog).toHaveFocus();
    expect(screen.getByRole("button", { name: "1. Firewall" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
  });

  it("closes with Escape and returns focus to the hotspot", async () => {
    const user = userEvent.setup();
    show(block);
    await user.click(screen.getByRole("button", { name: "2. Switch" }));
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.getByRole("button", { name: "2. Switch" })).toHaveFocus();
  });

  it("closes with the Close button (focus returns) and when clicking elsewhere", async () => {
    const user = userEvent.setup();
    show(block);
    await user.click(screen.getByRole("button", { name: "1. Firewall" }));
    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.getByRole("button", { name: "1. Firewall" })).toHaveFocus();
    await user.click(screen.getByRole("button", { name: "1. Firewall" }));
    await user.click(document.body);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("shows one popover at a time and toggles on a second press", async () => {
    const user = userEvent.setup();
    show(block);
    await user.click(screen.getByRole("button", { name: "1. Firewall" }));
    await user.click(screen.getByRole("button", { name: "2. Switch" }));
    expect(screen.getAllByRole("dialog")).toHaveLength(1);
    expect(screen.getByRole("dialog")).toHaveAccessibleName("Switch");
    await user.click(screen.getByRole("button", { name: "2. Switch" }));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("opens the popover towards the middle of the image so it stays inside it", async () => {
    const user = userEvent.setup();
    show(block);
    await user.click(screen.getByRole("button", { name: "1. Firewall" }));
    expect(screen.getByRole("dialog")).toHaveClass("left-0", "top-full");
    await user.click(screen.getByRole("button", { name: "2. Switch" }));
    expect(screen.getByRole("dialog")).toHaveClass("right-0", "bottom-full");
  });

  it("stops the pulse while a popover is open (and the pulse stops for reduced motion in CSS)", async () => {
    const user = userEvent.setup();
    const { container } = show(block);
    expect(container.querySelectorAll(".animate-ping")).toHaveLength(2);
    await user.click(screen.getByRole("button", { name: "1. Firewall" }));
    expect(container.querySelectorAll(".animate-ping")).toHaveLength(1);
  });
});

describe("beforeafter", () => {
  const block: Block = {
    type: "beforeafter",
    before: {
      src: "wrong.webp",
      alt: "Misconfigured ACL",
      description: "Allows everything.",
      label: "Misconfigured",
    },
    after: { src: "right.webp", alt: "Correct ACL", description: "Allows only what is needed." },
  };

  it("has a labelled range slider that starts in the middle", () => {
    show(block);
    const slider = screen.getByRole("slider", {
      name: "Comparison slider: Misconfigured on the left, After on the right",
    });
    expect(slider).toHaveValue("50");
    expect(slider).toHaveAttribute("aria-valuetext", "50% Misconfigured, 50% After");
  });

  it("shows both images with alt text and descriptions, and the labels as pills", () => {
    show(block);
    expect(screen.getByAltText("Misconfigured ACL")).toHaveAccessibleDescription(
      "Allows everything.",
    );
    expect(screen.getByAltText("Correct ACL")).toHaveAccessibleDescription(
      "Allows only what is needed.",
    );
    expect(screen.getByText("Misconfigured")).toBeInTheDocument();
    expect(screen.getByText("After", { selector: "span[aria-hidden]" })).toBeInTheDocument();
  });

  it("reveals more of the before image as the slider moves, and is a focusable native range input", () => {
    show(block);
    const slider = screen.getByRole("slider");
    expect(screen.getByAltText("Misconfigured ACL")).toHaveStyle({ clipPath: "inset(0 50% 0 0)" });
    fireEvent.change(slider, { target: { value: "80" } });
    expect(screen.getByAltText("Misconfigured ACL")).toHaveStyle({ clipPath: "inset(0 20% 0 0)" });
    // Arrow keys, Home and End are handled by the browser for a native range input.
    slider.focus();
    expect(slider).toHaveFocus();
    expect(slider).toHaveAttribute("min", "0");
    expect(slider).toHaveAttribute("max", "100");
    expect(slider).toHaveAttribute("step", "1");
    expect(slider).not.toHaveAttribute("tabindex", "-1");
  });

  it("falls back to two placeholders when an image file is missing", () => {
    show(block);
    fireEvent.error(screen.getByAltText("Correct ACL"));
    expect(screen.queryByRole("slider")).toBeNull();
    // Each image is now shown on its own, and a missing file shows the placeholder.
    screen.getAllByRole("img").forEach((image) => fireEvent.error(image));
    expect(screen.getAllByText(/Image file not found/)).toHaveLength(2);
    expect(screen.getByText("Misconfigured")).toBeInTheDocument();
  });
});

describe("kanban", () => {
  const block: Block = {
    type: "kanban",
    columns: [
      {
        title: "Learned",
        cards: [{ title: "IP addressing", text: "Addresses and masks" }, { title: "DNS" }],
      },
      { title: "Practicing", cards: [{ title: "Subnetting" }] },
      { title: "Mastered", cards: [] },
    ],
  };

  it("shows each column with its title and card count, in a focusable scroll region", () => {
    show(block);
    expect(screen.getByRole("region", { name: /Board/ })).toHaveAttribute("tabindex", "0");
    expect(screen.getByRole("region", { name: "Learned" })).toHaveTextContent("Cards: 2");
    expect(screen.getByRole("region", { name: "Practicing" })).toHaveTextContent("Cards: 1");
    expect(screen.getByRole("region", { name: "Mastered" })).toHaveTextContent("Cards: 0");
  });

  it("lists the cards with optional text, and says when a column is empty", () => {
    show(block);
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
    expect(screen.getByText("Addresses and masks")).toBeVisible();
    expect(screen.getByRole("region", { name: "Mastered" })).toHaveTextContent("No cards");
  });
});

describe("timer", () => {
  afterEach(() => vi.useRealTimers());

  it.each([
    [0, "00:00"],
    [5, "00:05"],
    [59, "00:59"],
    [60, "01:00"],
    [3599, "59:59"],
    [3661, "1:01:01"],
    [-4, "00:00"],
  ])("formats %i seconds as %s", (seconds, text) => expect(formatClock(seconds)).toBe(text));

  const countdown: Block = {
    type: "timer",
    mode: "countdown",
    seconds: 3,
    label: "Lab time",
    message: "Time is up. Review your answers.",
  };

  // Fake timers do not mix with user-event's own delays, so buttons are pressed with fireEvent.
  const press = (name: string) => fireEvent.click(screen.getByRole("button", { name }));

  function setup(block: Block) {
    vi.useFakeTimers();
    show(block);
  }

  it("is a labelled timer showing the full time, with Start enabled and Reset disabled", () => {
    setup(countdown);
    expect(screen.getByRole("timer", { name: "Lab time" })).toHaveTextContent("00:03");
    expect(screen.getByRole("button", { name: "Start" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Reset" })).toBeDisabled();
  });

  it("counts down, pauses, resumes and finishes with the message and a success tint", () => {
    setup(countdown);
    press("Start");
    act(() => vi.advanceTimersByTime(1000));
    expect(screen.getByRole("timer")).toHaveTextContent("00:02");

    press("Pause");
    act(() => vi.advanceTimersByTime(5000));
    expect(screen.getByRole("timer")).toHaveTextContent("00:02");

    press("Resume");
    act(() => vi.advanceTimersByTime(2500));
    expect(screen.getByRole("timer")).toHaveTextContent("00:00");
    expect(screen.getByRole("status")).toHaveTextContent("Time is up. Review your answers.");
    expect(screen.getByRole("timer").closest(".bg-success-tint")).not.toBeNull();
    expect(screen.getByRole("button", { name: "Resume" })).toBeDisabled();
  });

  it("resets to the full time and clears the message", () => {
    setup(countdown);
    press("Start");
    act(() => vi.advanceTimersByTime(4000));
    press("Reset");
    expect(screen.getByRole("timer")).toHaveTextContent("00:03");
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
    expect(screen.getByRole("button", { name: "Start" })).toBeEnabled();
  });

  it("counts up in timer mode and never finishes", () => {
    setup({ type: "timer", mode: "timer", label: "Practice run" });
    expect(screen.getByRole("timer", { name: "Practice run" })).toHaveTextContent("00:00");
    press("Start");
    act(() => vi.advanceTimersByTime(65_000));
    expect(screen.getByRole("timer")).toHaveTextContent("01:05");
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
  });

  it("uses a default message when none is given", () => {
    setup({ type: "timer", mode: "countdown", seconds: 1 });
    press("Start");
    act(() => vi.advanceTimersByTime(1500));
    expect(screen.getByRole("status")).toHaveTextContent("Time is up.");
  });
});

describe("scenario", () => {
  const block: Block = {
    type: "scenario",
    title: "Suspicious login",
    situation: "You see an admin login at 3 a.m. from an unfamiliar country.",
    question: "What do you do first?",
    options: [
      {
        text: "Ignore it until morning",
        correct: false,
        feedback: "A possible compromise needs a prompt response.",
      },
      {
        text: "Follow the incident response plan",
        correct: true,
        feedback: "Start the documented process.",
      },
    ],
  };

  it("shows the Scenario pill, title, situation, question and every option", () => {
    show(block);
    expect(screen.getByText("Scenario")).toBeVisible();
    expect(screen.getByText("Suspicious login")).toBeVisible();
    expect(screen.getByRole("group", { name: "What do you do first?" })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /Ignore|Follow/ })).toHaveLength(2);
  });

  it("a wrong choice shows an icon, the words Not quite, and the feedback; the other options lock", async () => {
    const user = userEvent.setup();
    const { container } = show(block);
    await user.click(screen.getByRole("button", { name: "Ignore it until morning" }));
    const status = screen.getByRole("status");
    expect(status).toHaveTextContent("Not quite. A possible compromise needs a prompt response.");
    expect(status).toHaveFocus();
    expect(container.querySelectorAll("svg.lucide-circle-x")).toHaveLength(2);
    expect(
      screen.getByRole("button", { name: "Follow the incident response plan" }),
    ).toHaveAttribute("aria-disabled", "true");
    await user.click(screen.getByRole("button", { name: "Follow the incident response plan" }));
    expect(status).toHaveTextContent("Not quite.");
  });

  it("a correct choice shows Correct with a check icon", async () => {
    const user = userEvent.setup();
    const { container } = show(block);
    await user.click(screen.getByRole("button", { name: "Follow the incident response plan" }));
    expect(screen.getByRole("status")).toHaveTextContent("Correct. Start the documented process.");
    expect(container.querySelectorAll("svg.lucide-circle-check")).toHaveLength(2);
  });

  it("does not give away the correct option after a wrong choice", async () => {
    const user = userEvent.setup();
    const { container } = show(block);
    await user.click(screen.getByRole("button", { name: "Ignore it until morning" }));
    expect(container.querySelectorAll("svg.lucide-circle-check")).toHaveLength(0);
  });

  it("Try again clears the answer and moves focus to the first option", async () => {
    const user = userEvent.setup();
    show(block);
    await user.click(screen.getByRole("button", { name: "Ignore it until morning" }));
    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
    expect(screen.queryByRole("button", { name: "Try again" })).toBeNull();
    expect(screen.getByRole("button", { name: "Ignore it until morning" })).toHaveFocus();
    await user.click(screen.getByRole("button", { name: "Follow the incident response plan" }));
    expect(screen.getByRole("status")).toHaveTextContent("Correct.");
  });

  it("works from the keyboard", async () => {
    const user = userEvent.setup();
    show(block);
    screen.getByRole("button", { name: "Follow the incident response plan" }).focus();
    await user.keyboard("{Enter}");
    expect(screen.getByRole("status")).toHaveTextContent("Correct.");
  });
});

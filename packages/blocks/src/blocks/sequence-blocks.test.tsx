import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BlockRenderer } from "../renderer/BlockRenderer";
import type { Block } from "../schema";

const show = (block: Block) => render(<BlockRenderer block={block} />);

describe("timeline", () => {
  const steps = [
    { label: "Step 1", title: "Identify", text: "Detect the incident." },
    { title: "Contain", text: "Limit the damage." },
  ];

  it("vertical: an ordered list with numbered dots, labels, titles and text", () => {
    const { container } = show({ type: "timeline", orientation: "vertical", steps });
    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(2);
    expect(container.querySelector("ol")).not.toBeNull();
    expect(items[0]).toHaveTextContent("1Step 1IdentifyDetect the incident.");
    expect(items[1]).toHaveTextContent("2ContainLimit the damage.");
  });

  it("horizontal: a keyboard-focusable scroll region with a visible scroll hint", () => {
    show({ type: "timeline", orientation: "horizontal", steps });
    expect(screen.getByRole("region", { name: /scrolls sideways/ })).toHaveAttribute(
      "tabindex",
      "0",
    );
    expect(screen.getByText("Scroll sideways to see all 2 steps")).toBeVisible();
  });

  it("horizontal: no scroll hint for a single step", () => {
    show({ type: "timeline", orientation: "horizontal", steps: steps.slice(0, 1) });
    expect(screen.queryByText(/Scroll sideways/)).toBeNull();
  });
});

// Embla measures layout, which jsdom does not have, so it is replaced by a small fake that keeps
// a selected index and tells listeners when it changes. The real library is used in the browser.
const embla = vi.hoisted(() => ({
  selected: 0,
  listeners: new Set<() => void>(),
  scrollTo: vi.fn(),
}));

vi.mock("embla-carousel-react", () => ({
  default: () => {
    const api = {
      selectedScrollSnap: () => embla.selected,
      scrollTo: (index: number, jump?: boolean) => {
        embla.scrollTo(index, jump);
        embla.selected = index;
        embla.listeners.forEach((listener) => listener());
      },
      on(_event: string, listener: () => void) {
        embla.listeners.add(listener);
        return api;
      },
      off(_event: string, listener: () => void) {
        embla.listeners.delete(listener);
        return api;
      },
    };
    return [() => undefined, api];
  },
}));

describe("carousel", () => {
  const block: Block = {
    type: "carousel",
    slides: [
      {
        title: "Open the console",
        text: "Sign in.",
        image: { src: "console.webp", alt: "Console", description: "The console home page." },
      },
      { text: "Choose a region." },
      { title: "Done", text: "Deploy." },
    ],
  };

  beforeEach(() => {
    embla.selected = 0;
    embla.listeners.clear();
    embla.scrollTo.mockClear();
  });
  afterEach(() => vi.unstubAllGlobals());

  it("is a labelled carousel region of numbered slides, with only the current slide exposed", () => {
    show(block);
    expect(screen.getByRole("region", { name: "Slides" })).toHaveAttribute(
      "aria-roledescription",
      "carousel",
    );
    const slides = screen.getAllByRole("group", { hidden: true });
    expect(slides.map((slide) => slide.getAttribute("aria-label"))).toEqual([
      "1 / 3",
      "2 / 3",
      "3 / 3",
    ]);
    expect(slides.map((slide) => slide.getAttribute("aria-hidden"))).toEqual([
      "false",
      "true",
      "true",
    ]);
    expect(screen.getByRole("status")).toHaveTextContent("Slide 1 of 3");
  });

  it("moves with the previous and next buttons, which are disabled at the ends", async () => {
    const user = userEvent.setup();
    show(block);
    const previous = screen.getByRole("button", { name: "Previous slide" });
    const next = screen.getByRole("button", { name: "Next slide" });
    expect(previous).toBeDisabled();
    await user.click(next);
    expect(screen.getByRole("status")).toHaveTextContent("Slide 2 of 3");
    expect(previous).toBeEnabled();
    await user.click(next);
    expect(next).toBeDisabled();
    await user.click(previous);
    expect(screen.getByRole("status")).toHaveTextContent("Slide 2 of 3");
  });

  it("moves with the arrow keys and the dot buttons", async () => {
    const user = userEvent.setup();
    show(block);
    await user.click(screen.getByRole("button", { name: "Go to slide 3" }));
    expect(screen.getByRole("button", { name: "Go to slide 3" })).toHaveAttribute(
      "aria-current",
      "true",
    );
    await user.keyboard("{ArrowLeft}");
    expect(screen.getByRole("status")).toHaveTextContent("Slide 2 of 3");
    await user.keyboard("{ArrowRight}{ArrowRight}");
    expect(screen.getByRole("status")).toHaveTextContent("Slide 3 of 3");
  });

  it("slides normally, and jumps without animation when the reader prefers reduced motion", async () => {
    const user = userEvent.setup();
    const { unmount } = show(block);
    await user.click(screen.getByRole("button", { name: "Next slide" }));
    expect(embla.scrollTo).toHaveBeenLastCalledWith(1, false);
    unmount();

    vi.stubGlobal("matchMedia", (query: string) => ({
      matches: query.includes("reduce"),
      media: query,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    }));
    embla.selected = 0;
    show(block);
    await act(async () => {
      await user.click(screen.getByRole("button", { name: "Next slide" }));
    });
    expect(embla.scrollTo).toHaveBeenLastCalledWith(1, true);
  });

  it("shows the slide image, title and text", () => {
    show(block);
    expect(screen.getByText("Open the console")).toBeInTheDocument();
    expect(screen.getByText("Sign in.")).toBeInTheDocument();
    expect(document.querySelector("img")).toHaveAttribute("alt", "Console");
  });
});

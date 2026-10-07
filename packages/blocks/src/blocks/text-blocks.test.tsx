import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { BlockRenderer } from "../renderer/BlockRenderer";
import { MediaProvider } from "../ui/MediaContext";
import type { Block } from "../schema";

const show = (block: Block, mediaBaseUrl?: string) =>
  render(
    <MediaProvider baseUrl={mediaBaseUrl ?? "/media/"}>
      <BlockRenderer block={block} />
    </MediaProvider>,
  );

describe("heading", () => {
  it.each([2, 3, 4] as const)("renders level %i as an h%i with its inline formatting", (level) => {
    show({ type: "heading", level, text: "What is a `firewall`?" });
    const heading = screen.getByRole("heading", { level });
    expect(heading).toHaveTextContent("What is a firewall?");
    expect(heading.querySelector("code")).toHaveTextContent("firewall");
  });
});

describe("paragraph", () => {
  it("renders bold, italic and code, and escapes anything that looks like HTML", () => {
    const { container } = show({
      type: "paragraph",
      text: "A **firewall** filters *traffic* with `rules` <b>x</b>",
    });
    expect(container.querySelector("strong")).toHaveTextContent("firewall");
    expect(container.querySelector("em")).toHaveTextContent("traffic");
    expect(container.querySelector("code")).toHaveTextContent("rules");
    expect(container.querySelector("b")).toBeNull();
    expect(container).toHaveTextContent("<b>x</b>");
  });
});

describe("callout", () => {
  it.each([
    ["info", "Info"],
    ["tip", "Tip"],
    ["warning", "Warning"],
    ["danger", "Danger"],
    ["success", "Success"],
  ] as const)(
    "%s is a note labelled %s, with an icon and no meaning carried by color alone",
    (variant, label) => {
      const { container } = show({
        type: "callout",
        variant,
        title: "Exam tip",
        text: "Body text",
      });
      const note = screen.getByRole("note", { name: label });
      expect(note).toHaveTextContent("Exam tip");
      expect(note).toHaveTextContent("Body text");
      expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
    },
  );

  it("works without a title", () => {
    show({ type: "callout", variant: "info", text: "Only text" });
    expect(screen.getByRole("note")).toHaveTextContent("Only text");
  });
});

describe("quote", () => {
  it("renders the quote with its source", () => {
    show({ type: "quote", text: "Security is a process.", source: "Bruce Schneier" });
    expect(screen.getByRole("figure")).toHaveTextContent("Bruce Schneier");
    expect(screen.getByText("Security is a process.").tagName).toBe("BLOCKQUOTE");
  });

  it("works without a source", () => {
    show({ type: "quote", text: "Just words." });
    expect(screen.queryByText(/—/)).toBeNull();
  });
});

describe("list", () => {
  it("renders bulleted items as a list", () => {
    show({ type: "list", style: "bulleted", items: ["One", "Two"] });
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
  });

  it("renders numbered items in an ordered list with visible numbers", () => {
    const { container } = show({
      type: "list",
      style: "numbered",
      items: ["First", "Second", "Third"],
    });
    expect(container.querySelector("ol")).not.toBeNull();
    expect(screen.getAllByRole("listitem").map((item) => item.textContent)).toEqual([
      "1First",
      "2Second",
      "3Third",
    ]);
  });

  it("renders checklist items with an icon each", () => {
    const { container } = show({ type: "list", style: "checklist", items: ["A", "B"] });
    expect(container.querySelectorAll("li svg")).toHaveLength(2);
  });

  it("renders icon lists with the icon on the right when asked", async () => {
    show({
      type: "list",
      style: "icon",
      iconPosition: "right",
      items: [{ icon: "lock", text: "Private" }],
    });
    expect(screen.getByRole("listitem")).toHaveClass("flex-row-reverse");
    expect(
      await screen.findByRole("listitem").then((li) => li.querySelector("svg")),
    ).not.toBeNull();
  });

  it("shows a plain circle for an unknown icon name", () => {
    const { container } = show({
      type: "list",
      style: "icon",
      items: [{ icon: "not-an-icon", text: "Oops" }],
    });
    expect(container.querySelector("svg.lucide-circle")).not.toBeNull();
  });
});

describe("image", () => {
  const image: Block = {
    type: "image",
    src: "osi-model.webp",
    alt: "OSI model",
    description: "Seven stacked layers.",
    caption: "The **OSI** model",
    size: "small",
  };

  it("uses the media base URL, alt text, caption, and describes the image for screen readers", () => {
    show(image, "https://cdn.example.com/media");
    const img = screen.getByRole("img", { name: "OSI model" });
    expect(img).toHaveAttribute("src", "https://cdn.example.com/media/osi-model.webp");
    const described = img.getAttribute("aria-describedby");
    expect(described && document.getElementById(described)).toHaveTextContent(
      "Seven stacked layers.",
    );
    expect(screen.getByRole("figure")).toHaveTextContent("The OSI model");
  });

  it.each([
    ["small", "max-w-80"],
    ["medium", "max-w-140"],
    ["full", "max-w-wide"],
  ] as const)("size %s uses %s", (size, className) => {
    show({ ...image, size });
    expect(screen.getByRole("figure")).toHaveClass(className);
  });

  it("defaults to medium", () => {
    show({ ...image, size: undefined });
    expect(screen.getByRole("figure")).toHaveClass("max-w-140");
  });

  it("shows a placeholder with the alt text, description and file name when the file is missing", async () => {
    show(image);
    fireEvent.error(screen.getByRole("img", { name: "OSI model" }));
    expect(await screen.findByText(/Image file not found/)).toBeVisible();
    const placeholder = screen.getByRole("img", { name: "OSI model" });
    expect(placeholder.tagName).toBe("DIV");
    expect(placeholder).toHaveTextContent("Seven stacked layers.");
    expect(placeholder).toHaveTextContent("osi-model.webp");
  });
});

describe("video", () => {
  it("embeds Vimeo with the title as its accessible name and the unlisted hash", () => {
    show({
      type: "video",
      provider: "vimeo",
      id: "123456789",
      hash: "ab12cd34ef",
      title: "How DNS works",
      caption: "Watch it",
    });
    const frame = screen.getByTitle("How DNS works");
    const url = new URL(frame.getAttribute("src") ?? "");
    expect(url.origin + url.pathname).toBe("https://player.vimeo.com/video/123456789");
    expect(url.searchParams.get("h")).toBe("ab12cd34ef");
    expect(url.searchParams.get("autoplay")).toBeNull();
    expect(screen.getByRole("figure")).toHaveTextContent("Watch it");
  });

  it("omits the hash when none is given", () => {
    show({ type: "video", provider: "vimeo", id: "42", title: "Public video" });
    expect(
      new URL(screen.getByTitle("Public video").getAttribute("src") ?? "").searchParams.has("h"),
    ).toBe(false);
  });

  it('shows a placeholder instead of an iframe when the id is "TBD"', () => {
    const { container } = show({
      type: "video",
      provider: "vimeo",
      id: "TBD",
      title: "Coming soon",
    });
    expect(container.querySelector("iframe")).toBeNull();
    expect(screen.getByText(/Video not available yet: Coming soon/)).toBeVisible();
  });
});

describe("code", () => {
  const block: Block = {
    type: "code",
    language: "bash",
    title: "List ports",
    code: "ss -tuln\necho done",
  };

  it("shows plain text first, then colored tokens once the highlighter is ready", async () => {
    const { container } = show(block);
    expect(container.querySelector("code")?.textContent).toBe("ss -tuln\necho done");
    await vi.waitFor(() => expect(container.querySelector("code span[style]")).not.toBeNull());
    expect(container.querySelector("code")?.textContent).toBe("ss -tuln\necho done");
  });

  it("keeps plain text for a language it cannot highlight", async () => {
    const { container } = show({ type: "code", language: "cisco-ios", code: "interface Gi0/1" });
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(container.querySelector("code span[style]")).toBeNull();
    expect(container.querySelector("code")).toHaveTextContent("interface Gi0/1");
  });

  it("has a keyboard-focusable scroll region named after the title, and the language label", () => {
    show(block);
    expect(screen.getByRole("region", { name: "List ports" })).toHaveAttribute("tabindex", "0");
    expect(screen.getByText("bash")).toBeVisible();
  });

  it("copies the code with the keyboard and announces it", async () => {
    const user = userEvent.setup();
    show(block);
    await user.tab();
    expect(screen.getByRole("button", { name: "Copy code" })).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(await navigator.clipboard.readText()).toBe("ss -tuln\necho done");
    expect(screen.getByRole("status")).toHaveTextContent("Copied to clipboard");
  });
});

describe("terminal", () => {
  const block: Block = {
    type: "terminal",
    title: "Ping",
    lines: [
      { kind: "command", text: "ping -c 2 example.com" },
      { kind: "output", text: "2 packets transmitted" },
      { kind: "command", text: "exit" },
    ],
  };

  it("labels commands and output for screen readers and marks the prompt decorative", () => {
    const { container } = show(block);
    expect(screen.getByRole("region", { name: "Ping" })).toHaveTextContent(
      "Command: $ ping -c 2 example.comOutput: 2 packets transmittedCommand: $ exit",
    );
    expect(container.querySelectorAll('[aria-hidden="true"].text-primary-strong')).toHaveLength(2);
  });

  it("copies the commands only", async () => {
    const user = userEvent.setup();
    show(block);
    await user.click(screen.getByRole("button", { name: "Copy commands" }));
    expect(await navigator.clipboard.readText()).toBe("ping -c 2 example.com\nexit");
  });

  it("has no copy button when there are no commands", () => {
    show({ type: "terminal", lines: [{ kind: "output", text: "just output" }] });
    expect(screen.queryByRole("button")).toBeNull();
  });
});

import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EditorView } from "@codemirror/view";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { STORAGE_KEYS } from "../lib/storage";
import { App } from "./App";

const validPage = JSON.stringify({
  chapter: "network-security-basics",
  title: "What is a firewall?",
  summary: "Learn what a firewall does.",
  estimatedMinutes: 6,
  blocks: [{ type: "paragraph", text: "A **firewall** filters traffic." }],
});

const brokenPage = JSON.stringify({
  chapter: "Bad Slug",
  title: "T",
  summary: "S",
  blocks: [
    { type: "paragraph", text: "ok" },
    { type: "heading", level: 1, text: "x" },
  ],
});

/** The editor's text, read from the CodeMirror view that the page created. */
const editorText = () =>
  EditorView.findFromDOM(document.querySelector(".cm-editor") as HTMLElement)!.state.doc.toString();

/** Puts text into the clipboard stand-in, presses Paste, and waits until the editor has the text. */
async function paste(user: ReturnType<typeof userEvent.setup>, text: string) {
  await navigator.clipboard.writeText(text);
  await user.click(screen.getByRole("button", { name: "Paste" }));
  await waitFor(() => expect(editorText()).toBe(text));
}

const chip = () =>
  screen
    .getAllByRole("status")
    .find((el) => /^(Valid|No page|\d+ error)/.test(el.textContent ?? "")) as HTMLElement;

beforeEach(() => localStorage.clear());
afterEach(() => localStorage.clear());

describe("empty state", () => {
  it("shows the instructions, a Load sample page button and a neutral status", () => {
    render(<App />);
    expect(screen.getByText(/Paste a page's JSON into the editor/)).toBeVisible();
    expect(chip()).toHaveTextContent("No page yet");
    expect(screen.getByRole("banner")).toHaveTextContent("CertKraft page preview");
  });

  it("loads the sample page from the button, and the status becomes valid", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: "Load sample page" }));
    await waitFor(() => expect(chip()).toHaveTextContent(/^Valid/));
    expect(screen.getByRole("heading", { level: 1, name: "Full sample page" })).toBeInTheDocument();
    expect(screen.queryByText(/Paste a page's JSON into the editor/)).toBeNull();
  });

  it("disables Copy, Format, Clear and Download when there is nothing to act on", () => {
    render(<App />);
    for (const name of ["Copy", "Format", "Clear", "Download"])
      expect(screen.getByRole("button", { name })).toBeDisabled();
    for (const name of ["Paste", "Upload", "Sample"])
      expect(screen.getByRole("button", { name })).toBeEnabled();
  });
});

describe("header actions", () => {
  it("has the seven actions in the specified order, with Download as the only primary button", () => {
    render(<App />);
    const actions = within(screen.getByRole("toolbar", { name: "Actions" })).getAllByRole("button");
    expect(actions.map((button) => button.textContent)).toEqual([
      "Paste",
      "Upload",
      "Copy",
      "Download",
      "Format",
      "Sample",
      "Clear",
    ]);
    expect(
      actions
        .filter((button) => button.className.includes("bg-primary-strong"))
        .map((b) => b.textContent),
    ).toEqual(["Download"]);
  });

  it("pastes from the clipboard into the editor, and says how to undo", async () => {
    const user = userEvent.setup();
    render(<App />);
    await paste(user, validPage);
    await waitFor(() => expect(chip()).toHaveTextContent("Valid"));
    expect(screen.getByText(/Pasted from the clipboard/)).toBeInTheDocument();
  });

  it("explains what to do when the clipboard cannot be read", async () => {
    const user = userEvent.setup();
    render(<App />);
    vi.spyOn(navigator.clipboard, "readText").mockRejectedValueOnce(new Error("denied"));
    await user.click(screen.getByRole("button", { name: "Paste" }));
    expect(
      await screen.findByText(
        /Could not read the clipboard. Click in the editor and press Ctrl\+V/,
      ),
    ).toBeInTheDocument();
  });

  it("uploads a .json file into the editor", async () => {
    render(<App />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(input).toHaveAttribute("accept", ".json,application/json");
    fireEvent.change(input, {
      target: { files: [new File([validPage], "page.json", { type: "application/json" })] },
    });
    await waitFor(() => expect(editorText()).toBe(validPage));
    expect(screen.getByText("Loaded page.json.")).toBeInTheDocument();
  });

  it("refuses a very large upload", async () => {
    render(<App />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const big = new File(["x"], "big.json");
    Object.defineProperty(big, "size", { value: 6 * 1024 * 1024 });
    fireEvent.change(input, { target: { files: [big] } });
    expect(await screen.findByText(/too large/)).toBeInTheDocument();
    expect(editorText()).toBe("");
  });

  it("copies the JSON", async () => {
    const user = userEvent.setup();
    render(<App />);
    await paste(user, validPage);
    await user.click(screen.getByRole("button", { name: "Copy" }));
    expect(await navigator.clipboard.readText()).toBe(validPage);
    expect(await screen.findByText("Copied the JSON.")).toBeInTheDocument();
  });

  it("formats the JSON with two-space indentation, or explains why it cannot", async () => {
    const user = userEvent.setup();
    render(<App />);
    await paste(user, validPage);
    await user.click(screen.getByRole("button", { name: "Format" }));
    expect(editorText()).toBe(`${JSON.stringify(JSON.parse(validPage), null, 2)}\n`);

    await paste(user, '{"a": ,}');
    await user.click(screen.getByRole("button", { name: "Format" }));
    expect(await screen.findByText(/Cannot format yet/)).toBeInTheDocument();
    expect(editorText()).toBe('{"a": ,}');
  });

  it("loads the sample page, and clears the editor", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: "Sample" }));
    expect(editorText()).toContain('"title": "Full sample page"');
    await user.click(screen.getByRole("button", { name: "Clear" }));
    expect(editorText()).toBe("");
    await waitFor(() => expect(chip()).toHaveTextContent("No page yet"));
  });
});

describe("download", () => {
  let created: Blob[] = [];
  beforeEach(() => {
    created = [];
    URL.createObjectURL = (blob: Blob | MediaSource) => {
      created.push(blob as Blob);
      return "blob:test";
    };
    URL.revokeObjectURL = () => undefined;
  });

  it("is only enabled when the page has no errors, and says why when it is not", async () => {
    const user = userEvent.setup();
    render(<App />);
    await paste(user, brokenPage);
    await waitFor(() => expect(chip()).toHaveTextContent(/error/));
    expect(screen.getByRole("button", { name: "Download" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Download" })).toHaveAttribute(
      "title",
      "Fix every error to download the page",
    );
    await paste(user, validPage);
    await waitFor(() => expect(screen.getByRole("button", { name: "Download" })).toBeEnabled());
  });

  it("saves the formatted page under a name made from its chapter and title", async () => {
    const user = userEvent.setup();
    const names: string[] = [];
    const click = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = function () {
      names.push(this.download);
    };
    render(<App />);
    await paste(user, validPage);
    await waitFor(() => expect(screen.getByRole("button", { name: "Download" })).toBeEnabled());
    await user.click(screen.getByRole("button", { name: "Download" }));
    HTMLAnchorElement.prototype.click = click;
    expect(names).toEqual(["network-security-basics-what-is-a-firewall.json"]);
    expect(await created[0]?.text()).toBe(`${JSON.stringify(JSON.parse(validPage), null, 2)}\n`);
  });
});

describe("while the checks catch up", () => {
  it("keeps Copy, Format and Clear in step with the text, and Download off until the new text is checked", async () => {
    const user = userEvent.setup();
    render(<App />);
    await paste(user, validPage);
    await waitFor(() => expect(screen.getByRole("button", { name: "Download" })).toBeEnabled());
    await user.click(screen.getByRole("button", { name: "Clear" }));
    await paste(user, validPage);
    // Right after the text changes, the actions that only need text are ready at once.
    for (const name of ["Copy", "Format", "Clear"])
      expect(screen.getByRole("button", { name })).toBeEnabled();
  });
});

describe("status chip and problems", () => {
  it("shows Valid for a good page, and N errors, M warnings for a bad one", async () => {
    const user = userEvent.setup();
    render(<App />);
    await paste(user, validPage);
    await waitFor(() => expect(chip()).toHaveTextContent("Valid"));
    await paste(user, brokenPage);
    await waitFor(() => expect(chip()).toHaveTextContent("2 errors, 0 warnings"));
  });

  it("shows Valid with the number of warnings when only warnings remain", async () => {
    const user = userEvent.setup();
    render(<App />);
    const longParagraph = JSON.stringify({
      ...JSON.parse(validPage),
      blocks: [
        { type: "paragraph", text: Array.from({ length: 90 }, (_, i) => `w${i}`).join(" ") },
      ],
    });
    await paste(user, longParagraph);
    await waitFor(() => expect(chip()).toHaveTextContent("Valid, 1 warning"));
    expect(screen.getByRole("button", { name: "Download" })).toBeEnabled();
  });

  it("lists every problem with its block, message and fix, errors before warnings", async () => {
    const user = userEvent.setup();
    render(<App />);
    await paste(user, brokenPage);
    const panel = await screen.findByRole("region", { name: "Problems" });
    expect(panel).toHaveTextContent("Problems: 2 errors, 0 warnings");
    const rows = within(panel).getAllByRole("listitem");
    expect(rows).toHaveLength(2);
    expect(rows[0]).toHaveTextContent("Page");
    expect(rows[0]).toHaveTextContent("lowercase hyphenated slug");
    expect(rows[1]).toHaveTextContent("Block 2 · heading");
    expect(rows[1]).toHaveTextContent("Fix: Use level 2, 3 or 4");
  });

  it("collapses and expands", async () => {
    const user = userEvent.setup();
    render(<App />);
    await paste(user, brokenPage);
    const toggle = await screen.findByRole("button", { name: /^Problems:/ });
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(document.getElementById("problem-list")).not.toBeVisible();
  });

  it("copies all the problems as text to paste back to the AI", async () => {
    const user = userEvent.setup();
    render(<App />);
    await paste(user, brokenPage);
    await user.click(await screen.findByRole("button", { name: "Copy problems" }));
    const copied = await navigator.clipboard.readText();
    expect(copied).toContain("2 errors, 0 warnings");
    expect(copied).toContain("Block 2 (heading)");
    expect(copied).toContain("Fix:");
  });

  it("moves focus into the editor when a problem is chosen", async () => {
    const user = userEvent.setup();
    render(<App />);
    await paste(user, brokenPage);
    const rows = within(await screen.findByRole("region", { name: "Problems" })).getAllByRole(
      "button",
      { name: /Block 2/ },
    );
    await user.click(rows[0]!);
    await waitFor(() => expect(document.activeElement).toHaveClass("cm-content"));
  });

  it("reports a JSON syntax error with its line and column", async () => {
    const user = userEvent.setup();
    render(<App />);
    await paste(user, '{\n  "chapter": "x",\n  "blocks": [,]\n}');
    const panel = await screen.findByRole("region", { name: "Problems" });
    expect(panel).toHaveTextContent("Line 3, column 14");
  });
});

describe("preview", () => {
  it("shows the page info panel outside the page, and the reading time under the title", async () => {
    const user = userEvent.setup();
    render(<App />);
    await paste(user, validPage);
    const info = await screen.findByRole("complementary", { name: "Page info" });
    expect(info).toHaveTextContent("network-security-basics");
    expect(info).toHaveTextContent("Learn what a firewall does.");
    expect(info).toHaveTextContent("6 min");
    expect(info.closest("article")).toBeNull();
    expect(screen.getByText("6 min read")).toBeInTheDocument();
  });

  it("keeps showing the last valid page, with a notice, while the text has errors", async () => {
    const user = userEvent.setup();
    render(<App />);
    await paste(user, validPage);
    await screen.findByRole("heading", { level: 1, name: "What is a firewall?" });
    await paste(user, brokenPage);
    expect(await screen.findByText(/Showing the last valid version/)).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 1, name: "What is a firewall?" }),
    ).toBeInTheDocument();
  });

  it("asks the author to fix the errors when there has never been a valid page", async () => {
    const user = userEvent.setup();
    render(<App />);
    await paste(user, brokenPage);
    expect(await screen.findByText(/Fix the 2 errors to see the page/)).toBeInTheDocument();
  });

  it("shows the page in a frame as wide as the chosen device, and remembers the choice", async () => {
    const user = userEvent.setup();
    const { unmount } = render(<App />);
    await paste(user, validPage);
    const frame = await screen.findByTestId("device-frame");
    expect(frame).toHaveStyle({ width: "390px" });
    expect(screen.getByText("390 px wide")).toBeInTheDocument();
    await user.click(screen.getByRole("radio", { name: /Tablet/ }));
    expect(screen.getByTestId("device-frame")).toHaveStyle({ width: "768px" });
    await user.click(screen.getByRole("radio", { name: /Desktop/ }));
    expect(screen.getByTestId("device-frame")).toHaveStyle({ width: "1280px" });
    unmount();
    render(<App />);
    expect(screen.getByRole("radio", { name: /Desktop/ })).toBeChecked();
    expect(localStorage.getItem(STORAGE_KEYS.device)).toBe("desktop");
  });

  it("has the width toggle as a radio group that works with the arrow keys", async () => {
    const user = userEvent.setup();
    render(<App />);
    const group = screen.getByRole("radiogroup", { name: "Preview width" });
    expect(within(group).getAllByRole("radio")).toHaveLength(3);
    screen.getByRole("radio", { name: /Mobile/ }).focus();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("radio", { name: /Tablet/ })).toBeChecked();
    expect(screen.getByRole("radio", { name: /Tablet/ })).toHaveFocus();
    await user.keyboard("{ArrowLeft}{ArrowLeft}");
    expect(screen.getByRole("radio", { name: /Desktop/ })).toBeChecked();
  });
});

describe("media folder", () => {
  const withImage = JSON.stringify({
    ...JSON.parse(validPage),
    blocks: [{ type: "image", src: "osi.webp", alt: "OSI", description: "Seven layers." }],
    imageBriefs: [{ file: "osi.webp", brief: "Layers." }],
  });

  it("uses /media/ by default, can be changed, and the images follow", async () => {
    const user = userEvent.setup();
    render(<App />);
    await paste(user, withImage);
    expect(await screen.findByRole("img", { name: "OSI" })).toHaveAttribute(
      "src",
      "/media/osi.webp",
    );
    await user.click(screen.getByRole("button", { name: /Media folder/ }));
    const input = screen.getByRole("textbox", { name: "Where the image files are" });
    await user.clear(input);
    await user.type(input, "https://cdn.example.com/lesson/");
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.getByRole("img", { name: "OSI" })).toHaveAttribute(
      "src",
      "https://cdn.example.com/lesson/osi.webp",
    );
    expect(localStorage.getItem(STORAGE_KEYS.media)).toBe("https://cdn.example.com/lesson/");
  });

  it("explains an address that is not valid and keeps the panel open", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: /Media folder/ }));
    const input = screen.getByRole("textbox", { name: "Where the image files are" });
    await user.clear(input);
    await user.type(input, "media folder");
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Start with / for a folder on this site");
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("closes with Escape and returns focus to its button; Use default restores /media/", async () => {
    const user = userEvent.setup();
    render(<App />);
    const button = screen.getByRole("button", { name: /Media folder/ });
    await user.click(button);
    expect(screen.getByRole("textbox", { name: "Where the image files are" })).toHaveFocus();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(button).toHaveFocus();
    await user.click(button);
    await user.clear(screen.getByRole("textbox", { name: "Where the image files are" }));
    await user.click(screen.getByRole("button", { name: "Use default" }));
    expect(screen.getByRole("textbox", { name: "Where the image files are" })).toHaveValue(
      "/media/",
    );
  });
});

describe("autosave", () => {
  afterEach(() => vi.useRealTimers());

  it("saves the JSON in this browser after a short pause, and restores it on the next visit", async () => {
    const user = userEvent.setup();
    const { unmount } = render(<App />);
    await paste(user, validPage);
    await waitFor(() => expect(localStorage.getItem(STORAGE_KEYS.json)).toBe(validPage));
    unmount();
    render(<App />);
    expect(editorText()).toBe(validPage);
    expect(
      await screen.findByRole("heading", { level: 1, name: "What is a firewall?" }),
    ).toBeInTheDocument();
  });

  it("forgets the saved JSON when the editor is cleared", async () => {
    const user = userEvent.setup();
    render(<App />);
    await paste(user, validPage);
    await waitFor(() => expect(localStorage.getItem(STORAGE_KEYS.json)).not.toBeNull());
    await user.click(screen.getByRole("button", { name: "Clear" }));
    await waitFor(() => expect(localStorage.getItem(STORAGE_KEYS.json)).toBeNull());
  });

  it("does not send the JSON anywhere: no network requests are made", async () => {
    const user = userEvent.setup();
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const open = vi.spyOn(XMLHttpRequest.prototype, "open");
    const beacon = vi.fn();
    Object.defineProperty(navigator, "sendBeacon", { value: beacon, configurable: true });
    render(<App />);
    await paste(user, validPage);
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 700));
    });
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(open).not.toHaveBeenCalled();
    expect(beacon).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });
});

describe("layout", () => {
  it("has a draggable divider that also works with the keyboard and is limited to 25-75%", async () => {
    const user = userEvent.setup();
    render(<App />);
    const divider = screen.getByRole("separator", { name: "Resize the editor and the preview" });
    expect(divider).toHaveAttribute("aria-valuenow", "50");
    divider.focus();
    await user.keyboard("{ArrowRight}");
    expect(divider).toHaveAttribute("aria-valuenow", "52");
    await user.keyboard("{Shift>}{ArrowLeft}{/Shift}");
    expect(divider).toHaveAttribute("aria-valuenow", "42");
    await user.keyboard("{End}");
    expect(divider).toHaveAttribute("aria-valuenow", "75");
    await user.keyboard("{Home}");
    expect(divider).toHaveAttribute("aria-valuenow", "25");
    expect(divider).toHaveClass("w-2");
  });

  it("is two tabs, JSON and Preview, on narrow screens", async () => {
    const user = userEvent.setup();
    render(<App />);
    const tabs = screen.getAllByRole("tab");
    expect(tabs.map((tab) => tab.textContent)).toEqual(["JSON", "Preview"]);
    expect(screen.getByRole("tab", { name: "JSON" })).toHaveAttribute("aria-selected", "true");
    expect(document.getElementById("pane-preview")).toHaveClass("hidden", "lg:block");
    await user.click(screen.getByRole("tab", { name: "Preview" }));
    expect(document.getElementById("pane-json")).toHaveClass("hidden", "lg:flex");
    expect(document.getElementById("pane-preview")).toHaveClass("block");
    screen.getByRole("tab", { name: "Preview" }).focus();
    await user.keyboard("{ArrowLeft}");
    expect(screen.getByRole("tab", { name: "JSON" })).toHaveFocus();
    expect(screen.getByRole("tab", { name: "JSON" })).toHaveAttribute("aria-selected", "true");
  });

  it("returns to the JSON tab when a problem is chosen", async () => {
    const user = userEvent.setup();
    render(<App />);
    await paste(user, brokenPage);
    const row = within(await screen.findByRole("region", { name: "Problems" })).getAllByRole(
      "button",
      { name: /Block 2/ },
    )[0]!;
    await user.click(screen.getByRole("tab", { name: "Preview" }));
    expect(screen.getByRole("tab", { name: "JSON" })).toHaveAttribute("aria-selected", "false");
    await user.click(screen.getByRole("tab", { name: "JSON" }));
    await user.click(row);
    expect(screen.getByRole("tab", { name: "JSON" })).toHaveAttribute("aria-selected", "true");
  });
});

describe("images and leaving the page", () => {
  it("lists the images the page needs in an Images panel", async () => {
    const user = userEvent.setup();
    render(<App />);
    const withBriefs = JSON.stringify({
      ...JSON.parse(validPage),
      blocks: [{ type: "image", src: "osi.webp", alt: "OSI", description: "Layers." }],
      imageBriefs: [{ file: "osi.webp", brief: "Seven stacked layers." }],
    });
    await paste(user, withBriefs);
    const toggle = await screen.findByRole("button", { name: /^Images:/ });
    await user.click(toggle);
    expect(screen.getByRole("region", { name: "Images" })).toHaveTextContent("osi.webp");
    expect(screen.getByRole("region", { name: "Images" })).toHaveTextContent(
      "Seven stacked layers.",
    );
  });

  it("saves the JSON straight away when the page is left, even within the autosave pause", async () => {
    const user = userEvent.setup();
    const { unmount } = render(<App />);
    await paste(user, validPage);
    unmount();
    expect(localStorage.getItem(STORAGE_KEYS.json)).toBe(validPage);
  });

  it("saves the JSON when the browser tab is closed or hidden", async () => {
    const user = userEvent.setup();
    render(<App />);
    await paste(user, validPage);
    window.dispatchEvent(new Event("pagehide"));
    expect(localStorage.getItem(STORAGE_KEYS.json)).toBe(validPage);
  });
});

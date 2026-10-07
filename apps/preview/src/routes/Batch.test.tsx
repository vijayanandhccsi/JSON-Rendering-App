import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { App } from "../app/App";
import { STORAGE_KEYS } from "../lib/storage";

const page = (n: number, extra: Record<string, unknown> = {}) => ({
  chapter: "network-security-basics",
  title: `Page ${n}`,
  summary: `Summary ${n}.`,
  blocks: [{ type: "paragraph", text: `Text ${n}.` }],
  ...extra,
});

const longText = Array.from({ length: 90 }, (_, i) => `w${i}`).join(" ");

/** 20 files: 14 clean, 2 valid with a warning, 4 with errors. */
function twentyFiles(): { file: File; pass: boolean; errors: number; warnings: number }[] {
  const out: { file: File; pass: boolean; errors: number; warnings: number }[] = [];
  const add = (name: string, content: unknown, pass: boolean, errors: number, warnings: number) =>
    out.push({
      file: new File([typeof content === "string" ? content : JSON.stringify(content)], name, {
        type: "application/json",
      }),
      pass,
      errors,
      warnings,
    });

  for (let n = 1; n <= 14; n++) add(`page-${n}.json`, page(n), true, 0, 0);
  add(
    "page-15-long.json",
    page(15, { blocks: [{ type: "paragraph", text: longText }] }),
    true,
    0,
    1,
  );
  add(
    "page-16-video.json",
    page(16, { blocks: [{ type: "video", provider: "vimeo", id: "TBD", title: "Soon" }] }),
    true,
    0,
    1,
  );
  add("page-17-syntax.json", '{\n  "chapter": "x",\n  "blocks": [,]\n}', false, 1, 0);
  add(
    "page-18-missing-title.json",
    { chapter: "a", summary: "s", blocks: [{ type: "paragraph", text: "t" }] },
    false,
    1,
    0,
  );
  add(
    "page-19-heading.json",
    page(19, { blocks: [{ type: "heading", level: 1, text: "x" }] }),
    false,
    1,
    0,
  );
  add(
    "page-20-two-problems.json",
    page(20, { chapter: "Bad Slug", blocks: [{ type: "banner" }] }),
    false,
    2,
    0,
  );
  return out;
}

const drop = (files: File[]) =>
  fireEvent.drop(screen.getByRole("group", { name: "Drop zone" }), {
    dataTransfer: { files, items: [] },
  });

const rowOf = (name: string) =>
  screen.getByRole("rowheader", { name }).closest("tr") as HTMLElement;

beforeEach(() => {
  localStorage.clear();
  window.history.pushState({}, "", "/batch");
});
afterEach(() => {
  localStorage.clear();
  window.history.pushState({}, "", "/");
});

async function open() {
  render(<App />);
  await screen.findByRole("heading", { level: 1, name: "Batch validate" });
}

describe("batch validate", () => {
  it("starts with the drop zone and nothing else", async () => {
    await open();
    expect(screen.getByRole("group", { name: "Drop zone" })).toHaveTextContent(
      "Drop .json files or a folder of pages here",
    );
    expect(screen.queryByRole("table")).toBeNull();
    expect(screen.getByText(/not uploaded anywhere/)).toBeVisible();
  });

  it("checks 20 files in one drop and shows a correct pass/fail table", async () => {
    await open();
    const files = twentyFiles();
    drop(files.map((f) => f.file));

    expect(await screen.findByText("20 files checked: 16 passed, 4 failed.")).toBeInTheDocument();
    const table = screen.getByRole("table", { name: "Batch results" });
    expect(within(table).getAllByRole("row")).toHaveLength(21);
    expect(
      within(table)
        .getAllByRole("columnheader")
        .map((c) => c.textContent),
    ).toEqual(["File", "Result", "Errors", "Warnings", "Page", "Actions"]);

    for (const { file, pass, errors, warnings } of files) {
      const cells = within(rowOf(file.name)).getAllByRole("cell");
      expect(cells[0]).toHaveTextContent(pass ? "Pass" : "Fail");
      expect(cells[1]).toHaveTextContent(String(errors));
      expect(cells[2]).toHaveTextContent(String(warnings));
    }
  });

  it("sorts file names the way people count (page-2 before page-10)", async () => {
    await open();
    drop(twentyFiles().map((f) => f.file));
    await screen.findByRole("table");
    const names = screen.getAllByRole("rowheader").map((cell) => cell.textContent);
    expect(names.slice(0, 11)).toEqual([
      "page-1.json",
      "page-2.json",
      "page-3.json",
      "page-4.json",
      "page-5.json",
      "page-6.json",
      "page-7.json",
      "page-8.json",
      "page-9.json",
      "page-10.json",
      "page-11.json",
    ]);
  });

  it("shows each page's title and chapter", async () => {
    await open();
    drop(twentyFiles().map((f) => f.file));
    await screen.findByRole("table");
    expect(rowOf("page-3.json")).toHaveTextContent("Page 3");
    expect(rowOf("page-3.json")).toHaveTextContent("network-security-basics");
    expect(rowOf("page-17-syntax.json")).toHaveTextContent("Not available");
  });

  it("uses an icon and a word for every result, not color alone", async () => {
    await open();
    drop(twentyFiles().map((f) => f.file));
    await screen.findByRole("table");
    expect(rowOf("page-1.json").querySelector("svg.lucide-circle-check")).not.toBeNull();
    expect(rowOf("page-19-heading.json").querySelector("svg.lucide-circle-x")).not.toBeNull();
  });

  it("opens the details of a file: block, path, message and fix, with the line and column of a syntax error", async () => {
    const user = userEvent.setup();
    await open();
    drop(twentyFiles().map((f) => f.file));
    await screen.findByRole("table");

    const details = within(rowOf("page-19-heading.json")).getByRole("button", { name: /Details/ });
    expect(details).toHaveAttribute("aria-expanded", "false");
    await user.click(details);
    expect(details).toHaveAttribute("aria-expanded", "true");
    const panel = document.getElementById("details-page-19-heading.json") as HTMLElement;
    expect(panel).toHaveTextContent("Block 1 · heading");
    expect(panel).toHaveTextContent("blocks[0].level");
    expect(panel).toHaveTextContent("Fix: Use level 2, 3 or 4");

    await user.click(within(rowOf("page-17-syntax.json")).getByRole("button", { name: /Details/ }));
    expect(document.getElementById("details-page-17-syntax.json")).toHaveTextContent(
      "Line 3, column 14",
    );

    await user.click(within(rowOf("page-15-long.json")).getByRole("button", { name: /Details/ }));
    expect(document.getElementById("details-page-15-long.json")).toHaveTextContent("90 words");
  });

  it("has no Details button for a file with nothing to report", async () => {
    await open();
    drop(twentyFiles().map((f) => f.file));
    await screen.findByRole("table");
    expect(within(rowOf("page-1.json")).queryByRole("button", { name: /Details/ })).toBeNull();
  });

  it("can show only the files with errors", async () => {
    const user = userEvent.setup();
    await open();
    drop(twentyFiles().map((f) => f.file));
    await screen.findByRole("table");
    await user.click(screen.getByRole("checkbox", { name: "Show only files with errors" }));
    expect(screen.getAllByRole("rowheader").map((cell) => cell.textContent)).toEqual([
      "page-17-syntax.json",
      "page-18-missing-title.json",
      "page-19-heading.json",
      "page-20-two-problems.json",
    ]);
  });

  it("says so when no file has errors and the filter is on", async () => {
    const user = userEvent.setup();
    await open();
    drop([new File([JSON.stringify(page(1))], "a.json")]);
    await screen.findByRole("table");
    await user.click(screen.getByRole("checkbox", { name: "Show only files with errors" }));
    expect(screen.getByText("No files have errors.")).toBeVisible();
  });

  it("skips files that are not .json and says how many", async () => {
    await open();
    drop([
      new File([JSON.stringify(page(1))], "a.json"),
      new File(["x"], "notes.txt"),
      new File(["x"], "image.webp"),
    ]);
    expect(
      await screen.findByText(
        "1 file checked: 1 passed, 0 failed. Skipped 2 files that are not .json.",
      ),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("rowheader")).toHaveLength(1);
  });

  it("explains when nothing dropped is .json", async () => {
    await open();
    drop([new File(["x"], "notes.txt")]);
    expect(
      await screen.findByText("Skipped 1 file that is not .json. Only .json files are checked."),
    ).toBeInTheDocument();
    expect(screen.queryByRole("table")).toBeNull();
  });

  it("fails an empty file with a clear message", async () => {
    const user = userEvent.setup();
    await open();
    drop([new File([""], "empty.json")]);
    await screen.findByRole("table");
    expect(rowOf("empty.json")).toHaveTextContent("Fail");
    await user.click(within(rowOf("empty.json")).getByRole("button", { name: /Details/ }));
    expect(document.getElementById("details-empty.json")).toHaveTextContent("The JSON is empty.");
  });

  it("checks a file again when it is dropped again, replacing its earlier result", async () => {
    await open();
    drop([
      new File([JSON.stringify(page(1, { chapter: "Bad Slug" }))], "fix-me.json"),
      new File([JSON.stringify(page(2))], "other.json"),
    ]);
    await screen.findByText("2 files checked: 1 passed, 1 failed.");
    drop([new File([JSON.stringify(page(1))], "fix-me.json")]);
    await screen.findByText("2 files checked: 2 passed, 0 failed.");
    expect(screen.getAllByRole("rowheader")).toHaveLength(2);
  });

  it("works with the Choose files button", async () => {
    const user = userEvent.setup();
    await open();
    await user.upload(screen.getByLabelText("Choose JSON files"), [
      new File([JSON.stringify(page(1))], "picked.json"),
      new File(["{"], "bad.json"),
    ]);
    expect(await screen.findByText("2 files checked: 1 passed, 1 failed.")).toBeInTheDocument();
  });

  it("checks hundreds of pages in one drop", async () => {
    await open();
    const files = Array.from(
      { length: 600 },
      (_, i) =>
        new File(
          [JSON.stringify(page(i, i % 50 === 0 ? { chapter: "Bad" } : {}))],
          `page-${i}.json`,
        ),
    );
    drop(files);
    expect(
      await screen.findByText("600 files checked: 588 passed, 12 failed.", {}, { timeout: 10000 }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("rowheader")).toHaveLength(600);
  }, 20000);

  it("copies a report of every file with problems, to paste to the AI", async () => {
    const user = userEvent.setup();
    await open();
    drop(twentyFiles().map((f) => f.file));
    await screen.findByRole("table");
    await user.click(screen.getByRole("button", { name: "Copy report" }));
    const report = await navigator.clipboard.readText();
    expect(report).toContain("Batch report: 20 files, 16 passed, 4 failed");
    expect(report).toContain("== page-19-heading.json ==");
    expect(report).toContain("== page-15-long.json ==");
    expect(report).not.toContain("== page-1.json ==");
    expect(report).toContain("Fix:");
    expect(await screen.findByText(/Copied the report/)).toBeInTheDocument();
  });

  it("opens a file in the editor", async () => {
    const user = userEvent.setup();
    await open();
    const files = twentyFiles();
    drop(files.map((f) => f.file));
    await screen.findByRole("table");
    await user.click(within(rowOf("page-3.json")).getByRole("button", { name: /Open in editor/ }));
    expect(window.location.pathname).toBe("/");
    expect(localStorage.getItem(STORAGE_KEYS.json)).toBe(JSON.stringify(page(3)));
    await waitFor(() =>
      expect(screen.getByRole("heading", { level: 1, name: "Page 3" })).toBeInTheDocument(),
    );
  });

  it("clears the results", async () => {
    const user = userEvent.setup();
    await open();
    drop(twentyFiles().map((f) => f.file));
    await screen.findByRole("table");
    await user.click(screen.getByRole("button", { name: "Clear" }));
    expect(screen.queryByRole("table")).toBeNull();
  });

  it("highlights the drop zone while a file is dragged over it", async () => {
    await open();
    const zone = screen.getByRole("group", { name: "Drop zone" });
    fireEvent.dragOver(zone, { dataTransfer: { files: [] } });
    expect(zone).toHaveClass("border-primary");
    fireEvent.dragLeave(zone);
    expect(zone).not.toHaveClass("border-primary");
  });

  it("makes no network requests", async () => {
    const calls: unknown[] = [];
    const original = globalThis.fetch;
    globalThis.fetch = ((...args: unknown[]) => (
      calls.push(args),
      original(...(args as [RequestInfo]))
    )) as typeof fetch;
    await open();
    drop(twentyFiles().map((f) => f.file));
    await screen.findByRole("table");
    globalThis.fetch = original;
    expect(calls).toEqual([]);
  });
});

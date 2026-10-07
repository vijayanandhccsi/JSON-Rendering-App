import { formatIssues, validateJsonText } from "@certkraft/blocks";
import type { ValidationResult } from "@certkraft/blocks";
import {
  ChevronDown,
  CircleCheck,
  CircleX,
  Copy,
  FolderOpen,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import { Fragment, useRef, useState } from "react";
import type { ChangeEvent, DragEvent } from "react";
import { CHROME_BUTTON } from "../app/buttons";
import { Shell } from "../app/Header";
import { navigate } from "../app/Router";
import { collectDropped, splitJson } from "../lib/dropped";
import type { DroppedFile } from "../lib/dropped";
import { readFileText } from "../lib/files";
import { STORAGE_KEYS, writeStored } from "../lib/storage";

interface Row {
  name: string;
  text: string;
  result: ValidationResult;
  chapter: string;
  title: string;
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;
const naturalSort = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });
/** After this many files, let the browser draw before carrying on, so a big batch does not freeze the page. */
const YIELD_EVERY = 10;

function pageDetails(text: string): { chapter: string; title: string } {
  try {
    const page = JSON.parse(text) as { chapter?: unknown; title?: unknown };
    return {
      chapter: typeof page.chapter === "string" ? page.chapter : "",
      title: typeof page.title === "string" ? page.title : "",
    };
  } catch {
    return { chapter: "", title: "" };
  }
}

async function check({ name, file }: DroppedFile): Promise<Row> {
  let text = "";
  try {
    text = await readFileText(file);
  } catch {
    return {
      name,
      text,
      chapter: "",
      title: "",
      result: {
        valid: false,
        errors: [
          {
            severity: "error",
            blockIndex: null,
            blockType: null,
            path: "",
            message: "The file could not be read.",
            fix: "Check that the file can be opened, then drop it again.",
          },
        ],
        warnings: [],
      },
    };
  }
  return { name, text, result: validateJsonText(text), ...pageDetails(text) };
}

export default function Batch() {
  const [rows, setRows] = useState<Row[]>([]);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [skipped, setSkipped] = useState(0);
  const [onlyFailures, setOnlyFailures] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [open, setOpen] = useState<ReadonlySet<string>>(new Set());
  const [notice, setNotice] = useState("");
  const input = useRef<HTMLInputElement>(null);

  async function addFiles(dropped: DroppedFile[]) {
    const { json, skipped: others } = splitJson(dropped);
    setSkipped(others);
    setNotice("");
    if (json.length === 0) return;

    setProgress({ done: 0, total: json.length });
    const fresh: Row[] = [];
    for (const [i, file] of json.entries()) {
      fresh.push(await check(file));
      if ((i + 1) % YIELD_EVERY === 0) {
        setProgress({ done: i + 1, total: json.length });
        await new Promise((resolve) => setTimeout(resolve, 0));
      }
    }
    // A file dropped again replaces its earlier result, so fixed files can simply be checked again.
    setRows((current) => {
      const names = new Set(fresh.map((row) => row.name));
      return [...current.filter((row) => !names.has(row.name)), ...fresh].sort((a, b) =>
        naturalSort.compare(a.name, b.name),
      );
    });
    setProgress(null);
  }

  const onDrop = (event: DragEvent) => {
    event.preventDefault();
    setDragging(false);
    void collectDropped(event.dataTransfer).then(addFiles);
  };

  const onPick = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []).map((file) => ({ name: file.name, file }));
    event.target.value = "";
    void addFiles(files);
  };

  const failed = rows.filter((row) => !row.result.valid);
  const shown = onlyFailures ? failed : rows;

  const toggle = (name: string) =>
    setOpen((current) => {
      const next = new Set(current);
      if (!next.delete(name)) next.add(name);
      return next;
    });

  const openInEditor = (row: Row) => {
    writeStored(STORAGE_KEYS.json, row.text);
    navigate("/");
  };

  const copyReport = async () => {
    const withProblems = rows.filter(
      (row) => row.result.errors.length + row.result.warnings.length > 0,
    );
    const report = [
      `Batch report: ${plural(rows.length, "file")}, ${rows.length - failed.length} passed, ${failed.length} failed`,
      ...withProblems.map((row) => `\n== ${row.name} ==\n${formatIssues(row.result)}`),
    ].join("\n");
    try {
      await navigator.clipboard.writeText(report);
      setNotice("Copied the report. Paste it to the AI to fix the pages.");
    } catch {
      setNotice("Could not copy to the clipboard.");
    }
  };

  return (
    <Shell route="/batch">
      <main className="min-h-0 flex-1 overflow-auto p-4 lg:p-6">
        <div className="mx-auto flex w-full max-w-wide flex-col gap-6">
          <div>
            <h1 className="text-h2 font-semibold">Batch validate</h1>
            <p className="mt-1 text-ink-muted">
              Check many pages at once. The files are read in this browser and are not uploaded
              anywhere.
            </p>
          </div>

          <div
            role="group"
            aria-label="Drop zone"
            onDragOver={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            className={`flex flex-col items-center gap-3 rounded-card border-2 border-dashed p-8 text-center transition-colors duration-150 ease-out ${dragging ? "border-primary bg-primary-tint" : "border-border bg-surface"}`}
          >
            <FolderOpen size={24} strokeWidth={1.75} aria-hidden className="text-ink-muted" />
            <p>Drop .json files or a folder of pages here, or choose them.</p>
            <input
              ref={input}
              type="file"
              multiple
              accept=".json,application/json"
              onChange={onPick}
              className="sr-only"
              aria-label="Choose JSON files"
            />
            <button type="button" className={CHROME_BUTTON} onClick={() => input.current?.click()}>
              Choose files
            </button>
          </div>

          <p role="status" className="min-h-6">
            {progress
              ? `Checking ${progress.done} of ${progress.total}`
              : rows.length > 0
                ? `${plural(rows.length, "file")} checked: ${rows.length - failed.length} passed, ${failed.length} failed.${skipped > 0 ? ` Skipped ${plural(skipped, "file")} that ${skipped === 1 ? "is" : "are"} not .json.` : ""}`
                : skipped > 0
                  ? `Skipped ${plural(skipped, "file")} that ${skipped === 1 ? "is" : "are"} not .json. Only .json files are checked.`
                  : ""}
            {notice ? ` ${notice}` : ""}
          </p>

          {rows.length > 0 ? (
            <>
              <div className="flex flex-wrap items-center gap-3">
                <label className="flex min-h-11 items-center gap-2 text-small">
                  <input
                    type="checkbox"
                    checked={onlyFailures}
                    onChange={(event) => setOnlyFailures(event.target.checked)}
                    className="size-5"
                  />
                  Show only files with errors
                </label>
                <div className="ml-auto flex flex-wrap gap-2">
                  <button type="button" className={CHROME_BUTTON} onClick={copyReport}>
                    <Copy size={16} strokeWidth={1.75} aria-hidden />
                    Copy report
                  </button>
                  <button
                    type="button"
                    className={CHROME_BUTTON}
                    onClick={() => (setRows([]), setOpen(new Set()), setSkipped(0), setNotice(""))}
                  >
                    <Trash2 size={16} strokeWidth={1.75} aria-hidden />
                    Clear
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto rounded-card border border-border bg-surface">
                <table className="w-full border-collapse text-left text-small">
                  <caption className="sr-only">Batch results</caption>
                  <thead className="bg-bg">
                    <tr>
                      {["File", "Result", "Errors", "Warnings", "Page", "Actions"].map(
                        (heading) => (
                          <th
                            key={heading}
                            scope="col"
                            className="whitespace-nowrap px-4 py-3 font-semibold"
                          >
                            {heading}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {shown.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-6 text-center text-ink-muted">
                          No files have errors.
                        </td>
                      </tr>
                    ) : null}
                    {shown.map((row) => {
                      const pass = row.result.valid;
                      const isOpen = open.has(row.name);
                      const issues = [...row.result.errors, ...row.result.warnings];
                      return (
                        <Fragment key={row.name}>
                          <tr className="border-t border-border align-top">
                            <th
                              scope="row"
                              className="break-all px-4 py-3 text-left font-mono font-normal"
                            >
                              {row.name}
                            </th>
                            <td className="whitespace-nowrap px-4 py-3">
                              <span
                                className={`inline-flex items-center gap-1 font-medium ${pass ? "text-success-strong" : "text-danger"}`}
                              >
                                {pass ? (
                                  <CircleCheck size={16} strokeWidth={1.75} aria-hidden />
                                ) : (
                                  <CircleX size={16} strokeWidth={1.75} aria-hidden />
                                )}
                                {pass ? "Pass" : "Fail"}
                              </span>
                            </td>
                            <td className="px-4 py-3">{row.result.errors.length}</td>
                            <td className="px-4 py-3">{row.result.warnings.length}</td>
                            <td className="px-4 py-3">
                              {row.title || row.chapter ? (
                                <>
                                  <span className="block">{row.title}</span>
                                  <span className="block font-mono text-caption text-ink-muted">
                                    {row.chapter}
                                  </span>
                                </>
                              ) : (
                                <span className="text-ink-muted">Not available</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex flex-wrap gap-2">
                                {issues.length > 0 ? (
                                  <button
                                    type="button"
                                    className={CHROME_BUTTON}
                                    aria-expanded={isOpen}
                                    aria-controls={`details-${row.name}`}
                                    onClick={() => toggle(row.name)}
                                  >
                                    <ChevronDown
                                      size={16}
                                      strokeWidth={1.75}
                                      aria-hidden
                                      className={`transition-transform duration-150 ease-out ${isOpen ? "rotate-180" : ""}`}
                                    />
                                    Details<span className="sr-only"> for {row.name}</span>
                                  </button>
                                ) : null}
                                <button
                                  type="button"
                                  className={CHROME_BUTTON}
                                  onClick={() => openInEditor(row)}
                                >
                                  Open in editor<span className="sr-only">: {row.name}</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                          {isOpen ? (
                            <tr id={`details-${row.name}`} className="bg-bg">
                              <td colSpan={6} className="px-4 py-3">
                                <ul role="list" className="flex flex-col gap-2">
                                  {issues.map((issue, index) => (
                                    <li key={index} className="flex items-start gap-2">
                                      {issue.severity === "error" ? (
                                        <CircleX
                                          size={16}
                                          strokeWidth={1.75}
                                          aria-hidden
                                          className="mt-1 shrink-0 text-danger"
                                        />
                                      ) : (
                                        <TriangleAlert
                                          size={16}
                                          strokeWidth={1.75}
                                          aria-hidden
                                          className="mt-1 shrink-0 text-warning"
                                        />
                                      )}
                                      <span>
                                        <span className="block font-medium">
                                          <span className="sr-only">
                                            {issue.severity === "error" ? "Error. " : "Warning. "}
                                          </span>
                                          {issue.blockIndex === null
                                            ? "Page"
                                            : `Block ${issue.blockIndex + 1}${issue.blockType ? ` · ${issue.blockType}` : ""}`}
                                          {issue.path ? (
                                            <span className="ml-2 font-mono font-normal text-ink-muted">
                                              {issue.path}
                                            </span>
                                          ) : null}
                                        </span>
                                        <span className="block">{issue.message}</span>
                                        <span className="block text-ink-muted">
                                          Fix: {issue.fix}
                                        </span>
                                      </span>
                                    </li>
                                  ))}
                                </ul>
                              </td>
                            </tr>
                          ) : null}
                        </Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          ) : null}
        </div>
      </main>
    </Shell>
  );
}

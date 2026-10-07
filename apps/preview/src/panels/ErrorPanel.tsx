import { ChevronDown, CircleX, Copy, TriangleAlert } from "lucide-react";
import { formatIssues } from "@certkraft/blocks";
import type { ValidationIssue, ValidationResult } from "@certkraft/blocks";
import { useState } from "react";
import { CHROME_BUTTON } from "../app/buttons";

interface ErrorPanelProps {
  result: ValidationResult;
  /** Called when a row is chosen, so the editor can show where the problem is. */
  onSelect: (issue: ValidationIssue) => void;
  onNotice: (message: string) => void;
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

function where(issue: ValidationIssue): string {
  if (issue.blockIndex === null) return "Page";
  return `Block ${issue.blockIndex + 1}${issue.blockType ? ` · ${issue.blockType}` : ""}`;
}

/** The list of errors and warnings. Choosing a row jumps to the problem in the editor. */
export function ErrorPanel({ result, onSelect, onNotice }: ErrorPanelProps) {
  const [open, setOpen] = useState(true);
  const issues = [...result.errors, ...result.warnings];

  const copyAll = async () => {
    try {
      await navigator.clipboard.writeText(formatIssues(result));
      onNotice("Copied the problems. Paste them to the AI to get a fixed page.");
    } catch {
      onNotice("Could not copy to the clipboard.");
    }
  };

  return (
    <section
      aria-label="Problems"
      className="flex max-h-1/3 min-h-0 shrink-0 flex-col border-t border-border bg-surface"
    >
      <div className="flex min-h-11 items-center justify-between gap-2 px-2">
        <button
          type="button"
          aria-expanded={open}
          aria-controls="problem-list"
          onClick={() => setOpen((value) => !value)}
          className="flex min-h-11 items-center gap-2 rounded-control px-2 text-small font-medium"
        >
          <ChevronDown
            size={16}
            strokeWidth={1.75}
            aria-hidden
            className={`transition-transform duration-150 ease-out ${open ? "" : "-rotate-90"}`}
          />
          Problems: {plural(result.errors.length, "error")},{" "}
          {plural(result.warnings.length, "warning")}
        </button>
        {issues.length > 0 ? (
          <button type="button" className={CHROME_BUTTON} onClick={copyAll}>
            <Copy size={16} strokeWidth={1.75} aria-hidden />
            Copy problems
          </button>
        ) : null}
      </div>
      <div id="problem-list" hidden={!open} className="min-h-0 overflow-y-auto">
        {issues.length === 0 ? (
          <p className="px-4 pb-3 text-small text-ink-muted">No problems found.</p>
        ) : (
          <ul role="list" className="divide-y divide-border border-t border-border">
            {issues.map((issue, index) => {
              const isError = issue.severity === "error";
              const Glyph = isError ? CircleX : TriangleAlert;
              return (
                <li key={index}>
                  <button
                    type="button"
                    onClick={() => onSelect(issue)}
                    className="flex min-h-11 w-full items-start gap-3 px-4 py-2 text-left hover:bg-bg"
                  >
                    <Glyph
                      size={16}
                      strokeWidth={1.75}
                      aria-hidden
                      className={`mt-1 shrink-0 ${isError ? "text-danger" : "text-warning"}`}
                    />
                    <span className="min-w-0 text-small">
                      <span className="block font-medium">
                        <span className="sr-only">{isError ? "Error. " : "Warning. "}</span>
                        {where(issue)}
                        {issue.path ? (
                          <span className="ml-2 font-mono font-normal text-ink-muted">
                            {issue.path}
                          </span>
                        ) : null}
                      </span>
                      <span className="block">{issue.message}</span>
                      <span className="block text-ink-muted">Fix: {issue.fix}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}

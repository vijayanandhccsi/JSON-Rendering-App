import type { Diagnostic } from "@codemirror/lint";
import type { ValidationIssue, ValidationResult } from "@certkraft/blocks";
import { markerRange } from "./jsonPositions";
import type { PathIndex, Range } from "./jsonPositions";

/** Character offset of a one-based line and column. */
export function offsetOf(text: string, line: number, column: number): number {
  const lines = text.split("\n");
  let offset = 0;
  for (let i = 0; i < Math.min(line - 1, lines.length); i++) offset += (lines[i]?.length ?? 0) + 1;
  return Math.min(offset + Math.max(column - 1, 0), text.length);
}

/** Where in the text an issue belongs, or null if it has no place (such as an empty page). */
export function issueRange(issue: ValidationIssue, text: string, index: PathIndex): Range | null {
  if (issue.line !== undefined && issue.column !== undefined) {
    const from = offsetOf(text, issue.line, issue.column);
    return { from, to: Math.min(from + 1, text.length) };
  }
  return markerRange(index, issue.path, text);
}

/** Editor markers for every error and warning, with the fix hint in the message. */
export function toDiagnostics(
  result: ValidationResult,
  text: string,
  index: PathIndex,
): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  for (const issue of [...result.errors, ...result.warnings]) {
    const range = issueRange(issue, text, index) ?? { from: 0, to: Math.min(1, text.length) };
    diagnostics.push({
      from: range.from,
      to: Math.max(range.to, Math.min(range.from + 1, text.length)),
      severity: issue.severity,
      message: `${issue.message} Fix: ${issue.fix}`,
      source:
        issue.blockIndex === null
          ? "Page"
          : `Block ${issue.blockIndex + 1}${issue.blockType ? ` (${issue.blockType})` : ""}`,
    });
  }
  return diagnostics;
}

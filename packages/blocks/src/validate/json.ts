import { locateJsonError } from "./locateJsonError";
import type { ValidationIssue, ValidationResult } from "./types";
import { validatePage } from "./validatePage";

function lineAndColumn(text: string, position: number): { line: number; column: number } {
  const before = text.slice(0, position);
  return { line: before.split("\n").length, column: position - before.lastIndexOf("\n") };
}

function failure(
  issue: Omit<ValidationIssue, "severity" | "blockIndex" | "blockType" | "path">,
): ValidationResult {
  return {
    valid: false,
    errors: [{ severity: "error", blockIndex: null, blockType: null, path: "", ...issue }],
    warnings: [],
  };
}

/** Parses JSON text and validates it. A syntax error is reported with its line and column. */
export function validateJsonText(text: string): ValidationResult {
  if (text.trim() === "") {
    return failure({
      message: "The JSON is empty.",
      fix: "Paste the page JSON, or load the sample page.",
    });
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (cause) {
    const found = locateJsonError(text);
    const { line, column } = lineAndColumn(text, found?.position ?? 0);
    const detail = found?.message ?? (cause instanceof Error ? cause.message : String(cause));
    return failure({
      message: `The text is not valid JSON. Line ${line}, column ${column}: ${detail}.`,
      fix: "Fix the syntax at that spot. Check commas, double quotes and brackets, and remove any trailing commas or comments.",
      line,
      column,
    });
  }
  return validatePage(parsed);
}

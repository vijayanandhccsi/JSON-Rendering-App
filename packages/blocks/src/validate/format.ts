import { ICON_NAMES } from "../icons/iconNames";
import { ICON_NOT_ALLOWED } from "../schema/common";
import type { ValidationIssue, ValidationResult } from "./types";

function where(issue: ValidationIssue): string {
  if (issue.blockIndex === null) return issue.path ? `Page (${issue.path})` : "Page";
  const type = issue.blockType ? ` (${issue.blockType})` : "";
  return `Block ${issue.blockIndex + 1}${type} at ${issue.path}`;
}

/** The result as plain text that can be pasted back to an AI to fix the page. */
export function formatIssues(result: ValidationResult): string {
  const { errors, warnings } = result;
  if (errors.length === 0 && warnings.length === 0) return "No errors or warnings.";
  const count = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;
  const lines = [`${count(errors.length, "error")}, ${count(warnings.length, "warning")}`, ""];
  [...errors, ...warnings].forEach((issue, i) => {
    lines.push(`${i + 1}. [${issue.severity}] ${where(issue)}: ${issue.message}`);
    lines.push(`   Fix: ${issue.fix}`);
  });
  if (errors.some((issue) => issue.code === ICON_NOT_ALLOWED)) {
    lines.push("", `Allowed icons: ${ICON_NAMES.join(", ")}`);
  }
  return lines.join("\n");
}

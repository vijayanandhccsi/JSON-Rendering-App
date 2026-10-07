import { CircleCheck, CircleX, FileQuestion, TriangleAlert } from "lucide-react";
import type { ValidationResult } from "@certkraft/blocks";

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

export function StatusChip({ result, empty }: { result: ValidationResult; empty: boolean }) {
  const errors = result.errors.length;
  const warnings = result.warnings.length;

  let tone = "bg-success-tint text-success-strong";
  let Glyph = CircleCheck;
  let text = "Valid";
  if (empty) {
    tone = "bg-bg text-ink-muted border border-border";
    Glyph = FileQuestion;
    text = "No page yet";
  } else if (errors > 0) {
    tone = "bg-danger-tint text-danger";
    Glyph = CircleX;
    text = `${plural(errors, "error")}, ${plural(warnings, "warning")}`;
  } else if (warnings > 0) {
    tone = "bg-warning-tint text-warning";
    Glyph = TriangleAlert;
    text = `Valid, ${plural(warnings, "warning")}`;
  }

  return (
    <p
      role="status"
      className={`inline-flex min-h-8 items-center gap-2 rounded-pill px-3 text-small font-medium ${tone}`}
    >
      <Glyph size={16} strokeWidth={1.75} aria-hidden />
      {text}
    </p>
  );
}

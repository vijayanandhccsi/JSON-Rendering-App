export type Severity = "error" | "warning";

export interface ValidationIssue {
  severity: Severity;
  /** Zero-based index of the top-level block, or null for page-level and JSON problems. */
  blockIndex: number | null;
  /** The type of the block the problem is in (a nested block reports its own type). */
  blockType: string | null;
  /** Where the problem is, for example `blocks[3].items[0].title`. */
  path: string;
  /** What is wrong, in plain English. */
  message: string;
  /** How to fix it, in plain English. */
  fix: string;
  /** One-based line and column, only for JSON syntax errors. */
  line?: number;
  column?: number;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
}

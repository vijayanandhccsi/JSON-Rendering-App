import type { z } from "zod";
import { describeValue, getAt, isRecord, pathToString, quoteList } from "./util";
import type { PathSegment } from "./util";

export interface Described {
  /** Field the problem is about, relative to the block (or page). */
  label: string;
  message: string;
  fix: string;
  code?: string;
}

const EXPECTED: Record<string, string> = {
  string: "a text string",
  number: "a number",
  int: "a whole number",
  boolean: "true or false",
  array: "a list",
  object: "an object",
};

const FIELD_FIXES: Record<string, string> = {
  chapter:
    'Add "chapter" with the chapter slug in lowercase with hyphens, for example "network-security-basics".',
  title: 'Add a "title".',
  summary: 'Add a "summary" of one or two sentences saying what the learner will understand.',
  blocks: 'Add a "blocks" list with at least one block.',
  alt: 'Add an "alt" label: a few words saying what the image is.',
  description: 'Add a "description" of 1 to 3 sentences saying what the image or chart shows.',
  src: 'Add "src" with the image file name only, for example "osi-model.webp".',
  type: 'Add a "type" naming the block, for example "paragraph".',
};

const CONTEXT_FIXES: Record<string, string> = {
  "heading.level":
    'Use level 2, 3 or 4. The page title is set in the page "title", so headings start at level 2.',
};

function fieldFix(blockType: string | null, path: readonly PathSegment[], label: string): string {
  const key = path[path.length - 1];
  if (typeof key === "string") {
    const contextual = blockType ? CONTEXT_FIXES[`${blockType}.${key}`] : undefined;
    if (contextual) return contextual;
    const known = FIELD_FIXES[key];
    if (known) return known;
    return `Add the "${label}" field${blockType ? ` (see the ${blockType} block in guide.md)` : ""}.`;
  }
  return `Add the missing value at "${label}".`;
}

/** Turns one Zod issue into a plain-English message and fix. `root` is the value that was parsed. */
export function describeZodIssue(
  issue: z.core.$ZodIssue,
  root: unknown,
  blockType: string | null,
): Described {
  const path = issue.path as PathSegment[];
  const label = pathToString(path);
  const value = getAt(root, path);
  const missing = value === undefined && path.length > 0;
  const objectFix = "Write it as an object with the fields shown in guide.md.";
  const where = label === "" ? (blockType ? `this ${blockType} block` : "the page") : `"${label}"`;

  if (issue.code === "unrecognized_keys") {
    const keys = quoteList(issue.keys);
    const plural = issue.keys.length > 1;
    return {
      label,
      message: `Unknown field${plural ? "s" : ""} ${keys} in ${blockType ? `this ${blockType} block` : "the page"}${label ? ` (at "${label}")` : ""}.`,
      fix: `Remove ${keys}. Only the fields listed in guide.md ${blockType ? `for "${blockType}"` : "for the page"} are allowed.`,
    };
  }

  if (missing && (issue.code === "invalid_type" || issue.code === "invalid_value")) {
    const allowed = issue.code === "invalid_value" ? ` One of: ${quoteList(issue.values)}.` : "";
    return {
      label,
      message: `${where} is required.${allowed}`,
      fix: fieldFix(blockType, path, label) + allowed,
    };
  }

  switch (issue.code) {
    case "invalid_type": {
      const expected = EXPECTED[issue.expected] ?? issue.expected;
      return {
        label,
        message: `${where} must be ${expected} but is ${describeValue(value)}.`,
        fix: issue.expected === "object" ? objectFix : `Change ${where} to ${expected}.`,
      };
    }
    case "invalid_value":
      if (issue.values.length === 1) {
        return {
          label,
          message: `${where} must be ${quoteList(issue.values)} but is ${describeValue(value)}.`,
          fix: `Set ${where} to ${quoteList(issue.values)}.`,
        };
      }
      return {
        label,
        message: `${where} must be one of ${quoteList(issue.values)} but is ${describeValue(value)}.`,
        fix:
          (blockType
            ? CONTEXT_FIXES[`${blockType}.${String(path[path.length - 1])}`]
            : undefined) ?? `Change ${where} to one of: ${quoteList(issue.values)}.`,
      };
    case "too_small": {
      const n = Number(issue.minimum);
      if (issue.origin === "string") {
        return {
          label,
          message: `${where} must not be empty.`,
          fix: `Write some text in ${where}.`,
        };
      }
      if (issue.origin === "array" || issue.origin === "set") {
        const exact = issue.exact === true;
        return {
          label,
          message: `${where} must have ${exact ? "exactly" : "at least"} ${n} item${n === 1 ? "" : "s"}${isRecord(value) || Array.isArray(value) ? ` but has ${Array.isArray(value) ? value.length : 0}` : ""}.`,
          fix: exact
            ? `Make ${where} contain exactly ${n} item${n === 1 ? "" : "s"}.`
            : `Add at least ${n - (Array.isArray(value) ? value.length : 0)} more item(s) to ${where}.`,
        };
      }
      return {
        label,
        message: `${where} must be at least ${n} but is ${describeValue(value)}.`,
        fix: `Use a value of ${n} or more in ${where}.`,
      };
    }
    case "too_big": {
      const n = Number(issue.maximum);
      if (issue.origin === "array") {
        return {
          label,
          message: `${where} must have ${issue.exact === true ? "exactly" : "at most"} ${n} item${n === 1 ? "" : "s"} but has ${Array.isArray(value) ? value.length : "more"}.`,
          fix: `Make ${where} contain ${issue.exact === true ? "exactly" : "at most"} ${n} item${n === 1 ? "" : "s"}.`,
        };
      }
      return {
        label,
        message: `${where} must be at most ${n} but is ${describeValue(value)}.`,
        fix: `Use a value of ${n} or less in ${where}.`,
      };
    }
    case "invalid_format":
      return {
        label,
        message: `${where} ${issue.message.replace(/^Invalid string: /, "")}.`,
        fix:
          label === "chapter"
            ? 'Use lowercase letters, digits and hyphens only, for example "network-security-basics".'
            : `Change ${where} so it matches the required format.`,
      };
    case "custom": {
      const params = issue.params as { fix?: string; code?: string } | undefined;
      return {
        label,
        message: `${where} ${issue.message}.`,
        fix: params?.fix ?? "Check this field against guide.md.",
        ...(params?.code ? { code: params.code } : {}),
      };
    }
    default:
      return {
        label,
        message: `${where} is not valid: ${issue.message}.`,
        fix: "Compare this field with the block reference in guide.md.",
      };
  }
}

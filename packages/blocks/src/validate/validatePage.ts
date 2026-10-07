import type { z } from "zod";
import {
  BLOCK_SCHEMAS,
  BLOCK_TYPES,
  BLOCK_VARIANTS,
  CONTAINER_TYPES,
  NESTED_BLOCK_TYPES,
  PageShellSchema,
} from "../schema";
import type { BlockType } from "../schema";
import type { ValidationIssue, ValidationResult } from "./types";
import { collectPageChecks } from "./warnings";
import { closestMatch, describeValue, isRecord, pathToString, quoteList } from "./util";
import type { PathSegment } from "./util";
import { describeZodIssue } from "./zodIssues";

const isBlockType = (value: unknown): value is BlockType =>
  typeof value === "string" && (BLOCK_TYPES as readonly string[]).includes(value);
const isContainer = (type: string) => (CONTAINER_TYPES as readonly string[]).includes(type);
const isNestable = (type: string) => (NESTED_BLOCK_TYPES as readonly string[]).includes(type);

function error(
  issues: ValidationIssue[],
  blockIndex: number | null,
  blockType: string | null,
  path: readonly PathSegment[],
  message: string,
  fix: string,
): void {
  issues.push({ severity: "error", blockIndex, blockType, path: pathToString(path), message, fix });
}

/** Children of a container, as the paths where they live. */
function childLists(
  block: Record<string, unknown>,
  path: PathSegment[],
): { blocks: unknown; path: PathSegment[] }[] {
  const lists: { blocks: unknown; path: PathSegment[] }[] = [];
  if (block.type === "expandable") lists.push({ blocks: block.blocks, path: [...path, "blocks"] });
  const key = block.type === "accordion" ? "items" : block.type === "tabs" ? "tabs" : null;
  if (key && Array.isArray(block[key])) {
    (block[key] as unknown[]).forEach((entry, i) => {
      if (isRecord(entry)) lists.push({ blocks: entry.blocks, path: [...path, key, i, "blocks"] });
    });
  }
  return lists;
}

function validateBlock(
  value: unknown,
  path: PathSegment[],
  blockIndex: number,
  nested: boolean,
  issues: ValidationIssue[],
): void {
  if (!isRecord(value)) {
    error(
      issues,
      blockIndex,
      null,
      path,
      `This block is ${describeValue(value)}, not an object.`,
      'Make it an object such as { "type": "paragraph", "text": "..." }.',
    );
    return;
  }

  const type = value.type;
  if (type === undefined) {
    error(
      issues,
      blockIndex,
      null,
      [...path, "type"],
      '"type" is required on every block.',
      `Add a "type" using one of the block types in guide.md: ${BLOCK_TYPES.join(", ")}.`,
    );
    return;
  }
  if (!isBlockType(type)) {
    const guess = typeof type === "string" ? closestMatch(type, BLOCK_TYPES) : undefined;
    error(
      issues,
      blockIndex,
      null,
      [...path, "type"],
      `Unknown block type ${typeof type === "string" ? `"${type}"` : describeValue(type)}.`,
      guess
        ? `Did you mean "${guess}"? Use only the 27 block types in guide.md.`
        : `Use one of the 27 block types in guide.md: ${BLOCK_TYPES.join(", ")}.`,
    );
    return;
  }

  if (nested && !isNestable(type)) {
    const reason = isContainer(type)
      ? `A "${type}" block cannot go inside another container (accordion, tabs or expandable).`
      : `A "${type}" block cannot be nested inside accordion, tabs or expandable.`;
    error(
      issues,
      blockIndex,
      type,
      path,
      reason,
      `Move it out to the top level of "blocks". Nested blocks may only be: ${NESTED_BLOCK_TYPES.join(", ")}.`,
    );
    return;
  }

  let schema: z.ZodType = BLOCK_SCHEMAS[type];
  const variant = BLOCK_VARIANTS[type];
  if (variant) {
    const chosen = value[variant.key];
    const allowed = Object.keys(variant.schemas);
    const match = typeof chosen === "string" ? variant.schemas[chosen] : undefined;
    if (!match) {
      error(
        issues,
        blockIndex,
        type,
        [...path, variant.key],
        chosen === undefined
          ? `"${variant.key}" is required on a ${type} block. One of: ${quoteList(allowed)}.`
          : `"${variant.key}" must be one of ${quoteList(allowed)} but is ${describeValue(chosen)}.`,
        `Set "${variant.key}" to one of: ${quoteList(allowed)}.`,
      );
      return;
    }
    schema = match;
  }

  const result = schema.safeParse(value);
  if (!result.success) {
    const container = isContainer(type);
    for (const issue of result.error.issues) {
      // Children are checked one by one below, with clearer messages and exact paths.
      const at = issue.path.indexOf("blocks");
      if (container && at !== -1 && issue.path.length > at + 1) continue;
      const described = describeZodIssue(issue, value, type);
      error(
        issues,
        blockIndex,
        type,
        [...path, ...(issue.path as PathSegment[])],
        described.message,
        described.fix,
      );
    }
  }

  if (isContainer(type)) {
    for (const list of childLists(value, path)) {
      if (!Array.isArray(list.blocks)) continue;
      list.blocks.forEach((child, i) =>
        validateBlock(child, [...list.path, i], blockIndex, true, issues),
      );
    }
  }
}

/** Checks a page against every rule in the schema. Errors block download; warnings do not. */
export function validatePage(input: unknown): ValidationResult {
  const issues: ValidationIssue[] = [];

  if (!isRecord(input)) {
    error(
      issues,
      null,
      null,
      [],
      `The page must be a JSON object, but it is ${describeValue(input)}.`,
      'Make the whole JSON one object that starts with { and has "chapter", "title", "summary" and "blocks".',
    );
    return { valid: false, errors: issues, warnings: [] };
  }

  const shell = PageShellSchema.safeParse(input);
  if (!shell.success) {
    for (const issue of shell.error.issues) {
      const described = describeZodIssue(issue, input, null);
      error(issues, null, null, issue.path as PathSegment[], described.message, described.fix);
    }
  }

  if (Array.isArray(input.blocks)) {
    input.blocks.forEach((block, i) => validateBlock(block, ["blocks", i], i, false, issues));
  }

  const checks = collectPageChecks(input);
  const errors = [...issues, ...checks.filter((issue) => issue.severity === "error")];
  const warnings = checks.filter((issue) => issue.severity === "warning");
  return { valid: errors.length === 0, errors, warnings };
}

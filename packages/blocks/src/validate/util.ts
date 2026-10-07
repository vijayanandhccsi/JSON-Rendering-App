export { closestMatch } from "../closestMatch";

export type PathSegment = string | number;

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Turns ["blocks", 3, "title"] into "blocks[3].title". */
export function pathToString(path: readonly PathSegment[]): string {
  let out = "";
  for (const segment of path) {
    out += typeof segment === "number" ? `[${segment}]` : out === "" ? segment : `.${segment}`;
  }
  return out;
}

export function getAt(root: unknown, path: readonly PathSegment[]): unknown {
  let current: unknown = root;
  for (const segment of path) {
    if (Array.isArray(current) && typeof segment === "number") current = current[segment];
    else if (isRecord(current) && typeof segment === "string") current = current[segment];
    else return undefined;
  }
  return current;
}

export function quoteList(values: readonly unknown[]): string {
  return values.map((v) => (typeof v === "string" ? `"${v}"` : String(v))).join(", ");
}

export function describeValue(value: unknown): string {
  if (value === null) return "null";
  if (Array.isArray(value)) return "a list";
  if (typeof value === "string")
    return value === ""
      ? "an empty string"
      : `the text "${value.length > 40 ? `${value.slice(0, 40)}...` : value}"`;
  if (typeof value === "number" || typeof value === "boolean")
    return `the ${typeof value} ${String(value)}`;
  if (typeof value === "object") return "an object";
  return typeof value;
}

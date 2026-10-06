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

function distance(a: string, b: string): number {
  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let previous = row[0] ?? 0;
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const above = row[j] ?? 0;
      row[j] = Math.min(
        above + 1,
        (row[j - 1] ?? 0) + 1,
        previous + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
      previous = above;
    }
  }
  return row[b.length] ?? 0;
}

/** The candidate closest to `value`, if it is close enough to be a likely typo. */
export function closestMatch(value: string, candidates: readonly string[]): string | undefined {
  let best: string | undefined;
  let bestDistance = Infinity;
  for (const candidate of candidates) {
    const d = distance(value.toLowerCase(), candidate.toLowerCase());
    if (d < bestDistance) {
      best = candidate;
      bestDistance = d;
    }
  }
  return best !== undefined && bestDistance <= Math.max(2, Math.floor(best.length / 3))
    ? best
    : undefined;
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

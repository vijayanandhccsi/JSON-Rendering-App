import { pathToString } from "@certkraft/blocks";

export interface Range {
  from: number;
  to: number;
}

/** Where each value in a JSON text is, keyed by its path in the same form the validator uses. */
export type PathIndex = Map<string, Range>;

class Stop extends Error {}

/**
 * Finds the character range of every value in JSON text, for example "blocks[0].title".
 * A syntax error stops the scan, but everything found before it is kept.
 */
export function indexJson(text: string): PathIndex {
  const index: PathIndex = new Map();
  let i = 0;

  const skip = () => {
    while (i < text.length && /\s/.test(text[i] ?? "")) i++;
  };

  const string = (): string => {
    const start = i;
    i++;
    while (i < text.length && text[i] !== '"') i += text[i] === "\\" ? 2 : 1;
    if (i >= text.length) throw new Stop();
    i++;
    try {
      return JSON.parse(text.slice(start, i)) as string;
    } catch {
      throw new Stop();
    }
  };

  const value = (path: (string | number)[]): void => {
    skip();
    const start = i;
    const char = text[i];
    if (char === "{") {
      i++;
      skip();
      if (text[i] === "}") i++;
      else {
        for (;;) {
          skip();
          if (text[i] !== '"') throw new Stop();
          const key = string();
          skip();
          if (text[i] !== ":") throw new Stop();
          i++;
          value([...path, key]);
          skip();
          if (text[i] === ",") i++;
          else if (text[i] === "}") {
            i++;
            break;
          } else throw new Stop();
        }
      }
    } else if (char === "[") {
      i++;
      skip();
      if (text[i] === "]") i++;
      else {
        for (let n = 0; ; n++) {
          value([...path, n]);
          skip();
          if (text[i] === ",") i++;
          else if (text[i] === "]") {
            i++;
            break;
          } else throw new Stop();
        }
      }
    } else if (char === '"') {
      string();
    } else {
      const match = /^(true|false|null|-?\d+(\.\d+)?([eE][+-]?\d+)?)/.exec(text.slice(i));
      if (!match) throw new Stop();
      i += match[0].length;
    }
    index.set(pathToString(path), { from: start, to: i });
  };

  try {
    value([]);
  } catch (cause) {
    if (!(cause instanceof Stop)) throw cause;
  }
  return index;
}

const LAST_SEGMENT = /(\.[^.[\]]+|\[\d+\])$/;

/**
 * The range to mark for a validation path. If the path itself is not in the text (a missing field),
 * the closest parent is used, and a block is marked at its "type".
 */
export function markerRange(index: PathIndex, path: string, text: string): Range | null {
  let current = path;
  for (;;) {
    const found = index.get(current);
    if (found) {
      const type = index.get(current === "" ? "type" : `${current}.type`);
      const range = type && /^\{/.test(text.slice(found.from, found.from + 1)) ? type : found;
      return singleLine(range, text);
    }
    if (current === "") return null;
    const next = current.replace(LAST_SEGMENT, "");
    current = next === current ? "" : next;
  }
}

/** A range cut to its first line, so a squiggle under a whole block does not cover the page. */
function singleLine(range: Range, text: string): Range {
  const lineEnd = text.indexOf("\n", range.from);
  return lineEnd !== -1 && lineEnd < range.to ? { from: range.from, to: lineEnd } : range;
}

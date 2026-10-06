export interface JsonSyntaxError {
  /** Zero-based character offset of the problem. */
  position: number;
  message: string;
}

const WHITESPACE = new Set([" ", "\t", "\n", "\r"]);
const ESCAPES = new Set(['"', "\\", "/", "b", "f", "n", "r", "t"]);

/**
 * Finds the first syntax error in JSON text, or null if the text is valid JSON.
 * JSON.parse messages differ between browsers and often have no position, so this
 * small strict parser is used to say exactly where the problem is.
 */
export function locateJsonError(text: string): JsonSyntaxError | null {
  let i = 0;

  class Stop extends Error {
    constructor(
      public position: number,
      message: string,
    ) {
      super(message);
    }
  }

  const describe = (index: number) =>
    index >= text.length
      ? "the end of the text"
      : `"${text[index] === "\n" ? "\\n" : text[index]}"`;
  const fail = (message: string, at = i): never => {
    throw new Stop(at, message);
  };
  const skip = () => {
    while (i < text.length && WHITESPACE.has(text[i] ?? "")) i++;
  };

  const string = () => {
    i++; // opening quote
    while (i < text.length) {
      const c = text[i] ?? "";
      if (c === '"') {
        i++;
        return;
      }
      if (c === "\n" || c === "\r") fail("A string cannot contain a line break. Use \\n instead");
      if (c === "\\") {
        const next = text[i + 1] ?? "";
        if (next === "u") {
          if (!/^[0-9a-fA-F]{4}$/.test(text.slice(i + 2, i + 6)))
            fail("Invalid \\u escape in a string", i);
          i += 6;
          continue;
        }
        if (!ESCAPES.has(next)) fail(`Invalid escape "\\${next}" in a string`, i);
        i += 2;
        continue;
      }
      i++;
    }
    fail("A string is missing its closing double quote", text.length);
  };

  const number = () => {
    const match = /^-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?/.exec(text.slice(i));
    if (!match) fail(`Unexpected ${describe(i)}. Expected a value`);
    i += match?.[0].length ?? 0;
  };

  const literal = (word: string) => {
    if (text.startsWith(word, i)) i += word.length;
    else fail(`Unexpected text. Expected ${word}. Text values need double quotes`);
  };

  const value = (): void => {
    skip();
    const c = text[i];
    if (c === "{") {
      i++;
      skip();
      if (text[i] === "}") {
        i++;
        return;
      }
      for (;;) {
        skip();
        if (text[i] === "}") fail("A trailing comma is not allowed before }");
        if (text[i] !== '"') fail(`Unexpected ${describe(i)}. Property names need double quotes`);
        string();
        skip();
        if (text[i] !== ":")
          fail(`Unexpected ${describe(i)}. Expected ":" after the property name`);
        i++;
        value();
        skip();
        if (text[i] === ",") {
          i++;
          continue;
        }
        if (text[i] === "}") {
          i++;
          return;
        }
        fail(`Unexpected ${describe(i)}. Expected "," or "}" (is a comma missing?)`);
      }
    } else if (c === "[") {
      i++;
      skip();
      if (text[i] === "]") {
        i++;
        return;
      }
      for (;;) {
        skip();
        if (text[i] === "]") fail("A trailing comma is not allowed before ]");
        value();
        skip();
        if (text[i] === ",") {
          i++;
          continue;
        }
        if (text[i] === "]") {
          i++;
          return;
        }
        fail(`Unexpected ${describe(i)}. Expected "," or "]" (is a comma missing?)`);
      }
    } else if (c === '"') string();
    else if (c === "t") literal("true");
    else if (c === "f") literal("false");
    else if (c === "n") literal("null");
    else if (c === "-" || (c !== undefined && c >= "0" && c <= "9")) number();
    else fail(`Unexpected ${describe(i)}. Expected a value`);
  };

  try {
    value();
    skip();
    if (i < text.length) fail(`Unexpected ${describe(i)} after the end of the JSON`);
    return null;
  } catch (cause) {
    if (cause instanceof Stop) return { position: cause.position, message: cause.message };
    throw cause;
  }
}

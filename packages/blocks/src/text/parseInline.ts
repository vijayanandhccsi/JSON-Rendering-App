/** The only inline formatting allowed in page text: **bold**, *italic* and `code`. */
export type InlineNode =
  | { kind: "text"; value: string }
  | { kind: "code"; value: string }
  | { kind: "bold" | "italic"; children: InlineNode[] };

const isSpace = (char: string | undefined) => char === undefined || /\s/.test(char);

/** Index of the closing `marker` at or after `from`, skipping `code` spans. -1 if there is none. */
function findClose(text: string, marker: "*" | "**", from: number): number {
  for (let i = from; i < text.length; i++) {
    const char = text[i];
    if (char === "`") {
      const end = text.indexOf("`", i + 1);
      if (end === -1) continue;
      i = end;
    } else if (char === "*") {
      const isDouble = text[i + 1] === "*";
      if (marker === "**") {
        if (isDouble) {
          // In a run of three stars, the last two close the bold (and the first closes an italic).
          return text[i + 2] === "*" ? i + 1 : i;
        }
      } else if (isDouble) {
        i++; // skip a bold marker inside italic text
      } else {
        return i;
      }
    }
  }
  return -1;
}

function parse(text: string, allowBold: boolean, allowItalic: boolean): InlineNode[] {
  const nodes: InlineNode[] = [];
  let plain = "";
  const flush = () => {
    if (plain) nodes.push({ kind: "text", value: plain });
    plain = "";
  };

  let i = 0;
  while (i < text.length) {
    const char = text[i];

    if (char === "`") {
      const end = text.indexOf("`", i + 1);
      if (end > i + 1) {
        flush();
        nodes.push({ kind: "code", value: text.slice(i + 1, end) });
        i = end + 1;
        continue;
      }
    } else if (char === "*" && text[i + 1] === "*" && allowBold && !isSpace(text[i + 2])) {
      const end = findClose(text, "**", i + 2);
      if (end > i + 2 && !isSpace(text[end - 1])) {
        flush();
        nodes.push({ kind: "bold", children: parse(text.slice(i + 2, end), false, allowItalic) });
        i = end + 2;
        continue;
      }
    } else if (char === "*" && text[i + 1] !== "*" && allowItalic && !isSpace(text[i + 1])) {
      const end = findClose(text, "*", i + 1);
      if (end > i + 1 && !isSpace(text[end - 1])) {
        flush();
        nodes.push({ kind: "italic", children: parse(text.slice(i + 1, end), allowBold, false) });
        i = end + 1;
        continue;
      }
    }

    plain += char;
    i++;
  }
  flush();
  return nodes;
}

export function parseInline(text: string): InlineNode[] {
  return parse(text, true, true);
}

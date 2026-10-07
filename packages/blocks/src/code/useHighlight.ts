import { useEffect, useState } from "react";
import { highlight } from "./highlight";
import type { HighlightedLines } from "./highlight";

/** Highlighted lines for `code`, or null until they are ready (or if the language is unknown). */
export function useHighlight(code: string, language: string): HighlightedLines | null {
  const [result, setResult] = useState<{
    code: string;
    language: string;
    lines: HighlightedLines;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    highlight(code, language)
      .then((lines) => {
        if (!cancelled && lines) setResult({ code, language, lines });
      })
      .catch(() => {
        // Highlighting is a nicety: on any failure the plain text stays on screen.
      });
    return () => {
      cancelled = true;
    };
  }, [code, language]);

  return result && result.code === code && result.language === language ? result.lines : null;
}

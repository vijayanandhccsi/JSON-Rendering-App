import { PageSchema, validateJsonText } from "@certkraft/blocks";
import type { Page, ValidationResult } from "@certkraft/blocks";
import { useEffect, useState } from "react";
import { indexJson } from "../editor/jsonPositions";
import type { PathIndex } from "../editor/jsonPositions";

export interface Validation {
  /** The text that was checked. */
  text: string;
  empty: boolean;
  result: ValidationResult;
  index: PathIndex;
  /** The page, when the text is valid. */
  page: Page | null;
}

function check(text: string): Validation {
  const result = validateJsonText(text);
  let page: Page | null = null;
  if (result.valid) {
    const parsed = PageSchema.safeParse(JSON.parse(text));
    if (parsed.success) page = parsed.data;
  }
  return { text, empty: text.trim() === "", result, index: indexJson(text), page };
}

const DEBOUNCE_MS = 200;

/** Validates JSON text shortly after it stops changing. */
export function useValidation(text: string): Validation {
  const [validation, setValidation] = useState(() => check(text));

  useEffect(() => {
    if (text === validation.text) return;
    const id = setTimeout(() => setValidation(check(text)), DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [text, validation.text]);

  return validation;
}

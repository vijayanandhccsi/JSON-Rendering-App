export interface ExtractedJsonResult {
  found: boolean;
  json?: unknown;
  rawJsonString?: string;
}

export function extractJsonFromText(text: string): ExtractedJsonResult {
  if (!text || typeof text !== "string") {
    return { found: false };
  }

  // 1. Try matching code blocks ```json ... ``` or ``` ... ```
  const codeBlockRegex = /```(?:json)?\s*([\s\S]*?)\s*```/i;
  const match = codeBlockRegex.exec(text);

  if (match && match[1]) {
    const candidate = match[1].trim();
    try {
      const parsed = JSON.parse(candidate);
      if (parsed && typeof parsed === "object") {
        return { found: true, json: parsed, rawJsonString: candidate };
      }
    } catch {
      // ignore
    }
  }

  // 2. Try finding outermost curly braces { ... }
  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");

  if (firstBrace !== -1 && lastBrace > firstBrace) {
    const candidate = text.slice(firstBrace, lastBrace + 1).trim();
    try {
      const parsed = JSON.parse(candidate);
      if (parsed && typeof parsed === "object") {
        return { found: true, json: parsed, rawJsonString: candidate };
      }
    } catch {
      // ignore
    }
  }

  return { found: false };
}

export interface Brief {
  file: string;
  brief: string;
}

/** The images a page says it needs. Reads the JSON leniently, so it works while other parts have errors. */
export function extractBriefs(text: string): Brief[] {
  try {
    const page = JSON.parse(text) as { imageBriefs?: unknown };
    if (!Array.isArray(page.imageBriefs)) return [];
    return page.imageBriefs.flatMap((entry: unknown) => {
      if (typeof entry !== "object" || entry === null) return [];
      const { file, brief } = entry as { file?: unknown; brief?: unknown };
      return typeof file === "string" && file !== ""
        ? [{ file, brief: typeof brief === "string" ? brief : "" }]
        : [];
    });
  } catch {
    return [];
  }
}

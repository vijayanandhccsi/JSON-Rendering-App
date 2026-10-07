/** Largest file the upload will read. A page is a few kilobytes, so this is generous. */
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

export function readFileText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error ?? new Error("The file could not be read."));
    reader.readAsText(file);
  });
}

/** Saves text as a file through the browser. Nothing is sent anywhere. */
export function downloadText(filename: string, text: string): void {
  const url = URL.createObjectURL(new Blob([text], { type: "application/json" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

const slug = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

/** A file name for a page, such as "network-security-basics-what-is-a-firewall.json". */
export function downloadName(json: string): string {
  try {
    const page = JSON.parse(json) as { chapter?: unknown; title?: unknown };
    const parts = [page.chapter, page.title]
      .map((part) => (typeof part === "string" ? slug(part) : ""))
      .filter(Boolean);
    return `${parts.join("-") || "page"}.json`;
  } catch {
    return "page.json";
  }
}

/** JSON text laid out with two-space indentation, or null if the text is not valid JSON. */
export function formatJson(text: string): string | null {
  try {
    return `${JSON.stringify(JSON.parse(text), null, 2)}\n`;
  } catch {
    return null;
  }
}

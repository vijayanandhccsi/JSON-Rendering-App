export interface DroppedFile {
  /** The name to show: just the file name, or folder/file name when a folder was dropped. */
  name: string;
  file: File;
}

const readFile = (entry: FileSystemFileEntry) =>
  new Promise<File>((resolve, reject) => entry.file(resolve, reject));

async function readAll(directory: FileSystemDirectoryEntry): Promise<FileSystemEntry[]> {
  const reader = directory.createReader();
  const entries: FileSystemEntry[] = [];
  // readEntries returns a few entries at a time (about 100) until it returns none.
  for (;;) {
    const batch = await new Promise<FileSystemEntry[]>((resolve, reject) =>
      reader.readEntries(resolve, reject),
    );
    if (batch.length === 0) return entries;
    entries.push(...batch);
  }
}

async function walk(entry: FileSystemEntry, out: DroppedFile[]): Promise<void> {
  if (entry.isFile) {
    out.push({
      name: entry.fullPath.replace(/^\//, ""),
      file: await readFile(entry as FileSystemFileEntry),
    });
  } else if (entry.isDirectory) {
    for (const child of await readAll(entry as FileSystemDirectoryEntry)) await walk(child, out);
  }
}

/**
 * The files in a drop, including the files inside any folders that were dropped.
 * The browser clears a drop once the event handler returns, so everything is read from it straight away.
 */
export async function collectDropped(data: DataTransfer): Promise<DroppedFile[]> {
  const plain = Array.from(data.files ?? []).map((file) => ({ name: file.name, file }));
  const entries = Array.from(data.items ?? [])
    .map((item) => (item.kind === "file" ? item.webkitGetAsEntry?.() : null))
    .filter((entry): entry is FileSystemEntry => !!entry);

  if (!entries.some((entry) => entry.isDirectory)) return plain;

  const out: DroppedFile[] = [];
  for (const entry of entries) await walk(entry, out);
  return out;
}

/** Splits files into the .json ones to check and a count of the others. */
export function splitJson<T extends { name: string }>(
  files: readonly T[],
): { json: T[]; skipped: number } {
  const json = files.filter((file) => /\.json$/i.test(file.name));
  return { json, skipped: files.length - json.length };
}

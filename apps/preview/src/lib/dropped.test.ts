import { describe, expect, it } from "vitest";
import { collectDropped, splitJson } from "./dropped";

const file = (name: string) => new File(["{}"], name);

function fileEntry(path: string): FileSystemEntry {
  return {
    isFile: true,
    isDirectory: false,
    fullPath: path,
    file: (ok: (f: File) => void) => ok(file(path.split("/").pop() ?? path)),
  } as unknown as FileSystemEntry;
}

/** A folder that hands out its children 2 at a time, like a browser does in batches. */
function directoryEntry(path: string, children: FileSystemEntry[]): FileSystemEntry {
  return {
    isFile: false,
    isDirectory: true,
    fullPath: path,
    createReader: () => {
      let next = 0;
      return {
        readEntries: (ok: (entries: FileSystemEntry[]) => void) => {
          const batch = children.slice(next, next + 2);
          next += 2;
          ok(batch);
        },
      };
    },
  } as unknown as FileSystemEntry;
}

const transfer = (files: File[], entries: (FileSystemEntry | null)[] = []) =>
  ({
    files,
    items: entries.map((entry) => ({ kind: "file", webkitGetAsEntry: () => entry })),
  }) as unknown as DataTransfer;

describe("collectDropped", () => {
  it("returns plain files as they are", async () => {
    const result = await collectDropped(transfer([file("a.json"), file("b.json")]));
    expect(result.map((r) => r.name)).toEqual(["a.json", "b.json"]);
  });

  it("works when the browser has no folder support", async () => {
    const result = await collectDropped({ files: [file("a.json")] } as unknown as DataTransfer);
    expect(result.map((r) => r.name)).toEqual(["a.json"]);
  });

  it("reads every file in a dropped folder, including subfolders and more than one batch of entries", async () => {
    const folder = directoryEntry("/chapter-1", [
      fileEntry("/chapter-1/page-1.json"),
      fileEntry("/chapter-1/page-2.json"),
      directoryEntry("/chapter-1/extra", [fileEntry("/chapter-1/extra/page-3.json")]),
      fileEntry("/chapter-1/notes.txt"),
    ]);
    const result = await collectDropped(transfer([file("chapter-1")], [folder]));
    expect(result.map((r) => r.name)).toEqual([
      "chapter-1/page-1.json",
      "chapter-1/page-2.json",
      "chapter-1/extra/page-3.json",
      "chapter-1/notes.txt",
    ]);
  });

  it("handles a folder and loose files in the same drop", async () => {
    const folder = directoryEntry("/f", [fileEntry("/f/a.json")]);
    const result = await collectDropped(
      transfer([file("f"), file("b.json")], [folder, fileEntry("/b.json")]),
    );
    expect(result.map((r) => r.name)).toEqual(["f/a.json", "b.json"]);
  });
});

describe("splitJson", () => {
  it("keeps .json files in any letter case and counts the rest", () => {
    const { json, skipped } = splitJson([
      { name: "a.json" },
      { name: "B.JSON" },
      { name: "c.txt" },
      { name: "d.json.bak" },
      { name: "folder/e.json" },
    ]);
    expect(json.map((f) => f.name)).toEqual(["a.json", "B.JSON", "folder/e.json"]);
    expect(skipped).toBe(2);
  });
});

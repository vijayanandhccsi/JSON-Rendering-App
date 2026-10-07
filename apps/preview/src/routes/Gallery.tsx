import {
  BLOCK_TYPES,
  BlockRenderer,
  MediaProvider,
  PageSchema,
  isWideBlock,
} from "@certkraft/blocks";
import type { Block } from "@certkraft/blocks";
import { Copy } from "lucide-react";
import { useMemo } from "react";
import { CHROME_BUTTON } from "../app/buttons";
import { DeviceToggle } from "../app/DeviceToggle";
import { DEFAULT_MEDIA_BASE_URL } from "../app/MediaUrlButton";
import { Shell } from "../app/Header";
import { DEVICES, isDeviceId } from "../app/devices";
import type { DeviceId } from "../app/devices";
import { useNotice } from "../app/useNotice";
import { useStoredState } from "../app/useStoredState";
import { STORAGE_KEYS, readStored } from "../lib/storage";

/** The block groups from DESIGN.md section 4, in order. */
export const GALLERY_GROUPS: { name: string; types: readonly (typeof BLOCK_TYPES)[number][] }[] = [
  { name: "Text", types: ["heading", "paragraph", "callout", "quote", "list"] },
  { name: "Media", types: ["image", "video"] },
  { name: "Code", types: ["code", "terminal"] },
  { name: "Reveal", types: ["accordion", "tabs", "expandable", "flipcard"] },
  { name: "Sequence", types: ["timeline", "carousel"] },
  { name: "Interactive", types: ["hotspot", "dragdrop", "beforeafter", "kanban", "timer"] },
  { name: "Comparison and reference", types: ["comparison", "scenario", "smartsheet"] },
  { name: "Grid and layout", types: ["grid", "card", "layout"] },
  { name: "Chart", types: ["chart"] },
];

export interface GalleryEntry {
  /** For example "list-icon" or "chart-sankey". */
  id: string;
  block: Block;
}

// The sample data is the same set of valid pages the tests use: one page for each block and variant.
const samples = import.meta.glob("../../../../fixtures/pages/valid/block-*.json", {
  eager: true,
  import: "default",
});

export function galleryEntries(): GalleryEntry[] {
  return Object.entries(samples)
    .flatMap(([path, json]) => {
      const block = PageSchema.parse(json).blocks[0];
      const id = /block-(.+)\.json$/.exec(path)?.[1];
      return block && id ? [{ id, block }] : [];
    })
    .sort((a, b) => a.id.localeCompare(b.id));
}

const label = (id: string) => id.replace(/-/g, " ");

export default function Gallery() {
  const entries = useMemo(galleryEntries, []);
  const [deviceId, setDeviceId] = useStoredState(STORAGE_KEYS.device, "mobile");
  const [notice, showNotice] = useNotice();
  const device = DEVICES.find((d) => d.id === deviceId) ?? DEVICES[0];
  const mediaBaseUrl = readStored(STORAGE_KEYS.media) ?? DEFAULT_MEDIA_BASE_URL;

  const copy = async (json: string) => {
    try {
      await navigator.clipboard.writeText(json);
      showNotice("Copied the block JSON.");
    } catch {
      showNotice("Could not copy to the clipboard.");
    }
  };

  return (
    <Shell route="/gallery">
      <div className="flex min-h-0 flex-1">
        <nav
          aria-label="Blocks"
          className="hidden w-60 shrink-0 overflow-y-auto border-r border-border bg-surface p-4 lg:block"
        >
          {GALLERY_GROUPS.map((group) => (
            <div key={group.name} className="mb-4">
              <p className="mb-1 text-caption font-semibold uppercase tracking-wide text-ink-muted">
                {group.name}
              </p>
              <ul role="list">
                {group.types.map((type) => (
                  <li key={type}>
                    <a
                      href={`#block-${type}`}
                      className="flex min-h-11 items-center rounded-control px-2 text-small hover:bg-bg"
                    >
                      {type}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <main className="min-h-0 min-w-0 flex-1 overflow-auto p-4 lg:p-6">
          <div className="mx-auto flex max-w-wide flex-col gap-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-h2 font-semibold">Block gallery</h1>
                <p className="mt-1 text-ink-muted">
                  Every block with sample data, at the chosen width. Open JSON to copy the example.
                </p>
              </div>
              <DeviceToggle
                value={isDeviceId(deviceId) ? deviceId : "mobile"}
                onChange={(id: DeviceId) => setDeviceId(id)}
              />
            </div>
            <p role="status" className="min-h-5 text-small text-ink-muted">
              {notice}
            </p>

            <details className="rounded-card border border-border bg-surface p-4 lg:hidden">
              <summary className="min-h-11 cursor-pointer font-medium">Jump to a block</summary>
              <ul role="list" className="mt-2 grid grid-cols-2 gap-1">
                {BLOCK_TYPES.map((type) => (
                  <li key={type}>
                    <a
                      href={`#block-${type}`}
                      className="flex min-h-11 items-center px-2 text-small"
                    >
                      {type}
                    </a>
                  </li>
                ))}
              </ul>
            </details>

            {GALLERY_GROUPS.map((group) => (
              <section
                key={group.name}
                aria-labelledby={`group-${group.name}`}
                className="flex flex-col gap-8"
              >
                <h2
                  id={`group-${group.name}`}
                  className="border-b border-border pb-2 text-h3 font-semibold"
                >
                  {group.name}
                </h2>
                {group.types.map((type) => (
                  <section
                    key={type}
                    id={`block-${type}`}
                    aria-labelledby={`title-${type}`}
                    className="flex scroll-mt-4 flex-col gap-4"
                  >
                    <h3 id={`title-${type}`} className="text-h4 font-semibold">
                      {type}
                    </h3>
                    {entries
                      .filter((entry) => entry.block.type === type)
                      .map((entry) => {
                        const json = JSON.stringify(entry.block, null, 2);
                        return (
                          <div key={entry.id} className="flex flex-col gap-2">
                            <p className="text-small font-medium text-ink-muted">
                              {label(entry.id)}
                            </p>
                            <div className="overflow-x-auto rounded-card border border-border">
                              <div
                                style={{ width: device?.width }}
                                className="mx-auto max-w-none bg-bg p-4"
                              >
                                <div
                                  className={`mx-auto w-full ${isWideBlock(entry.block) ? "max-w-wide" : "max-w-reading"}`}
                                >
                                  <MediaProvider baseUrl={mediaBaseUrl}>
                                    <BlockRenderer block={entry.block} />
                                  </MediaProvider>
                                </div>
                              </div>
                            </div>
                            <details className="rounded-card border border-border bg-surface">
                              <summary className="flex min-h-11 cursor-pointer items-center px-4 text-small font-medium">
                                JSON<span className="sr-only">: {label(entry.id)}</span>
                              </summary>
                              <div className="border-t border-border p-4">
                                <button
                                  type="button"
                                  className={`${CHROME_BUTTON} mb-3`}
                                  onClick={() => copy(json)}
                                >
                                  <Copy size={16} strokeWidth={1.75} aria-hidden />
                                  Copy JSON<span className="sr-only">: {label(entry.id)}</span>
                                </button>
                                <pre
                                  tabIndex={0}
                                  aria-label={`JSON: ${label(entry.id)}`}
                                  className="overflow-x-auto font-mono text-small"
                                >
                                  {json}
                                </pre>
                              </div>
                            </details>
                          </div>
                        );
                      })}
                  </section>
                ))}
              </section>
            ))}
          </div>
        </main>
      </div>
    </Shell>
  );
}

import { ChevronDown, CircleCheck, CircleX, Clock, Copy, RefreshCw } from "lucide-react";
import { useState } from "react";
import { CHROME_BUTTON } from "../app/buttons";
import type { Brief } from "../lib/briefs";
import { useImageStatus } from "./useImageStatus";
import type { ImageState } from "./useImageStatus";

interface ImageChecklistProps {
  briefs: readonly Brief[];
  mediaBaseUrl: string;
  onNotice: (message: string) => void;
}

const STATE: Record<ImageState, { label: string; tone: string; Glyph: typeof Clock }> = {
  checking: { label: "Checking", tone: "text-ink-muted", Glyph: Clock },
  found: { label: "Found", tone: "text-success-strong", Glyph: CircleCheck },
  missing: { label: "Missing", tone: "text-danger", Glyph: CircleX },
};

/** The images the page needs, from "imageBriefs", and whether each file is in the media folder. */
export function ImageChecklist({ briefs, mediaBaseUrl, onNotice }: ImageChecklistProps) {
  const [open, setOpen] = useState(false);
  const { status, recheck } = useImageStatus(
    mediaBaseUrl,
    briefs.map((brief) => brief.file),
  );

  const stateOf = (file: string): ImageState => status[file] ?? "checking";
  const found = briefs.filter((brief) => stateOf(brief.file) === "found").length;
  const missing = briefs.filter((brief) => stateOf(brief.file) === "missing");
  const checking = briefs.some((brief) => stateOf(brief.file) === "checking");

  const summary =
    briefs.length === 0
      ? "Images: none listed"
      : checking
        ? `Images: checking ${briefs.length}`
        : `Images: ${found} of ${briefs.length} found`;

  const copyMissing = async () => {
    const lines = missing.map((brief) => `- ${brief.file}${brief.brief ? `: ${brief.brief}` : ""}`);
    try {
      await navigator.clipboard.writeText(
        `Images still needed (${mediaBaseUrl}):\n${lines.join("\n")}`,
      );
      onNotice("Copied the list of missing images.");
    } catch {
      onNotice("Could not copy to the clipboard.");
    }
  };

  return (
    <section
      aria-label="Images"
      className="flex max-h-1/3 min-h-0 shrink-0 flex-col border-t border-border bg-surface"
    >
      <div className="flex min-h-11 items-center justify-between gap-2 px-2">
        <button
          type="button"
          aria-expanded={open}
          aria-controls="image-list"
          onClick={() => setOpen((value) => !value)}
          className="flex min-h-11 items-center gap-2 rounded-control px-2 text-small font-medium"
        >
          <ChevronDown
            size={16}
            strokeWidth={1.75}
            aria-hidden
            className={`transition-transform duration-150 ease-out ${open ? "" : "-rotate-90"}`}
          />
          {summary}
        </button>
        {open && briefs.length > 0 ? (
          <div className="flex gap-2">
            <button type="button" className={CHROME_BUTTON} onClick={recheck}>
              <RefreshCw size={16} strokeWidth={1.75} aria-hidden />
              Check again
            </button>
            <button
              type="button"
              className={CHROME_BUTTON}
              onClick={copyMissing}
              disabled={missing.length === 0}
            >
              <Copy size={16} strokeWidth={1.75} aria-hidden />
              Copy missing
            </button>
          </div>
        ) : null}
      </div>
      <div
        id="image-list"
        hidden={!open}
        className="min-h-0 overflow-y-auto border-t border-border"
      >
        {briefs.length === 0 ? (
          <p className="px-4 py-3 text-small text-ink-muted">
            This page lists no images. Each image on the page needs an entry in{" "}
            <span className="font-mono">imageBriefs</span>.
          </p>
        ) : (
          <>
            <p className="px-4 pt-3 text-caption text-ink-muted">
              Looking in <span className="font-mono">{mediaBaseUrl}</span>
            </p>
            <ul role="list" className="divide-y divide-border">
              {briefs.map((brief, index) => {
                const { label, tone, Glyph } = STATE[stateOf(brief.file)];
                return (
                  <li
                    key={`${brief.file}-${index}`}
                    className="flex items-start gap-3 px-4 py-2 text-small"
                  >
                    <span
                      className={`mt-0.5 inline-flex shrink-0 items-center gap-1 font-medium ${tone}`}
                    >
                      <Glyph size={16} strokeWidth={1.75} aria-hidden />
                      {label}
                    </span>
                    <span className="min-w-0">
                      <span className="block break-all font-mono">{brief.file}</span>
                      {brief.brief ? (
                        <span className="block text-ink-muted">{brief.brief}</span>
                      ) : null}
                    </span>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>
    </section>
  );
}

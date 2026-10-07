import { PageRenderer } from "@certkraft/blocks";
import type { Page } from "@certkraft/blocks";
import { CHROME_BUTTON } from "../app/buttons";
import { PageInfo } from "./PageInfo";
import { PreviewBoundary } from "./PreviewBoundary";

interface PreviewPaneProps {
  /** The latest valid page, or null if there has not been one yet. */
  page: Page | null;
  empty: boolean;
  errorCount: number;
  /** True when the text now has errors and the page shown is an older, valid version. */
  stale: boolean;
  width: number;
  mediaBaseUrl: string;
  onSample: () => void;
}

export function PreviewPane({
  page,
  empty,
  errorCount,
  stale,
  width,
  mediaBaseUrl,
  onSample,
}: PreviewPaneProps) {
  if (empty) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center">
        <p className="max-w-reading">
          Paste a page&apos;s JSON into the editor, or upload a .json file. The finished page
          appears here.
        </p>
        <button type="button" className={CHROME_BUTTON} onClick={onSample}>
          Load sample page
        </button>
      </div>
    );
  }

  if (!page) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-center">
        <p role="status" className="max-w-reading">
          Fix the {errorCount} {errorCount === 1 ? "error" : "errors"} to see the page. They are
          listed under the editor.
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-col gap-4 p-4 lg:p-6">
      {stale ? (
        <p
          role="status"
          className="mx-auto w-full max-w-wide rounded-control bg-warning-tint px-4 py-2 text-small text-ink"
        >
          Showing the last valid version. Fix{" "}
          {errorCount === 1 ? "the error" : `the ${errorCount} errors`} to update the preview.
        </p>
      ) : null}
      <PageInfo page={page} />
      <p className="mx-auto text-caption text-ink-muted">{width} px wide</p>
      <div
        data-testid="device-frame"
        style={{ width }}
        className="mx-auto shrink-0 overflow-hidden rounded-card border border-border bg-surface shadow-raised"
      >
        <PreviewBoundary resetKey={page}>
          <PageRenderer page={page} mediaBaseUrl={mediaBaseUrl} />
        </PreviewBoundary>
      </div>
    </div>
  );
}

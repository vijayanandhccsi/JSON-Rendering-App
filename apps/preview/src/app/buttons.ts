// Chrome buttons for the preview app (not part of the learner page). Primary style: Download only.
const BASE =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-control px-3 py-2 text-small font-medium transition-colors duration-150 ease-out disabled:cursor-not-allowed disabled:opacity-50";

export const CHROME_BUTTON = `${BASE} border border-border bg-surface text-ink hover:bg-bg`;
export const CHROME_PRIMARY_BUTTON = `${BASE} bg-primary-strong text-surface hover:bg-primary-strong-hover`;

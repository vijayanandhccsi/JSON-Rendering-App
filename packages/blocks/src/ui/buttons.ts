const BUTTON =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-control px-5 py-2 font-medium transition-colors duration-150 ease-out disabled:cursor-not-allowed disabled:opacity-60";

/** White text on primary-strong passes AA (see DESIGN.md). */
export const PRIMARY_BUTTON = `${BUTTON} bg-primary-strong text-surface hover:bg-primary-strong-hover`;
export const SECONDARY_BUTTON = `${BUTTON} border border-border bg-surface text-ink hover:bg-bg`;

import type { Page } from "@certkraft/blocks";

/** Page details for the author. Not part of the learner page. */
export function PageInfo({ page }: { page: Page }) {
  const { chapter, summary, estimatedMinutes, authorNotes } = page;
  return (
    <aside aria-label="Page info" className="mx-auto w-full max-w-wide">
      <dl className="grid gap-x-6 gap-y-2 rounded-card border border-border bg-surface p-5 text-small sm:grid-cols-[auto_1fr]">
        <dt className="text-ink-muted">Chapter</dt>
        <dd className="font-mono">{chapter}</dd>
        <dt className="text-ink-muted">Summary</dt>
        <dd>{summary}</dd>
        <dt className="text-ink-muted">Estimated time</dt>
        <dd>{estimatedMinutes ? `${estimatedMinutes} min` : "Not set"}</dd>
        {authorNotes?.length ? (
          <>
            <dt className="text-ink-muted">Author notes</dt>
            <dd>
              <ul className="list-disc pl-5">
                {authorNotes.map((note, index) => (
                  <li key={index}>{note}</li>
                ))}
              </ul>
            </dd>
          </>
        ) : null}
      </dl>
    </aside>
  );
}

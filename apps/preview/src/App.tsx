import { PageRenderer, PageSchema } from "@certkraft/blocks";
import samplePage from "../../../fixtures/pages/valid/full-sample.json";

// Temporary: the editor shell arrives in M6. Until then the app shows the full sample page.
const page = PageSchema.parse(samplePage);

/** Page details for the author. Not part of the learner page. */
function PageInfo({ chapter, summary, estimatedMinutes, authorNotes }: typeof page) {
  return (
    <aside aria-label="Page info" className="mx-auto mt-6 w-full max-w-wide px-4">
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

export function App() {
  return (
    <div className="min-h-screen bg-bg font-sans text-ink">
      <header className="flex h-14 items-center border-b border-border bg-surface px-4">
        <span className="text-h4 font-semibold">CertKraft page preview</span>
      </header>
      <PageInfo {...page} />
      <PageRenderer page={page} mediaBaseUrl={import.meta.env.VITE_MEDIA_BASE_URL ?? "/media/"} />
    </div>
  );
}

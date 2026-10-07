import { PageRenderer, PageSchema } from "@certkraft/blocks";
import samplePage from "../../../fixtures/pages/valid/full-sample.json";

// Temporary: the editor shell arrives in M6. Until then the app shows the full sample page.
const page = PageSchema.parse(samplePage);

export function App() {
  return (
    <div className="min-h-screen bg-bg font-sans text-ink">
      <header className="flex h-14 items-center border-b border-border bg-surface px-4">
        <h1 className="text-h4 font-semibold">CertKraft page preview</h1>
      </header>
      <PageRenderer page={page} mediaBaseUrl={import.meta.env.VITE_MEDIA_BASE_URL ?? "/media/"} />
    </div>
  );
}

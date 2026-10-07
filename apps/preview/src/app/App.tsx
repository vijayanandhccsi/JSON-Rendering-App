import { Suspense, lazy } from "react";
import { Shell } from "./Header";
import { Link, useRoute } from "./Router";
import EditorPage from "../routes/EditorPage";

// The gallery and the batch screen load only when opened.
const Gallery = lazy(() => import("../routes/Gallery"));
const Batch = lazy(() => import("../routes/Batch"));

function NotFound() {
  return (
    <Shell route={null}>
      <main className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
        <h1 className="text-h2 font-semibold">Page not found</h1>
        <p>There is no page at this address.</p>
        <Link
          to="/"
          className="inline-flex min-h-11 items-center rounded-control border border-border bg-surface px-4 font-medium hover:bg-bg"
        >
          Go to the editor
        </Link>
      </main>
    </Shell>
  );
}

export function App() {
  const route = useRoute();
  if (route === "/") return <EditorPage />;
  if (route === null) return <NotFound />;
  return (
    <Suspense
      fallback={
        <Shell route={route}>
          <p role="status" className="p-6 text-ink-muted">
            Loading
          </p>
        </Shell>
      }
    >
      {route === "/gallery" ? <Gallery /> : <Batch />}
    </Suspense>
  );
}

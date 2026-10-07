import { Suspense, lazy } from "react";
import { AuthProvider, useAuth } from "../auth/AuthContext";
import { FloatingChat } from "../chat/FloatingChat";
import LoginPage from "../routes/LoginPage";
import { Shell } from "./Header";
import { Link, useRoute } from "./Router";

// Each page loads only when opened, so the batch screen and the gallery never download the code editor.
const EditorPage = lazy(() => import("../routes/EditorPage"));
const Gallery = lazy(() => import("../routes/Gallery"));
const Batch = lazy(() => import("../routes/Batch"));

function NotFound() {
  const { user, logout } = useAuth();
  return (
    <Shell route={null} user={user} onLogout={logout}>
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

function MainApp() {
  const route = useRoute();
  const { user, loading, logout } = useAuth();

  if (loading) {
    return (
      <div className="flex h-dvh items-center justify-center bg-bg text-ink-muted">
        <p role="status" className="text-small">
          Loading...
        </p>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  if (route === null) return <NotFound />;

  return (
    <>
      <Suspense
        fallback={
          <Shell route={route} user={user} onLogout={logout}>
            <p role="status" className="p-6 text-ink-muted">
              Loading
            </p>
          </Shell>
        }
      >
        {route === "/" ? <EditorPage /> : route === "/gallery" ? <Gallery /> : <Batch />}
      </Suspense>

      {/* Floating Claude/Gemini style AI chat window */}
      <FloatingChat />
    </>
  );
}

export function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

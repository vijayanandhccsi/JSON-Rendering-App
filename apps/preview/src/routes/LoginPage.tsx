import { useState } from "react";
import type { FormEvent } from "react";
import { useAuth } from "../auth/AuthContext";

export function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setError(null);
    setSubmitting(true);

    const res = await login(email, password);
    setSubmitting(false);

    if (!res.ok) {
      setError(res.error || "Invalid credentials");
    }
  };

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-bg px-4 font-sans text-ink">
      <div className="w-full max-w-sm rounded-xl border border-border bg-surface p-6 shadow-sm">
        <div className="mb-6 text-center">
          <h1 className="text-h2 font-semibold tracking-tight">CertKraft App 1</h1>
          <p className="mt-1 text-small text-ink-muted">Sign in to access page preview and chat</p>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-small text-red-700"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label htmlFor="email" className="block mb-1 text-small font-medium text-ink">
              Email address
            </label>
            <input
              id="email"
              type="email"
              required
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@certkraft.com"
              className="w-full rounded-control border border-border bg-bg px-3 py-2 text-small text-ink outline-none transition focus:border-ink"
            />
          </div>

          <div>
            <label htmlFor="password" className="block mb-1 text-small font-medium text-ink">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-control border border-border bg-bg px-3 py-2 text-small text-ink outline-none transition focus:border-ink"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="mt-2 inline-flex min-h-11 w-full items-center justify-center rounded-control bg-ink px-4 text-small font-medium text-surface transition hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;

import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(callback: () => void): () => void {
  if (typeof window === "undefined" || !window.matchMedia) return () => undefined;
  const media = window.matchMedia(QUERY);
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
}

const getSnapshot = () =>
  typeof window !== "undefined" && !!window.matchMedia && window.matchMedia(QUERY).matches;

/** True when the reader asked for less motion. Animations should then be replaced by instant changes. */
export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}

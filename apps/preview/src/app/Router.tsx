import { useSyncExternalStore } from "react";
import type { AnchorHTMLAttributes, MouseEvent, ReactNode } from "react";

export const ROUTES = [
  { path: "/", label: "Editor" },
  { path: "/gallery", label: "Gallery" },
  { path: "/batch", label: "Batch validate" },
] as const;

export type RoutePath = (typeof ROUTES)[number]["path"];

const NAVIGATE_EVENT = "certkraft:navigate";

function subscribe(callback: () => void): () => void {
  window.addEventListener("popstate", callback);
  window.addEventListener(NAVIGATE_EVENT, callback);
  return () => {
    window.removeEventListener("popstate", callback);
    window.removeEventListener(NAVIGATE_EVENT, callback);
  };
}

const getPathname = () => window.location.pathname;

/** The route for a pathname, ignoring a trailing slash. Null if there is no such page. */
export function routeOf(pathname: string): RoutePath | null {
  const clean = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  return ROUTES.find((route) => route.path === clean)?.path ?? null;
}

/** The page being shown, or null when the address matches no page. */
export function useRoute(): RoutePath | null {
  return routeOf(useSyncExternalStore(subscribe, getPathname, () => "/"));
}

export function navigate(path: string): void {
  if (window.location.pathname === path) return;
  window.history.pushState({}, "", path);
  window.dispatchEvent(new Event(NAVIGATE_EVENT));
  window.scrollTo?.(0, 0);
}

interface LinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> {
  to: string;
  children: ReactNode;
}

/** A link that changes page without reloading. Ctrl/Cmd-click and middle-click still open a new tab. */
export function Link({ to, children, onClick, ...rest }: LinkProps) {
  const handle = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    )
      return;
    event.preventDefault();
    navigate(to);
  };
  return (
    <a href={to} onClick={handle} {...rest}>
      {children}
    </a>
  );
}

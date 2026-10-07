import "@testing-library/jest-dom/vitest";
import "vitest-axe/extend-expect";
import * as axeMatchers from "vitest-axe/matchers";

expect.extend(axeMatchers);

// jsdom has no layout engine. These stubs let Embla (carousel) start; it measures nothing here.
class NoopObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}
globalThis.ResizeObserver ??= NoopObserver as unknown as typeof ResizeObserver;
globalThis.IntersectionObserver ??= NoopObserver as unknown as typeof IntersectionObserver;

// jsdom has no matchMedia either. Default: no media query matches (no reduced motion).
window.matchMedia ??= (query: string): MediaQueryList => ({
  matches: false,
  media: query,
  onchange: null,
  addEventListener: () => undefined,
  removeEventListener: () => undefined,
  addListener: () => undefined,
  removeListener: () => undefined,
  dispatchEvent: () => false,
});

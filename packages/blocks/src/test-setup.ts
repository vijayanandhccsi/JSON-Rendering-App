import "@testing-library/jest-dom/vitest";
import "vitest-axe/extend-expect";
import * as axeMatchers from "vitest-axe/matchers";
import { vi } from "vitest";

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

// ECharts needs a real browser to draw. Tests use a stand-in that accepts the same calls and draws
// nothing; tests that care about the calls replace it with their own spy.
vi.mock("./chart/echarts-setup", () => ({
  init: () => ({ setOption: () => undefined, resize: () => undefined, dispose: () => undefined }),
}));

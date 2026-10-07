import type { AxeMatchers } from "vitest-axe";

// vitest-axe 0.1 only augments the old Vitest types, so declare its matcher for current Vitest.
declare module "vitest" {
  /* eslint-disable-next-line @typescript-eslint/no-empty-object-type */
  interface Assertion extends AxeMatchers {}
  /* eslint-disable-next-line @typescript-eslint/no-empty-object-type */
  interface AsymmetricMatchersContaining extends AxeMatchers {}
}

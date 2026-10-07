import { render } from "@testing-library/react";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { configureAxe } from "vitest-axe";
import { describe, expect, it } from "vitest";
import { PageSchema } from "./schema";
import { PageRenderer } from "./renderer/PageRenderer";

// jsdom has no layout engine, so axe cannot check color contrast here. Contrast is covered by
// tokens.test.ts for the design tokens and must be checked in a real browser (DevTools or Lighthouse).
// jsdom also cannot load iframes, so axe does not look inside them (the video title is tested instead).
const axe = configureAxe({ iframes: false, rules: { "color-contrast": { enabled: false } } });

const valid = join(__dirname, "../../../fixtures/pages/valid");

describe("accessibility (axe)", () => {
  it.each(readdirSync(valid))("%s has no axe violations", async (file) => {
    const page = PageSchema.parse(JSON.parse(readFileSync(join(valid, file), "utf8")));
    // The LMS player supplies <main>; the renderer fills it.
    const { container } = render(
      <main>
        <PageRenderer page={page} />
      </main>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});

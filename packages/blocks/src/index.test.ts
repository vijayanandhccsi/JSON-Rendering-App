import { describe, expect, it } from "vitest";
import { BLOCKS_PACKAGE_NAME } from "./index";

describe("@certkraft/blocks", () => {
  it("exports its package name", () => {
    expect(BLOCKS_PACKAGE_NAME).toBe("@certkraft/blocks");
  });
});

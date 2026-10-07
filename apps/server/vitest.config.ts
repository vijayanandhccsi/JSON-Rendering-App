import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
  },
  resolve: {
    alias: {
      "@certkraft/blocks": path.resolve(__dirname, "../../packages/blocks/src/index.ts"),
    },
  },
});

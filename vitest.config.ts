import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      // "server-only" throws outside a React Server environment; stub it in tests.
      "server-only": path.resolve(process.cwd(), "test", "server-only-stub.ts"),
    },
  },
  test: {
    include: ["lib/**/*.test.ts"],
    environment: "node",
    testTimeout: 10_000,
  },
});

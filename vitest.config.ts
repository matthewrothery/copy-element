import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    include: ["extension/src/**/*.test.ts", "extension/src/**/*.test.tsx"]
  }
});

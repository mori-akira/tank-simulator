import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/{unit,property,sim}/**/*.test.ts"],
  },
});

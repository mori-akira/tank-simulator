import { defineConfig } from "@playwright/test";

const PORT = 5174;

export default defineConfig({
  testDir: "tests/e2e",
  use: {
    baseURL: `http://localhost:${PORT}`,
    viewport: { width: 1280, height: 720 },
  },
  webServer: {
    command: `npm run dev -- --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: true,
  },
});

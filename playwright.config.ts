import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  fullyParallel: true,
  retries: 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: { headless: true, trace: "retain-on-failure" },
  projects: [{ name: "chromium", use: { browserName: "chromium", channel: "chromium" } }],
});

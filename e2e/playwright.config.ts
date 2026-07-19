import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";
import path from "node:path";

// Loaded here (not per-file) so every worker process inherits these via process.env —
// see e2e/.env. Committed to git intentionally: these are the app's public seeded
// demo credentials (password is "s3cret" for every seeded user, documented in the
// main README), not real secrets.
dotenv.config({ path: path.resolve(__dirname, ".env") });

/**
 * Assumes the app under test (yarn dev) is already running locally:
 *   frontend -> http://localhost:3000
 *   API      -> http://localhost:3001
 *
 * Run with: yarn test:e2e
 */
export default defineConfig({
  testDir: "./tests",
  outputDir: "./.test-results",
  globalSetup: require.resolve("./global-setup"),
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [["html", { outputFolder: "./playwright-report", open: "never" }], ["list"]],

  use: {
    baseURL: process.env.BASE_URL ?? "http://localhost:3000",
    testIdAttribute: "data-test",
    screenshot: "on",
    video: "off",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});

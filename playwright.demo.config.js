// @ts-check
/** Playwright config for live product demo — video, trace, headed, slowMo */
const { defineConfig } = require("@playwright/test");

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3000";

module.exports = defineConfig({
  testDir: "./e2e",
  testMatch: "product-demo.spec.js",
  fullyParallel: false,
  workers: 1,
  timeout: 45 * 60 * 1000,
  expect: { timeout: 30_000 },
  globalSetup: require.resolve("./e2e/global-setup-demo.js"),
  reporter: [
    ["list"],
    ["html", { outputFolder: "playwright-report/demo-html", open: "never" }],
    ["json", { outputFile: "playwright-report/demo-results.json" }],
  ],
  outputDir: "playwright-report/demo-test-results",
  use: {
    browserName: "chromium",
    headless: process.env.RELEASE_VALIDATION === "1",
    baseURL: BASE_URL,
    viewport: { width: 1366, height: 768 },
    actionTimeout: 30_000,
    navigationTimeout: 45_000,
    trace: "on",
    video: "on",
    screenshot: "only-on-failure",
    launchOptions: {
      slowMo: 80,
    },
  },
});

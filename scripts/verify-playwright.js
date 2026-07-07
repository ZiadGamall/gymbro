/**
 * Quick Playwright launch verification (Chromium, headed).
 * Run: node scripts/verify-playwright.js
 */
const { chromium } = require("@playwright/test");
const path = require("path");
const fs = require("fs");

async function main() {
  const screenshotDir = path.join(
    process.cwd(),
    "playwright-report",
    "screenshots",
  );
  fs.mkdirSync(screenshotDir, { recursive: true });

  console.log("Launching Chromium in headed mode…");
  const browser = await chromium.launch({ headless: false, channel: undefined });
  const page = await browser.newPage();

  await page.goto("about:blank");
  await page.setContent(
    "<html><body><h1>Playwright OK</h1></body></html>",
  );

  const screenshotPath = path.join(
    screenshotDir,
    "playwright-verify-launch.png",
  );
  await page.screenshot({ path: screenshotPath });

  await browser.close();

  console.log(`Playwright launch verified. Screenshot: ${screenshotPath}`);
}

main().catch((err) => {
  console.error("Playwright verification failed:", err.message);
  process.exit(1);
});

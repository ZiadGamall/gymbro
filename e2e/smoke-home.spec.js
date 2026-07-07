// @ts-check
const { test, expect } = require("@playwright/test");
const fs = require("fs");
const path = require("path");

const SCREENSHOT_DIR = path.join(
  process.cwd(),
  "playwright-report",
  "screenshots",
);

test("launches Chromium (headed), loads home page, and saves screenshot", async ({
  page,
  browserName,
}) => {
  expect(browserName).toBe("chromium");

  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

  await page.goto("/", { waitUntil: "networkidle" });

  await expect(page).toHaveTitle(/GymBro/i);
  await expect(
    page.getByRole("heading", { name: /Future Physique/i }),
  ).toBeVisible();

  const screenshotPath = path.join(
    SCREENSHOT_DIR,
    `home-smoke-${Date.now()}.png`,
  );
  await page.screenshot({ path: screenshotPath, fullPage: true });

  expect(fs.existsSync(screenshotPath)).toBeTruthy();
  console.log(`Screenshot saved: ${screenshotPath}`);
});

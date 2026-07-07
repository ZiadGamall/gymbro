// @ts-check
/**
 * GymBro — Live Product Demo (investor walkthrough)
 * Records video, trace, screenshots, console + network logs.
 *
 * Run: npm run demo:record
 */
const { test, expect } = require("@playwright/test");
const path = require("path");
const fs = require("fs");
const {
  attachLogging,
  saveLogs,
  buildGallery,
  humanPause,
  naturalScroll,
  scrollToBottom,
  hoverFirst,
  clickExerciseSearch,
  pickExerciseResult,
  snap,
  verifyEmail,
  analyzeProductionMetrics,
} = require("./helpers/demo");

const DEMO = {
  firstName: "Alex",
  lastName: "Morgan",
  username: `investor_${Date.now().toString(36)}`,
  email: `investor.${Date.now()}@gymbro.demo`,
  password: "DemoPass123!",
};

const logs = { console: [], network: [] };
const VIDEO_SAMPLE = path.join(
  process.cwd(),
  "ai-services",
  "form-checker",
  "test-fixtures",
  "sample_squat.mp4",
);

function resetDemoArtifacts() {
  const shotDir = path.join(process.cwd(), "playwright-report", "demo-screenshots");
  const logDir = path.join(process.cwd(), "playwright-report", "demo-logs");
  fs.mkdirSync(shotDir, { recursive: true });
  fs.mkdirSync(logDir, { recursive: true });
  for (const f of fs.readdirSync(shotDir)) {
    if (f.endsWith(".png")) fs.unlinkSync(path.join(shotDir, f));
  }
}

async function openFitBot(page) {
  const fab = page.locator('button.fitbot-launcher[aria-label="Open FitBot"]');
  const inline = page.getByRole("button", { name: "Open FitBot Chat" });
  if (await fab.isVisible()) {
    await fab.click();
  } else if (await inline.isVisible()) {
    await inline.click();
  }
  await humanPause(page, 800);
}

async function sendFitBotMessage(page, text) {
  const input = page.locator("textarea.fitbot-input");
  await input.fill(text);
  await humanPause(page, 400);
  await page.locator(".fitbot-input-bar button.fitbot-send-btn").click();
  await page.locator(".fitbot-typing, .fitbot-thinking").waitFor({ state: "hidden", timeout: 120_000 }).catch(() => {});
  await humanPause(page, 1200);
}

async function addMeal(page, searchTerm, mealType, grams) {
  await page.getByPlaceholder(/Search food database/i).fill(searchTerm);
  await page.getByRole("button", { name: "Search" }).click();
  await page.waitForTimeout(1500);
  await page.locator(".rounded-xl.border button").first().click();
  await page.locator("select").selectOption(mealType);
  await page.getByPlaceholder(/Portion weight/i).fill(String(grams));
  await page.getByRole("button", { name: /Add entry/i }).click();
  await page.waitForTimeout(1500);
}

test.describe.configure({ mode: "serial" });

test("GymBro live product demonstration", async ({ page }) => {
  test.setTimeout(45 * 60 * 1000);
  resetDemoArtifacts();
  attachLogging(page, logs);

  // ── 1. Landing ─────────────────────────────────────────────────────
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await humanPause(page, 1200);
  await hoverFirst(page, "a.btn-neon-primary");
  await naturalScroll(page, 500);
  await scrollToBottom(page);
  await naturalScroll(page, -300);
  await snap(page, "01-landing-page");

  // ── 2. Register ────────────────────────────────────────────────────
  await page.getByRole("link", { name: /Get Started|Start Your Transformation/i }).first().click();
  await page.waitForURL(/register/);
  await humanPause(page, 600);
  await snap(page, "02-register-empty");

  await page.locator("#reg-firstName").fill(DEMO.firstName);
  await page.locator("#reg-lastName").fill(DEMO.lastName);
  await page.locator("#reg-username").fill(DEMO.username);
  await page.locator("#reg-email").fill(DEMO.email);
  await page.locator("#reg-password").fill(DEMO.password);
  await page.locator("#reg-confirm").fill(DEMO.password);
  await humanPause(page, 500);
  await snap(page, "03-register-filled");
  await page.getByRole("button", { name: "Create Account" }).click();
  await expect(page.getByText(/Registration successful/i)).toBeVisible({ timeout: 15_000 });
  await snap(page, "04-register-success");

  // ── 3. Email verify (API bypass — Brevo not required for demo) ─────
  verifyEmail(DEMO.email);
  await page.goto("/login");
  await snap(page, "05-login-ready");
  await humanPause(page, 500);
  await page.locator("#login-username").fill(DEMO.username);
  await page.locator("#login-password").fill(DEMO.password);
  await snap(page, "06-login-filled");
  await page.getByRole("button", { name: /Sign In|Sign in/i }).click();
  await page.waitForURL(/dashboard/, { timeout: 20_000 });
  await humanPause(page, 1000);
  await snap(page, "07-dashboard-after-login");

  // ── 5. Onboarding ──────────────────────────────────────────────────
  await page.goto("/onboarding");
  await humanPause(page, 800);
  await page.getByRole("button", { name: "Muscle Tone" }).click();
  await snap(page, "08-onboarding-goal");
  await page.getByRole("button", { name: "Continue" }).click();
  await humanPause(page, 500);
  await page.getByRole("button", { name: "Intermediate" }).click();
  await snap(page, "09-onboarding-level");
  await page.getByRole("button", { name: "Continue" }).click();
  await humanPause(page, 500);
  await snap(page, "10-onboarding-lifestyle");
  await page.getByRole("button", { name: "Continue" }).click();
  await humanPause(page, 500);
  await snap(page, "11-onboarding-nutrition");
  await page.getByRole("button", { name: /Save and open dashboard/i }).click();
  await page.waitForURL(/dashboard/, { timeout: 15_000 });
  await snap(page, "12-onboarding-complete");

  // ── 6. Dashboard explore ───────────────────────────────────────────
  await naturalScroll(page, 400);
  await snap(page, "13-dashboard-explore");
  await page.goto("/today");
  await humanPause(page, 800);
  await snap(page, "14-today-shell");

  // ── 7. Splits — browse, compare, save ──────────────────────────────
  await page.goto("/splits");
  await page.waitForLoadState("networkidle");
  await humanPause(page, 1000);
  await snap(page, "15-splits-list");

  const splitButtons = page.locator(".lg\\:col-span-2 button.card-surface");
  await splitButtons.nth(0).click();
  await humanPause(page, 700);
  await snap(page, "16-split-detail-1");
  await splitButtons.nth(1).click();
  await humanPause(page, 700);
  await snap(page, "17-split-detail-2");

  await page.locator("select.input-field").selectOption({ index: 2 });
  await humanPause(page, 800);
  await snap(page, "18-split-compare");

  await page.getByRole("button", { name: /Save to profile|Saved/i }).first().click();
  await expect(page.getByText(/Split saved|Saved/i).first()).toBeVisible({ timeout: 10_000 });
  await page.getByRole("button", { name: "Set active" }).click();
  await humanPause(page, 800);
  await snap(page, "19-split-saved-active");

  // ── 8. Workout builder — save workout ──────────────────────────────
  await page.goto("/workouts/build");
  await humanPause(page, 800);
  await page.getByPlaceholder(/Workout name/i).fill("Investor Push Day");
  await page.getByPlaceholder(/Search exercises/i).fill("bench");
  await clickExerciseSearch(page);
  await humanPause(page, 1200);
  await pickExerciseResult(page, /bench/i);
  await humanPause(page, 500);
  await snap(page, "20-workout-builder");
  await page.getByRole("button", { name: /Save workout/i }).click();
  await expect(page.getByText(/Workout saved/i)).toBeVisible({ timeout: 15_000 });
  await snap(page, "21-workout-saved");

  // ── 9. Log realistic workout ───────────────────────────────────────
  await page.goto("/workouts");
  await humanPause(page, 800);
  await page.getByPlaceholder("Workout name").fill("Demo Push Session");
  await page.getByPlaceholder(/Search exercises/i).fill("press");
  await clickExerciseSearch(page);
  await humanPause(page, 1200);
  await pickExerciseResult(page, /press/i);
  await humanPause(page, 500);
  const weightInput = page.locator('input[placeholder="0"]').first();
  const repsInput = page.locator('input[placeholder="0"]').nth(1);
  await weightInput.fill("60");
  await repsInput.fill("10");
  await snap(page, "22-workout-logging");
  await page.getByRole("button", { name: /Finish & save workout/i }).click();
  await expect(page.getByText(/Workout logged successfully/i)).toBeVisible({ timeout: 20_000 });
  await snap(page, "23-workout-logged-history");

  // ── 10. Nutrition — breakfast, lunch, dinner ───────────────────────
  await page.goto("/nutrition");
  await humanPause(page, 800);
  await snap(page, "24-nutrition-diary-empty");
  await addMeal(page, "oats", "breakfast", 80);
  await snap(page, "25-nutrition-breakfast");
  await addMeal(page, "chicken", "lunch", 150);
  await snap(page, "26-nutrition-lunch");
  await addMeal(page, "rice", "dinner", 200);
  await snap(page, "27-nutrition-dinner-macros");

  // ── 11. Calorie Predictor ──────────────────────────────────────────
  await page.goto("/coach");
  await humanPause(page, 1000);
  await naturalScroll(page, 300);
  await page.locator("#cal-duration").fill("45");
  await page.locator("#cal-heartRate").fill("135");
  if (!(await page.locator("#cal-weight").inputValue())) {
    await page.locator("#cal-weight").fill("72");
  }
  if (!(await page.locator("#cal-height").inputValue())) {
    await page.locator("#cal-height").fill("175");
  }
  if (!(await page.locator("#cal-age").inputValue())) {
    await page.locator("#cal-age").fill("30");
  }
  await snap(page, "28-calorie-predictor-form");
  await page.getByRole("button", { name: /Calculate Calories/i }).click();
  await expect(page.getByText(/Estimated burned|kcal/i).first()).toBeVisible({ timeout: 20_000 });
  await snap(page, "29-calorie-predictor-result");

  // ── 12. FitBot — 5+ questions, markdown, memory ────────────────────
  await openFitBot(page);
  await snap(page, "30-fitbot-open");

  const questions = [
    "Give me a **push day** workout with 4 exercises as a bullet list.",
    "What protein target should I hit today based on my goals?",
    "Suggest a high-protein lunch under 600 calories.",
    "How should I recover after today's push session?",
    "Summarize what we discussed about my workout today in 2 sentences.",
  ];

  for (let i = 0; i < questions.length; i++) {
    await sendFitBotMessage(page, questions[i]);
    await snap(page, `31-fitbot-q${i + 1}`);
  }

  await expect(page.locator(".fitbot-bubble--bot").first()).toBeVisible();
  await sendFitBotMessage(page, "Do you remember my first question about push day?");
  await humanPause(page, 1000);
  await snap(page, "32-fitbot-memory");

  // ── 13. Form Checker ───────────────────────────────────────────────
  await page.goto("/form-check");
  await humanPause(page, 800);
  if (!fs.existsSync(VIDEO_SAMPLE)) {
    const { spawnSync } = require("child_process");
    spawnSync(
      path.join("ai-services", "form-checker", "venv", "Scripts", "python.exe"),
      [path.join("scripts", "generate-form-check-sample.py")],
      { cwd: process.cwd(), stdio: "inherit" },
    );
  }
  await page.locator('input[type="file"]').setInputFiles(VIDEO_SAMPLE);
  await snap(page, "33-form-check-upload");
  await page.getByRole("button", { name: "Analyze Form" }).click();
  await expect(page.getByText(/correct|incorrect|accuracy|Form analysis/i).first()).toBeVisible({ timeout: 120_000 });
  await snap(page, "34-form-check-results");

  // ── 14. Sleep Recovery ─────────────────────────────────────────────
  await page.goto("/sleep");
  await humanPause(page, 800);
  await snap(page, "35-sleep-form");
  await page.getByRole("button", { name: /Get recovery recommendation/i }).click();
  await expect(page.locator(".card-surface").filter({ hasText: /Train|Rest|Light|Moderate/i }).first()).toBeVisible({ timeout: 30_000 });
  await snap(page, "36-sleep-recommendation");

  // ── 15. Progress charts ────────────────────────────────────────────
  await page.goto("/progress");
  await humanPause(page, 1000);
  await naturalScroll(page, 400);
  await snap(page, "37-progress-hub");

  // ── 16. Profile verification ───────────────────────────────────────
  await page.goto("/profile");
  await humanPause(page, 1000);
  await snap(page, "38-profile-overview");
  await page.getByRole("button", { name: "Splits" }).click();
  await humanPause(page, 600);
  await snap(page, "39-profile-splits");
  await page.getByRole("button", { name: "Workouts" }).click();
  await humanPause(page, 600);
  await snap(page, "40-profile-workouts");
  await page.getByRole("button", { name: "Workout logs" }).click();
  await humanPause(page, 600);
  await snap(page, "41-profile-workout-logs");
  await page.getByRole("button", { name: "Meals" }).click();
  await humanPause(page, 600);
  await snap(page, "42-profile-meals");

  // ── 17. Logout ─────────────────────────────────────────────────────
  await page.getByRole("button", { name: "Logout" }).click();
  await page.waitForURL(/\/(login)?$/, { timeout: 10_000 });
  await snap(page, "43-logged-out");

  // ── 18. Login again + persistence ──────────────────────────────────
  await page.goto("/login");
  await page.locator("#login-username").fill(DEMO.username);
  await page.locator("#login-password").fill(DEMO.password);
  await page.getByRole("button", { name: /Sign In|Sign in/i }).click();
  await page.waitForURL(/dashboard/, { timeout: 20_000 });
  await page.goto("/profile");
  await humanPause(page, 1000);
  await page.getByRole("button", { name: "Splits" }).click();
  await expect(page.locator(".session-row").first()).toBeVisible({ timeout: 15_000 });
  await page.getByRole("button", { name: "Workouts" }).click();
  await expect(page.getByText("Investor Push Day")).toBeVisible({ timeout: 15_000 });
  await page.getByRole("button", { name: "Workout logs" }).click();
  await expect(page.getByText(/Demo Push Session|Monday:|Upper Body|Training Session/i).first()).toBeVisible({ timeout: 15_000 });
  await page.getByRole("button", { name: "Meals" }).click();
  await expect(page.locator(".session-row, .card-surface").filter({ hasText: /breakfast|lunch|dinner/i }).first()).toBeVisible({ timeout: 15_000 });
  await snap(page, "44-persistence-verified");

  logs.metrics = analyzeProductionMetrics(logs);
  saveLogs(logs);
  buildGallery();

  const m = logs.metrics;
  expect(m.failedRequests, `Failed API: ${JSON.stringify(m.failedRequestDetails)}`).toBe(0);
  expect(m.serverErrors, "HTTP 500 responses detected").toBe(0);
  expect(m.clientErrors404, "Unexpected HTTP 404 responses").toBe(0);
  expect(m.consoleErrors, `Console errors: ${m.consoleErrorDetails.join(" | ")}`).toBe(0);
  expect(m.runtimeExceptions, "Runtime exceptions detected").toBe(0);
  expect(m.reactWarnings, `React warnings: ${m.reactWarningDetails.join(" | ")}`).toBe(0);
  expect(m.duplicateRequests, `Duplicate requests: ${m.duplicateDetails.join(", ")}`).toBe(0);
  expect(m.failedAiRequests, "Failed AI requests").toBe(0);
  expect(m.productionReadinessScore, "Production readiness below 100%").toBe(100);
});

test.afterAll(() => {
  buildGallery();
});

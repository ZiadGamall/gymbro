// @ts-check
/**
 * AI feature smoke tests — run ONLY after full stack is healthy.
 * Prerequisites: npm run stack:ensure && npm run stack:health
 */
const { test, expect } = require("@playwright/test");
const fs = require("fs");
const path = require("path");

const SCREENSHOT_DIR = path.join(
  process.cwd(),
  "playwright-report",
  "screenshots",
);

const SMOKE_USER = process.env.SMOKE_USERNAME || "gymbro_smoke";
const SMOKE_PASS = process.env.SMOKE_PASSWORD || "SmokeTest123!";

let authToken = "";

test.beforeAll(async ({ request }) => {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

  const loginRes = await request.post("/api/v1/users/login", {
    data: { username: SMOKE_USER, password: SMOKE_PASS },
  });
  expect(loginRes.ok(), "Login must succeed for AI smoke tests").toBeTruthy();
  const loginBody = await loginRes.json();
  authToken = loginBody.token || loginBody.data?.token;
  expect(authToken, "JWT token required").toBeTruthy();
});

function authHeaders() {
  return { Authorization: `Bearer ${authToken}` };
}

test("FitBot responds with a meaningful reply", async ({ page, request }) => {
  const res = await request.post("/api/v1/fitbot/chat", {
    headers: authHeaders(),
    data: { message: "Say hello in one short sentence.", history: [] },
    timeout: 60_000,
  });
  expect(res.status(), "FitBot chat should return 200").toBe(200);
  const body = await res.json();
  expect(body.reply?.length, "FitBot reply must not be empty").toBeGreaterThan(3);

  await page.goto("/coach", { waitUntil: "networkidle" });
  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, "ai-smoke-fitbot-hub.png"),
    fullPage: true,
  });
});

test("Calorie Predictor returns a numeric prediction", async ({ request }) => {
  const res = await request.post("/api/v1/calories/predict", {
    headers: authHeaders(),
    data: {
      gender: "male",
      age: 28,
      height: 175,
      weight: 70,
      duration: 30,
      heart_rate: 130,
    },
  });
  expect(res.status(), "Calorie predict should return 200").toBe(200);
  const body = await res.json();
  const calories = body.calories_burned ?? body.caloriesBurned;
  expect(typeof calories).toBe("number");
  expect(calories).toBeGreaterThan(0);
});

test("Sleep Recovery generates a training recommendation", async ({ request }) => {
  const res = await request.post("/api/v1/status/daily-status", {
    headers: authHeaders(),
    data: {
      total_sleep_min: 420,
      deep_sleep_min: 90,
      rem_sleep_min: 80,
      hr_avg_bpm: 58,
      sleep_score: 82,
      avg_stress_score: 35,
      steps: 8000,
      active_minutes: 45,
    },
  });
  expect(res.status(), "Recovery endpoint should return 200").toBe(200);
  const body = await res.json();
  expect(body.data?.recommendation).toBeTruthy();
  expect(body.data?.message).toBeTruthy();
});

test("Form Checker processes a sample video", async ({ request }) => {
  const videoPath = path.join(
    process.cwd(),
    "ai-services",
    "form-checker",
    "test-fixtures",
    "sample_squat.mp4",
  );

  if (!fs.existsSync(videoPath)) {
    test.skip(true, "Sample video missing — run stack:health first to generate it");
  }

  const videoBuffer = fs.readFileSync(videoPath);
  const res = await request.post("/api/v1/form-check/analyze", {
    headers: authHeaders(),
    multipart: {
      video: {
        name: "sample_squat.mp4",
        mimeType: "video/mp4",
        buffer: videoBuffer,
      },
      mode: "Beginner",
    },
    timeout: 120_000,
  });

  expect(res.status(), "Form check should return 200").toBe(200);
  const body = await res.json();
  expect(body.success).toBe(true);
  expect(body.data?.exercise || body.data?.correct_reps !== undefined).toBeTruthy();
});

test("AI hub pages load in browser (headed verification)", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  await expect(page).toHaveTitle(/GymBro/i);

  await page.goto("/coach", { waitUntil: "networkidle" });
  await expect(page.getByText(/FitBot Hub/i)).toBeVisible({ timeout: 15_000 });

  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, "ai-smoke-browser-hub.png"),
    fullPage: true,
  });
});

/**
 * End-to-end API smoke test for GymBro.
 * Run: node scripts/smoke-test.js
 */
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../server/.env") });

const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const User = require("../server/models/userModel");

const BASE = process.env.SMOKE_BASE_URL || "http://127.0.0.1:5000";
const today = new Date().toISOString().slice(0, 10);

const results = [];

function pass(name, detail = "") {
  results.push({ name, ok: true, detail });
  console.log(`  ✓ ${name}${detail ? ` — ${detail}` : ""}`);
}

function fail(name, detail = "") {
  results.push({ name, ok: false, detail });
  console.log(`  ✗ ${name}${detail ? ` — ${detail}` : ""}`);
}

async function api(method, route, body, token) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${BASE}${route}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  let data;
  const text = await res.text();
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }

  return { status: res.status, data };
}

async function ensureVerifiedUser() {
  const username = process.env.SMOKE_USERNAME || "gymbro_smoke";
  const password = process.env.SMOKE_PASSWORD || "SmokeTest123!";
  const email = process.env.SMOKE_EMAIL || "gymbro.smoke@test.local";

  await mongoose.connect(process.env.MONGO_URL, {
    serverSelectionTimeoutMS: Number(process.env.MONGO_TIMEOUT_MS) || 10000,
  });

  let user = await User.findOne({ username }).select("+password");

  if (!user) {
    user = await User.create({
      firstName: "Smoke",
      lastName: "Tester",
      username,
      email,
      password,
      passwordConfirm: password,
      gender: "male",
      isVerified: true,
      height: 175,
      weight: 70,
      dateOfBirth: "1995-01-15",
    });
  } else if (!user.isVerified) {
    user.isVerified = true;
    await user.save({ validateBeforeSave: false });
  }

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });

  return { token, userId: user._id.toString(), username };
}

async function run() {
  console.log("\nGymBro API Smoke Test\n" + "=".repeat(40));

  let token;
  let username;

  // ── Public endpoints ──────────────────────────────────────────────
  console.log("\nPublic endpoints:");

  const root = await api("GET", "/");
  if (root.status === 200 && root.data === "API is running") pass("GET /");
  else fail("GET /", String(root.status));

  const foodAll = await api("GET", "/api/v1/food/all");
  const allFoods = foodAll.data?.data?.data;
  if (foodAll.status === 200 && Array.isArray(allFoods) && allFoods.length > 0) {
    pass("GET /api/v1/food/all", `${allFoods.length} items`);
  } else fail("GET /api/v1/food/all", foodAll.data?.message || String(foodAll.status));

  const foodSearch = await api("POST", "/api/v1/food/search", { name: "chicken" });
  const searchFoods = foodSearch.data?.data?.data;
  if (foodSearch.status === 200 && Array.isArray(searchFoods) && searchFoods.length > 0) {
    pass("POST /api/v1/food/search", `${searchFoods.length} results`);
  } else fail("POST /api/v1/food/search", foodSearch.data?.message || String(foodSearch.status));

  const splits = await api("GET", "/api/v1/split/");
  if (splits.status === 200 && splits.data?.status === "success") {
    pass("GET /api/v1/split/", `${splits.data?.results ?? splits.data?.data?.length ?? 0} splits`);
  } else fail("GET /api/v1/split/", splits.data?.message || String(splits.status));

  // ── Auth setup ────────────────────────────────────────────────────
  console.log("\nAuth setup:");
  try {
    ({ token, username } = await ensureVerifiedUser());
    pass("Verified test user ready", username);
  } catch (err) {
    fail("Verified test user ready", err.message);
    return summarize();
  } finally {
    await mongoose.disconnect().catch(() => {});
  }

  // ── User / profile ─────────────────────────────────────────────────
  console.log("\nUser endpoints:");

  const me = await api("GET", "/api/v1/users/me", null, token);
  const meUser = me.data?.data?.user ?? me.data?.data;
  if (me.status === 200 && meUser?.username === username) {
    pass("GET /api/v1/users/me", meUser.username);
  } else fail("GET /api/v1/users/me", me.data?.message || String(me.status));

  // ── Onboarding ─────────────────────────────────────────────────────
  console.log("\nOnboarding:");

  const onboardingPut = await api(
    "PUT",
    "/api/v1/onboarding",
    {
      goal: "muscle_tone",
      level: "intermediate",
      activityDays: 4,
      calorieTarget: 2200,
      proteinTarget: 120,
      carbsTarget: 250,
      fatTarget: 70,
    },
    token,
  );
  if (onboardingPut.status === 200 && onboardingPut.data?.data?.onboarding) {
    pass("PUT /api/v1/onboarding");
  } else fail("PUT /api/v1/onboarding", onboardingPut.data?.message || String(onboardingPut.status));

  const onboardingGet = await api("GET", "/api/v1/onboarding", null, token);
  if (onboardingGet.status === 200 && onboardingGet.data?.data?.onboarding?.goal) {
    pass("GET /api/v1/onboarding", onboardingGet.data.data.onboarding.goal);
  } else fail("GET /api/v1/onboarding", onboardingGet.data?.message || String(onboardingGet.status));

  // ── Nutrition ──────────────────────────────────────────────────────
  console.log("\nNutrition:");

  const sampleFood = searchFoods[0];
  const mealPost = await api(
    "POST",
    "/api/v1/nutrition/entries",
    {
      foodId: sampleFood.foodId,
      weightConsumed: 150,
      mealType: "lunch",
      date: today,
    },
    token,
  );
  const mealEntry = mealPost.data?.data?.mealEntry;
  if (mealPost.status === 201 && mealEntry?._id) {
    pass("POST /api/v1/nutrition/entries", `${mealEntry.calories} kcal`);
  } else fail("POST /api/v1/nutrition/entries", mealPost.data?.message || String(mealPost.status));

  const entriesGet = await api("GET", `/api/v1/nutrition/entries?date=${today}`, null, token);
  const entries = Array.isArray(entriesGet.data?.data)
    ? entriesGet.data.data
    : entriesGet.data?.data?.entries;
  if (entriesGet.status === 200 && Array.isArray(entries) && entries.length > 0) {
    pass("GET /api/v1/nutrition/entries", `${entries.length} entries`);
  } else fail("GET /api/v1/nutrition/entries", entriesGet.data?.message || String(entriesGet.status));

  const summaryGet = await api("GET", `/api/v1/nutrition/summary/today?date=${today}`, null, token);
  if (summaryGet.status === 200 && summaryGet.data?.data?.totals?.calories > 0) {
    pass("GET /api/v1/nutrition/summary/today", `${summaryGet.data.data.totals.calories} kcal`);
  } else fail("GET /api/v1/nutrition/summary/today", summaryGet.data?.message || String(summaryGet.status));

  if (mealEntry?._id) {
    const mealDel = await api("DELETE", `/api/v1/nutrition/entries/${mealEntry._id}`, null, token);
    if (mealDel.status === 204 || mealDel.status === 200) {
      pass("DELETE /api/v1/nutrition/entries/:id");
    } else fail("DELETE /api/v1/nutrition/entries/:id", String(mealDel.status));
  }

  // ── Workout sessions ───────────────────────────────────────────────
  console.log("\nWorkout sessions:");

  const sessionPost = await api(
    "POST",
    "/api/v1/workout-session/sessions",
    {
      workoutName: "Smoke Test Push",
      duration: 45,
      date: today,
      exercises: [
        {
          name: "Bench Press",
          sets: [{ setNumber: 1, weight: 60, reps: 10 }],
        },
      ],
    },
    token,
  );
  const session = sessionPost.data?.data?.session;
  if (sessionPost.status === 201 && session?._id) {
    pass("POST /api/v1/workout-session/sessions", session.workoutName);
  } else fail("POST /api/v1/workout-session/sessions", sessionPost.data?.message || String(sessionPost.status));

  const sessionsGet = await api("GET", `/api/v1/workout-session/sessions?date=${today}`, null, token);
  const sessions = Array.isArray(sessionsGet.data?.data)
    ? sessionsGet.data.data
    : sessionsGet.data?.data?.sessions;
  if (sessionsGet.status === 200 && Array.isArray(sessions) && sessions.length > 0) {
    pass("GET /api/v1/workout-session/sessions", `${sessions.length} sessions`);
  } else fail("GET /api/v1/workout-session/sessions", sessionsGet.data?.message || String(sessionsGet.status));

  const weeklyGet = await api("GET", "/api/v1/workout-session/progress/weekly", null, token);
  const progress = weeklyGet.data?.data?.progress;
  if (weeklyGet.status === 200 && Array.isArray(progress) && progress.length === 7) {
    const todayWorkouts = progress.find((d) => d.date === today)?.workouts ?? 0;
    pass("GET /api/v1/workout-session/progress/weekly", `today: ${todayWorkouts} workouts`);
  } else fail("GET /api/v1/workout-session/progress/weekly", weeklyGet.data?.message || String(weeklyGet.status));

  if (session?._id) {
    const sessionDel = await api("DELETE", `/api/v1/workout-session/sessions/${session._id}`, null, token);
    if (sessionDel.status === 204 || sessionDel.status === 200) {
      pass("DELETE /api/v1/workout-session/sessions/:id");
    } else fail("DELETE /api/v1/workout-session/sessions/:id", String(sessionDel.status));
  }

  // ── Exercises ──────────────────────────────────────────────────────
  console.log("\nExercises:");

  const exSearch = await api("GET", "/api/v1/exercises/search?search=chest", null, token);
  const exercises = exSearch.data?.data?.exercises;
  if (exSearch.status === 200 && Array.isArray(exercises) && exercises.length > 0) {
    pass("GET /api/v1/exercises/search", `${exercises.length} exercises`);
  } else fail("GET /api/v1/exercises/search", exSearch.data?.message || String(exSearch.status));

  // ── FitBot ─────────────────────────────────────────────────────────
  console.log("\nFitBot:");

  const fitbot = await api(
    "POST",
    "/api/v1/fitbot/chat",
    { message: "Say hello in one short sentence.", history: [] },
    token,
  );
  if (fitbot.status === 200 && fitbot.data?.reply?.length > 0) {
    pass("POST /api/v1/fitbot/chat", fitbot.data.reply.slice(0, 60) + "...");
  } else fail("POST /api/v1/fitbot/chat", fitbot.data?.message || String(fitbot.status));

  // ── Calories (ML service may be offline) ───────────────────────────
  console.log("\nCalories (ML):");

  const calories = await api(
    "POST",
    "/api/v1/calories/predict",
    {
      gender: "male",
      age: 28,
      height: 175,
      weight: 70,
      duration: 30,
      heart_rate: 130,
    },
    token,
  );
  if (calories.status === 200 && (calories.data?.calories_burned ?? calories.data?.caloriesBurned)) {
    pass("POST /api/v1/calories/predict", `${calories.data.calories_burned ?? calories.data.caloriesBurned} kcal`);
  } else if (calories.status === 503) {
    pass("POST /api/v1/calories/predict", "503 — ML service offline (expected if not running)");
  } else fail("POST /api/v1/calories/predict", calories.data?.message || String(calories.status));

  // ── Frontend proxy ─────────────────────────────────────────────────
  console.log("\nFrontend proxy (Vite):");

  const frontendPorts = (process.env.SMOKE_FRONTEND_PORTS || "3000,3001")
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);

  let proxyOk = false;
  for (const port of frontendPorts) {
    try {
      const proxyRes = await fetch(`http://127.0.0.1:${port}/api/v1/food/all`);
      const proxyData = await proxyRes.json();
      if (proxyRes.status === 200 && proxyData?.status === "success") {
        pass(`Vite proxy :${port}/api → backend`, `${proxyData?.data?.count ?? "?"} foods`);
        proxyOk = true;
        break;
      }
    } catch {
      // try next port
    }
  }
  if (!proxyOk) {
    fail(
      "Vite proxy /api → backend",
      `not reachable on ports ${frontendPorts.join(", ")} — run npm run frontend:dev`,
    );
  }

  // ── Standard login flow ────────────────────────────────────────────
  console.log("\nLogin flow:");

  const login = await api("POST", "/api/v1/users/login", {
    username: process.env.SMOKE_USERNAME || "gymbro_smoke",
    password: process.env.SMOKE_PASSWORD || "SmokeTest123!",
  });
  if (login.status === 200 && login.data?.token) {
    pass("POST /api/v1/users/login", login.data?.data?.user?.username || "token issued");
  } else {
    fail("POST /api/v1/users/login", login.data?.message || String(login.status));
  }

  summarize();
}

function summarize() {
  const passed = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok);
  console.log("\n" + "=".repeat(40));
  console.log(`Results: ${passed}/${results.length} passed`);
  if (failed.length) {
    console.log("\nFailures:");
    failed.forEach((f) => console.log(`  - ${f.name}: ${f.detail}`));
    process.exit(1);
  }
  console.log("\nAll smoke tests passed.\n");
  process.exit(0);
}

run().catch((err) => {
  console.error("\nSmoke test crashed:", err.message);
  process.exit(1);
});

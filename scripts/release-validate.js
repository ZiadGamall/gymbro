/**
 * Final production validation — stack health, split/today probe, full Playwright demo, metrics gate.
 * Run: npm run release:validate
 */
const { execSync, spawnSync } = require("child_process");
const path = require("path");
const axios = require("axios");
const mongoose = require("mongoose");
const User = require("../server/models/userModel");
const jwt = require("jsonwebtoken");

require("dotenv").config({ path: path.join(__dirname, "../server/.env") });

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

  await mongoose.disconnect();
  return { token, userId: user._id.toString(), username };
}

async function probeSplitToday() {
  const login = await axios
    .post("http://127.0.0.1:5000/api/v1/users/login", {
      username: "gymbro_smoke",
      password: "SmokeTest123!",
    })
    .catch((e) => {
      console.error("[release] Login request failed:", e.response?.status, e.response?.data || e.message);
      return null;
    });

  if (!login?.data?.token) return { ok: false, detail: "smoke login failed" };

  const res = await axios
    .get("http://127.0.0.1:5000/api/v1/split/today", {
      headers: { Authorization: `Bearer ${login.data.token}` },
    })
    .catch((e) => e.response);

  return { ok: res?.status === 200, status: res?.status, body: res?.data };
}

async function main() {
  console.log("\n[release] GymBro production validation\n");

  execSync("node scripts/ensure-stack.js", { stdio: "inherit" });

  console.log("\n[release] Restarting backend for latest server code…");
  spawnSync(process.execPath, [path.join("scripts", "kill-port.js"), "5000"], {
    stdio: "inherit",
  });
  execSync("node scripts/ensure-stack.js", { stdio: "inherit" });

  await ensureVerifiedUser();
  const splitProbe = await probeSplitToday();
  console.log(
    `[release] GET /api/v1/split/today → ${splitProbe.status || "ERR"} ${splitProbe.ok ? "✓" : "✗"}`,
  );
  if (!splitProbe.ok) {
    console.error("[release] split/today probe failed:", splitProbe.detail || splitProbe.body);
    process.exit(1);
  }

  console.log("\n[release] Running full Playwright production demo…\n");
  execSync("npx playwright test --config playwright.demo.config.js", {
    stdio: "inherit",
    env: {
      ...process.env,
      RELEASE_VALIDATION: "1",
    },
  });

  const metricsPath = path.join(
    process.cwd(),
    "playwright-report",
    "demo-logs",
    "production-metrics.json",
  );
  const metrics = require(metricsPath);

  console.log("\n══════════════════════════════════════════");
  if (metrics.productionReadinessScore === 100) {
    console.log("✅ GymBro Production Validation Passed\n");
  } else {
    console.log("❌ GymBro Production Validation FAILED\n");
    process.exit(1);
  }

  console.log(`Total HTTP Requests: ${metrics.totalHttpRequests}`);
  console.log(`Failed Requests: ${metrics.failedRequests}`);
  console.log(`Console Errors: ${metrics.consoleErrors}`);
  console.log(`Console Warnings: ${metrics.consoleWarnings}`);
  console.log(`React Warnings: ${metrics.reactWarnings}`);
  console.log(`Playwright Failures: ${metrics.playwrightFailures}`);
  console.log(`Average API Latency: ${metrics.averageApiLatencyMs}ms`);
  console.log(`Production Readiness Score: ${metrics.productionReadinessScore}%`);
  console.log("══════════════════════════════════════════\n");
}

main().catch((err) => {
  console.error("[release] Fatal:", err.message);
  process.exit(1);
});

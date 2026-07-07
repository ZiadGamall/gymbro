/**
 * Final production validation — stack health, split/today probe, full Playwright demo, metrics gate.
 * Run: npm run release:validate
 */
const { execSync, spawnSync } = require("child_process");
const path = require("path");
const axios = require("axios");

require("dotenv").config({ path: path.join(__dirname, "../server/.env") });

async function probeSplitToday() {
  const login = await axios
    .post("http://127.0.0.1:5000/api/v1/users/login", {
      username: "gymbro_smoke",
      password: "SmokeTest123!",
    })
    .catch(() => null);

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

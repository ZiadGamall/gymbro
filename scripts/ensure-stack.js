/**
 * Ensure all GymBro services are running (non-blocking — exits when healthy).
 * Used by Playwright globalSetup before E2E tests.
 * Run: node scripts/ensure-stack.js
 */
const path = require("path");
const fs = require("fs");
const { services } = require("./stack.config");
const {
  httpProbe,
  waitForUrl,
  ensurePythonVenv,
  spawnService,
  formatMs,
  sleep,
  isViteFrontend,
} = require("./stack-utils");

require("dotenv").config({ path: path.join(__dirname, "../server/.env") });

const STACK_DIR = path.join(__dirname, "../.stack");
const PID_FILE = path.join(STACK_DIR, "pids.json");

async function isHealthy(service) {
  if (!service.healthUrl) return false;
  const res = await httpProbe(service.healthUrl, {
    method: service.healthMethod || "GET",
    body: service.healthBody,
  });
  return typeof service.healthMatch === "function"
    ? service.healthMatch(res.body, res.status, res.raw)
    : res.ok;
}

async function ensureProcess(service) {
  const started = Date.now();
  if (await isHealthy(service)) {
    return { ok: true, ms: Date.now() - started, detail: "Already running" };
  }

  if (service.id === "frontend") {
    const probe = await httpProbe(service.healthUrl);
    if (probe.status && !isViteFrontend(probe.body, probe.status)) {
      const { spawnSync } = require("child_process");
      spawnSync(process.execPath, [path.join(__dirname, "kill-port.js"), String(service.port)], {
        stdio: "inherit",
      });
      await sleep(1500);
    }
  }

  if (service.python) {
    await ensurePythonVenv(service);
  }

  const child = spawnService(service);
  fs.mkdirSync(STACK_DIR, { recursive: true });
  let pids = [];
  if (fs.existsSync(PID_FILE)) {
    try {
      pids = JSON.parse(fs.readFileSync(PID_FILE, "utf8"));
    } catch {
      pids = [];
    }
  }
  pids.push({ id: service.id, pid: child.pid, startedAt: new Date().toISOString() });
  fs.writeFileSync(PID_FILE, JSON.stringify(pids, null, 2));

  child.stdout?.on("data", (d) => process.stdout.write(`[${service.id}] ${d}`));
  child.stderr?.on("data", (d) => process.stderr.write(`[${service.id}] ${d}`));
  child.unref();

  const health = await waitForUrl(
    service.healthUrl,
    (body, status, raw) =>
      typeof service.healthMatch === "function"
        ? service.healthMatch(body, status, raw)
        : status === 200,
    180_000,
  );

  return {
    ok: health.ok,
    ms: Date.now() - started,
    detail: health.ok ? "Started" : `Timeout: ${service.healthUrl}`,
  };
}

async function ensureMongo() {
  if (!process.env.MONGO_URL) throw new Error("MONGO_URL missing in server/.env");
  const mongoose = require("mongoose");
  await mongoose.connect(process.env.MONGO_URL, {
    serverSelectionTimeoutMS: Number(process.env.MONGO_TIMEOUT_MS) || 15000,
  });
  await mongoose.disconnect();
}

async function main() {
  console.log("\n[ensure-stack] Verifying GymBro stack…\n");
  await ensureMongo();
  console.log("  ✓ MongoDB");

  const ordered = services.filter((s) => s.id !== "mongodb" && s.id !== "fitbot");
  for (const service of ordered) {
    process.stdout.write(`  → ${service.name}… `);
    const result = await ensureProcess(service);
    if (!result.ok) {
      console.log(`✗ ${result.detail}`);
      process.exit(1);
    }
    console.log(`✓ ${result.detail} (${formatMs(result.ms)})`);
    await sleep(300);
  }

  console.log("\n[ensure-stack] All process services ready.\n");
}

main().catch((err) => {
  console.error("[ensure-stack] Failed:", err.message);
  process.exit(1);
});

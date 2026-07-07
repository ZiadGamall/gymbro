/**
 * Start the complete GymBro stack in dependency order.
 * Run: node scripts/start-stack.js
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
} = require("./stack-utils");

require("dotenv").config({ path: path.join(__dirname, "../server/.env") });

const STACK_DIR = path.join(__dirname, "../.stack");
const PID_FILE = path.join(STACK_DIR, "pids.json");

/** @type {Record<string, import('child_process').ChildProcess>} */
const children = {};

function savePids() {
  fs.mkdirSync(STACK_DIR, { recursive: true });
  const entries = Object.entries(children).map(([id, proc]) => ({
    id,
    pid: proc.pid,
  }));
  fs.writeFileSync(PID_FILE, JSON.stringify(entries, null, 2));
}

async function checkMongo() {
  const started = Date.now();
  if (!process.env.MONGO_URL) {
    return {
      ok: false,
      ms: Date.now() - started,
      detail: "MONGO_URL missing in server/.env",
    };
  }

  const mongoose = require("mongoose");
  try {
    await mongoose.connect(process.env.MONGO_URL, {
      serverSelectionTimeoutMS: Number(process.env.MONGO_TIMEOUT_MS) || 15000,
    });
    await mongoose.disconnect();
    return { ok: true, ms: Date.now() - started, detail: "Connected" };
  } catch (err) {
    return { ok: false, ms: Date.now() - started, detail: err.message };
  }
}

async function isServiceHealthy(service) {
  if (!service.healthUrl) return false;
  const headers = { "Content-Type": "application/json" };
  const res = await httpProbe(service.healthUrl, {
    method: service.healthMethod || "GET",
    headers,
    body: service.healthBody,
  });
  if (typeof service.healthMatch === "function") {
    return service.healthMatch(res.body, res.status, res.raw);
  }
  return res.ok;
}

async function startProcessService(service) {
  const started = Date.now();

  if (await isServiceHealthy(service)) {
    return {
      ok: true,
      skipped: true,
      ms: Date.now() - started,
      detail: "Already healthy — reusing",
    };
  }

  if (service.python) {
    try {
      await ensurePythonVenv(service);
    } catch (err) {
      return {
        ok: false,
        ms: Date.now() - started,
        detail: `Python setup failed: ${err.message}`,
      };
    }
  }

  const child = spawnService(service);
  children[service.id] = child;
  savePids();

  child.stdout?.on("data", (d) => process.stdout.write(`[${service.id}] ${d}`));
  child.stderr?.on("data", (d) => process.stderr.write(`[${service.id}] ${d}`));

  const health = await waitForUrl(
    service.healthUrl,
    (body, status, raw) => {
      if (typeof service.healthMatch === "function") {
        return service.healthMatch(body, status, raw);
      }
      return status === 200;
    },
    180_000,
  );

  if (!health.ok) {
    return {
      ok: false,
      ms: Date.now() - started,
      detail: `Timed out waiting for ${service.healthUrl}`,
    };
  }

  return {
    ok: true,
    ms: Date.now() - started,
    detail: `Ready (${formatMs(health.ms)} health wait)`,
  };
}

async function main() {
  console.log("\nGymBro — Starting Full Stack\n" + "=".repeat(52));

  const summary = [];
  const totalStart = Date.now();

  // 1. MongoDB
  console.log("\n[1/6] MongoDB");
  const mongo = await checkMongo();
  summary.push({
    name: "MongoDB",
    port: "Atlas/local",
    status: mongo.ok ? "UP" : "DOWN",
    health: mongo.detail,
    startupTime: formatMs(mongo.ms),
  });
  if (!mongo.ok) {
    printSummary(summary);
    process.exit(1);
  }
  console.log(`  ✓ MongoDB connected (${formatMs(mongo.ms)})`);

  const ordered = services.filter((s) => s.id !== "mongodb" && s.id !== "fitbot");

  let index = 2;
  for (const service of ordered) {
    console.log(`\n[${index}/${ordered.length + 1}] ${service.name} (port ${service.port ?? "—"})`);
    const result = await startProcessService(service);
    summary.push({
      name: service.name,
      port: service.port ?? "—",
      status: result.ok ? "UP" : "DOWN",
      health: result.detail,
      startupTime: formatMs(result.ms),
    });

    if (result.ok) {
      console.log(`  ✓ ${result.detail}${result.skipped ? "" : ""}`);
    } else {
      console.error(`  ✗ ${result.detail}`);
      printSummary(summary);
      process.exit(1);
    }
    index += 1;
    await sleep(500);
  }

  // FitBot / Groq check via backend
  console.log(`\n[${index}/${ordered.length + 1}] FitBot (Groq via Express)`);
  const fitbotStart = Date.now();
  let fitbotOk = false;
  let fitbotDetail = "Unknown";

  if (!process.env.GROQ_API_KEY) {
    fitbotDetail = "GROQ_API_KEY missing in server/.env — FitBot will fail";
  } else {
    const mongoose = require("mongoose");
    const jwt = require("jsonwebtoken");
    const User = require("../server/models/userModel");

    try {
      await mongoose.connect(process.env.MONGO_URL, {
        serverSelectionTimeoutMS: 10000,
      });
      const user =
        (await User.findOne({ username: "gymbro_smoke" })) ||
        (await User.findOne({ isVerified: true }));
      if (!user) {
        fitbotDetail = "No test user found for FitBot probe";
      } else {
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
          expiresIn: "15m",
        });
        const res = await httpProbe("http://127.0.0.1:5000/api/v1/fitbot/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: { message: "Say hello in one word.", history: [] },
          timeoutMs: 45000,
        });
        if (res.status === 200 && res.body?.reply) {
          fitbotOk = true;
          fitbotDetail = `Reply: ${String(res.body.reply).slice(0, 50)}…`;
        } else {
          fitbotDetail = res.body?.message || `HTTP ${res.status}`;
        }
      }
      await mongoose.disconnect();
    } catch (err) {
      fitbotDetail = err.message;
    }
  }

  summary.push({
    name: "FitBot (Groq)",
    port: "5000 (embedded)",
    status: fitbotOk ? "UP" : "DOWN",
    health: fitbotDetail,
    startupTime: formatMs(Date.now() - fitbotStart),
  });

  if (fitbotOk) console.log(`  ✓ ${fitbotDetail}`);
  else console.error(`  ✗ ${fitbotDetail}`);

  printSummary(summary, Date.now() - totalStart);

  const aiDown = summary.filter((s) => s.status === "DOWN" && s.name !== "FitBot (Groq)");
  const fitbotDown = !fitbotOk;

  if (aiDown.length || fitbotDown) {
    console.error("\nStack started but not all AI services are operational.");
    if (fitbotDown) console.error("  → Set GROQ_API_KEY in server/.env for FitBot.");
    process.exit(1);
  }

  console.log("\nAll services operational. Stack is running.");
  console.log("Press Ctrl+C to stop spawned services.\n");

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
  await new Promise(() => {});
}

function shutdown() {
  console.log("\nStopping spawned services…");
  for (const [id, proc] of Object.entries(children)) {
    try {
      proc.kill("SIGTERM");
      console.log(`  stopped ${id} (pid ${proc.pid})`);
    } catch {
      // ignore
    }
  }
  process.exit(0);
}

function printSummary(rows, totalMs) {
  console.log("\n" + "=".repeat(72));
  console.log("STARTUP SUMMARY");
  console.log("=".repeat(72));
  console.log(
    pad("Service") +
      pad("Port", 14) +
      pad("Status", 10) +
      pad("Startup", 10) +
      "Health Check",
  );
  console.log("-".repeat(72));
  for (const row of rows) {
    const icon = row.status === "UP" ? "✓" : "✗";
    console.log(
      pad(row.name) +
        pad(String(row.port), 14) +
        pad(`${icon} ${row.status}`, 10) +
        pad(row.startupTime, 10) +
        row.health,
    );
  }
  if (totalMs != null) {
    console.log("-".repeat(72));
    console.log(`Total startup time: ${formatMs(totalMs)}`);
  }
  console.log("=".repeat(72));
}

function pad(str, width = 22) {
  const s = String(str);
  return s.length >= width ? s.slice(0, width - 1) + " " : s + " ".repeat(width - s.length);
}

main().catch((err) => {
  console.error("Stack startup failed:", err.message);
  process.exit(1);
});

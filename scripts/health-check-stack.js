/**
 * Verify every GymBro service is healthy.
 * Run: node scripts/health-check-stack.js
 * Exit code 0 = all required services healthy.
 */
const path = require("path");
const fs = require("fs");
const { spawnSync } = require("child_process");
require("dotenv").config({ path: path.join(__dirname, "../server/.env") });

const { httpProbe, formatMs } = require("./stack-utils");
const { services } = require("./stack.config");

async function checkMongo() {
  const start = Date.now();
  if (!process.env.MONGO_URL) {
    return { ok: false, ms: Date.now() - start, detail: "MONGO_URL missing" };
  }
  const mongoose = require("mongoose");
  try {
    await mongoose.connect(process.env.MONGO_URL, { serverSelectionTimeoutMS: 10000 });
    await mongoose.disconnect();
    return { ok: true, ms: Date.now() - start, detail: "Connected" };
  } catch (err) {
    return { ok: false, ms: Date.now() - start, detail: err.message };
  }
}

async function checkFitBot() {
  const start = Date.now();
  if (!process.env.GROQ_API_KEY) {
    return { ok: false, ms: Date.now() - start, detail: "GROQ_API_KEY not set" };
  }
  const mongoose = require("mongoose");
  const jwt = require("jsonwebtoken");
  const User = require("../server/models/userModel");

  try {
    await mongoose.connect(process.env.MONGO_URL, { serverSelectionTimeoutMS: 10000 });
    let user = await User.findOne({ username: process.env.SMOKE_USERNAME || "gymbro_smoke" });
    if (!user) user = await User.findOne({ isVerified: true });
    if (!user) {
      return { ok: false, ms: Date.now() - start, detail: "No verified user for probe" };
    }
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "15m" });
    const res = await httpProbe("http://127.0.0.1:5000/api/v1/fitbot/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: { message: "Reply with one word: ready", history: [] },
      timeoutMs: 45000,
    });
    await mongoose.disconnect();
    if (res.status === 200 && res.body?.reply) {
      return { ok: true, ms: Date.now() - start, detail: String(res.body.reply).slice(0, 60) };
    }
    return { ok: false, ms: Date.now() - start, detail: res.body?.message || `HTTP ${res.status}` };
  } catch (err) {
    await mongoose.disconnect().catch(() => {});
    return { ok: false, ms: Date.now() - start, detail: err.message };
  }
}

async function checkCalorieViaApi() {
  const start = Date.now();
  const res = await httpProbe("http://127.0.0.1:5000/api/v1/calories/health");
  if (res.status === 200 && res.body?.status === "ok") {
    return { ok: true, ms: Date.now() - start, detail: "ML proxy healthy" };
  }
  return { ok: false, ms: Date.now() - start, detail: res.body?.message || `HTTP ${res.status}` };
}

async function checkRecoveryViaApi() {
  const start = Date.now();
  const mongoose = require("mongoose");
  const jwt = require("jsonwebtoken");
  const User = require("../server/models/userModel");

  try {
    await mongoose.connect(process.env.MONGO_URL, { serverSelectionTimeoutMS: 10000 });
    let user = await User.findOne({ username: process.env.SMOKE_USERNAME || "gymbro_smoke" });
    if (!user) user = await User.findOne({ isVerified: true, gender: { $exists: true } });
    if (!user) {
      return { ok: false, ms: Date.now() - start, detail: "No user with profile for recovery test" };
    }
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "15m" });
    const res = await httpProbe("http://127.0.0.1:5000/api/v1/status/daily-status", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: {
        total_sleep_min: 420,
        deep_sleep_min: 90,
        rem_sleep_min: 80,
        hr_avg_bpm: 58,
        sleep_score: 82,
        avg_stress_score: 35,
        steps: 8000,
        active_minutes: 45,
      },
      timeoutMs: 30000,
    });
    await mongoose.disconnect();
    if (res.status === 200 && res.body?.data?.recommendation) {
      return {
        ok: true,
        ms: Date.now() - start,
        detail: res.body.data.recommendation,
      };
    }
    return { ok: false, ms: Date.now() - start, detail: res.body?.message || `HTTP ${res.status}` };
  } catch (err) {
    await mongoose.disconnect().catch(() => {});
    return { ok: false, ms: Date.now() - start, detail: err.message };
  }
}

async function checkFormCheckerProcess() {
  const start = Date.now();
  const sampleScript = path.join(__dirname, "generate-form-check-sample.py");
  const formDir = path.join(__dirname, "../ai-services/form-checker");
  const venvPy = path.join(formDir, "venv", "Scripts", "python.exe");
  const py = fs.existsSync(venvPy) ? venvPy : "python";

  if (!fs.existsSync(sampleScript)) {
    return { ok: false, ms: Date.now() - start, detail: "Sample generator missing" };
  }

  const gen = spawnSync(py, [sampleScript], { cwd: formDir, encoding: "utf8" });
  if (gen.status !== 0) {
    return { ok: false, ms: Date.now() - start, detail: gen.stderr || "Sample video generation failed" };
  }

  const videoPath = path.join(formDir, "test-fixtures", "sample_squat.mp4");
  if (!fs.existsSync(videoPath)) {
    return { ok: false, ms: Date.now() - start, detail: "Sample video not created" };
  }

  const FormData = globalThis.FormData;
  const formData = new FormData();
  const blob = new Blob([fs.readFileSync(videoPath)], { type: "video/mp4" });
  formData.append("video", blob, "sample_squat.mp4");

  const url = `${process.env.FORM_CHECKER_URL || "http://127.0.0.1:8000"}/analyze-form?mode=Beginner`;
  try {
    const res = await fetch(url, { method: "POST", body: formData });
    const data = await res.json();
    if (res.ok && data.success) {
      return {
        ok: true,
        ms: Date.now() - start,
        detail: `${data.correct_reps} correct / ${data.incorrect_reps} incorrect reps`,
      };
    }
    return { ok: false, ms: Date.now() - start, detail: data.error || `HTTP ${res.status}` };
  } catch (err) {
    return { ok: false, ms: Date.now() - start, detail: err.message };
  }
}

async function checkHttpService(service) {
  const start = Date.now();
  const res = await httpProbe(service.healthUrl, {
    method: service.healthMethod || "GET",
    body: service.healthBody,
    timeoutMs: 10000,
  });
  const ok =
    typeof service.healthMatch === "function"
      ? service.healthMatch(res.body, res.status, res.raw)
      : res.ok;
  return {
    ok,
    ms: Date.now() - start,
    detail: ok ? JSON.stringify(res.body).slice(0, 80) : res.raw?.slice(0, 80) || `HTTP ${res.status}`,
  };
}

async function main() {
  console.log("\nGymBro — Stack Health Check\n" + "=".repeat(52));
  const totalStart = Date.now();
  const rows = [];

  const mongo = await checkMongo();
  rows.push({ name: "MongoDB", port: "—", ...mongo, status: mongo.ok ? "UP" : "DOWN" });

  for (const service of services.filter((s) => s.healthUrl && s.id !== "fitbot")) {
    const result = await checkHttpService(service);
    rows.push({
      name: service.name,
      port: service.port ?? "—",
      ...result,
      status: result.ok ? "UP" : "DOWN",
    });
  }

  const calorieApi = await checkCalorieViaApi();
  rows.push({
    name: "Calorie API (via Express)",
    port: 5000,
    ...calorieApi,
    status: calorieApi.ok ? "UP" : "DOWN",
  });

  const fitbot = await checkFitBot();
  rows.push({
    name: "FitBot (Groq)",
    port: "5000",
    ...fitbot,
    status: fitbot.ok ? "UP" : "DOWN",
  });

  const recovery = await checkRecoveryViaApi();
  rows.push({
    name: "Recovery API (via Express)",
    port: 5000,
    ...recovery,
    status: recovery.ok ? "UP" : "DOWN",
  });

  const formCheck = await checkFormCheckerProcess();
  rows.push({
    name: "Form Checker (process video)",
    port: 8000,
    ...formCheck,
    status: formCheck.ok ? "UP" : "DOWN",
  });

  printSummary(rows, Date.now() - totalStart);

  const failed = rows.filter((r) => !r.ok);
  if (failed.length) {
    console.error(`\n${failed.length} service(s) unhealthy.`);
    process.exit(1);
  }
  console.log("\nAll services healthy.\n");
}

function printSummary(rows, totalMs) {
  console.log("\n" + "=".repeat(78));
  console.log(
    pad("Service") + pad("Port", 12) + pad("Status", 10) + pad("Time", 10) + "Health Result",
  );
  console.log("-".repeat(78));
  for (const row of rows) {
    const icon = row.ok ? "✓" : "✗";
    console.log(
      pad(row.name) +
        pad(String(row.port), 12) +
        pad(`${icon} ${row.status}`, 10) +
        pad(formatMs(row.ms), 10) +
        row.detail,
    );
  }
  console.log("-".repeat(78));
  console.log(`Total check time: ${formatMs(totalMs)}`);
  console.log("=".repeat(78));
}

function pad(str, width = 24) {
  const s = String(str);
  return s.length >= width ? s.slice(0, width - 1) + " " : s + " ".repeat(width - s.length);
}

main().catch((err) => {
  console.error("Health check crashed:", err.message);
  process.exit(1);
});

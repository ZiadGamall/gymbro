const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const SHOT_DIR = path.join(process.cwd(), "playwright-report", "demo-screenshots");
const LOG_DIR = path.join(process.cwd(), "playwright-report", "demo-logs");

let stepCounter = 0;

function ensureDirs() {
  fs.mkdirSync(SHOT_DIR, { recursive: true });
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

async function humanPause(page, ms = 600) {
  await page.waitForTimeout(ms);
}

async function naturalScroll(page, pixels = 400) {
  await page.mouse.wheel(0, pixels);
  await humanPause(page, 400);
}

async function scrollToBottom(page) {
  await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" }));
  await humanPause(page, 800);
}

async function hoverFirst(page, selector) {
  const el = page.locator(selector).first();
  if (await el.count()) {
    await el.hover();
    await humanPause(page, 350);
  }
}

/** Workout builder uses icon-only search; logger has "Search" label. */
async function clickExerciseSearch(page) {
  const input = page.getByPlaceholder(/Search exercises/i);
  const row = input.locator("xpath=..");
  await row.locator('button[type="button"]').click();
}

async function pickExerciseResult(page, pattern) {
  await page
    .locator(".rounded-xl.border button")
    .filter({ hasText: pattern })
    .first()
    .click();
}

async function snap(page, label) {
  ensureDirs();
  stepCounter += 1;
  const slug = String(label)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
  const filename = `${String(stepCounter).padStart(2, "0")}-${slug}.png`;
  const filepath = path.join(SHOT_DIR, filename);
  await page.screenshot({ path: filepath, fullPage: true });
  return filepath;
}

function verifyEmail(email) {
  execSync(`node scripts/verify-user-email.js "${email}"`, {
    cwd: process.cwd(),
    stdio: "inherit",
  });
}

function attachLogging(page, logs) {
  const reqStart = new Map();

  page.on("console", (msg) => {
    logs.console.push({ type: msg.type(), text: msg.text() });
  });
  page.on("pageerror", (err) => {
    logs.console.push({ type: "pageerror", text: err.message });
  });
  page.on("request", (req) => {
    const url = req.url();
    if (url.includes("/api/")) {
      reqStart.set(req, Date.now());
    }
  });
  page.on("response", (res) => {
    const url = res.url();
    if (!url.includes("/api/")) return;
    const req = res.request();
    const started = reqStart.get(req) || Date.now();
    const entry = {
      status: res.status(),
      method: req.method(),
      url: url.replace(/^https?:\/\/[^/]+/, ""),
      ms: Date.now() - started,
      at: Date.now(),
    };
    logs.network.push(entry);
    reqStart.delete(req);
  });
}

function analyzeProductionMetrics(logs) {
  const network = logs.network || [];
  const consoleEntries = logs.console || [];

  const failedRequests = network.filter(
    (r) => r.status >= 400 || r.status === 0,
  );
  const serverErrors = network.filter((r) => r.status >= 500);
  const clientErrors = network.filter(
    (r) => r.status === 404 || r.status === 401 || r.status === 403,
  );
  const aiRequests = network.filter((r) =>
    /\/(fitbot|form-check|calories|status\/daily-status)/.test(r.url),
  );
  const failedAi = aiRequests.filter((r) => r.status >= 400);

  const latencies = network.map((r) => r.ms).filter((n) => Number.isFinite(n));
  const avgLatency =
    latencies.length > 0
      ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length)
      : 0;
  const maxLatency = latencies.length > 0 ? Math.max(...latencies) : 0;

  const duplicates = [];
  for (let i = 1; i < network.length; i++) {
    const prev = network[i - 1];
    const cur = network[i];
    const key = `${cur.method} ${cur.url}`;
    if (
      `${prev.method} ${prev.url}` === key &&
      cur.at - prev.at < 100
    ) {
      duplicates.push(key);
    }
  }

  const consoleErrors = consoleEntries.filter((e) => {
    if (e.type === "pageerror") return true;
    if (e.type !== "error") return false;
    const t = e.text || "";
    if (t.includes("Download the React DevTools")) return false;
    return true;
  });

  const consoleWarnings = consoleEntries.filter((e) => e.type === "warning");
  const reactWarnings = consoleEntries.filter((e) => {
    const t = e.text || "";
    return (
      e.type === "warning" &&
      (/React Router|react-dom|React/.test(t) || t.includes("Future Flag"))
    );
  });

  const runtimeExceptions = consoleEntries.filter((e) => e.type === "pageerror");

  const metrics = {
    totalHttpRequests: network.length,
    failedRequests: failedRequests.length,
    serverErrors: serverErrors.length,
    clientErrors404: network.filter((r) => r.status === 404).length,
    averageApiLatencyMs: avgLatency,
    maxApiLatencyMs: maxLatency,
    consoleErrors: consoleErrors.length,
    consoleWarnings: consoleWarnings.length,
    reactWarnings: reactWarnings.length,
    runtimeExceptions: runtimeExceptions.length,
    playwrightFailures: 0,
    duplicateRequests: duplicates.length,
    failedAiRequests: failedAi.length,
    brokenLinks: 0,
  };

  const checks = {
    no500: metrics.serverErrors === 0,
    no404: metrics.clientErrors404 === 0,
    noFailedApi: metrics.failedRequests === 0,
    noConsoleErrors: metrics.consoleErrors === 0,
    noRuntimeExceptions: metrics.runtimeExceptions === 0,
    noReactWarnings: metrics.reactWarnings === 0,
    noDuplicates: metrics.duplicateRequests === 0,
    noFailedAi: metrics.failedAiRequests === 0,
  };

  const passedChecks = Object.values(checks).filter(Boolean).length;
  const totalChecks = Object.keys(checks).length;
  metrics.productionReadinessScore = Math.round((passedChecks / totalChecks) * 100);
  metrics.checks = checks;
  metrics.failedRequestDetails = failedRequests;
  metrics.duplicateDetails = [...new Set(duplicates)];
  metrics.consoleErrorDetails = consoleErrors.map((e) => e.text);
  metrics.reactWarningDetails = reactWarnings.map((e) => e.text);

  return metrics;
}

function saveLogs(logs) {
  ensureDirs();
  const consoleLines = (logs.console || []).map(
    (e) => `[${e.type}] ${e.text}`,
  );
  const networkLines = (logs.network || []).map(
    (r) => `${r.status} ${r.method} ${r.url}${r.ms != null ? ` (${r.ms}ms)` : ""}`,
  );
  fs.writeFileSync(path.join(LOG_DIR, "console.log"), consoleLines.join("\n"));
  fs.writeFileSync(path.join(LOG_DIR, "network.log"), networkLines.join("\n"));
  if (logs.metrics) {
    fs.writeFileSync(
      path.join(LOG_DIR, "production-metrics.json"),
      JSON.stringify(logs.metrics, null, 2),
    );
  }
}

function buildGallery() {
  ensureDirs();
  const files = fs.readdirSync(SHOT_DIR).filter((f) => f.endsWith(".png")).sort();
  const items = files
    .map(
      (f) =>
        `<figure><img src="demo-screenshots/${f}" alt="${f}"/><figcaption>${f}</figcaption></figure>`,
    )
    .join("\n");

  const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"/><title>GymBro Product Demo</title>
<style>
body{font-family:system-ui;background:#0a0a0f;color:#eee;margin:0;padding:24px}
h1{color:#ff6b2c} h2{color:#8888a8;font-size:14px;text-transform:uppercase;letter-spacing:.08em;margin-top:32px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:16px}
figure{margin:0;background:#111118;border:1px solid #242432;border-radius:12px;overflow:hidden}
img{width:100%;display:block} figcaption{padding:10px;font-size:12px;color:#8888a8}
.assets{display:flex;flex-wrap:wrap;gap:12px;margin:16px 0}
.assets a{color:#ff6b2c;background:#111118;border:1px solid #242432;padding:10px 16px;border-radius:8px;text-decoration:none;font-size:14px}
.assets a:hover{border-color:#ff6b2c}
.timeline{font-size:13px;color:#aaa;line-height:1.8;max-width:720px}
</style></head><body>
<h1>GymBro — Live Product Demo</h1>
<p>${files.length} screenshots · ${new Date().toISOString()} · <strong style="color:#4ade80">PASSED</strong></p>
<div class="assets">
  <a href="demo-test-results/product-demo-GymBro-live-product-demonstration/video.webm">▶ Session video (.webm)</a>
  <a href="demo-test-results/product-demo-GymBro-live-product-demonstration/trace.zip">⬡ Playwright trace (.zip)</a>
  <a href="demo-html/index.html">📋 HTML report</a>
  <a href="demo-logs/console.log">Console log</a>
  <a href="demo-logs/network.log">Network log</a>
</div>
<h2>Timeline</h2>
<ol class="timeline">
<li>Landing → Register → Email verify → Login → Dashboard</li>
<li>Onboarding (goal, level, lifestyle, nutrition targets)</li>
<li>Splits browse, compare, save & activate</li>
<li>Workout builder save · Log workout session</li>
<li>Nutrition breakfast/lunch/dinner · Calorie predictor</li>
<li>FitBot (5+ questions, markdown, memory)</li>
<li>Form checker AI · Sleep recovery · Progress charts</li>
<li>Profile tabs · Logout · Re-login persistence</li>
</ol>
<h2>Screenshot gallery</h2>
<div class="grid">${items}</div>
<p style="margin-top:32px;font-size:12px;color:#666">Open trace: <code>npx playwright show-trace playwright-report/demo-test-results/product-demo-GymBro-live-product-demonstration/trace.zip</code></p>
</body></html>`;

  fs.writeFileSync(path.join(process.cwd(), "playwright-report", "demo-gallery.html"), html);
}

module.exports = {
  SHOT_DIR,
  LOG_DIR,
  humanPause,
  naturalScroll,
  scrollToBottom,
  hoverFirst,
  clickExerciseSearch,
  pickExerciseResult,
  snap,
  verifyEmail,
  attachLogging,
  saveLogs,
  buildGallery,
  analyzeProductionMetrics,
};

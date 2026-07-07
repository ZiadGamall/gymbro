/**
 * E2E backend bootstrap — reuse an existing API server when possible,
 * otherwise start Express on port 5000.
 */
const http = require("http");
const { spawn } = require("child_process");
const path = require("path");

const PORT = Number(process.env.PLAYWRIGHT_API_PORT || 5000);
const HOST = "127.0.0.1";
const BASE_URL = `http://${HOST}:${PORT}`;

function probe(url) {
  return new Promise((resolve) => {
    const req = http.get(url, (res) => {
      res.resume();
      resolve(res.statusCode >= 200 && res.statusCode < 500);
    });
    req.on("error", () => resolve(false));
    req.setTimeout(3000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function waitForBackend(maxMs = 120_000) {
  const start = Date.now();
  while (Date.now() - start < maxMs) {
    if (await probe(BASE_URL)) return true;
    await new Promise((r) => setTimeout(r, 750));
  }
  return false;
}

async function main() {
  if (await probe(BASE_URL)) {
    console.log(`[e2e-backend] Reusing existing API at ${BASE_URL}`);
    await new Promise(() => {});
    return;
  }

  console.log(`[e2e-backend] Starting API on ${BASE_URL}…`);
  const appEntry = path.join("server", "app.js");
  const child = spawn(process.execPath, [appEntry], {
    stdio: "inherit",
    cwd: process.cwd(),
    env: process.env,
  });

  child.on("exit", (code) => {
    process.exit(code ?? 1);
  });

  const onExit = () => child.kill("SIGTERM");
  process.on("SIGINT", onExit);
  process.on("SIGTERM", onExit);

  const ready = await waitForBackend();
  if (!ready) {
    console.error(`[e2e-backend] Timed out waiting for ${BASE_URL}`);
    child.kill("SIGTERM");
    process.exit(1);
  }

  console.log(`[e2e-backend] Ready at ${BASE_URL}`);
}

main().catch((err) => {
  console.error("[e2e-backend] Failed:", err.message);
  process.exit(1);
});

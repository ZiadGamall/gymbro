/**
 * E2E frontend bootstrap — reuse an existing Vite dev server when possible,
 * otherwise start one pinned to port 3000 (strictPort).
 */
const http = require("http");
const { spawn, spawnSync } = require("child_process");
const path = require("path");

const PORT = Number(process.env.PLAYWRIGHT_PORT || 3000);
const HOST = "127.0.0.1";
const BASE_URL = `http://${HOST}:${PORT}`;

function isViteHtml(status, data) {
  return status === 200 && data.includes('id="root"');
}

function probe(url) {
  return new Promise((resolve) => {
    const req = http.get(url, (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => resolve(isViteHtml(res.statusCode, data)));
    });
    req.on("error", () => resolve(false));
    req.setTimeout(5000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function waitForFrontend(maxMs = 90_000) {
  const start = Date.now();
  while (Date.now() - start < maxMs) {
    if (await probe(BASE_URL)) return true;
    await new Promise((r) => setTimeout(r, 500));
  }
  return false;
}

function freePortIfBlocked() {
  spawnSync(process.execPath, [path.join("scripts", "kill-port.js"), String(PORT)], {
    cwd: process.cwd(),
    stdio: "inherit",
  });
}

async function main() {
  if (await probe(BASE_URL)) {
    console.log(`[e2e-frontend] Reusing existing dev server at ${BASE_URL}`);
    await new Promise(() => {});
    return;
  }

  console.log(`[e2e-frontend] Port ${PORT} not serving Vite — clearing stale listeners…`);
  freePortIfBlocked();
  await new Promise((r) => setTimeout(r, 1500));

  console.log(`[e2e-frontend] Starting Vite on ${BASE_URL}…`);
  const viteConfig = path.join("client", "vite.config.js");
  const viteCmd = `npx vite --config "${viteConfig}" --host ${HOST} --port ${PORT} --strictPort`;
  const child = spawn(viteCmd, {
    stdio: "inherit",
    shell: true,
    cwd: process.cwd(),
    env: { ...process.env, BROWSER: "none" },
  });

  child.on("exit", (code) => {
    process.exit(code ?? 1);
  });

  const onExit = () => child.kill("SIGTERM");
  process.on("SIGINT", onExit);
  process.on("SIGTERM", onExit);

  const ready = await waitForFrontend();
  if (!ready) {
    console.error(`[e2e-frontend] Timed out waiting for ${BASE_URL}`);
    child.kill("SIGTERM");
    process.exit(1);
  }

  console.log(`[e2e-frontend] Ready at ${BASE_URL}`);
}

main().catch((err) => {
  console.error("[e2e-frontend] Failed:", err.message);
  process.exit(1);
});

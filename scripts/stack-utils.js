/**
 * Shared helpers for GymBro stack orchestration.
 */
const http = require("http");
const https = require("https");
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function isViteFrontend(body, status) {
  if (status !== 200) return false;
  const html = typeof body === "string" ? body : String(body?.raw ?? "");
  return html.includes('id="root"') || html.includes("GymBro");
}

function httpProbe(url, options = {}) {
  const {
    method = "GET",
    headers = {},
    body,
    timeoutMs = 5000,
  } = options;

  return new Promise((resolve) => {
    const parsed = new URL(url);
    const lib = parsed.protocol === "https:" ? https : http;
    const req = lib.request(
      {
        hostname: parsed.hostname,
        port: parsed.port,
        path: parsed.pathname + parsed.search,
        method,
        headers,
        timeout: timeoutMs,
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => {
          data += chunk;
        });
        res.on("end", () => {
          let json = data;
          try {
            json = JSON.parse(data);
          } catch {
            // keep text
          }
          resolve({
            ok: res.statusCode >= 200 && res.statusCode < 500,
            status: res.statusCode,
            body: json,
            raw: data,
          });
        });
      },
    );
    req.on("error", () => resolve({ ok: false, status: 0, body: null, raw: "" }));
    req.on("timeout", () => {
      req.destroy();
      resolve({ ok: false, status: 0, body: null, raw: "timeout" });
    });
    if (body) req.write(typeof body === "string" ? body : JSON.stringify(body));
    req.end();
  });
}

async function waitForUrl(url, matcher, maxMs = 120_000, intervalMs = 750) {
  const start = Date.now();
  while (Date.now() - start < maxMs) {
    const res = await httpProbe(url);
    if (matcher(res.body, res.status, res.raw)) {
      return { ok: true, ms: Date.now() - start, status: res.status, body: res.body };
    }
    await sleep(intervalMs);
  }
  return { ok: false, ms: Date.now() - start };
}

function isPortOpen(host, port) {
  return new Promise((resolve) => {
    const socket = require("net").connect({ host, port }, () => {
      socket.end();
      resolve(true);
    });
    socket.on("error", () => resolve(false));
    socket.setTimeout(2000, () => {
      socket.destroy();
      resolve(false);
    });
  });
}

function pythonBin(cwd) {
  const win = path.join(cwd, "venv", "Scripts", "python.exe");
  const unix = path.join(cwd, "venv", "bin", "python");
  if (fs.existsSync(win)) return win;
  if (fs.existsSync(unix)) return unix;
  return process.platform === "win32" ? "python" : "python3";
}

function uvicornBin(cwd) {
  const win = path.join(cwd, "venv", "Scripts", "uvicorn.exe");
  const unix = path.join(cwd, "venv", "bin", "uvicorn");
  if (fs.existsSync(win)) return win;
  if (fs.existsSync(unix)) return unix;
  return null;
}

async function ensurePythonVenv(service) {
  const venvDir = path.join(service.cwd, "venv");
  const py = pythonBin(service.cwd);
  const reqFile = path.join(service.cwd, service.requirements);

  if (!fs.existsSync(venvDir)) {
    console.log(`  [${service.name}] Creating Python venv…`);
    await runCommand(py, ["-m", "venv", "venv"], service.cwd);
  }

  const venvPy = pythonBin(service.cwd);
  console.log(`  [${service.name}] Installing dependencies (${service.requirements})…`);
  await runCommand(venvPy, ["-m", "pip", "install", "-q", "--upgrade", "pip"], service.cwd);
  await runCommand(
    venvPy,
    ["-m", "pip", "install", "-q", "-r", reqFile],
    service.cwd,
  );
}

function runCommand(cmd, args, cwd) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, {
      cwd,
      stdio: "inherit",
      shell: false,
      env: process.env,
    });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${cmd} exited with code ${code}`));
    });
  });
}

function spawnService(service, env = {}) {
  const mergedEnv = { ...process.env, ...env };
  const isBg = process.env.BACKGROUND_STACK === "true";
  const stdio = isBg ? "ignore" : "pipe";
  const detached = isBg;

  if (service.python) {
    const uvicorn = uvicornBin(service.cwd) || pythonBin(service.cwd);
    const args =
      uvicorn.endsWith("uvicorn.exe") || uvicorn.endsWith("/uvicorn")
        ? ["main:app", "--host", service.host, "--port", String(service.port)]
        : ["-m", "uvicorn", "main:app", "--host", service.host, "--port", String(service.port)];

    return spawn(uvicorn, args, {
      cwd: service.cwd,
      stdio,
      shell: false,
      detached,
      env: mergedEnv,
    });
  }

  if (service.command?.script) {
    return spawn(process.execPath, [path.join(service.cwd || ".", service.command.script)], {
      cwd: service.cwd,
      stdio,
      detached,
      env: mergedEnv,
    });
  }

  return spawn(service.command.exec, service.command.args, {
    cwd: service.cwd,
    stdio,
    detached,
    env: mergedEnv,
  });
}

function formatMs(ms) {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

module.exports = {
  sleep,
  httpProbe,
  waitForUrl,
  isPortOpen,
  isViteFrontend,
  pythonBin,
  uvicornBin,
  ensurePythonVenv,
  runCommand,
  spawnService,
  formatMs,
};

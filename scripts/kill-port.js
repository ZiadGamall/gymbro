/**
 * Kill processes listening on a TCP port (Windows-focused, best-effort on Unix).
 * Usage: node scripts/kill-port.js 3000
 */
const { execSync } = require("child_process");

const port = process.argv[2];
if (!port) {
  console.error("Usage: node scripts/kill-port.js <port>");
  process.exit(1);
}

function killOnWindows() {
  let out = "";
  try {
    out = execSync(`netstat -ano | findstr ":${port}"`, { encoding: "utf8" });
  } catch {
    return 0;
  }
  const pids = new Set();
  for (const line of out.split("\n")) {
    if (!line.includes("LISTENING")) continue;
    const parts = line.trim().split(/\s+/);
    const pid = parts[parts.length - 1];
    if (pid && pid !== "0") pids.add(pid);
  }
  for (const pid of pids) {
    try {
      execSync(`taskkill /PID ${pid} /F`, { stdio: "ignore" });
      console.log(`Killed PID ${pid} on port ${port}`);
    } catch {
      // ignore
    }
  }
  return pids.size;
}

function killOnUnix() {
  try {
    execSync(`lsof -ti :${port} | xargs kill -9`, { stdio: "ignore", shell: true });
    return 1;
  } catch {
    return 0;
  }
}

const count = process.platform === "win32" ? killOnWindows() : killOnUnix();
if (!count) console.log(`No listener found on port ${port}`);

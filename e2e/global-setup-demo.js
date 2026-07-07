/**
 * Start full GymBro stack before product demo recording.
 */
const { spawnSync } = require("child_process");
const path = require("path");

module.exports = async function globalSetup() {
  const root = path.join(__dirname, "..");
  console.log("\n[demo-setup] Ensuring GymBro stack is running…\n");

  const ensure = spawnSync(process.execPath, [path.join(root, "scripts/ensure-stack.js")], {
    cwd: root,
    stdio: "inherit",
    env: process.env,
  });
  if (ensure.status !== 0) {
    throw new Error("Stack ensure failed — run npm run stack:ensure manually");
  }

  console.log("\n[demo-setup] Stack ready — starting product demo recording.\n");
};

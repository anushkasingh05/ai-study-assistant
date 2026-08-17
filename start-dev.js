const { spawn } = require("child_process");
const path = require("path");

const isWin = process.platform === "win32";
const npmCmd = isWin ? "npm.cmd" : "npm";

console.log("=========================================");
console.log("🚀 Starting StudyAI (Backend + Frontend)");
console.log("=========================================\n");

const backend = spawn(npmCmd, ["run", "dev"], {
  cwd: path.join(__dirname, "backend"),
  stdio: "inherit",
  shell: true,
});

const frontend = spawn(npmCmd, ["run", "dev"], {
  cwd: path.join(__dirname, "frontend"),
  stdio: "inherit",
  shell: true,
});

function cleanup() {
  console.log("\nStopping servers...");
  backend.kill();
  frontend.kill();
  process.exit();
}

process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);
process.on("exit", cleanup);

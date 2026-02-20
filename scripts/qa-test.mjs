import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const rootDir = process.cwd();
const webDir = path.join(rootDir, "apps", "web");
const artifactsDir = path.join(rootDir, "artifacts");
const junitDir = path.join(artifactsDir, "junit");
const testTimeoutMs = Number(process.env.QA_TEST_TIMEOUT_MS || 20 * 60 * 1000);
const installTimeoutMs = Number(process.env.QA_INSTALL_TIMEOUT_MS || 10 * 60 * 1000);
const workers = String(process.env.PLAYWRIGHT_WORKERS || "1").trim();

function ensureArtifactsDirs() {
  fs.mkdirSync(artifactsDir, { recursive: true });
  fs.mkdirSync(junitDir, { recursive: true });
}

async function run(command, args, timeoutMs = null) {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      cwd: webDir,
      env: process.env,
      stdio: "inherit",
      shell: process.platform === "win32"
    });

    let timeout = null;
    if (timeoutMs) {
      timeout = setTimeout(() => {
        console.error(`qa:test timed out after ${timeoutMs}ms`);
        try {
          child.kill("SIGTERM");
        } catch {
          // Ignore cleanup errors.
        }
      }, timeoutMs);
    }

    child.on("close", (code) => {
      if (timeout) clearTimeout(timeout);
      resolve(code ?? 1);
    });
  });
}

async function main() {
  ensureArtifactsDirs();

  const isLinux = process.platform === "linux";
  const installArgs = isLinux
    ? ["--yes", "playwright", "install", "--with-deps", "chromium"]
    : ["--yes", "playwright", "install", "chromium"];

  console.log("qa:test: installing Playwright Chromium...");
  const installCode = await run("npx", installArgs, installTimeoutMs);
  if (installCode !== 0) {
    process.exit(installCode);
  }

  console.log("qa:test: running Playwright test suite...");
  const testCode = await run(
    "npx",
    [
      "--yes",
      "playwright",
      "test",
      "--config",
      "playwright.config.js",
      "--reporter=line",
      "--workers",
      workers
    ],
    testTimeoutMs
  );
  process.exit(testCode);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

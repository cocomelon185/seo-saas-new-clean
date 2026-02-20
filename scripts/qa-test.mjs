import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const rootDir = process.cwd();
const webDir = path.join(rootDir, "apps", "web");
const artifactsDir = path.join(rootDir, "artifacts");
const junitDir = path.join(artifactsDir, "junit");
const testTimeoutMs = Number(process.env.QA_TEST_TIMEOUT_MS || 20 * 60 * 1000);
const workers = String(process.env.PLAYWRIGHT_WORKERS || "1").trim();

function ensureArtifactsDirs() {
  fs.mkdirSync(artifactsDir, { recursive: true });
  fs.mkdirSync(junitDir, { recursive: true });
}

async function runPlaywright() {
  return new Promise((resolve) => {
    const child = spawn(
      "npx",
      [
        "playwright",
        "test",
        "--config",
        "playwright.config.js",
        "--project=chromium",
        "--reporter=line",
        "--workers",
        workers
      ],
      {
        cwd: webDir,
        env: process.env,
        stdio: "inherit",
        shell: process.platform === "win32"
      }
    );

    const timeout = setTimeout(() => {
      console.error(`qa:test timed out after ${testTimeoutMs}ms`);
      try {
        child.kill("SIGTERM");
      } catch {
        // Ignore cleanup errors.
      }
    }, testTimeoutMs);

    child.on("close", (code) => {
      clearTimeout(timeout);
      resolve(code ?? 1);
    });
  });
}

async function main() {
  ensureArtifactsDirs();
  const exitCode = await runPlaywright();
  process.exit(exitCode);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const rootDir = process.cwd();
const webDir = path.join(rootDir, "apps", "web");
const artifactsDir = path.join(rootDir, "artifacts");
const junitDir = path.join(artifactsDir, "junit");
const testTimeoutMs = Number(process.env.QA_TEST_TIMEOUT_MS || 20 * 60 * 1000);
const baseUrl = String(process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3000").trim();
const workers = String(process.env.PLAYWRIGHT_WORKERS || "1").trim();

function ensureArtifactsDirs() {
  fs.mkdirSync(artifactsDir, { recursive: true });
  fs.mkdirSync(junitDir, { recursive: true });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function startServer() {
  return spawn("node", ["server.js"], {
    cwd: rootDir,
    env: {
      ...process.env,
      PORT: "3000",
      HOST: "127.0.0.1",
      NODE_ENV: "test"
    },
    stdio: "inherit",
    shell: process.platform === "win32"
  });
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
        env: {
          ...process.env,
          PLAYWRIGHT_BASE_URL: baseUrl,
          PW_REUSE_SERVER: "true"
        },
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
  const server = startServer();
  await sleep(2500);
  const exitCode = await runPlaywright();
  try {
    server.kill("SIGTERM");
  } catch {
    // Ignore cleanup errors.
  }
  process.exit(exitCode);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

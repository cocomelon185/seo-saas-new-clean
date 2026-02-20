import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const rootDir = process.cwd();
const artifactsDir = path.join(rootDir, "artifacts");
const junitDir = path.join(artifactsDir, "junit");

function run(command, args) {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      cwd: rootDir,
      env: process.env,
      stdio: "inherit",
      shell: process.platform === "win32"
    });
    child.on("close", (code) => resolve(code ?? 1));
  });
}

function ensureDirs() {
  fs.mkdirSync(artifactsDir, { recursive: true });
  fs.mkdirSync(junitDir, { recursive: true });
}

async function main() {
  ensureDirs();
  const requireSentryCheck = String(process.env.REQUIRE_SENTRY_PROD_CHECK || "").trim() === "true";

  const buildCode = await run("npm", ["run", "qa:build"]);
  if (buildCode !== 0) {
    process.exit(buildCode);
  }

  const testCode = await run("npm", ["run", "qa:test"]);
  const summaryCode = await run("npm", ["run", "qa:summary"]);

  if (summaryCode !== 0) {
    process.exit(summaryCode);
  }

  if (requireSentryCheck) {
    const sentryCode = await run("npm", ["run", "qa:sentry"]);
    if (sentryCode !== 0) {
      process.exit(sentryCode);
    }
  }

  process.exit(testCode);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

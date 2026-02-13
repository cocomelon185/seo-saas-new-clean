import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const EXPECTED_BRANCH = "fix/e2e-run-audit-fires";
const EXPECTED_PROJECT = "ankypulse-frontend";
const EXPECTED_DOMAIN = "rankypulse.com";

const webRoot = path.resolve(process.cwd());
const repoRoot = path.resolve(webRoot, "..", "..");
const vercelProjectFile = path.join(repoRoot, ".vercel", "project.json");

function fail(message) {
  console.error(`\n[predeploy-verify] ${message}\n`);
  process.exit(1);
}

function run(command, cwd = repoRoot) {
  return execSync(command, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}

if (!fs.existsSync(vercelProjectFile)) {
  fail(`Missing ${vercelProjectFile}. Link Vercel project first.`);
}

const projectJson = JSON.parse(fs.readFileSync(vercelProjectFile, "utf8"));
console.log(`[predeploy-verify] projectName: ${projectJson.projectName}`);
console.log(`[predeploy-verify] projectId: ${projectJson.projectId}`);

if (projectJson.projectName !== EXPECTED_PROJECT) {
  fail(`Project mismatch. Expected "${EXPECTED_PROJECT}" but found "${projectJson.projectName}".`);
}

const currentBranch = run("git rev-parse --abbrev-ref HEAD");
console.log(`[predeploy-verify] branch: ${currentBranch}`);

if (process.env.ALLOW_ANY_BRANCH !== "1" && currentBranch !== EXPECTED_BRANCH) {
  fail(`Branch mismatch. Expected "${EXPECTED_BRANCH}" for production deploy.`);
}

let domainOutput = "";
try {
  domainOutput = run("vercel domains ls");
} catch (error) {
  fail(`Failed to read Vercel domains. Ensure Vercel CLI auth is active.\n${error.stderr || error.message}`);
}

console.log("[predeploy-verify] Vercel domains:");
console.log(domainOutput);

if (domainOutput.trim().length > 0 && !domainOutput.toLowerCase().includes(EXPECTED_DOMAIN)) {
  fail(`Domain "${EXPECTED_DOMAIN}" not found in Vercel domain list for current account/project.`);
}

if (domainOutput.trim().length === 0) {
  console.warn(`[predeploy-verify] Domain list is empty in this CLI session. Manually confirm ${EXPECTED_DOMAIN} is attached to ${EXPECTED_PROJECT}.`);
}

console.log("\n[predeploy-verify] OK: deploy target/project/domain checks passed.\n");

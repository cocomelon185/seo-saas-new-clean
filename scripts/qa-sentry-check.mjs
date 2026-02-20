import fs from "node:fs";
import path from "node:path";

const requiredVars = [
  "SENTRY_DSN",
  "VITE_SENTRY_DSN",
  "SENTRY_ENVIRONMENT",
  "SENTRY_RELEASE",
  "VITE_SENTRY_RELEASE"
];

function readEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const rows = fs.readFileSync(filePath, "utf8").split("\n");
  const data = {};
  for (const row of rows) {
    const line = row.trim();
    if (!line || line.startsWith("#")) continue;
    const idx = line.indexOf("=");
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();
    data[key] = value;
  }
  return data;
}

function getValue(key, envFileVars) {
  const runtime = String(process.env[key] || "").trim();
  if (runtime) return runtime;
  return String(envFileVars[key] || "").trim();
}

async function checkBackendEndpoint(baseUrl) {
  const normalized = String(baseUrl || "").trim().replace(/\/$/, "");
  if (!normalized) return { skipped: true };
  const url = `${normalized}/api/test-error`;
  try {
    const res = await fetch(url);
    return { skipped: false, ok: res.status >= 500, status: res.status, url };
  } catch (error) {
    return { skipped: false, ok: false, status: 0, url, error: String(error?.message || error) };
  }
}

async function main() {
  const root = process.cwd();
  const envFileVars = {
    ...readEnvFile(path.join(root, ".env")),
    ...readEnvFile(path.join(root, ".env.local"))
  };

  const missing = requiredVars.filter((key) => !getValue(key, envFileVars));
  const environment = getValue("SENTRY_ENVIRONMENT", envFileVars);
  const baseUrl = String(process.env.SENTRY_CHECK_BASE_URL || process.env.BASE_URL || "").trim();

  if (missing.length) {
    console.error("Sentry prelaunch check failed. Missing required variables:");
    for (const key of missing) console.error(`- ${key}`);
    process.exit(1);
  }

  if (environment !== "production") {
    console.error(`Sentry prelaunch check failed. SENTRY_ENVIRONMENT must be 'production', got '${environment || "(empty)"}'.`);
    process.exit(1);
  }

  const endpoint = await checkBackendEndpoint(baseUrl);
  if (!endpoint.skipped && !endpoint.ok) {
    console.error(
      `Sentry backend probe failed. Expected ${endpoint.url} to return 5xx, got ${endpoint.status}${endpoint.error ? ` (${endpoint.error})` : ""}.`
    );
    process.exit(1);
  }

  console.log("Sentry prelaunch check passed.");
  if (endpoint.skipped) {
    console.log("Backend probe skipped (set SENTRY_CHECK_BASE_URL to enable endpoint verification).");
  } else {
    console.log(`Backend probe ok: ${endpoint.url} returned ${endpoint.status}.`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

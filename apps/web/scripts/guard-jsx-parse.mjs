import fs from "node:fs";
import path from "node:path";
import { transform } from "esbuild";

const target = path.resolve(process.cwd(), "src/pages/AuditPage.jsx");

function fail(message, error) {
  console.error(`\n[jsx-guard] ${message}\n`);
  if (error) {
    console.error(error.message || String(error));
  }
  process.exit(1);
}

if (!fs.existsSync(target)) {
  fail(`Missing target file: ${target}`);
}

const source = fs.readFileSync(target, "utf8");

try {
  await transform(source, {
    loader: "jsx",
    jsx: "automatic",
    sourcefile: target,
    logLevel: "silent"
  });
  console.log(`[jsx-guard] OK: JSX parse check passed for ${target}`);
} catch (error) {
  fail(`JSX parse check failed for ${target}`, error);
}

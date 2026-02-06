import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(scriptDir, "..", "src");
const allowedExtensions = new Set([".jsx", ".js", ".tsx", ".ts"]);

async function listFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listFiles(full)));
    } else if (allowedExtensions.has(path.extname(entry.name))) {
      files.push(full);
    }
  }
  return files;
}

function findIssues(text) {
  const issues = [];
  const anchorRegex = /<a[^>]*href\\s*=\\s*([\"'])(.*?)\\1/gi;
  const linkRegex = /<Link[^>]*to\\s*=\\s*([\"'])(.*?)\\1/gi;
  let match;
  while ((match = anchorRegex.exec(text))) {
    const href = match[2].trim();
    if (!href || href === "#") {
      issues.push({ type: "anchor", value: href || "<empty>" });
    }
  }
  while ((match = linkRegex.exec(text))) {
    const to = match[2].trim();
    if (!to || to === "#") {
      issues.push({ type: "link", value: to || "<empty>" });
    }
  }
  return issues;
}

async function main() {
  const files = await listFiles(root);
  const findings = [];
  for (const file of files) {
    const text = await fs.readFile(file, "utf8");
    const issues = findIssues(text);
    if (issues.length > 0) {
      findings.push({ file, issues });
    }
  }

  if (findings.length > 0) {
    console.error("Invalid links detected:");
    for (const item of findings) {
      for (const issue of item.issues) {
        console.error(`${item.file}: ${issue.type} -> ${issue.value}`);
      }
    }
    process.exit(1);
  }
  console.log("Link validation passed.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

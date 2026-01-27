import fs from "fs";
import path from "path";

let _cache = null;

export function loadIssuesCatalog() {
  if (_cache) return _cache;

  const candidates = [
    path.join(process.cwd(), "docs", "issues-catalog.json"),
    path.join(process.cwd(), "..", "..", "docs", "issues-catalog.json"),
    path.join(process.cwd(), "..", "..", "..", "docs", "issues-catalog.json")
  ];

  for (const p of candidates) {
    try {
      const raw = fs.readFileSync(p, "utf8");
      _cache = JSON.parse(raw);
      return _cache;
    } catch {}
  }

  throw new Error("issues-catalog.json not found. Expected at repo/docs/issues-catalog.json");
}

export function getIssueDef(issue_id) {
  const cat = loadIssuesCatalog();
  const found = (cat.issues || []).find((x) => x.issue_id === issue_id);
  if (!found) throw new Error(`Issue definition not found: ${issue_id}`);
  return found;
}

export default { loadIssuesCatalog, getIssueDef };

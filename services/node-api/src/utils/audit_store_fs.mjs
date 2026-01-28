import fs from "fs";
import path from "path";
import crypto from "crypto";

function nowIso() { return new Date().toISOString(); }
function rid() { return crypto.randomBytes(12).toString("hex"); }

function ensureDir(p) { fs.mkdirSync(p, { recursive: true }); }

function readJson(p) {
  try { return JSON.parse(fs.readFileSync(p, "utf-8")); }
  catch { return null; }
}

function writeJsonAtomic(p, obj) {
  const dir = path.dirname(p);
  ensureDir(dir);
  const tmp = p + ".tmp." + rid();
  fs.writeFileSync(tmp, JSON.stringify(obj, null, 2));
  fs.renameSync(tmp, p);
}

export function makeStore(rootDir) {
  const filePath = path.join(rootDir, "audits.json");

  function load() {
    const d = readJson(filePath);
    if (d && typeof d === "object" && Array.isArray(d.items)) return d;
    return { items: [] };
  }

  function saveAll(d) { writeJsonAtomic(filePath, d); }

  function saveAudit({ user_id = "anon", url, result, label = null }) {
    const d = load();
    const rec = { id: rid(), created_at: nowIso(), user_id, url, label, result };
    d.items.unshift(rec);
    d.items = d.items.slice(0, 500);
    saveAll(d);
    return rec;
  }

  function listAudits({ user_id = "anon", url = null, limit = 50 }) {
    const d = load();
    let items = d.items.filter(x => x.user_id === user_id);
    if (url) items = items.filter(x => x.url === url);
    return items.slice(0, Math.max(1, Math.min(200, limit)));
  }

  function getAudit({ user_id = "anon", id }) {
    const d = load();
    return d.items.find(x => x.user_id === user_id && x.id === id) || null;
  }

  function summarize(result) {
    const score = typeof result?.score === "number" ? result.score : null;
    const quick_wins = Array.isArray(result?.quick_wins) ? result.quick_wins : [];
    const issues = Array.isArray(result?.issues) ? result.issues : [];
    const issue_key = issues.map(x => (x && (x.issue_id || x.title || x.name)) ? String(x.issue_id || x.title || x.name) : null).filter(Boolean);
    return { score, quick_wins, issues_count: issues.length, issue_key };
  }

  function compareAudits({ user_id = "anon", before_id, after_id }) {
    const a = getAudit({ user_id, id: before_id });
    const b = getAudit({ user_id, id: after_id });
    if (!a || !b) return null;

    const sa = summarize(a.result);
    const sb = summarize(b.result);

    const aSet = new Set(sa.issue_key);
    const bSet = new Set(sb.issue_key);

    const fixed = [];
    for (const x of aSet) if (!bSet.has(x)) fixed.push(x);

    const introduced = [];
    for (const x of bSet) if (!aSet.has(x)) introduced.push(x);

    const score_delta = (typeof sb.score === "number" && typeof sa.score === "number") ? (sb.score - sa.score) : null;

    return {
      before: { id: a.id, created_at: a.created_at, url: a.url, label: a.label, summary: sa },
      after: { id: b.id, created_at: b.created_at, url: b.url, label: b.label, summary: sb },
      score_delta,
      fixed_issues: fixed.slice(0, 200),
      new_issues: introduced.slice(0, 200),
    };
  }

  return { saveAudit, listAudits, getAudit, compareAudits };
}

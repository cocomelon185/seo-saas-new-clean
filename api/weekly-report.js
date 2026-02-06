import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const { sendWeeklyDelta } = require("../lib/emailService.js");

let _db = null;
function getDb() {
  if (_db) return _db;
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const dbPath = path.join(__dirname, "..", "database.db");
  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.prepare(`
    CREATE TABLE IF NOT EXISTS weekly_subscriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      url TEXT,
      email TEXT,
      enabled INTEGER,
      created_at TEXT,
      last_sent_at TEXT
    )
  `).run();
  db.prepare(`
    CREATE TABLE IF NOT EXISTS audit_snapshots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      url TEXT,
      score INTEGER,
      issues_json TEXT,
      created_at TEXT
    )
  `).run();
  _db = db;
  return db;
}

function normalizeUrl(value) {
  try {
    const u = new URL(String(value || "").trim());
    return u.toString();
  } catch {
    return "";
  }
}

function issuesToSet(issues) {
  if (!Array.isArray(issues)) return new Set();
  return new Set(
    issues.map((it) => String(it?.issue_id || it?.title || "").trim()).filter(Boolean)
  );
}

export async function subscribeWeeklyReport(req, res) {
  const url = normalizeUrl(req.body?.url);
  const email = String(req.body?.email || "").trim();
  const enabled = Boolean(req.body?.enabled);
  if (!url || !email.includes("@")) {
    return res.status(400).json({ ok: false, error: "Missing url or email" });
  }
  const db = getDb();
  const existing = db.prepare("SELECT id FROM weekly_subscriptions WHERE url = ? AND email = ?").get(url, email);
  const now = new Date().toISOString();
  if (existing) {
    db.prepare("UPDATE weekly_subscriptions SET enabled = ?, created_at = ? WHERE id = ?")
      .run(enabled ? 1 : 0, now, existing.id);
  } else {
    db.prepare("INSERT INTO weekly_subscriptions (url, email, enabled, created_at) VALUES (?, ?, ?, ?)")
      .run(url, email, enabled ? 1 : 0, now);
  }
  return res.json({ ok: true });
}

export async function handleWeeklyReport(report, req) {
  if (!report || report.ok === false) return;
  const url = normalizeUrl(report.final_url || report.url);
  if (!url) return;
  const db = getDb();
  const now = new Date();

  const issues = Array.isArray(report.issues) ? report.issues : [];
  db.prepare("INSERT INTO audit_snapshots (url, score, issues_json, created_at) VALUES (?, ?, ?, ?)")
    .run(url, Number.isFinite(Number(report.score)) ? Number(report.score) : 0, JSON.stringify(issues), now.toISOString());

  const subs = db.prepare("SELECT id, email, enabled, last_sent_at FROM weekly_subscriptions WHERE url = ? AND enabled = 1").all(url);
  if (!subs.length) return;

  const previous = db.prepare(
    "SELECT issues_json, score, created_at FROM audit_snapshots WHERE url = ? ORDER BY id DESC LIMIT 2"
  ).all(url);
  if (previous.length < 2) return;

  const currentIssues = issuesToSet(issues);
  const prevIssues = issuesToSet(JSON.parse(previous[1]?.issues_json || "[]"));
  const fixed = [...prevIssues].filter((id) => !currentIssues.has(id));
  const added = [...currentIssues].filter((id) => !prevIssues.has(id));
  const scoreNow = Number(report.score || 0);
  const scorePrev = Number(previous[1]?.score || 0);
  const deltaScore = scoreNow - scorePrev;

  for (const sub of subs) {
    const last = sub.last_sent_at ? new Date(sub.last_sent_at) : null;
    if (last && now.getTime() - last.getTime() < 7 * 24 * 60 * 60 * 1000) continue;
    try {
      await sendWeeklyDelta(sub.email, {
        url,
        fixed,
        added,
        scoreNow,
        deltaScore
      });
      db.prepare("UPDATE weekly_subscriptions SET last_sent_at = ? WHERE id = ?").run(now.toISOString(), sub.id);
    } catch (e) {
      console.error("Weekly email failed", e);
    }
  }
}

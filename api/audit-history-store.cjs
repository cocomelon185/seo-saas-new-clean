const fs = require("fs");
const path = require("path");
const { query } = require("./db.cjs");

const FILE_PATH = path.join(process.cwd(), "data", "audit-history.json");

function safeJsonParse(s) {
  try { return JSON.parse(s); } catch { return null; }
}

function fileRead() {
  try {
    if (!fs.existsSync(FILE_PATH)) return [];
    const raw = fs.readFileSync(FILE_PATH, "utf8");
    const parsed = safeJsonParse(raw || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function fileWrite(items) {
  try {
    const dir = path.dirname(FILE_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(FILE_PATH, JSON.stringify(items || [], null, 2), "utf8");
  } catch {}
}

function fileList(limit = 10) {
  const items = fileRead();
  return items.slice(0, limit);
}

async function ensureTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS audit_history (
      id BIGSERIAL PRIMARY KEY,
      url TEXT NOT NULL,
      score INT NOT NULL,
      title TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS audit_history_created_at_idx ON audit_history (created_at DESC);
    CREATE INDEX IF NOT EXISTS audit_history_url_idx ON audit_history (url);
  `);
}

function normalizeItem(item) {
  return {
    url: String(item.url || "").trim(),
    score: Number.isFinite(Number(item.score)) ? Number(item.score) : 0,
    title: item.title == null ? null : String(item.title).slice(0, 300),
    date: item.date ? String(item.date) : new Date().toISOString(),
  };
}

async function add(item, limit = 10) {
  const clean = normalizeItem(item);
  if (!clean.url) return [];

  if (process.env.DATABASE_URL) {
    await ensureTable();
    await query(
      `INSERT INTO audit_history (url, score, title, created_at) VALUES ($1,$2,$3,$4)`,
      [clean.url, clean.score, clean.title, clean.date]
    );
    const { rows } = await query(
      `SELECT url, score, title, created_at AS date
       FROM audit_history
       ORDER BY created_at DESC
       LIMIT $1`,
      [limit]
    );
    return rows.map(r => ({ url: r.url, score: r.score, title: r.title, date: new Date(r.date).toISOString() }));
  }

  const prev = fileRead();
  const deduped = [clean, ...prev.filter(x => x && x.url !== clean.url)].slice(0, limit);
  fileWrite(deduped);
  return deduped;
}

async function list(limit = 10) {
  if (process.env.DATABASE_URL) {
    await ensureTable();
    const { rows } = await query(
      `SELECT url, score, title, created_at AS date
       FROM audit_history
       ORDER BY created_at DESC
       LIMIT $1`,
      [limit]
    );
    return rows.map(r => ({ url: r.url, score: r.score, title: r.title, date: new Date(r.date).toISOString() }));
  }
  return fileList(limit);
}

module.exports = { add, list };

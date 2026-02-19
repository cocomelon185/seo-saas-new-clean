import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

let _db = null;

function getDb() {
  if (_db) return _db;
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const dbPath = path.join(__dirname, "..", "database.db");
  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.prepare(`
    CREATE TABLE IF NOT EXISTS embed_leads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      owner_id TEXT,
      url TEXT,
      email TEXT,
      name TEXT,
      status TEXT,
      tags TEXT,
      notes TEXT,
      created_at TEXT
    )
  `).run();
  try { db.prepare("ALTER TABLE embed_leads ADD COLUMN status TEXT").run(); } catch {}
  try { db.prepare("ALTER TABLE embed_leads ADD COLUMN tags TEXT").run(); } catch {}
  try { db.prepare("ALTER TABLE embed_leads ADD COLUMN notes TEXT").run(); } catch {}
  _db = db;
  return db;
}

function isValidUrl(value) {
  try {
    const u = new URL(String(value || ""));
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
}

export default async function embedLead(req, res) {
  const owner_id = String(req.body?.owner_id || "").trim();
  const url = String(req.body?.url || "").trim();
  const email = String(req.body?.email || "").trim();
  const name = String(req.body?.name || "").trim();

  if (!owner_id) return res.status(400).json({ ok: false, error: "Missing owner_id" });
  if (!isValidUrl(url)) return res.status(400).json({ ok: false, error: "Invalid URL" });
  if (!isValidEmail(email)) return res.status(400).json({ ok: false, error: "Invalid email" });

  const db = getDb();
  const created_at = new Date().toISOString();
  db.prepare(`
    INSERT INTO embed_leads (owner_id, url, email, name, status, tags, notes, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(owner_id, url, email, name || null, "new", "[]", "", created_at);

  return res.json({ ok: true });
}

export async function listEmbedLeads(req, res) {
  const owner_id = String(req.headers["x-rp-anon-id"] || "").trim();
  if (!owner_id) return res.status(400).json({ ok: false, error: "Missing owner_id" });
  const db = getDb();
  const rows = db.prepare(
    "SELECT id, url, email, name, status, tags, created_at FROM embed_leads WHERE owner_id = ? ORDER BY id DESC LIMIT 200"
  ).all(owner_id);
  return res.json({ ok: true, leads: rows || [] });
}

export async function getEmbedLead(req, res) {
  const owner_id = String(req.headers["x-rp-anon-id"] || "").trim();
  const id = Number(req.params?.id || 0);
  if (!owner_id) return res.status(400).json({ ok: false, error: "Missing owner_id" });
  if (!id) return res.status(400).json({ ok: false, error: "Missing lead id" });
  const db = getDb();
  const row = db.prepare(
    "SELECT id, url, email, name, status, tags, notes, created_at FROM embed_leads WHERE owner_id = ? AND id = ? LIMIT 1"
  ).get(owner_id, id);
  return res.json({ ok: true, lead: row || null });
}

export async function updateEmbedLead(req, res) {
  const owner_id = String(req.headers["x-rp-anon-id"] || "").trim();
  const id = Number(req.params?.id || 0);
  const tags = Array.isArray(req.body?.tags) ? req.body.tags.map(String).slice(0, 20) : null;
  const notes = typeof req.body?.notes === "string" ? req.body.notes : null;
  const status = String(req.body?.status || "").trim();
  if (!owner_id) return res.status(400).json({ ok: false, error: "Missing owner_id" });
  if (!id) return res.status(400).json({ ok: false, error: "Missing lead id" });

  const validStatuses = new Set(["new", "contacted", "won"]);
  const nextStatus = validStatuses.has(status) ? status : null;
  const db = getDb();
  db.prepare(`
    UPDATE embed_leads
    SET
      tags = COALESCE(?, tags),
      notes = COALESCE(?, notes),
      status = COALESCE(?, status)
    WHERE owner_id = ? AND id = ?
  `).run(tags ? JSON.stringify(tags) : null, notes, nextStatus, owner_id, id);
  return res.json({ ok: true });
}

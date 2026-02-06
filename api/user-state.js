import path from "path";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const Database = require("better-sqlite3");

let db;
function getDb() {
  if (!db) {
    db = new Database(path.join(process.cwd(), "database.db"));
    db.pragma("journal_mode = WAL");
    db.exec(`
      CREATE TABLE IF NOT EXISTS user_state (
        anon_id TEXT PRIMARY KEY,
        state TEXT,
        updated_at TEXT NOT NULL
      );
    `);
  }
  return db;
}

function getState(anonId) {
  if (!anonId) return null;
  const row = getDb()
    .prepare("SELECT state FROM user_state WHERE anon_id = ?")
    .get(String(anonId).trim());
  if (!row?.state) return null;
  try {
    return JSON.parse(row.state);
  } catch {
    return null;
  }
}

function setState(anonId, state) {
  if (!anonId) return { ok: false };
  const payload = state ? JSON.stringify(state) : null;
  getDb()
    .prepare(
      `INSERT INTO user_state (anon_id, state, updated_at)
       VALUES (?, ?, ?)
       ON CONFLICT(anon_id) DO UPDATE SET state = excluded.state, updated_at = excluded.updated_at`
    )
    .run(String(anonId).trim(), payload, new Date().toISOString());
  return { ok: true };
}

export default function registerUserState(app) {
  app.get("/api/user-state", (req, res) => {
    const anonId = req.get("x-rp-anon-id") || "";
    const state = getState(anonId);
    res.json({ ok: true, state });
  });

  app.post("/api/user-state", (req, res) => {
    const anonId = req.get("x-rp-anon-id") || "";
    if (!anonId) return res.status(400).json({ ok: false, error: "Missing anon id" });
    const result = setState(anonId, req.body || null);
    res.json(result);
  });
}

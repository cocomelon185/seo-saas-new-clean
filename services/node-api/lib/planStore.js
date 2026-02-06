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
      CREATE TABLE IF NOT EXISTS user_plans (
        email TEXT PRIMARY KEY,
        plan TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `);
  }
  return db;
}

export function getUserPlan(email) {
  try {
    if (!email) return "free";
    const row = getDb()
      .prepare("SELECT plan FROM user_plans WHERE email = ?")
      .get(String(email).trim());
    return row?.plan || "free";
  } catch {
    return "free";
  }
}

export function setUserPlan(email, plan) {
  try {
    if (!email) return { ok: false };
    const cleanPlan = plan && String(plan).trim() ? String(plan).trim() : "free";
    getDb()
      .prepare(
        `INSERT INTO user_plans (email, plan, updated_at)
         VALUES (?, ?, ?)
         ON CONFLICT(email) DO UPDATE SET plan = excluded.plan, updated_at = excluded.updated_at`
      )
      .run(String(email).trim(), cleanPlan, new Date().toISOString());
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

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
      CREATE TABLE IF NOT EXISTS payments_processed (
        payment_id TEXT PRIMARY KEY,
        payload TEXT,
        processed_at TEXT NOT NULL
      );
    `);
  }
  return db;
}

export function getUserPayments() {
  return [];
}

export function recordPayment() {
  return { ok: true };
}

export function getProcessedPayment(paymentId) {
  try {
    if (!paymentId) return null;
    return getDb()
      .prepare("SELECT payment_id, payload, processed_at FROM payments_processed WHERE payment_id = ?")
      .get(String(paymentId).trim()) || null;
  } catch {
    return null;
  }
}

export function markPaymentProcessed(paymentId, payload = null) {
  try {
    if (!paymentId) return { ok: false };
    getDb()
      .prepare(
        `INSERT INTO payments_processed (payment_id, payload, processed_at)
         VALUES (?, ?, ?)
         ON CONFLICT(payment_id) DO UPDATE SET payload = excluded.payload, processed_at = excluded.processed_at`
      )
      .run(
        String(paymentId).trim(),
        payload ? JSON.stringify(payload) : null,
        new Date().toISOString()
      );
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

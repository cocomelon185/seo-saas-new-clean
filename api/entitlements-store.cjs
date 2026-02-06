const Database = require("better-sqlite3");
const path = require("path");

let db;
function getDb() {
  if (!db) {
    db = new Database(path.join(process.cwd(), "database.db"));
    db.pragma("journal_mode = WAL");
    db.exec(`
      CREATE TABLE IF NOT EXISTS entitlements (
        anon_id TEXT PRIMARY KEY,
        allow_audit INTEGER NOT NULL DEFAULT 1,
        allow_rank INTEGER NOT NULL DEFAULT 1,
        allow_improve INTEGER NOT NULL DEFAULT 1,
        plan_id TEXT,
        status TEXT,
        billing_period TEXT,
        current_period_end TEXT,
        subscription_id TEXT,
        trial_ends_at TEXT,
        cancel_at_period_end INTEGER NOT NULL DEFAULT 0,
        updated_at TEXT NOT NULL
      );
    `);
    try { db.prepare("ALTER TABLE entitlements ADD COLUMN plan_id TEXT").run(); } catch {}
    try { db.prepare("ALTER TABLE entitlements ADD COLUMN status TEXT").run(); } catch {}
    try { db.prepare("ALTER TABLE entitlements ADD COLUMN billing_period TEXT").run(); } catch {}
    try { db.prepare("ALTER TABLE entitlements ADD COLUMN current_period_end TEXT").run(); } catch {}
    try { db.prepare("ALTER TABLE entitlements ADD COLUMN subscription_id TEXT").run(); } catch {}
    try { db.prepare("ALTER TABLE entitlements ADD COLUMN trial_ends_at TEXT").run(); } catch {}
    try { db.prepare("ALTER TABLE entitlements ADD COLUMN cancel_at_period_end INTEGER").run(); } catch {}
  }
  return db;
}

function getEntitlements(anonId) {
  const defaults = {
    allow_audit: true,
    allow_rank: true,
    allow_improve: true,
    plan_id: "guest",
    status: "inactive",
    billing_period: null,
    current_period_end: null,
    subscription_id: null,
    trial_ends_at: null,
    cancel_at_period_end: false,
    updated_at: null
  };
  if (!anonId) return defaults;
  const row = getDb()
    .prepare(`SELECT
      allow_audit,
      allow_rank,
      allow_improve,
      plan_id,
      status,
      billing_period,
      current_period_end,
      subscription_id,
      trial_ends_at,
      cancel_at_period_end,
      updated_at
      FROM entitlements WHERE anon_id = ?`)
    .get(String(anonId).trim());
  if (!row) return defaults;
  return {
    allow_audit: row.allow_audit !== 0,
    allow_rank: row.allow_rank !== 0,
    allow_improve: row.allow_improve !== 0,
    plan_id: row.plan_id || defaults.plan_id,
    status: row.status || defaults.status,
    billing_period: row.billing_period || null,
    current_period_end: row.current_period_end || null,
    subscription_id: row.subscription_id || null,
    trial_ends_at: row.trial_ends_at || null,
    cancel_at_period_end: row.cancel_at_period_end === 1,
    updated_at: row.updated_at || null
  };
}

function setEntitlements(anonId, entitlements = {}) {
  if (!anonId) return { ok: false };
  const prev = getEntitlements(anonId);
  const next = {
    allow_audit: entitlements.allow_audit ?? prev.allow_audit,
    allow_rank: entitlements.allow_rank ?? prev.allow_rank,
    allow_improve: entitlements.allow_improve ?? prev.allow_improve,
    plan_id: entitlements.plan_id ?? prev.plan_id,
    status: entitlements.status ?? prev.status,
    billing_period: entitlements.billing_period ?? prev.billing_period,
    current_period_end: entitlements.current_period_end ?? prev.current_period_end,
    subscription_id: entitlements.subscription_id ?? prev.subscription_id,
    trial_ends_at: entitlements.trial_ends_at ?? prev.trial_ends_at,
    cancel_at_period_end: entitlements.cancel_at_period_end ?? prev.cancel_at_period_end
  };
  getDb()
    .prepare(
      `INSERT INTO entitlements (
        anon_id,
        allow_audit,
        allow_rank,
        allow_improve,
        plan_id,
        status,
        billing_period,
        current_period_end,
        subscription_id,
        trial_ends_at,
        cancel_at_period_end,
        updated_at
      )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(anon_id) DO UPDATE SET
         allow_audit = excluded.allow_audit,
         allow_rank = excluded.allow_rank,
         allow_improve = excluded.allow_improve,
         plan_id = excluded.plan_id,
         status = excluded.status,
         billing_period = excluded.billing_period,
         current_period_end = excluded.current_period_end,
         subscription_id = excluded.subscription_id,
         trial_ends_at = excluded.trial_ends_at,
         cancel_at_period_end = excluded.cancel_at_period_end,
         updated_at = excluded.updated_at`
    )
    .run(
      String(anonId).trim(),
      next.allow_audit ? 1 : 0,
      next.allow_rank ? 1 : 0,
      next.allow_improve ? 1 : 0,
      next.plan_id,
      next.status,
      next.billing_period,
      next.current_period_end,
      next.subscription_id,
      next.trial_ends_at,
      next.cancel_at_period_end ? 1 : 0,
      new Date().toISOString()
    );
  return { ok: true, entitlements: next };
}

module.exports = { getEntitlements, setEntitlements };

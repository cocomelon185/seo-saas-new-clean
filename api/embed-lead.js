import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const { sendLeadNotification } = require("../lib/emailService.js");

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
      webhook TEXT,
      notify_email TEXT,
      status TEXT,
      tags TEXT,
      notes TEXT,
      created_at TEXT
    )
  `).run();
  db.prepare(`
    CREATE TABLE IF NOT EXISTS webhook_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      owner_id TEXT,
      webhook TEXT,
      payload TEXT,
      attempts INTEGER,
      next_attempt_at TEXT,
      last_error TEXT,
      status TEXT,
      created_at TEXT,
      updated_at TEXT
    )
  `).run();
  try { db.prepare("ALTER TABLE embed_leads ADD COLUMN tags TEXT").run(); } catch {}
  try { db.prepare("ALTER TABLE embed_leads ADD COLUMN notes TEXT").run(); } catch {}
  try { db.prepare("ALTER TABLE embed_leads ADD COLUMN notify_email TEXT").run(); } catch {}
  try { db.prepare("ALTER TABLE embed_leads ADD COLUMN status TEXT").run(); } catch {}
  _db = db;
  return db;
}

function isValidUrl(value) {
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
}

function enqueueWebhook({ owner_id, webhook, payload, error }) {
  const db = getDb();
  const now = new Date();
  const nextAttempt = new Date(now.getTime() + 5 * 60 * 1000);
  db.prepare(`
    INSERT INTO webhook_queue (owner_id, webhook, payload, attempts, next_attempt_at, last_error, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    owner_id,
    webhook,
    JSON.stringify(payload),
    1,
    nextAttempt.toISOString(),
    String(error || "Initial delivery failed").slice(0, 500),
    "retrying",
    now.toISOString(),
    now.toISOString()
  );
}

export async function processWebhookQueue() {
  const db = getDb();
  const now = new Date().toISOString();
  const rows = db.prepare(
    "SELECT id, owner_id, webhook, payload, attempts FROM webhook_queue WHERE status = 'retrying' AND next_attempt_at <= ? ORDER BY id ASC LIMIT 10"
  ).all(now);

  for (const row of rows) {
    const attempts = Number(row.attempts || 0);
    try {
      const payload = JSON.parse(row.payload || "{}");
      const resp = await fetch(row.webhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (resp.ok) {
        db.prepare(
          "UPDATE webhook_queue SET status = 'sent', updated_at = ? WHERE id = ?"
        ).run(new Date().toISOString(), row.id);
        continue;
      }
      throw new Error(`HTTP ${resp.status}`);
    } catch (e) {
      const nextAttemptMs = Math.min(24 * 60 * 60 * 1000, Math.pow(2, attempts) * 60 * 1000);
      const next = new Date(Date.now() + nextAttemptMs);
      db.prepare(
        "UPDATE webhook_queue SET attempts = ?, next_attempt_at = ?, last_error = ?, updated_at = ?, status = ? WHERE id = ?"
      ).run(
        attempts + 1,
        next.toISOString(),
        String(e?.message || e).slice(0, 500),
        new Date().toISOString(),
        attempts + 1 >= 6 ? "failed" : "retrying",
        row.id
      );
    }
  }
}

export default async function embedLead(req, res) {
  const owner_id = String(req.body?.owner_id || "").trim();
  const url = String(req.body?.url || "").trim();
  const email = String(req.body?.email || "").trim();
  const name = String(req.body?.name || "").trim();
  const webhook = String(req.body?.webhook || "").trim();
  const notify_email = String(req.body?.notify_email || "").trim();

  if (!owner_id) {
    return res.status(400).json({ ok: false, error: "Missing owner_id" });
  }
  if (!isValidUrl(url)) {
    return res.status(400).json({ ok: false, error: "Invalid URL" });
  }
  if (!isValidEmail(email)) {
    return res.status(400).json({ ok: false, error: "Invalid email" });
  }
  if (notify_email && !isValidEmail(notify_email)) {
    return res.status(400).json({ ok: false, error: "Invalid notify email" });
  }

  const db = getDb();
  const created_at = new Date().toISOString();
  const status = "new";
  db.prepare(`
    INSERT INTO embed_leads (owner_id, url, email, name, webhook, notify_email, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(owner_id, url, email, name || null, webhook || null, notify_email || null, status, created_at);

  if (webhook) {
    const payload = {
      owner_id,
      url,
      email,
      name,
      created_at,
      source: "rankypulse-embed"
    };
    try {
      const resp = await fetch(webhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!resp.ok) {
        enqueueWebhook({ owner_id, webhook, payload, error: `HTTP ${resp.status}` });
      }
    } catch (e) {
      enqueueWebhook({ owner_id, webhook, payload, error: e });
    }
  }

  if (notify_email) {
    try {
      await sendLeadNotification(notify_email, {
        brand: "RankyPulse",
        name,
        email,
        url,
        created_at,
        leads_url: `${req.protocol}://${req.get("host")}/leads`
      });
    } catch (e) {
      console.error("Lead notification email failed:", e);
    }
  }

  return res.json({ ok: true });
}

export async function listEmbedLeads(req, res) {
  const owner_id = String(req.headers["x-rp-anon-id"] || "").trim();
  if (!owner_id) {
    return res.status(400).json({ ok: false, error: "Missing owner_id" });
  }
  const db = getDb();
  const rows = db.prepare(
    "SELECT id, url, email, name, status, tags, created_at FROM embed_leads WHERE owner_id = ? ORDER BY id DESC LIMIT 200"
  ).all(owner_id);
  return res.json({ ok: true, leads: rows || [] });
}

export async function getEmbedLead(req, res) {
  const owner_id = String(req.headers["x-rp-anon-id"] || "").trim();
  const id = Number(req.params?.id || 0);
  if (!owner_id) {
    return res.status(400).json({ ok: false, error: "Missing owner_id" });
  }
  if (!id) {
    return res.status(400).json({ ok: false, error: "Missing lead id" });
  }
  const db = getDb();
  const row = db.prepare(
    "SELECT id, url, email, name, webhook, notify_email, status, tags, notes, created_at FROM embed_leads WHERE owner_id = ? AND id = ? LIMIT 1"
  ).get(owner_id, id);
  return res.json({ ok: true, lead: row || null });
}

export async function updateEmbedLead(req, res) {
  const owner_id = String(req.headers["x-rp-anon-id"] || "").trim();
  const id = Number(req.params?.id || 0);
  const tags = Array.isArray(req.body?.tags) ? req.body.tags.map(String) : [];
  const notes = String(req.body?.notes || "").trim();
  const status = String(req.body?.status || "").trim();
  if (!owner_id) {
    return res.status(400).json({ ok: false, error: "Missing owner_id" });
  }
  if (!id) {
    return res.status(400).json({ ok: false, error: "Missing lead id" });
  }
  const validStatuses = new Set(["new", "contacted", "won"]);
  const nextStatus = validStatuses.has(status) ? status : null;
  const db = getDb();
  db.prepare(
    "UPDATE embed_leads SET tags = ?, notes = ?, status = COALESCE(?, status) WHERE owner_id = ? AND id = ?"
  ).run(JSON.stringify(tags.slice(0, 20)), notes, nextStatus, owner_id, id);
  return res.json({ ok: true });
}

export async function testEmbedWebhook(req, res) {
  const owner_id = String(req.body?.owner_id || "").trim();
  const webhook = String(req.body?.webhook || "").trim();
  if (!owner_id) {
    return res.status(400).json({ ok: false, error: "Missing owner_id" });
  }
  if (!isValidUrl(webhook)) {
    return res.status(400).json({ ok: false, error: "Invalid webhook URL" });
  }
  const payload = {
    owner_id,
    url: "https://example.com",
    email: "lead@example.com",
    name: "Sample Lead",
    created_at: new Date().toISOString(),
    source: "rankypulse-embed-test"
  };
  try {
    const resp = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const text = await resp.text().catch(() => "");
    return res.json({ ok: resp.ok, status: resp.status, body: text.slice(0, 500) });
  } catch (e) {
    return res.status(200).json({ ok: false, error: String(e?.message || e) });
  }
}

export async function listWebhookHistory(req, res) {
  const owner_id = String(req.headers["x-rp-anon-id"] || "").trim();
  if (!owner_id) {
    return res.status(400).json({ ok: false, error: "Missing owner_id" });
  }
  const db = getDb();
  const rows = db.prepare(
    "SELECT id, webhook, attempts, next_attempt_at, last_error, status, created_at, updated_at FROM webhook_queue WHERE owner_id = ? ORDER BY id DESC LIMIT 200"
  ).all(owner_id);
  return res.json({ ok: true, history: rows || [] });
}

export async function getWebhookMetrics(req, res) {
  const owner_id = String(req.headers["x-rp-anon-id"] || "").trim();
  if (!owner_id) {
    return res.status(400).json({ ok: false, error: "Missing owner_id" });
  }
  const db = getDb();
  const totals = db.prepare(
    "SELECT status, COUNT(*) as count FROM webhook_queue WHERE owner_id = ? GROUP BY status"
  ).all(owner_id);
  const summary = totals.reduce((acc, row) => {
    acc[row.status] = Number(row.count || 0);
    return acc;
  }, {});
  const sent = summary.sent || 0;
  const failed = summary.failed || 0;
  const total = sent + failed;
  const successRate = total ? Math.round((sent / total) * 100) : 0;
  return res.json({
    ok: true,
    metrics: {
      sent,
      failed,
      total,
      successRate
    }
  });
}

export async function retryWebhookNow(req, res) {
  const owner_id = String(req.headers["x-rp-anon-id"] || "").trim();
  const id = Number(req.params?.id || 0);
  if (!owner_id) {
    return res.status(400).json({ ok: false, error: "Missing owner_id" });
  }
  if (!id) {
    return res.status(400).json({ ok: false, error: "Missing id" });
  }
  const db = getDb();
  db.prepare(
    "UPDATE webhook_queue SET status = 'retrying', next_attempt_at = ?, updated_at = ? WHERE owner_id = ? AND id = ?"
  ).run(new Date().toISOString(), new Date().toISOString(), owner_id, id);
  return res.json({ ok: true });
}

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
    CREATE TABLE IF NOT EXISTS oauth_states (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      provider TEXT,
      owner_id TEXT,
      site TEXT,
      shop TEXT,
      state TEXT,
      created_at TEXT
    )
  `).run();
  db.prepare(`
    CREATE TABLE IF NOT EXISTS wp_connections (
      owner_id TEXT PRIMARY KEY,
      site_url TEXT,
      access_token TEXT,
      refresh_token TEXT,
      token_type TEXT,
      expires_at TEXT,
      created_at TEXT,
      updated_at TEXT
    )
  `).run();
  _db = db;
  return db;
}

function normalizeSite(site) {
  try {
    const u = new URL(String(site || "").trim());
    return u.origin;
  } catch {
    return "";
  }
}

export async function wpAuthStart(req, res) {
  const owner = String(req.query?.owner || "").trim();
  const site = normalizeSite(req.query?.site);
  if (!owner || !site) return res.status(400).send("Missing owner or site");
  const state = Math.random().toString(36).slice(2);
  const db = getDb();
  db.prepare("INSERT INTO oauth_states (provider, owner_id, site, state, created_at) VALUES (?, ?, ?, ?, ?)")
    .run("wp", owner, site, state, new Date().toISOString());

  const clientId = process.env.WP_OAUTH_CLIENT_ID;
  const redirectUri = `${req.protocol}://${req.get("host")}/api/wp/auth/callback`;
  const authorizeUrl = `${site}/oauth/authorize?response_type=code&client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${encodeURIComponent(state)}`;
  return res.redirect(authorizeUrl);
}

export async function wpAuthCallback(req, res) {
  const code = String(req.query?.code || "").trim();
  const state = String(req.query?.state || "").trim();
  const db = getDb();
  const row = db.prepare("SELECT owner_id, site FROM oauth_states WHERE provider = ? AND state = ? ORDER BY id DESC LIMIT 1")
    .get("wp", state);
  if (!row || !code) return res.status(400).send("Invalid OAuth state");

  const clientId = process.env.WP_OAUTH_CLIENT_ID;
  const clientSecret = process.env.WP_OAUTH_CLIENT_SECRET;
  const redirectUri = `${req.protocol}://${req.get("host")}/api/wp/auth/callback`;
  const tokenRes = await fetch(`${row.site}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri
    })
  });
  const token = await tokenRes.json().catch(() => null);
  if (!tokenRes.ok) return res.status(500).send("Token exchange failed");
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO wp_connections (owner_id, site_url, access_token, refresh_token, token_type, expires_at, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(owner_id) DO UPDATE SET
      site_url=excluded.site_url,
      access_token=excluded.access_token,
      refresh_token=excluded.refresh_token,
      token_type=excluded.token_type,
      expires_at=excluded.expires_at,
      updated_at=excluded.updated_at
  `).run(
    row.owner_id,
    row.site,
    token.access_token,
    token.refresh_token || null,
    token.token_type || "Bearer",
    token.expires_in ? new Date(Date.now() + token.expires_in * 1000).toISOString() : null,
    now,
    now
  );
  return res.redirect("/audit?wp=connected");
}

export async function wpStatus(req, res) {
  const owner = String(req.headers["x-rp-anon-id"] || "").trim();
  if (!owner) return res.json({ connected: false });
  const db = getDb();
  const row = db.prepare("SELECT site_url FROM wp_connections WHERE owner_id = ?").get(owner);
  return res.json({ connected: Boolean(row), site_url: row?.site_url || null });
}

export async function wpDisconnect(req, res) {
  const owner = String(req.headers["x-rp-anon-id"] || "").trim();
  if (!owner) return res.status(400).json({ ok: false });
  const db = getDb();
  db.prepare("DELETE FROM wp_connections WHERE owner_id = ?").run(owner);
  return res.json({ ok: true });
}

async function wpFetch(owner) {
  const db = getDb();
  const row = db.prepare("SELECT * FROM wp_connections WHERE owner_id = ?").get(owner);
  if (!row) return null;
  if (row.expires_at && new Date(row.expires_at).getTime() < Date.now()) {
    const refreshed = await refreshToken(row);
    return refreshed || row;
  }
  return row;
}

async function refreshToken(conn) {
  if (!conn?.refresh_token) return null;
  try {
    const tokenRes = await fetch(`${conn.site_url}/oauth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: conn.refresh_token,
        client_id: process.env.WP_OAUTH_CLIENT_ID,
        client_secret: process.env.WP_OAUTH_CLIENT_SECRET
      })
    });
    const token = await tokenRes.json().catch(() => null);
    if (!tokenRes.ok) return null;
    const db = getDb();
    const now = new Date().toISOString();
    db.prepare(`
      UPDATE wp_connections
      SET access_token = ?, refresh_token = ?, token_type = ?, expires_at = ?, updated_at = ?
      WHERE owner_id = ?
    `).run(
      token.access_token,
      token.refresh_token || conn.refresh_token,
      token.token_type || "Bearer",
      token.expires_in ? new Date(Date.now() + token.expires_in * 1000).toISOString() : conn.expires_at,
      now,
      conn.owner_id
    );
    return db.prepare("SELECT * FROM wp_connections WHERE owner_id = ?").get(conn.owner_id);
  } catch {
    return null;
  }
}

export async function wpPushFix(req, res) {
  const owner = String(req.headers["x-rp-anon-id"] || "").trim();
  const url = String(req.body?.url || "").trim();
  const issue = String(req.body?.issue_id || "").trim();
  const fix = String(req.body?.fix || "").trim();
  if (!owner || !url || !fix) return res.status(400).json({ ok: false, error: "Missing owner, url, or fix" });
  const conn = await wpFetch(owner);
  if (!conn) return res.status(404).json({ ok: false, error: "Not connected" });

  const site = conn.site_url;
  const slug = new URL(url).pathname.split("/").filter(Boolean).pop() || "";
  const searchRes = await fetch(`${site}/wp-json/wp/v2/search?search=${encodeURIComponent(slug)}&per_page=1`);
  const search = await searchRes.json().catch(() => []);
  const hit = Array.isArray(search) && search[0] ? search[0] : null;
  if (!hit) return res.status(404).json({ ok: false, error: "Page not found" });
  const type = hit.subtype || "posts";
  const endpoint = `${site}/wp-json/wp/v2/${type}s/${hit.id}`;
  const currentRes = await fetch(endpoint, { headers: { Authorization: `Bearer ${conn.access_token}` } });
  const current = await currentRes.json().catch(() => null);
  const payload = {};

  if (issue === "missing_meta_description") {
    payload.excerpt = fix;
  } else if (issue === "missing_title" || issue === "title_too_long") {
    payload.title = fix;
  } else if (issue === "missing_h1") {
    const content = String(current?.content?.raw || current?.content?.rendered || "");
    if (!content.toLowerCase().includes("<h1")) {
      payload.content = `<h1>${fix}</h1>\n` + content;
    }
  }

  if (Object.keys(payload).length === 0) {
    return res.json({ ok: true, skipped: true });
  }

  const updateRes = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${conn.access_token}`
    },
    body: JSON.stringify(payload)
  });
  const update = await updateRes.json().catch(() => null);
  if (!updateRes.ok) return res.status(500).json({ ok: false, error: "Update failed", details: update });
  return res.json({ ok: true });
}

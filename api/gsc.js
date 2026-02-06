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
    CREATE TABLE IF NOT EXISTS gsc_tokens (
      owner_id TEXT PRIMARY KEY,
      access_token TEXT,
      refresh_token TEXT,
      expires_at INTEGER,
      created_at TEXT,
      updated_at TEXT
    )
  `).run();
  _db = db;
  return db;
}

function getOwnerId(req) {
  const headerId = String(req.headers["x-rp-anon-id"] || "").trim();
  if (headerId) return headerId;
  const state = String(req.query?.state || "").trim();
  if (state) return state;
  return "global";
}

function getStoredToken(ownerId) {
  const db = getDb();
  return db.prepare("SELECT * FROM gsc_tokens WHERE owner_id = ?").get(ownerId) || null;
}

function saveToken(ownerId, { access_token, refresh_token, expires_at }) {
  const db = getDb();
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO gsc_tokens (owner_id, access_token, refresh_token, expires_at, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(owner_id) DO UPDATE SET
      access_token = excluded.access_token,
      refresh_token = COALESCE(excluded.refresh_token, gsc_tokens.refresh_token),
      expires_at = excluded.expires_at,
      updated_at = excluded.updated_at
  `).run(ownerId, access_token || "", refresh_token || null, expires_at || null, now, now);
}

async function refreshAccessToken(ownerId, refreshToken) {
  const clientId = process.env.GSC_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GSC_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret || !refreshToken) return null;

  const body = new URLSearchParams();
  body.set("client_id", clientId);
  body.set("client_secret", clientSecret);
  body.set("refresh_token", refreshToken);
  body.set("grant_type", "refresh_token");

  const resp = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body
  });
  if (!resp.ok) return null;
  const data = await resp.json().catch(() => null);
  if (!data?.access_token) return null;
  const expiresAt = data.expires_in ? Date.now() + data.expires_in * 1000 : null;
  saveToken(ownerId, { access_token: data.access_token, refresh_token: refreshToken, expires_at: expiresAt });
  return data.access_token;
}

async function getAccessToken(ownerId) {
  const stored = getStoredToken(ownerId);
  if (!stored) return null;
  const expiresAt = stored.expires_at ? Number(stored.expires_at) : null;
  if (expiresAt && Date.now() < expiresAt - 60_000) {
    return stored.access_token;
  }
  if (stored.refresh_token) {
    return refreshAccessToken(ownerId, stored.refresh_token);
  }
  return stored.access_token || null;
}

export async function gscAuthStart(req, res) {
  const ownerId = getOwnerId(req);
  const clientId = process.env.GSC_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
  const redirectUri = process.env.GSC_REDIRECT_URI || process.env.GOOGLE_REDIRECT_URI;
  if (!clientId || !redirectUri) {
    return res.status(400).json({ ok: false, error: { code: "MISSING_GSC_OAUTH", message: "Missing GSC_CLIENT_ID or GSC_REDIRECT_URI." } });
  }

  const scope = "https://www.googleapis.com/auth/webmasters.readonly";
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope,
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: "true",
    state: ownerId
  });

  const url = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  return res.redirect(url);
}

export async function gscAuthCallback(req, res) {
  const code = String(req.query?.code || "");
  const ownerId = getOwnerId(req);
  const clientId = process.env.GSC_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GSC_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GSC_REDIRECT_URI || process.env.GOOGLE_REDIRECT_URI;
  const successRedirect = process.env.GSC_SUCCESS_REDIRECT || "/account/settings";

  if (!code || !clientId || !clientSecret || !redirectUri) {
    return res.redirect(`${successRedirect}?gsc=error`);
  }

  const body = new URLSearchParams();
  body.set("code", code);
  body.set("client_id", clientId);
  body.set("client_secret", clientSecret);
  body.set("redirect_uri", redirectUri);
  body.set("grant_type", "authorization_code");

  try {
    const resp = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body
    });
    const data = await resp.json().catch(() => null);
    if (!resp.ok || !data?.access_token) {
      return res.redirect(`${successRedirect}?gsc=error`);
    }
    const expiresAt = data.expires_in ? Date.now() + data.expires_in * 1000 : null;
    saveToken(ownerId, { access_token: data.access_token, refresh_token: data.refresh_token, expires_at: expiresAt });
    return res.redirect(`${successRedirect}?gsc=connected`);
  } catch {
    return res.redirect(`${successRedirect}?gsc=error`);
  }
}

export async function gscStatus(req, res) {
  const ownerId = getOwnerId(req);
  const tok = getStoredToken(ownerId);
  return res.json({
    ok: true,
    connected: !!tok?.access_token,
    expires_at: tok?.expires_at || null
  });
}

export async function gscDisconnect(req, res) {
  const ownerId = getOwnerId(req);
  const db = getDb();
  db.prepare("DELETE FROM gsc_tokens WHERE owner_id = ?").run(ownerId);
  return res.json({ ok: true, disconnected: true });
}

export async function gscSummary(req, res) {
  const rawUrl = (req.body && (req.body.url || req.body.siteUrl)) ? String(req.body.url || req.body.siteUrl) : "";
  const ownerId = getOwnerId(req);
  const token = await getAccessToken(ownerId);

  if (!token) {
    return res.status(200).json({
      ok: false,
      error: { code: "MISSING_GSC_TOKEN", message: "No Search Console access token configured." }
    });
  }

  let siteUrl = "";
  try {
    const u = new URL(rawUrl);
    siteUrl = `${u.origin}/`;
  } catch {
    siteUrl = rawUrl.endsWith("/") ? rawUrl : `${rawUrl}/`;
  }

  const end = new Date();
  end.setDate(end.getDate() - 2);
  const start = new Date(end.getTime());
  start.setDate(start.getDate() - 28);

  const fmt = (d) => d.toISOString().slice(0, 10);

  try {
    const apiUrl = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`;
    const body = {
      startDate: fmt(start),
      endDate: fmt(end),
      rowLimit: 1
    };

    const resp = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(body)
    });

    if (!resp.ok) {
      const text = await resp.text().catch(() => "");
      return res.status(200).json({
        ok: false,
        siteUrl,
        error: { code: "GSC_REQUEST_FAILED", message: text || `HTTP ${resp.status}` }
      });
    }

    const data = await resp.json().catch(() => null);
    const row = Array.isArray(data?.rows) ? data.rows[0] : null;
    const metrics = row
      ? {
          clicks: row.clicks ?? 0,
          impressions: row.impressions ?? 0,
          ctr: row.ctr ?? 0,
          position: row.position ?? 0
        }
      : null;

    return res.json({ ok: true, siteUrl, metrics, range: { startDate: fmt(start), endDate: fmt(end) } });
  } catch (e) {
    return res.status(200).json({
      ok: false,
      siteUrl,
      error: { code: "GSC_ERROR", message: String(e?.message || e) }
    });
  }
}

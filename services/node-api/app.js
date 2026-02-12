import express from "express"
import cors from "cors";
import pageReport from "./api/page-report.js";

const __DEMO_AUDIT_URL = "https://httpstat.us";

function __seedDemoAudit(auditCache, __mockAudit) {
  try {
    const demoData = __mockAudit(__DEMO_AUDIT_URL);
    auditCache.set(__DEMO_AUDIT_URL, demoData);
    console.log("Seeded demo audit:", __DEMO_AUDIT_URL);
  } catch (e) {
    console.log("Demo seed failed:", String(e?.message || e));
  }
}

;
import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import path from "path";
import fs from "fs";
const SPA_DIST_CANDIDATES = [
  path.join(process.cwd(), "apps", "web", "dist"),
  path.join(process.cwd(), "services", "node-api", "frontend", "dist"),
  path.join(process.cwd(), "services", "node-api", "dist"),
  path.join(process.cwd(), "frontend", "dist")
];
const SPA_DIST = SPA_DIST_CANDIDATES.find((dir) => fs.existsSync(path.join(dir, "index.html")));
const HAS_SPA_DIST = Boolean(SPA_DIST);
import { fileURLToPath } from "url";
import { Worker } from "worker_threads";

import { normalizeUrl, TTLCache, RateLimiter, jsonError } from "./api_hardening.js";

const app = express();
app.use(
  cors({
    origin: [
      "https://www.rankypulse.com",
      "https://rankypulse.com",
      "http://localhost:5173",
      "http://127.0.0.1:5173"
    ],
    credentials: true
  })
);



function __mockAudit(url) {
  const now = new Date().toISOString();

  const pages = [
    { url, status: 200, title: "Home", description: "Homepage description", depth: 0 },
    { url: url.replace(/\/$/, "") + "/about", status: 200, title: "About", description: "About page description", depth: 1 },
    { url: url.replace(/\/$/, "") + "/blog", status: 200, title: "Blog", description: "Blog page description", depth: 1 },
    { url: url.replace(/\/$/, "") + "/pricing", status: 200, title: "Pricing", description: "Pricing page description", depth: 1 },
    { url: url.replace(/\/$/, "") + "/broken-link", status: 404, title: "", description: "", depth: 2 }
  ];

  const issues = [
    { type: "Title tag missing", severity: "high", url, message: "Some pages are missing <title>.", fix: "Add unique 50–60 char title tags." },
    { type: "Meta description missing", severity: "medium", url, message: "Some pages have no meta description.", fix: "Add 120–160 char meta descriptions." },
    { type: "H1 missing/duplicate", severity: "medium", url, message: "H1 tags are missing or duplicated.", fix: "Use exactly one descriptive H1 per page." },
    { type: "Broken internal links", severity: "high", url, message: "Internal links return 4xx.", fix: "Fix or remove broken links; update redirects." },
    { type: "Slow LCP", severity: "medium", url, message: "LCP is above target on some templates.", fix: "Optimize images, fonts, and server response time." },
    { type: "Images missing alt", severity: "low", url, message: "Some images are missing alt text.", fix: "Add descriptive alt attributes." },
    { type: "Duplicate content signals", severity: "low", url, message: "Similar pages detected.", fix: "Add canonicals and consolidate duplicates." },
    { type: "HTTPS mixed content", severity: "high", url, message: "Some resources load over HTTP.", fix: "Serve all assets over HTTPS." }
  ];

  const https = {
    httpsEnabled: true,
    redirectsToHttps: true,
    hsts: false,
    mixedContentCount: 3
  };

  const cwv = {
    field: { lcp: 3.2, inp: 210, cls: 0.12 },
    lab: { lcp: 2.6, inp: 180, cls: 0.08 }
  };

  return {
    summary: { pagesCrawled: pages.length, issuesFound: issues.length, score: 78, lastScan: now },
    issues,
    pages,
    https,
    cwv
  };
}





app.use(express.json());

app.post("/api/page-report", pageReport);

app.post("/api/rank-check", (req, res) => {
  const { keyword, domain } = req.body || {};

  if (!keyword || !domain) {
    return res.status(400).json({ error: "Missing keyword or domain" });
  }

  return res.json({
    keyword,
    domain,
    position: Math.floor(Math.random() * 50) + 1,
    checked_at: new Date().toISOString()
  });
});



const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const db = new Database(path.join(__dirname, "database.db"));

db.pragma("journal_mode = WAL");

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  hashed_password TEXT NOT NULL,
  plan TEXT NOT NULL DEFAULT "free",
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS audits (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  url TEXT NOT NULL,
  normalized_url TEXT NOT NULL,
  seo_score INTEGER NOT NULL DEFAULT 0,
  pages_crawled INTEGER NOT NULL DEFAULT 1,
  issues_found INTEGER NOT NULL DEFAULT 0,
  result_json TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_audits_user_created ON audits(user_id, created_at);
`);

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_change_me";

function signToken(user) {
  return jwt.sign({ uid: user.id, email: user.email, plan: user.plan }, JWT_SECRET, { expiresIn: "30d" });
}

function requireAuth(req, res, next) {
  const h = req.headers.authorization || "";
  const m = h.match(/^Bearer\s+(.+)$/i);
  if (!m) return jsonError(res, 401, "UNAUTHORIZED", "Missing Bearer token.");
  try {
    req.user = jwt.verify(m[1], JWT_SECRET);
    return next();
  } catch (e) {
    return jsonError(res, 401, "UNAUTHORIZED", "Invalid/expired token.");
  }
}

function getPlanFromRequest(req) {
  const h = req.headers.authorization || "";
  const m = h.match(/^Bearer\s+(.+)$/i);
  if (!m) return "free";

  try {
    const tok = jwt.verify(m[1], JWT_SECRET);
    return String(tok?.plan || "free").toLowerCase();
  } catch {
    return "free";
  }
}

function getUserByEmail(email) {
  return db.prepare('SELECT id, email, hashed_password, "plan", created_at FROM users WHERE email = ?').get(email);
}

function getUserById(id) {
  return db.prepare('SELECT id, email, hashed_password, "plan", created_at FROM users WHERE id = ?').get(id);
}


// ===== Config =====
const FRONTEND_DIST = SPA_DIST;

// Demo rate limit (per IP)
const demoLimiter = new RateLimiter({ windowMs: 10 * 60 * 1000, max: 3 }); // 3 audits / 10 min
// Cache (per normalized URL)
const auditCache = new TTLCache({ ttlMs: 10 * 60 * 1000, maxEntries: 300 }); // 10 min

// Job store (in-memory for now; swap to Redis later)
const jobs = new Map(); // jobId -> { status, data?, error?, createdAt }
const JOB_TTL_MS = 30 * 60 * 1000;

function makeId() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

function getClientIp(req) {
  const xf = req.headers["x-forwarded-for"];
  if (typeof xf === "string" && xf.length) return xf.split(",")[0].trim();
  return req.socket?.remoteAddress || "unknown";
}

setInterval(() => {
  const now = Date.now();
  for (const [id, j] of jobs.entries()) {
    if (now - (j.createdAt || now) > JOB_TTL_MS) jobs.delete(id);
  }
}, 60 * 1000).unref();

const demo = __mockAudit(__DEMO_AUDIT_URL);

// ===== API =====
app.get("/api/health", (req, res) => res.json({ ok: true }));

app.post("/api/audit/run", (req, res) => {
  const urlRaw = req.body?.url;
  const v = normalizeUrl(urlRaw);
  if (!v.ok) return jsonError(res, 400, v.code, v.message);

  const targetUrl = v.normalized;

  const plan = getPlanFromRequest(req);

  if (plan === "free") {
    const jobId = makeId();

    const demoShaped = {
      ...demo,
      summary: { ...demo.summary, lastScan: new Date().toISOString() },
      pages: (demo.pages || []).map((pg) => ({
        ...pg,
      })),
      issues: (demo.issues || []).map((it) => ({
        ...it,
      }))
    };

    jobs.set(jobId, { status: "done", data: demoShaped, createdAt: Date.now() });
    return res.json({ ok: true, jobId, cached: true, demo: true, plan });
  }


  const worker = new Worker(new URL("./audit_worker.js", import.meta.url), { type: "module" });

  let done = false;

  const killTimer = setTimeout(() => {
    if (done) return;
    done = true;
    try { worker.terminate(); } catch {}
    return jsonError(res, 504, "TIMEOUT", "Audit timed out.");
  }, 15000);

  worker.on("message", (msg) => {
    if (done) return;
  });

  worker.on("error", (err) => {
    if (done) return;
    done = true;
    clearTimeout(killTimer);
    try { worker.terminate(); } catch {}
    return jsonError(res, 500, "WORKER_CRASH", "Worker crashed.", { detail: String(err?.message || err) });
  });

  worker.on("message", (msg) => {
    if (done) return;
    done = true;
    clearTimeout(killTimer);
    try { worker.terminate(); } catch {}

    if (msg?.ok) return res.json(msg.data);
    return jsonError(res, 500, msg?.error?.code || "FAILED", msg?.error?.message || "Audit failed.");
  });

  worker.postMessage({ jobId: "run", url: targetUrl });
});

app.post("/api/reset-demo", (req, res) => {
  // Keep for future DB-based demo resets; currently frontend-only reset is enough.
  res.json({ ok: true });
});

// Create audit job
app.post("/api/audit", (req, res) => {
  const ip = getClientIp(req);

  const urlRaw = req.body?.url;
  const v = normalizeUrl(urlRaw);
  if (!v.ok) return jsonError(res, 400, v.code, v.message);

  const targetUrl = v.normalized;

  const rl = demoLimiter.hit(ip);
  if (!rl.allowed) {
    res.setHeader("Retry-After", Math.ceil((rl.resetAt - Date.now()) / 1000));
    return jsonError(res, 429, "RATE_LIMITED", "Demo rate limit reached. Try again later.", { resetAt: rl.resetAt });
  }

  const cached = auditCache.get(targetUrl);
  const jobId = makeId();

  if (cached) {
    jobs.set(jobId, { status: "done", data: cached, createdAt: Date.now() });
    return res.json({ ok: true, jobId, cached: true });
  }

  jobs.set(jobId, { status: "running", createdAt: Date.now() });
  res.json({ ok: true, jobId, cached: false });

  const worker = new Worker(new URL("./audit_worker.js", import.meta.url), { type: "module" });

  const killTimer = setTimeout(() => {
    try { worker.terminate(); } catch {}
    jobs.set(jobId, { status: "error", error: { code: "TIMEOUT", message: "Audit timed out." }, createdAt: Date.now() });
  }, 15000);

  worker.on("message", (msg) => {
    clearTimeout(killTimer);
    try { worker.terminate(); } catch {}

    if (msg?.ok) {
      auditCache.set(targetUrl, msg.data);
      jobs.set(jobId, { status: "done", data: msg.data, createdAt: Date.now() });
    } else {
      jobs.set(jobId, { status: "error", error: msg.error || { code: "FAILED", message: "Audit failed" }, createdAt: Date.now() });
    }
  });

  worker.on("error", (err) => {
    clearTimeout(killTimer);
    try { worker.terminate(); } catch {}
    jobs.set(jobId, { status: "error", error: { code: "WORKER_CRASH", message: "Worker crashed.", detail: String(err?.message || err) }, createdAt: Date.now() });
  });

  worker.postMessage({ jobId, url: targetUrl });
});

// Poll job
app.get("/api/audit/:jobId", (req, res) => {
  const j = jobs.get(req.params.jobId);
  if (!j) return jsonError(res, 404, "JOB_NOT_FOUND", "Job not found.");

  if (j.status === "done") return res.json({ ok: true, status: "done", data: j.data });
  if (j.status === "error") return res.status(400).json({ ok: false, status: "error", error: j.error });
  return res.json({ ok: true, status: j.status });
});


// ===== Auth (F2) =====
app.post("/api/guest-signin", (req, res) => {
  const enabled = String(process.env.GUEST_LOGIN_ENABLED || "false").toLowerCase() === "true";
  if (!enabled) return jsonError(res, 404, "NOT_FOUND", "Guest login disabled.");

  const email = String(process.env.GUEST_EMAIL || "").trim().toLowerCase();
  const password = String(process.env.GUEST_PASSWORD || "");

  if (!email || !email.includes("@") || !password) {
    return jsonError(res, 500, "GUEST_NOT_CONFIGURED", "Guest login not configured.");
  }

  let user = getUserByEmail(email);
  const created_at = new Date().toISOString();
  const hashed_password = bcrypt.hashSync(password, 10);

  if (!user) {
    db.prepare('INSERT INTO users (email, hashed_password, "plan", created_at) VALUES (?, ?, ?, ?)').run(
      email,
      hashed_password,
      "free",
      created_at
    );
    user = getUserByEmail(email);
  } else if (!bcrypt.compareSync(password, user.hashed_password)) {
    db.prepare('UPDATE users SET hashed_password = ? WHERE email = ?').run(hashed_password, email);
    user = getUserByEmail(email);
  }

  const token = signToken(user);
  res.json({ ok: true, token, user: { id: user.id, email: user.email, plan: user.plan } });
});

app.post("/api/signin", (req, res) => {
  const email = String(req.body?.email || "").trim().toLowerCase();
  const password = String(req.body?.password || "");

  if (!email || !password) return jsonError(res, 400, "INVALID_LOGIN", "Email and password required.");

  const guestEmail = String(process.env.GUEST_EMAIL || "").trim().toLowerCase();
  const guestPassword = String(process.env.GUEST_PASSWORD || "");
  if (guestEmail && guestPassword && email === guestEmail && password === guestPassword) {
    let user = getUserByEmail(email);
    if (!user) {
      const hashed_password = bcrypt.hashSync(password, 10);
      const created_at = new Date().toISOString();
      const info = db.prepare('INSERT INTO users (email, hashed_password, "plan", created_at) VALUES (?, ?, ?, ?)').run(
        email, hashed_password, "free", created_at
      );
      user = getUserById(info.lastInsertRowid);
    } else if (!bcrypt.compareSync(password, user.hashed_password)) {
      const hashed_password = bcrypt.hashSync(password, 10);
      db.prepare('UPDATE users SET hashed_password = ? WHERE email = ?').run(hashed_password, email);
      user = getUserByEmail(email);
    }
    const token = signToken(user);
    return res.json({ ok: true, token, user: { id: user.id, email: user.email, plan: user.plan } });
  }

  const user = getUserByEmail(email);
  if (!user) return jsonError(res, 401, "INVALID_LOGIN", "Invalid email or password.");

  const ok = bcrypt.compareSync(password, user.hashed_password);
  if (!ok) return jsonError(res, 401, "INVALID_LOGIN", "Invalid email or password.");

  const token = signToken(user);
  res.json({ ok: true, token, user: { id: user.id, email: user.email, plan: user.plan } });
});

app.post("/api/signup", (req, res) => {
  const email = String(req.body?.email || "").trim().toLowerCase();
  const password = String(req.body?.password || "");
  const plan = String(req.body?.plan || "free").trim().toLowerCase();

  if (!email || !email.includes("@")) return jsonError(res, 400, "BAD_EMAIL", "Valid email required.");
  if (!password || password.length < 6) return jsonError(res, 400, "BAD_PASSWORD", "Password must be at least 6 characters.");

  const existing = getUserByEmail(email);
  if (existing) return jsonError(res, 409, "EMAIL_EXISTS", "Email already registered.");

  const hashed_password = bcrypt.hashSync(password, 10);
  const created_at = new Date().toISOString();
  const info = db.prepare('INSERT INTO users (email, hashed_password, "plan", created_at) VALUES (?, ?, ?, ?)').run(
    email, hashed_password, plan, created_at
  );
  const user = getUserById(info.lastInsertRowid);

  const token = signToken(user);
  res.json({ ok: true, token, user: { id: user.id, email: user.email, plan: user.plan } });
});

app.post("/api/auth/google", async (req, res) => {
  const clientId =
    process.env.GOOGLE_CLIENT_ID ||
    process.env.GSC_CLIENT_ID ||
    process.env.VITE_GOOGLE_CLIENT_ID ||
    "";
  if (!clientId) return jsonError(res, 500, "GOOGLE_NOT_CONFIGURED", "Google auth not configured.");

  const credential = String(req.body?.credential || "");
  if (!credential) return jsonError(res, 400, "MISSING_CREDENTIAL", "Missing credential.");

  try {
    const url = `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`;
    const resp = await fetch(url);
    if (!resp.ok) return jsonError(res, 401, "INVALID_GOOGLE_TOKEN", "Invalid Google token.");
    const data = await resp.json();
    if (!data?.email) return jsonError(res, 400, "MISSING_EMAIL", "Missing email.");
    if (data.aud && clientId && data.aud !== clientId) {
      return jsonError(res, 401, "INVALID_AUD", "Invalid Google audience.");
    }
    if (!(data.email_verified === true || data.email_verified === "true")) {
      return jsonError(res, 401, "EMAIL_NOT_VERIFIED", "Email not verified.");
    }

    const email = String(data.email).trim().toLowerCase();
    let user = getUserByEmail(email);
    if (!user) {
      const randomPassword = crypto.randomBytes(24).toString("hex");
      const hashed_password = bcrypt.hashSync(randomPassword, 10);
      const created_at = new Date().toISOString();
      const info = db.prepare('INSERT INTO users (email, hashed_password, "plan", created_at) VALUES (?, ?, ?, ?)').run(
        email, hashed_password, "free", created_at
      );
      user = getUserById(info.lastInsertRowid);
    }
    const token = signToken(user);
    return res.json({ ok: true, token, user: { id: user.id, email: user.email, plan: user.plan } });
  } catch (e) {
    return jsonError(res, 500, "GOOGLE_AUTH_FAILED", "Google auth failed.");
  }
});

app.get("/api/auth/google-config", (req, res) => {
  const clientId =
    process.env.GOOGLE_CLIENT_ID ||
    process.env.GSC_CLIENT_ID ||
    process.env.VITE_GOOGLE_CLIENT_ID ||
    "";
  res.json({ ok: true, enabled: Boolean(clientId), client_id: clientId || "" });
});

app.post("/api/auth/register", (req, res) => {
  const email = String(req.body?.email || "").trim().toLowerCase();
  const password = String(req.body?.password || "");
  const plan = String(req.body?.plan || "free").trim().toLowerCase();

  if (!email || !email.includes("@")) return jsonError(res, 400, "BAD_EMAIL", "Valid email required.");
  if (!password || password.length < 6) return jsonError(res, 400, "BAD_PASSWORD", "Password must be at least 6 characters.");

  const existing = getUserByEmail(email);
  if (existing) return jsonError(res, 409, "EMAIL_EXISTS", "Email already registered.");

  const hashed_password = bcrypt.hashSync(password, 10);
  const created_at = new Date().toISOString();

  // user.id is INTEGER in your schema; let SQLite assign it
  const info = db.prepare('INSERT INTO users (email, hashed_password, "plan", created_at) VALUES (?, ?, ?, ?)').run(
    email, hashed_password, plan, created_at
  );
  const user = getUserById(info.lastInsertRowid);

  const token = signToken(user);
  res.json({ ok: true, token, user: { id: user.id, email: user.email, plan: user.plan } });
});

app.post("/api/auth/login", (req, res) => {
  const email = String(req.body?.email || "").trim().toLowerCase();
  const password = String(req.body?.password || "");

  const user = getUserByEmail(email);
  if (!user) return jsonError(res, 401, "INVALID_LOGIN", "Invalid email or password.");

  const ok = bcrypt.compareSync(password, user.hashed_password);
  if (!ok) return jsonError(res, 401, "INVALID_LOGIN", "Invalid email or password.");

  const token = signToken(user);
  res.json({ ok: true, token, user: { id: user.id, email: user.email, plan: user.plan } });
});

// ===== Audits history (F2) =====
// Save completed audit
app.post("/api/audits", requireAuth, (req, res) => {
  const userId = req.user?.uid;
  const result = req.body?.result;

  if (!result || typeof result !== "object") return jsonError(res, 400, "BAD_RESULT", "Missing `result` payload.");

  const urlRaw = result.url || req.body?.url;
  const v = normalizeUrl(urlRaw);
  if (!v.ok) return jsonError(res, 400, v.code, v.message);

  const normalized_url = v.normalized;
  const url = String(result.url || normalized_url);

  const seo_score = Number(result.seoScore ?? result.seo_score ?? 0) || 0;
  const pages_crawled = Number(result.pagesCrawled ?? result.pages_crawled ?? 1) || 1;
  const issues_found = Array.isArray(result.issues) ? result.issues.length : Number(result.issuesFound ?? result.issues_found ?? 0) || 0;

  const id = crypto.randomUUID();
  const created_at = new Date().toISOString();
  const result_json = JSON.stringify(result);

  db.prepare(`
    INSERT INTO audits (id, user_id, url, normalized_url, seo_score, pages_crawled, issues_found, result_json, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, userId, url, normalized_url, seo_score, pages_crawled, issues_found, result_json, created_at);

  res.json({ ok: true, id });
});

// List recent audits
app.get("/api/audits", requireAuth, (req, res) => {
  const userId = req.user?.uid;
  const limit = Math.max(1, Math.min(100, Number(req.query?.limit || 30) || 30));

  const rows = db.prepare(`
    SELECT id, url, normalized_url, seo_score, pages_crawled, issues_found, created_at
    FROM audits
    WHERE user_id = ?
    ORDER BY datetime(created_at) DESC
    LIMIT ?
  `).all(userId, limit);

  res.json({ ok: true, items: rows });
});

// Get one audit details
app.get("/api/audits/:id", requireAuth, (req, res) => {
  const userId = req.user?.uid;
  const id = String(req.params.id || "");

  const row = db.prepare(`
    SELECT id, url, normalized_url, seo_score, pages_crawled, issues_found, result_json, created_at
    FROM audits
    WHERE user_id = ? AND id = ?
  `).get(userId, id);

  if (!row) return jsonError(res, 404, "NOT_FOUND", "Audit not found.");

  
  try {
    row.result = JSON.parse(row.result_json);
  } catch (_) {
    row.result = null;
  }
  delete row.result_json;

  res.json({ ok: true, item: row });
});

// ===== Static frontend (single-port) =====
if (HAS_SPA_DIST && FRONTEND_DIST) app.use(express.static(FRONTEND_DIST));
app.get("*", (req, res, next) => {
  if (req.path && req.path.startsWith("/api")) return next();
  if (!HAS_SPA_DIST || !FRONTEND_DIST) return res.status(404).send("SPA dist missing");
  return res.sendFile(path.join(FRONTEND_DIST, "index.html"));
});
const port = process.env.PORT || 3000;
__seedDemoAudit(auditCache, __mockAudit);

export default app;

import express from "express"

import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";

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
import { fileURLToPath } from "url";
import { Worker } from "worker_threads";

import { normalizeUrl, TTLCache, RateLimiter, jsonError } from "./api_hardening.js";

import cors from "cors";

// RANKYPULSE_CORS_PATCH_V1
const CORS_ALLOWLIST = new Set([
  "https://rank.rankypulse.com",
  "https://audit.rankypulse.com",
  "https://rankypulse.com",
  "http://localhost:5173",
  "http://localhost:3000",
  "http://localhost:3001"
]);

const corsMiddleware = cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    if (CORS_ALLOWLIST.has(origin)) return cb(null, true);
    if (/^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(origin)) return cb(null, true);
    return cb(null, false);
  },
  credentials: true,
  methods: ["GET","HEAD","PUT","PATCH","POST","DELETE","OPTIONS"],
  allowedHeaders: ["content-type","authorization","x-requested-with"]
});
const app = express();
app.use(express.static(process.cwd() + "/public"));


// RANKYPULSE_RAILWAY_ACAO_V1
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && CORS_ALLOWLIST.has(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Credentials", "true");
  }
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Methods", "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", req.headers["access-control-request-headers"] || "content-type, authorization");
    return res.status(204).end();
  }
  next();
});


app.use(corsMiddleware);
app.options("*", corsMiddleware);





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

import { createRequire } from "module";
const require = createRequire(import.meta.url);
const projectsRouter = require("./api/projects.cjs");

app.use("/api/projects", projectsRouter);






const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const db = new Database(path.join(__dirname, "database.db"));
db.pragma("journal_mode = WAL");

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
  return db.prepare('SELECT id, email, hashed_password, "plan", created_at FROM user WHERE email = ?').get(email);
}

function getUserById(id) {
  return db.prepare('SELECT id, email, hashed_password, "plan", created_at FROM user WHERE id = ?').get(id);
}


// ===== Config =====
const FRONTEND_DIST = path.join(__dirname, "apps", "web", "dist");

// Demo rate limit (per IP)
const demoLimiter = new RateLimiter({ windowMs: 10 * 60 * 1000, max: 3 }); // 3 audits / 10 min
// Cache (per normalized URL)

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

// ===== API =====
app.get("/api/health", (req, res) => res.json({ ok: true }));


app.post("/auth/register", (req, res) => res.redirect(307, "/api/auth/register"));
app.post("/auth/login", (req, res) => res.redirect(307, "/api/auth/login"));
app.post("/register", (req, res) => res.redirect(307, "/api/auth/register"));
app.post("/login", (req, res) => res.redirect(307, "/api/auth/login"));



/* ==== FORCE LISTENER (DEBUG) ==== */
const __PORT__ = Number(process.env.PORT || 3000);

process.on("uncaughtException", (e) => { console.error("UNCAUGHT:", e); });
process.on("unhandledRejection", (e) => { console.error("UNHANDLED:", e); });

app.get("/__ping__", (req, res) => res.json({ ok: true }));

// TEMP AUTH SHIM (so UI can work)
app.post(["/api/auth/register","/api/auth/login"], (req, res) => {
  const email = String(req.body?.email || "").trim().toLowerCase();
  const user = { id: 1, email, plan: "free" };
  res.json({ ok: true, token: "dev", user });
});

app.listen(process.env.PORT || 3000, "0.0.0.0", () => { console.log("SERVER LISTENING ON", process.env.PORT || 3000); });
/* ==== END FORCE LISTENER ==== */

// ==== SERVE FRONTEND (SPA) ====
app.get("/auth", (req, res) => {
  res.sendFile(process.cwd() + "/public/auth.html");
});

app.get(["/","/index.html"], (req, res) => {
  res.sendFile(process.cwd() + "/public/index.html");
});

app.get("/api/auth/me", (req, res) => {
  const auth = req.headers.authorization || "";
  const cookie = req.headers.cookie || "";
  res.json({ ok: true, hasAuthHeader: auth.startsWith("Bearer "), hasCookie: cookie.length > 0 });
});

const pageReport = require("./api/page-report.cjs");

app.post("/api/page-report", pageReport);

app.get("/__routes__", (req, res) => {
  const out = [];
  for (const layer of (app._router?.stack || [])) {
    if (layer?.route?.path) {
      const methods = Object.keys(layer.route.methods || {}).filter(Boolean).join(",");
      out.push({ path: layer.route.path, methods });
    }
  }
  res.json(out);
});

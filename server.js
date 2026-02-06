import "dotenv/config";
import express from "express"
import pageReport from "./api/page-report.js";
import aiFix from "./api/ai-fix.js";
import { subscribeWeeklyReport } from "./api/weekly-report.js";
import { wpAuthStart, wpAuthCallback, wpStatus, wpDisconnect, wpPushFix } from "./api/wp.js";
import { shopifyAuthStart, shopifyAuthCallback, shopifyStatus, shopifyDisconnect, shopifyPushFix } from "./api/shopify.js";
import events from "./api/events.js";
import migrateAnon from "./api/migrate-anon.js";
import resetPasswordConfirm from "./api/reset-password-confirm.js";
import accountSettings from "./api/account-settings.js";
import { teamMembers, teamInvites, inviteInfo, acceptInviteExisting } from "./api/team.js";
import requestUpgrade from "./api/request-upgrade.js";
import { gscAuthStart, gscAuthCallback, gscStatus, gscSummary, gscDisconnect } from "./api/gsc.js";
import embedLead, { listEmbedLeads, getEmbedLead, updateEmbedLead, testEmbedWebhook, listWebhookHistory, retryWebhookNow, processWebhookQueue, getWebhookMetrics } from "./api/embed-lead.js";
import googleAuth from "./api/auth-google.js";
import sharedReports from "./api/shared-reports.js";
import fs from "fs";

import registerUserState from "./api/user-state.js";
import registerBilling from "./api/billing.js";
import registerAuditHistory from "./api/audit-history.js";
import registerAnalytics from "./api/analytics.js";
import { getEntitlements } from "./services/node-api/lib/entitlementsStore.js";
import { getUserPlan } from "./services/node-api/lib/planStore.js";
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
  allowedHeaders: ["content-type","authorization","x-requested-with","x-rp-anon-id","x-razorpay-signature"]
});
const app = express();
// Don't serve public statically yet - we'll do it after route handlers
// app.use(express.static(process.cwd() + "/public"));


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
    res.setHeader("Access-Control-Allow-Headers", req.headers["access-control-request-headers"] || "content-type, authorization, x-rp-anon-id, x-razorpay-signature");
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


// Phase 4.2: Razorpay billing (stubs wired first, logic added next)

// Razorpay routes live in api/billing.js

import { createRequire } from "module";
const require = createRequire(import.meta.url);
const entStore = require("./api/entitlements-store.cjs");

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


app.post("/api/page-report", pageReport);
app.post("/api/ai-fix", aiFix);
app.post("/api/weekly-report/subscribe", subscribeWeeklyReport);
app.post("/api/events", events);
app.post("/api/migrate-anon", migrateAnon);
app.post("/api/reset-password/confirm", resetPasswordConfirm);
app.get("/api/account-settings", accountSettings);
app.post("/api/account-settings", accountSettings);
app.get("/api/team/members", teamMembers);
app.post("/api/team/members", teamMembers);
app.get("/api/team/invites", teamInvites);
app.post("/api/team/invites", teamInvites);
app.get("/api/team/invite", inviteInfo);
app.post("/api/accept-invite", acceptInviteExisting);
app.post("/api/request-upgrade", requestUpgrade);
app.get("/api/wp/auth/start", wpAuthStart);
app.get("/api/wp/auth/callback", wpAuthCallback);
app.get("/api/wp/status", wpStatus);
app.post("/api/wp/disconnect", wpDisconnect);
app.post("/api/wp/push-fix", wpPushFix);
app.get("/api/shopify/auth/start", shopifyAuthStart);
app.get("/api/shopify/auth/callback", shopifyAuthCallback);
app.get("/api/shopify/status", shopifyStatus);
app.post("/api/shopify/disconnect", shopifyDisconnect);
app.post("/api/shopify/push-fix", shopifyPushFix);
app.post("/api/gsc/summary", gscSummary);
app.get("/api/gsc/auth/start", gscAuthStart);
app.get("/api/gsc/auth/callback", gscAuthCallback);
app.get("/api/gsc/status", gscStatus);
app.post("/api/gsc/disconnect", gscDisconnect);
app.post("/api/embed/lead", embedLead);
app.get("/api/embed/leads", listEmbedLeads);
app.get("/api/embed/leads/:id", getEmbedLead);
app.post("/api/embed/leads/:id", updateEmbedLead);
app.post("/api/embed/test-webhook", testEmbedWebhook);
app.get("/api/embed/webhook-history", listWebhookHistory);
app.get("/api/embed/webhook-metrics", getWebhookMetrics);
app.post("/api/embed/webhook-history/:id/retry", retryWebhookNow);
app.post("/api/auth/google", googleAuth);
app.get("/api/shared-reports/:reportId", sharedReports);

// Lightweight webhook retry worker
setInterval(() => {
  processWebhookQueue().catch(() => {});
}, 60 * 1000);

registerUserState(app);
registerBilling(app);
registerAuditHistory(app);
registerAnalytics(app);

// ===== Entitlements Endpoint (Phase 4.2) =====
app.get("/api/entitlements", (req, res) => {
  try {
    const anon_id = req.get("x-rp-anon-id") || null;
    if (!anon_id) {
      return res.status(400).json({
        ok: false,
        entitlements: null,
        error: { code: "MISSING_ANON_ID", message: "Missing anon id.", retryable: false },
      });
    }
    const entitlements = entStore.getEntitlements(anon_id);
    return res.json({ ok: true, entitlements, error: null });
  } catch (e) {
    return res.status(500).json({
      ok: false,
      entitlements: null,
      error: { code: "INTERNAL", message: "Could not load entitlements.", retryable: true },
    });
  }
});
console.log("Registered POST /api/page-report");
console.log("Registered GET/POST /api/audit-history");
console.log("Registered GET /api/entitlements");

// ==== DIAGNOSTIC MIDDLEWARE (TEMPORARY) ====
let diagnosticEnabled = true; // Set to false to disable after debugging
if (diagnosticEnabled) {
  app.use((req, res, next) => {
    const originalSend = res.send;
    const originalSendFile = res.sendFile;
    let handlerType = "unknown";
    
    // Track which handler responds
    res.send = function(...args) {
      console.log(`[DIAG] ${req.method} ${req.path} -> ${handlerType} (send)`);
      return originalSend.apply(this, args);
    };
    
    res.sendFile = function(...args) {
      console.log(`[DIAG] ${req.method} ${req.path} -> ${handlerType} (sendFile: ${args[0]})`);
      return originalSendFile.apply(this, args);
    };
    
    // Mark handler type based on path
    if (req.path.startsWith("/api")) {
      handlerType = "API";
    } else if (req.path === "/audit" || req.path === "/improve" || req.path === "/pricing" || req.path === "/rank") {
      handlerType = "EXPLICIT_ROUTE";
    } else if (req.path.match(/\.(js|css|png|jpg|svg|woff|woff2|ttf|eot|ico|json)$/)) {
      handlerType = "STATIC_ASSET";
    } else {
      handlerType = "CATCH_ALL";
    }
    
    next();
  });
}

// ==== SERVE FRONTEND (SPA) ====
// Route handlers MUST come before static middleware
app.get("/auth", (req, res) => {
  res.sendFile(process.cwd() + "/public/auth.html");
});

// Serve specific route HTML files (SSG build) - must come before static middleware
const routeHtmlMap = {
  "/audit": "index.html", // Serve SPA entry for React Router
  "/admin/audit": "index.html", // Serve SPA entry for React Router
  "/admin": "index.html", // Admin defaults to SPA entry
  "/rank": "rank.html",
  "/improve": "improve.html",
  "/pricing": "pricing.html",
  "/app": "index.html", // App route serves index
};

for (const [route, htmlFile] of Object.entries(routeHtmlMap)) {
  app.get(route, (req, res) => {
    const filePath = path.join(FRONTEND_DIST, htmlFile);
    const resolvedPath = path.resolve(filePath);
    console.log(`[ROUTE] Serving ${route} -> ${resolvedPath}`);
    
    // Check if file exists
    if (!fs.existsSync(resolvedPath)) {
      console.error(`[ROUTE ERROR] ${route}: File not found at ${resolvedPath}, falling back to index.html`);
      // Fallback to SPA entry point
      const fallbackPath = path.join(FRONTEND_DIST, "index.html");
      return res.sendFile(path.resolve(fallbackPath), (err) => {
        if (err) {
          console.error(`[ROUTE ERROR] ${route}: Fallback also failed:`, err.message);
          res.status(404).send("File not found");
        }
      });
    }
    
    res.sendFile(resolvedPath, (err) => {
      if (err) {
        console.error(`[ROUTE ERROR] ${route}:`, err.message);
        // Fallback to index.html on error
        const fallbackPath = path.join(FRONTEND_DIST, "index.html");
        res.sendFile(path.resolve(fallbackPath), (fallbackErr) => {
          if (fallbackErr) {
            res.status(404).send("File not found");
          }
        });
      }
    });
  });
}

// Serve static files from dist (assets, etc.) - AFTER route handlers
// Exclude route paths and API routes from static serving
const staticMiddleware = express.static(FRONTEND_DIST, {
  // Don't serve index files for directories - let route handlers handle routes
  index: false
});

app.use((req, res, next) => {
  // Skip static serving for known route paths
  if (routeHtmlMap.hasOwnProperty(req.path)) {
    return next();
  }
  // Skip static serving for API routes
  if (req.path.startsWith("/api")) {
    return next();
  }
  // Skip static serving for auth route
  if (req.path === "/auth") {
    return next();
  }
  if (req.path === "/__routes__" || req.path === "/__ping__") return next();
  staticMiddleware(req, res, next);
});

// Also serve public folder for other static assets
app.use(express.static(process.cwd() + "/public"));

// Catch-all: serve index.html for all other non-API routes
app.get("*", (req, res, next) => {
  // Skip API routes
  if (req.path.startsWith("/api")) return next();
  // Serve the SPA index.html
  res.sendFile(path.join(FRONTEND_DIST, "index.html"), (err) => {
    if (err) {
      // Fallback to public/index.html if dist doesn't exist
      res.sendFile(process.cwd() + "/public/index.html");
    }
  });



});

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || "0.0.0.0";
app.listen(PORT, HOST, () => {
  console.log("SERVER LISTENING ON", `${HOST}:${PORT}`);
});
/* ==== END FORCE LISTENER ==== */

app.get("/api/auth/me", (req, res) => {
  const auth = req.headers.authorization || "";
  const cookie = req.headers.cookie || "";
  res.json({ ok: true, hasAuthHeader: auth.startsWith("Bearer "), hasCookie: cookie.length > 0 });
});

app.use((err, req, res, next) => {
  try {
    return res.status(500).json({
      ok: false,
      error: { code: "INTERNAL", message: "Unhandled server error", retryable: true },
    });
  } catch (e) {
    res.status(500).end();
  }
});

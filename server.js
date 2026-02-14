import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import fs from "fs";

import pageReport from "./api/page-report.js";
import aiFix from "./api/ai-fix.js";
import { subscribeWeeklyReport } from "./api/weekly-report.js";
import events from "./api/events.js";
import migrateAnon from "./api/migrate-anon.js";
import signUp from "./api/signup.js";
import signIn from "./api/signin.js";
import guestSignIn from "./api/guest-signin.js";
import resetPassword from "./api/reset-password.js";
import resetPasswordConfirm from "./api/reset-password-confirm.js";
import verifyEmail from "./api/verify-email.js";
import accountSettings from "./api/account-settings.js";
import { teamMembers, teamInvites, inviteInfo, acceptInviteExisting } from "./api/team.js";
import requestUpgrade from "./api/request-upgrade.js";

import { wpAuthStart, wpAuthCallback, wpStatus, wpDisconnect, wpPushFix } from "./api/wp.js";
import { shopifyAuthStart, shopifyAuthCallback, shopifyStatus, shopifyDisconnect, shopifyPushFix } from "./api/shopify.js";
import { gscAuthStart, gscAuthCallback, gscStatus, gscSummary, gscDisconnect } from "./api/gsc.js";

import embedLead, {
  listEmbedLeads,
  getEmbedLead,
  updateEmbedLead,
  testEmbedWebhook,
  listWebhookHistory,
  retryWebhookNow,
  processWebhookQueue,
  getWebhookMetrics,
} from "./api/embed-lead.js";

import googleAuth from "./api/auth-google.js";
import sharedReports from "./api/shared-reports.js";

import registerUserState from "./api/user-state.js";
import registerBilling from "./api/billing.js";
import registerAuditHistory from "./api/audit-history.js";
import registerAnalytics from "./api/analytics.js";
import { createUser, getUserByEmail, setVerified } from "./api/auth-store.js";

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.set("trust proxy", 1);

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(
  helmet({
    contentSecurityPolicy: false,
    frameguard: { action: "deny" },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
  })
);

app.use((req, res, next) => {
  const nonce = crypto.randomBytes(16).toString("base64");
  res.locals.cspNonce = nonce;
  res.setHeader(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      "frame-ancestors 'none'",
      "form-action 'self'",
      "img-src 'self' data: https:",
      "font-src 'self' data: https://fonts.gstatic.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
      "connect-src 'self' https:",
      "frame-src 'self' https://checkout.razorpay.com",
      "upgrade-insecure-requests"
    ].join("; ")
  );
  next();
});

if (process.env.ENABLE_TRUSTED_TYPES === "true") {
  app.use((req, res, next) => {
    res.setHeader("require-trusted-types-for", "'script'");
    res.setHeader("trusted-types", "default");
    next();
  });
}
app.use(compression());
app.use(cookieParser());
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

app.use(
  rateLimit({
    windowMs: 60 * 1000,
    max: 600,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

seedTesterAccount();
seedGuestAccount();

async function seedTesterAccount() {
  const email = process.env.TESTER_EMAIL || "";
  const password = process.env.TESTER_PASSWORD || "";
  if (!email || !password) return;
  const name = process.env.TESTER_NAME || "RankyPulse Tester";
  const teamId = process.env.TESTER_TEAM_ID || "testers";
  const role = process.env.TESTER_ROLE || "admin";
  const autoVerify = String(process.env.TESTER_AUTO_VERIFY || "true").toLowerCase() !== "false";
  try {
    const existing = await getUserByEmail(email);
    if (!existing) {
      const password_hash = await bcrypt.hash(password, 10);
      await createUser({ email, name, password_hash, team_id: teamId, role, verified: autoVerify });
    } else if (autoVerify && !existing.verified) {
      await setVerified(email, true);
    }
    console.log(`[tester] ready ${email} team=${teamId} verified=${autoVerify}`);
  } catch (e) {
    console.log("[tester] seed failed:", String(e?.message || e));
  }
}

async function seedGuestAccount() {
  const email = process.env.GUEST_EMAIL || "";
  const password = process.env.GUEST_PASSWORD || "";
  if (!email || !password) return;
  const name = process.env.GUEST_NAME || "RankyPulse Guest";
  const teamId = process.env.GUEST_TEAM_ID || "guests";
  const role = process.env.GUEST_ROLE || "viewer";
  const autoVerify = String(process.env.GUEST_AUTO_VERIFY || "true").toLowerCase() !== "false";
  try {
    const existing = await getUserByEmail(email);
    if (!existing) {
      const password_hash = await bcrypt.hash(password, 10);
      await createUser({ email, name, password_hash, team_id: teamId, role, verified: autoVerify });
    } else if (autoVerify && !existing.verified) {
      await setVerified(email, true);
    }
    console.log(`[guest] ready ${email} team=${teamId} verified=${autoVerify}`);
  } catch (e) {
    console.log("[guest] seed failed:", String(e?.message || e));
  }
}

// ---- Static / SPA ----
const FRONTEND_DIST = path.join(__dirname, "apps", "web", "dist");
const INDEX_HTML = path.join(FRONTEND_DIST, "index.html");
const ROOT_ROBOTS = path.join(__dirname, "robots.txt");
const ROOT_SITEMAP = path.join(__dirname, "sitemap.xml");

function injectNonce(html, nonce) {
  return html.replace(/<script(?![^>]*\\bnonce=)/gi, `<script nonce="${nonce}"`);
}

function injectCanonical(html, absoluteUrl) {
  let output = html;
  if (/<link[^>]+rel=["']canonical["']/i.test(output)) {
    output = output.replace(
      /<link[^>]+rel=["']canonical["'][^>]*>/i,
      `<link rel="canonical" href="${absoluteUrl}">`
    );
  } else {
    output = output.replace(
      /<head[^>]*>/i,
      `$&\n    <link rel="canonical" href="${absoluteUrl}">`
    );
  }
  if (/<meta[^>]+property=["']og:url["']/i.test(output)) {
    output = output.replace(
      /<meta[^>]+property=["']og:url["'][^>]*>/i,
      `<meta property="og:url" content="${absoluteUrl}">`
    );
  } else {
    output = output.replace(
      /<head[^>]*>/i,
      `$&\n    <meta property="og:url" content="${absoluteUrl}">`
    );
  }
  return output;
}

function injectMeta(html, meta) {
  let output = html;
  if (meta.title) {
    if (/<title>.*<\/title>/i.test(output)) {
      output = output.replace(/<title>.*<\/title>/i, `<title>${meta.title}</title>`);
    } else {
      output = output.replace(/<head[^>]*>/i, `$&\n    <title>${meta.title}</title>`);
    }
  }
  if (meta.description) {
    if (/<meta[^>]+name=["']description["']/i.test(output)) {
      output = output.replace(
        /<meta[^>]+name=["']description["'][^>]*>/i,
        `<meta name="description" content="${meta.description}">`
      );
    } else {
      output = output.replace(
        /<head[^>]*>/i,
        `$&\n    <meta name="description" content="${meta.description}">`
      );
    }
  }
  if (meta.ogTitle) {
    if (/<meta[^>]+property=["']og:title["']/i.test(output)) {
      output = output.replace(
        /<meta[^>]+property=["']og:title["'][^>]*>/i,
        `<meta property="og:title" content="${meta.ogTitle}">`
      );
    } else {
      output = output.replace(
        /<head[^>]*>/i,
        `$&\n    <meta property="og:title" content="${meta.ogTitle}">`
      );
    }
  }
  if (meta.ogDescription) {
    if (/<meta[^>]+property=["']og:description["']/i.test(output)) {
      output = output.replace(
        /<meta[^>]+property=["']og:description["'][^>]*>/i,
        `<meta property="og:description" content="${meta.ogDescription}">`
      );
    } else {
      output = output.replace(
        /<head[^>]*>/i,
        `$&\n    <meta property="og:description" content="${meta.ogDescription}">`
      );
    }

  if (meta.ogImage) {
    if (/<meta[^>]+property=["']og:image["']/i.test(output)) {
      output = output.replace(
        /<meta[^>]+property=["']og:image["'][^>]*>/i,
        `<meta property="og:image" content="${meta.ogImage}">`
      );
    } else {
      output = output.replace(
        /<head[^>]*>/i,
        `$&\n    <meta property="og:image" content="${meta.ogImage}">`
      );
    }
  }
  if (meta.twitterImage) {
    if (/<meta[^>]+name=["']twitter:image["']/i.test(output)) {
      output = output.replace(
        /<meta[^>]+name=["']twitter:image["'][^>]*>/i,
        `<meta name="twitter:image" content="${meta.twitterImage}">`
      );
    } else {
      output = output.replace(
        /<head[^>]*>/i,
        `$&\n    <meta name="twitter:image" content="${meta.twitterImage}">`
      );
    }
  }
  }
  if (meta.robots) {
    if (/<meta[^>]+name=["']robots["']/i.test(output)) {
      output = output.replace(
        /<meta[^>]+name=["']robots["'][^>]*>/i,
        `<meta name="robots" content="${meta.robots}">`
      );
    } else {
      output = output.replace(
        /<head[^>]*>/i,
        `$&\n    <meta name="robots" content="${meta.robots}">`
      );
    }
  }
  return output;
}

function absoluteUrlFor(req) {
  const origin = (process.env.CANONICAL_ORIGIN || "https://rankypulse.com").replace(/\/$/, "");
  const path = req.originalUrl || req.url || "/";
  return origin + path;
}

function stripLeadingSlash(value) {
  return value.replace(/^\/+/, "");
}

function resolveHtmlPath(reqPath) {
  if (reqPath === "/" || reqPath === "/index.html") return INDEX_HTML;
  const cleanPath = stripLeadingSlash(reqPath);
  if (cleanPath.endsWith(".html")) {
    return path.join(FRONTEND_DIST, cleanPath);
  }
  return path.join(FRONTEND_DIST, cleanPath, "index.html");
}

const publicMeta = [
  {
    test: (pathName) => pathName === "/",
    title: "RankyPulse — Clear SEO decisions",
    description: "RankyPulse helps you make clear SEO decisions with fast audits, page reports, and actionable recommendations."
  },
  {
    test: (pathName) => pathName === "/start",
    title: "Run a Free SEO Audit in 30 Seconds | RankyPulse",
    description: "Launch a free SEO audit and get quick wins, priority fixes, and a clear action plan in under a minute."
  },
  {
    test: (pathName) => pathName === "/pricing",
    title: "Pricing | RankyPulse",
    description: "Compare plans and pick the RankyPulse package that fits your SEO workflow."
  },
  {
    test: (pathName) => pathName === "/about",
    title: "About RankyPulse",
    description: "Learn how RankyPulse helps teams ship SEO improvements with clarity and speed."
  },
  {
    test: (pathName) => pathName === "/changelog",
    title: "Changelog | RankyPulse",
    description: "Product updates, improvements, and new SEO features from the RankyPulse team."
  },
  {
    test: (pathName) => pathName === "/shared",
    title: "Sample SEO Audit Report | RankyPulse",
    description: "Explore a sample audit report with prioritized fixes, visuals, and next steps."
  },
  {
    test: (pathName) => pathName.startsWith("/r/"),
    title: "SEO Audit Report | RankyPulse",
    description: "Shared SEO audit report with prioritized issues and actionable recommendations.",
    robots: "noindex, nofollow"
  },
  {
    test: (pathName) => pathName.startsWith("/use-cases/saas-landing-audit"),
    title: "SaaS Landing Page Audit | RankyPulse",
    description: "Run a SaaS landing page audit and get a fix plan built for conversions."
  },
  {
    test: (pathName) => pathName.startsWith("/use-cases/blog-audit-checklist"),
    title: "Blog SEO Audit Checklist | RankyPulse",
    description: "Audit blog pages fast with a checklist of high-impact SEO fixes."
  },
  {
    test: (pathName) => pathName.startsWith("/use-cases/agency-audit-workflow"),
    title: "Agency SEO Audit Workflow | RankyPulse",
    description: "Standardize audits with a repeatable workflow built for agencies."
  }
  {
    test: (path) => path === "/rank",
    title: "Keyword Rank Checker | RankyPulse",
    description:
      "Check where your domain ranks for keywords. Track position over time and get actionable SEO recommendations.",
    robots: "index,follow",
    ogTitle: "Keyword Rank Checker | RankyPulse",
    ogDescription:
      "Check where your domain ranks for keywords. Track position over time and get actionable SEO recommendations.",
    ogImage: "https://rankypulse.com/rankypulse-logo.svg",
    twitterCard: "summary_large_image",
    twitterTitle: "Keyword Rank Checker | RankyPulse",
    twitterDescription:
      "Check where your domain ranks for keywords. Track position over time and get actionable SEO recommendations.",
    twitterImage: "https://rankypulse.com/rankypulse-logo.svg",
  },

];

const noindexPrefixes = [
  "/auth",
  "/account",
  "/admin",
  "/embed",
  "/leads",
  ,
  "/improve",
  "/audit",
  "/r/",
  "/upgrade",
  "/plan-change"
];

function getMetaForPath(pathName) {
  const match = publicMeta.find((entry) => entry.test(pathName));
  const base = match || {
    title: "RankyPulse — Clear SEO decisions",
    description: "RankyPulse helps you make clear SEO decisions with fast audits, page reports, and actionable recommendations."
  };
  const noindex = noindexPrefixes.some((prefix) => pathName.startsWith(prefix));
  const robots = match?.robots || (noindex ? "noindex, nofollow" : "index, follow");
  return {
    title: base.title,
    description: base.description,
    ogTitle: base.title,
    ogDescription: base.description,
    robots
  };
}

app.get("/robots.txt", (req, res) => {
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.sendFile(ROOT_ROBOTS);
});

app.get("/sitemap.xml", (req, res) => {
  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  res.sendFile(ROOT_SITEMAP);
});

app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api")) return next();
  const hasExtension = /\.[a-z0-9]+$/i.test(req.path);
  if (hasExtension && !req.path.endsWith(".html")) return next();
  const htmlPath = resolveHtmlPath(req.path);
  fs.readFile(htmlPath, "utf8", (err, html) => {
    if (err) return next();
    const nonce = res.locals.cspNonce;
    const absoluteUrl = absoluteUrlFor(req);
    let body = injectCanonical(html, absoluteUrl);
    body = injectMeta(body, getMetaForPath(req.path));
    body = injectNonce(body, nonce);
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(body);
  });
});

app.use(express.static(FRONTEND_DIST));

// ---- API routes (from your earlier server.js list) ----
app.post("/api/page-report", pageReport);
app.post("/api/ai-fix", aiFix);
app.post("/api/weekly-report/subscribe", subscribeWeeklyReport);
app.post("/api/events", events);
app.post("/api/migrate-anon", migrateAnon);

app.post("/api/signup", signUp);
app.post("/api/signin", signIn);
app.post("/api/guest-signin", guestSignIn);
app.post("/api/reset-password", resetPassword);
app.post("/api/reset-password/confirm", resetPasswordConfirm);
app.post("/api/verify-email", verifyEmail);
app.post("/api/account-settings", accountSettings);

app.post("/api/team/members", teamMembers);
app.post("/api/team/invites", teamInvites);
app.get("/api/team/invite-info", inviteInfo);
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

app.get("/api/gsc/auth/start", gscAuthStart);
app.get("/api/gsc/auth/callback", gscAuthCallback);
app.get("/api/gsc/status", gscStatus);
app.post("/api/gsc/summary", gscSummary);
app.post("/api/gsc/disconnect", gscDisconnect);

app.post("/api/embed/lead", embedLead);
app.get("/api/embed/leads", listEmbedLeads);
app.get("/api/embed/leads/:id", getEmbedLead);
app.post("/api/embed/leads/:id", updateEmbedLead);
app.post("/api/embed/test-webhook", testEmbedWebhook);
app.get("/api/embed/webhook-history/:id", listWebhookHistory);
app.post("/api/embed/webhook-history/:id/retry", retryWebhookNow);
app.post("/api/embed/process-queue", processWebhookQueue);
app.get("/api/embed/metrics", getWebhookMetrics);

app.post("/api/auth/google", googleAuth);

app.get("/api/shared-reports/:id", sharedReports);

// ---- register* modules that attach routes to app ----
registerUserState(app);
registerBilling(app);
registerAuditHistory(app);
registerAnalytics(app);

// Health
app.get("/api/health", (req, res) => res.json({ ok: true }));

// Catch-all: serve SPA (but never for /api)
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api")) return next();
  fs.readFile(INDEX_HTML, "utf8", (err, html) => {
    if (err) {
      res.status(404).send("Not found");
      return;
    }
    const nonce = res.locals.cspNonce;
    const absoluteUrl = absoluteUrlFor(req);
    let body = injectCanonical(html, absoluteUrl);
    body = injectMeta(body, getMetaForPath(req.path));
    body = injectNonce(body, nonce);
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(body);
  });
});

// Error handler (so you see real errors)
app.use((err, req, res, next) => {
  console.error("UNHANDLED_ERROR", err);
  res.status(500).json({ ok: false, error: String(err?.message || err) });
});

const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || "0.0.0.0";

app.listen(PORT, HOST, () => {
  console.log("SERVER LISTENING ON", `${HOST}:${PORT}`);
});

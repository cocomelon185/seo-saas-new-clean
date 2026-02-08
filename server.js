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

import pageReport from "./api/page-report.js";
import aiFix from "./api/ai-fix.js";
import { subscribeWeeklyReport } from "./api/weekly-report.js";
import events from "./api/events.js";
import migrateAnon from "./api/migrate-anon.js";
import signUp from "./api/signup.js";
import signIn from "./api/signin.js";
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

app.use(helmet({ contentSecurityPolicy: false }));
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

// ---- Static / SPA ----
const FRONTEND_DIST = path.join(__dirname, "apps", "web", "dist");
app.use(express.static(FRONTEND_DIST));

// ---- API routes (from your earlier server.js list) ----
app.post("/api/page-report", pageReport);
app.post("/api/ai-fix", aiFix);
app.post("/api/weekly-report/subscribe", subscribeWeeklyReport);
app.post("/api/events", events);
app.post("/api/migrate-anon", migrateAnon);

app.post("/api/signup", signUp);
app.post("/api/signin", signIn);
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
  res.sendFile(path.join(FRONTEND_DIST, "index.html"));
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

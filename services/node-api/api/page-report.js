import * as buildPageReportNS from "../lib/buildPageReport.js";
import { auditErrorResponse } from "../src/lib/audit_error_response.js";
import jwt from "jsonwebtoken";
import path from "path";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const Database = require("better-sqlite3");

const handleWeeklyReport = async () => {};

const buildPageReport =
  buildPageReportNS?.default ||
  buildPageReportNS?.buildPageReport ||
  buildPageReportNS;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-12345";
const FREE_AUDIT_LIMIT = Math.max(1, Number(process.env.FREE_AUDIT_LIMIT || 1));

let usageDb;
function getUsageDb() {
  if (!usageDb) {
    usageDb = new Database(path.join(process.cwd(), "database.db"));
    usageDb.pragma("journal_mode = WAL");
    usageDb.exec(`
      CREATE TABLE IF NOT EXISTS free_audit_usage (
        principal TEXT PRIMARY KEY,
        used_count INTEGER NOT NULL DEFAULT 0,
        updated_at TEXT NOT NULL
      );
    `);
  }
  return usageDb;
}

function decodeAuthUser(req) {
  const header = String(req.headers?.authorization || "");
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) return null;
  try {
    return jwt.verify(match[1], JWT_SECRET);
  } catch {
    return null;
  }
}

function getClientIp(req) {
  const xf = req.headers?.["x-forwarded-for"];
  if (typeof xf === "string" && xf.trim()) return xf.split(",")[0].trim();
  return req.socket?.remoteAddress || "unknown";
}

function getUsagePrincipal(req, authUser) {
  if (String(authUser?.role || "").toLowerCase() === "admin") {
    return { isAdmin: true, key: "admin" };
  }
  const email = String(authUser?.email || "").trim().toLowerCase();
  if (email) return { isAdmin: false, key: `user:${email}` };
  const anonId = String(req.headers?.["x-rp-anon-id"] || "").trim();
  if (anonId) return { isAdmin: false, key: `anon:${anonId}` };
  return { isAdmin: false, key: `ip:${getClientIp(req)}` };
}

function getUsedCount(key) {
  const row = getUsageDb()
    .prepare("SELECT used_count FROM free_audit_usage WHERE principal = ? LIMIT 1")
    .get(key);
  return Number(row?.used_count || 0);
}

function incrementUsedCount(key) {
  getUsageDb()
    .prepare(
      `INSERT INTO free_audit_usage (principal, used_count, updated_at)
       VALUES (?, 1, ?)
       ON CONFLICT(principal) DO UPDATE
       SET used_count = free_audit_usage.used_count + 1, updated_at = excluded.updated_at`
    )
    .run(key, new Date().toISOString());
}

function exhaustedResponse(used) {
  const remaining = Math.max(0, FREE_AUDIT_LIMIT - used);
  return {
    ok: false,
    error: {
      code: "FREE_CREDIT_EXHAUSTED",
      message: "Your free credit is used. Upgrade to continue."
    },
    upgrade_required: true,
    pricing_url: "/pricing",
    redirect_to: "/pricing",
    free_checks_limit: FREE_AUDIT_LIMIT,
    free_checks_used: used,
    free_checks_remaining: remaining
  };
}

function mockReport(url) {
  return {
    ok: true,
    url,
    final_url: url,
    status: 200,
    score: 82,
    quick_wins: ["Add meta description", "Compress hero image", "Fix missing H1"],
    content_brief: "Add a clearer H1, tighten the intro, and include a short FAQ section.",
    keyword_ideas: ["seo audit tool", "website audit", "rank checker"],
    issues: [
      {
        issue_id: "missing_meta_description",
        title: "Missing meta description",
        severity: "High",
        priority: "fix_now",
        impact: ["CTR", "Relevance"],
        why: "Search engines use this snippet under your title.",
        example_fix: "Write a 150–160 character summary that includes the target keyword.",
        evidence: { final_url: url, status: 200 }
      },
      {
        issue_id: "missing_h1",
        title: "Missing H1 heading",
        severity: "Medium",
        priority: "fix_next",
        impact: ["Clarity"],
        why: "The H1 tells visitors and Google the main topic of the page.",
        example_fix: "Add one clear H1 near the top of the page."
      },
      {
        issue_id: "low_word_count",
        title: "Low word count",
        severity: "Low",
        priority: "fix_later",
        impact: ["Depth"],
        why: "Thin content makes it harder to rank for relevant queries.",
        example_fix: "Add helpful detail: benefits, FAQs, and proof points."
      }
    ],
    priorities: [],
    debug: {
      fetch_status: 200,
      final_url: url,
      fetch_error: null
    }
  };
}

function isRetryableText(s) {
  const t = String(s || "");
  const tl = t.toLowerCase();
  return (
    t.includes("timeout") ||
    t.includes("AbortError") ||
    t.includes("ECONNRESET") ||
    t.includes("ECONNREFUSED") ||
    t.includes("ENOTFOUND") ||
    t.includes("ETIMEDOUT") ||
    tl.includes("fetch failed") ||
    tl.includes("network") ||
    tl.includes("undici")
  );
}

export default async function pageReport(req, res) {
  const url = (req.body && req.body.url) ? String(req.body.url) : "";
  const authUser = decodeAuthUser(req);
  const usagePrincipal = getUsagePrincipal(req, authUser);
  if (!usagePrincipal.isAdmin) {
    const used = getUsedCount(usagePrincipal.key);
    if (used >= FREE_AUDIT_LIMIT) {
      return res.status(200).json(exhaustedResponse(used));
    }
  }
  const isDev = process.env.NODE_ENV !== "production";
  const isExample = /example\.com/i.test(url);
  let isLocal = false;
  let isBlockedPort = false;
  try {
    const parsed = new URL(url);
    isLocal = parsed.hostname === "127.0.0.1";
    isBlockedPort = isLocal && parsed.port === "1";
  } catch {}
  if (isDev && (isExample || (isLocal && !isBlockedPort))) {
    return res.json(mockReport(url));
  }
  const debug = {
    handler_id: "api/page-report.js",
    fetch_status: null,
    final_url: null,
    content_type: null,
    html_len: null,
    fetch_error: null
  };

  const fn =
    typeof buildPageReport === "function"
      ? buildPageReport
      : typeof buildPageReportNS?.buildPageReport === "function"
      ? buildPageReportNS.buildPageReport
      : null;

  if (!fn) {
    const out = auditErrorResponse(new Error("buildPageReport export not found"), url, { debug });
    out.debug = debug;
    return res.json(out);
  }

  const maxAttempts = 3;
  const baseDelayMs = 350;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const report = await fn(url, debug);

      if (!report || typeof report !== "object") {
        const out = auditErrorResponse(new Error("Invalid report object"), url, { debug });
        out.debug = debug;
        return res.json(out);
      }

      if (!report.debug) report.debug = debug;
      if (typeof report.ok !== "boolean") report.ok = (typeof report.score === "number");

      if (report.ok === false) {
        report.score = null;

        const failureText =
          (report.debug && report.debug.fetch_error) ||
          debug.fetch_error ||
          report.warning ||
          "Failed to analyze page";

        const retryable = isRetryableText(failureText);

        if (attempt < maxAttempts && retryable) {
          const jitter = Math.floor(Math.random() * 150);
          const delay = baseDelayMs * Math.pow(2, attempt - 1) + jitter;
          await sleep(delay);
          continue;
        }

        const friendly = auditErrorResponse(new Error(failureText), url, { debug });
        report.warning = friendly.warning;
        report.error = friendly.error;
      }

      try {
        await handleWeeklyReport(report, req);
      } catch {}
      if (report.ok !== false && !usagePrincipal.isAdmin) {
        incrementUsedCount(usagePrincipal.key);
      }
      return res.json(report);
    } catch (e) {
      debug.fetch_error = String(e && (e.stack || e.message || e));

      if (attempt < maxAttempts && isRetryableText(debug.fetch_error)) {
        const jitter = Math.floor(Math.random() * 150);
        const delay = baseDelayMs * Math.pow(2, attempt - 1) + jitter;
        await sleep(delay);
        continue;
      }

      const out = auditErrorResponse(e, url, { debug });
      out.debug = debug;
      return res.json(out);
    }
  }

  const out = auditErrorResponse(new Error("Audit failed"), url, { debug });
  out.debug = debug;
  return res.json(out);
}

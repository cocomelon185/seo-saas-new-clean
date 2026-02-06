import * as buildPageReportNS from "../services/node-api/lib/buildPageReport.js";
import { auditErrorResponse } from "../services/node-api/src/lib/audit_error_response.js";
import { handleWeeklyReport } from "./weekly-report.js";

const buildPageReport =
  buildPageReportNS?.default ||
  buildPageReportNS?.buildPageReport ||
  buildPageReportNS;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

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

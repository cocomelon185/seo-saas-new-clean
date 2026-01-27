import * as buildPageReportNS from "../services/node-api/lib/buildPageReport.js";
import { auditErrorResponse } from "../services/node-api/src/lib/audit_error_response.js";

const buildPageReport =
  buildPageReportNS?.default ||
  buildPageReportNS?.buildPageReport ||
  buildPageReportNS;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

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

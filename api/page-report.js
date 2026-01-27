import * as buildPageReportNS from "../services/node-api/lib/buildPageReport.js";

const buildPageReport =
  buildPageReportNS?.default ||
  buildPageReportNS?.buildPageReport ||
  buildPageReportNS;

export default async function pageReport(req, res) {
  const url = (req.body && req.body.url) ? String(req.body.url) : "";
  const debug = { handler_id: "api/page-report.js", fetch_status: null, final_url: null, content_type: null, html_len: null, fetch_error: null };

  try {
    const fn = (typeof buildPageReport === "function")
      ? buildPageReport
      : (typeof buildPageReportNS?.buildPageReport === "function" ? buildPageReportNS.buildPageReport : null);

    if (!fn) {
      return res.json({ ok: false, url, score: null, quick_wins: [], issues: [], warning: "buildPageReport export not found", debug });
    }

    const report = await fn(url, debug);

    if (report && typeof report === "object") {
      if (!report.debug) report.debug = debug;
      if (typeof report.ok !== "boolean") report.ok = (typeof report.score === "number");
      return res.json(report);
    }

    return res.json({ ok: false, url, score: null, quick_wins: [], issues: [], warning: "Invalid report object", debug });
  } catch (e) {
    debug.fetch_error = String(e && (e.stack || e.message || e));
    return res.json({ ok: false, url, score: null, quick_wins: [], issues: [], warning: "Failed to analyze page", debug });
  }
}

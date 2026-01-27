const buildPageReport = require("../services/node-api/lib/buildPageReport.js");

module.exports = async function pageReport(req, res) {
  const url = (req.body && req.body.url) ? String(req.body.url) : "";
  const debug = { handler_id: "api/page-report.cjs", fetch_status: null, final_url: null, content_type: null, html_len: null, fetch_error: null };

  try {
    const report = await buildPageReport(url, debug);

    if (report && typeof report === "object") {
      if (!report.debug) report.debug = debug;
      if (typeof report.ok !== "boolean") report.ok = (typeof report.score === "number");

      if (
        report.ok === true &&
        report.score === 0 &&
        Array.isArray(report.quick_wins) && report.quick_wins.length === 0 &&
        Array.isArray(report.issues) && report.issues.length === 0
      ) {
        report.ok = false;
        report.score = null;
        report.warning = report.warning || "Analyzer returned empty placeholder results. Check debug.";
      }

      return res.json(report);
    }

    return res.json({ ok: false, url, score: null, quick_wins: [], issues: [], warning: "Invalid report object", debug });
  } catch (e) {
    debug.fetch_error = String(e && (e.stack || e.message || e));
    return res.json({ ok: false, url, score: null, quick_wins: [], issues: [], warning: "Failed to analyze page", debug });
  }
};

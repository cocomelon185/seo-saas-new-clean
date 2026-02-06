const sampleIssues = [
  {
    issue_id: "missing_meta_description",
    title: "Missing meta description",
    severity: "High",
    priority: "fix_now",
    impact: ["CTR", "Relevance"],
    why: "Search engines use this snippet under your title. Without it, you lose control of the preview.",
    example_fix: "Write a 150–160 character summary that includes a core keyword.",
    evidence: { final_url: "https://example.com", status: 200 }
  },
  {
    issue_id: "missing_h1",
    title: "Missing H1 heading",
    severity: "Medium",
    priority: "fix_next",
    impact: ["Clarity"],
    why: "The H1 tells visitors and Google the main topic of the page.",
    example_fix: "Add one clear H1 near the top that matches the page intent.",
    evidence: { h1: null }
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
];

const sampleQuickWins = [
  "Add meta description",
  "Compress hero image",
  "Fix missing H1"
];

function buildReport(reportId) {
  return {
    id: reportId,
    url: "https://example.com",
    score: 84,
    issues: sampleIssues,
    quick_wins: sampleQuickWins,
    content_brief: "Update the hero to mention the primary keyword, add a comparison table, and include FAQs."
  };
}

export default function sharedReports(req, res) {
  const { reportId } = req.params || {};
  if (!reportId) return res.status(400).json({ ok: false, error: "Missing report id" });
  return res.json({ ok: true, report: buildReport(reportId) });
}

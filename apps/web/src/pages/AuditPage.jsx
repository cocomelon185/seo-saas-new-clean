import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import PricingModal from "../components/PricingModal.jsx";
import AppShell from "../components/AppShell.jsx";
import ContentBrief from "../components/ContentBrief.jsx";

function getHowToFixList(text) {
  if (!text || typeof text !== "string") return null;
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length < 2) return null;

  const bulletRegex = /^[-*•]\s+/;
  const numberedRegex = /^\d+[\.\)]\s+/;
  const numberedCount = lines.filter((line) => numberedRegex.test(line)).length;
  const bulletCount = lines.filter((line) => bulletRegex.test(line)).length;
  const isNumbered = numberedCount >= 2;
  const isBulleted = bulletCount >= 2;

  if (!isNumbered && !isBulleted) return null;

  const listType = isNumbered ? "ol" : "ul";
  const stripRegex = isNumbered ? numberedRegex : bulletRegex;
  const items = lines
    .filter((line) => stripRegex.test(line))
    .map((line) => line.replace(stripRegex, "").trim())
    .filter(Boolean)
    .slice(0, 12);

  return items.length ? { type: listType, items } : null;
}

export default function AuditPage() {
  const navigate = useNavigate();
  const [pricingOpen, setPricingOpen] = useState(false);

  const [url, setUrl] = useState("");
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [issueFilter, setIssueFilter] = useState("all");
  const [openIssueKey, setOpenIssueKey] = useState(null);
  const [openEvidenceKeys, setOpenEvidenceKeys] = useState({});
  const [exportState, setExportState] = useState("idle");
  const exportTimeoutRef = useRef(null);

  const canRun = useMemo(() => {
    try {
      const u = new URL(url.trim());
      return u.protocol === "http:" || u.protocol === "https:";
    } catch {
      return false;
    }
  }, [url]);

  async function run() {
    setError("");
    setResult(null);

    if (!canRun) {
      setStatus("error");
      setError("Enter a valid URL (include https://).");
      return;
    }

    setStatus("loading");
    try {
      const res = await fetch("/api/page-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() })
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `HTTP ${res.status}`);
      }

      const data = await res.json();
      setResult(data);
      setStatus("success");
    } catch (e) {
      setStatus("error");
      setError(String(e?.message || "Request failed."));
    }
  }

  useEffect(() => {
    return () => {
      if (exportTimeoutRef.current) {
        clearTimeout(exportTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    setOpenIssueKey(null);
    setOpenEvidenceKeys({});
  }, [issueFilter]);

  const buildExportText = () => {
    const lines = [];
    const auditedUrl = result?.url || url.trim();
    lines.push("RankyPulse — SEO Audit Summary");
    lines.push(`Exported: ${new Date().toLocaleString()}`);
    lines.push(`URL: ${auditedUrl || "Not available"}`);
    lines.push("");
    lines.push(`SEO Score: ${typeof result?.score === "number" ? result.score : "N/A"}`);
    lines.push("");

    lines.push("Quick Wins:");
    const quickWins = Array.isArray(result?.quick_wins) ? result.quick_wins.slice(0, 10) : [];
    if (quickWins.length > 0) {
      quickWins.forEach((win) => lines.push(`- ${win}`));
    } else {
      lines.push("None");
    }
    lines.push("");

    lines.push("Issues:");
    const matchingIssues = filteredIssues;
    const totalMatching = matchingIssues.length;
    const exportedIssues = matchingIssues.slice(0, 50);
    if (exportedIssues.length === 0) {
      lines.push("None");
    } else {
      exportedIssues.forEach((issue, index) => {
        const title = issue?.title || issue?.message || `Issue ${index + 1}`;
        lines.push(`- ${title}`);
        lines.push(`  Priority: ${issue?.priority || "unknown"}`);
        if (issue?.severity) lines.push(`  Severity: ${issue.severity}`);
        if (issue?.description) lines.push(`  Description: ${issue.description}`);
        if (issue?.how_to_fix) lines.push(`  How to fix: ${issue.how_to_fix}`);
        if (issue?.evidence) {
          let evidenceText = "";
          try {
            evidenceText =
              typeof issue.evidence === "string" ? issue.evidence : JSON.stringify(issue.evidence, null, 2);
          } catch {
            evidenceText = String(issue.evidence);
          }
          if (evidenceText) lines.push(`  Evidence: ${evidenceText}`);
        }
        lines.push("");
      });
    }
    lines.push(`Issues exported: ${exportedIssues.length} of ${totalMatching} matching (total ${issues.length})`);
    lines.push("");

    lines.push("Content Brief:");
    if (briefText && briefText.trim()) {
      lines.push(briefText.trim());
    } else {
      lines.push("Not available");
    }

    return lines.join("\n");
  };

  const downloadTextFile = (filename, text) => {
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(objectUrl);
  };

  const flashExportState = (nextState) => {
    if (exportTimeoutRef.current) {
      clearTimeout(exportTimeoutRef.current);
    }
    setExportState(nextState);
    exportTimeoutRef.current = setTimeout(() => {
      setExportState("idle");
    }, 1500);
  };

  const handleExport = () => {
    try {
      const text = buildExportText();
      downloadTextFile("rankypulse-audit-summary.txt", text);
      flashExportState("success");
    } catch {
      flashExportState("error");
    }
  };

  const briefText = typeof result?.content_brief === "string" ? result.content_brief : "";
  const hasBrief = Boolean(briefText && briefText.trim());
  const issues = Array.isArray(result?.issues) ? result.issues : [];
  const filteredIssues =
    issueFilter === "all"
      ? issues
      : issues.filter((issue) => issue?.priority === issueFilter);
  const exportDisabled = !result || status === "loading";
  const priorityCounts = issues.reduce(
    (acc, issue) => {
      const priority = issue?.priority;
      if (priority === "fix_now") acc.fixNow += 1;
      if (priority === "fix_next") acc.fixNext += 1;
      if (priority === "fix_later") acc.fixLater += 1;
      return acc;
    },
    { fixNow: 0, fixNext: 0, fixLater: 0 }
  );
  const priorityChips = [
    {
      key: "fix_now",
      label: "Fix now",
      count: priorityCounts.fixNow,
      className: "border-rose-400/30 bg-rose-500/10 text-rose-100"
    },
    {
      key: "fix_next",
      label: "Fix next",
      count: priorityCounts.fixNext,
      className: "border-amber-400/30 bg-amber-500/10 text-amber-100"
    },
    {
      key: "fix_later",
      label: "Fix later",
      count: priorityCounts.fixLater,
      className: "border-white/10 bg-white/[0.04] text-white/70"
    }
  ].filter((chip) => chip.count > 0);
  const priorityByKey = useMemo(() => {
    return new Map(priorityChips.map((chip) => [chip.key, chip]));
  }, [priorityChips]);

  return (
    <AppShell
      title="SEO Page Audit"
      subtitle="Paste a URL and get a score, quick wins, and a prioritized list of issues. Fast, clear, and usable."
    >
      <div className="flex flex-col gap-4">
        <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <label className="mb-2 block text-sm font-medium text-white/80">Page URL</label>
            <input
              data-testid="audit-url-input"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/pricing"
              className="w-full rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-white placeholder:text-white/40 outline-none transition focus:border-white/20"
            />
            <div className="mt-2 text-xs text-white/50">Tip: test with https://example.com</div>
          </div>

          <button
            data-testid="audit-run-button"
            onClick={run}
            disabled={status === "loading"}
            className={[
              "rounded-2xl px-5 py-3 text-sm font-semibold transition",
              status === "loading"
                ? "cursor-not-allowed bg-white/10 text-white/60"
                : "bg-gradient-to-r from-indigo-500 to-fuchsia-500 text-white hover:opacity-95"
            ].join(" ")}
          >
            {status === "loading" ? "Running…" : "Run SEO Audit"}
          </button>
        </div>

        {status === "idle" && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-white/70">
            Enter a URL above to run an audit.
          </div>
        )}

        {status === "loading" && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-white/80">
            Analyzing… this may take up to 20 seconds.
          </div>
        )}

        {status === "error" && (
          <div className="rounded-2xl border border-rose-400/30 bg-rose-500/10 p-5 text-rose-100">
            {error}
          </div>
        )}

        {status === "success" && (
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <div className="text-sm font-semibold text-white/80">SEO Score</div>
              <div className="mt-2 text-4xl font-semibold" data-testid="audit-score">
                {typeof result?.score === "number" ? result.score : 0}
              </div>
              <button
                type="button"
                onClick={handleExport}
                disabled={exportDisabled}
                aria-disabled={exportDisabled}
                data-testid="audit-export-summary"
                className={[
                  "mt-4 w-full rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30",
                  exportDisabled
                    ? "cursor-not-allowed text-white/60"
                    : "text-white hover:bg-white/[0.10]"
                ].join(" ")}
              >
                {exportState === "success"
                  ? "Exported"
                  : exportState === "error"
                    ? "Export failed"
                    : "Export summary"}
              </button>
              <button
                onClick={() => setPricingOpen(true)}
                className="mt-4 w-full rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.10]"
              >
                Unlock Full Fix Plan
              </button>
            </div>

            <div className="md:col-span-2 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <div className="text-sm font-semibold text-white/80">Quick Wins</div>
              <div className="mt-1 text-xs text-white/50">
                High-impact fixes you can do quickly (fewer is better).
              </div>
              <div className="mt-3">
                {Array.isArray(result?.quick_wins) && result.quick_wins.length > 0 ? (
                  <ul className="list-disc space-y-2 pl-5 text-white/85">
                    {result.quick_wins.slice(0, 10).map((x, i) => (
                      <li key={i}>{x}</li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-white/60">No quick wins found — that’s a good sign.</div>
                )}
              </div>
            </div>

            {hasBrief ? (
              <div className="md:col-span-3">
                <ContentBrief content={briefText} />
              </div>
            ) : null}

            <div className="md:col-span-3 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <div className="text-sm font-semibold text-white/80">Issues</div>
              {issues.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setIssueFilter("all")}
                    data-testid="issue-filter-all"
                    className={`rounded-full border px-2.5 py-1 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 ${
                      issueFilter === "all"
                        ? "border-white/40 bg-white/20 text-white"
                        : "border-white/10 bg-white/[0.04] text-white/70"
                    }`}
                  >
                    All · {issues.length}
                  </button>
                  {priorityChips.map((chip) => (
                    <button
                      key={chip.key}
                      type="button"
                      onClick={() => setIssueFilter(chip.key)}
                      data-testid={`issue-filter-${chip.key}`}
                      className={`rounded-full border px-2.5 py-1 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 ${
                        issueFilter === chip.key
                          ? `${chip.className} ring-2 ring-white/20 border-white/40`
                          : chip.className
                      }`}
                    >
                      {chip.label} · {chip.count}
                    </button>
                  ))}
                </div>
              ) : null}
              {issues.length > 0 ? (
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                  <div className="text-xs text-white/50">
                    {filteredIssues.length > 0
                      ? `Showing ${Math.min(10, filteredIssues.length)} of ${filteredIssues.length} (total ${issues.length})`
                      : `No matches (total ${issues.length})`}
                  </div>
                  {issueFilter !== "all" ? (
                    <button
                      type="button"
                      onClick={() => setIssueFilter("all")}
                      className="text-xs font-semibold text-white/50 transition hover:text-white/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                    >
                      Clear filter
                    </button>
                  ) : null}
                </div>
              ) : null}
              {issues.length > 0 ? (
                filteredIssues.length > 0 ? (
                <div className="mt-4 space-y-3">
                  {filteredIssues.slice(0, 10).map((issue, index) => {
                    const issueKey = issue?.issue_id ?? issue?.id ?? `${issue?.priority || "p"}:${(issue?.title || issue?.message || `Issue ${index + 1}`).slice(0, 80)}`;
                    const isOpen = openIssueKey === issueKey;
                    const priorityMeta = priorityByKey.get(issue?.priority);
                    const priorityLabel = priorityMeta?.label || String(issue?.priority || "").replace(/_/g, " ");
                    const priorityClass = priorityMeta?.className || "border-white/10 bg-white/[0.04] text-white/70";
                    const titleText = String(issue?.title || issue?.message || "").toLowerCase();
                    const issueId = String(issue?.issue_id || "").toLowerCase();
                    const isMissingMetaDescription =
                      issueId === "missing_meta_description" || titleText.includes("meta description");
                    const isMissingH1 = issueId === "missing_h1" || titleText.includes("h1");
                    const whatThisMeans = isMissingMetaDescription
                      ? "Your page doesn’t provide a description for Google search results, so Google will guess. This can reduce clicks."
                      : isMissingH1
                        ? "Your page doesn’t have a clear main headline (H1), which makes it harder for Google and visitors to understand the topic."
                        : "";
                    let evidenceText = "";
                    const evidenceValue = issue?.evidence;
                    if (issue?.evidence) {
                      try {
                        evidenceText =
                          typeof issue.evidence === "string"
                            ? issue.evidence
                            : JSON.stringify(issue.evidence, null, 2);
                      } catch {
                        evidenceText = String(issue.evidence);
                      }
                    }
                    const evidenceKeys =
                      evidenceValue && typeof evidenceValue === "object" && !Array.isArray(evidenceValue)
                        ? Object.keys(evidenceValue)
                        : [];
                    const normalizedEvidenceKeys = evidenceKeys.map((key) => key.toLowerCase());
                    const isTrivialEvidence =
                      normalizedEvidenceKeys.length > 0 &&
                      normalizedEvidenceKeys.length <= 2 &&
                      normalizedEvidenceKeys.every((key) =>
                        ["status", "final_url", "finalurl", "url"].includes(key)
                      );
                    const evidenceSummary = evidenceText
                      ? isTrivialEvidence
                        ? "We analyzed the page structure and detected this issue."
                        : isMissingMetaDescription
                          ? "We did not find a <meta name=\"description\"> tag in the page HTML."
                          : isMissingH1
                            ? "We did not find an <h1> tag in the page HTML."
                            : "We checked the page and found the following technical details:"
                      : "";
                    const isEvidenceOpen = Boolean(openEvidenceKeys[issueKey]);
                    const howToFixList = getHowToFixList(issue?.how_to_fix);

                    return (
                      <div key={issueKey} className="rounded-xl border border-white/10 bg-white/[0.02]">
                        <button
                          type="button"
                          onClick={() => setOpenIssueKey((prev) => (prev === issueKey ? null : issueKey))}
                          aria-expanded={isOpen}
                          aria-controls={`issue-panel-${issueKey}`}
                          data-testid="issue-toggle"
                          className="flex w-full items-center justify-between gap-3 rounded-xl px-4 py-3 text-left transition hover:bg-white/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="text-sm font-semibold text-white/90">
                              {issue?.title || issue?.message || `Issue ${index + 1}`}
                            </div>
                            {issue?.priority ? (
                              <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${priorityClass}`}>
                                {priorityLabel || "Priority"}
                              </span>
                            ) : null}
                            {issue?.severity ? (
                              <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs font-semibold text-white/70">
                                {String(issue.severity).toUpperCase()}
                              </span>
                            ) : null}
                          </div>
                          <span className="text-sm text-white/60">{isOpen ? "▾" : "▸"}</span>
                        </button>
                        <div
                          id={`issue-panel-${issueKey}`}
                          className={`overflow-hidden px-4 transition-all duration-200 ${
                            isOpen ? "max-h-[1200px] pb-4 opacity-100" : "max-h-0 pb-0 opacity-0"
                          }`}
                        >
                          <div className="space-y-3 text-sm text-white/70">
                            {whatThisMeans ? (
                              <div>
                                <div className="text-xs font-semibold uppercase tracking-wide text-white/50">What this means</div>
                                <div className="mt-1 text-sm text-white/70">{whatThisMeans}</div>
                              </div>
                            ) : null}
                            {issue?.description ? (
                              <div>
                                <div className="text-xs font-semibold uppercase tracking-wide text-white/50">Description</div>
                                <div className="mt-1">{issue.description}</div>
                              </div>
                            ) : null}
                            {issue?.how_to_fix ? (
                              <div>
                                <div className="text-xs font-semibold uppercase tracking-wide text-white/50">How to fix</div>
                                {howToFixList ? (
                                  howToFixList.type === "ol" ? (
                                    <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm text-white/70">
                                      {howToFixList.items.map((item, itemIndex) => (
                                        <li key={`${issueKey}-fix-${itemIndex}`}>{item}</li>
                                      ))}
                                    </ol>
                                  ) : (
                                    <ul className="mt-2 list-disc space-y-2 pl-5 text-sm text-white/70">
                                      {howToFixList.items.map((item, itemIndex) => (
                                        <li key={`${issueKey}-fix-${itemIndex}`}>{item}</li>
                                      ))}
                                    </ul>
                                  )
                                ) : (
                                  <div className="mt-1 whitespace-pre-wrap">{issue.how_to_fix}</div>
                                )}
                              </div>
                            ) : null}
                            {evidenceText ? (
                              <div>
                                <div className="text-xs font-semibold uppercase tracking-wide text-white/50">Evidence</div>
                                <div className="mt-1 text-sm text-white/70">{evidenceSummary}</div>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setOpenEvidenceKeys((prev) => ({
                                      ...prev,
                                      [issueKey]: !prev[issueKey]
                                    }))
                                  }
                                  className="mt-2 text-xs font-semibold text-white/50 transition hover:text-white/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                                >
                                  {isEvidenceOpen ? "Hide technical details" : "Show technical details"}
                                </button>
                                {isEvidenceOpen ? (
                                  <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap rounded-lg border border-white/10 bg-black/20 p-3 text-xs text-white/70">
                                    {evidenceText}
                                  </pre>
                                ) : null}
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                ) : (
                  <div className="mt-3 text-white/60">No issues in this priority.</div>
                )
              ) : (
                <div className="mt-3 text-white/60">No issues returned.</div>
              )}
            </div>
          </div>
        )}
      </div>
          <PricingModal
        open={pricingOpen}
        onClose={() => setPricingOpen(false)}
        onSelectPlan={() => {
          setPricingOpen(false);
          navigate("/pricing");
        }}
      />
    </AppShell>
  );
}

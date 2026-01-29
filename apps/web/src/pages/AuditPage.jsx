import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import PricingModal from "../components/PricingModal.jsx";
import AppShell from "../components/AppShell.jsx";
import ContentBrief from "../components/ContentBrief.jsx";

export default function AuditPage() {
  const navigate = useNavigate();
  const [pricingOpen, setPricingOpen] = useState(false);

  const [url, setUrl] = useState("");
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [issueFilter, setIssueFilter] = useState("all");

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

  const briefText = typeof result?.content_brief === "string" ? result.content_brief : "";
  const hasBrief = Boolean(briefText && briefText.trim());
  const issues = Array.isArray(result?.issues) ? result.issues : [];
  const filteredIssues =
    issueFilter === "all"
      ? issues
      : issues.filter((issue) => issue?.priority === issueFilter);
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
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/pricing"
              className="w-full rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-white placeholder:text-white/40 outline-none transition focus:border-white/20"
            />
            <div className="mt-2 text-xs text-white/50">Tip: test with https://example.com</div>
          </div>

          <button
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
              <div className="mt-2 text-4xl font-semibold">
                {typeof result?.score === "number" ? result.score : 0}
              </div>
              <button
                type="button"
                disabled
                aria-disabled="true"
                className="mt-4 w-full rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm font-semibold text-white/60 transition"
              >
                Export summary
              </button>
              <div className="mt-2 text-xs text-white/50">Export coming soon.</div>
              <button
                onClick={() => setPricingOpen(true)}
                className="mt-4 w-full rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.10]"
              >
                Unlock Full Fix Plan
              </button>
            </div>

            <div className="md:col-span-2 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <div className="text-sm font-semibold text-white/80">Quick Wins</div>
              <div className="mt-3">
                {Array.isArray(result?.quick_wins) && result.quick_wins.length > 0 ? (
                  <ul className="list-disc space-y-2 pl-5 text-white/85">
                    {result.quick_wins.slice(0, 10).map((x, i) => (
                      <li key={i}>{x}</li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-white/60">No major quick wins returned.</div>
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
                filteredIssues.length > 0 ? (
                <div className="mt-4 space-y-3">
                  {filteredIssues.slice(0, 10).map((issue, index) => (
                    <div
                      key={issue?.issue_id ?? issue?.id ?? index}
                      className="rounded-xl border border-white/10 bg-white/[0.02] p-4"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="text-sm font-semibold text-white/90">
                          {issue?.title || issue?.message || `Issue ${index + 1}`}
                        </div>
                        {issue?.impact ? (
                          <span className="rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-1 text-xs font-semibold text-white/70">
                            {String(issue.impact).toUpperCase()}
                          </span>
                        ) : null}
                        {issue?.type ? (
                          <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-white/50">
                            {issue.type}
                          </span>
                        ) : null}
                      </div>
                      {issue?.description ? (
                        <div className="mt-2 text-sm text-white/70">{issue.description}</div>
                      ) : null}
                      {issue?.how_to_fix ? (
                        <div className="mt-2 text-xs text-white/60">
                          <span className="font-semibold text-white/70">Fix:</span> {issue.how_to_fix}
                        </div>
                      ) : null}
                    </div>
                  ))}
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

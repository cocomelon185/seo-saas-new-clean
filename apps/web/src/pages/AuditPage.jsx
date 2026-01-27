import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import PricingModal from "../components/PricingModal.jsx";
import ShareAuditButton from "../components/ShareAuditButton.jsx";
import AppShell from "../components/AppShell.jsx";
import IssuesPanel from "../components/IssuesPanel.jsx";
import { exportAuditSummary } from "../utils/exportAuditSummary.js";
import SavedAuditsPanel from "../components/SavedAuditsPanel.jsx";
import AuditImpactBanner from "../components/AuditImpactBanner.jsx";
import AuditHistoryPanel from "../components/AuditHistoryPanel.jsx";
import { pushAuditHistory } from "../lib/auditHistory.js";

export default function AuditPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [pricingOpen, setPricingOpen] = useState(false);

  const [url, setUrl] = useState("");
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [debug, setDebug] = useState("");
  const autoRunRef = useRef(false);

  useEffect(() => {
    try {
      const params = new URLSearchParams(location.search || "");
      const u = (params.get("url") || "").trim();
      if (u) setUrl(u);
    } catch {}
  }, [location.search]);

  useEffect(() => {
    if (autoRunRef.current) return;
    if (status !== "idle") return;
    try {
      const u = new URL(url.trim());
      if (!(u.protocol === "http:" || u.protocol === "https:")) return;
    } catch {
      return;
    }
    if (!url.trim()) return;
    autoRunRef.current = true;
    run();
  }, [url, status]);
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
      try { setDebug(JSON.stringify(data, null, 2)); } catch {}
      setResult(data);
      if (data?.warning) {
        setStatus("error");
        setError(String(data.warning));
        return;
      }
try {
        pushAuditHistory({
          url: data?.url || url,
          score: data?.score,
          issues_found: Array.isArray(data?.issues) ? data.issues.length : (data?.issues_found ?? data?.issuesFound),
          created_at: new Date().toISOString()
        });
      } catch {}

      setStatus("success");
    } catch (e) {
      setStatus("error");
      setError(String(e?.message || "Request failed."));
    }
  }

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
        {result?.ok === false && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
            {result?.warning || "Audit failed. See debug for details."}
          </div>
        )}

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <div className="text-sm font-semibold text-white/80">SEO Score</div>
              <div className="mt-2 text-4xl font-semibold">
                {typeof result?.score === "number" ? result.score : 0}
              </div>
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

            <div className="md:col-span-3 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <div className="text-sm font-semibold text-white/80">Content Brief</div>
              <div className="mt-3 whitespace-pre-wrap text-white/85">
                {result?.content_brief || "No brief returned."}
              </div>
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
          <AuditImpactBanner score={result?.score} issues={result?.issues} />
            <IssuesPanel issues={result?.issues} />
      {debug && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div className="text-sm font-semibold text-white/80">Raw response (debug)</div>
          <pre className="mt-3 overflow-auto text-xs text-white/80">{debug}</pre>
        </div>
      )}
    </AppShell>
  );
}
